document.addEventListener("DOMContentLoaded", () => {
    const patientsTableBody = document.querySelector("#patients-table tbody");
    const searchInput = document.getElementById("search-dni");
    const addPatientBtn = document.getElementById("add-patient");
    const API_URL = "http://localhost:3000/api/patients";

    // Cargar pacientes al iniciar
    fetchPatients();

    // Evento para buscar pacientes por DNI cuando se escribe en el input
    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            searchPatientsByDNI(e.target.value);
        });
    }

    // Evento para abrir el modal de agregar nuevo paciente
    if (addPatientBtn) {
        addPatientBtn.addEventListener("click", (e) => {
            e.preventDefault();
            openAddPatientModal();
        });
    }


    // 🔹 Obtener todos los pacientes al cargar la página
    async function fetchPatients() {
        try {
            const response = await fetch(API_URL);
            if (!response.ok) throw new Error("Error al obtener los pacientes");

            const patients = await response.json();
            renderPatients(patients);
        } catch (error) {
            console.error("Error:", error);
        }
    }

    async function searchPatientsByDNI(dni) {
        if (dni.trim() === "" || dni.trim().length < 3) { // si está vacío o tiene menos de 3 dígitos, carga todos
            fetchPatients();
            return;
        }
    
        const cleanDNI = dni.replace(/\D/g, ""); // elimina cualquier caracter que no sea dígito
    
        try {
            const response = await fetch(`${API_URL}/buscarPorDNI/${cleanDNI}`);
            const data = await response.json();
            console.log("Resultado de búsqueda:", data);
            if (!response.ok) {
                throw new Error(data.message || "Error al buscar pacientes");
            }
            renderPatients(data);
        } catch (error) {
            console.error("Error:", error);
            Swal.fire("Error", error.message || "No se encontraron pacientes con ese DNI", "error");
        }
    }
    
    

    function editPatient(patient) {
        if (!patient) {
            console.error("Paciente no encontrado");
            return;
        }
    
        Swal.fire({
            title: "Editar Paciente",
            html: `
                <input id="swal-firstName" class="swal2-input" placeholder="Nombre" value="${patient.firstName}">
                <input id="swal-lastName" class="swal2-input" placeholder="Apellido" value="${patient.lastName}">
                <input id="swal-dni" class="swal2-input" placeholder="DNI" value="${patient.dni}" maxlength="8">
                <input id="swal-dateOfBirth" type="date" class="swal2-input" value="${patient.dateOfBirth ? patient.dateOfBirth.substring(0,10) : ''}">
                <select id="swal-gender" class="swal2-input">
                    <option value="masculino" ${patient.gender === "masculino" ? "selected" : ""}>Masculino</option>
                    <option value="femenino" ${patient.gender === "femenino" ? "selected" : ""}>Femenino</option>
                    <option value="otro" ${patient.gender === "otro" ? "selected" : ""}>Otro</option>
                </select>
                <input id="swal-phoneNumber" class="swal2-input" placeholder="Teléfono" value="${patient.phoneNumber}">
                <input id="swal-email" class="swal2-input" placeholder="Email" value="${patient.email}">
                <input id="swal-street" class="swal2-input" placeholder="Calle" value="${patient.address?.street || ''}">
                <input id="swal-city" class="swal2-input" placeholder="Ciudad" value="${patient.address?.city || ''}">
                <input id="swal-zipCode" class="swal2-input" placeholder="Código Postal" value="${patient.address?.zipCode || ''}">
                <input id="swal-coverage" class="swal2-input" placeholder="Cobertura Médica" value="${patient.coverage || "Sin Cobertura"}">
            `,
            showCancelButton: true,
            confirmButtonText: "Guardar",
            preConfirm: () => {
                const dni = document.getElementById("swal-dni").value.trim();
                
                if (!/^\d{7,8}$/.test(dni)) {
                    Swal.showValidationMessage("El DNI debe tener entre 7 y 8 dígitos numéricos.");
                    return false;
                }
    
                return {
                    firstName: document.getElementById("swal-firstName").value.trim(),
                    lastName: document.getElementById("swal-lastName").value.trim(),
                    dni,
                    dateOfBirth: document.getElementById("swal-dateOfBirth").value,
                    gender: document.getElementById("swal-gender").value,
                    phoneNumber: document.getElementById("swal-phoneNumber").value.trim(),
                    email: document.getElementById("swal-email").value.trim(),
                    address: {
                        street: document.getElementById("swal-street").value.trim(),
                        city: document.getElementById("swal-city").value.trim(),
                        zipCode: document.getElementById("swal-zipCode").value.trim()
                    },
                    coverage: document.getElementById("swal-coverage").value.trim() || "Sin Cobertura"
                };
            }
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const response = await fetch(`${API_URL}/${patient._id}`, {
                        method: "PUT",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify(result.value)
                    });
    
                    if (!response.ok) throw new Error("Error al actualizar el paciente");
    
                    Swal.fire("Paciente Actualizado", "Los datos han sido actualizados correctamente.", "success");
                    fetchPatients();
                } catch (error) {
                    Swal.fire("Error", "No se pudo actualizar el paciente.", "error");
                    console.error("Error:", error);
                }
            }
        });
    }
    
    
    
    // 🔹 Renderizar pacientes en la tabla y asignar eventos
