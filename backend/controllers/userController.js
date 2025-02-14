const User = require('../models/User');
const Profesional = require('../models/professional'); // Importar el modelo Profesional
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const login = async (req, res) => {
  try {
    console.log("🔍 Recibida solicitud de login con:", req.body);

    const { username, password } = req.body;

    // Buscar usuario en la base de datos
    const user = await User.findOne({ username }).populate('professional'); // Popular datos del profesional si es necesario

    if (!user) {
      console.log("❌ Usuario no encontrado:", username);
      return res.status(400).json({ message: "Usuario o contraseña incorrectos" });
    }

    console.log("🔍 Usuario encontrado:", user);

    // Comparar la contraseña
    const isMatch = await bcrypt.compare(password, user.password);
    console.log("🔍 Comparación de contraseña:", isMatch);

    if (!isMatch) {
      console.log("❌ Contraseña incorrecta para usuario:", username);
      return res.status(400).json({ message: "Usuario o contraseña incorrectos" });
    }

    // Generar token JWT
    const token = jwt.sign({ id: user._id, role: user.role }, 'secreto_super_seguro', { expiresIn: '1h' });

    console.log("✅ Login exitoso:", user.username, "Rol:", user.role);

    res.json({
      token,
      user: {
        username: user.username,
        role: user.role,
        professionalData: user.role === 'profesional' ? user.professional : null
      }
    });

  } catch (error) {
    console.error("🔥 Error en login:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};

module.exports = { login };
