const mongoose = require('mongoose');
const Patient = require('./patient');        // Si patient.js está en el mismo directorio
const Profesional = require('./professional'); // Si profesional.js está en el mismo directorio

const turnoSchema = new mongoose.Schema({
  time: {
    type: String,
    required: true,
  },
  date: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    default: 'Disponible',
    enum: ['Disponible', 'Ocupado', 'En ejecución', 'Paciente asistió', 'Paciente no asistió'],  // Con acento en los valores
},
  paciente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Paciente',  // Referencia al modelo Paciente
    required: true,  // Asumimos que siempre debe haber un paciente asignado
  },
  profesional: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Profesional',  // Referencia al modelo Profesional
    required: true,  // Asumimos que siempre debe haber un profesional asignado
  },
  especialidad: {
    type: String,  // Puede ser un string si solo es un nombre de especialidad
    required: true,  // Asumimos que la especialidad es obligatoria
  }
});

const Turno = mongoose.model('Turno', turnoSchema);

module.exports = Turno;