function renderPatients(patients) {
    patientsTableBody.innerHTML = ""; // Limpiar la tabla antes de agregar nuevos datos

    patients.forEach(patient => {
        // Verificamos si el paciente tiene historial clínico
        const hasHistory = Array.isArray(patient.medicalHistory) && patient.medicalHistory.length > 0;
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${patient.firstName}</td>  
            <td>${patient.lastName}</td>   
            <td>${patient.dni}</td>
            <td class="phone-cell">
                <a href="https://wa.me/${patient.phoneNumber}" target="_blank" class="whatsapp-link">
                    <i class="bx bxl-whatsapp"></i> ${patient.phoneNumber}
                </a>
            </td>
            <td>
                <a href="mailto:${patient.email}" class="email-link">${patient.email}</a>
            </td>
            <td>${patient.coverage || "Sin Cobertura"}</td>
            <td>
                <button class="edit-btn" data-id="${patient._id}" title="Modificar">✏️</button>  
                ${hasHistory ? `<button class="history-btn" data-id="${patient._id}" title="Ver Historial Clínico">
                    <i class="bx bx-history"></i>
                </button>` : ''}
            </td>
        `;

        patientsTableBody.appendChild(row);
    });

    // Asignar eventos a los botones de edición
    document.querySelectorAll(".edit-btn").forEach(button => {
        button.addEventListener("click", (e) => {
            const patientId = e.target.getAttribute("data-id");
            const patient = patients.find(p => p._id === patientId);
            editPatient(patient);
        });
    });

    // Asignar eventos a los botones de eliminación
    document.querySelectorAll(".delete-btn").forEach(button => {
        button.addEventListener("click", (e) => {
            const patientId = e.target.getAttribute("data-id");
            confirmDeletePatient(patientId);
        });
    });

    // Asignar eventos al botón de historial clínico
    document.querySelectorAll(".history-btn").forEach(button => {
        button.addEventListener("click", (e) => {
            const patientId = e.currentTarget.getAttribute("data-id");
            const patient = patients.find(p => p._id === patientId);
            if (patient && Array.isArray(patient.medicalHistory) && patient.medicalHistory.length) {
                viewClinicalHistory(patient.medicalHistory);
            } else {
                Swal.fire("Sin historial", "Este paciente no tiene historial clínico.", "info");
            }
        });
    });
    
}

// Función para mostrar el historial clínico en un modal
function viewClinicalHistory(medicalHistory) {
    let html = '<div style="text-align: left; max-height:300px; overflow:auto;">';
    medicalHistory.forEach((entry, index) => {
        html += `<p>
            <strong>Entrada ${index + 1}</strong><br>
            Condición: ${entry.condition || 'N/D'}<br>
            Tratamiento: ${entry.treatment || 'N/D'}<br>
            Fecha: ${entry.diagnosisDate ? new Date(entry.diagnosisDate).toLocaleDateString() : 'N/D'}<br>`;
        // Si existen archivos en esta entrada
        if (Array.isArray(entry.files) && entry.files.length > 0) {
            html += "Archivos:<br>";
            entry.files.forEach((file, idx) => {
                html += `<a href="${file.fileUrl}" target="_blank">Archivo ${idx + 1}</a><br>`;
            });
        }
        html += `</p><hr>`;
    });
    html += '</div>';

    Swal.fire({
        title: "Historial Clínico",
        html,
        width: '600px'
    });
}

    // 🔹 Función para abrir el modal de agregar paciente
    async function openAddPatientModal() {
        const { value: formValues } = await Swal.fire({
            title: "Agregar Nuevo Paciente",
            html: `
                <input id="swal-firstName" class="swal2-input" placeholder="Nombre">
                <input id="swal-lastName" class="swal2-input" placeholder="Apellido">
                <input id="swal-dni" class="swal2-input" placeholder="DNI" maxlength="8">
                <input id="swal-dateOfBirth" type="date" class="swal2-input">
                <select id="swal-gender" class="swal2-input">
                    <option value="masculino">Masculino</option>
                    <option value="femenino">Femenino</option>
                    <option value="otro">Otro</option>
                </select>
                <input id="swal-phoneNumber" class="swal2-input" placeholder="Teléfono">
                <input id="swal-email" class="swal2-input" placeholder="Email">
                <input id="swal-street" class="swal2-input" placeholder="Calle">
                <input id="swal-city" class="swal2-input" placeholder="Ciudad">
                <input id="swal-zipCode" class="swal2-input" placeholder="Código Postal">
                <input id="swal-coverage" class="swal2-input" placeholder="Cobertura Médica (Opcional)">
            `,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: "Guardar",
            cancelButtonText: "Cancelar",
            preConfirm: () => {
                const firstName = document.getElementById("swal-firstName").value.trim();
                const lastName = document.getElementById("swal-lastName").value.trim();
                const dni = document.getElementById("swal-dni").value.trim();
                const email = document.getElementById("swal-email").value.trim();
    
                // Validaciones
                if (firstName.length < 3) {
                    Swal.showValidationMessage("El nombre debe tener al menos 3 caracteres.");
                    return false;
                }
    
                if (lastName.length < 3) {
                    Swal.showValidationMessage("El apellido debe tener al menos 3 caracteres.");
                    return false;
                }
    
                if (!/^\d{7,8}$/.test(dni)) {
                    Swal.showValidationMessage("El DNI debe tener entre 7 y 8 dígitos numéricos.");
                    return false;
                }
    
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                    Swal.showValidationMessage("El email ingresado no es válido.");
                    return false;
                }
    
                return {
                    firstName,
                    lastName,
                    dni,
                    dateOfBirth: document.getElementById("swal-dateOfBirth").value,
                    gender: document.getElementById("swal-gender").value,
                    phoneNumber: document.getElementById("swal-phoneNumber").value.trim(),
                    email,
                    address: {
                        street: document.getElementById("swal-street").value.trim(),
                        city: document.getElementById("swal-city").value.trim(),
                        zipCode: document.getElementById("swal-zipCode").value.trim()
                    },
                    coverage: document.getElementById("swal-coverage").value.trim() || "Sin Cobertura"
                };
            }
        });
    
        if (!formValues) return;
    
        try {
            const response = await fetch(API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(formValues)
            });
    
            if (!response.ok) throw new Error("Error al guardar el paciente");
    
            Swal.fire("Paciente Creado", "El paciente ha sido agregado con éxito", "success");
            fetchPatients();
        } catch (error) {
            Swal.fire("Error", "Hubo un problema al agregar el paciente", "error");
            console.error("Error:", error);
        }
    }
    
    
    // Cargar todos los pacientes al iniciar
    fetchPatients();
});

// 🔹 Evento para modificar pacientes
document.querySelectorAll(".edit-btn").forEach(button => {
    button.addEventListener("click", async (e) => {
        const patientId = e.target.getAttribute("data-id");

        try {
            const response = await fetch(`http://localhost:3000/api/patients/${patientId}`);
            if (!response.ok) throw new Error("Error al obtener los datos del paciente");

            const patient = await response.json();

            const { value: formValues } = await Swal.fire({
                title: "Editar Paciente",
                html: `
                    <input id="swal-firstName" class="swal2-input" value="${patient.firstName}" placeholder="Nombre">
                    <input id="swal-lastName" class="swal2-input" value="${patient.lastName}" placeholder="Apellido">
                    <input id="swal-dni" class="swal2-input" value="${patient.dni}" placeholder="DNI" disabled>
                    <input id="swal-dateOfBirth" type="date" class="swal2-input" value="${patient.dateOfBirth.split('T')[0]}">
                    <select id="swal-gender" class="swal2-input">
                        <option value="masculino" ${patient.gender === "masculino" ? "selected" : ""}>Masculino</option>
                        <option value="femenino" ${patient.gender === "femenino" ? "selected" : ""}>Femenino</option>
                        <option value="otro" ${patient.gender === "otro" ? "selected" : ""}>Otro</option>
                    </select>
                    <input id="swal-phoneNumber" class="swal2-input" value="${patient.phoneNumber}" placeholder="Teléfono">
                    <input id="swal-email" class="swal2-input" value="${patient.email}" placeholder="Email">
                    <input id="swal-street" class="swal2-input" value="${patient.address.street}" placeholder="Calle">
                    <input id="swal-city" class="swal2-input" value="${patient.address.city}" placeholder="Ciudad">
                    <input id="swal-zipCode" class="swal2-input" value="${patient.address.zipCode}" placeholder="Código Postal">
                    <input id="swal-coverage" class="swal2-input" value="${patient.coverage || ""}" placeholder="Cobertura Médica (Opcional)">
                `,
                focusConfirm: false,
                showCancelButton: true,
                confirmButtonText: "Guardar Cambios",
                cancelButtonText: "Cancelar",
                preConfirm: () => {
                    return {
                        firstName: document.getElementById("swal-firstName").value.trim(),
                        lastName: document.getElementById("swal-lastName").value.trim(),
                        dateOfBirth: document.getElementById("swal-dateOfBirth").value,
                        gender: document.getElementById("swal-gender").value,
                        phoneNumber: document.getElementById("swal-phoneNumber").value.trim(),
                        email: document.getElementById("swal-email").value.trim(),
                        address: {
                            street: document.getElementById("swal-street").value.trim(),
                            city: document.getElementById("swal-city").value.trim(),
                            zipCode: document.getElementById("swal-zipCode").value.trim()
                        },
                        coverage: document.getElementById("swal-coverage").value.trim() || "Sin Cobertura"
                    };
                }
            });

            if (!formValues) return;

            await fetch(`http://localhost:3000/api/patients/${patientId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formValues)
            });

            Swal.fire("Paciente Actualizado", "Los datos han sido modificados con éxito", "success");
            fetchPatients(); // Recargar la tabla después de actualizar
        } catch (error) {
            Swal.fire("Error", "Hubo un problema al actualizar el paciente", "error");
            console.error("Error:", error);
        }
    });
});



