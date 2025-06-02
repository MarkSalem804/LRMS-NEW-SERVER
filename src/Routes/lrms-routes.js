const express = require("express");
const lrmsRouter = express.Router();
const multer = require("multer");
const upload = multer({ dest: "uploads/" }); // Temporary destination for uploaded files
const lrmsService = require("../Services/lrms-service"); // Import the service function

lrmsRouter.post(
  "/upload-materials",
  upload.single("excelFile"),
  async (req, res) => {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "No file uploaded." });
    }

    const filePath = req.file.path;

    try {
      const result = await lrmsService.parseExcelFile(filePath);

      if (result.success) {
        res.status(200).json({
          success: true,
          message: result.message,
          count: result.count,
        });
      } else {
        res.status(500).json({
          success: false,
          message: result.message,
          error: result.error,
        });
      }
    } catch (error) {
      console.error("Error in upload-materials route:", error);
      res.status(500).json({
        success: false,
        message: "An error occurred during file processing.",
      });
    }
  }
);

lrmsRouter.post("/create-grade-levels", async (req, res) => {
  try {
    const data = req.body;
    const result = await lrmsService.createGradeLevels(data);
    res.status(200).json(result);
  } catch (error) {
    console.error("Error in create-grade-levels route:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred.",
    });
  }
});

lrmsRouter.post("/create-learning-areas", async (req, res) => {
  try {
    const data = req.body;
    const result = await lrmsService.createLearningAreas(data);
    res.status(200).json(result);
  } catch (error) {
    console.error("Error in create-learning-areas route:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred.",
    });
  }
});

lrmsRouter.post("/create-components", async (req, res) => {
  try {
    const data = req.body;
    const result = await lrmsService.createComponents(data);
    res.status(200).json(result);
  } catch (error) {
    console.error("Error in create-components route:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred.",
    });
  }
});

lrmsRouter.post("/create-strands", async (req, res) => {
  try {
    const data = req.body;
    const result = await lrmsService.createStrands(data);
    res.status(200).json(result);
  } catch (error) {
    console.error("Error in create-strands route:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred.",
    });
  }
});

lrmsRouter.post("/create-tracks", async (req, res) => {
  try {
    const data = req.body;
    const result = await lrmsService.createTracks(data);
    res.status(200).json(result);
  } catch (error) {
    console.error("Error in create-tracks route:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred.",
    });
  }
});

lrmsRouter.post("/create-types", async (req, res) => {
  try {
    const data = req.body;
    const result = await lrmsService.createTypes(data);
    res.status(200).json(result);
  } catch (error) {
    console.error("Error in create-types route:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred.",
    });
  }
});

lrmsRouter.post("/create-subject-types", async (req, res) => {
  try {
    const data = req.body;
    const result = await lrmsService.createSubjectType(data);
    res.status(200).json(result);
  } catch (error) {
    console.error("Error in create-subject-types route:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred.",
    });
  }
});

module.exports = lrmsRouter;
