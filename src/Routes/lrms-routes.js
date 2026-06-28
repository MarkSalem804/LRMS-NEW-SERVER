const express = require("express");
const lrmsRouter = express.Router();
const path = require("path");
const fs = require("fs");
const {
  materialUpload,
  excelUpload,
} = require("../Middlewares/fileUpload");

const lrmsService = require("../Services/lrms-service");
const activityLogService = require("../ActivityLogs/activity-log-service");
const { authenticateToken } = require("../Middlewares/authMiddleware");

lrmsRouter.post(
  "/upload-materials",
  authenticateToken,
  excelUpload.single("excelFile"),
  async (req, res) => {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "No file uploaded." });
    }

    try {
      // Parse the Excel file directly from memory buffer — no disk I/O
      const parseResult = await lrmsService.parseExcelFile(req.file.buffer);

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
        // Log material metadata upload
        const userId = req.body.userId; // Pass userId from frontend
        if (userId) {
          await activityLogService.logMaterialUploaded(
            userId,
            `${duplicateCheckResult.totalNonDuplicates} materials`
          );
        }

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

// Subject Types CRUD Routes
lrmsRouter.get("/subject-types", async (req, res) => {
  try {
    const result = await lrmsService.getAllSubjectTypes();
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

lrmsRouter.post("/subject-types", authenticateToken, async (req, res) => {
  try {
    const { name } = req.body;
    const result = await lrmsService.addSubjectType({ name });
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

lrmsRouter.put("/subject-types/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const result = await lrmsService.updateSubjectType(parseInt(id), { name });
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

lrmsRouter.delete("/subject-types/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await lrmsService.deleteSubjectType(parseInt(id));
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// Legacy route for backward compatibility
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
  authenticateToken,
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
        // Log material file upload
        const userId = req.body.userId; // Pass userId from frontend
        if (userId) {
          await activityLogService.logMaterialFileUploaded(
            userId,
            result.material?.title || fileName
          );
        }

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

// Paginated + filtered materials endpoint used by MaterialsManagement page
lrmsRouter.get("/getMaterials", authenticateToken, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      type = "",
      grade = "",
      area = "",
      component = "",
      track = "",
      strand = "",
      subjectType = "",
      savedOnly = "false",
    } = req.query;

    const userId = req.user?.userId || null;

    const result = await lrmsService.fetchMaterialsPaginated({
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      search,
      type,
      grade,
      area,
      component,
      track,
      strand,
      subjectType,
      savedOnly: savedOnly === "true",
      userId,
    });

    return res.status(200).json({
      success: true,
      message: "Materials fetched successfully",
      ...result,
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

    // Log material view
    const userId = req.query.userId; // Pass userId from frontend as query param
    if (userId) {
      await activityLogService.logMaterialViewed(
        parseInt(userId),
        material.material.title || title
      );
    }

    // Set headers for viewing (inline for iframe/embed)
    // Allow embedding and CORS for frontend access (different ports = different origins)
    const origin = req.headers.origin;
    const allowedOrigins = [
      "http://localhost:5174",
      "http://localhost:3000",
      "http://localhost:5173",
      "http://localhost:5175",
      "https://ilearn-beta.depedimuscity.com",
      "https://sdoic-ilearn.depedimuscity.com",
      "https://sdoic-ilearn.depedimuscity.com:5005",
    ];

    // Add CORS headers - embed/iframe needs CORS even for same-host different-port
    if (!origin || allowedOrigins.includes(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin || "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    }

    res.set({
      "Content-Type": contentType,
      "Content-Disposition": `inline; filename="${title}${ext}"`,
      "X-File-Name": `${title}${ext}`,
      "X-Content-Type-Options": "nosniff",
      // Remove X-Frame-Options since frontend (5174) and backend (5001) are different origins
      // Use Content-Security-Policy instead which supports cross-origin embedding
      "Content-Security-Policy": `frame-ancestors 'self' ${allowedOrigins.join(
        " "
      )}`,
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

// Add route to increment material views
lrmsRouter.post(
  "/increment-views/:materialId",
  authenticateToken,
  async (req, res) => {
    const materialId = parseInt(req.params.materialId, 10);
    const userId = req.user.userId; // from authenticateToken

    if (isNaN(materialId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid material ID provided.",
      });
    }

    try {
      const result = await lrmsService.incrementMaterialViews(materialId);
      if (result.success) {
        // Also get material details to log the title
        const materialDetails = await lrmsService.getMaterialWithFile(materialId);
        if (materialDetails.success) {
          await activityLogService.logMaterialViewed(
            userId,
            materialDetails.material.title
          );
        }

        res.status(200).json(result);
      } else {
        res.status(500).json(result);
      }
    } catch (error) {
      console.error("Error in increment-views route:", error);
      res.status(500).json({
        success: false,
        message: "An error occurred while incrementing material views.",
      });
    }
  }
);

// Add route to download material files and track downloads
lrmsRouter.get("/download-material/:materialId", async (req, res) => {
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

    // Increment download count
    await lrmsService.incrementMaterialDownloads(materialId);

    // Log material download
    const userId = req.query.userId; // Pass userId from frontend as query param
    if (userId) {
      await activityLogService.logMaterialViewed(
        parseInt(userId),
        `${material.material.title || title} (Downloaded)`
      );
    }

    // Set headers for downloading (attachment instead of inline)
    res.set({
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${title}${ext}"`,
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
    console.error("Error in download-material route:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while downloading the material file.",
    });
  }
});

// Add route to increment material downloads (separate endpoint for tracking)
lrmsRouter.post(
  "/increment-downloads/:materialId",
  authenticateToken,
  async (req, res) => {
    const materialId = parseInt(req.params.materialId, 10);
    const userId = req.user.userId;

    if (isNaN(materialId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid material ID provided.",
      });
    }

    try {
      const result = await lrmsService.incrementMaterialDownloads(materialId);
      if (result.success) {
        const materialDetails = await lrmsService.getMaterialWithFile(materialId);
        if (materialDetails.success) {
          await activityLogService.logMaterialDownloaded(
            userId,
            materialDetails.material.title
          );
        }

        res.status(200).json(result);
      } else {
        res.status(500).json(result);
      }
    } catch (error) {
      console.error("Error in increment-downloads route:", error);
      res.status(500).json({
        success: false,
        message: "An error occurred while incrementing material downloads.",
      });
    }
  }
);

// Add route to rate a material
lrmsRouter.post(
  "/rate-material/:materialId",
  authenticateToken,
  async (req, res) => {
    const materialId = parseInt(req.params.materialId, 10);
    const userId = req.user.userId;
    const { rating, suggestions } = req.body;

    if (isNaN(materialId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid material ID provided.",
      });
    }

    try {
      const result = await lrmsService.submitMaterialRating(
        materialId,
        userId,
        rating,
        suggestions
      );

      if (result.success) {
        // Log the rating
        const materialDetails = await lrmsService.getMaterialWithFile(materialId);
        if (materialDetails.success) {
          await activityLogService.logMaterialRated(
            userId,
            materialDetails.material.title,
            rating
          );
        }

        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error("Error in rate-material route:", error);
      res.status(500).json({
        success: false,
        message: "An error occurred while rating the material.",
      });
    }
  }
);

// Add new route for getting all filter options
lrmsRouter.get("/get-filter-options", async (req, res) => {
  try {
    const filterOptions = await lrmsService.getFilterOptions();
    return res.status(200).json({
      success: true,
      message: "Filter options fetched successfully",
      data: filterOptions,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// CRUD endpoints for data management
lrmsRouter.post("/add-learning-area", async (req, res) => {
  try {
    const { name, description } = req.body;
    const result = await lrmsService.addLearningArea({ name, description });
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

lrmsRouter.put("/update-learning-area/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const result = await lrmsService.updateLearningArea(parseInt(id), {
      name,
      description,
    });
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

lrmsRouter.delete("/delete-learning-area/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await lrmsService.deleteLearningArea(parseInt(id));
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

lrmsRouter.post("/add-component", async (req, res) => {
  try {
    const { name, description } = req.body;
    const result = await lrmsService.addComponent({ name, description });
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

lrmsRouter.put("/update-component/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const result = await lrmsService.updateComponent(parseInt(id), {
      name,
      description,
    });
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

lrmsRouter.delete("/delete-component/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await lrmsService.deleteComponent(parseInt(id));
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

lrmsRouter.post("/add-core-subject", async (req, res) => {
  try {
    const { name } = req.body;
    const result = await lrmsService.addCoreSubject({ name });
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

lrmsRouter.put("/update-core-subject/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const result = await lrmsService.updateCoreSubject(parseInt(id), { name });
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

lrmsRouter.delete("/delete-core-subject/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await lrmsService.deleteCoreSubject(parseInt(id));
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

lrmsRouter.post("/add-track", async (req, res) => {
  try {
    const { name, description } = req.body;
    const result = await lrmsService.addTrack({ name, description });
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

lrmsRouter.put("/update-track/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const result = await lrmsService.updateTrack(parseInt(id), {
      name,
      description,
    });
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

lrmsRouter.delete("/delete-track/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await lrmsService.deleteTrack(parseInt(id));
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// Strands CRUD Routes
lrmsRouter.get("/strands", authenticateToken, async (req, res) => {
  try {
    const result = await lrmsService.getAllStrands();
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

lrmsRouter.post("/strands", authenticateToken, async (req, res) => {
  try {
    const { name, trackId } = req.body;
    const result = await lrmsService.addStrand({ name, trackId });
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

lrmsRouter.put("/strands/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, trackId } = req.body;
    const result = await lrmsService.updateStrand(parseInt(id), {
      name,
      trackId,
    });
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

lrmsRouter.delete("/strands/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await lrmsService.deleteStrand(parseInt(id));
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// Legacy routes for backward compatibility
lrmsRouter.post("/add-strand", authenticateToken, async (req, res) => {
  try {
    const { name, trackId } = req.body;
    const result = await lrmsService.addStrand({ name, trackId });
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

lrmsRouter.put("/update-strand/:id",authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, trackId } = req.body;
    const result = await lrmsService.updateStrand(parseInt(id), {
      name,
      trackId,
    });
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

lrmsRouter.delete("/delete-strand/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await lrmsService.deleteStrand(parseInt(id));
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

lrmsRouter.post("/add-applied-subject", authenticateToken, async (req, res) => {
  try {
    const { name, trackId } = req.body;
    const result = await lrmsService.addAppliedSubject({ name, trackId });
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

lrmsRouter.put("/update-applied-subject/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, trackId } = req.body;
    const result = await lrmsService.updateAppliedSubject(parseInt(id), {
      name,
      trackId,
    });
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

lrmsRouter.delete("/delete-applied-subject/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await lrmsService.deleteAppliedSubject(parseInt(id));
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

lrmsRouter.post("/add-specialized-subject", authenticateToken, async (req, res) => {
  try {
    const { name, trackId, strandId } = req.body;
    const result = await lrmsService.addSpecializedSubject({
      name,
      trackId,
      strandId,
    });
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

lrmsRouter.put("/update-specialized-subject/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, trackId, strandId } = req.body;
    const result = await lrmsService.updateSpecializedSubject(parseInt(id), {
      name,
      trackId,
      strandId,
    });
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

lrmsRouter.delete("/delete-specialized-subject/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await lrmsService.deleteSpecializedSubject(parseInt(id));
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

lrmsRouter.post("/add-type", authenticateToken, async (req, res) => {
  try {
    const { name, description } = req.body;
    const result = await lrmsService.addType({ name, description });
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

lrmsRouter.put("/update-type/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const result = await lrmsService.updateType(parseInt(id), {
      name,
      description,
    });
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

lrmsRouter.delete("/delete-type/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await lrmsService.deleteType(parseInt(id));
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// Positions CRUD Routes
lrmsRouter.get("/positions", authenticateToken, async (req, res) => {
  try {
    const result = await lrmsService.getAllPositions();
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

lrmsRouter.post("/positions", authenticateToken, async (req, res) => {
  try {
    const { name, description } = req.body;
    const result = await lrmsService.addPosition({ name, description });
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

lrmsRouter.put("/positions/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const result = await lrmsService.updatePosition(parseInt(id), {
      name,
      description,
    });
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

lrmsRouter.delete("/positions/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await lrmsService.deletePosition(parseInt(id));
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// Schools CRUD Routes
lrmsRouter.get("/schools", async (req, res) => {
  try {
    const result = await lrmsService.getAllSchools();
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

lrmsRouter.post("/schools", authenticateToken, async (req, res) => {
  try {
    const { name, description } = req.body;
    const result = await lrmsService.addSchool({ name, description });
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

lrmsRouter.put("/schools/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const result = await lrmsService.updateSchool(parseInt(id), {
      name,
      description,
    });
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

lrmsRouter.delete("/schools/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await lrmsService.deleteSchool(parseInt(id));
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// Offices CRUD Routes
lrmsRouter.get("/offices", authenticateToken, async (req, res) => {
  try {
    const result = await lrmsService.getAllOffices();
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

lrmsRouter.post("/offices", authenticateToken, async (req, res) => {
  try {
    const { name, description } = req.body;
    const result = await lrmsService.addOffice({ name, description });
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

lrmsRouter.put("/offices/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const result = await lrmsService.updateOffice(parseInt(id), {
      name,
      description,
    });
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

lrmsRouter.delete("/offices/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await lrmsService.deleteOffice(parseInt(id));
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// Grade Levels CRUD Routes
lrmsRouter.get("/grade-levels", authenticateToken, async (req, res) => {
  try {
    const result = await lrmsService.getAllGradeLevels();
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

lrmsRouter.post("/grade-levels", authenticateToken, async (req, res) => {
  try {
    const { name, description } = req.body;
    const result = await lrmsService.addGradeLevel({ name, description });
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

lrmsRouter.put("/grade-levels/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const result = await lrmsService.updateGradeLevel(parseInt(id), {
      name,
      description,
    });
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

lrmsRouter.delete("/grade-levels/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await lrmsService.deleteGradeLevel(parseInt(id));
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// Learning Areas CRUD Routes
lrmsRouter.get("/learning-areas", authenticateToken, async (req, res) => {
  try {
    const result = await lrmsService.getAllLearningAreas();
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

lrmsRouter.post("/learning-areas", authenticateToken, async (req, res) => {
  try {
    const { name, description } = req.body;
    const result = await lrmsService.addLearningArea({ name, description });
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

lrmsRouter.put("/learning-areas/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const result = await lrmsService.updateLearningArea(parseInt(id), {
      name,
      description,
    });
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

lrmsRouter.delete(
  "/learning-areas/:id",
  authenticateToken,
  async (req, res) => {
    try {
      const { id } = req.params;
      const result = await lrmsService.deleteLearningArea(parseInt(id));
      return res.status(200).json(result);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// --- Library Materials Metadata Upload ---
lrmsRouter.post(
  "/upload-library-materials",
  authenticateToken,
  excelUpload.single("excelFile"),
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded." });
    }
    try {
      const parseResult = await lrmsService.parseLibraryExcelFile(req.file.buffer);
      if (!parseResult.success) {
        return res.status(500).json({ success: false, message: parseResult.message, error: parseResult.error });
      }

      const duplicateCheckResult = await lrmsService.checkDuplicateLibraryMaterials(parseResult.data);
      if (!duplicateCheckResult.success) {
        return res.status(500).json({ success: false, message: "Error checking for duplicates" });
      }

      if (duplicateCheckResult.nonDuplicates.length === 0) {
        return res.status(200).json({
          success: true,
          message: "No new materials to upload. All materials were duplicates.",
          duplicates: duplicateCheckResult.duplicates,
          totalDuplicates: duplicateCheckResult.totalDuplicates,
          totalUploaded: 0,
        });
      }

      const result = await lrmsService.insertLibraryMaterials(duplicateCheckResult.nonDuplicates);
      if (result.success) {
        return res.status(200).json({
          success: true,
          message: result.message,
          count: result.count,
          duplicates: duplicateCheckResult.duplicates,
          totalDuplicates: duplicateCheckResult.totalDuplicates,
          totalUploaded: duplicateCheckResult.totalNonDuplicates,
        });
      } else {
        return res.status(500).json({ success: false, message: result.message, error: result.error });
      }
    } catch (error) {
      console.error("Error in upload-library-materials route:", error);
      return res.status(500).json({ success: false, message: "An error occurred during file processing." });
    }
  }
);

// --- Library Genres CRUD Routes ---
lrmsRouter.get("/public/library-genres", async (req, res) => {
  try {
    const result = await lrmsService.getAllLibraryGenres();
    if (result.success) {
      return res.status(200).json(result);
    } else {
      return res.status(500).json(result);
    }
  } catch (error) {
    console.error("Error in public/library-genres route:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
});

lrmsRouter.get("/library-genres", authenticateToken, async (req, res) => {
  try {
    const result = await lrmsService.getAllLibraryGenres();
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
});

lrmsRouter.post("/library-genres", authenticateToken, async (req, res) => {
  try {
    const { name } = req.body;
    const result = await lrmsService.addLibraryGenre({ name });
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
});

lrmsRouter.put("/library-genres/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const result = await lrmsService.updateLibraryGenre(parseInt(id), { name });
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
});

lrmsRouter.delete("/library-genres/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await lrmsService.deleteLibraryGenre(parseInt(id));
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
});

// Components CRUD Routes
lrmsRouter.get("/components", authenticateToken, async (req, res) => {
  try {
    const result = await lrmsService.getAllComponents();
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

lrmsRouter.post("/components", authenticateToken, async (req, res) => {
  try {
    const { name, description } = req.body;
    const result = await lrmsService.addComponent({ name, description });
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

lrmsRouter.put("/components/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const result = await lrmsService.updateComponent(parseInt(id), {
      name,
      description,
    });
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

lrmsRouter.delete("/components/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await lrmsService.deleteComponent(parseInt(id));
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// Tracks CRUD Routes
lrmsRouter.get("/tracks", async (req, res) => {
  try {
    const result = await lrmsService.getAllTracks();
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

lrmsRouter.post("/tracks", authenticateToken, async (req, res) => {
  try {
    const { name, description } = req.body;
    const result = await lrmsService.addTrack({ name, description });
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

lrmsRouter.put("/tracks/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const result = await lrmsService.updateTrack(parseInt(id), {
      name,
      description,
    });
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

lrmsRouter.delete("/tracks/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await lrmsService.deleteTrack(parseInt(id));
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// Types (Materials Type) CRUD Routes
lrmsRouter.get("/types", async (req, res) => {
  try {
    const result = await lrmsService.getAllTypes();
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

lrmsRouter.post("/types", authenticateToken, async (req, res) => {
  try {
    const { name, description } = req.body;
    const result = await lrmsService.addType({ name, description });
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

lrmsRouter.put("/types/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const result = await lrmsService.updateType(parseInt(id), {
      name,
      description,
    });
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

lrmsRouter.delete("/types/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await lrmsService.deleteType(parseInt(id));
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// Material Rating Routes
// Submit or update a material rating
// Protected route - requires authentication
lrmsRouter.post(
  "/submit-rating/:materialId",
  authenticateToken,
  async (req, res) => {
    const materialId = parseInt(req.params.materialId, 10);
    // Get userId from authenticated user (from JWT token), not from request body
    const userId = req.user.userId; // Secured: comes from verified JWT token
    const { rating, suggestions } = req.body;

    if (isNaN(materialId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid material ID provided.",
      });
    }

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5.",
      });
    }

    try {
      const result = await lrmsService.submitMaterialRating(
        materialId,
        userId,
        rating,
        suggestions
      );
      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error("Error in submit-rating route:", error);
      res.status(500).json({
        success: false,
        message: "An error occurred while submitting the rating.",
      });
    }
  }
);

// Get all ratings for a material
lrmsRouter.get("/get-ratings/:materialId", async (req, res) => {
  const materialId = parseInt(req.params.materialId, 10);

  if (isNaN(materialId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid material ID provided.",
    });
  }

  try {
    const result = await lrmsService.getMaterialRatings(materialId);
    res.status(200).json(result);
  } catch (error) {
    console.error("Error in get-ratings route:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while retrieving ratings.",
    });
  }
});

// Get user's rating for a specific material
// Protected route - users can only get their own ratings
lrmsRouter.get(
  "/get-user-rating/:materialId",
  authenticateToken,
  async (req, res) => {
    const materialId = parseInt(req.params.materialId, 10);
    // Get userId from authenticated user (from JWT token), not from URL params
    const userId = req.user.userId; // Secured: comes from verified JWT token

    if (isNaN(materialId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid material ID provided.",
      });
    }

    try {
      const result = await lrmsService.getUserRatingForMaterial(
        materialId,
        userId
      );
      res.status(200).json(result);
    } catch (error) {
      console.error("Error in get-user-rating route:", error);
      res.status(500).json({
        success: false,
        message: "An error occurred while retrieving user rating.",
      });
    }
  }
);

// Update a material rating
// Protected route - requires authentication
lrmsRouter.put(
  "/update-rating/:ratingId",
  authenticateToken,
  async (req, res) => {
    const ratingId = parseInt(req.params.ratingId, 10);
    const { rating, suggestions } = req.body;

    if (isNaN(ratingId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid rating ID provided.",
      });
    }

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5.",
      });
    }

    try {
      const result = await lrmsService.updateMaterialRating(
        ratingId,
        rating,
        suggestions
      );
      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error("Error in update-rating route:", error);
      res.status(500).json({
        success: false,
        message: "An error occurred while updating the rating.",
      });
    }
  }
);

// Delete a material rating
// Protected route - requires authentication
lrmsRouter.delete(
  "/delete-rating/:ratingId",
  authenticateToken,
  async (req, res) => {
    const ratingId = parseInt(req.params.ratingId, 10);

    if (isNaN(ratingId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid rating ID provided.",
      });
    }

    try {
      const result = await lrmsService.deleteMaterialRating(ratingId);
      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error("Error in delete-rating route:", error);
      res.status(500).json({
        success: false,
        message: "An error occurred while deleting the rating.",
      });
    }
  }
);

// Saved Materials Routes

// Save a material
lrmsRouter.post(
  "/save-material/:materialId",
  authenticateToken,
  async (req, res) => {
    const materialId = parseInt(req.params.materialId, 10);
    const userId = req.user.userId;

    if (isNaN(materialId)) {
      return res.status(400).json({ success: false, message: "Invalid material ID" });
    }

    try {
      const result = await lrmsService.saveMaterial(userId, materialId);
      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error("Error saving material:", error);
      res.status(500).json({ success: false, message: "Server error saving material" });
    }
  }
);

// Unsave a material
lrmsRouter.delete(
  "/unsave-material/:materialId",
  authenticateToken,
  async (req, res) => {
    const materialId = parseInt(req.params.materialId, 10);
    const userId = req.user.userId;

    if (isNaN(materialId)) {
      return res.status(400).json({ success: false, message: "Invalid material ID" });
    }

    try {
      const result = await lrmsService.unsaveMaterial(userId, materialId);
      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error("Error unsaving material:", error);
      res.status(500).json({ success: false, message: "Server error unsaving material" });
    }
  }
);

// Get saved materials
lrmsRouter.get(
  "/saved-materials",
  authenticateToken,
  async (req, res) => {
    const userId = req.user.userId;

    try {
      const result = await lrmsService.getSavedMaterials(userId);
      res.status(200).json(result);
    } catch (error) {
      console.error("Error fetching saved materials:", error);
      res.status(500).json({ success: false, message: "Server error fetching saved materials" });
    }
  }
);

module.exports = lrmsRouter;
