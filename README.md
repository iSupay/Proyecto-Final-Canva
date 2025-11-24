# Dino Runner – Proyecto Final de Programación Web

## Descripción del juego

**Dino Runner** es un juego tipo “endless runner” inspirado en el dinosaurio de Google Chrome.  
El jugador controla a un dinosaurio que corre automáticamente por el desierto y debe saltar para esquivar cactus que aparecen de forma aleatoria.  

Además del juego en sí, el proyecto incluye:

- Pantalla de **registro** de usuarios.
- Pantalla de **inicio de sesión**.
- Pantalla de **perfil**, donde se muestran los datos del jugador y sus estadísticas.
- Pantalla de **historial**, donde se guardan y muestran las partidas jugadas.

Toda la información se almacena en el navegador usando `localStorage`, para que el usuario pueda cerrar y abrir la página sin perder sus datos.

---

## Mecánica principal

La mecánica principal es un **runner lateral de un solo botón**:

- El dinosaurio avanza constantemente hacia la derecha (dentro del canvas se simula moviendo los obstáculos hacia la izquierda).
- Cada cierto tiempo aparecen cactus con tamaños y posiciones variables.
- Si el dino choca con un cactus, el jugador pierde una vida.
- El jugador comienza con **3 vidas**.
- El **puntaje** aumenta automáticamente con el tiempo.  
- La **velocidad del juego** se incrementa conforme sube el puntaje, haciendo que el juego sea cada vez más difícil.
- Cuando las vidas llegan a 0:
  - Se muestra una tarjeta de **“Game Over”** con el puntaje final.
  - Se registra la partida en el historial del usuario (fecha, puntaje y estado).

---

## Cómo jugar

1. **Registro / Login**
   - Al abrir la página se muestra primero la pantalla de **inicio de sesión**.
   - Si el usuario no tiene cuenta, puede ir a **“Registrarme”**, donde se pide:
     - Nombre de usuario
     - Correo electrónico
     - Contraseña
     - Color favorito del dino (dato extra solicitado en el proyecto)
   - Los datos del usuario se guardan en `localStorage`.
   - Para entrar al juego se debe iniciar sesión con el correo y la contraseña registrados.

2. **Perfil del jugador**
   - Después de iniciar sesión se muestra la pantalla de **perfil**.
   - Ahí aparece:
     - Nombre de usuario
     - Correo
     - Color favorito del dino
     - Número de partidas jugadas
     - Mejor puntaje
     - Puntaje total acumulado
   - Desde esta pantalla se puede:
     - Empezar a jugar (**botón “Jugar”**).
     - Ver el historial de partidas.
     - Cerrar sesión.

3. **Pantalla de juego**
   - Al entrar al juego se muestra el **HUD** con:
     - Nombre del jugador
     - Puntaje actual
     - Vidas restantes
   - Controles:
     - **Barra espaciadora** o **Flecha arriba** → el dino salta.
   - Objetivo:
     - Esquivar la mayor cantidad posible de cactus.
     - Mientras más tiempo se sobreviva, más puntaje se acumula.
   - Botones dentro del juego:
     - **Reiniciar** → empieza una nueva partida desde cero.
     - **Volver al perfil** → termina la partida actual y regresa al perfil del usuario.

4. **Game Over e historial**
   - Cuando el jugador se queda sin vidas:
     - Se muestra un panel de **Game Over** con el puntaje obtenido.
     - Desde ahí se puede:
       - **Reintentar** → iniciar una nueva partida.
       - **Volver al perfil**.
   - Cada partida se guarda en el historial del usuario con:
     - Fecha y hora
     - Puntaje final
     - Estado (en este caso, “perdió”)
   - En la pantalla de **Historial** se muestran las partidas en una tabla ordenada de la más reciente a la más antigua.

---

## Qué tecnologías se usaron

- **HTML5**
  - Estructura de las pantallas: login, registro, perfil, juego (canvas) e historial.
  - Uso de etiquetas semánticas como `<header>`, `<main>`, `<section>`, `<footer>`, `<table>`, etc.

- **CSS3**
  - Estilos generales del sitio.
  - Diseño de las pantallas como “tarjetas”.
  - Estilos responsivos para pantallas pequeñas (media queries).
  - Estilo del HUD, botones y tabla de historial.

- **JavaScript (Vanilla)**
  - Manejo de formularios de **registro** e **inicio de sesión**.
  - Uso de **`localStorage`** para:
    - Guardar usuarios registrados.
    - Guardar el usuario que está logueado.
    - Guardar el historial de partidas.
  - Manejo de pantallas a través de clases CSS (`.pantalla` y `.activa`).
  - Lógica del juego con:
    - Clases `Jugador` y `Obstaculo`.
    - Detección de colisiones.
    - Control de vidas, puntaje y dificultad.
    - Animación continua usando `requestAnimationFrame`.

- **Canvas de HTML5**
  - Dibujo del fondo, del suelo, del dinosaurio y de los cactus.
  - Movimiento y actualización de la escena en cada frame.

- **Imágenes / Sprites**
  - Sprite del **dino**: `00 Recursos/img/dino.png`
  - Sprite de los **cactus**: `00 Recursos/img/cactus.png`

- **Librería de íconos**
  - **FontAwesome** para los iconos en títulos y botones (play, usuario, historial, etc.).

---

## Créditos y autores

- **Nombre del alumno:** _[Escribir nombre completo]_  
- **Carrera / Materia:** _[Escribir carrera y nombre de la materia]_  
- **Profesor(a):** _[Nombre del profesor]_  
- **Institución:** _[Nombre de la universidad]_  

> Todos los assets gráficos originales del dino, cactus y estilos fueron adaptados/creados específicamente para este proyecto académico.
