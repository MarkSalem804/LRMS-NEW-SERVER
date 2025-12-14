const XLSX = require("xlsx");
const fs = require("fs");
const path = require("path");

// Ensure reports directory exists
const REPORTS_DIR = path.join(__dirname, "../../reports");
if (!fs.existsSync(REPORTS_DIR)) {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

/**
 * Export activity logs to Excel file
 * @param {Array} logs - Array of activity log objects
 * @param {String} filename - Name of the Excel file (without extension)
 * @returns {Object} - Result object with success status and file path
 */
const exportActivityLogsToExcel = (logs, filename = "Activity_Logs") => {
  try {
    // Format data for Excel
    const formattedData = logs.map((log, index) => ({
      "#": index + 1,
      Activity: log.activity || "N/A",
      "User Name": log.user
        ? `${log.user.firstName} ${log.user.lastName}`
        : "System / Unknown",
      Email: log.user?.email || "N/A",
      Role: log.user?.role || "N/A",
      Date: log.createdAt
        ? new Date(log.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })
        : "N/A",
      Time: log.createdAt
        ? new Date(log.createdAt).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })
        : "N/A",
      "Full Timestamp": log.createdAt
        ? new Date(log.createdAt).toLocaleString("en-US")
        : "N/A",
    }));

    // Create workbook
    const wb = XLSX.utils.book_new();

    // Create worksheet from data
    const ws = XLSX.utils.json_to_sheet(formattedData);

    // Set column widths
    const columnWidths = [
      { wch: 5 }, // #
      { wch: 50 }, // Activity
      { wch: 20 }, // User Name
      { wch: 30 }, // Email
      { wch: 12 }, // Role
      { wch: 15 }, // Date
      { wch: 12 }, // Time
      { wch: 25 }, // Full Timestamp
    ];
    ws["!cols"] = columnWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, "Activity Logs");

    // Generate filename with timestamp
    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, "-")
      .slice(0, -5);
    const fileName = `${filename}_${timestamp}.xlsx`;
    const filePath = path.join(REPORTS_DIR, fileName);

    // Write file to server
    XLSX.writeFile(wb, filePath);

    console.log(`✅ Excel report generated: ${fileName}`);

    return {
      success: true,
      fileName,
      filePath,
      recordCount: logs.length,
    };
  } catch (error) {
    console.error("❌ Error exporting to Excel:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Export activity logs with summary sheet
 * @param {Array} logs - Array of activity log objects
 * @param {Object} stats - Statistics object
 * @param {String} filename - Name of the Excel file
 * @returns {Object} - Result object with success status and file path
 */
const exportActivityLogsWithSummary = (
  logs,
  stats,
  filename = "Activity_Logs_Report"
) => {
  try {
    // Create workbook
    const wb = XLSX.utils.book_new();

    // 1. Summary Sheet
    const summaryData = [
      ["Activity Logs Report"],
      ["Generated On:", new Date().toLocaleString("en-US")],
      [],
      ["Summary Statistics"],
      ["Total Activities:", stats.totalCount || logs.length],
      ["Total Users:", stats.totalUsers || 0],
      ["Today's Activities:", stats.todayCount || 0],
      ["Active Users Today:", stats.activeUsersToday || 0],
      [],
      ["Activity Types Breakdown"],
    ];

    // Add activity type counts
    if (stats.activityCounts) {
      Object.entries(stats.activityCounts).forEach(([type, count]) => {
        summaryData.push([type, count]);
      });
    }

    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    wsSummary["!cols"] = [{ wch: 25 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");

    // 2. Detailed Logs Sheet
    const formattedData = logs.map((log, index) => ({
      "#": index + 1,
      Activity: log.activity || "N/A",
      "User Name": log.user
        ? `${log.user.firstName} ${log.user.lastName}`
        : "System / Unknown",
      Email: log.user?.email || "N/A",
      Role: log.user?.role || "N/A",
      Date: log.createdAt
        ? new Date(log.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })
        : "N/A",
      Time: log.createdAt
        ? new Date(log.createdAt).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })
        : "N/A",
    }));

    const wsLogs = XLSX.utils.json_to_sheet(formattedData);
    wsLogs["!cols"] = [
      { wch: 5 },
      { wch: 50 },
      { wch: 20 },
      { wch: 30 },
      { wch: 12 },
      { wch: 15 },
      { wch: 12 },
    ];
    XLSX.utils.book_append_sheet(wb, wsLogs, "Activity Logs");

    // 3. User Activity Sheet (grouped by user)
    const userActivityMap = new Map();
    logs.forEach((log) => {
      if (log.user) {
        const userId = log.user.email;
        if (!userActivityMap.has(userId)) {
          userActivityMap.set(userId, {
            name: `${log.user.firstName} ${log.user.lastName}`,
            email: log.user.email,
            role: log.user.role,
            count: 0,
            activities: [],
          });
        }
        const userData = userActivityMap.get(userId);
        userData.count++;
        userData.activities.push({
          activity: log.activity,
          date: log.createdAt,
        });
      }
    });

    const userSummaryData = Array.from(userActivityMap.values()).map(
      (user, index) => ({
        "#": index + 1,
        "User Name": user.name,
        Email: user.email,
        Role: user.role,
        "Total Activities": user.count,
      })
    );

    const wsUsers = XLSX.utils.json_to_sheet(userSummaryData);
    wsUsers["!cols"] = [
      { wch: 5 },
      { wch: 20 },
      { wch: 30 },
      { wch: 12 },
      { wch: 15 },
    ];
    XLSX.utils.book_append_sheet(wb, wsUsers, "User Activity Summary");

    // Generate filename with timestamp
    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, "-")
      .slice(0, -5);
    const fileName = `${filename}_${timestamp}.xlsx`;
    const filePath = path.join(REPORTS_DIR, fileName);

    // Write file to server
    XLSX.writeFile(wb, filePath);

    console.log(`✅ Complete report generated: ${fileName}`);

    return {
      success: true,
      fileName,
      filePath,
      recordCount: logs.length,
      sheets: ["Summary", "Activity Logs", "User Activity Summary"],
    };
  } catch (error) {
    console.error("❌ Error exporting to Excel with summary:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Get list of all generated reports
 * @returns {Array} - Array of report files with metadata
 */
const getGeneratedReports = () => {
  try {
    const files = fs.readdirSync(REPORTS_DIR);
    const reports = files
      .filter((file) => file.endsWith(".xlsx"))
      .map((file) => {
        const filePath = path.join(REPORTS_DIR, file);
        const stats = fs.statSync(filePath);
        return {
          fileName: file,
          filePath,
          size: stats.size,
          createdAt: stats.birthtime,
          modifiedAt: stats.mtime,
        };
      })
      .sort((a, b) => b.createdAt - a.createdAt); // Most recent first

    return reports;
  } catch (error) {
    console.error("❌ Error getting generated reports:", error);
    return [];
  }
};

/**
 * Delete a report file
 * @param {String} fileName - Name of the file to delete
 * @returns {Object} - Result object with success status
 */
const deleteReport = (fileName) => {
  try {
    const filePath = path.join(REPORTS_DIR, fileName);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return { success: false, error: "File not found" };
    }

    // Delete file
    fs.unlinkSync(filePath);
    console.log(`🗑️ Report deleted: ${fileName}`);

    return { success: true, fileName };
  } catch (error) {
    console.error("❌ Error deleting report:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete old reports (older than specified days)
 * @param {Number} daysToKeep - Number of days to keep reports
 * @returns {Object} - Result object with count of deleted files
 */
const deleteOldReports = (daysToKeep = 30) => {
  try {
    const files = fs.readdirSync(REPORTS_DIR);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    let deletedCount = 0;

    files.forEach((file) => {
      if (file.endsWith(".xlsx")) {
        const filePath = path.join(REPORTS_DIR, file);
        const stats = fs.statSync(filePath);

        if (stats.birthtime < cutoffDate) {
          fs.unlinkSync(filePath);
          deletedCount++;
          console.log(`🗑️ Old report deleted: ${file}`);
        }
      }
    });

    console.log(`✅ Deleted ${deletedCount} old reports`);

    return { success: true, deletedCount };
  } catch (error) {
    console.error("❌ Error deleting old reports:", error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  exportActivityLogsToExcel,
  exportActivityLogsWithSummary,
  getGeneratedReports,
  deleteReport,
  deleteOldReports,
};
