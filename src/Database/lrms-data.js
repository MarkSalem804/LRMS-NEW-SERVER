const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const saveMaterialsToDatabase = async (materialsData) => {
  try {
    // Assuming materialsData is an array of objects matching the Prisma schema structure
    const result = await prisma.materials.createMany({
      data: materialsData,
      skipDuplicates: true, // Optional: skip rows that would cause unique constraint violations
    });
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

// Grade Levels CRUD
async function getAllGradeLevels() {
  try {
    const gradeLevels = await prisma.gradeLevels.findMany({
      orderBy: { createdAt: "desc" },
    });
    return { success: true, data: gradeLevels };
  } catch (error) {
    console.error("Error fetching grade levels:", error);
    return {
      success: false,
      message: "Failed to fetch grade levels",
      error: error.message,
    };
  }
}

async function addGradeLevel(data) {
  try {
    const gradeLevel = await prisma.gradeLevels.create({
      data: {
        name: data.name,
        description: data.description,
      },
    });
    return {
      success: true,
      message: "Grade level added successfully",
      data: gradeLevel,
    };
  } catch (error) {
    console.error("Error adding grade level:", error);
    return {
      success: false,
      message: "Failed to add grade level",
      error: error.message,
    };
  }
}

async function updateGradeLevel(id, data) {
  try {
    const gradeLevel = await prisma.gradeLevels.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
      },
    });
    return {
      success: true,
      message: "Grade level updated successfully",
      data: gradeLevel,
    };
  } catch (error) {
    console.error("Error updating grade level:", error);
    return {
      success: false,
      message: "Failed to update grade level",
      error: error.message,
    };
  }
}

async function deleteGradeLevel(id) {
  try {
    await prisma.gradeLevels.delete({
      where: { id },
    });
    return {
      success: true,
      message: "Grade level deleted successfully",
    };
  } catch (error) {
    console.error("Error deleting grade level:", error);
    return {
      success: false,
      message: "Failed to delete grade level",
      error: error.message,
    };
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
    const subjectType = await prisma.subjectType.create({ data });
    return { success: true, data: subjectType };
  } catch (error) {
    console.error("Error creating subject type:", error);
    return { success: false, error: error.message };
  }
}

async function getAllSubjectTypes() {
  try {
    const subjectTypes = await prisma.subjectType.findMany({
      orderBy: { createdAt: "desc" },
    });
    return { success: true, data: subjectTypes };
  } catch (error) {
    console.error("Error fetching subject types:", error);
    return {
      success: false,
      message: "Failed to fetch subject types",
      error: error.message,
    };
  }
}

async function addSubjectType(data) {
  try {
    const subjectType = await prisma.subjectType.create({
      data: {
        name: data.name,
      },
    });
    return {
      success: true,
      message: "Subject type added successfully",
      data: subjectType,
    };
  } catch (error) {
    console.error("Error adding subject type:", error);
    return {
      success: false,
      message: "Failed to add subject type",
      error: error.message,
    };
  }
}

async function updateSubjectType(id, data) {
  try {
    const subjectType = await prisma.subjectType.update({
      where: { id },
      data: {
        name: data.name,
      },
    });
    return {
      success: true,
      message: "Subject type updated successfully",
      data: subjectType,
    };
  } catch (error) {
    console.error("Error updating subject type:", error);
    return {
      success: false,
      message: "Failed to update subject type",
      error: error.message,
    };
  }
}

