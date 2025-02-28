const backgroundMusic = new Audio("audio/retro.mp3");
backgroundMusic.loop = true;
backgroundMusic.volume = 0.5;

const hitSound = new Audio("audio/hit.mp3");
hitSound.volume = 0.7;

const clickSound = new Audio("audio/click.mp3");
clickSound.volume = 1.0;

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
	const muteOn = document.getElementById("mute-on");
	const muteOff = document.getElementById("mute-off");
	const playerNameElement = document.getElementById("player-name");
	const switchUserButton = document.getElementById("switch-user");
	const ctx = canvas.getContext("2d");
	let gameEnded = false;
	let circleRadius = 50;
	let isMuted = false;

	muteOn.addEventListener("click", toggleMute);
	muteOff.addEventListener("click", toggleMute);

	const popup = document.createElement("div");
	popup.innerHTML = `
    <div class="popup">
      <p>Please Enter Your Name</p>
      <input type="text" id="username-input" placeholder="Enter your name" />
      <button id="start-fun">START FUN</button>
    </div>
  `;
	document.body.appendChild(popup);

	const usernameInput = document.getElementById("username-input");
	const startFunButton = document.getElementById("start-fun");

	switchUserButton.addEventListener("click", () => {
		stopGame(); // Останавливаем текущую игру
		showUserPopup(); // Показываем попап с выбором имени
	});

	let username = null;

	let circle,
		posX,
		posY,
		velocityX,
		velocityY,
		timer,
		startTime,
		animationFrame;
	let currentLevel = 1;
	const baseSpeed = 2;
	const serverUrl = "http://localhost:3000";

	updateLevelDisplay();
	fetchHighScore(currentLevel);

	function resizeCanvas() {
		canvas.width = canvas.offsetWidth;
		canvas.height = canvas.offsetHeight;
	}
	window.addEventListener("resize", resizeCanvas);
	resizeCanvas();

	// Event Listeners
	startButton.addEventListener("click", startGame);

	startFunButton.addEventListener("click", async () => {
		username = usernameInput.value.trim();
		if (!username) return alert("Please enter a name!");

		try {
			const response = await fetch(`${serverUrl}/user`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ username }),
			});

			const data = await response.json();
			if (data.success) {
				localStorage.setItem("username", username);
				popup.remove();
				updatePlayerName(username);
				console.log("✅ User data:", data.data);

				// 🔥 Вот сюда добавляем загрузку рекорда для первого уровня
				fetchHighScore(currentLevel);
			} else {
				alert("Error loading user!");
			}
		} catch (error) {
			console.error("❌ Error:", error);
		}

		const playerNameElement = document.getElementById("player-name");
	});

	replayElement.addEventListener("click", restartGame);
	nextLevelElement.addEventListener("click", nextLevel);
	prevLevelElement.addEventListener("click", prevLevel);

	// Fetch High Score for Current Level
	async function fetchHighScore(level) {
		if (!username) {
			console.error("Username is not set");
			return;
		}
		try {
			const response = await fetch(
				`${serverUrl}/highscores/${username}/${level}`
			);
			const data = await response.json();
			hiScoreElement.textContent =
				data.highScore !== null ? data.highScore : "-";
		} catch (error) {
			console.error("Failed to fetch high score:", error);
		}
	}

	// Save New High Score
	async function updateHighScore(level, score) {
		if (!username) {
			console.error("Username is not set");
			return;
		}
		try {
			await fetch(`${serverUrl}/highscores/${username}/${level}`, {
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
		backgroundMusic.play(); // Start music when game begins
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

	let circleTimeout;

	function spawnCircle() {
		clearTimeout(circleTimeout);

		let levelGroup =
			currentLevel <= 6 ? 1 : currentLevel <= 12 ? 2 : currentLevel <= 18;

		let levelNumber = ((currentLevel - 1) % 6) + 1;
		let speed =
			levelGroup !== 2 ? baseSpeed * (1 + (levelNumber - 1) * 0.15) : baseSpeed;
		circleRadius =
			levelGroup === 1 || levelGroup === 4 ? 40 : 40 - levelNumber * 4;

		posX = canvas.width / 2;
		posY = canvas.height / 2;
		if (levelGroup === 3) {
			posX = Math.random() * (canvas.width - 2 * circleRadius) + circleRadius;
			posY = Math.random() * (canvas.height - 2 * circleRadius) + circleRadius;
		}

		velocityX = speed * (Math.random() > 0.5 ? 1 : -1);
		velocityY = speed * (Math.random() > 0.5 ? 1 : -1);
		moveCircle();

		canvas.removeEventListener("pointerdown", handleCircleClick);
		canvas.addEventListener("pointerdown", handleCircleClick);
	}

	function moveCircle() {
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		// ✅ Draw Main Circle
		drawCircle(posX, posY, circleRadius, "#ffcc00");

		posX += velocityX;
		posY += velocityY;

		// ✅ Bounce Logic for Circle
		if (posX - circleRadius <= 0 || posX + circleRadius >= canvas.width) {
			hitSound.play();
			velocityX = -velocityX;
		}
		if (posY - circleRadius <= 0 || posY + circleRadius >= canvas.height) {
			hitSound.play();
			velocityY = -velocityY;
		}

		animationFrame = requestAnimationFrame(moveCircle);
	}

	function endGame() {
		if (gameEnded) return;
		gameEnded = true;

		clearInterval(timer);
		cancelAnimationFrame(animationFrame);
		clearTimeout(circleTimeout);

		backgroundMusic.currentTime = 0;

		ctx.clearRect(0, 0, canvas.width, canvas.height);

		let currentTime = parseFloat(timerDisplay.textContent);
		let hiScore = parseFloat(hiScoreElement.textContent);

		// Display time result
		gameMessage.innerHTML = `Your time: ${currentTime.toFixed(2)} sec`;

		// If it's a new high score, add a new line with "New High Score!"
		if (hiScoreElement.textContent === "-" || currentTime < hiScore) {
			hiScoreElement.textContent = currentTime.toFixed(2);
			updateHighScore(currentLevel, currentTime.toFixed(2));
			gameMessage.innerHTML += `<br>New High Score! 🎉`;
		}

		gameMessage.classList.remove("hidden");
		lastScoreElement.textContent = currentTime.toFixed(2);
		startButton.classList.remove("hidden");
	}

	function resetGame() {
		cancelAnimationFrame(animationFrame);
		clearInterval(timer);
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		startButton.classList.remove("hidden");
	}

	function updateLevelDisplay() {
		let levelPrefix = currentLevel <= 6 ? 1 : currentLevel <= 12 ? 2 : 3;
		let levelNumber = ((currentLevel - 1) % 6) + 1;

		levelElement.textContent = `LEVEL ${levelPrefix}-${levelNumber}`;
	}

	function nextLevel() {
		if (currentLevel < 18) {
			currentLevel++;
			prepareEnv();
		}
	}

	function prevLevel() {
		if (currentLevel > 1) {
			currentLevel--;
			prepareEnv();
		}
	}

	function prepareEnv() {
		updateLevelDisplay();
		lastScoreElement.textContent = `-`;
		fetchHighScore(currentLevel);

		gameMessage.classList.add("hidden");
		startButton.classList.remove("hidden");
		restartGame();
	}

	canvas.removeEventListener("pointerdown", handleCircleClick);
	canvas.addEventListener("pointerdown", handleCircleClick);

	function handleCircleClick(event) {
		const rect = canvas.getBoundingClientRect();
		const mouseX = event.clientX - rect.left;
		const mouseY = event.clientY - rect.top;

		// ✅ Check if the player clicked the Main Circle
		if (
			Math.sqrt((mouseX - posX) ** 2 + (mouseY - posY) ** 2) <= circleRadius
		) {
			clickSound.play();
			endGame();
			return;
		}
	}

	function updatePlayerName(name) {
		playerNameElement.textContent = `Now Playing: ${name}`;
	}

	function toggleMute() {
		isMuted = !isMuted;

		backgroundMusic.muted = isMuted;
		hitSound.muted = isMuted;
		clickSound.muted = isMuted;

		muteOn.classList.toggle("hidden", isMuted);
		muteOff.classList.toggle("hidden", !isMuted);
	}

	function stopGame() {
		cancelAnimationFrame(animationFrame);
		clearInterval(timer);
		backgroundMusic.pause();
		backgroundMusic.currentTime = 0;
		currentLevel = 1;
		updateLevelDisplay();
	}

	function showUserPopup() {
		document.body.appendChild(popup);
	}
});
