const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['recepción', 'profesional', 'admin'], 
    required: true, 
    default: 'recepción'
  },
  professional: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'professional', // Referencia al modelo Profesional
    required: function() { return this.role === 'profesional'; } // Solo requerido si es profesional
  }
});

// Método para comparar contraseñas
UserSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', UserSchema);

