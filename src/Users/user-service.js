const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const userDAO = require("./user-database");
const sendEmail = require("../Middlewares/sendEmail");
const crypto = require("crypto");

// JWT secret key - should be in .env file in production
// For now, using a default. In production, use: process.env.JWT_SECRET
const JWT_SECRET =
  process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-production";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "24h"; // Token expires in 24 hours

/**
 * Generate JWT token for a user
 * @param {Object} user - User object containing id, email, role
 * @returns {String} JWT token
 */
function generateToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

async function login(email, password) {
  try {
    // Find user by email
    const user = await userDAO.findUserByEmail(email);
    if (!user) {
      throw new Error("User not found");
    }

    // Check if user is active
    if (!user.isActive) {
      throw new Error("Account is deactivated");
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new Error("Invalid password");
    }

    // Check if 2FA is enabled for this user
    if (user.twoFactorEnabled) {
      // Generate OTP
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 min

      await userDAO.setUserOTP(email, otpCode, otpExpiry);

      // Send OTP email
      await sendEmail(
        email,
        "Your OTP Code",
        `<p>Your OTP code is: <b>${otpCode}</b></p><p>It expires in 5 minutes.</p>`
      );

      // Return 2FA required response
      return {
        requires2FA: true,
        email: email.replace(/(.{2}).+(@.+)/, "$1****$2"), // mask email
      };
    } else {
      // 2FA is disabled, return user data with JWT token
      // Extract position, office, and school names from profile
      const profile =
        user.profile && user.profile.length > 0 ? user.profile[0] : null;
      const positionName = profile?.position?.name || null;
      const officeName = profile?.office?.name || null;
      const schoolName = profile?.school?.name || null;

      const userData = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive,
        isChanged: user.isChanged,
        twoFactorEnabled: user.twoFactorEnabled,
        profile: user.profile,
        positionName: positionName,
        officeName: officeName,
        schoolName: schoolName,
      };

      // Generate JWT token
      const token = generateToken(userData);

      return {
        success: true,
        user: userData,
        token: token, // JWT token for authentication
      };
    }
  } catch (error) {
    throw new Error(error.message);
  }
}

async function verifyOtp(email, otpCode) {
  const user = await userDAO.verifyUserOTP(email, otpCode);
  if (!user) throw new Error("Invalid or expired OTP");

  // Extract position, office, and school names from profile
  const profile =
    user.profile && user.profile.length > 0 ? user.profile[0] : null;
  const positionName = profile?.position?.name || null;
  const officeName = profile?.office?.name || null;
  const schoolName = profile?.school?.name || null;

  // Return user data with JWT token
  const userData = {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    isActive: user.isActive,
    isChanged: user.isChanged,
    profile: user.profile,
    positionName: positionName,
    officeName: officeName,
    schoolName: schoolName,
  };

  // Generate JWT token after OTP verification
  const token = generateToken(userData);

  return {
    user: userData,
    token: token, // JWT token for authentication
  };
}

async function register(data) {
  try {
    // Check if user already exists
    const existingUser = await userDAO.findUserByEmail(data.email);
    if (existingUser) {
      throw new Error("Email already registered");
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(data.password, salt);

    // Create user with hashed password
    const user = await userDAO.createUser({
      ...data,
      password: hashedPassword,
    });

    // Generate JWT token
    // const token = jwt.sign(
    //   {
    //     userId: user.id,
    //     email: user.email,
    //     role: user.role,
    //   },
    //   process.env.JWT_SECRET,
    //   { expiresIn: "24h" }
    // );

    // Return user data and token
    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        middleName: user.middleName,
        birthdate: user.birthdate,
        age: user.age,
        role: user.role,
        profile: user.profile,
      },
      // token,
    };
  } catch (error) {
    throw new Error(error.message);
  }
}

async function getAllUsers() {
  try {
    const fetchedData = userDAO.getUsers();
    return fetchedData;
  } catch (error) {
    throw new Error(error.message);
  }
}

async function deleteUser(id) {
  try {
    const deletedUser = await userDAO.deleteUser(id);
    return deletedUser;
  } catch (error) {
    throw new Error(error.message);
  }
}

async function updateUser(id, userData) {
  try {
    const updatedUser = await userDAO.updateUser(id, userData);
    return updatedUser;
  } catch (error) {
    throw new Error(error.message);
  }
}

async function updateProfile(id, profileData) {
  try {
    const updatedProfile = await userDAO.updateProfile(id, profileData);
    return updatedProfile;
  } catch (error) {
    throw new Error(error.message);
  }
}

async function changePassword(userId, newPassword) {
  try {
    const updatedUser = await userDAO.changePassword(userId, newPassword);
    return updatedUser;
  } catch (error) {
    throw new Error(error.message);
  }
}

async function resetPassword(email, newPassword) {
  try {
    const user = await userDAO.findUserByEmail(email);
    if (!user) {
      throw new Error("User not found");
    }
    const updatedUser = await userDAO.changePassword(user.id, newPassword);

    // Send email notification
    const emailSubject = "Your Password Has Been Reset";
    const emailBody = `
      <p>Hello ${user.firstName},</p>
      <p>Your password for your account has been successfully reset. Below is your new password</p>
      <p><strong style="font-size: 1.5em;">${newPassword}</strong></p>
      <p>Please log in with your new password.</p>
      <p>If you did not request this change, please contact support immediately.</p>
      <p>Thank you.</p>
    `;
    await sendEmail(user.email, emailSubject, emailBody);

    return updatedUser;
  } catch (error) {
    console.error("[resetPassword] Error:", error);
    throw new Error("Error resetting password: " + error.message);
  }
}

