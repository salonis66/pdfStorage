const express=require('express')

const router=express.Router()

const multer = require("multer")
const path = require("path")
const fs = require("fs")
const Folder=require('../models/folder.js')
const File=require('../models/file.js')

router.get("/home",async(req,res)=>{
    res.send("home page")
})

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folderName = req.body.folderName?.trim()

    if (!folderName) {
      return cb(new Error("folderName is required"))
    }

    const uploadPath = path.join("uploads", folderName)

    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true })
    }

    cb(null, uploadPath)
  },

  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname))
  }
})

const fileFilter = (req, file, cb) => {
  if (file.mimetype === "application/pdf") {
    cb(null, true)
  } else {
    cb(new Error("Only PDF files are allowed"), false)
  }
}

const upload = multer({
  storage,
  fileFilter 
})


router.post("/upload_pdf", upload.single("pdf"), async (req, res) => {
  try {
    const { folderName } = req.body

    if (!req.file) {
      return res.status(400).json({ message: "PDF file is required" })
    }

    let folder = await Folder.findOne({ name: folderName.trim() })

    if (!folder) {
      folder = await Folder.create({ name: folderName.trim() })
    }

    const file = await File.create({
      originalName: req.file.originalname,
      fileName: req.file.filename,
      filePath: req.file.path,
      folder: folder._id
    })

    await Folder.findByIdAndUpdate(folder._id, {
      $push: { files: file._id }
    })

    res.status(201).json({
      message: "PDF uploaded successfully",
      folder: folder.name,
      file
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get("/view-pdf/:id", async (req, res) => {
  try {
    const { id } = req.params

    // 1️⃣ DB se file nikalo
    const file = await File.findById(id).populate("folder")

    if (!file) {
      return res.send("File not found in database")
    }

    // 2️⃣ Actual file path (DB is source of truth)
    const filePath = path.join(
      process.cwd(),   // Backend/pdfStrorage
      file.filePath    // e.g. uploads/secondFloder/12345.pdf
    )

    console.log("Looking for:", filePath)

    // 3️⃣ File system check
    if (!fs.existsSync(filePath)) {
      return res.send("PDF not found on server")
    }

    // 4️⃣ EJS render
    res.render("pdfViewer", {
      folderName: file.folder.name,
      fileName: file.fileName
    })

  } catch (err) {
    console.error(err)
    res.status(500).send("Something went wrong")
  }
})


router.get("/admin/dashboard", async (req, res) => {
  const folders = await Folder.find().populate("files")
  res.render("dashboard", { folders })
})

router.get("/admin/folder/:id", async (req, res) => {
  const folder = await Folder.findById(req.params.id).populate("files")
  res.render("folder-files", { folder })

})

 
router.get("/admin/delete-folder/:id", async (req, res) => {
  const folder = await Folder.findById(req.params.id).populate("files")

  for (let file of folder.files) {
    fs.unlinkSync(path.join(process.cwd(), file.filePath))
    await File.findByIdAndDelete(file._id)
  }

  await Folder.findByIdAndDelete(folder._id)
  res.redirect("/admin/dashboard")
})

/* =======================
   Delete PDF
======================= */
router.get("/admin/delete-file/:id", async (req, res) => {
  const file = await File.findById(req.params.id)
  if (!file) return res.redirect("/admin/dashboard")

  // delete from disk
  fs.unlinkSync(path.join(process.cwd(), file.filePath))

  // delete from db
  await File.findByIdAndDelete(file._id)
  await Folder.findByIdAndUpdate(file.folder, {
    $pull: { files: file._id }
  })

  res.redirect("/admin/dashboard")
})


module.exports=router;