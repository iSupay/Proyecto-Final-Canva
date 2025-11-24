// JS/game.js

// Variables globales para manejar el canvas y el estado del juego
let canvas = null;
let ctx = null;
let game = null;
let animationId = null;
let lastTime = 0;
let controlsInitialized = false;

// Referencias al HUD y al panel de Game Over
let hudScoreSpan = null;
let hudLivesSpan = null;
let gameOverPanel = null;
let gameOverScoreSpan = null;

// ===== CLASES DEL JUEGO =====

// Clase que representa al jugador (el "dino")
class Player {
  constructor(game) {
    this.game = game;
    this.width = 40;
    this.height = 50;
    this.x = 60;

    // Defino el "suelo" a 40 px del borde inferior del canvas
    this.groundY = this.game.height - 40;
    this.y = this.groundY - this.height;

    this.vy = 0;          // velocidad vertical
    this.gravity = 0.6;   // gravedad que empuja hacia abajo
    this.jumpStrength = -12; // fuerza del salto (negativa porque va hacia arriba)
  }

  update() {
    // Aplico gravedad y actualizo la posición vertical
    this.vy += this.gravity;
    this.y += this.vy;

    // Evito que el jugador atraviese el suelo
    if (this.y > this.groundY - this.height) {
      this.y = this.groundY - this.height;
      this.vy = 0;
    }
  }

  jump() {
    // Solo permito saltar si está sobre el suelo (con un pequeño margen)
    if (this.y >= this.groundY - this.height - 1) {
      this.vy = this.jumpStrength;
    }
  }

  draw(ctx) {
    // Dibujo el dino como un rectángulo oscuro
    ctx.fillStyle = "#333333";
    ctx.fillRect(this.x, this.y, this.width, this.height);

    // Le agrego un "ojo" blanco como detalle
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(this.x + this.width - 10, this.y + 10, 6, 6);
  }
}

// Clase para los obstáculos (cactus)
class Obstacle {
  constructor(game) {
    this.game = game;

    // Asigno un tamaño aleatorio dentro de un rango para que no todos sean iguales
    this.width = 20 + Math.random() * 20; // 20 a 40
    this.height = 30 + Math.random() * 40; // 30 a 70
    this.x = this.game.width;
    this.y = this.game.height - 40 - this.height; // los coloco apoyados sobre el suelo
  }

  update(deltaTime) {
    // Muevo el obstáculo hacia la izquierda.
    // Uso deltaTime para que el movimiento sea más estable según los FPS.
    const factor = deltaTime / 16.67; // 16.67ms ~ 60fps
    this.x -= this.game.speed * factor;
  }

  draw(ctx) {
    // Dibujo el cactus como un rectángulo verde
    ctx.fillStyle = "#2f8f2f";
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }
}

// Clase principal del juego, aquí controlo todo: jugador, obstáculos, puntaje, vidas, etc.
class Game {
  constructor(ctx, width, height, onScoreChange, onLivesChange, onGameOver) {
    this.ctx = ctx;
    this.width = width;
    this.height = height;

    // Callbacks para comunicar cambios al HUD y registrar la partida
    this.onScoreChange = onScoreChange || function () {};
    this.onLivesChange = onLivesChange || function () {};
    this.onGameOver = onGameOver || function () {};

    this.reset();
  }

  // Método para reiniciar el estado del juego
  reset() {
    this.player = new Player(this);
    this.obstacles = [];
    this.score = 0;
    this.lives = 3;
    this.speed = 6;
    this.timeToNextObstacle = 1000; // milisegundos para el siguiente obstáculo
    this.gameOver = false;

    this.onScoreChange(this.getScore());
    this.onLivesChange(this.lives);
  }

  getScore() {
    // Redondeo el score para mostrarlo como número entero
    return Math.floor(this.score);
  }

