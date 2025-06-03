const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const saveMaterialsToDatabase = async (materialsData) => {
  try {
    // Assuming materialsData is an array of objects matching the Prisma schema structure
    const result = await prisma.materials.createMany({
      data: materialsData,
      skipDuplicates: true, // Optional: skip rows that would cause unique constraint violations
    });
    console.log(`Saved ${result.count} materials to the database.`);
    return { success: true, count: result.count };
  } catch (error) {
    console.error("Error saving materials to database:", error);
    return { success: false, error: error.message };
  }
};

async function createGradeLevels(data) {
  try {
    const gradeLevels = await prisma.gradeLevels.create({ data });
    return gradeLevels;
  } catch (error) {
    console.error("Error creating grade levels:", error);
    return { success: false, error: error.message };
  }
}

async function createLearningAreas(data) {
  try {
    const learningAreas = await prisma.learningAreas.create({ data });
    return learningAreas;
  } catch (error) {
    console.error("Error creating learning areas:", error);
    return { success: false, error: error.message };
  }
}

async function createTracks(data) {
  try {
    const tracks = await prisma.track.create({ data });
    return tracks;
  } catch (error) {
    console.error("Error creating tracks:", error);
    return { success: false, error: error.message };
  }
}

async function createComponents(data) {
  try {
    const components = await prisma.component.create({ data });
    return components;
  } catch (error) {
    console.error("Error creating components:", error);
    return { success: false, error: error.message };
  }
}

async function createTypes(data) {
  try {
    const types = await prisma.type.create({ data });
    return types;
  } catch (error) {
    console.error("Error creating types:", error);
    return { success: false, error: error.message };
  }
}

async function createStrands(data) {
  try {
    const strands = await prisma.strand.create({ data });
    return strands;
  } catch (error) {
    console.error("Error creating strands:", error);
    return { success: false, error: error.message };
  }
}

async function createSubjectType(data) {
  try {
    const strands = await prisma.subjectType.create({ data });
    return strands;
  } catch (error) {
    console.error("Error creating subject type:", error);
    return { success: false, error: error.message };
  }
}

async function getAllMaterials() {
  try {
    const data = await prisma.materials.findMany();
    return data;
  } catch (error) {
    console.error("Error fetching materials!", error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  getAllMaterials,
  saveMaterialsToDatabase,
  createGradeLevels,
  createLearningAreas,
  createTracks,
  createComponents,
  createStrands,
  createTypes,
  createSubjectType,
  // export other data access functions here
};
