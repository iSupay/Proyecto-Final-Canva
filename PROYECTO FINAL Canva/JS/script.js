// ======================================================
//  SECCIÓN 1: FUNCIONES PARA LOCALSTORAGE
// ======================================================
// En esta sección manejo todo lo relacionado con guardar y leer datos
// del navegador: usuarios registrados, partidas e info del usuario logueado.

// Leer lista de usuarios guardados
function cargarUsuarios() {
  const texto = localStorage.getItem("usuarios");
  if (texto) {
    return JSON.parse(texto);
  } else {
    return [];
  }
}

// Guardar lista de usuarios
function guardarUsuarios(usuarios) {
  localStorage.setItem("usuarios", JSON.stringify(usuarios));
}

// Leer lista de partidas guardadas
function cargarPartidas() {
  const texto = localStorage.getItem("partidas");
  if (texto) {
    return JSON.parse(texto);
  } else {
    return [];
  }
}

// Guardar lista de partidas
function guardarPartidas(partidas) {
  localStorage.setItem("partidas", JSON.stringify(partidas));
}

// Guardar el correo del usuario que está logueado
// (solo guardo el email y luego busco el usuario completo cuando lo necesito)
function guardarUsuarioActualEmail(email) {
  if (email) {
    localStorage.setItem("usuarioActualEmail", email);
  } else {
    localStorage.removeItem("usuarioActualEmail");
  }
}

// Devolver el objeto del usuario que está logueado actualmente
function obtenerUsuarioActual() {
  const email = localStorage.getItem("usuarioActualEmail");
  if (!email) return null;

  const usuarios = cargarUsuarios();
  // Buscamos el usuario por su correo
  for (let i = 0; i < usuarios.length; i++) {
    if (usuarios[i].email === email) {
      return usuarios[i];
    }
  }
  return null;
}


// ======================================================
//  SECCIÓN 2: MANEJO DE PANTALLAS Y PERFIL / HISTORIAL
// ======================================================
// Aquí controlo qué sección del HTML se muestra (login, registro, perfil, juego, historial)
// y también actualizo el contenido del perfil y la tabla de historial.

function mostrarPantalla(idPantalla) {
  // Ocultamos todas las secciones con clase "pantalla"
  const pantallas = document.querySelectorAll(".pantalla");
  for (let i = 0; i < pantallas.length; i++) {
    pantallas[i].classList.remove("activa");
  }

  // Mostramos solo la pantalla que nos interesa
  const pantalla = document.getElementById(idPantalla);
  if (pantalla) {
    pantalla.classList.add("activa");
  }
}

// Actualiza la información mostrada en el perfil
function actualizarPerfil() {
  const usuario = obtenerUsuarioActual();
  if (!usuario) return;

  const spanUsername = document.getElementById("perfil-username");
  const spanEmail = document.getElementById("perfil-email");
  const spanExtra = document.getElementById("perfil-extra");

  if (spanUsername) spanUsername.textContent = usuario.username;
  if (spanEmail) spanEmail.textContent = usuario.email;
  if (spanExtra) spanExtra.textContent = usuario.extra || "-";

  // A partir del historial de partidas calculo:
  // cuántas ha jugado, su mejor puntaje y el total acumulado.
  const partidas = cargarPartidas();
  let partidasJugador = [];
  for (let i = 0; i < partidas.length; i++) {
    if (partidas[i].userEmail === usuario.email) {
      partidasJugador.push(partidas[i]);
    }
  }

  let partidasJugadas = partidasJugador.length;
  let mejorPuntaje = 0;
  let puntajeTotal = 0;

  for (let i = 0; i < partidasJugador.length; i++) {
    const p = Number(partidasJugador[i].puntaje) || 0;
    puntajeTotal += p;
    if (p > mejorPuntaje) {
      mejorPuntaje = p;
    }
  }

  const spanPartidas = document.getElementById("perfil-partidas");
  const spanMejor = document.getElementById("perfil-mejor-puntaje");
  const spanTotal = document.getElementById("perfil-puntaje-total");

  if (spanPartidas) spanPartidas.textContent = partidasJugadas;
  if (spanMejor) spanMejor.textContent = mejorPuntaje;
  if (spanTotal) spanTotal.textContent = puntajeTotal;
}

