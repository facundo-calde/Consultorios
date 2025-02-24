const mongoose = require("mongoose");
const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const { v4: uuidv4 } = require("uuid");
const Patient = require("./models/patient");

// 📌 Conectar a MongoDB
mongoose.connect("mongodb://localhost:27017/Mi_base_de_datos", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

mongoose.connection.on("error", (err) => {
  console.error("❌ Error de conexión a MongoDB:", err);
});

// 📌 Directorio base para descargas
const fileDir = path.join(__dirname, "files");

// 📌 Función para descargar todos los archivos sin modificar la base de datos
const downloadFiles = async () => {
  if (!fs.existsSync(fileDir)) fs.mkdirSync(fileDir);

  // 📌 Buscar pacientes con archivos en el historial médico
  const patients = await Patient.find({ "medicalHistory.files.fileUrl": { $exists: true, $ne: "" } });

  for (const patient of patients) {
    const patientDir = path.join(fileDir, patient.dni || `dni_desconocido_${uuidv4()}`);
    if (!fs.existsSync(patientDir)) fs.mkdirSync(patientDir);

    for (const record of patient.medicalHistory) {
      for (const file of record.files) {
        if (file.fileUrl.startsWith("http")) {
          const fileName = `${uuidv4()}_${path.basename(file.fileUrl)}`;
          const filePath = path.join(patientDir, fileName);

          // 📌 Verificar si ya existe el archivo
          if (fs.existsSync(filePath)) {
            console.log(`⚠️ Archivo ya existe, se omite: ${fileName}`);
            continue;
          }

          try {
            const response = await axios({ url: file.fileUrl, method: "GET", responseType: "stream" });
            const writer = fs.createWriteStream(filePath);
            response.data.pipe(writer);
            await new Promise((resolve, reject) => {
              writer.on("finish", resolve);
              writer.on("error", reject);
            });

            console.log(`✅ Archivo descargado: ${fileName}`);

          } catch (error) {
            console.error(`❌ Error descargando ${file.fileUrl}:`, error.message);
          }
        }
      }
    }
  }

  console.log("✅ Descarga de archivos completada.");
  mongoose.connection.close();
};

// 📌 Ejecutar la función de descarga de archivos
downloadFiles();

