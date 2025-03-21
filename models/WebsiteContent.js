import mongoose from "mongoose";

const WebsiteContentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  subdomain: { type: String, required: true, unique: true }, // Store subdomain directly
  template: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "AdminTemplate",
    required: true,
  },
  content: { type: mongoose.Schema.Types.Mixed, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const WebsiteContent = mongoose.model("WebsiteContent", WebsiteContentSchema);

export default WebsiteContent;
