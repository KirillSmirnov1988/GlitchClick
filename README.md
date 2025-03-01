# Reaction Timer Game with Redis Backend (Offline Mode Supported)

This project is a **reaction timer game** where the player has to click a moving circle as quickly as possible.  
The game supports **18 levels**, each with increasing difficulty. High scores for each player are stored in **Redis**.

The game also features an **Offline Mode**:  
If the Redis server is unavailable, the game will automatically switch to offline mode and store high scores in the browser's `localStorage`.

---

## 📂 Project Structure

project-root/ ├── public/ # Frontend files │ ├── index.html # Main game page │ ├── css/ # Styles │ │ └── style.css # Main styles for the game │ ├── audio/ # Game sounds (background music, click, bounce) │ └── script.js # Main game logic (frontend JavaScript) ├── server/ # Backend files │ ├── server.js # Main Express server │ ├── config.js # Redis configuration file │ ├── package.json # Dependencies │ └── README.md # This documentation

---

## 🚀 Features

- 🎮 18 levels with increasing difficulty
- 🔊 Background music and sound effects
- 📊 High scores stored per player per level
- 📴 Automatic **Offline Mode** if Redis is unavailable
- 👥 Multi-user support

---

## 🛠️ Prerequisites

- [Node.js](https://nodejs.org/) (v18 recommended)
- [Redis](https://redis.io/) (locally or in the cloud)

---

## 📦 Installation

1. Clone this project (if using git):

   ```bash
   git clone https://github.com/KirillSmirnov1988/GlitchClick.git
   ```

2. Install server dependencies:

   ```bash
   cd server
   npm install
   ```

3. Configure Redis connection in:

   ```
   server/config.js
   ```

   Example:

   ```javascript
   module.exports = {
   	redis: {
   		host: "localhost", // or cloud Redis host
   		port: 6379,
   		username: "default", // usually "default" for Redis Cloud
   		password: "your-redis-password", // set your Redis password here
   	},
   };
   ```

4. Start the server:

   ```bash
   node server.js
   ```

5. Open the game in your browser:
   ```
   http://localhost:3000/index.html
   ```

---

## 🕹️ How to Play

1. Enter your player name.
2. Start playing by clicking the moving circle as quickly as possible.
3. Progress through levels, with faster circle speed and smaller circle size.
4. High scores are saved automatically for each level.
5. If the server is unavailable, the game switches to **Offline Mode** and stores high scores locally.

---

## 📡 API Endpoints

| Method | Endpoint                       | Description                               |
| ------ | ------------------------------ | ----------------------------------------- |
| GET    | `/ping`                        | Health check to see if Redis is available |
| POST   | `/user`                        | Create or load player data                |
| GET    | `/highscores/:username/:level` | Get high score for a player and level     |
| POST   | `/highscores/:username/:level` | Update high score for a player and level  |

---

## 📴 Offline Mode

If Redis is unavailable (server down or connection issue), the game automatically switches to **Offline Mode**:

- High scores are saved in `localStorage`.
- Scores are stored per player, per level.
- When Redis becomes available again, the client can potentially push local scores to Redis (optional feature).

### Example localStorage format:

```json
{
    "player1": { "1": "2.45", "2": "3.10" },
    "player2": { "1": "4.25", "2": "5.32" }
}

---
# Install dependencies
cd server
npm install

# Configure Redis
vim config.js

# Start the server
node server.js

# Open the game
http://localhost:3000/index.html
```
