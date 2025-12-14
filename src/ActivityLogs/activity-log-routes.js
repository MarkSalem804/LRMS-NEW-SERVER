const express = require("express");
const activityLogRouter = express.Router();
const activityLogDatabase = require("./activity-log-database");
const activityLogExport = require("./activity-log-export");
const path = require("path");

// Get all activity logs (paginated)
activityLogRouter.get("/", async (req, res) => {
  try {
    const { limit = 100, offset = 0 } = req.query;

    const logs = await activityLogDatabase.getAllActivityLogs(
      parseInt(limit),
      parseInt(offset)
    );

    const totalCount = await activityLogDatabase.getActivityLogsCount();

    return res.status(200).json({
      success: true,
      message: "Activity logs fetched successfully",
      data: logs,
      pagination: {
        total: totalCount,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: parseInt(offset) + logs.length < totalCount,
      },
    });
  } catch (error) {
    console.error("Error fetching activity logs:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch activity logs",
      error: error.message,
    });
  }
});

// Get activity logs by user ID
activityLogRouter.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50 } = req.query;

    const logs = await activityLogDatabase.getActivityLogsByUserId(
      userId,
      parseInt(limit)
    );

    return res.status(200).json({
      success: true,
      message: "User activity logs fetched successfully",
      data: logs,
    });
  } catch (error) {
    console.error("Error fetching user activity logs:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch user activity logs",
      error: error.message,
    });
  }
});

// Get activity logs count
activityLogRouter.get("/count", async (req, res) => {
  try {
    const count = await activityLogDatabase.getActivityLogsCount();

    return res.status(200).json({
      success: true,
      message: "Activity logs count fetched successfully",
      data: { count },
    });
  } catch (error) {
    console.error("Error counting activity logs:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to count activity logs",
      error: error.message,
    });
  }
});

// Delete old activity logs (admin only)
activityLogRouter.delete("/cleanup", async (req, res) => {
  try {
    const { daysToKeep = 90 } = req.query;

    const result = await activityLogDatabase.deleteOldActivityLogs(
      parseInt(daysToKeep)
    );

    return res.status(200).json({
      success: true,
      message: `Deleted activity logs older than ${daysToKeep} days`,
      data: { deletedCount: result.count },
    });
  } catch (error) {
    console.error("Error deleting old activity logs:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete old activity logs",
      error: error.message,
    });
  }
});

// Export activity logs to Excel (simple)
activityLogRouter.post("/export", async (req, res) => {
  try {
    const { limit = 1000, filename = "Activity_Logs" } = req.body;

    // Fetch logs
    const logs = await activityLogDatabase.getAllActivityLogs(
      parseInt(limit),
      0
    );

    if (logs.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No activity logs to export",
      });
    }

    // Generate Excel file
    const result = activityLogExport.exportActivityLogsToExcel(logs, filename);

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: "Activity logs exported successfully",
        data: {
          fileName: result.fileName,
          recordCount: result.recordCount,
          filePath: result.filePath,
        },
      });
    } else {
      return res.status(500).json({
        success: false,
        message: "Failed to export activity logs",
        error: result.error,
      });
    }
  } catch (error) {
    console.error("Error exporting activity logs:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to export activity logs",
      error: error.message,
    });
  }
});

// Export activity logs with summary (complete report)
activityLogRouter.post("/export-summary", async (req, res) => {
  try {
    const { filename = "Activity_Logs_Complete_Report" } = req.body;

    // Fetch all logs
    const logs = await activityLogDatabase.getAllActivityLogs(10000, 0);

    if (logs.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No activity logs to export",
      });
    }

    // Calculate statistics
    const today = new Date();
    const todayLogs = logs.filter((log) => {
      const logDate = new Date(log.createdAt);
      return logDate.toDateString() === today.toDateString();
    });

    const activeUsersToday = new Set(todayLogs.map((log) => log.userId)).size;

    // Count activity types
    const activityCounts = {};
    logs.forEach((log) => {
      const activity = log.activity?.toLowerCase() || "unknown";

      let category = "Other";
      if (activity.includes("login")) category = "Login Activities";
      else if (activity.includes("logout")) category = "Logout Activities";
      else if (
        activity.includes("user") &&
        (activity.includes("created") || activity.includes("registered"))
      )
        category = "User Created";
      else if (activity.includes("user") && activity.includes("updated"))
        category = "User Updated";
      else if (activity.includes("user") && activity.includes("deleted"))
        category = "User Deleted";
      else if (activity.includes("material")) category = "Material Activities";
      else if (activity.includes("profile")) category = "Profile Updates";
      else if (activity.includes("password")) category = "Password Changes";
      else if (activity.includes("two-factor") || activity.includes("2fa"))
        category = "Security Settings";

      activityCounts[category] = (activityCounts[category] || 0) + 1;
    });

    const stats = {
      totalCount: logs.length,
      totalUsers: new Set(logs.map((log) => log.userId)).size,
      todayCount: todayLogs.length,
      activeUsersToday,
      activityCounts,
    };

    // Generate Excel file with summary
    const result = activityLogExport.exportActivityLogsWithSummary(
      logs,
      stats,
      filename
    );

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: "Complete activity report generated successfully",
        data: {
          fileName: result.fileName,
          recordCount: result.recordCount,
          sheets: result.sheets,
          filePath: result.filePath,
        },
      });
    } else {
      return res.status(500).json({
        success: false,
        message: "Failed to generate report",
        error: result.error,
      });
    }
  } catch (error) {
    console.error("Error generating complete report:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate complete report",
      error: error.message,
    });
  }
});

// Download a generated report
activityLogRouter.get("/download/:fileName", (req, res) => {
  try {
    const { fileName } = req.params;
    const filePath = path.join(__dirname, "../../reports", fileName);

    // Check if file exists
    if (!require("fs").existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: "Report file not found",
      });
    }

    // Send file
    res.download(filePath, fileName, (err) => {
      if (err) {
        console.error("Error downloading file:", err);
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            message: "Error downloading file",
          });
        }
      }
    });
  } catch (error) {
    console.error("Error downloading report:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to download report",
      error: error.message,
    });
  }
});

// Get list of all generated reports
activityLogRouter.get("/reports/list", (req, res) => {
  try {
    const reports = activityLogExport.getGeneratedReports();

    return res.status(200).json({
      success: true,
      message: "Generated reports fetched successfully",
      data: reports,
      count: reports.length,
    });
  } catch (error) {
    console.error("Error fetching reports list:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch reports list",
      error: error.message,
    });
  }
});

// Delete a specific report
activityLogRouter.delete("/reports/:fileName", (req, res) => {
  try {
    const { fileName } = req.params;

    const result = activityLogExport.deleteReport(fileName);

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: "Report deleted successfully",
        data: { fileName: result.fileName },
      });
    } else {
      return res.status(404).json({
        success: false,
        message: result.error || "Failed to delete report",
      });
    }
  } catch (error) {
    console.error("Error deleting report:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete report",
      error: error.message,
    });
  }
});

// Delete old reports
activityLogRouter.delete("/reports/cleanup-old", (req, res) => {
  try {
    const { daysToKeep = 30 } = req.query;

    const result = activityLogExport.deleteOldReports(parseInt(daysToKeep));

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: `Deleted reports older than ${daysToKeep} days`,
        data: { deletedCount: result.deletedCount },
      });
    } else {
      return res.status(500).json({
        success: false,
        message: "Failed to delete old reports",
        error: result.error,
      });
    }
  } catch (error) {
    console.error("Error deleting old reports:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete old reports",
      error: error.message,
    });
  }
});

module.exports = activityLogRouter;
