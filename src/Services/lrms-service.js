const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const xlsx = require("xlsx");
const path = require("path");
const fs = require("fs");
const lrmsData = require("../Database/lrms-data");

// Function to check for duplicate materials
const checkDuplicateMaterials = async (materialsData) => {
  try {
    const duplicates = [];
    const nonDuplicates = [];

    // Get all existing materials from the database
    const existingMaterials = await prisma.materials.findMany({
      select: {
        id: true,
        title: true,
        gradeLevelId: true,
        gradeLevel: {
          select: {
            name: true,
          },
        },
      },
    });

    // Check each new material against existing ones
    for (const newMaterial of materialsData) {
      const existingDuplicate = existingMaterials.find(
        (existing) =>
          existing.title.toLowerCase() === newMaterial.title.toLowerCase() &&
          existing.gradeLevelId === newMaterial.gradeLevelId
      );

      if (existingDuplicate) {
        duplicates.push({
          title: newMaterial.title,
          gradeLevel: existingDuplicate.gradeLevel.name,
          existingId: existingDuplicate.id,
        });
      } else {
        nonDuplicates.push(newMaterial);
      }
    }

    return {
      success: true,
      message:
        duplicates.length > 0
          ? "Some duplicates found and will be skipped"
          : "No duplicates found",
      duplicates: duplicates,
      nonDuplicates: nonDuplicates,
      totalDuplicates: duplicates.length,
      totalNonDuplicates: nonDuplicates.length,
    };
  } catch (error) {
    console.error("Error checking for duplicates:", error);
    return {
      success: false,
      message: "Error checking for duplicates",
      error: error.message,
    };
  }
};

// Function to insert materials after duplicate check
const insertMaterials = async (materialsData) => {
  try {
    const saveResult = await lrmsData.saveMaterialsToDatabase(materialsData);
    return {
      success: true,
      message: "Materials saved successfully",
      count: saveResult.count,
      data: materialsData,
    };
  } catch (error) {
    console.error("Error saving materials:", error);
    return {
      success: false,
      message: "Error saving materials",
      error: error.message,
    };
  }
};