  update(deltaTime) {
    if (this.gameOver) return;

    // Aumento puntaje con el tiempo transcurrido
    this.score += deltaTime * 0.01; // ~10 puntos por segundo aprox.
    this.onScoreChange(this.getScore());

    // Incremento la velocidad del juego conforme aumenta el puntaje
    this.speed = 6 + this.getScore() * 0.02;

    // Manejo del tiempo para crear nuevos obstáculos
    this.timeToNextObstacle -= deltaTime;
    if (this.timeToNextObstacle <= 0) {
      this.obstacles.push(new Obstacle(this));

      // Hago que el intervalo entre obstáculos se reduzca a medida que el jugador avanza
      const dificultad = Math.max(400, 1200 - this.getScore() * 5);
      this.timeToNextObstacle =
        400 + Math.random() * (dificultad - 400); // intervalo aleatorio entre 400 y "dificultad"
    }

    // Actualizo el jugador
    this.player.update();

    // Actualizo cada obstáculo y elimino los que ya salieron de la pantalla
    this.obstacles.forEach((o) => o.update(deltaTime));
    this.obstacles = this.obstacles.filter((o) => o.x + o.width > 0);

    // Reviso colisiones entre el jugador y cada obstáculo
    this.obstacles.forEach((o) => {
      if (this.checkCollision(this.player, o)) {
        this.handleCollision(o);
      }
    });
  }

  draw() {
    const ctx = this.ctx;

    // Limpio el canvas completo
    ctx.clearRect(0, 0, this.width, this.height);

    // Dibujo un fondo claro
    ctx.fillStyle = "#fafafa";
    ctx.fillRect(0, 0, this.width, this.height);

    // Dibujo el suelo al final del canvas
    const groundY = this.height - 40;
    ctx.fillStyle = "#dddddd";
    ctx.fillRect(0, groundY, this.width, 40);

    ctx.strokeStyle = "#bbbbbb";
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(this.width, groundY);
    ctx.stroke();

    // Dibujo al jugador y a cada obstáculo
    this.player.draw(ctx);
    this.obstacles.forEach((o) => o.draw(ctx));
  }

  // Detección de colisiones usando intersección de rectángulos
  checkCollision(a, b) {
    return (
      a.x < b.x + b.width &&
      a.x + a.width > b.x &&
      a.y < b.y + b.height &&
      a.y + a.height > b.y
    );
  }

  // Qué pasa cuando el jugador choca contra un obstáculo
  handleCollision(obstacle) {
    // Elimino el obstáculo con el que chocó
    this.obstacles = this.obstacles.filter((o) => o !== obstacle);

    this.lives -= 1;
    this.onLivesChange(this.lives);

    if (this.lives <= 0) {
      // Si ya no tiene vidas, termino el juego
      this.endGame("perdió");
    } else {
      // Si todavía tiene vidas, solo lo "reseteo" al suelo
      this.player.y = this.player.groundY - this.player.height;
      this.player.vy = 0;
    }
  }

  // Cierro la partida y aviso fuera de la clase usando el callback
  endGame(estado) {
    if (this.gameOver) return;
    this.gameOver = true;
    this.onGameOver(this.getScore(), estado || "terminada");
  }
}

// ===== HUD Y GAME OVER =====

// Actualiza el texto del puntaje en el HUD
function actualizarHudScore(score) {
  if (!hudScoreSpan) {
    hudScoreSpan = document.getElementById("hud-score");
  }
  if (hudScoreSpan) {
    hudScoreSpan.textContent = "Puntos: " + score;
  }
}

// Actualiza el texto de las vidas en el HUD
function actualizarHudLives(lives) {
  if (!hudLivesSpan) {
    hudLivesSpan = document.getElementById("hud-lives");
  }
  if (hudLivesSpan) {
    hudLivesSpan.textContent = "Vidas: " + lives;
  }
}

// Muestra el panel de Game Over con el puntaje final
function mostrarGameOver(score) {
  if (!gameOverPanel) {
    gameOverPanel = document.getElementById("game-over");
  }
  if (!gameOverScoreSpan) {
    gameOverScoreSpan = document.getElementById("game-over-score");
  }

  if (gameOverScoreSpan) {
    gameOverScoreSpan.textContent = score;
  }
  if (gameOverPanel) {
    gameOverPanel.classList.remove("oculto");
  }
}

