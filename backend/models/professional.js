const mongoose = require("mongoose");

const profesionalSchema = new mongoose.Schema({
  originalId: {
    type: String,
    required: true,
    unique: true,
  },
  nombre: {
    type: String,
    required: true,
    maxlength: 100,
  },
  apellido: {
    type: String,
    required: true,
    maxlength: 100,
  },
  dni: {
    type: String,
    required: false, // 🔥 Cambiar a "false" para permitir valores nulos o "N/A"
    unique: false,   // 🔥 Eliminar la restricción de unicidad para evitar duplicados
  },
  email: {
    type: String,
    required: false, // 🔥 Cambiar a "false" para evitar problemas con dispositivos
    unique: false,   // 🔥 Evita errores de duplicados en emails
  },
  especialidad: {
    type: [String],
    required: false,
  },
  diasLaborales: {
    type: [String],
    required: false,
    enum: ["lunes", "martes", "miércoles", "jueves", "viernes"],
  },
  tipo: {
    type: String,
    enum: ["human", "device"],
    required: true,
  },
  eliminado: {
    type: Boolean,
    default: false,
  },
});

const Professional = mongoose.model("professional", profesionalSchema);

module.exports = Professional;
