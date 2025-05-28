const bcrypt = require("bcryptjs");
// const jwt = require("jsonwebtoken");
const userDAO = require("./user-database");
console.log("userData exports:", userDAO);

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

module.exports = {
  getAllUsers,
  register,
  login,
  deleteUser,
  updateUser,
  updateProfile,
  changePassword,
};