const parseExcelFile = async (filePath) => {
  try {
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    const data = xlsx.utils.sheet_to_json(worksheet);

    // console.log("Parsed Excel data:", data);

    // Fetch existing related data and create lookup maps
    const [
      gradeLevels,
      learningAreas,
      tracks,
      components,
      strands,
      subjectTypes,
      types,
    ] = await Promise.all([
      prisma.gradeLevels.findMany(),
      prisma.learningAreas.findMany(),
      prisma.track.findMany(),
      prisma.component.findMany(),
      prisma.strand.findMany(),
      prisma.subjectType.findMany(),
      prisma.type.findMany(),
    ]);

    const gradeLevelMap = gradeLevels.reduce((map, level) => {
      if (level.name) map[level.name] = level.id;
      return map;
    }, {});
    const learningAreaMap = learningAreas.reduce((map, area) => {
      if (area.name) map[area.name] = area.id;
      return map;
    }, {});
    const trackMap = tracks.reduce((map, track) => {
      if (track.name) map[track.name] = track.id;
      return map;
    }, {});
    const componentMap = components.reduce((map, component) => {
      if (component.name) map[component.name] = component.id;
      return map;
    }, {});
    const strandMap = strands.reduce((map, strand) => {
      if (strand.name) map[strand.name] = strand.id;
      return map;
    }, {});
    const typeMap = types.reduce((map, type) => {
      if (type.name) map[type.name] = type.id;
      return map;
    }, {});
    const subjectTypeMap = subjectTypes.reduce((map, type) => {
      map[type.name] = type.id;
      return map;
    }, {});

    const materialsDataForSave = data.map((row) => {
      // Accessing data using bracket notation to handle headers with spaces
      // Assuming Excel column headers match these names (case-sensitive)
      const title = row["Title"];
      const description = row["Description"];
      const downloads = row["Downloads"];
      const rating = row["Rating"];
      const uploadedAt = row["Uploaded At"]; // Assuming 'Uploaded At' header
      const intendedUsers = row["Intended Users"]; // Using 'Intended Users' as requested
      const topic = row["Topic"];
      const language = row["Language"];
      const objective = row["Objective"];
      const educationType = row["Education Type"]; // Assuming 'Education Type' header

      const gradeLevelName = row["Grade Level"];
      const learningAreaName = row["Learning Area"];
      const trackName = row["Track"];
      const componentName = row["Component"];
      const strandName = row["Strand"];
      const typeName = row["Type"];
      const subjectTypeName = row["Subject Type"];

      return {
        title: title,
        description: description,
        downloads: downloads ? parseInt(downloads) : undefined,
        rating: rating ? parseFloat(rating) : undefined,
        uploadedAt: uploadedAt ? new Date(uploadedAt) : new Date(), // Use 'Uploaded At' or current date
        intendedUsers: intendedUsers,
        topic: topic,
        language: language,
        objective: objective,
        educationType: educationType,

        // Map names to IDs using lookup maps. Use null if name is not found.
        gradeLevelId: gradeLevelName ? gradeLevelMap[gradeLevelName] : null,
        learningAreaId: learningAreaName
          ? learningAreaMap[learningAreaName]
          : null,
        trackId: trackName ? trackMap[trackName] : null,
        componentId: componentName ? componentMap[componentName] : null,
        subjectTypeId: subjectTypeName ? subjectTypeMap[subjectTypeName] : null,
        strandId: strandName ? strandMap[strandName] : null,
        typeId: typeName ? typeMap[typeName] : null,
      };
    });

    const materialsDataForResponse = data.map((row) => {
      // Accessing data using bracket notation to handle headers with spaces
      // Assuming Excel column headers match these names (case-sensitive)
      const title = row["Title"];
      const description = row["Description"];
      const downloads = row["Downloads"];
      const rating = row["Rating"];
      const uploadedAt = row["Uploaded At"]; // Assuming 'Uploaded At' header
      const intendedUsers = row["Intended Users"]; // Using 'Intended Users' as requested
      const topic = row["Topic"];
      const language = row["Language"];
      const objective = row["Objective"];
      const educationType = row["Education Type"]; // Assuming 'Education Type' header

      const gradeLevelName = row["Grade Level"];
      const learningAreaName = row["Learning Area"];
      const trackName = row["Track"];
      const componentName = row["Component"];
      const strandName = row["Strand"];
      const typeName = row["Type"];
      const subjectTypeName = row["Subject Type"];

      return {
        title: title,
        description: description,
        downloads: downloads ? parseInt(downloads) : undefined,
        rating: rating ? parseFloat(rating) : undefined,
        uploadedAt: uploadedAt ? new Date(uploadedAt) : new Date(), // Use 'Uploaded At' or current date
        intendedUsers: intendedUsers,
        topic: topic,
        language: language,
        objective: objective,
        educationType: educationType,

        // Include names in the response data
        gradeLevelName: gradeLevelName || null,
        learningAreaName: learningAreaName || null,
        trackName: trackName || null,
        componentName: componentName || null,
        subjectTypeName: subjectTypeName || null,
        strandName: strandName || null,
        typeName: typeName || null,
      };
    });

    // Filter out any materials that might not have a title or other required fields if necessary
    const validMaterialsForSave = materialsDataForSave.filter(
      (material) => material.title
    );
    const validMaterialsForResponse = materialsDataForResponse.filter(
      (material) => material.title
    );

    if (validMaterialsForSave.length > 0) {
      return {
        success: true,
        message: "File parsed successfully",
        data: validMaterialsForSave,
        responseData: validMaterialsForResponse,
      };
    } else {
      return {
        success: false,
        message: "No valid material data found in the file.",
      };
    }
  } catch (error) {
    console.error("Error parsing Excel file:", error);
    return {
      success: false,
      message: "Error processing file",
      error: error.message,
    };
  } finally {
    // Clean up the uploaded file
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      // console.log(`Deleted temporary file: ${filePath}`);
    }
  }
};

