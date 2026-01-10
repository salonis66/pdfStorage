const express=require('express')
const mongoose=require('mongoose')
const dotenv=require('dotenv')
dotenv.config();


const app=express()
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

mongoose.connect(process.env.MONGO_URL)
.then(() => console.log("database connected"))
.catch(err => console.log(err));




const folderSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    files: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "File"
      }
    ]
  },
  { timestamps: true }
)

const Folder = mongoose.model("Folder", folderSchema)


const fileSchema = new mongoose.Schema(
  {
    originalName: String,
    fileName: String,
    filePath: String,
    fileType: {
      type: String,
      enum: ["pdf"],
      default: "pdf"
    },
    folder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Folder",
      required: true
    }
  },
  { timestamps: true }
)

const File = mongoose.model("File", fileSchema)


const multer = require("multer")
const path = require("path")

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/")
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname))
  }
})

const fileFilter = (req, file, cb) => {
  if (file.mimetype === "application/pdf") {
    cb(null, true)
  } else {
    cb(new Error("Only PDF allowed"), false)
  }
}

const upload = multer({ storage, fileFilter })




app.post(
  "/upload_pdf",
  upload.single("pdf"),
  async (req, res) => {
    try {
      const { folderName } = req.body

      if (!folderName) {
        return res.status(400).json({ message: "folderName is required" })
      }

      if (!req.file) {
        return res.status(400).json({ message: "PDF file is required" })
      }

     
      let folder = await Folder.findOne({
        name: folderName.trim()
      })

    
      if (!folder) {
        folder = await Folder.create({
          name: folderName.trim()
        })
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
  }
)


module.export=app;