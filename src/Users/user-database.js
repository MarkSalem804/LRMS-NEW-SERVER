const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const bcrypt = require("bcryptjs");

async function findUserByEmail(email) {
  try {
    const user = await prisma.user.findUnique({
      where: {
        email: email,
      },
      include: {
        profile: {
          include: {
            position: true,
            office: true,
            school: true,
          },
        },
      },
    });
    return user;
  } catch (error) {
    throw new Error("Error finding user: " + error.message);
  }
}

async function findUserById(userId) {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: parseInt(userId, 10),
      },
      include: {
        profile: {
          include: {
            position: true,
            office: true,
            school: true,
          },
        },
      },
    });
    return user;
  } catch (error) {
    throw new Error("Error finding user: " + error.message);
  }
}

async function updateLastLogin(userId) {
  try {
    await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        lastLogin: new Date(),
      },
    });
  } catch (error) {
    throw new Error("Error updating last login: " + error.message);
  }
}

async function createUser(userData) {
  try {
    const role = userData.role || "Teacher";

    const user = await prisma.user.create({
      data: {
        email: userData.email,
        password: userData.password,
        firstName: userData.firstName,
        lastName: userData.lastName,
        middleName: userData.middleName,
        birthdate: userData.birthdate,
        age: userData.age ? Number(userData.age) : null,
        role: role,
        profile: {
          create: {
            firstName: userData.firstName,
            lastName: userData.lastName,
            middleName: userData.middleName, // ✅ make sure it's included here
            birthdate: userData.birthdate,
            age: userData.age ? Number(userData.age) : null,
            emailAddress: userData.email,
            role: role,
            profilePicture: userData.profilePicture || null,
            officeId: userData.officeId ? Number(userData.officeId) : null,
            schoolId: userData.schoolId ? Number(userData.schoolId) : null,
            positionId: userData.positionId
              ? Number(userData.positionId)
              : null,
          },
        },
      },
      include: {
        profile: true,
      },
    });
    return user;
  } catch (error) {
    throw new Error("Error creating user: " + error.message);
  }
}

async function getUsers() {
  try {
    const data = await prisma.user.findMany({
      include: {
        profile: true,
      },
    });
    return data;
  } catch (error) {
    throw new Error("Error fetching users" + error.message);
  }
}

async function deleteUser(id) {
  try {
    const deletedUser = await prisma.user.delete({
      where: { id: parseInt(id, 10) },
    });
    return deletedUser;
  } catch (error) {
    throw new Error("Error deleting user: " + error.message);
  }
}

async function updateUser(id, userData) {
  try {
    const updatedUser = await prisma.user.update({
      where: { id: parseInt(id, 10) },
      data: userData,
    });
    return updatedUser;
  } catch (error) {
    throw new Error("Error updating user: " + error.message);
  }
}