async function deleteSubjectType(id) {
  try {
    await prisma.subjectType.delete({
      where: { id },
    });
    return {
      success: true,
      message: "Subject type deleted successfully",
    };
  } catch (error) {
    console.error("Error deleting subject type:", error);
    return {
      success: false,
      message: "Failed to delete subject type",
      error: error.message,
    };
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

async function getMaterialsPaginated({
  page = 1,
  limit = 10,
  search = "",
  type = "",
  grade = "",
  area = "",
  component = "",
  track = "",
  strand = "",
  subjectType = "",
  savedOnly = false,
  userId = null,
} = {}) {
  try {
    const skip = (page - 1) * limit;

    // Build dynamic where clause
    const where = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    if (type) {
      where.type = { name: type };
    }

    if (grade) {
      where.gradeLevel = { name: grade };
    }

    if (area) {
      where.learningArea = { name: area };
    }

    if (component) {
      where.component = { name: component };
    }

    if (track) {
      where.track = { name: track };
    }

    if (strand) {
      where.strand = { name: strand };
    }

    if (subjectType) {
      where.subjectType = { name: subjectType };
    }

    // Filter to only saved materials for a specific user
    if (savedOnly && userId) {
      where.savedMaterials = {
        some: { userId: parseInt(userId) },
      };
    }

    const [total, data] = await Promise.all([
      prisma.materials.count({ where }),
      prisma.materials.findMany({
        where,
        include: {
          gradeLevel: true,
          learningArea: true,
          track: true,
          component: true,
          strand: true,
          type: true,
          subjectType: true,
        },
        orderBy: { uploadedAt: "desc" },
        skip,
        take: limit,
      }),
    ]);

    return { total, data };
  } catch (error) {
    console.error("Error fetching paginated materials!", error);
    throw new Error("Failed to fetch materials: " + error.message);
  }
}


async function deleteMaterial(materialId) {
  try {
    const data = await prisma.materials.delete({
      where: {
        id: materialId,
      },
    });
    return data;
  } catch (error) {
    console.error("Error deleting materials!", error);
    return { success: false, error: error.message };
  }
}

// Learning Areas CRUD
async function getAllLearningAreas() {
  try {
    const learningAreas = await prisma.learningAreas.findMany({
      orderBy: { createdAt: "desc" },
    });
    return { success: true, data: learningAreas };
  } catch (error) {
    console.error("Error fetching learning areas:", error);
    return {
      success: false,
      message: "Failed to fetch learning areas",
      error: error.message,
    };
  }
}

async function addLearningArea(data) {
  try {
    const learningArea = await prisma.learningAreas.create({
      data: {
        name: data.name,
        description: data.description,
      },
    });
    return {
      success: true,
      message: "Learning area added successfully",
      data: learningArea,
    };
  } catch (error) {
    console.error("Error adding learning area:", error);
    return {
      success: false,
      message: "Failed to add learning area",
      error: error.message,
    };
  }
}

async function updateLearningArea(id, data) {
  try {
    const learningArea = await prisma.learningAreas.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
      },
    });
    return {
      success: true,
      message: "Learning area updated successfully",
      data: learningArea,
    };
  } catch (error) {
    console.error("Error updating learning area:", error);
    return {
      success: false,
      message: "Failed to update learning area",
      error: error.message,
    };
  }
}

async function deleteLearningArea(id) {
  try {
    await prisma.learningAreas.delete({
      where: { id },
    });
    return {
      success: true,
      message: "Learning area deleted successfully",
    };
  } catch (error) {
    console.error("Error deleting learning area:", error);
    return {
      success: false,
      message: "Failed to delete learning area",
      error: error.message,
    };
  }
}

// Components CRUD
async function getAllComponents() {
  try {
    const components = await prisma.component.findMany({
      orderBy: { createdAt: "desc" },
    });
    return { success: true, data: components };
  } catch (error) {
    console.error("Error fetching components:", error);
    return {
      success: false,
      message: "Failed to fetch components",
      error: error.message,
    };
  }
}

async function addComponent(data) {
  try {
    const component = await prisma.component.create({
      data: {
        name: data.name,
        description: data.description,
      },
    });
    return {
      success: true,
      message: "Component added successfully",
      data: component,
    };
  } catch (error) {
    console.error("Error adding component:", error);
    return {
      success: false,
      message: "Failed to add component",
      error: error.message,
    };
  }
}

async function updateComponent(id, data) {
  try {
    const component = await prisma.component.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
      },
    });
    return {
      success: true,
      message: "Component updated successfully",
      data: component,
    };
  } catch (error) {
    console.error("Error updating component:", error);
    return {
      success: false,
      message: "Failed to update component",
      error: error.message,
    };
  }
}

async function deleteComponent(id) {
  try {
    await prisma.component.delete({
      where: { id },
    });
    return {
      success: true,
      message: "Component deleted successfully",
    };
  } catch (error) {
    console.error("Error deleting component:", error);
    return {
      success: false,
      message: "Failed to delete component",
      error: error.message,
    };
  }
}

// Core Subjects CRUD
async function addCoreSubject(data) {
  try {
    const coreSubject = await prisma.coreSubjects.create({
      data: {
        name: data.name,
      },
    });
    return {
      success: true,
      message: "Core subject added successfully",
      data: coreSubject,
    };
  } catch (error) {
    console.error("Error adding core subject:", error);
    return {
      success: false,
      message: "Failed to add core subject",
      error: error.message,
    };
  }
}

