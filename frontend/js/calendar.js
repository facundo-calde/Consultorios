document.addEventListener('DOMContentLoaded', function () {
  console.log('DOM completamente cargado');


  const calendarEl = document.getElementById('calendar');
  let selectedDate = '';  // Variable global para almacenar la fecha seleccionada
  let selectedSlot = '';  // Variable global para almacenar el turno seleccionado
  let selectedSpecialty = 'odontologia';


  // Función para actualizar la especialidad seleccionada cuando se cambia el valor del select de especialidad
  const specialtySelect = document.getElementById('specialty');
  specialtySelect.addEventListener('change', function () {
    selectedSpecialty = specialtySelect.value;  // Almacenar la especialidad seleccionada
    console.log("Especialidad seleccionada:", selectedSpecialty); // Verifica que el valor se actualiza correctamente
  });



  const calendar = new FullCalendar.Calendar(calendarEl, {
    height: 'auto',
    contentHeight: 'auto',
    aspectRatio: 1.5, // Ajusta el ancho/altura automáticamente
    handleWindowResize: true,
    locale: 'es',
    timeZone: 'America/Argentina/Buenos_Aires',
    initialDate: new Date(),

    events: function (fetchInfo, successCallback, failureCallback) {
      console.log('No se realiza solicitud al cargar el calendario.');
    },


    dateClick: function (info) {
      console.log('Fecha seleccionada:', info.dateStr);
      selectedDate = info.dateStr.split('T')[0];  // Obtener solo la fecha (sin la hora)

      const selectedSpecialty = specialtySelect.value; // Obtener especialidad seleccionada

      // Verificar que se ha seleccionado una especialidad antes de proceder
      if (!selectedSpecialty) {
        alert("Por favor, selecciona una especialidad antes de proceder.");
        return;
      }

      showAvailableSlots(selectedDate, selectedSpecialty);
      loadProfessionals(selectedDate, selectedSpecialty);
    },


    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: ''
    },

    customButtons: {
      today: {
        text: 'Hoy', // Aquí cambiamos el texto del botón "today"
        click: function () {
          calendar.today(); // Esto asegura que al hacer clic se muestre la fecha de hoy
        }
      }
    }
  });

  calendar.render();

  // Botón para cerrar el modal de reserva
  const closeModalButton = document.getElementById('close-modal');
  if (closeModalButton) {
    closeModalButton.addEventListener('click', function () {
      hideAllModals();  // Cerrar cualquier modal abierto
      selectedDate = '';  // Resetear la fecha seleccionada
    });
  } else {
    console.error('Botón de cierre no encontrado');
  }

  const availableSlotsContainer = document.getElementById('availableSlots');
  if (availableSlotsContainer) {
    availableSlotsContainer.addEventListener('click', handleSlotActions);
  } else {
    console.error('Contenedor de slots disponibles no encontrado');
  }

  // Mostrar horarios disponibles
  function showAvailableSlots(date, specialty) {
    fetch(`http://localhost:3000/api/calendar/turnos/ocupados/${date}/${specialty}`)
      .then(response => response.json())
      .then(data => {
        console.log("📢 Datos de turnos ocupados recibidos en el frontend:", data); // 🔍 Verifica qué datos llegan
        const availableSlots = getAvailableSlots(data);
        const scheduleHTML = generateScheduleHTML(availableSlots, date);
        updateSlotContainer(scheduleHTML);
      })
      .catch(error => {
        console.error("❌ Error al obtener los horarios ocupados:", error);
      });
  }


  function getAvailableSlots(occupiedSlots) {
    const horarios = ["9:00", "9:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30"];

    const availableSlots = horarios.map(time => ({
      time,
      status: 'disponible',
      _id: null
    }));

    console.log("📢 Turnos ocupados recibidos en getAvailableSlots:", occupiedSlots); // Verificar datos entrantes

    occupiedSlots.forEach(occupiedSlot => {
      const occupiedTime = occupiedSlot.time;
      const slotIndex = availableSlots.findIndex(slot => slot.time === occupiedTime);
      if (slotIndex !== -1) {
        availableSlots[slotIndex].status = 'ocupado';
        availableSlots[slotIndex]._id = occupiedSlot._id;
      } else {
        console.log(`Turno ${occupiedTime} no encontrado en horarios.`);
      }
    });


    console.log("📢 Lista final de turnos disponibles y ocupados:", availableSlots); // 🔍 Verificar estructura final

    return availableSlots;
  }



  // Función para generar los horarios disponibles
  function generateScheduleHTML(availableSlots, selectedDate) {
    let scheduleHTML = `<h3>Horarios para el día ${selectedDate}:</h3><table id="availableSlotsTable"><tbody>`;

    availableSlots.forEach(slot => {
      console.log("📢 Generando fila de turno:", slot); // Verificar datos antes de imprimir

      const status = slot.status === "disponible" ? "Disponible" : "Ocupado";
      const colorClass = status === "Disponible" ? "available" : "occupied";

      const buttons = status === 'Disponible'
        ? `<button class="btn-book" data-slot="${slot.time}" data-status="${status}" data-date="${selectedDate}">Reservar</button>`
        : `<button class="btn-edit" data-id="${slot._id ? slot._id : ''}" data-time="${slot.time}" data-status="${status}">Modificar</button>
           <button class="btn-delete" ${slot._id ? `data-id="${slot._id}"` : 'disabled'}>Eliminar</button>`;

      scheduleHTML += `
            <tr>
                <td>${slot.time}</td>
                <td class="${colorClass}">${status}</td>
                <td>${buttons}</td>
            </tr>
        `;
    });

    scheduleHTML += `</tbody></table>`;
    return scheduleHTML;
  }


  // Actualizar el contenedor de horarios disponibles
  function updateSlotContainer(scheduleHTML) {
    const availableSlotsContainer = document.getElementById('availableSlots');
    if (availableSlotsContainer) {
      availableSlotsContainer.innerHTML = scheduleHTML;
    } else {
      const newContainer = document.createElement('div');
      newContainer.id = 'availableSlots';
      newContainer.innerHTML = scheduleHTML;
      document.getElementById('time-slot-modal').appendChild(newContainer);
    }

    const modal = document.getElementById('time-slot-modal');
    if (modal) {
      showModal('time-slot-modal');
    } else {
      console.error('Modal no encontrado en el DOM');
    }
  }

  function handleSlotActions(event) {
    if (event.target.classList.contains('btn-book')) {
      handleReservation(event);
    }

    if (event.target.classList.contains('btn-edit')) {
      handleEdit(event);
    }

    if (event.target.classList.contains('btn-delete')) {
      handleDelete(event);
    }
  }

  function handleDelete(event) {
    const turnoId = event.target.getAttribute("data-id"); // ✅ Obtiene el _id real

    console.log("🗑️ ID recibido para eliminación:", turnoId); // 🔍 Verifica qué llega aquí

    if (!turnoId || turnoId.length !== 24) { // ✅ Validamos que sea un ObjectId válido
      console.error("⛔ ID inválido recibido:", turnoId);
      alert("Error: No se pudo obtener el ID del turno.");
      return;
    }

    // 🛑 Preguntar antes de eliminar
    confirmarEliminacion().then((confirmado) => {
      if (confirmado) {
        // ✅ Ahora el fetch solo se ejecuta después de la confirmación
        fetch(`http://localhost:3000/api/calendar/turnos/eliminar/${turnoId}`, {
          method: "DELETE"
        })
          .then(response => {
            if (!response.ok) {
              throw new Error(`Error al eliminar el turno: ${response.statusText}`);
            }
            return response.json();
          })
          .then(data => {
            console.log("✅ Turno eliminado correctamente:", data);
            Swal.fire("Eliminado", "El turno ha sido eliminado correctamente.", "success");
            hideAllModals();
          })
          .catch(error => {
            console.error("❌ Error al eliminar el turno:", error);
            Swal.fire("Error", "Hubo un problema al eliminar el turno.", "error");
          });
      }
    });
  }


  // Reservar un turno
  function handleReservation(event) {
    const slotId = event.target.getAttribute('data-slot');
    const slotStatus = event.target.getAttribute('data-status');

    console.log("📌 ID del turno seleccionado:", slotId); // 👀 Verificar qué se está recibiendo

    if (slotStatus !== 'ocupado') {
      hideAllModals();
      selectedSlot = slotId;
      showReservationForm(selectedSlot);
    } else {
      alert('El turno ya está ocupado.');
    }
  }

  // Mostrar el formulario de reserva
  function confirmarAccion(mensaje) {
    return Swal.fire({
      title: mensaje,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí",
      cancelButtonText: "No",
    }).then((result) => result.isConfirmed);
  }

  function showReservationForm(slotId) {
    // Función para normalizar texto (elimina acentos, pasa a minúsculas y elimina espacios extra)
    const normalizeText = text => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

    // Asegurar que haya una especialidad seleccionada, por defecto "Odontología"
    const specialty = selectedSpecialty && selectedSpecialty.trim() !== "" ? selectedSpecialty : "Odontología";
    const normalizedSpecialty = normalizeText(specialty);

    const apiUrl = `http://localhost:3000/api/calendar/turnos/buscar?date=${selectedDate}&time=${slotId}&specialty=${specialty}`;

    fetch(apiUrl)
      .then(response => response.json())
      .then(() => {
        Swal.fire({
          title: "Reservar Turno",
          html: `
                    <label for="swal-patient">Paciente (DNI):</label>
                    <input type="text" id="swal-patient" class="swal2-input" placeholder="Ingrese el DNI" required>
                    <div id="dni-suggestions" style="max-height: 100px; overflow-y: auto;"></div>

                    <label for="swal-firstName">Nombre:</label>
                    <input type="text" id="swal-firstName" class="swal2-input" placeholder="Nombre" readonly>

                    <label for="swal-lastName">Apellido:</label>
                    <input type="text" id="swal-lastName" class="swal2-input" placeholder="Apellido" readonly>

                    <label for="swal-professional">Profesional:</label>
                    <select id="swal-professional" class="swal2-input"></select>

                    <label for="swal-specialty">Especialidad:</label>
                    <input type="text" id="swal-specialty" class="swal2-input" value="${specialty}" readonly>

                    <label for="swal-time">Hora del turno:</label>
                    <input type="time" id="swal-time" class="swal2-input" value="${slotId}" required>
                `,
          showCancelButton: true,
          confirmButtonText: "Confirmar Reserva",
          cancelButtonText: "Cancelar",
          didOpen: () => {
            // 🔹 Cargar los profesionales disponibles
            fetch(`http://localhost:3000/api/calendar/profesionales/disponibles/${selectedDate}`)
              .then(res => res.json())
              .then(professionals => {
                console.log("📢 Profesionales recibidos desde la API:", professionals);
                console.log("📢 Especialidad seleccionada para filtrar:", specialty);

                const select = document.getElementById("swal-professional");
                select.innerHTML = ""; // Limpiar el select antes de cargar nuevos datos

                // 🔹 Filtrar profesionales por especialidad normalizada
                const filteredProfessionals = professionals.filter(prof => {
                  const profSpecialty = Array.isArray(prof.especialidad)
                    ? prof.especialidad.map(s => normalizeText(s))
                    : normalizeText(prof.especialidad);

                  console.log(`🔍 Revisando profesional: ${prof.nombre} ${prof.apellido} - Especialidad normalizada:`, profSpecialty);

                  return Array.isArray(profSpecialty)
                    ? profSpecialty.includes(normalizedSpecialty)
                    : profSpecialty === normalizedSpecialty;
                });

                console.log("✅ Profesionales filtrados:", filteredProfessionals);

                if (filteredProfessionals.length === 0) {
                  console.warn("⚠️ No hay profesionales disponibles con la especialidad seleccionada.");
                }

                // 🔹 Agregar solo los profesionales que cumplen los criterios
                filteredProfessionals.forEach(prof => {
                  const option = document.createElement("option");
                  option.value = prof._id;
                  option.textContent = `${prof.nombre} ${prof.apellido}`;
                  select.appendChild(option);
                });
              })
              .catch(error => {
                console.error("❌ Error al obtener profesionales:", error);
              });

            // 🔹 Activar búsqueda de pacientes por DNI en tiempo real
            const dniInput = document.getElementById("swal-patient");
            dniInput.addEventListener("input", () => {
              const dniValue = dniInput.value.replace(/\D/g, ""); // Eliminar caracteres no numéricos
              if (dniValue.length >= 3) {
                fetch(`http://localhost:3000/api/patients/buscarPorDNI/${dniValue}`)
                  .then(res => res.json())
                  .then(patients => {
                    if (!Array.isArray(patients)) {
                      patients = patients ? [patients] : [];
                    }

                    const suggestionsContainer = document.getElementById("dni-suggestions");
                    suggestionsContainer.innerHTML = "";

                    if (patients.length === 0) {
                      suggestionsContainer.innerHTML = `<div style="padding: 5px;">No se encontraron pacientes.</div>`;
                    }

                    patients.forEach(patient => {
                      const option = document.createElement("div");
                      option.textContent = `${patient.dni} - ${patient.firstName} ${patient.lastName}`;
                      option.style.cursor = "pointer";
                      option.style.padding = "5px";
                      option.style.borderBottom = "1px solid #ddd";
                      option.addEventListener("click", () => {
                        dniInput.value = patient.dni;
                        document.getElementById("swal-firstName").value = patient.firstName;
                        document.getElementById("swal-lastName").value = patient.lastName;
                        suggestionsContainer.innerHTML = "";
                      });
                      suggestionsContainer.appendChild(option);
                    });
                  })
                  .catch(error => {
                    console.error("❌ Error al buscar pacientes:", error);
                  });
              }
            });
          },
          preConfirm: () => {
            // 🔹 Obtener datos ingresados
            const reservationData = {
              time: document.getElementById("swal-time").value,
              date: selectedDate,
              paciente: document.getElementById("swal-patient").value,
              firstName: document.getElementById("swal-firstName").value,
              lastName: document.getElementById("swal-lastName").value,
              profesional: document.getElementById("swal-professional").value,
              especialidad: document.getElementById("swal-specialty").value
            };

            // 🔹 Validar que todos los datos estén completos
            if (!reservationData.paciente || !reservationData.firstName || !reservationData.lastName || !reservationData.time || !reservationData.profesional) {
              Swal.showValidationMessage("Por favor, completa todos los campos.");
              return false;
            }

            return reservationData;
          }
        }).then((result) => {
          if (result.isConfirmed) {
            makeReservation(result.value);  // ✅ Llama a tu función sin modificarla
          }
        });
      })
      .catch(error => {
        console.error("❌ Error en la solicitud:", error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "No se encontró el turno o hubo un problema con la API.",
        });
      });
  }

  function makeReservation(reservationData) {
    console.log('Datos de la reserva:', reservationData);

    console.log('Datos individuales:', {
      time: reservationData.time,
      date: reservationData.date,
      paciente: reservationData.paciente,
      profesional: reservationData.profesional,
      especialidad: reservationData.especialidad
    });

    // Validamos que los campos necesarios estén presentes
    if (!reservationData || !reservationData.time || !reservationData.date ||
      !reservationData.paciente || !reservationData.profesional || !reservationData.especialidad) {

      Swal.fire("Error", "Por favor, complete todos los campos necesarios.", "error");
      return; // No continuamos si faltan datos
    }

    // Usar dayjs para validar que la fecha seleccionada no sea anterior al día de hoy
    const today = dayjs().startOf('day');
    const selectedDate = dayjs(reservationData.date).startOf('day');

    if (selectedDate.isBefore(today, 'day')) {
      Swal.fire("Error", "No puedes reservar un turno para una fecha pasada. Por favor, elige una fecha válida.", "error");
      return;
    }

    const url = 'http://localhost:3000/api/calendar/turnos/reservar';

    const requestData = {
      hora: reservationData.time,
      fecha: reservationData.date,
      paciente: reservationData.paciente,
      profesional: reservationData.profesional,
      especialidad: reservationData.especialidad
    };

    console.log("📢 Datos enviados a la API:", requestData);

    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestData)
    })
      .then(response => response.json())
      .then(data => {
        console.log("✅ Respuesta del servidor:", data);
        if (data._id) {
          Swal.fire({
            title: "Turno reservado",
            text: "Tu turno ha sido reservado correctamente.",
            icon: "success",
            confirmButtonText: "Aceptar"
          });
        } else {
          Swal.fire("Error en la reserva", data.message || "No se pudo completar la reserva.", "error");
        }
        hideAllModals();
      })
      .catch(error => {
        console.error("🚨 Error al reservar el turno:", error);
        Swal.fire("Error", "Hubo un problema al intentar reservar el turno. Intenta de nuevo.", "error");
      });
  }

  // Función para ocultar todos los modales
  function hideAllModals() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
      modal.style.display = 'none';
    });
  }

  // Mostrar el modal
  function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.style.display = 'block';
    }
  }

  // Función para llenar los campos con la selección del paciente
  function fillPatientFields(event) {
    const selectedOption = event.target; // Opción seleccionada
    const dni = selectedOption.getAttribute('data-dni');
    const firstName = selectedOption.getAttribute('data-firstName');
    const lastName = selectedOption.getAttribute('data-lastName');

    // Llenamos los campos con los valores correspondientes
    document.getElementById('patient').value = dni;  // Campo de DNI
    document.getElementById('firstName').value = firstName;  // Campo de nombre
    document.getElementById('lastName').value = lastName;  // Campo de apellido

    // Ocultamos el datalist después de seleccionar
    document.getElementById('patient-dropdown').style.display = 'none';
  }

  // Asignamos el evento para cuando el usuario seleccione una opción del datalist
  document.getElementById('patient').addEventListener('change', function (event) {
    const patientDropdown = document.getElementById('patient-dropdown');
    const options = patientDropdown.getElementsByTagName('option');

    // Buscar el valor ingresado
    const dniEntered = event.target.value;

    for (let option of options) {
      // Si el valor del option coincide con el valor ingresado, llenamos los campos
      if (option.value === dniEntered) {
        fillPatientFields({ target: option });
        break;
      }
    }
  });

  // Función para ocultar todos los modales
  function hideAllModals() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
      modal.style.display = 'none';
    });
  }

  // Mostrar el modal
  function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.style.display = 'block';
    }
  }
});

