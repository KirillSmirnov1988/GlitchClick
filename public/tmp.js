// =======================================
// Константы (музыка, звуки, сервер)
// =======================================
const backgroundMusic = new Audio("audio/retro.mp3");
backgroundMusic.loop = true;
backgroundMusic.volume = 0.5;

const hitSound = new Audio("audio/hit.mp3");
hitSound.volume = 0.7;

const clickSound = new Audio("audio/click.mp3");
clickSound.volume = 1.0;

const baseSpeed = 2;
const serverUrl = "http://localhost:3000";

// =======================================
// Переменные состояния игры
// =======================================
let gameEnded = false;
let circleRadius = 50;
let isMuted = false;
let username = null;

let circle, posX, posY, velocityX, velocityY, timer, startTime, animationFrame;
let currentLevel = 1;

let circleTimeout;

// =======================================
// DOM готов
// =======================================
document.addEventListener("DOMContentLoaded", () => {
	// Получаем элементы
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

	// Попап с вводом имени
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

	// =======================================
	// События и обработчики
	// =======================================
	muteOn.addEventListener("click", toggleMute);
	muteOff.addEventListener("click", toggleMute);
	startButton.addEventListener("click", startGame);
	replayElement.addEventListener("click", restartGame);
	nextLevelElement.addEventListener("click", nextLevel);
	prevLevelElement.addEventListener("click", prevLevel);

	switchUserButton.addEventListener("click", () => {
		stopGame();
		showUserPopup();
	});

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
				fetchHighScore(currentLevel);
			} else {
				alert("Error loading user!");
			}
		} catch (error) {
			console.error("❌ Error:", error);
		}
	});

	window.addEventListener("resize", resizeCanvas);
	resizeCanvas();

	updateLevelDisplay();
	fetchHighScore(currentLevel);

	// =======================================
	// Функции - Инициализация
	// =======================================
	function resizeCanvas() {
		canvas.width = canvas.offsetWidth;
		canvas.height = canvas.offsetHeight;
	}

	// =======================================
	// Функции - Пользователь и интерфейс
	// =======================================
	function updatePlayerName(name) {
		playerNameElement.textContent = `Now Playing: ${name}`;
	}

	function showUserPopup() {
		document.body.appendChild(popup);
		usernameInput.value = "";
	}

	function toggleMute() {
		isMuted = !isMuted;

		backgroundMusic.muted = isMuted;
		hitSound.muted = isMuted;
		clickSound.muted = isMuted;

		muteOn.classList.toggle("hidden", isMuted);
		muteOff.classList.toggle("hidden", !isMuted);
	}

	// =======================================
	// Функции - Игра
	// =======================================
	function startGame() {
		gameEnded = false;
		resetGame();
		backgroundMusic.play();
		startButton.classList.add("hidden");
		gameMessage.classList.add("hidden");
		timerDisplay.textContent = "0.0";
		startTimer();
		spawnCircle();
	}

	function resetGame() {
		cancelAnimationFrame(animationFrame);
		clearInterval(timer);
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		startButton.classList.remove("hidden");
	}

	function restartGame() {
		if (circle) circle.remove();
		cancelAnimationFrame(animationFrame);
		clearInterval(timer);
		startGame();
	}

	function stopGame() {
		cancelAnimationFrame(animationFrame);
		clearInterval(timer);
		backgroundMusic.pause();
		backgroundMusic.currentTime = 0;
		currentLevel = 1;
		updateLevelDisplay();
	}

	function endGame() {
		if (gameEnded) return;
		gameEnded = true;

		clearInterval(timer);
		cancelAnimationFrame(animationFrame);
		clearTimeout(circleTimeout);

		backgroundMusic.currentTime = 0;
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		const currentTime = parseFloat(timerDisplay.textContent);
		const hiScore = parseFloat(hiScoreElement.textContent);

		gameMessage.innerHTML = `Your time: ${currentTime.toFixed(2)} sec`;

		if (hiScoreElement.textContent === "-" || currentTime < hiScore) {
			hiScoreElement.textContent = currentTime.toFixed(2);
			updateHighScore(currentLevel, currentTime.toFixed(2));
			gameMessage.innerHTML += `<br>New High Score! 🎉`;
		}

		gameMessage.classList.remove("hidden");
		lastScoreElement.textContent = currentTime.toFixed(2);
		startButton.classList.remove("hidden");
	}

	function startTimer() {
		startTime = performance.now();
		timer = setInterval(() => {
			let elapsedTime = (performance.now() - startTime) / 1000;
			timerDisplay.textContent = elapsedTime.toFixed(2);
		}, 10);
	}

	// =======================================
	// Функции - Работа с уровнями
	// =======================================
	function updateLevelDisplay() {
		const levelPrefix = currentLevel <= 6 ? 1 : currentLevel <= 12 ? 2 : 3;
		const levelNumber = ((currentLevel - 1) % 6) + 1;
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

	// =======================================
	// Функции - Работа с кругом
	// =======================================
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

	function drawCircle(x, y, radius, color) {
		ctx.fillStyle = color;
		ctx.beginPath();
		ctx.arc(x, y, radius, 0, Math.PI * 2);
		ctx.fill();
	}

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

	canvas.removeEventListener("pointerdown", handleCircleClick);
	canvas.addEventListener("pointerdown", handleCircleClick);

	// =======================================
	// Функции - Работа с сервером
	// =======================================
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
});
