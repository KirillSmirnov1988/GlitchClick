const express = require("express");
const Redis = require("ioredis");
const path = require("path");

const app = express();
const PORT = 3000;
const redis = new Redis(); // Подключение к локальному Redis

app.use(express.static(path.join(__dirname, "../public"))); // Статика
app.use(express.json());

// ✅ Проверить или создать пользователя в Redis
app.post("/user", async (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).json({ error: "Username is required" });

  try {
    let userData = await redis.get(username);
    if (!userData) {
      userData = JSON.stringify({
        1: "",
        2: "",
        3: "",
        4: "",
        5: "",
        6: "",
        7: "",
        8: "",
        9: "",
        10: "",
        11: "",
        12: "",
        13: "",
        14: "",
        15: "",
        16: "",
        17: "",
        18: "",
      });
      await redis.set(username, userData);
    }
    res.json({
      success: true,
      message: "User loaded",
      data: JSON.parse(userData),
    });
  } catch (error) {
    console.error("❌ Error handling user:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ✅ Получить лучший результат пользователя на уровне
app.get("/highscores/:username/:level", async (req, res) => {
  const { username, level } = req.params;
  try {
    let userData = await redis.get(username);
    if (!userData) return res.status(404).json({ error: "User not found" });

    userData = JSON.parse(userData);
    res.json({ level, highScore: userData[level] || null });
  } catch (error) {
    console.error("❌ Error fetching score:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ✅ Обновить лучший результат уровня
app.post("/highscores/:username/:level", async (req, res) => {
  const { username, level } = req.params;
  const newScore = parseFloat(req.body.highScore);

  if (isNaN(newScore) || newScore <= 0) {
    return res.status(400).json({ success: false, message: "Invalid score" });
  }

  try {
    let userData = await redis.get(username);
    if (!userData) return res.status(404).json({ error: "User not found" });

    userData = JSON.parse(userData);
    if (!userData[level] || newScore < userData[level]) {
      userData[level] = newScore;
      await redis.set(username, JSON.stringify(userData));
      return res.json({ success: true, message: "New high score saved!" });
    }

    res.json({ success: false, message: "Score not high enough." });
  } catch (error) {
    console.error("❌ Error updating high score:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ✅ Запуск сервера
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