async function userProfile(id) {
  try {
    const profile = await userDAO.getProfileByUserId(id);
    return profile;
  } catch (error) {
    console.error("[userProfile] Error:", error);
    throw new Error("Error getting user profile" + error.message);
  }
}

async function getUserById(id) {
  try {
    const user = await userDAO.findUserById(id);
    if (!user) {
      throw new Error("User not found");
    }

    const profile =
      user.profile && user.profile.length > 0 ? user.profile[0] : null;
    const positionName = profile?.position?.name || null;
    const officeName = profile?.office?.name || null;
    const schoolName = profile?.school?.name || null;

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isActive: user.isActive,
      isChanged: user.isChanged,
      twoFactorEnabled: user.twoFactorEnabled,
      profile: user.profile,
      positionName: positionName,
      officeName: officeName,
      schoolName: schoolName,
    };
  } catch (error) {
    throw new Error(error.message);
  }
}

async function resendOtp(email) {
  try {
    // Check if user exists
    const user = await userDAO.findUserByEmail(email);
    if (!user) {
      throw new Error("User not found");
    }

    // Check if user is active
    if (!user.isActive) {
      throw new Error("Account is deactivated");
    }

    // Generate new OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 min

    await userDAO.setUserOTP(email, otpCode, otpExpiry);

    // Send new OTP email
    await sendEmail(
      email,
      "Your New OTP Code",
      `<p>Your new OTP code is: <b>${otpCode}</b></p><p>It expires in 5 minutes.</p>`
    );

    return {
      success: true,
      message: "New OTP sent successfully",
      email: email.replace(/(.{2}).+(@.+)/, "$1****$2"), // mask email
    };
  } catch (error) {
    throw new Error(error.message);
  }
}

async function selfRegister(email) {
  try {
    // Check if user already exists
    const existingUser = await userDAO.findUserByEmail(email);
    if (existingUser) {
      throw new Error(
        "Email already registered. Please login or contact administrator."
      );
    }

    // Generate random temporary password (8 characters)
    const tempPassword = crypto.randomBytes(4).toString("hex").toUpperCase();

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(tempPassword, salt);

    // Create user with temporary password
    // Set isChanged to false to force password change on first login
    const user = await userDAO.createUser({
      email,
      password: hashedPassword,
      firstName: "New",
      lastName: "User",
      role: "Teacher", // Default role for self-registered users
      isChanged: false, // Force password change on first login
    });

    // Send email with temporary password
    const emailSubject = "Welcome to ILeaRN Portal - Your Temporary Password";
    const emailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb; border-radius: 10px;">
        <div style="background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to ILeaRN Portal</h1>
          <p style="color: #dbeafe; margin-top: 10px; font-size: 16px;">Imus Learning Resources Navigator</p>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px;">
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">Hello,</p>
          
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            Thank you for registering with ILeaRN Portal! Your account has been successfully created.
          </p>
          
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb;">
            <p style="color: #1f2937; font-size: 14px; margin: 0 0 10px 0; font-weight: 600;">Your Login Credentials:</p>
            <p style="color: #374151; margin: 5px 0;"><strong>Email:</strong> ${email}</p>
            <p style="color: #374151; margin: 5px 0;"><strong>Temporary Password:</strong> <span style="background: #fee2e2; color: #991b1b; padding: 8px 12px; border-radius: 6px; font-size: 18px; font-weight: bold; letter-spacing: 2px;">${tempPassword}</span></p>
          </div>
          
          <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
            <p style="color: #92400e; font-size: 14px; margin: 0;">
              <strong>⚠️ Important:</strong> This is a temporary password. You will be required to change it upon your first login for security purposes.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="https://sdoic-ilearn.depedimuscity.com" style="background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
              Login to ILeaRN Portal
            </a>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
              If you did not request this account, please ignore this email or contact our support team.
            </p>
            <p style="color: #6b7280; font-size: 14px; margin-top: 15px;">
              Best regards,<br>
              <strong style="color: #1f2937;">ILeaRN Portal Team</strong><br>
              <span style="font-size: 12px;">SDO - Imus City</span>
            </p>
          </div>
        </div>
        
        <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
          <p style="margin: 0;">© 2025 SDO - Imus City. All rights reserved.</p>
          <p style="margin: 5px 0 0 0;">ILeaRN Portal - Imus Learning Resources Navigator</p>
        </div>
      </div>
    `;

    await sendEmail(email, emailSubject, emailBody);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  } catch (error) {
    throw new Error(error.message);
  }
}

async function toggleTwoFactor(userId, enabled) {
  try {
    const updatedUser = await userDAO.updateUser(userId, {
      twoFactorEnabled: enabled,
    });
    return updatedUser;
  } catch (error) {
    throw new Error(error.message);
  }
}

async function getTwoFactorStatus(userId) {
  try {
    const user = await userDAO.findUserById(userId);
    if (!user) {
      throw new Error("User not found");
    }
    return {
      twoFactorEnabled: user.twoFactorEnabled,
    };
  } catch (error) {
    throw new Error(error.message);
  }
}

module.exports = {
  userProfile,
  getUserById,
  getAllUsers,
  register,
  login,
  deleteUser,
  updateUser,
  updateProfile,
  changePassword,
  resetPassword,
  verifyOtp,
  resendOtp,
  toggleTwoFactor,
  getTwoFactorStatus,
  selfRegister,
};