async function updateCoreSubject(id, data) {
  try {
    const coreSubject = await prisma.coreSubjects.update({
      where: { id },
      data: {
        name: data.name,
      },
    });
    return {
      success: true,
      message: "Core subject updated successfully",
      data: coreSubject,
    };
  } catch (error) {
    console.error("Error updating core subject:", error);
    return {
      success: false,
      message: "Failed to update core subject",
      error: error.message,
    };
  }
}

async function deleteCoreSubject(id) {
  try {
    await prisma.coreSubjects.delete({
      where: { id },
    });
    return {
      success: true,
      message: "Core subject deleted successfully",
    };
  } catch (error) {
    console.error("Error deleting core subject:", error);
    return {
      success: false,
      message: "Failed to delete core subject",
      error: error.message,
    };
  }
}

// Tracks CRUD
async function getAllTracks() {
  try {
    const tracks = await prisma.track.findMany({
      orderBy: { createdAt: "desc" },
    });
    return { success: true, data: tracks };
  } catch (error) {
    console.error("Error fetching tracks:", error);
    return {
      success: false,
      message: "Failed to fetch tracks",
      error: error.message,
    };
  }
}

async function addTrack(data) {
  try {
    const track = await prisma.track.create({
      data: {
        name: data.name,
        description: data.description,
      },
    });
    return {
      success: true,
      message: "Track added successfully",
      data: track,
    };
  } catch (error) {
    console.error("Error adding track:", error);
    return {
      success: false,
      message: "Failed to add track",
      error: error.message,
    };
  }
}

async function updateTrack(id, data) {
  try {
    const track = await prisma.track.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
      },
    });
    return {
      success: true,
      message: "Track updated successfully",
      data: track,
    };
  } catch (error) {
    console.error("Error updating track:", error);
    return {
      success: false,
      message: "Failed to update track",
      error: error.message,
    };
  }
}

async function deleteTrack(id) {
  try {
    await prisma.track.delete({
      where: { id },
    });
    return {
      success: true,
      message: "Track deleted successfully",
    };
  } catch (error) {
    console.error("Error deleting track:", error);
    return {
      success: false,
      message: "Failed to delete track",
      error: error.message,
    };
  }
}

// Strands CRUD
async function addStrand(data) {
  try {
    const strand = await prisma.strand.create({
      data: {
        name: data.name,
        trackId: data.trackId,
      },
    });
    return {
      success: true,
      message: "Strand added successfully",
      data: strand,
    };
  } catch (error) {
    console.error("Error adding strand:", error);
    return {
      success: false,
      message: "Failed to add strand",
      error: error.message,
    };
  }
}

async function updateStrand(id, data) {
  try {
    const strand = await prisma.strand.update({
      where: { id },
      data: {
        name: data.name,
        trackId: data.trackId,
      },
    });
    return {
      success: true,
      message: "Strand updated successfully",
      data: strand,
    };
  } catch (error) {
    console.error("Error updating strand:", error);
    return {
      success: false,
      message: "Failed to update strand",
      error: error.message,
    };
  }
}

async function deleteStrand(id) {
  try {
    await prisma.strand.delete({
      where: { id },
    });
    return {
      success: true,
      message: "Strand deleted successfully",
    };
  } catch (error) {
    console.error("Error deleting strand:", error);
    return {
      success: false,
      message: "Failed to delete strand",
      error: error.message,
    };
  }
}

