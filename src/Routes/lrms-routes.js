const express = require("express");
const lrmsRouter = express.Router();
const multer = require("multer");
const upload = multer({ dest: "uploads/" }); // Temporary destination for uploaded files

// Multer configuration for material file uploads
const materialStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/materials/"); // Destination folder
  },
  filename: function (req, file, cb) {
    // Use the original file name
    cb(null, file.originalname);
  },
});
const materialUpload = multer({ storage: materialStorage });

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
          data: result.data,
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

lrmsRouter.post(
  "/upload-material-file/:materialId",
  materialUpload.single("materialFile"), // 'materialFile' is the field name for the file input
  async (req, res) => {
    const materialId = parseInt(req.params.materialId, 10);

    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "No file uploaded." });
    }

    if (isNaN(materialId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid material ID provided." });
    }

    const filePath = req.file.path;
    const fileName = req.file.originalname; // Use originalname for the actual file name

    try {
      // Call a new service function to update the material with file info
      const result = await lrmsService.updateMaterialWithFile(
        materialId,
        filePath,
        fileName
      );

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(500).json(result);
      }
    } catch (error) {
      console.error("Error in upload-material-file route:", error);
      res.status(500).json({
        success: false,
        message: "An error occurred during file upload and processing.",
      });
    }
  }
);

lrmsRouter.get("/getAllMaterials", async (req, res) => {
  try {
    const fetchedData = await lrmsService.fetchAllMaterials();
    return res.status(200).json({
      success: true,
      message: "Materials fetched successfully",
      data: fetchedData,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = lrmsRouter;
