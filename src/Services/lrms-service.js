const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const xlsx = require("xlsx");
const path = require("path");
const fs = require("fs");
const lrmsData = require("../Database/lrms-data");

const parseExcelFile = async (filePath) => {
  try {
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    const data = xlsx.utils.sheet_to_json(worksheet);

    console.log("Parsed Excel data:", data);

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
      const saveResult = await lrmsData.saveMaterialsToDatabase(
        validMaterialsForSave
      );
      return {
        success: true,
        message: "File parsed and data saved successfully",
        count: saveResult.count,
        data: validMaterialsForResponse, // Return data with names
      };
    } else {
      return {
        success: false,
        message: "No valid material data found in the file.",
      };
    }
  } catch (error) {
    console.error("Error parsing and saving Excel file:", error);
    return {
      success: false,
      message: "Error processing file",
      error: error.message,
    };
  } finally {
    // Clean up the uploaded file
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`Deleted temporary file: ${filePath}`);
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

module.exports = {
  fetchAllMaterials,
  parseExcelFile,
  createGradeLevels,
  createLearningAreas,
  createTracks,
  createComponents,
  createStrands,
  createTypes,
  createSubjectType,
  updateMaterialWithFile,
  // export other service functions here
};
