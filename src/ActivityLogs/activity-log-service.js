const activityLogDatabase = require("./activity-log-database");

// Activity types for consistency
const ACTIVITY_TYPES = {
  // Authentication
  LOGIN: "User logged in",
  LOGOUT: "User logged out",
  LOGIN_FAILED: "Failed login attempt",

  // User Management
  USER_CREATED: "New user registered",
  USER_UPDATED: "User profile updated",
  USER_DELETED: "User account deleted",
  PASSWORD_CHANGED: "Password changed",
  PASSWORD_RESET: "Password reset by admin",
  TWO_FACTOR_ENABLED: "Two-factor authentication enabled",
  TWO_FACTOR_DISABLED: "Two-factor authentication disabled",

  // Materials Management
  MATERIAL_UPLOADED: "Material metadata uploaded",
  MATERIAL_FILE_UPLOADED: "Material file uploaded",
  MATERIAL_VIEWED: "Material viewed",
  MATERIAL_DOWNLOADED: "Material downloaded",
  MATERIAL_UPDATED: "Material updated",
  MATERIAL_DELETED: "Material deleted",

  // Profile
  PROFILE_VIEWED: "Profile viewed",
  PROFILE_UPDATED: "Profile information updated",

  // System
  SETTINGS_CHANGED: "System settings changed",
  SECURITY_SETTINGS_CHANGED: "Security settings changed",
};

// Helper function to log activity
async function logActivity(userId, activityType, details = "") {
  try {
    const activity = details ? `${activityType} - ${details}` : activityType;

    await activityLogDatabase.createActivityLog(userId, activity);
    console.log(`📝 Activity logged: [User ${userId}] ${activity}`);
  } catch (error) {
    console.error("Error logging activity:", error);
    // Don't throw error to prevent breaking the main flow
  }
}

// Specific logging functions
async function logLogin(userId, email) {
  return logActivity(userId, ACTIVITY_TYPES.LOGIN, `Email: ${email}`);
}

async function logLogout(userId, email) {
  return logActivity(userId, ACTIVITY_TYPES.LOGOUT, `Email: ${email}`);
}

async function logFailedLogin(email) {
  return logActivity(null, ACTIVITY_TYPES.LOGIN_FAILED, `Email: ${email}`);
}

async function logUserCreated(adminUserId, newUserEmail) {
  return logActivity(
    adminUserId,
    ACTIVITY_TYPES.USER_CREATED,
    `Created user: ${newUserEmail}`
  );
}

async function logUserUpdated(adminUserId, targetUserEmail) {
  return logActivity(
    adminUserId,
    ACTIVITY_TYPES.USER_UPDATED,
    `Updated user: ${targetUserEmail}`
  );
}

async function logUserDeleted(adminUserId, deletedUserEmail) {
  return logActivity(
    adminUserId,
    ACTIVITY_TYPES.USER_DELETED,
    `Deleted user: ${deletedUserEmail}`
  );
}

async function logPasswordChanged(userId) {
  return logActivity(userId, ACTIVITY_TYPES.PASSWORD_CHANGED);
}

async function logPasswordReset(adminUserId, targetUserEmail) {
  return logActivity(
    adminUserId,
    ACTIVITY_TYPES.PASSWORD_RESET,
    `Reset password for: ${targetUserEmail}`
  );
}

async function logTwoFactorToggle(userId, enabled) {
  return logActivity(
    userId,
    enabled
      ? ACTIVITY_TYPES.TWO_FACTOR_ENABLED
      : ACTIVITY_TYPES.TWO_FACTOR_DISABLED
  );
}

async function logMaterialUploaded(userId, materialTitle) {
  return logActivity(
    userId,
    ACTIVITY_TYPES.MATERIAL_UPLOADED,
    `Material: ${materialTitle}`
  );
}

async function logMaterialFileUploaded(userId, materialTitle) {
  return logActivity(
    userId,
    ACTIVITY_TYPES.MATERIAL_FILE_UPLOADED,
    `Material: ${materialTitle}`
  );
}

async function logMaterialViewed(userId, materialTitle) {
  return logActivity(
    userId,
    ACTIVITY_TYPES.MATERIAL_VIEWED,
    `Material: ${materialTitle}`
  );
}

async function logMaterialDownloaded(userId, materialTitle) {
  return logActivity(
    userId,
    ACTIVITY_TYPES.MATERIAL_DOWNLOADED,
    `Material: ${materialTitle}`
  );
}

async function logMaterialUpdated(userId, materialTitle) {
  return logActivity(
    userId,
    ACTIVITY_TYPES.MATERIAL_UPDATED,
    `Material: ${materialTitle}`
  );
}

async function logMaterialDeleted(userId, materialTitle) {
  return logActivity(
    userId,
    ACTIVITY_TYPES.MATERIAL_DELETED,
    `Material: ${materialTitle}`
  );
}

async function logProfileViewed(userId, viewedUserEmail) {
  return logActivity(
    userId,
    ACTIVITY_TYPES.PROFILE_VIEWED,
    viewedUserEmail
      ? `Viewed profile: ${viewedUserEmail}`
      : "Viewed own profile"
  );
}

async function logProfileUpdated(userId) {
  return logActivity(userId, ACTIVITY_TYPES.PROFILE_UPDATED);
}

async function logSettingsChanged(userId, settingType) {
  return logActivity(userId, ACTIVITY_TYPES.SETTINGS_CHANGED, settingType);
}

async function logSecuritySettingsChanged(userId) {
  return logActivity(userId, ACTIVITY_TYPES.SECURITY_SETTINGS_CHANGED);
}

module.exports = {
  ACTIVITY_TYPES,
  logActivity,
  logLogin,
  logLogout,
  logFailedLogin,
  logUserCreated,
  logUserUpdated,
  logUserDeleted,
  logPasswordChanged,
  logPasswordReset,
  logTwoFactorToggle,
  logMaterialUploaded,
  logMaterialFileUploaded,
  logMaterialViewed,
  logMaterialDownloaded,
  logMaterialUpdated,
  logMaterialDeleted,
  logProfileViewed,
  logProfileUpdated,
  logSettingsChanged,
  logSecuritySettingsChanged,
};
