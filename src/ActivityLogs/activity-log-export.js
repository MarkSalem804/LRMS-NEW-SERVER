const ExcelJS = require("exceljs");
const fs = require("fs");
const path = require("path");

// Ensure reports directory exists
const REPORTS_DIR = path.join(__dirname, "../../reports");
if (!fs.existsSync(REPORTS_DIR)) {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

/**
 * Generates a timestamp string safe for use in file names.
 */
function getTimestamp() {
  return new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5);
}

/**
 * Applies a standard dark-blue header row style.
 */
function styleHeaderRow(worksheet) {
  const headerRow = worksheet.getRow(1);
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF1E3A5F" },
    };
    cell.alignment = { vertical: "middle", horizontal: "center" };
    cell.border = { bottom: { style: "thin", color: { argb: "FFD0D0D0" } } };
  });
  headerRow.height = 22;
}

/**
 * Export activity logs to Excel file (server-side — writes to REPORTS_DIR).
 * @param {Array} logs - Array of activity log objects
 * @param {String} filename - Base file name (without extension)
 * @returns {Object} - Result with success status and file path
 */
const exportActivityLogsToExcel = async (logs, filename = "Activity_Logs") => {
  try {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "ILeaRN Portal";
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet("Activity Logs");

    worksheet.columns = [
      { header: "#",              key: "num",       width: 6  },
      { header: "Activity",      key: "activity",  width: 52 },
      { header: "User Name",     key: "userName",  width: 22 },
      { header: "Email",         key: "email",     width: 32 },
      { header: "Role",          key: "role",      width: 14 },
      { header: "Date",          key: "date",      width: 16 },
      { header: "Time",          key: "time",      width: 14 },
      { header: "Full Timestamp", key: "timestamp", width: 26 },
    ];

    styleHeaderRow(worksheet);

    logs.forEach((log, index) => {
      const createdAt = log.createdAt ? new Date(log.createdAt) : null;
      worksheet.addRow({
        num:       index + 1,
        activity:  log.activity || "N/A",
        userName:  log.user ? `${log.user.firstName} ${log.user.lastName}` : "System / Unknown",
        email:     log.user?.email || "N/A",
        role:      log.user?.role  || "N/A",
        date:      createdAt ? createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "N/A",
        time:      createdAt ? createdAt.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "N/A",
        timestamp: createdAt ? createdAt.toLocaleString("en-US") : "N/A",
      });
    });

    const fileName = `${filename}_${getTimestamp()}.xlsx`;
    const filePath = path.join(REPORTS_DIR, fileName);
    await workbook.xlsx.writeFile(filePath);

    console.log(`✅ Excel report generated: ${fileName}`);
    return { success: true, fileName, filePath, recordCount: logs.length };
  } catch (error) {
    console.error("❌ Error exporting to Excel:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Export activity logs with summary sheet (server-side).
 * @param {Array}  logs     - Array of activity log objects
 * @param {Object} stats    - Statistics object
 * @param {String} filename - Base file name
 * @returns {Object} - Result with success status and file path
 */
const exportActivityLogsWithSummary = async (
  logs,
  stats,
  filename = "Activity_Logs_Report"
) => {
  try {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "ILeaRN Portal";
    workbook.created = new Date();

    // ── 1. Summary Sheet ───────────────────────────────────────────────────────
    const wsSummary = workbook.addWorksheet("Summary");
    wsSummary.columns = [
      { key: "label", width: 28 },
      { key: "value", width: 22 },
    ];

    // Title cell
    wsSummary.mergeCells("A1:B1");
    const titleCell = wsSummary.getCell("A1");
    titleCell.value = "Activity Logs Report";
    titleCell.font = { bold: true, size: 14, color: { argb: "FF1E3A5F" } };
    titleCell.alignment = { horizontal: "center" };

    wsSummary.addRow(["Generated On:", new Date().toLocaleString("en-US")]);
    wsSummary.addRow([]);
    wsSummary.addRow(["Summary Statistics"]);
    wsSummary.addRow(["Total Activities:",    stats.totalCount         || logs.length]);
    wsSummary.addRow(["Total Users:",         stats.totalUsers         || 0]);
    wsSummary.addRow(["Today's Activities:",  stats.todayCount         || 0]);
    wsSummary.addRow(["Active Users Today:",  stats.activeUsersToday   || 0]);
    wsSummary.addRow([]);
    wsSummary.addRow(["Activity Types Breakdown"]);

    if (stats.activityCounts) {
      Object.entries(stats.activityCounts).forEach(([type, count]) => {
        wsSummary.addRow([type, count]);
      });
    }

    // ── 2. Detailed Logs Sheet ─────────────────────────────────────────────────
    const wsLogs = workbook.addWorksheet("Activity Logs");
    wsLogs.columns = [
      { header: "#",          key: "num",      width: 6  },
      { header: "Activity",   key: "activity", width: 52 },
      { header: "User Name",  key: "userName", width: 22 },
      { header: "Email",      key: "email",    width: 32 },
      { header: "Role",       key: "role",     width: 14 },
      { header: "Date",       key: "date",     width: 16 },
      { header: "Time",       key: "time",     width: 14 },
    ];
    styleHeaderRow(wsLogs);

    logs.forEach((log, index) => {
      const createdAt = log.createdAt ? new Date(log.createdAt) : null;
      wsLogs.addRow({
        num:      index + 1,
        activity: log.activity || "N/A",
        userName: log.user ? `${log.user.firstName} ${log.user.lastName}` : "System / Unknown",
        email:    log.user?.email || "N/A",
        role:     log.user?.role  || "N/A",
        date:     createdAt ? createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "N/A",
        time:     createdAt ? createdAt.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "N/A",
      });
    });

    // ── 3. User Activity Summary Sheet ─────────────────────────────────────────
    const wsUsers = workbook.addWorksheet("User Activity Summary");
    wsUsers.columns = [
      { header: "#",                key: "num",      width: 6  },
      { header: "User Name",        key: "userName", width: 22 },
      { header: "Email",            key: "email",    width: 32 },
      { header: "Role",             key: "role",     width: 14 },
      { header: "Total Activities", key: "total",    width: 18 },
    ];
    styleHeaderRow(wsUsers);

    const userActivityMap = new Map();
    logs.forEach((log) => {
      if (log.user) {
        const key = log.user.email;
        if (!userActivityMap.has(key)) {
          userActivityMap.set(key, {
            name:  `${log.user.firstName} ${log.user.lastName}`,
            email: log.user.email,
            role:  log.user.role,
            count: 0,
          });
        }
        userActivityMap.get(key).count++;
      }
    });

    Array.from(userActivityMap.values()).forEach((user, index) => {
      wsUsers.addRow({
        num:      index + 1,
        userName: user.name,
        email:    user.email,
        role:     user.role,
        total:    user.count,
      });
    });

    const fileName = `${filename}_${getTimestamp()}.xlsx`;
    const filePath = path.join(REPORTS_DIR, fileName);
    await workbook.xlsx.writeFile(filePath);

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
 * Get list of all generated reports.
 */
const getGeneratedReports = () => {
  try {
    const files = fs.readdirSync(REPORTS_DIR);
    return files
      .filter((file) => file.endsWith(".xlsx"))
      .map((file) => {
        const filePath = path.join(REPORTS_DIR, file);
        const stats = fs.statSync(filePath);
        return { fileName: file, filePath, size: stats.size, createdAt: stats.birthtime, modifiedAt: stats.mtime };
      })
      .sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    console.error("❌ Error getting generated reports:", error);
    return [];
  }
};

/**
 * Delete a specific report file.
 */
const deleteReport = (fileName) => {
  try {
    const filePath = path.join(REPORTS_DIR, fileName);
    if (!fs.existsSync(filePath)) return { success: false, error: "File not found" };
    fs.unlinkSync(filePath);
    console.log(`🗑️ Report deleted: ${fileName}`);
    return { success: true, fileName };
  } catch (error) {
    console.error("❌ Error deleting report:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete old reports older than the specified number of days.
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
