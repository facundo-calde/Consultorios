const mongoose = require("mongoose");
const fs = require("fs");
const readline = require("readline");
const path = require("path");
const Patient = require("./models/patient");
const Professional = require("./models/professional");

mongoose.connect("mongodb://localhost:27017/Mi_base_de_datos", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const historyFile = "history.jsonl";

// 🔥 Cache de datos para evitar múltiples consultas a la base de datos
let patientMap = new Map();
let professionalMap = new Map();
let professionalResourceMap = new Map(); // Mapa para createdByResourceID
let missingProfessionals = new Set(); // 🔥 Para loggear IDs faltantes

const loadPatientsAndProfessionals = async () => {
  console.log("⏳ Cargando pacientes y profesionales...");
  
  // Cargar pacientes
  const patients = await Patient.find({}, { originalId: 1 });
  patients.forEach(p => patientMap.set(p.originalId, p._id));

  // Cargar profesionales con `tipo`
  const professionals = await Professional.find({}, { nombre: 1, apellido: 1, _id: 1, originalId: 1, tipo: 1 });

  professionals.forEach(pro => {
    if (pro.tipo === "human") {
      const fullName = `${pro.nombre} ${pro.apellido}`.trim().toLowerCase();
      professionalMap.set(fullName, { id: pro._id, tipo: pro.tipo });
    }
    
    if (pro.originalId) {
      professionalResourceMap.set(pro.originalId, { id: pro._id, tipo: pro.tipo });
    }
  });

  console.log(`✅ Cargados ${patients.length} pacientes y ${professionals.length} profesionales.`);
};

// 🔄 Normalizar nombre de "Apellido, Nombre" a "Nombre Apellido"
const normalizeName = (fullName) => {
  if (!fullName.includes(",")) return fullName.trim().toLowerCase();
  const [lastName, firstName] = fullName.split(",").map(s => s.trim());
  return `${firstName} ${lastName}`.toLowerCase();
};

const getFileType = (fileName) => {
  const extension = path.extname(fileName).toLowerCase();
  const mimeTypes = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".pdf": "application/pdf",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".txt": "text/plain"
  };
  return mimeTypes[extension] || "application/octet-stream";
};

const cleanHTML = (html) => html.replace(/<[^>]*>/g, "").trim();

const processHistory = async () => {
  await loadPatientsAndProfessionals();

  const fileStream = fs.createReadStream(historyFile);
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let bulkOperations = [];
  let count = 0;

  for await (const line of rl) {
    try {
      const record = JSON.parse(line);
      if (record.deleted || !record.consumers || record.consumers.length === 0) continue;

      for (const consumer of record.consumers) {
        const originalId = consumer.id;
        if (!originalId) continue;

        const patientId = patientMap.get(originalId);
        if (!patientId) continue;

        let diagnosisDate = new Date(record.date);
        if (isNaN(diagnosisDate.getTime())) {
          diagnosisDate = null;
        }

        // 🔥 Buscar profesional primero por createdByResourceID, luego por nombre
        let professionalData = null;

        if (record.createdByResourceID) {
          professionalData = professionalResourceMap.get(record.createdByResourceID) || null;
          if (!professionalData) {
            console.warn(`⚠️ No se encontró profesional para createdByResourceID: "${record.createdByResourceID}"`);
            missingProfessionals.add(record.createdByResourceID);
          }
        } else if (record.createdByName) {
          const professionalName = normalizeName(record.createdByName);
          professionalData = professionalMap.get(professionalName) || null;

          if (!professionalData) {
            console.warn(`⚠️ No se encontró profesional para createdByName: "${record.createdByName}" (buscado como: "${professionalName}")`);
            missingProfessionals.add(record.createdByName);
          }
        } else {
          console.warn(`⚠️ Registro sin createdByResourceID ni createdByName: ${JSON.stringify(record)}`);
        }

        let historyEntry = {
          condition: record.content ? cleanHTML(record.content) : "Sin descripción",
          diagnosisDate: diagnosisDate,
          treatment: "No especificado",
          doctorNote: "Migrado desde el backup",
          files: [],
          createdBy: professionalData ? professionalData.id : null,
          createdByType: professionalData ? professionalData.tipo : "desconocido"
        };

        if (record.type === "files" && record.link) {
          const fileType = getFileType(record.name || "desconocido");
          historyEntry.files.push({
            fileName: record.fileName || "archivo_sin_nombre",
            fileUrl: record.link,
            fileType: fileType
          });
        }

        bulkOperations.push({
          updateOne: {
            filter: { _id: patientId },
            update: { $push: { medicalHistory: historyEntry } }
          }
        });

        count++;
        if (count % 500 === 0) {
          await executeBulkWrite(bulkOperations, count);
        }
      }
    } catch (error) {
      console.error(`❌ Error procesando línea ${count}:`, error);
    }
  }

  await executeBulkWrite(bulkOperations, count);
  
  console.log("✅ Migración completada.");
  
  // 🔥 Guardar los IDs de profesionales que no se encontraron
  if (missingProfessionals.size > 0) {
    fs.writeFileSync("missing_professionals.log", Array.from(missingProfessionals).join("\n"), "utf8");
    console.warn(`⚠️ Se guardaron los profesionales faltantes en missing_professionals.log`);
  }

  mongoose.connection.close();
};

const executeBulkWrite = async (bulkOperations, count) => {
  if (bulkOperations.length === 0) return;
  try {
    await Patient.bulkWrite(bulkOperations);
    console.log(`✅ Procesados ${count} registros...`);
  } catch (error) {
    console.error("❌ Error en bulkWrite:", error);
  }
  bulkOperations.length = 0;
};

processHistory().catch(console.error);
