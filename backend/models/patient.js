const mongoose = require('mongoose');

// Definir el esquema para el paciente
const patientSchema = new mongoose.Schema({
  originalId: {
    type: String,
    required: true,
    unique: true  // 🔥 Evita duplicados en base al ID original del JSONL
  },
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
        required: false
      },
      doctorNote: {  
        type: String,
        required: false
      },
      files: [{  
        fileName: String,
        fileUrl: String,
        fileType: String
      }],
      createdBy: {  
        type: String,
        required: true
      }
    }
  ],
  dni: {
    type: String,
    required: true,
    unique: true
  },
  coverage: {  
    type: String,
    required: false, 
    default: "Sin Cobertura" 
  }
}, {
  timestamps: true 
});


// Crear el modelo basado en el esquema
const Patient = mongoose.model('Patient', patientSchema);

module.exports = Patient;