// Rellena la tabla con el historial de partidas del usuario actual
function llenarHistorial() {
  const usuario = obtenerUsuarioActual();
  if (!usuario) return;

  const tbody = document.querySelector("#tabla-historial tbody");
  if (!tbody) return;

  tbody.innerHTML = "";

  const partidas = cargarPartidas();
  let partidasJugador = [];

  // Filtrar partidas del usuario actual
  for (let i = 0; i < partidas.length; i++) {
    if (partidas[i].userEmail === usuario.email) {
      partidasJugador.push(partidas[i]);
    }
  }

  // Ordeno de más reciente a más antiguo para que las últimas partidas se vean primero
  partidasJugador.sort(function (a, b) {
    return new Date(b.fecha) - new Date(a.fecha);
  });

  // Agregar filas a la tabla
  for (let i = 0; i < partidasJugador.length; i++) {
    const partida = partidasJugador[i];

    const tr = document.createElement("tr");

    const tdFecha = document.createElement("td");
    const fecha = new Date(partida.fecha);
    tdFecha.textContent = fecha.toLocaleString();

    const tdPuntaje = document.createElement("td");
    tdPuntaje.textContent = partida.puntaje;

    const tdEstado = document.createElement("td");
    tdEstado.textContent = partida.estado;

    tr.appendChild(tdFecha);
    tr.appendChild(tdPuntaje);
    tr.appendChild(tdEstado);

    tbody.appendChild(tr);
  }
}

// Guarda una partida nueva en el historial
function registrarPartida(puntaje, estado) {
  const usuario = obtenerUsuarioActual();
  if (!usuario) return;

  const partidas = cargarPartidas();

  const nuevaPartida = {
    userEmail: usuario.email,
    fecha: new Date().toISOString(),
    puntaje: Number(puntaje) || 0,
    estado: estado || "terminada",
  };

  partidas.push(nuevaPartida);
  guardarPartidas(partidas);
}


// ======================================================
//  SECCIÓN 3: VARIABLES DEL JUEGO EN CANVAS
// ======================================================
// Aquí defino las variables principales que usa el juego: jugador, obstáculos,
// puntaje, vidas, velocidad, etc.

let canvas = null;
let ctx = null;

let jugador = null;
let obstaculos = [];
let puntaje = 0;
let vidas = 3;
let velocidad = 6;
let juegoTerminado = false;

// Para controlar cada cuántos frames aparece un obstáculo
let contadorFrames = 0;
let intervaloObstaculos = 90; // frames

let animacionId = null;

// Elementos del HUD
let hudPlayerSpan = null;
let hudScoreSpan = null;
let hudLivesSpan = null;

// Panel de Game Over
let panelGameOver = null;
let spanGameOverScore = null;

// ===== Imágenes del dino y del cactus =====
// Aquí cargo las imágenes que uso como sprites en lugar de solo rectángulos.
// Las coloco en la carpeta: 00 Recursos/img/dino.png y 00 Recursos/img/cactus.png
const imgDino = new Image();
imgDino.src = "00 Recursos/img/dino.png";

const imgCactus = new Image();
imgCactus.src = "00 Recursos/img/cactus.png";


// ======================================================
//  SECCIÓN 4: CLASES DEL JUEGO
//  (requisito: uso de objetos / clases para la lógica)
// ======================================================

// Clase Jugador (el "dino")
class Jugador {
  constructor() {
    // Tamaño del rectángulo / sprite
    this.ancho = 40;
    this.alto = 50;

    // Posición inicial en el eje X
    this.x = 60;

    // Defino el suelo a 40 px desde el borde inferior del canvas
    this.sueloY = canvas.height - 40;
    this.y = this.sueloY - this.alto;

    this.velocidadY = 0;   // velocidad vertical
    this.gravedad = 0.7;   // fuerza con la que cae
    this.fuerzaSalto = -13; // fuerza con la que salta hacia arriba
  }

  actualizar() {
    // Aplicar gravedad
    this.velocidadY += this.gravedad;
    this.y += this.velocidadY;

    // Evitar que se caiga por debajo del suelo
    if (this.y > this.sueloY - this.alto) {
      this.y = this.sueloY - this.alto;
      this.velocidadY = 0;
    }
  }

  saltar() {
    // Solo puede saltar si está en el suelo (o muy cerca de él)
    if (this.y >= this.sueloY - this.alto - 1) {
      this.velocidadY = this.fuerzaSalto;
    }
  }

