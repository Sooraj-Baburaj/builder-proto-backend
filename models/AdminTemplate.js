import mongoose from "mongoose";

const AdminTemplateSchema = new mongoose.Schema({
  name: String,
  amplifyAppId: { type: String, unique: true },
  description: String,
  structure: { type: mongoose.Schema.Types.Mixed, required: true },
  createdAt: { type: Date, default: Date.now },
});

const AdminTemplate = mongoose.model("AdminTemplate", AdminTemplateSchema);
export default AdminTemplate;