async function updateProfile(userId, profileData) {
  try {
    // Find the user by userId and include the profile
    const userWithProfile = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!userWithProfile) {
      throw new Error("User not found.");
    }

    if (!userWithProfile.profile || userWithProfile.profile.length === 0) {
      throw new Error("User profile not found.");
    }

    const profileId = userWithProfile.profile[0].id;

    // Prepare data for user table update, only including fields present in profileData
    const userDataToUpdate = {};
    if (profileData.hasOwnProperty("firstName"))
      userDataToUpdate.firstName = profileData.firstName;
    if (profileData.hasOwnProperty("lastName"))
      userDataToUpdate.lastName = profileData.lastName;
    if (profileData.hasOwnProperty("middleName"))
      userDataToUpdate.middleName = profileData.middleName;
    if (profileData.hasOwnProperty("role"))
      userDataToUpdate.role = profileData.role;
    if (profileData.hasOwnProperty("birthdate")) {
      // Convert birthdate string to ISO-8601 DateTime string
      try {
        const dateObject = new Date(profileData.birthdate);
        if (!isNaN(dateObject.getTime())) {
          // Check if the date is valid
          userDataToUpdate.birthdate = dateObject.toISOString();
        } else {
          console.error(
            "[updateProfile] Invalid birthdate received:",
            profileData.birthdate
          );
        }
      } catch (e) {
        console.error(
          "[updateProfile] Error parsing birthdate:",
          profileData.birthdate,
          e
        );
      }
    }
    if (profileData.hasOwnProperty("age"))
      userDataToUpdate.age = profileData.age ? Number(profileData.age) : null;

    // Add email update if present in profileData
    if (profileData.hasOwnProperty("emailAddress")) {
      userDataToUpdate.email = profileData.emailAddress;
    }

    // Update the user table with relevant data from profileData
    if (Object.keys(userDataToUpdate).length > 0) {
      await prisma.user.update({
        where: { id: userId },
        data: userDataToUpdate,
      });
    }

    const profileDataToUpdate = { ...profileData };

    delete profileDataToUpdate.userId;

    delete profileDataToUpdate.firstName;
    delete profileDataToUpdate.lastName;
    delete profileDataToUpdate.middleName;
    delete profileDataToUpdate.role;
    delete profileDataToUpdate.birthdate;
    delete profileDataToUpdate.age;

    // Delete emailAddress from profileDataToUpdate if it was there
    delete profileDataToUpdate.emailAddress;

    // Convert officeId, schoolId, positionId to numbers if present
    if (profileDataToUpdate.hasOwnProperty("officeId")) {
      profileDataToUpdate.officeId = profileDataToUpdate.officeId
        ? Number(profileDataToUpdate.officeId)
        : null;
    }
    if (profileDataToUpdate.hasOwnProperty("schoolId")) {
      profileDataToUpdate.schoolId = profileDataToUpdate.schoolId
        ? Number(profileDataToUpdate.schoolId)
        : null;
    }
    if (profileDataToUpdate.hasOwnProperty("positionId")) {
      profileDataToUpdate.positionId = profileDataToUpdate.positionId
        ? Number(profileDataToUpdate.positionId)
        : null;
    }

    if (Object.keys(profileDataToUpdate).length > 0) {
      const updatedProfile = await prisma.profile.update({
        where: { id: profileId },
        data: profileDataToUpdate,
      });
    }

    // Re-fetch the user with updated profile data to return
    const finalUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    return finalUser;
  } catch (error) {
    console.error("[updateProfile] Error:", error);
    throw new Error("Error updating user and profile: " + error.message);
  }
}

async function changePassword(userId, newPassword) {
  try {
    const hashedPassword = bcrypt.hashSync(newPassword, 10);
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        isChanged: true,
      },
    });
    return updatedUser;
  } catch (error) {
    console.error("[changePassword] Error:", error);
    throw new Error("Error changing password: " + error.message);
  }
}

async function getProfileByUserId(id) {
  try {
    const profileData = await prisma.profile.findFirst({
      where: {
        userId: id,
      },
    });
    return profileData;
  } catch (error) {
    console.error("[changePassword] Error:", error);
    throw new Error("Error changing password: " + error.message);
  }
}

async function setUserOTP(email, otpCode, otpExpiry) {
  return prisma.user.update({
    where: { email },
    data: { otpCode, otpExpiry },
  });
}

async function verifyUserOTP(email, otpCode) {
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      profile: {
        include: {
          position: true,
          office: true,
          school: true,
        },
      },
    },
  });
  if (!user || !user.otpCode || !user.otpExpiry) return false;
  if (user.otpCode !== otpCode) return false;
  if (new Date() > user.otpExpiry) return false;
  // Optionally clear OTP after use
  await prisma.user.update({
    where: { email },
    data: { otpCode: null, otpExpiry: null },
  });
  return user;
}

module.exports = {
  getProfileByUserId,
  deleteUser,
  getUsers,
  createUser,
  findUserByEmail,
  findUserById,
  updateLastLogin,
  updateUser,
  updateProfile,
  setUserOTP,
  verifyUserOTP,
  changePassword,
};
