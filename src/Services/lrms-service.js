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
      const competencies = row["Competencies"];
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
        competencies: competencies,
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
      const competencies = row["Competencies"];
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
        competencies: competencies,
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
      competencies: updatedMaterial.competencies,
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
      downloads: material.downloads || 0,
      views: material.views || 0,
      rating: material.rating,
      intendedUsers: material.intendedUsers,
      topic: material.topic,
      competencies: material.competencies,
      language: material.language,
      objective: material.objective,
      educationType: material.educationType,
      materialPath: material.materialPath,
      fileName: material.fileName,
      // Include IDs for grouping/filtering
      typeId: material.typeId,
      gradeLevelId: material.gradeLevelId,
      learningAreaId: material.learningAreaId,
      trackId: material.trackId,
      componentId: material.componentId,
      strandId: material.strandId,
      subjectTypeId: material.subjectTypeId,
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
      downloads: material.downloads || 0,
      views: material.views || 0,
      rating: material.rating,
      intendedUsers: material.intendedUsers,
      topic: material.topic,
      competencies: material.competencies,
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

async function getAllStrands() {
  return await lrmsData.getAllStrands();
}

async function getAllSubjectTypes() {
  return await lrmsData.getAllSubjectTypes();
}

async function addSubjectType(data) {
  return await lrmsData.addSubjectType(data);
}

async function updateSubjectType(id, data) {
  return await lrmsData.updateSubjectType(id, data);
}

