const express = require('express');
const router = express.Router();
const Profesional = require('../models/professional'); // Importar el modelo Profesional

// Ruta POST para crear un nuevo profesional
router.post('/', async (req, res) => {
  try {
    // Crear un nuevo profesional con los datos recibidos
    const newProfessional = new Profesional(req.body);
    
    // Guardar el profesional en la base de datos
    await newProfessional.save();
    
    // Responder con el profesional creado
    res.status(201).json(newProfessional);
  } catch (error) {
    // Manejo de errores
    console.error('Error al crear profesional:', error);
    res.status(500).json({ error: 'Hubo un error al crear el profesional' });
  }
});

// Ruta GET para obtener todos los profesionales
router.get('/', async (req, res) => {
  try {
    // Obtener todos los profesionales de la base de datos
    const professionals = await Profesional.find();
    
    // Responder con los profesionales encontrados
    res.status(200).json(professionals);
  } catch (error) {
    // Manejo de errores
    console.error('Error al obtener los profesionales:', error);
    res.status(500).json({ error: 'Hubo un error al obtener los profesionales' });
  }
});

module.exports = router;