async function getAllStrands() {
  try {
    const strands = await prisma.strand.findMany({
      include: {
        track: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return { success: true, data: strands };
  } catch (error) {
    console.error("Error fetching strands:", error);
    return {
      success: false,
      message: "Failed to fetch strands",
      error: error.message,
    };
  }
}

// Applied Subjects CRUD
async function addAppliedSubject(data) {
  try {
    const appliedSubject = await prisma.appliedSubjects.create({
      data: {
        name: data.name,
        trackId: data.trackId,
      },
    });
    return {
      success: true,
      message: "Applied subject added successfully",
      data: appliedSubject,
    };
  } catch (error) {
    console.error("Error adding applied subject:", error);
    return {
      success: false,
      message: "Failed to add applied subject",
      error: error.message,
    };
  }
}

async function updateAppliedSubject(id, data) {
  try {
    const appliedSubject = await prisma.appliedSubjects.update({
      where: { id },
      data: {
        name: data.name,
        trackId: data.trackId,
      },
    });
    return {
      success: true,
      message: "Applied subject updated successfully",
      data: appliedSubject,
    };
  } catch (error) {
    console.error("Error updating applied subject:", error);
    return {
      success: false,
      message: "Failed to update applied subject",
      error: error.message,
    };
  }
}

async function deleteAppliedSubject(id) {
  try {
    await prisma.appliedSubjects.delete({
      where: { id },
    });
    return {
      success: true,
      message: "Applied subject deleted successfully",
    };
  } catch (error) {
    console.error("Error deleting applied subject:", error);
    return {
      success: false,
      message: "Failed to delete applied subject",
      error: error.message,
    };
  }
}

// Specialized Subjects CRUD
async function addSpecializedSubject(data) {
  try {
    const specializedSubject = await prisma.specializedSubjects.create({
      data: {
        name: data.name,
        trackId: data.trackId,
        strandId: data.strandId,
      },
    });
    return {
      success: true,
      message: "Specialized subject added successfully",
      data: specializedSubject,
    };
  } catch (error) {
    console.error("Error adding specialized subject:", error);
    return {
      success: false,
      message: "Failed to add specialized subject",
      error: error.message,
    };
  }
}

async function updateSpecializedSubject(id, data) {
  try {
    const specializedSubject = await prisma.specializedSubjects.update({
      where: { id },
      data: {
        name: data.name,
        trackId: data.trackId,
        strandId: data.strandId,
      },
    });
    return {
      success: true,
      message: "Specialized subject updated successfully",
      data: specializedSubject,
    };
  } catch (error) {
    console.error("Error updating specialized subject:", error);
    return {
      success: false,
      message: "Failed to update specialized subject",
      error: error.message,
    };
  }
}

async function deleteSpecializedSubject(id) {
  try {
    await prisma.specializedSubjects.delete({
      where: { id },
    });
    return {
      success: true,
      message: "Specialized subject deleted successfully",
    };
  } catch (error) {
    console.error("Error deleting specialized subject:", error);
    return {
      success: false,
      message: "Failed to delete specialized subject",
      error: error.message,
    };
  }
}

// Types CRUD
async function getAllTypes() {
  try {
    const types = await prisma.type.findMany({
      orderBy: { createdAt: "desc" },
    });
    return { success: true, data: types };
  } catch (error) {
    console.error("Error fetching types:", error);
    return {
      success: false,
      message: "Failed to fetch types",
      error: error.message,
    };
  }
}

async function addType(data) {
  try {
    const type = await prisma.type.create({
      data: {
        name: data.name,
        description: data.description,
      },
    });
    return {
      success: true,
      message: "Type added successfully",
      data: type,
    };
  } catch (error) {
    console.error("Error adding type:", error);
    return {
      success: false,
      message: "Failed to add type",
      error: error.message,
    };
  }
}

async function updateType(id, data) {
  try {
    const type = await prisma.type.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
      },
    });
    return {
      success: true,
      message: "Type updated successfully",
      data: type,
    };
  } catch (error) {
    console.error("Error updating type:", error);
    return {
      success: false,
      message: "Failed to update type",
      error: error.message,
    };
  }
}

async function deleteType(id) {
  try {
    await prisma.type.delete({
      where: { id },
    });
    return {
      success: true,
      message: "Type deleted successfully",
    };
  } catch (error) {
    console.error("Error deleting type:", error);
    return {
      success: false,
      message: "Failed to delete type",
      error: error.message,
    };
  }
}

// Positions CRUD
async function getAllPositions() {
  try {
    const positions = await prisma.positions.findMany({
      orderBy: { createdAt: "desc" },
    });
    return {
      success: true,
      data: positions,
    };
  } catch (error) {
    console.error("Error fetching positions:", error);
    return {
      success: false,
      message: "Failed to fetch positions",
      error: error.message,
    };
  }
}

async function addPosition(data) {
  try {
    const position = await prisma.positions.create({
      data: {
        name: data.name,
        description: data.description,
      },
    });
    return {
      success: true,
      message: "Position added successfully",
      data: position,
    };
  } catch (error) {
    console.error("Error adding position:", error);
    return {
      success: false,
      message: "Failed to add position",
      error: error.message,
    };
  }
}

async function updatePosition(id, data) {
  try {
    const position = await prisma.positions.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
      },
    });
    return {
      success: true,
      message: "Position updated successfully",
      data: position,
    };
  } catch (error) {
    console.error("Error updating position:", error);
    return {
      success: false,
      message: "Failed to update position",
      error: error.message,
    };
  }
}

