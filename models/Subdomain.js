import mongoose from "mongoose";

const SubdomainSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  template: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Template",
    required: true,
  },
  subdomain: { type: String, unique: true, required: true },
  createdAt: { type: Date, default: Date.now },
});

const Subdomain = mongoose.model("Subdomain", SubdomainSchema);
export default Subdomain;