// Función para autocompletar paciente por DNI
function autoCompletePatient() {
  const patientInput = document.getElementById('patient').value.trim(); // Obtener el valor del input
  const patientDropdown = document.getElementById('patient-dropdown'); // Obtener el contenedor de las opciones

  console.log('Valor ingresado:', patientInput); // Verifica el valor que se está ingresando

  // Extraer solo los primeros 8 dígitos del DNI
  const dniInput = patientInput.replace(/\D/g, '').slice(0, 8); // Eliminar cualquier carácter no numérico y tomar solo 8 dígitos

  if (dniInput.length >= 1) { // Asegurarse de que tenga al menos un dígito
    fetch(`http://localhost:3000/api/patients/buscarPorDNI/${encodeURIComponent(dniInput)}`)
      .then(response => response.json()) // Procesar la respuesta
      .then(patients => {
        console.log('Pacientes encontrados:', patients); // Verifica la respuesta de la API

        // Limpiar las opciones anteriores del dropdown
        patientDropdown.innerHTML = '';

        if (patients && patients.length > 0) {
          patients.forEach(patient => {
            const option = document.createElement('div'); // Usamos un <div> para cada opción
            option.classList.add('option'); // Añadimos una clase para estilizar
            option.textContent = `${patient.dni} - ${patient.firstName} ${patient.lastName}`; // Mostrar DNI y nombre
            option.addEventListener('click', () => { // Agregamos un evento de clic para seleccionar la opción
              // Rellenamos el input con el DNI seleccionado
              document.getElementById('patient').value = patient.dni;

              // Rellenamos los campos de firstName y lastName
              document.getElementById('firstName').value = patient.firstName;
              document.getElementById('lastName').value = patient.lastName;

              patientDropdown.style.display = 'none'; // Ocultamos el dropdown
            });
            patientDropdown.appendChild(option); // Añadimos la opción al dropdown
          });

          patientDropdown.style.display = 'block'; // Mostrar el dropdown si hay opciones
        } else {
          patientDropdown.style.display = 'none'; // Ocultar el dropdown si no hay opciones
        }
      })
      .catch(error => {
        console.error('Error al buscar pacientes:', error);
        patientDropdown.style.display = 'none'; // Ocultar el dropdown en caso de error
      });
  } else {
    patientDropdown.style.display = 'none'; // Ocultar el dropdown si no se ha ingresado texto
  }
}

