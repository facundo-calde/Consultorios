const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost/tu_base_de_datos', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Conexión exitosa a la base de datos');
}).catch((error) => {
  console.error('Error de conexión a la base de datos:', error);
});
