const Turno = require('../models/turno');
const Profesional = require('../models/professional');
const mongoose = require('mongoose'); // Para manejar correctamente ObjectId
const patientController = require('../controllers/patientController');  // Asegúrate de usar la ruta correcta
const Patient = require('../models/patient');  // Asegúrate de que el path es correcto

exports.getTurnosOcupadosPorFecha = async (req, res) => {
  const { fecha, especialidad } = req.params;

  console.log("📢 Parámetros recibidos en la API:", { fecha, especialidad });

  const normalizedSpecialty = removeAccents(especialidad.toLowerCase());
  console.log("📢 Especialidad normalizada:", normalizedSpecialty);

  try {
    // Asegúrate de que la fecha que pasas a la consulta sea una cadena en formato YYYY-MM-DD
    const normalizedFecha = fecha;  // Asumimos que ya tienes la fecha en el formato adecuado (YYYY-MM-DD)

    // Buscar los turnos ocupados para la fecha específica
    const turnosOcupados = await Turno.find({
      date: normalizedFecha,  // Compara directamente la fecha como cadena
      status: 'ocupado'
    }).lean();

    console.log("📢 Turnos ocupados encontrados:", turnosOcupados);

    // Filtrar por especialidad
    const filteredTurnos = turnosOcupados.filter(turno =>
      removeAccents(turno.especialidad.toLowerCase()) === normalizedSpecialty
    );

    console.log("📢 Turnos ocupados después de filtrar por especialidad:", filteredTurnos);

    res.json(filteredTurnos);
  } catch (error) {
    console.error("❌ Error al obtener los turnos ocupados:", error);
    res.status(500).json({ message: "Error al obtener los turnos ocupados" });
  }
};

// Función para eliminar acentos
function removeAccents(str) {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}


// Obtener turnos disponibles por fecha
exports.getTurnosDisponiblesPorFecha = async (req, res) => {
  const { fecha } = req.params;
  try {
    const turnos = await Turno.find({ date: fecha });
    res.json(turnos.length === 0 ? [] : turnos);
  } catch (error) {
    console.error('Error al obtener los turnos disponibles:', error);
    res.status(500).json({ message: 'Error al obtener los turnos disponibles' });
  }
};

exports.getProfesionalesDisponiblesPorFecha = async (req, res) => {
  let { fecha } = req.params;

  try {
    console.log("📢 Fecha recibida (antes de procesar):", fecha);

    // 🔹 Asegurar que la fecha sea YYYY-MM-DD antes de procesarla
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      return res.status(400).json({ message: "Formato de fecha inválido. Se espera YYYY-MM-DD" });
    }

    // 🔹 Crear un objeto Date de forma segura
    const dateObj = new Date(`${fecha}T00:00:00Z`); // Aseguramos que la fecha esté en UTC
    
    // 🔹 Función para normalizar el texto
    const normalizeText = text => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

    // 🔹 Obtener el día de la semana correctamente y normalizarlo
    const dayOfWeek = normalizeText(
        new Intl.DateTimeFormat('es-ES', { weekday: 'long', timeZone: 'UTC' }).format(dateObj)
    );

    console.log("📅 Día de la semana detectado (normalizado):", dayOfWeek);

    // 🔹 Buscar en la base de datos
    const profesionalesDisponibles = await Profesional.find({}).lean(); // Obtener todos

    // 🔹 Normalizar y filtrar los profesionales disponibles
    const filteredProfessionals = profesionalesDisponibles.filter(prof => {
        const normalizedWorkDays = prof.diasLaborales.map(dia => normalizeText(dia));
        return normalizedWorkDays.includes(dayOfWeek);
    });

    console.log("📢 Profesionales filtrados:", filteredProfessionals);

    if (filteredProfessionals.length === 0) {
      return res.status(404).json({ message: "No hay profesionales disponibles para esta fecha." });
    }

    res.json(filteredProfessionals);
  } catch (error) {
    console.error("❌ Error al obtener los profesionales disponibles:", error);
    res.status(500).json({ message: "Error al obtener los profesionales disponibles" });
  }
};





