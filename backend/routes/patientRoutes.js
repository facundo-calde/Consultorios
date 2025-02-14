const express = require("express");
const router = express.Router();
const patientController = require("../controllers/patientController");

// Rutas existentes
router.get("/", patientController.getAllPatients);
router.post("/", patientController.createPatient);
router.get("/buscarPorDNI/:dni", patientController.searchPatientByDNI);
router.delete("/:id", patientController.deletePatient);
router.put("/:id", patientController.updatePatient);
router.get("/buscar/:dni", patientController.searchPatientByDNI);
router.get("/:id", patientController.getPatientById);

module.exports = router;