  dibujar() {
    // Si la imagen del dino está cargada correctamente, la dibujo
    if (imgDino.complete && imgDino.naturalWidth > 0) {
      ctx.drawImage(imgDino, this.x, this.y, this.ancho, this.alto);
    } else {
      // Si aún no cargó, uso el rectángulo como respaldo
      ctx.fillStyle = "#333333";
      ctx.fillRect(this.x, this.y, this.ancho, this.alto);

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(this.x + this.ancho - 10, this.y + 10, 6, 6);
    }
  }
}

// Clase Obstaculo (los "cactus")
class Obstaculo {
  constructor() {
    // Tamaño aleatorio dentro de un rango para que no todos los cactus se vean iguales
    this.ancho = 20 + Math.random() * 20;   // 20 a 40
    this.alto = 30 + Math.random() * 40;    // 30 a 70
    this.x = canvas.width;

    const sueloY = canvas.height - 40;
    this.y = sueloY - this.alto;
  }

  actualizar() {
    // Se mueve hacia la izquierda con la velocidad actual del juego
    this.x -= velocidad;
  }

  dibujar() {
    // Si la imagen del cactus está cargada, la uso
    if (imgCactus.complete && imgCactus.naturalWidth > 0) {
      ctx.drawImage(imgCactus, this.x, this.y, this.ancho, this.alto);
    } else {
      // Rectángulo de respaldo en caso de que no se cargue la imagen
      ctx.fillStyle = "#2f8f2f";
      ctx.fillRect(this.x, this.y, this.ancho, this.alto);
    }
  }
}


// ======================================================
//  SECCIÓN 5: FUNCIONES DEL JUEGO
// ======================================================

// Comprueba si dos rectángulos se están tocando (colisión)
function hayColision(rect1, rect2) {
  return (
    rect1.x < rect2.x + rect2.ancho &&
    rect1.x + rect1.ancho > rect2.x &&
    rect1.y < rect2.y + rect2.alto &&
    rect1.y + rect1.alto > rect2.y
  );
}

// Actualiza el HUD (puntaje y vidas)
function actualizarHUD() {
  if (hudScoreSpan) {
    hudScoreSpan.textContent = "Puntos: " + Math.floor(puntaje);
  }
  if (hudLivesSpan) {
    hudLivesSpan.textContent = "Vidas: " + vidas;
  }
}

// Muestra el panel de Game Over
function mostrarGameOver() {
  if (spanGameOverScore) {
    spanGameOverScore.textContent = Math.floor(puntaje);
  }
  if (panelGameOver) {
    panelGameOver.classList.remove("oculto");
  }
}

// Oculta el panel de Game Over
function ocultarGameOver() {
  if (panelGameOver) {
    panelGameOver.classList.add("oculto");
  }
}

// Lógica que se ejecuta cuando ya no quedan vidas
function terminarJuego() {
  if (juegoTerminado) return;
  juegoTerminado = true;

  // Al terminar la partida, la guardo en el historial del usuario actual
  registrarPartida(Math.floor(puntaje), "perdió");

  // Muestro la tarjeta de Game Over
  mostrarGameOver();
}

// Bucle principal del juego (animación con requestAnimationFrame)
function gameLoop() {
  // Si el juego terminó, detenemos la animación
  if (juegoTerminado) {
    animacionId = null;
    return;
  }

  // Limpiar el canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Dibujar fondo
  ctx.fillStyle = "#fafafa";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Dibujar suelo
  const sueloY = canvas.height - 40;
  ctx.fillStyle = "#dddddd";
  ctx.fillRect(0, sueloY, canvas.width, 40);
  ctx.strokeStyle = "#bbbbbb";
  ctx.beginPath();
  ctx.moveTo(0, sueloY);
  ctx.lineTo(canvas.width, sueloY);
  ctx.stroke();

  // Actualizar y dibujar jugador
  jugador.actualizar();
  jugador.dibujar();

  // Crear nuevos obstáculos cada cierto número de frames
  contadorFrames++;
  if (contadorFrames >= intervaloObstaculos) {
    obstaculos.push(new Obstaculo());
    contadorFrames = 0;

    // Voy reduciendo el intervalo para aumentar la dificultad (sin bajar de 40 frames)
    if (intervaloObstaculos > 40) {
      intervaloObstaculos -= 1;
    }
  }

  // Actualizar y dibujar obstáculos
  for (let i = 0; i < obstaculos.length; i++) {
    obstaculos[i].actualizar();
    obstaculos[i].dibujar();
  }

  // Eliminar obstáculos que ya salieron de la pantalla
  obstaculos = obstaculos.filter(function (obs) {
    return obs.x + obs.ancho > 0;
  });

  // Revisar colisiones entre el jugador y cada obstáculo
  for (let i = 0; i < obstaculos.length; i++) {
    if (hayColision(jugador, obstaculos[i])) {
      // Si choca, le quito una vida y elimino ese obstáculo
      vidas--;
      obstaculos.splice(i, 1);
      i--;

      if (vidas <= 0) {
        terminarJuego();
      }
    }
  }

  // Aumentar puntaje poco a poco
  puntaje += 0.5;

  // Aumentar un poco la velocidad con el tiempo para que el juego se vuelva más difícil
  velocidad = 6 + puntaje * 0.02;

  // Actualizar HUD
  actualizarHUD();

  // Pedir el siguiente frame
  animacionId = requestAnimationFrame(gameLoop);
}