// Asignamos la función al evento de entrada del input
document.getElementById('patient').addEventListener('input', autoCompletePatient);

// Evento para actualizar el campo de DNI, nombre y apellido cuando se selecciona una opción
document.getElementById('patient').addEventListener('input', function () {
  const patientInput = this.value.trim();
  const patientDropdown = document.getElementById('patient-dropdown');

  // Buscar si el valor del input coincide con algún valor de opción
  const selectedOption = Array.from(patientDropdown.options).find(option => option.value === patientInput);

  if (selectedOption) {
    const dni = selectedOption.getAttribute('data-dni'); // Obtener solo el DNI
    const firstName = selectedOption.getAttribute('data-firstName'); // Obtener el nombre
    const lastName = selectedOption.getAttribute('data-lastName'); // Obtener el apellido

    // Actualizar los campos con los datos del paciente
    document.getElementById('firstName').value = firstName;
    document.getElementById('lastName').value = lastName;
    this.value = dni; // Actualizar el input con solo el DNI
  }

  patientDropdown.style.display = 'none'; // Ocultar el datalist después de la selección
});

// Función para manejar la selección de una opción del datalist
document.getElementById('patient').addEventListener('input', function () {
  const patientInput = this.value.trim();
  const patientDropdown = document.getElementById('patient-dropdown');

  // Si el input tiene un valor que coincide con el formato de DNI, ejecutar la función de autocompletado
  if (patientInput.length === 8) {
    autoCompletePatient(); // Ejecutar la función para autocompletar
  } else {
    patientDropdown.style.display = 'none'; // Ocultar el datalist si no es un DNI válido
  }
});