async function createGradeLevels(data) {
  try {
    const gradeLevels = await lrmsData.createGradeLevels(data);
    return gradeLevels;
  } catch (error) {
    console.error("Error creating grade levels:", error);
    return { success: false, error: error.message };
  }
}

async function createLearningAreas(data) {
  try {
    const learningAreas = await lrmsData.createLearningAreas(data);
    return learningAreas;
  } catch (error) {
    console.error("Error creating learning areas:", error);
    return { success: false, error: error.message };
  }
}

async function createTracks(data) {
  try {
    const tracks = await lrmsData.createTracks(data);
    return tracks;
  } catch (error) {
    console.error("Error creating tracks:", error);
    return { success: false, error: error.message };
  }
}

async function createComponents(data) {
  try {
    const components = await lrmsData.createComponents(data);
    return components;
  } catch (error) {
    console.error("Error creating components:", error);
    return { success: false, error: error.message };
  }
}

async function createStrands(data) {
  try {
    const strands = await lrmsData.createStrands(data);
    return strands;
  } catch (error) {
    console.error("Error creating strands:", error);
    return { success: false, error: error.message };
  }
}

async function createTypes(data) {
  try {
    const types = await lrmsData.createTypes(data);
    return types;
  } catch (error) {
    console.error("Error creating types:", error);
    return { success: false, error: error.message };
  }
}

async function createSubjectType(data) {
  try {
    const types = await lrmsData.createSubjectType(data);
    return types;
  } catch (error) {
    console.error("Error creating subject type:", error);
    return { success: false, error: error.message };
  }
}

async function updateMaterialWithFile(materialId, materialPath, fileName) {
  try {
    const updatedMaterial = await prisma.materials.update({
      where: { id: materialId },
      data: {
        materialPath: materialPath,
        fileName: fileName,
      },
      include: {
        gradeLevel: true,
        learningArea: true,
        track: true,
        component: true,
        strand: true,
        type: true,
        subjectType: true,
      },
    });

    // Construct the response object with desired fields and names, explicitly excluding related entity ID fields
    const responseMaterial = {
      id: updatedMaterial.id, // Keep the material's own ID
      title: updatedMaterial.title,
      description: updatedMaterial.description,
      uploadedAt: updatedMaterial.uploadedAt,
      downloads: updatedMaterial.downloads,
      rating: updatedMaterial.rating,
      intendedUsers: updatedMaterial.intendedUsers,
      topic: updatedMaterial.topic,
      language: updatedMaterial.language,
      objective: updatedMaterial.objective,
      educationType: updatedMaterial.educationType,
      materialPath: updatedMaterial.materialPath,
      fileName: updatedMaterial.fileName,
      // Include names from the related entities and explicitly exclude their ID fields
      gradeLevelName: updatedMaterial.gradeLevel
        ? updatedMaterial.gradeLevel.name
        : null,
      learningAreaName: updatedMaterial.learningArea
        ? updatedMaterial.learningArea.name
        : null,
      trackName: updatedMaterial.track ? updatedMaterial.track.name : null,
      componentName: updatedMaterial.component
        ? updatedMaterial.component.name
        : null,
      strandName: updatedMaterial.strand ? updatedMaterial.strand.name : null,
      typeName: updatedMaterial.type ? updatedMaterial.type.name : null,
      subjectTypeName: updatedMaterial.subjectType
        ? updatedMaterial.subjectType.name
        : null,
    };

    return {
      success: true,
      message: "Material updated successfully with file info.",
      material: responseMaterial,
    };
  } catch (error) {
    console.error("Error updating material with file info:", error);
    return {
      success: false,
      message: "Failed to update material with file info.",
      error: error.message,
    };
  }
}