async function deleteSubjectType(id) {
  return await lrmsData.deleteSubjectType(id);
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

// Positions CRUD
async function getAllPositions() {
  return await lrmsData.getAllPositions();
}

async function addPosition(data) {
  return await lrmsData.addPosition(data);
}

async function updatePosition(id, data) {
  return await lrmsData.updatePosition(id, data);
}

async function deletePosition(id) {
  return await lrmsData.deletePosition(id);
}

// Schools CRUD
async function getAllSchools() {
  return await lrmsData.getAllSchools();
}

async function addSchool(data) {
  return await lrmsData.addSchool(data);
}

async function updateSchool(id, data) {
  return await lrmsData.updateSchool(id, data);
}

async function deleteSchool(id) {
  return await lrmsData.deleteSchool(id);
}

// Offices CRUD
async function getAllOffices() {
  return await lrmsData.getAllOffices();
}

async function addOffice(data) {
  return await lrmsData.addOffice(data);
}

async function updateOffice(id, data) {
  return await lrmsData.updateOffice(id, data);
}

async function deleteOffice(id) {
  return await lrmsData.deleteOffice(id);
}

// Grade Levels CRUD
async function getAllGradeLevels() {
  return await lrmsData.getAllGradeLevels();
}

async function addGradeLevel(data) {
  return await lrmsData.addGradeLevel(data);
}

async function updateGradeLevel(id, data) {
  return await lrmsData.updateGradeLevel(id, data);
}

async function deleteGradeLevel(id) {
  return await lrmsData.deleteGradeLevel(id);
}

// Learning Areas CRUD - getAll
async function getAllLearningAreas() {
  return await lrmsData.getAllLearningAreas();
}

// Components CRUD - getAll
async function getAllComponents() {
  return await lrmsData.getAllComponents();
}

// Tracks CRUD - getAll
async function getAllTracks() {
  return await lrmsData.getAllTracks();
}

// Types CRUD - getAll
async function getAllTypes() {
  return await lrmsData.getAllTypes();
}

// Function to increment view count for a material
async function incrementMaterialViews(materialId) {
  try {
    const material = await prisma.materials.update({
      where: { id: materialId },
      data: {
        views: {
          increment: 1,
        },
      },
    });
    return {
      success: true,
      views: material.views || 0,
    };
  } catch (error) {
    console.error("Error incrementing material views:", error);
    return {
      success: false,
      message: "Failed to increment material views",
      error: error.message,
    };
  }
}

// Function to increment download count for a material
async function incrementMaterialDownloads(materialId) {
  try {
    // First, get the current material to check if downloads is null
    const currentMaterial = await prisma.materials.findUnique({
      where: { id: materialId },
      select: { downloads: true },
    });

    if (!currentMaterial) {
      return {
        success: false,
        message: "Material not found",
      };
    }

    // If downloads is null or undefined, set it to 1, otherwise increment
    const currentDownloads = currentMaterial.downloads ?? 0;
    const newDownloads = currentDownloads + 1;

    const material = await prisma.materials.update({
      where: { id: materialId },
      data: {
        downloads: newDownloads,
      },
    });

    return {
      success: true,
      downloads: material.downloads || 0,
    };
  } catch (error) {
    console.error("Error incrementing material downloads:", error);
    return {
      success: false,
      message: "Failed to increment material downloads",
      error: error.message,
    };
  }
}

// Function to submit or update a material rating
async function submitMaterialRating(materialId, userId, rating, suggestions) {
  try {
    // Validate rating (1-5)
    if (!rating || rating < 1 || rating > 5) {
      return {
        success: false,
        message: "Rating must be between 1 and 5",
      };
    }

    // Check if user already rated this material
    const existingRating = await prisma.materialRatings.findUnique({
      where: {
        materialId_userId: {
          materialId: materialId,
          userId: userId,
        },
      },
    });

    let result;
    if (existingRating) {
      // Update existing rating
      result = await prisma.materialRatings.update({
        where: { id: existingRating.id },
        data: {
          rating: rating,
          suggestions: suggestions || null,
        },
      });
    } else {
      // Create new rating
      result = await prisma.materialRatings.create({
        data: {
          materialId: materialId,
          userId: userId,
          rating: rating,
          suggestions: suggestions || null,
        },
      });
    }

    // Calculate and update average rating for the material
    await updateMaterialAverageRating(materialId);

    return {
      success: true,
      message: existingRating
        ? "Rating updated successfully"
        : "Rating submitted successfully",
      rating: result,
    };
  } catch (error) {
    console.error("Error submitting material rating:", error);
    return {
      success: false,
      message: "Failed to submit rating",
      error: error.message,
    };
  }
}

// Helper function to calculate and update average rating
async function updateMaterialAverageRating(materialId) {
  try {
    const ratings = await prisma.materialRatings.findMany({
      where: { materialId: materialId },
      select: { rating: true },
    });

    if (ratings.length === 0) {
      await prisma.materials.update({
        where: { id: materialId },
        data: { rating: null },
      });
      return;
    }

    const averageRating =
      ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;

    await prisma.materials.update({
      where: { id: materialId },
      data: { rating: averageRating },
    });
  } catch (error) {
    console.error("Error updating material average rating:", error);
  }
}

// Function to get all ratings for a material
async function getMaterialRatings(materialId) {
  try {
    const ratings = await prisma.materialRatings.findMany({
      where: { materialId: materialId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Calculate average rating
    const averageRating =
      ratings.length > 0
        ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
        : 0;

    return {
      success: true,
      ratings: ratings,
      averageRating: averageRating,
      totalRatings: ratings.length,
    };
  } catch (error) {
    console.error("Error getting material ratings:", error);
    return {
      success: false,
      message: "Failed to get ratings",
      error: error.message,
    };
  }
}

// Function to get user's rating for a specific material
async function getUserRatingForMaterial(materialId, userId) {
  try {
    const rating = await prisma.materialRatings.findUnique({
      where: {
        materialId_userId: {
          materialId: materialId,
          userId: userId,
        },
      },
    });

    return {
      success: true,
      rating: rating,
    };
  } catch (error) {
    console.error("Error getting user rating:", error);
    return {
      success: false,
      message: "Failed to get user rating",
      error: error.message,
    };
  }
}

// Function to update a material rating
async function updateMaterialRating(ratingId, rating, suggestions) {
  try {
    if (!rating || rating < 1 || rating > 5) {
      return {
        success: false,
        message: "Rating must be between 1 and 5",
      };
    }

    const updatedRating = await prisma.materialRatings.update({
      where: { id: ratingId },
      data: {
        rating: rating,
        suggestions: suggestions || null,
      },
    });

    // Update average rating
    await updateMaterialAverageRating(updatedRating.materialId);

    return {
      success: true,
      message: "Rating updated successfully",
      rating: updatedRating,
    };
  } catch (error) {
    console.error("Error updating material rating:", error);
    return {
      success: false,
      message: "Failed to update rating",
      error: error.message,
    };
  }
}

// Function to delete a material rating
async function deleteMaterialRating(ratingId) {
  try {
    const rating = await prisma.materialRatings.findUnique({
      where: { id: ratingId },
    });

    if (!rating) {
      return {
        success: false,
        message: "Rating not found",
      };
    }

    const materialId = rating.materialId;

    await prisma.materialRatings.delete({
      where: { id: ratingId },
    });

    // Update average rating
    await updateMaterialAverageRating(materialId);

    return {
      success: true,
      message: "Rating deleted successfully",
    };
  } catch (error) {
    console.error("Error deleting material rating:", error);
    return {
      success: false,
      message: "Failed to delete rating",
      error: error.message,
    };
  }
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
  addType,
  updateType,
  deleteType,
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
  // Grade Levels CRUD
  getAllGradeLevels,
  addGradeLevel,
  updateGradeLevel,
  deleteGradeLevel,
  // Learning Areas CRUD
  getAllLearningAreas,
  // Components CRUD
  getAllComponents,
  // Tracks CRUD
  getAllTracks,
  // Types CRUD
  getAllTypes,
  incrementMaterialViews,
  incrementMaterialDownloads,
  submitMaterialRating,
  getMaterialRatings,
  getUserRatingForMaterial,
  updateMaterialRating,
  deleteMaterialRating,
};
