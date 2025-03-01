const express = require("express");
const Redis = require("ioredis");
const path = require("path");
const config = require("./config"); // Import Redis config

const app = express();
const PORT = 3000;

// Use Redis config from config.js
const redis = new Redis({
	host: config.redis.host,
	port: config.redis.port,
	username: config.redis.username,
	password: config.redis.password,
});

// Serve static files from the public folder
app.use(express.static(path.join(__dirname, "../public")));
app.use(express.json());

// Health check endpoint to check if Redis is available
app.get("/ping", async (req, res) => {
	try {
		await redis.ping();
		res.json({ status: "ok" });
	} catch (error) {
		res.status(503).json({ status: "unavailable", message: "Redis is down" });
	}
});

// Endpoint to create or load a user
app.post("/user", async (req, res) => {
	const { username } = req.body;
	if (!username) {
		return res.status(400).json({ error: "Username is required" });
	}

	try {
		let userData = await redis.get(username);

		// If user does not exist, initialize their high scores (levels 1-18)
		if (!userData) {
			userData = JSON.stringify(
				Object.fromEntries(Array.from({ length: 18 }, (_, i) => [i + 1, ""]))
			);
			await redis.set(username, userData);
		}

		res.json({
			success: true,
			message: "User loaded",
			data: JSON.parse(userData),
		});
	} catch (error) {
		console.error("❌ Redis Error:", error.message);
		res.status(503).json({
			success: false,
			message: "Redis unavailable. Switching to offline mode.",
		});
	}
});

// Endpoint to fetch high score for a specific level and user
app.get("/highscores/:username/:level", async (req, res) => {
	const { username, level } = req.params;

	try {
		let userData = await redis.get(username);
		if (!userData) return res.status(404).json({ error: "User not found" });

		userData = JSON.parse(userData);

		// Convert empty string to null, otherwise parse the score
		const rawScore = userData[level];
		const highScore = rawScore === "" ? null : parseFloat(rawScore);

		res.json({
			level,
			highScore,
		});
	} catch (error) {
		console.error("❌ Error fetching high score:", error);
		res.status(500).json({ error: "Internal Server Error" });
	}
});

// Endpoint to update high score for a specific level and user
app.post("/highscores/:username/:level", async (req, res) => {
	const { username, level } = req.params;
	const { highScore } = req.body;

	// Validate incoming score
	if (!highScore || isNaN(highScore)) {
		return res.status(400).json({ success: false, message: "Invalid score" });
	}

	try {
		let userData = await redis.get(username);
		if (!userData) return res.status(404).json({ error: "User not found" });

		userData = JSON.parse(userData);

		// Compare new score with the existing score for this level
		const existingScore = parseFloat(userData[level]);
		const newScore = parseFloat(highScore);

		// Only update if new score is better (lower)
		if (!existingScore || newScore < existingScore) {
			userData[level] = newScore.toFixed(2);
			await redis.set(username, JSON.stringify(userData));

			return res.json({ success: true, message: "New high score saved!" });
		}

		res.json({ success: false, message: "Score not high enough." });
	} catch (error) {
		console.error("❌ Error updating high score:", error);
		res.status(500).json({ error: "Internal Server Error" });
	}
});

// Start the server
app.listen(PORT, "0.0.0.0", () => {
	console.log(`✅ Server running at http://localhost:${PORT}`);
});
