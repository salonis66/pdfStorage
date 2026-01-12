const mongoose=require('mongoose')

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

module.exports= mongoose.model("File", fileSchema)