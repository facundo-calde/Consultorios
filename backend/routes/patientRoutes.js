const express = require("express");
const router = express.Router();
const patientController = require("../controllers/patientController");
const multer = require("multer");
const path = require("path");

// Configurar almacenamiento de Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");  // Carpeta donde se guardarán las imágenes
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));  // Nombre único
  }
});
const upload = multer({ storage: storage });

// Rutas existentes
router.get("/", patientController.getAllPatients);
router.post("/", patientController.createPatient);
router.get("/buscarPorDNI/:dni", patientController.searchPatientByDNI);
router.delete("/:id", patientController.deletePatient);
router.put("/:id", patientController.updatePatient);
router.get("/buscar/:dni", patientController.searchPatientByDNI);
router.get("/:id", patientController.getPatientById);

// 📌 Nueva ruta para subir imágenes al historial clínico de un paciente
router.post("/upload/:id", upload.single("image"), patientController.uploadMedicalImage);

module.exports = router;







