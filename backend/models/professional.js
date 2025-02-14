const mongoose = require('mongoose');

const profesionalSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,  // Aseguramos que el nombre sea obligatorio
    maxlength: 100,  // Limitar el largo del nombre
  },
  apellido: {
    type: String,
    required: true,  // Aseguramos que el apellido sea obligatorio
    maxlength: 100,  // Limitar el largo del apellido
  },
  dni: {
    type: String,
    required: true,  // Aseguramos que el DNI sea obligatorio
    unique: true,  // El DNI debe ser único
    minlength: 7,  // El mínimo de caracteres de un DNI (esto puede variar según país)
    maxlength: 8,  // El máximo de caracteres de un DNI
  },
  email: {
    type: String,
    required: true,  // Aseguramos que el correo electrónico sea obligatorio
    unique: true,  // Aseguramos que no se repita
    match: /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/,  // Validación simple para un correo electrónico
  },
  especialidad: {
    type: [String],
    required: true,  // Aseguramos que la especialidad sea obligatoria
  },
  diasLaborales: {
    type: [String],  // Es un array de strings para representar los días laborales
    required: true,  // Aseguramos que siempre haya días laborales
    enum: ['lunes', 'martes', 'miércoles', 'jueves', 'viernes'],  // Los días de la semana como valores posibles
  },
});

const Profesional = mongoose.model('professional', profesionalSchema);

module.exports = Profesional;
