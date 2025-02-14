const mongoose = require('mongoose');

// Definir el esquema para el paciente
const patientSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  dateOfBirth: {
    type: Date,
    required: true
  },
  gender: {
    type: String,
    enum: ['masculino', 'femenino', 'otro'],
    required: true
  },
  phoneNumber: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  address: {
    street: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    zipCode: {
      type: String,
      required: true
    }
  },
  medicalHistory: [
    {
      condition: {
        type: String,
        required: true
      },
      diagnosisDate: {
        type: Date,
        required: true
      },
      treatment: {
        type: String,
        required: true
      },
      doctorNote: {
        type: String,
        required: true
      },
      files: [{ 
        fileName: String,
        fileUrl: String,
        fileType: String
      }]
    }
  ],
  dni: {
    type: String,
    required: true,
    unique: true
  },
  coverage: {  // 🔥 Nuevo campo agregado para cobertura médica
    type: String,
    required: false, // No es obligatorio
    default: "Sin Cobertura" // Valor por defecto
  }
}, {
  timestamps: true 
});

// Crear el modelo basado en el esquema
const Patient = mongoose.model('Patient', patientSchema);

module.exports = Patient;