// Evento para cambiar el valor del input al seleccionar una opción del datalist
document.getElementById('patient').addEventListener('blur', function () {
  const patientInput = this.value.trim();
  const patientDropdown = document.getElementById('patient-dropdown');

  // Buscar si el valor del input coincide con algún valor de opción
  const selectedOption = Array.from(patientDropdown.options).find(option => option.value === patientInput);

  if (selectedOption) {
    const dni = selectedOption.getAttribute('data-dni'); // Obtener solo el DNI
    const firstName = selectedOption.getAttribute('data-firstName'); // Obtener el nombre
    const lastName = selectedOption.getAttribute('data-lastName'); // Obtener el apellido

    // Actualizar los campos con los datos del paciente
    document.getElementById('firstName').value = firstName;
    document.getElementById('lastName').value = lastName;
    this.value = dni; // Actualizar el input con solo el DNI
  }

  patientDropdown.style.display = 'none'; // Ocultar el datalist después de la selección
});

// Asignamos el evento para cuando el usuario seleccione una opción del datalist
document.getElementById('patient').addEventListener('input', function (event) {
  const patientDropdown = document.getElementById('patient-dropdown');
  const options = patientDropdown.getElementsByTagName('option');

  // Agregamos un evento de "click" a cada opción
  for (let option of options) {
    option.addEventListener('click', fillPatientFields);
  }
});