async function fetchAllMaterials() {
  try {
    const materials = await prisma.materials.findMany({
      include: {
        // Include related models to get their names
        gradeLevel: true,
        learningArea: true,
        track: true,
        component: true,
        strand: true,
        type: true,
        subjectType: true,
      },
    });

    // Map the result to include names and exclude IDs for related entities
    const materialsWithNames = materials.map((material) => ({
      id: material.id,
      title: material.title,
      description: material.description,
      uploadedAt: material.uploadedAt,
      downloads: material.downloads,
      rating: material.rating,
      intendedUsers: material.intendedUsers,
      topic: material.topic,
      language: material.language,
      objective: material.objective,
      educationType: material.educationType,
      materialPath: material.materialPath,
      fileName: material.fileName,
      // Include names from related entities
      gradeLevelName: material.gradeLevel ? material.gradeLevel.name : null,
      learningAreaName: material.learningArea
        ? material.learningArea.name
        : null,
      trackName: material.track ? material.track.name : null,
      componentName: material.component ? material.component.name : null,
      strandName: material.strand ? material.strand.name : null,
      typeName: material.type ? material.type.name : null,
      subjectTypeName: material.subjectType ? material.subjectType.name : null,
    }));

    return materialsWithNames;
  } catch (error) {
    console.error("Error fetching materials:", error);
    throw new Error("Failed to fetch materials");
  }
}

async function getMaterialWithFile(materialId) {
  try {
    const material = await prisma.materials.findUnique({
      where: { id: materialId },
      include: {
        gradeLevel: true,
        learningArea: true,
        track: true,
        component: true,
        strand: true,
        type: true,
        subjectType: true,
      },
    });

    if (!material) {
      return {
        success: false,
        message: "Material not found",
      };
    }

    // Log the material path for debugging
    // console.log("Material file path:", material.materialPath);

    // Construct the response object with desired fields and names
    const responseMaterial = {
      id: material.id,
      title: material.title,
      description: material.description,
      uploadedAt: material.uploadedAt,
      downloads: material.downloads,
      rating: material.rating,
      intendedUsers: material.intendedUsers,
      topic: material.topic,
      language: material.language,
      objective: material.objective,
      educationType: material.educationType,
      materialPath: material.materialPath,
      fileName: material.fileName,
      // Include names from related entities
      gradeLevelName: material.gradeLevel ? material.gradeLevel.name : null,
      learningAreaName: material.learningArea
        ? material.learningArea.name
        : null,
      trackName: material.track ? material.track.name : null,
      componentName: material.component ? material.component.name : null,
      strandName: material.strand ? material.strand.name : null,
      typeName: material.type ? material.type.name : null,
      subjectTypeName: material.subjectType ? material.subjectType.name : null,
    };

    return {
      success: true,
      message: "Material retrieved successfully",
      material: responseMaterial,
    };
  } catch (error) {
    console.error("Error retrieving material:", error);
    return {
      success: false,
      message: "Failed to retrieve material",
      error: error.message,
    };
  }
}

async function getFilterOptions() {
  try {
    const [
      learningAreas,
      tracks,
      components,
      strands,
      subjectTypes,
      types,
      coreSubjects,
      appliedSubjects,
      specializedSubjects,
    ] = await Promise.all([
      prisma.learningAreas.findMany({
        select: { name: true },
        orderBy: { name: "asc" },
      }),
      prisma.track.findMany({
        select: { name: true },
        orderBy: { name: "asc" },
      }),
      prisma.component.findMany({
        select: { name: true },
        orderBy: { name: "asc" },
      }),
      prisma.strand.findMany({
        select: { name: true },
        orderBy: { name: "asc" },
      }),
      prisma.subjectType.findMany({
        select: { name: true },
        orderBy: { name: "asc" },
      }),
      prisma.type.findMany({
        select: { name: true },
        orderBy: { name: "asc" },
      }),
      prisma.coreSubjects.findMany({
        select: { name: true },
        orderBy: { name: "asc" },
      }),
      prisma.appliedSubjects.findMany({
        select: { name: true },
        orderBy: { name: "asc" },
      }),
      prisma.specializedSubjects.findMany({
        select: { name: true },
        orderBy: { name: "asc" },
      }),
    ]);

    return {
      learningAreas: learningAreas.map((item) => item.name).filter(Boolean),
      tracks: tracks.map((item) => item.name).filter(Boolean),
      components: components.map((item) => item.name).filter(Boolean),
      strands: strands.map((item) => item.name).filter(Boolean),
      subjectTypes: subjectTypes.map((item) => item.name).filter(Boolean),
      types: types.map((item) => item.name).filter(Boolean),
      coreSubjects: coreSubjects.map((item) => item.name).filter(Boolean),
      appliedSubjects: appliedSubjects.map((item) => item.name).filter(Boolean),
      specializedSubjects: specializedSubjects
        .map((item) => item.name)
        .filter(Boolean),
    };
  } catch (error) {
    console.error("Error fetching filter options:", error);
    throw new Error("Failed to fetch filter options");
  }
}