// Oculta el panel de Game Over
function ocultarGameOver() {
  if (!gameOverPanel) {
    gameOverPanel = document.getElementById("game-over");
  }
  if (gameOverPanel) {
    gameOverPanel.classList.add("oculto");
  }
}

// Esta función se llama cuando el juego termina (sin vidas)
function manejarFinDePartida(score, estado) {
  // Registro la partida en el historial si existe la función global registrarPartida
  if (typeof window.registrarPartida === "function") {
    window.registrarPartida(score, estado);
  }

  // Muestro el panel de Game Over
  mostrarGameOver(score);

  // Detengo la animación (dejo de pedir nuevos frames)
  animationId = null;
}

// ===== LOOP DEL JUEGO =====

// Bucle principal del juego usando requestAnimationFrame
function gameLoop(timestamp) {
  if (!lastTime) lastTime = timestamp;
  const deltaTime = timestamp - lastTime;
  lastTime = timestamp;

  if (game && !game.gameOver) {
    game.update(deltaTime);
    game.draw();
    animationId = requestAnimationFrame(gameLoop);
  } else {
    // Si el juego ya terminó, no pido un nuevo frame
  }
}

// ===== CONTROLES & EVENTOS =====

// Manejo de las teclas para hacer saltar al jugador
function handleKeyDown(e) {
  if (e.code === "Space" || e.code === "ArrowUp") {
    e.preventDefault();
    if (game && !game.gameOver) {
      game.player.jump();
    }
  }
}

// Sale del juego y regresa a la pantalla de perfil
function salirAlPerfil() {
  // Detengo la animación
  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
  if (game) {
    game.gameOver = true;
  }
  ocultarGameOver();

  // Cambio la pantalla si la función existe
  if (typeof window.mostrarPantalla === "function") {
    window.mostrarPantalla("pantalla-perfil");
  }
}

// Inicialización de controles (solo los configuro una vez)
function initControls() {
  if (controlsInitialized) return;
  controlsInitialized = true;

  // Controles de teclado para saltar
  document.addEventListener("keydown", handleKeyDown);

  // Botones dentro de la pantalla de juego
  const btnReiniciar = document.getElementById("btn-reiniciar-juego");
  const btnSalir = document.getElementById("btn-salir-juego");
  const btnGOReintentar = document.getElementById(
    "btn-game-over-reintentar"
  );
  const btnGOSalir = document.getElementById("btn-game-over-salir");

  if (btnReiniciar) {
    btnReiniciar.addEventListener("click", () => {
      startGame();
    });
  }

  if (btnSalir) {
    btnSalir.addEventListener("click", () => {
      salirAlPerfil();
    });
  }

  if (btnGOReintentar) {
    btnGOReintentar.addEventListener("click", () => {
      ocultarGameOver();
      startGame();
    });
  }

  if (btnGOSalir) {
    btnGOSalir.addEventListener("click", () => {
      salirAlPerfil();
    });
  }
}

// ===== FUNCIÓN PÚBLICA PARA INICIAR EL JUEGO =====

// Esta función se llama desde el archivo principal para arrancar una nueva partida
function startGame() {
  if (!canvas) {
    canvas = document.getElementById("gameCanvas");
    if (!canvas) {
      console.error("No se encontró el canvas con id 'gameCanvas'");
      return;
    }
    ctx = canvas.getContext("2d");
  }

  initControls();
  ocultarGameOver();

  // Reinicio el tiempo y la animación
  lastTime = 0;
  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }

  // Creo una nueva instancia de Game con las funciones que actualizan el HUD y el historial
  game = new Game(
    ctx,
    canvas.width,
    canvas.height,
    actualizarHudScore,
    actualizarHudLives,
    manejarFinDePartida
  );

  // Inicio el loop de animación
  animationId = requestAnimationFrame(gameLoop);
}

// Expongo startGame en el objeto window para poder llamarlo desde otros scripts (por ejemplo main.js)
window.startGame = startGame;
