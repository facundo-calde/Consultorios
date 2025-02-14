const express = require("express");
const router = express.Router();
const patientController = require("../controllers/patientController");

router.get("/", patientController.getAllPatients);
router.post("/", patientController.createPatient);
router.get("/buscarPorDNI/:dni", patientController.searchPatientByDNI);
router.delete("/:id", patientController.deletePatient);
router.put("/:id", patientController.updatePatient);
router.get("/buscar/:dni", patientController.searchPatientByDNI);
module.exports = router;








