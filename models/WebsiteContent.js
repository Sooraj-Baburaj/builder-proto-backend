import mongoose from "mongoose";

const WebsiteContentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  subdomain: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Subdomain",
    required: true,
  },
  template: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Template",
    required: true,
  },
  content: { type: mongoose.Schema.Types.Mixed, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const WebsiteContent = mongoose.model("WebsiteContent", WebsiteContentSchema);

export default WebsiteContent;