// Replace Prisma CRUDs with lrmsData calls

// Learning Areas CRUD
async function addLearningArea(data) {
  return await lrmsData.addLearningArea(data);
}

async function updateLearningArea(id, data) {
  return await lrmsData.updateLearningArea(id, data);
}

async function deleteLearningArea(id) {
  return await lrmsData.deleteLearningArea(id);
}

// Components CRUD
async function addComponent(data) {
  return await lrmsData.addComponent(data);
}

async function updateComponent(id, data) {
  return await lrmsData.updateComponent(id, data);
}

async function deleteComponent(id) {
  return await lrmsData.deleteComponent(id);
}

// Core Subjects CRUD
async function addCoreSubject(data) {
  return await lrmsData.addCoreSubject(data);
}

async function updateCoreSubject(id, data) {
  return await lrmsData.updateCoreSubject(id, data);
}

async function deleteCoreSubject(id) {
  return await lrmsData.deleteCoreSubject(id);
}

// Tracks CRUD
async function addTrack(data) {
  return await lrmsData.addTrack(data);
}

async function updateTrack(id, data) {
  return await lrmsData.updateTrack(id, data);
}

async function deleteTrack(id) {
  return await lrmsData.deleteTrack(id);
}

// Strands CRUD
async function addStrand(data) {
  return await lrmsData.addStrand(data);
}

async function updateStrand(id, data) {
  return await lrmsData.updateStrand(id, data);
}

async function deleteStrand(id) {
  return await lrmsData.deleteStrand(id);
}

// Applied Subjects CRUD
async function addAppliedSubject(data) {
  return await lrmsData.addAppliedSubject(data);
}

async function updateAppliedSubject(id, data) {
  return await lrmsData.updateAppliedSubject(id, data);
}

async function deleteAppliedSubject(id) {
  return await lrmsData.deleteAppliedSubject(id);
}

// Specialized Subjects CRUD
async function addSpecializedSubject(data) {
  return await lrmsData.addSpecializedSubject(data);
}

async function updateSpecializedSubject(id, data) {
  return await lrmsData.updateSpecializedSubject(id, data);
}

async function deleteSpecializedSubject(id) {
  return await lrmsData.deleteSpecializedSubject(id);
}

// Types CRUD
async function addType(data) {
  return await lrmsData.addType(data);
}

async function updateType(id, data) {
  return await lrmsData.updateType(id, data);
}

async function deleteType(id) {
  return await lrmsData.deleteType(id);
}

module.exports = {
  parseExcelFile,
  checkDuplicateMaterials,
  insertMaterials,
  createGradeLevels,
  createLearningAreas,
  createTracks,
  createComponents,
  createStrands,
  createTypes,
  createSubjectType,
  updateMaterialWithFile,
  fetchAllMaterials,
  getMaterialWithFile,
  getFilterOptions,
  addLearningArea,
  updateLearningArea,
  deleteLearningArea,
  addComponent,
  updateComponent,
  deleteComponent,
  addCoreSubject,
  updateCoreSubject,
  deleteCoreSubject,
  addTrack,
  updateTrack,
  deleteTrack,
  addStrand,
  updateStrand,
  deleteStrand,
  addAppliedSubject,
  updateAppliedSubject,
  deleteAppliedSubject,
  addSpecializedSubject,
  updateSpecializedSubject,
  deleteSpecializedSubject,
  addType,
  updateType,
  deleteType,
};
