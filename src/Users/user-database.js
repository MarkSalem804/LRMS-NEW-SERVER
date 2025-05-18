const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function findUserByEmail(email) {
  try {
    const user = await prisma.user.findUnique({
      where: {
        email: email,
      },
      include: {
        profile: true,
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
    const user = await prisma.user.create({
      data: {
        email: userData.email,
        password: userData.password,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role || "USER",
        profile: {
          create: {
            firstName: userData.firstName,
            lastName: userData.lastName,
            emailAddress: userData.email,
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

module.exports = {
  createUser,
  findUserByEmail,
  updateLastLogin,
};
