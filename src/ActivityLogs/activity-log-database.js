const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Create a new activity log
async function createActivityLog(userId, activity) {
  try {
    const log = await prisma.activityLogs.create({
      data: {
        userId,
        activity,
        createdAt: new Date(),
      },
    });
    return log;
  } catch (error) {
    console.error("Error creating activity log:", error);
    throw error;
  }
}

// Get all activity logs with user details
async function getAllActivityLogs(limit = 100, offset = 0) {
  try {
    const logs = await prisma.activityLogs.findMany({
      take: limit,
      skip: offset,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });
    return logs;
  } catch (error) {
    console.error("Error fetching activity logs:", error);
    throw error;
  }
}

// Get activity logs by user ID
async function getActivityLogsByUserId(userId, limit = 50) {
  try {
    const logs = await prisma.activityLogs.findMany({
      where: {
        userId: parseInt(userId),
      },
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });
    return logs;
  } catch (error) {
    console.error("Error fetching user activity logs:", error);
    throw error;
  }
}

// Get total count of activity logs
async function getActivityLogsCount() {
  try {
    const count = await prisma.activityLogs.count();
    return count;
  } catch (error) {
    console.error("Error counting activity logs:", error);
    throw error;
  }
}

// Delete old activity logs (e.g., older than 90 days)
async function deleteOldActivityLogs(daysToKeep = 90) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await prisma.activityLogs.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });
    return result;
  } catch (error) {
    console.error("Error deleting old activity logs:", error);
    throw error;
  }
}

module.exports = {
  createActivityLog,
  getAllActivityLogs,
  getActivityLogsByUserId,
  getActivityLogsCount,
  deleteOldActivityLogs,
};
