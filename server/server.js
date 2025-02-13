const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;
const HIGHSCORE_FILE = path.join(__dirname, "highscores.json");

// ✅ Serve Static Files (Frontend)
const publicPath = path.join(__dirname, "../public"); // Adjust path based on project structure
app.use(express.static(publicPath));

app.use(express.json());

// ✅ Load high scores from file
function loadHighScores() {
  if (!fs.existsSync(HIGHSCORE_FILE)) {
    fs.writeFileSync(HIGHSCORE_FILE, JSON.stringify({}), "utf8");
  }
  return JSON.parse(fs.readFileSync(HIGHSCORE_FILE, "utf8"));
}

// ✅ Save high scores to file
function saveHighScores(scores) {
  fs.writeFileSync(HIGHSCORE_FILE, JSON.stringify(scores, null, 2), "utf8");
}

// ✅ **GET High Score for a Level**
app.get("/highscores/:level", (req, res) => {
  const level = req.params.level;
  const scores = loadHighScores();
  res.json({ level, highScore: scores[level] || null });
});

// ✅ **POST Update High Score**
app.post("/highscores/:level", (req, res) => {
  const level = req.params.level;
  const newScore = req.body.highScore;
  let scores = loadHighScores();

  if (!scores[level] || newScore < scores[level]) {
    scores[level] = newScore;
    saveHighScores(scores);
    return res.json({ success: true, message: "New high score saved!" });
  }

  res.json({ success: false, message: "Score not high enough." });
});

// ✅ Catch-All for 404 Errors (AFTER serving static files)
app.use((req, res) => {
  res.status(404).json({ error: "Endpoint not found" });
});

// ✅ Start Server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
  console.log(`🎮 Game available at http://localhost:${PORT}/index.html`);
});
