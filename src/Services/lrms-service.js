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

    const materialsData = data.map((row) => {
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

    // Filter out any materials that might not have a title or other required fields if necessary
    const validMaterials = materialsData.filter((material) => material.title);

    if (validMaterials.length > 0) {
      const saveResult = await lrmsData.saveMaterialsToDatabase(validMaterials);
      return {
        success: true,
        message: "File parsed and data saved successfully",
        count: saveResult.count,
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

module.exports = {
  parseExcelFile,
  createGradeLevels,
  createLearningAreas,
  createTracks,
  createComponents,
  createStrands,
  createTypes,
  createSubjectType,
  // export other service functions here
};
