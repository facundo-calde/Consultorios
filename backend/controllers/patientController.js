const Patient = require("../models/patient");

// Obtener todos los pacientes
exports.getAllPatients = async (req, res) => {
    // Obtenemos skip y limit desde la query (con valores por defecto)
    const skip = parseInt(req.query.skip) || 0;
    const limit = parseInt(req.query.limit) || 50;
    try {
        const patients = await Patient.find().skip(skip).limit(limit);
        res.json(patients);
    } catch (error) {
        console.error("Error al obtener pacientes:", error);
        res.status(500).json({ error: "Error en el servidor" });
    }
};


// 🔹 Buscar pacientes por coincidencias de DNI
exports.searchPatientByDNI = async (req, res) => {
    let { dni } = req.params;
    // Eliminamos todo lo que no sea dígito para trabajar solo con números
    const cleanDNI = dni.replace(/\D/g, "");
    // Generamos una expresión regular que permita un punto opcional entre cada dígito
    // Por ejemplo, "12345678" se convertirá en "1\.?2\.?3\.?4\.?5\.?6\.?7\.?8"
    const pattern = cleanDNI.split('').join('\\.?');
    
    try {
        const patients = await Patient.find({ dni: { $regex: '^' + pattern, $options: "i" } });
        if (patients.length === 0) {
            return res.status(404).json({ message: "No se encontraron pacientes" });
        }
        res.json(patients);
    } catch (error) {
        console.error("Error al buscar pacientes:", error);
        res.status(500).json({ message: "Error en el servidor" });
    }
};



// 🔹 Crear un nuevo paciente
exports.createPatient = async (req, res) => {
    try {
        const newPatient = new Patient(req.body);
        await newPatient.save();
        res.status(201).json(newPatient);
    } catch (error) {
        console.error("Error al crear paciente:", error);
        res.status(500).json({ error: "Hubo un error al crear el paciente" });
    }
};

// 🔹 Eliminar un paciente
exports.deletePatient = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedPatient = await Patient.findByIdAndDelete(id);

        if (!deletedPatient) {
            return res.status(404).json({ message: "Paciente no encontrado" });
        }

        res.json({ message: "Paciente eliminado correctamente" });
    } catch (error) {
        console.error("Error al eliminar paciente:", error);
        res.status(500).json({ error: "Error en el servidor" });
    }
};

// 🔹 Modificar un paciente
exports.updatePatient = async (req, res) => {
    try {
        const { id } = req.params;
        const updatedPatient = await Patient.findByIdAndUpdate(id, req.body, { new: true });

        if (!updatedPatient) {
            return res.status(404).json({ message: "Paciente no encontrado" });
        }

        res.json(updatedPatient);
    } catch (error) {
        console.error("Error al actualizar paciente:", error);
        res.status(500).json({ error: "Error en el servidor" });
    }
};

exports.getPatientById = async (req, res) => {
    const { id } = req.params;

    try {
        const patient = await Patient.findById(id); // Buscar paciente por ID
        if (!patient) {
            return res.status(404).json({ message: "Paciente no encontrado" });
        }
        res.json(patient);
    } catch (error) {
        console.error("Error al obtener el paciente:", error);
        res.status(500).json({ message: "Error al obtener el paciente" });
    }
};

// 📌 Nueva función para subir imágenes y agregarlas a medicalHistory
exports.uploadMedicalImage = async (req, res) => {
    try {
      const patientId = req.params.id;
  
      // Buscar al paciente en la base de datos
      const patient = await Patient.findById(patientId);
      if (!patient) {
        return res.status(404).json({ message: "Paciente no encontrado" });
      }
  
      // Construir objeto de imagen
      const newImage = {
        fileName: req.file.filename,
        fileUrl: `/uploads/${req.file.filename}`,  // URL del archivo guardado
        fileType: req.file.mimetype
      };
  
      // Agregar la imagen al historial clínico
      patient.medicalHistory.push({
        condition: "Radiografía dental",  // Puedes modificar esto según el caso
        diagnosisDate: new Date(),
        treatment: "Evaluación de caries",
        doctorNote: "Se observa lesión en la pieza dental.",
        files: [newImage],
        createdBy: "Dr. Juan Pérez"  // Puedes pasar esto dinámicamente desde el request
      });
  
      // Guardar los cambios en la base de datos
      await patient.save();
  
      res.json({
        message: "Imagen subida y agregada al historial clínico",
        fileUrl: newImage.fileUrl
      });
  
    } catch (error) {
      console.error("Error al subir imagen:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  };