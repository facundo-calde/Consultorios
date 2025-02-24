const mongoose = require("mongoose");
const fs = require("fs");
const readline = require("readline");
const Professional = require("./models/professional");

mongoose.connect("mongodb://localhost:27017/Mi_base_de_datos", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const professionalsFile = "resources.jsonl";

const processProfessionals = async () => {
  const fileStream = fs.createReadStream(professionalsFile);
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let bulkOperations = [];
  let count = 0;

  for await (const line of rl) {
    try {
      const record = JSON.parse(line);
      const originalId = record.id || `id_desconocido_${count}`;

      let professionalData = {
        originalId: originalId,
        tipo: record.type, // 🔥 Guarda si es "human" o "device"
        eliminado: record.deleted || false
      };

      if (record.type === "human") {
        // 📌 Datos para humanos
        professionalData.nombre = record.firstName ? record.firstName.trim() : "Desconocido";
        professionalData.apellido = record.lastName ? record.lastName.trim() : "Desconocido";
        professionalData.dni = record.docs?.[0]?.value || null; // 🔥 Deja NULL si no hay DNI
        professionalData.email = record.emails?.[0] || `no-email-${originalId}@example.com`;
        professionalData.especialidad = Array.isArray(record.specialties)
          ? record.specialties.map(s => s.label)
          : ["Indefinida"];
        professionalData.diasLaborales = [];

      } else if (record.type === "device") {
        // 📌 Datos para dispositivos
        professionalData.nombre = record.label || "Dispositivo sin nombre";
        professionalData.apellido = "N/A"; // No aplica para dispositivos
        professionalData.dni = null; // 🔥 Ahora es NULL, evitando duplicados
        professionalData.email = `device-${originalId}@example.com`;
        professionalData.especialidad = ["Dispositivo"];
        professionalData.diasLaborales = [];
      }

      // 📌 Agregar operación de inserción en lote
      bulkOperations.push({
        updateOne: {
          filter: { originalId: professionalData.originalId },
          update: { $set: professionalData },
          upsert: true
        }
      });

      count++;
      if (count % 500 === 0) {
        await Professional.bulkWrite(bulkOperations);
        console.log(`✅ Procesados ${count} registros...`);
        bulkOperations = [];
      }

    } catch (error) {
      console.error(`❌ Error procesando línea: ${line}, error:`, error);
    }
  }

  if (bulkOperations.length > 0) {
    await Professional.bulkWrite(bulkOperations);
  }

  console.log("✅ Migración completada.");
  mongoose.connection.close();
};

// 🔥 Ejecutar la migración
processProfessionals().catch(console.error);

