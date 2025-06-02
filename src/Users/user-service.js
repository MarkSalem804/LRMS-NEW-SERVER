const bcrypt = require("bcryptjs");
// const jwt = require("jsonwebtoken");
const userDAO = require("./user-database");
const sendEmail = require("../Middlewares/sendEmail");

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

    // Update last login
    await userDAO.updateLastLogin(user.id);

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
        role: user.role,
        isActive: user.isActive,
        isChanged: user.isChanged,
        profile: user.profile,
      },
      // token,
    };
  } catch (error) {
    throw new Error(error.message);
  }
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
    console.error("[resetPassword] Error:", error);
    throw new Error("Error getting user profile" + error.message);
  }
}

module.exports = {
  userProfile,
  getAllUsers,
  register,
  login,
  deleteUser,
  updateUser,
  updateProfile,
  changePassword,
  resetPassword,
};