// Inicia o reinicia el juego
function iniciarJuego() {
  if (!canvas || !ctx) return;

  // Resetear variables del juego
  jugador = new Jugador();
  obstaculos = [];
  puntaje = 0;
  vidas = 3;
  velocidad = 6;
  juegoTerminado = false;
  contadorFrames = 0;
  intervaloObstaculos = 90;

  ocultarGameOver();
  actualizarHUD();

  // Comenzar animación
  if (animacionId) {
    cancelAnimationFrame(animacionId);
  }
  animacionId = requestAnimationFrame(gameLoop);
}


// ======================================================
//  SECCIÓN 6: INICIALIZACIÓN Y EVENTOS
// ======================================================
// En este bloque conecto todo el JavaScript con el HTML:
// formularios, botones y teclado. También decido qué pantalla
// se muestra al cargar la página (login o perfil).

document.addEventListener("DOMContentLoaded", function () {
  // Referencias a elementos de la interfaz
  const formLogin = document.getElementById("form-login");
  const formRegistro = document.getElementById("form-registro");

  const btnIrRegistro = document.getElementById("btn-ir-registro");
  const btnIrLogin = document.getElementById("btn-ir-login");

  const btnIrJuego = document.getElementById("btn-ir-juego");
  const btnIrHistorial = document.getElementById("btn-ir-historial");
  const btnCerrarSesion = document.getElementById("btn-cerrar-sesion");
  const btnHistorialVolver = document.getElementById("btn-historial-volver");

  const btnReiniciarJuego = document.getElementById("btn-reiniciar-juego");
  const btnSalirJuego = document.getElementById("btn-salir-juego");
  const btnGameOverReintentar = document.getElementById("btn-game-over-reintentar");
  const btnGameOverSalir = document.getElementById("btn-game-over-salir");

  // Canvas y contexto
  canvas = document.getElementById("gameCanvas");
  if (canvas) {
    ctx = canvas.getContext("2d");
  }

  // HUD
  hudPlayerSpan = document.getElementById("hud-player");
  hudScoreSpan = document.getElementById("hud-score");
  hudLivesSpan = document.getElementById("hud-lives");

  // Game Over
  panelGameOver = document.getElementById("game-over");
  spanGameOverScore = document.getElementById("game-over-score");

  // ----- Navegación entre login y registro -----
  if (btnIrRegistro) {
    btnIrRegistro.addEventListener("click", function () {
      mostrarPantalla("pantalla-registro");
    });
  }

  if (btnIrLogin) {
    btnIrLogin.addEventListener("click", function () {
      mostrarPantalla("pantalla-login");
    });
  }

  // ----- Registro de usuario -----
  if (formRegistro) {
    formRegistro.addEventListener("submit", function (e) {
      e.preventDefault();

      const username = document.getElementById("reg-username").value.trim();
      const email = document.getElementById("reg-email").value.trim();
      const password = document.getElementById("reg-password").value.trim();
      const extra = document.getElementById("reg-extra").value.trim();

      // Valido que los campos obligatorios no vayan vacíos
      if (!username || !email || !password) {
        alert("Por favor, llena los campos obligatorios.");
        return;
      }

      const usuarios = cargarUsuarios();

      // Verificar si ya existe un usuario con ese correo
      for (let i = 0; i < usuarios.length; i++) {
        if (usuarios[i].email === email) {
          alert("Ya existe un usuario con ese correo.");
          return;
        }
      }

      const nuevoUsuario = {
        username: username,
        email: email,
        password: password,
        extra: extra,
      };

      usuarios.push(nuevoUsuario);
      guardarUsuarios(usuarios);

      alert("Registro exitoso. Ahora puedes iniciar sesión.");
      formRegistro.reset();
      mostrarPantalla("pantalla-login");
    });
  }

  // ----- Inicio de sesión -----
  if (formLogin) {
    formLogin.addEventListener("submit", function (e) {
      e.preventDefault();

      const email = document.getElementById("login-email").value.trim();
      const password = document.getElementById("login-password").value.trim();

      const usuarios = cargarUsuarios();
      let usuarioEncontrado = null;

      // Busco un usuario que coincida con el correo y la contraseña ingresados
      for (let i = 0; i < usuarios.length; i++) {
        if (usuarios[i].email === email && usuarios[i].password === password) {
          usuarioEncontrado = usuarios[i];
          break;
        }
      }

      if (!usuarioEncontrado) {
        alert("Correo o contraseña incorrectos.");
        return;
      }

      // Guardar sesión actual en localStorage
      guardarUsuarioActualEmail(usuarioEncontrado.email);

      // Actualizar HUD con el nombre del jugador
      if (hudPlayerSpan) {
        hudPlayerSpan.textContent = "Jugador: " + usuarioEncontrado.username;
      }

      formLogin.reset();
      actualizarPerfil();
      mostrarPantalla("pantalla-perfil");
    });
  }

  // ----- Ir a juego desde el perfil -----
  if (btnIrJuego) {
    btnIrJuego.addEventListener("click", function () {
      const usuario = obtenerUsuarioActual();
      if (!usuario) {
        alert("Debes iniciar sesión primero.");
        mostrarPantalla("pantalla-login");
        return;
      }

      if (hudPlayerSpan) {
        hudPlayerSpan.textContent = "Jugador: " + usuario.username;
      }

      mostrarPantalla("pantalla-juego");
      iniciarJuego();
    });
  }

  // ----- Ir a historial desde el perfil -----
  if (btnIrHistorial) {
    btnIrHistorial.addEventListener("click", function () {
      llenarHistorial();
      mostrarPantalla("pantalla-historial");
    });
  }

  // ----- Volver del historial al perfil -----
  if (btnHistorialVolver) {
    btnHistorialVolver.addEventListener("click", function () {
      actualizarPerfil();
      mostrarPantalla("pantalla-perfil");
    });
  }

  // ----- Cerrar sesión -----
  if (btnCerrarSesion) {
    btnCerrarSesion.addEventListener("click", function () {
      // Borro el usuario actual del localStorage y regreso al login
      guardarUsuarioActualEmail(null);
      mostrarPantalla("pantalla-login");
    });
  }

  // ----- Botones dentro de la pantalla de juego -----
  if (btnReiniciarJuego) {
    btnReiniciarJuego.addEventListener("click", function () {
      iniciarJuego();
    });
  }

  if (btnSalirJuego) {
    btnSalirJuego.addEventListener("click", function () {
      // Volvemos al perfil y apagamos el juego
      juegoTerminado = true;
      if (animacionId) {
        cancelAnimationFrame(animacionId);
        animacionId = null;
      }
      mostrarPantalla("pantalla-perfil");
      actualizarPerfil();
    });
  }

  if (btnGameOverReintentar) {
    btnGameOverReintentar.addEventListener("click", function () {
      iniciarJuego();
    });
  }

  if (btnGameOverSalir) {
    btnGameOverSalir.addEventListener("click", function () {
      juegoTerminado = true;
      if (animacionId) {
        cancelAnimationFrame(animacionId);
        animacionId = null;
      }
      mostrarPantalla("pantalla-perfil");
      actualizarPerfil();
    });
  }

  // ----- Controles del teclado (salto) -----
  document.addEventListener("keydown", function (e) {
    if (e.code === "Space" || e.code === "ArrowUp") {
      // Evito que la página haga scroll al usar la barra espaciadora
      e.preventDefault();

      if (jugador && !juegoTerminado) {
        jugador.saltar();
      }
    }
  });

  // ----- Pantalla inicial al cargar la página -----
  // Si ya había un usuario logueado (guardado en localStorage), lo mando directo al perfil.
  // Si no, muestro la pantalla de login.
  const usuarioActual = obtenerUsuarioActual();
  if (usuarioActual) {
    if (hudPlayerSpan) {
      hudPlayerSpan.textContent = "Jugador: " + usuarioActual.username;
    }
    actualizarPerfil();
    mostrarPantalla("pantalla-perfil");
  } else {
    mostrarPantalla("pantalla-login");
  }
});
