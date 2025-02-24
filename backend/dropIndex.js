const mongoose = require("mongoose");
const Professional = require("./models/professional");

async function dropDniIndex() {
  try {
    await mongoose.connect("mongodb://localhost:27017/Mi_base_de_datos", {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log("✅ Conectado a MongoDB.");

    const collection = mongoose.connection.collection("professionals");

    // Verificar si el índice 'dni_1' existe antes de eliminarlo
    const indexes = await collection.indexes();
    const dniIndex = indexes.find(index => index.name === "dni_1");

    if (dniIndex) {
      await collection.dropIndex("dni_1");
      console.log("✅ Índice único en dni eliminado correctamente.");
    } else {
      console.log("⚠️ El índice 'dni_1' no existe o ya fue eliminado.");
    }

  } catch (error) {
    console.error("❌ Error al eliminar el índice:", error);
  } finally {
    mongoose.connection.close();
    console.log("🔌 Conexión cerrada.");
  }
}

dropDniIndex();

