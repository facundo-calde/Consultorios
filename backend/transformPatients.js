const fs = require("fs");
const readline = require("readline");

// 📌 Archivos de entrada y salida
const inputFile = "backup.jsonl";  
const outputFile = "transformed_patients.json";

// 📌 Función para mapear el género correctamente
function mapGender(gender) {
    const normalizedGender = gender.trim().toLowerCase();
    if (normalizedGender === "male") return "masculino";
    if (normalizedGender === "female") return "femenino";
    return "otro";
}

// 📌 Transformar JSONL a JSON compatible con Mongoose
async function transformJSONL() {
    const patients = [];

    const fileStream = fs.createReadStream(inputFile);
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

    for await (const line of rl) {
        if (!line.trim()) continue;
        const record = JSON.parse(line);

        // 📌 Filtrar solo pacientes que tengan DNI e información básica
        if (!record.identification || !record.dob) continue;

        // 📌 Obtener información de la cobertura médica
        let coverageLabel = "Particular"; // Valor por defecto
        let coverageInfo = null;

        if (record.financiers && record.financiers.length > 0) {
            const coverage = record.financiers[0]; 
            coverageLabel = coverage.label || "Particular"; // Ahora almacena el label de coverageInfo
            coverageInfo = {
                id: coverage.id || "Desconocido",
                label: coverage.label || "Desconocido",
                normalized: coverage.normalized || "Desconocido",
                public: coverage.public || false,
                locale: coverage.locale || "es-AR"
            };
        }

        // 📌 Mantener el ID original **tal cual** está en el JSONL
        const originalId = record.id || null;

        // 📌 Transformar el paciente
        const transformedPatient = {
            originalId: originalId, // 🔥 Se mantiene el ID original completo, incluyendo "consumers/"
            firstName: record.firstName ? record.firstName.trim() : "",
            lastName: record.lastName ? record.lastName.trim() : "",
            dateOfBirth: record.dob ? new Date(record.dob).toISOString() : null, // 🔥 Se mantiene en formato ISO
            gender: record.gender && record.gender.trim() ? mapGender(record.gender.trim().toLowerCase()) : "otro", // 🔥 Normalización mejorada
            phoneNumber: record.phones && record.phones.length > 0 ? record.phones[0].value : "",
            email: record.emails && record.emails.length > 0 ? record.emails[0].value : "",
            address: {
                street: record.address ? record.address.trim() : "",
                city: "Desconocido",
                zipCode: "0000"
            },
            medicalHistory: [],
            dni: record.identification.trim(),  
            coverage: coverageLabel,  // 🔥 Ahora `coverage` almacena coverageInfo.label
            coverageInfo: coverageInfo // Guarda detalles completos de la cobertura en otro campo opcional
        };

        // 📌 Agregar historial médico si hay notas
        if (record.notes) {
            transformedPatient.medicalHistory.push({
                condition: record.notes,
                diagnosisDate: transformedPatient.dateOfBirth,
                treatment: "N/A",
                doctorNote: record.notes,
                files: []
            });
        }

        patients.push(transformedPatient);
    }

    // 📌 Guardar el JSON transformado
    fs.writeFileSync(outputFile, JSON.stringify(patients, null, 2));
    console.log(`✅ Transformación completa. Archivo guardado en: ${outputFile}`);
}

// Ejecutar la transformación
transformJSONL();