// Función para cargar los profesionales según la especialidad y la fecha
function loadProfessionals(selectedDate, selectedSpecialty) {
  const selectedDateObj = new Date(selectedDate);
  const utcDate = new Date(selectedDateObj.getTime() + selectedDateObj.getTimezoneOffset() * 60000);
  const localDate = new Date(utcDate);
  const dayOfWeek = localDate.getDay();
  const daysOfWeek = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  const selectedDay = daysOfWeek[dayOfWeek];

  // Normaliza la especialidad seleccionada
  const normalizeString = str => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  fetch('http://localhost:3000/api/professionals')
    .then(response => {
      if (!response.ok) {
        throw new Error('Error al obtener los profesionales');
      }
      return response.json();
    })
    .then(professionals => {
      console.log("Profesionales recibidos de la API:", professionals); // Verifica los datos recibidos

      const professionalSelect = document.getElementById('professional');
      professionalSelect.innerHTML = ''; // Limpiar las opciones previas

      const defaultOption = document.createElement('option');
      defaultOption.value = '';
      defaultOption.textContent = 'Selecciona un profesional';
      professionalSelect.appendChild(defaultOption);

      let optionsAdded = false;

      // Filtrar los profesionales por la especialidad seleccionada y por el día disponible
      professionals.forEach(prof => {
        const professionalAvailableDays = prof.diasLaborales.map(day => day.toLowerCase());

        console.log(`Profesional: ${prof.nombre} ${prof.apellido} - Especialidad: ${prof.especialidad}, Días: ${prof.diasLaborales}`);

        // Depuración de los valores que se comparan
        console.log(`Comparando especialidad seleccionada: ${selectedSpecialty} con: ${prof.especialidad}`);
        console.log(`Comparando días laborales seleccionados: ${selectedDay} con: ${professionalAvailableDays}`);

        // Asegúrate de que la especialidad seleccionada esté en minúsculas y sin caracteres especiales
        const normalizedSpecialty = normalizeString(selectedSpecialty);  // Normaliza la especialidad seleccionada
        const professionalSpecialty = prof.especialidad.map(especialidad => normalizeString(especialidad));  // Normaliza las especialidades del profesional

        console.log(`Normalized Specialty: ${normalizedSpecialty}`);
        console.log(`Professional Specialties: ${professionalSpecialty}`);
        console.log(`Selected Day: ${selectedDay}`);
        console.log(`Available Days: ${professionalAvailableDays}`);

        // Verifica si la especialidad y el día coinciden
        if (normalizedSpecialty && professionalSpecialty.includes(normalizedSpecialty) && professionalAvailableDays.includes(selectedDay)) {
          const option = document.createElement('option');
          option.value = prof._id;  // Usamos el _id del profesional como valor
          option.textContent = `${prof.nombre} ${prof.apellido}`;

          professionalSelect.appendChild(option);
          optionsAdded = true;
        }
      });

      if (!optionsAdded) {
        const noProfessionalsOption = document.createElement('option');
        noProfessionalsOption.value = '';
        noProfessionalsOption.textContent = 'No hay profesionales disponibles para esta especialidad y día';
        professionalSelect.appendChild(noProfessionalsOption);
      }
    })
    .catch(error => {
      console.error('Error al cargar los profesionales:', error);
    });
}




function confirmarAccion(mensaje) {
  return Swal.fire({
    title: mensaje,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Sí",
    cancelButtonText: "No",
  }).then((result) => result.isConfirmed);
}

async function confirmarEliminacion() {
  const resultado = await Swal.fire({
    title: "¿Estás seguro?",
    text: "Este turno será eliminado permanentemente.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Sí, eliminar",
    cancelButtonText: "No, cancelar",
    customClass: {
      popup: "mi-modal",
      confirmButton: "mi-boton-confirmar",
      cancelButton: "mi-boton-cancelar",
    }
  });

  return resultado.isConfirmed; // Devuelve `true` si el usuario confirmó, `false` si canceló.
}

























































