const express = require('express');
const router = express.Router();
const calendarController = require('../controllers/calendarController'); // Importamos el controlador



// Rutas para las funcionalidades de los turnos
router.get('/turnos/buscar', calendarController.getTurnoByDetails);
router.get('/turnos/:id', calendarController.getTurnoById);
router.get('/turnos/available/:fecha', calendarController.getTurnosDisponiblesPorFecha);  // Obtiene turnos disponibles
router.get('/turnos/ocupados/:fecha/:especialidad', calendarController.getTurnosOcupadosPorFecha);
router.get('/profesionales/disponibles/:fecha', calendarController.getProfesionalesDisponiblesPorFecha); // Obtiene profesionales disponibles
router.post('/turnos/reservar', calendarController.reservarTurno);       // Reserva un turno
router.put('/turnos/modificar/:id', calendarController.modificarTurno);               // Modifica un turno
router.delete('/turnos/eliminar/:id', calendarController.eliminarTurno);             // Elimina un turno
// Exportar el enrutador
module.exports = router;