async function deletePosition(id) {
  try {
    await prisma.positions.delete({
      where: { id },
    });
    return {
      success: true,
      message: "Position deleted successfully",
    };
  } catch (error) {
    console.error("Error deleting position:", error);
    return {
      success: false,
      message: "Failed to delete position",
      error: error.message,
    };
  }
}

// Schools CRUD
async function getAllSchools() {
  try {
    const schools = await prisma.schools.findMany({
      orderBy: { createdAt: "desc" },
    });
    return {
      success: true,
      data: schools,
    };
  } catch (error) {
    console.error("Error fetching schools:", error);
    return {
      success: false,
      message: "Failed to fetch schools",
      error: error.message,
    };
  }
}

async function addSchool(data) {
  try {
    const school = await prisma.schools.create({
      data: {
        name: data.name,
        description: data.description,
      },
    });
    return {
      success: true,
      message: "School added successfully",
      data: school,
    };
  } catch (error) {
    console.error("Error adding school:", error);
    return {
      success: false,
      message: "Failed to add school",
      error: error.message,
    };
  }
}

async function updateSchool(id, data) {
  try {
    const school = await prisma.schools.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
      },
    });
    return {
      success: true,
      message: "School updated successfully",
      data: school,
    };
  } catch (error) {
    console.error("Error updating school:", error);
    return {
      success: false,
      message: "Failed to update school",
      error: error.message,
    };
  }
}

async function deleteSchool(id) {
  try {
    await prisma.schools.delete({
      where: { id },
    });
    return {
      success: true,
      message: "School deleted successfully",
    };
  } catch (error) {
    console.error("Error deleting school:", error);
    return {
      success: false,
      message: "Failed to delete school",
      error: error.message,
    };
  }
}

// Offices CRUD
async function getAllOffices() {
  try {
    const offices = await prisma.offices.findMany({
      orderBy: { createdAt: "desc" },
    });
    return {
      success: true,
      data: offices,
    };
  } catch (error) {
    console.error("Error fetching offices:", error);
    return {
      success: false,
      message: "Failed to fetch offices",
      error: error.message,
    };
  }
}

async function addOffice(data) {
  try {
    const office = await prisma.offices.create({
      data: {
        name: data.name,
        description: data.description,
      },
    });
    return {
      success: true,
      message: "Office added successfully",
      data: office,
    };
  } catch (error) {
    console.error("Error adding office:", error);
    return {
      success: false,
      message: "Failed to add office",
      error: error.message,
    };
  }
}

async function updateOffice(id, data) {
  try {
    const office = await prisma.offices.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
      },
    });
    return {
      success: true,
      message: "Office updated successfully",
      data: office,
    };
  } catch (error) {
    console.error("Error updating office:", error);
    return {
      success: false,
      message: "Failed to update office",
      error: error.message,
    };
  }
}

async function deleteOffice(id) {
  try {
    await prisma.offices.delete({
      where: { id },
    });
    return {
      success: true,
      message: "Office deleted successfully",
    };
  } catch (error) {
    console.error("Error deleting office:", error);
    return {
      success: false,
      message: "Failed to delete office",
      error: error.message,
    };
  }
}

module.exports = {
  deleteMaterial,
  getAllMaterials,
  getMaterialsPaginated,
  saveMaterialsToDatabase,
  createGradeLevels,
  createLearningAreas,
  createTracks,
  createComponents,
  createStrands,
  createTypes,
  createSubjectType,
  // export other data access functions here
  getAllLearningAreas,
  addLearningArea,
  updateLearningArea,
  deleteLearningArea,
  getAllComponents,
  addComponent,
  updateComponent,
  deleteComponent,
  addCoreSubject,
  updateCoreSubject,
  deleteCoreSubject,
  getAllTracks,
  addTrack,
  updateTrack,
  deleteTrack,
  addStrand,
  updateStrand,
  deleteStrand,
  getAllStrands,
  getAllSubjectTypes,
  addSubjectType,
  updateSubjectType,
  deleteSubjectType,
  addAppliedSubject,
  updateAppliedSubject,
  deleteAppliedSubject,
  addSpecializedSubject,
  updateSpecializedSubject,
  deleteSpecializedSubject,
  getAllTypes,
  addType,
  updateType,
  deleteType,
  getAllGradeLevels,
  addGradeLevel,
  updateGradeLevel,
  deleteGradeLevel,
  getAllPositions,
  addPosition,
  updatePosition,
  deletePosition,
  getAllSchools,
  addSchool,
  updateSchool,
  deleteSchool,
  getAllOffices,
  addOffice,
  updateOffice,
  deleteOffice,
};
