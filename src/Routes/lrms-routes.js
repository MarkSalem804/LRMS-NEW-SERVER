const express = require("express");
const lrmsRouter = express.Router();
const multer = require("multer");
const upload = multer({ dest: "uploads/" }); // Temporary destination for uploaded files
const path = require("path");
const fs = require("fs");

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
      // First, parse the Excel file to get the materials data
      const parseResult = await lrmsService.parseExcelFile(filePath);

      if (!parseResult.success) {
        return res.status(500).json({
          success: false,
          message: parseResult.message,
          error: parseResult.error,
        });
      }

      // Check for duplicates in the parsed data
      const duplicateCheckResult = await lrmsService.checkDuplicateMaterials(
        parseResult.data
      );

      if (!duplicateCheckResult.success) {
        return res.status(500).json({
          success: false,
          message: "Error checking for duplicates",
          error: duplicateCheckResult.error,
        });
      }

      // If there are no non-duplicate materials to upload, return early
      if (duplicateCheckResult.nonDuplicates.length === 0) {
        return res.status(200).json({
          success: true,
          message: "No new materials to upload. All materials were duplicates.",
          duplicates: duplicateCheckResult.duplicates,
          totalDuplicates: duplicateCheckResult.totalDuplicates,
        });
      }

      // Insert only the non-duplicate materials
      const result = await lrmsService.insertMaterials(
        duplicateCheckResult.nonDuplicates
      );

      if (result.success) {
        res.status(200).json({
          success: true,
          message: result.message,
          count: result.count,
          data: result.data,
          duplicates: duplicateCheckResult.duplicates,
          totalDuplicates: duplicateCheckResult.totalDuplicates,
          totalUploaded: duplicateCheckResult.totalNonDuplicates,
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

// Add new route for viewing material files
lrmsRouter.get("/view-material/:materialId", async (req, res) => {
  const materialId = parseInt(req.params.materialId, 10);
  const title = req.query.title || "Material";

  if (isNaN(materialId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid material ID provided.",
    });
  }

  try {
    // Get material details including file path
    const material = await lrmsService.getMaterialWithFile(materialId);

    if (!material.success) {
      return res.status(404).json({
        success: false,
        message: "Material not found or has no file attached.",
      });
    }

    const filePath = material.material.materialPath;
    const fileName = material.material.fileName;

    // Check if file exists
    if (!filePath || !fileName) {
      return res.status(404).json({
        success: false,
        message: "No file found for this material.",
      });
    }

    // Get the file extension
    const ext = path.extname(fileName).toLowerCase();

    // Set appropriate content type based on file extension
    let contentType = "application/octet-stream";
    switch (ext) {
      case ".pdf":
        contentType = "application/pdf";
        break;
      case ".doc":
        contentType = "application/msword";
        break;
      case ".docx":
        contentType =
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        break;
      case ".xls":
        contentType = "application/vnd.ms-excel";
        break;
      case ".xlsx":
        contentType =
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        break;
      case ".ppt":
        contentType = "application/vnd.ms-powerpoint";
        break;
      case ".pptx":
        contentType =
          "application/vnd.openxmlformats-officedocument.presentationml.presentation";
        break;
      case ".jpg":
      case ".jpeg":
        contentType = "image/jpeg";
        break;
      case ".png":
        contentType = "image/png";
        break;
      case ".gif":
        contentType = "image/gif";
        break;
      case ".txt":
        contentType = "text/plain";
        break;
    }

    // Convert relative path to absolute path
    const absolutePath = path.resolve(filePath);

    // Check if file exists before sending
    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({
        success: false,
        message: "File not found on server.",
      });
    }

    // Set headers for viewing
    res.set({
      "Content-Type": contentType,
      "Content-Disposition": `inline; filename="${title}${ext}"`,
      "X-File-Name": `${title}${ext}`,
    });

    // Send the file
    res.sendFile(absolutePath, (err) => {
      if (err) {
        console.error("Error sending file:", err);
        // If the response has already been sent, we can't send another response
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            message: "Error sending file.",
          });
        }
      }
    });
  } catch (error) {
    console.error("Error in view-material route:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while retrieving the material file.",
    });
  }
});

// Add new route for getting material details
lrmsRouter.get("/get-material/:materialId", async (req, res) => {
  const materialId = parseInt(req.params.materialId, 10);

  if (isNaN(materialId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid material ID provided.",
    });
  }

  try {
    const material = await lrmsService.getMaterialWithFile(materialId);
    res.status(200).json(material);
  } catch (error) {
    console.error("Error in get-material route:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while retrieving the material details.",
    });
  }
});

module.exports = lrmsRouter;