// Reservar turno
exports.reservarTurno = async (req, res) => {
  console.log("📌 Datos recibidos en reservarTurno:", req.body);

  let { hora, fecha, paciente, profesional, especialidad } = req.body;

  // Validar que todos los datos estén presentes
  if (!hora || !fecha || !paciente || !profesional || !especialidad) {
    console.error("⛔ ERROR: Faltan datos para la reserva.");
    return res.status(400).json({ message: "Faltan datos para la reserva" });
  }

  try {
    // 🔹 Buscar al paciente en la base de datos por su `DNI`
    const pacienteInfo = await Patient.findOne({ dni: paciente });

    if (!pacienteInfo) {
      console.error("⛔ ERROR: Paciente no encontrado con DNI:", paciente);
      return res.status(400).json({ message: "Paciente no encontrado en la base de datos." });
    }

    console.log("✅ Paciente encontrado con ID:", pacienteInfo._id);
    paciente = pacienteInfo._id; // ✅ Guardamos el _id en lugar del DNI

    // 🔹 Verificar si el profesional existe en la base de datos
    const profesionalInfo = await Profesional.findById(profesional);

    if (!profesionalInfo) {
      console.error("⛔ ERROR: Profesional no encontrado con ID:", profesional);
      return res.status(400).json({ message: "Profesional no encontrado en la base de datos." });
    }

    console.log("✅ Profesional encontrado:", profesionalInfo.nombre, profesionalInfo.apellido);

    // 🔹 Verificar si ya existe un turno para esta fecha, hora y profesional
    let turnoExistente = await Turno.findOne({ time: hora, date: fecha, profesional });

    if (turnoExistente) {
      console.error("⛔ ERROR: El turno ya está reservado.");
      return res.status(400).json({ message: "El turno ya está reservado" });
    }

    // 🔹 Crear el nuevo turno usando el `_id` del paciente en lugar del `DNI`
    const nuevoTurno = new Turno({
      time: hora,
      date: fecha,
      status: "ocupado",
      paciente: new mongoose.Types.ObjectId(paciente),  // ✅ Convertimos a ObjectId
      profesional: new mongoose.Types.ObjectId(profesional),  // ✅ Convertimos también el profesional
      especialidad
    });

    await nuevoTurno.save();
    console.log("✅ Nuevo turno creado con ID:", nuevoTurno._id);

    return res.status(201).json(nuevoTurno); // Devuelve el turno con el `_id` generado automáticamente
  } catch (error) {
    console.error("❌ Error en la reserva de turno:", error);
    return res.status(500).json({ message: "Error al reservar el turno", error: error.message });
  }
};


// Eliminar un turno
exports.eliminarTurno = async (req, res) => {
  const { id } = req.params;

  console.log("🗑️ ID recibido para eliminar:", id);

  if (!mongoose.Types.ObjectId.isValid(id)) {
    console.error("⛔ ID inválido:", id);
    return res.status(400).json({ message: "ID de turno inválido." });
  }

  try {
    const turnoEliminado = await Turno.findByIdAndDelete(id);

    if (!turnoEliminado) {
      return res.status(404).json({ message: "Turno no encontrado." });
    }

    console.log("✅ Turno eliminado:", turnoEliminado);
    return res.json({ message: "Turno eliminado correctamente.", turno: turnoEliminado });
  } catch (error) {
    console.error("❌ Error al eliminar el turno:", error);
    return res.status(500).json({ message: "Error al eliminar el turno.", error: error.message });
  }
};


// Modificar un turno
exports.modificarTurno = async (req, res) => {
  const { id } = req.params; // Asegúrate de que el id esté presente en los parámetros de la URL
  const { status } = req.body; // El nuevo estado

  try {
    // Buscar el turno por ID
    const turno = await Turno.findById(id);
    if (!turno) {
      return res.status(404).json({ message: 'Turno no encontrado' });
    }

    // Actualizar el estado del turno
    turno.status = status; // Solo cambiamos el estado, no la hora

    // Guardar los cambios
    await turno.save();

    return res.json({
      message: "Turno actualizado correctamente",
      turno: turno
    });
  } catch (error) {
    console.error("Error al modificar el turno:", error);
    res.status(500).json({ message: "Hubo un problema al modificar el turno", error: error.message });
  }
};



exports.getTurnoByDetails = async (req, res) => {
  const { date, time, specialty } = req.query;
  console.log("📌 Parámetros recibidos en la API:", { date, time, specialty });

  if (!date || !time || !specialty) {
    return res.status(400).json({ message: "Faltan parámetros requeridos" });
  }

  try {
    const turno = await Turno.findOne({ date, time, especialidad: specialty }).lean();

    if (!turno) {
      console.log("✅ No hay turno reservado para este horario, está disponible.");
      return res.json({ available: true });  // ⬅️ Nueva respuesta cuando el turno no existe
    }

    console.log("✅ Turno encontrado:", turno);
    return res.json(turno);  // ⬅️ Si hay un turno reservado, lo devuelve normalmente

  } catch (error) {
    console.error("❌ Error al obtener el turno:", error);
    return res.status(500).json({ message: "Error al obtener el turno", error: error.message });
  }
};



// Función para obtener un turno por su ID
exports.getTurnoById = async (req, res) => {
  const { id } = req.params;  // Obtener el ID del turno de los parámetros de la URL

  try {
    const turno = await Turno.findById(id);  // Buscar el turno en la base de datos por su ID
    if (!turno) {
      return res.status(404).json({ message: 'Turno no encontrado' });
    }
    return res.json(turno);  // Retornar el turno encontrado
  } catch (error) {
    console.error('Error al obtener el turno:', error);
    return res.status(500).json({ message: 'Error al obtener el turno', error: error.message });
  }
};

// Obtener los profesionales disponibles por especialidad
exports.getProfesionalesPorEspecialidad = async (req, res) => {
  const { especialidad } = req.params;

  try {
    const profesionales = await Profesional.find({ especialidad: especialidad }).lean();
    res.json(profesionales);
  } catch (error) {
    console.error("❌ Error al obtener los profesionales:", error);
    res.status(500).json({ message: "Error al obtener los profesionales" });
  }
};




