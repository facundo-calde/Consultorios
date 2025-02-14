const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const patientRoutes = require('./routes/patientRoutes');
const professionalRoutes = require('./routes/professionalRoutes');
const calendarRoutes = require('./routes/calendarRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();

mongoose.set('useCreateIndex', true);

// Conexión a la base de datos
mongoose.connect('mongodb://localhost:27017/Mi_base_de_datos', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('✅ Conexión exitosa a la base de datos');
})
.catch(err => console.error('❌ Error de conexión:', err));

// **🚀 Asegurarse de que JSON se procese antes de las rutas**
app.use(express.json());  
app.use(express.urlencoded({ extended: true }));  // Opcional para formularios

// **Habilitar CORS**
app.use(cors({
  origin: 'http://127.0.0.1:5500',  
  methods: 'GET,POST,PUT,DELETE',
  allowedHeaders: 'Content-Type,Authorization'
}));

// **Registrar rutas después de configurar JSON y CORS**
app.use('/api/users', userRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/professionals', professionalRoutes);
app.use('/api/calendar', calendarRoutes);

// Iniciar el servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});









