import Template from "../models/AdminTemplate.js";

export const createTemplate = async (req, res) => {
  try {
    const { name, amplifyAppId, description, structure } = req.body;

    if (!name || !amplifyAppId || !structure) {
      return res.status(400).json({
        message: "Name, amplifyAppId and structure are required",
        error: true,
      });
    }

    const template = new Template({
      name,
      amplifyAppId,
      description,
      structure,
    });

    await template.save();
    res.status(201).json({
      message: "Template created successfully",
      template,
      error: false,
    });
  } catch (error) {
    if (error?.code === 11000) {
      res
        .status(400)
        .json({ message: "AmplifyAppId already exists!", error: true });
    } else {
      res.status(500).json({ message: "Internal server error", error: true });
    }
  }
};

export const updateTemplate = async (req, res) => {
  try {
    const { templateId } = req.params;
    const { name, description, structure } = req.body;

    const template = await Template.findById(templateId);
    if (!template) {
      return res.status(404).json({
        message: "Template not found",
        error: true,
      });
    }

    template.name = name || template.name;
    template.description = description || template.description;
    template.structure = structure || template.structure;

    await template.save();
    res.status(200).json({
      message: "Template updated successfully",
      template,
      error: false,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error updating template",
      error: true,
    });
  }
};

export const deleteTemplate = async (req, res) => {
  try {
    const { templateId } = req.params;

    const template = await Template.findById(templateId);
    if (!template) {
      return res.status(404).json({
        message: "Template not found",
        error: true,
      });
    }

    await Template.findByIdAndDelete(templateId);
    res.status(200).json({
      message: "Template deleted successfully",
      error: false,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting template",
      error: true,
    });
  }
};

export const getAllTemplates = async (req, res) => {
  try {
    const templates = await Template.find();
    res.status(200).json({
      templates,
      error: false,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching templates",
      error: true,
    });
  }
};
