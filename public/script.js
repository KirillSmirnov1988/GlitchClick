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
  const maxLevel = 10;
  const baseSpeed = 1;
  const speedIncreaseFactor = 1.2;

  window.onload = () => {
    console.log("App started.");
    updateLevelDisplay();
    lastScoreElement.textContent = `-`;
    hiScoreElement.textContent = `-`;
  };

  startButton.addEventListener("click", startGame);
  replayElement.addEventListener("click", restartGame);
  nextLevelElement.addEventListener("click", nextLevel);
  prevLevelElement.addEventListener("click", prevLevel);

  function startGame() {
    resetGame();
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

    let speed = baseSpeed + currentLevel * speedIncreaseFactor;

    velocityX = speed * (Math.random() > 0.5 ? 1 : -1);
    velocityY = speed * (Math.random() > 0.5 ? 1 : -1);

    circle.style.display = "block";

    function moveCircle() {
      posX += velocityX;
      posY += velocityY;

      if (posX <= 0 || posX + circle.clientWidth >= board.clientWidth) {
        velocityX = -velocityX;
      }
      if (posY <= 0 || posY + circle.clientHeight >= board.clientHeight) {
        velocityY = -velocityY;
      }

      circle.style.left = posX + "px";
      circle.style.top = posY + "px";

      animationFrame = requestAnimationFrame(moveCircle);
    }

    moveCircle();

    circle.addEventListener("click", endGame);
  }

  function endGame() {
    clearInterval(timer);
    cancelAnimationFrame(animationFrame);

    gameMessage.textContent = `Your time: ${timerDisplay.textContent} sec`;
    let currentTime = parseFloat(timerDisplay.textContent);
    let hiScore =
      hiScoreElement.textContent === "-"
        ? Infinity
        : parseFloat(hiScoreElement.textContent);

    if (currentTime < hiScore) {
      gameMessage.textContent += `\nNew High Score! 🎉`;
      hiScoreElement.textContent = currentTime.toFixed(2);
    }

    gameMessage.classList.remove("hidden");
    lastScoreElement.textContent = currentTime.toFixed(2);
    resetGame();
  }

  function resetGame() {
    if (circle) {
      circle.remove();
    }
    cancelAnimationFrame(animationFrame);
    clearInterval(timer);
    startButton.classList.remove("hidden");
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
    hiScoreElement.textContent = `-`;
    restartGame();
  }
});
