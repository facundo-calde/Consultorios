const Patient = require("../models/patient");

// Obtener todos los pacientes
exports.getAllPatients = async (req, res) => {
    try {
        const patients = await Patient.find();
        res.json(patients);
    } catch (error) {
        console.error("Error al obtener pacientes:", error);
        res.status(500).json({ error: "Error en el servidor" });
    }
};

// 🔹 Buscar pacientes por coincidencias de DNI
exports.searchPatientByDNI = async (req, res) => {
    let { dni } = req.params;

    // 🔥 Eliminar los puntos del DNI para hacer la búsqueda sin ellos
    dni = dni.replace(/\./g, "");

    try {
        const patients = await Patient.find({ dni: { $regex: `^${dni}`, $options: "i" } });

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
