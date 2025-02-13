const backgroundMusic = new Audio("audio/M_RetroArcade_MusicLoop_01.wav"); // Path to music file
backgroundMusic.loop = true; // Makes the music loop continuously
backgroundMusic.volume = 0.5; // Adjust volume (0.0 to 1.0)

const hitSound = new Audio("audio/hit.wav"); // Sound effect when hitting the border
hitSound.volume = 0.7; // Adjust volume (0.0 to 1.0)

const clickSound = new Audio("audio/click.wav"); // Sound effect when clicking the circle
clickSound.volume = 1.0; // Full volume

document.addEventListener("DOMContentLoaded", () => {
  const levelElement = document.getElementById("level");
  const lastScoreElement = document.getElementById("cnt-score");
  const hiScoreElement = document.getElementById("cnt-hi-score");
  const replayElement = document.getElementById("replay");
  const nextLevelElement = document.getElementById("next-level");
  const prevLevelElement = document.getElementById("prev-level");
  const startButton = document.getElementById("start-button");
  const timerDisplay = document.getElementById("timer-cnt");
  const gameMessage = document.getElementById("game-message");
  const canvas = document.getElementById("game-canvas");
  const ctx = canvas.getContext("2d");
  let gameEnded = false;
  let circleRadius = 50;

  let circle,
    posX,
    posY,
    velocityX,
    velocityY,
    timer,
    startTime,
    animationFrame;
  let currentLevel = 1;
  const minLevel = 1;
  const maxLevel = 5;
  const baseSpeed = 2;
  const speedIncreaseFactor = 1.15;
  const serverUrl = "http://localhost:3000"; // Backend URL

  updateLevelDisplay();
  fetchHighScore(currentLevel);

  function resizeCanvas() {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
  }
  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();

  // ✅ Event Listeners
  startButton.addEventListener("click", startGame);
  replayElement.addEventListener("click", restartGame);
  nextLevelElement.addEventListener("click", nextLevel);
  prevLevelElement.addEventListener("click", prevLevel);

  // ✅ Fetch High Score for Current Level
  async function fetchHighScore(level) {
    try {
      const response = await fetch(`${serverUrl}/highscores/${level}`);
      const data = await response.json();
      hiScoreElement.textContent =
        data.highScore !== null ? data.highScore : "-";
    } catch (error) {
      console.error("Failed to fetch high score:", error);
    }
  }

  // ✅ Save New High Score
  async function updateHighScore(level, score) {
    try {
      await fetch(`${serverUrl}/highscores/${level}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ highScore: score }),
      });
    } catch (error) {
      console.error("Failed to update high score:", error);
    }
  }

  function startGame() {
    gameEnded = false; // Reset flag for new game
    resetGame();
    backgroundMusic.play(); // 🎵 Start music when game begins
    startButton.classList.add("hidden");
    gameMessage.classList.add("hidden");
    timerDisplay.textContent = "0.0";
    startTimer();
    spawnCircle();
  }

  function restartGame() {
    if (circle) {
      circle.remove();
    }
    cancelAnimationFrame(animationFrame);
    clearInterval(timer);
    startGame();
  }

  function startTimer() {
    startTime = performance.now();
    timer = setInterval(() => {
      let elapsedTime = (performance.now() - startTime) / 1000;
      timerDisplay.textContent = elapsedTime.toFixed(2);
    }, 10);
  }

  function drawCircle(x, y, radius, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  function spawnCircle() {
    posX = canvas.width / 2;
    posY = canvas.height / 2;
    let speed = baseSpeed + currentLevel * speedIncreaseFactor;
    velocityX = speed * (Math.random() > 0.5 ? 1 : -1);
    velocityY = speed * (Math.random() > 0.5 ? 1 : -1);

    moveCircle(); // Start movement

    // ✅ Remove any previous click listeners before adding a new one
    canvas.removeEventListener("pointerdown", handleCircleClick);
    canvas.addEventListener("pointerdown", handleCircleClick);
  }

  // ✅ Keep `moveCircle()` outside `spawnCircle()` to avoid multiple animations
  function moveCircle() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawCircle(posX, posY, circleRadius, "#ffcc00");

    posX += velocityX;
    posY += velocityY;

    // ✅ Fix Left Border Collision
    if (posX - circleRadius <= 0) {
      posX = circleRadius; // Prevent going out of bounds
      velocityX = -velocityX;
      hitSound.play();
    }

    // ✅ Fix Right Border Collision
    if (posX + circleRadius >= canvas.width) {
      posX = canvas.width - circleRadius;
      velocityX = -velocityX;
      hitSound.play();
    }

    // ✅ Fix Top Border Collision
    if (posY - circleRadius <= 0) {
      posY = circleRadius;
      velocityY = -velocityY;
      hitSound.play();
    }

    // ✅ Fix Bottom Border Collision
    if (posY + circleRadius >= canvas.height) {
      posY = canvas.height - circleRadius;
      velocityY = -velocityY;
      hitSound.play();
    }

    animationFrame = requestAnimationFrame(moveCircle);
  }

  function endGame() {
    if (gameEnded) return; // Prevent multiple executions
    gameEnded = true; // Set flag

    clearInterval(timer);
    cancelAnimationFrame(animationFrame);
    //backgroundMusic.pause();
    backgroundMusic.currentTime = 0; // Reset music

    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas

    let currentTime = parseFloat(timerDisplay.textContent);
    let hiScore = parseFloat(hiScoreElement.textContent);

    // Display time result
    gameMessage.innerHTML = `Your time: ${currentTime.toFixed(2)} sec`;

    // If it's a new high score, add a new line with "New High Score!"
    if (hiScoreElement.textContent === "-" || currentTime < hiScore) {
      hiScoreElement.textContent = currentTime.toFixed(2);
      updateHighScore(currentLevel, currentTime.toFixed(2));
      gameMessage.innerHTML += `<br>New High Score! 🎉`; // Proper new line
    }

    gameMessage.classList.remove("hidden");
    lastScoreElement.textContent = currentTime.toFixed(2);
    startButton.classList.remove("hidden"); // Show start button
  }

  function resetGame() {
    cancelAnimationFrame(animationFrame); // Stop animation loop
    clearInterval(timer); // Stop the timer
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas
    startButton.classList.remove("hidden"); // Show start button
  }

  function updateLevelDisplay() {
    levelElement.textContent = `LEVEL 1-${currentLevel}`;
  }

  function nextLevel() {
    if (currentLevel < maxLevel) {
      currentLevel++;
      prepareEnv();
    }
  }

  function prevLevel() {
    if (currentLevel > minLevel) {
      currentLevel--;
      prepareEnv();
    }
  }

  function prepareEnv() {
    updateLevelDisplay();
    lastScoreElement.textContent = `-`;
    fetchHighScore(currentLevel);

    // Ensure UI elements are reset properly
    gameMessage.classList.add("hidden"); // Hide game message
    startButton.classList.remove("hidden"); // Show start button
    restartGame(); // Fully reset game state
  }

  canvas.removeEventListener("click", handleCircleClick);
  canvas.addEventListener("click", handleCircleClick);

  function handleCircleClick(event) {
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    if (
      Math.sqrt((mouseX - posX) ** 2 + (mouseY - posY) ** 2) <= circleRadius
    ) {
      clickSound.play();
      endGame();
    }
  }
});
