const backgroundMusic = new Audio("audio\\M_RetroArcade_MusicLoop_01.wav"); // Path to music file
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
  const board = document.getElementById("board");

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

  // ✅ Initialize Game & Fetch High Score
  window.onload = () => {
    updateLevelDisplay();
    fetchHighScore(currentLevel);
  };

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

  function spawnCircle() {
    circle = document.createElement("div");
    circle.classList.add("circle");
    board.appendChild(circle);
    posX = 50;
    posY = 50;

    // Adjust Speed Based on Level
    let speed = baseSpeed + currentLevel * speedIncreaseFactor;

    velocityX = speed * (Math.random() > 0.5 ? 1 : -1);
    velocityY = speed * (Math.random() > 0.5 ? 1 : -1);

    circle.style.display = "block";

    function moveCircle() {
      posX += velocityX;
      posY += velocityY;

      // Detect border collision and play sound
      if (posX <= 0 || posX + circle.clientWidth >= board.clientWidth) {
        velocityX = -velocityX;
        hitSound.play(); // 🔊 Play border hit sound
      }
      if (posY <= 0 || posY + circle.clientHeight >= board.clientHeight) {
        velocityY = -velocityY;
        hitSound.play(); // 🔊 Play border hit sound
      }

      circle.style.left = posX + "px";
      circle.style.top = posY + "px";

      animationFrame = requestAnimationFrame(moveCircle);
    }

    moveCircle();

    // 🔊 Play click sound when the user clicks the circle
    circle.addEventListener("click", () => {
      clickSound.play();
      endGame();
    });
  }

  function endGame() {
    clearInterval(timer);
    cancelAnimationFrame(animationFrame);
    //backgroundMusic.pause(); // 🎵 Pause music when game ends

    let currentTime = parseFloat(timerDisplay.textContent);
    let hiScore = parseFloat(hiScoreElement.textContent);

    gameMessage.textContent = `Your time: ${currentTime.toFixed(2)} sec`;

    if (hiScoreElement.textContent === "-" || currentTime < hiScore) {
      hiScoreElement.textContent = currentTime.toFixed(2);
      updateHighScore(currentLevel, currentTime.toFixed(2));
      gameMessage.textContent += `\nNew High Score! 🎉`;
    }

    gameMessage.classList.remove("hidden");
    lastScoreElement.textContent = currentTime.toFixed(2);
    resetGame();
  }

  function resetGame() {
    if (circle) {
      circle.remove(); // Remove the existing circle before replaying
    }
    cancelAnimationFrame(animationFrame); // Stop existing movement animation
    clearInterval(timer); // Stop previous timer
    startButton.classList.remove("hidden");
  }

  function updateLevelDisplay() {
    levelElement.textContent = `LEVEL 1-${currentLevel}`;
  }

  function nextLevel() {
    if (currentLevel < maxLevel) {
      currentLevel++;
      fetchHighScore(currentLevel);
      prepareEnv();
      // updateLevelDisplay();
      // fetchHighScore(currentLevel);
    }
  }

  function prevLevel() {
    if (currentLevel > minLevel) {
      currentLevel--;
      fetchHighScore(currentLevel);
      prepareEnv();
      //updateLevelDisplay();
      //fetchHighScore(currentLevel);
    }
  }

  function prepareEnv() {
    updateLevelDisplay();
    lastScoreElement.textContent = `-`;
    restartGame();
  }
});
