document.querySelector("form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  try {
    const response = await fetch("http://localhost:3000/api/users/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();

    if (response.ok) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.user.role);

      // SweetAlert2 con estilos personalizados y espera antes de redirigir
      Swal.fire({
        icon: "success",
        title: "¡Inicio de sesión exitoso!",
        text: `Has iniciado sesión como ${data.user.role}`,
        timer: 2000,
        showConfirmButton: false,
        customClass: {
          popup: "custom-popup",
          title: "custom-title",
          content: "custom-content"
        }
      }).then(() => {
        // Redirección después del mensaje
        const role = data.user.role;
        if (role === "admin") {
          window.location.href = "/adminDashboard.html";
        } else if (role === "profesional") {
          window.location.href = "/professional.html";
        } else {
          window.location.href = "./calendar.html";
        }
      });

    } else {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: data.message
      });
    }
  } catch (error) {
    Swal.fire({
      icon: "error",
      title: "Error de conexión",
      text: "No se pudo conectar con el servidor"
    });
  }
});


  
  