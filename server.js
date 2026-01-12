const express = require("express")
const mongoose = require("mongoose")
const dotenv = require("dotenv")

const routeHandler=require('./routes/pdf.js')

dotenv.config()

const app = express()

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.set("view engine", "ejs")
app.set("views", "views")
app.use(routeHandler)

/* =======================
   MongoDB Connection
======================= */
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("Database connected"))
  .catch(err => console.log(err))

/* =======================
   Static Folder
======================= */
app.use("/uploads", express.static("uploads"))



/* =======================
   Multer Config
======================= */

/* =======================
   Routes
======================= */
app.get("/", (req, res) => {
  res.send("API running")
})




/* =======================
   Error Handler
======================= */
app.use((err, req, res, next) => {
  return res.status(400).json({ error: err.message })
})

/* =======================
   Server
======================= */
app.listen(3000, () => {
  console.log("Server running on port 3000")
})

module.exports = app
