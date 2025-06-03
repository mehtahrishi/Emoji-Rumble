# 🎮 Emoji Rumble

**Emoji Rumble** is a browser-based bullet hell survival game where players control an emoji to dodge endless waves of attacking enemy emojis. The longer you survive, the more difficult the game becomes. Compete on the leaderboard and track your survival history!

---

## 🚀 Features

* 🧍 Control an emoji avatar with arrow keys.
* 👾 Enemy emojis attack in increasing waves.
* ❤️ In-game HUD:

  * Health label + progress bar.
  * Time label with real-time survival counter.
  * Wave label with current wave + representative enemy emoji.
* 🌟 Floating, twinkling retro stars in the background across the entire website and game canvas (CRT-style visual).
* 🎶 Background music starts only when the game begins.
* 🔥 Difficulty ramps up every 30 seconds (more enemies, faster patterns).
* 💀 Game Over screen with survival time, total waves reached, and associated emoji.
* 💾 Score is automatically saved to the leaderboard on game end.
* 🏠 Homepage includes:

  * `Start Game` button
  * `View Leaderboard` button
* 📋 Post-game screen includes:

  * Score summary: total time, wave, emoji
  * Message: "Score saved successfully!"
  * Buttons: `Back Home`, `View Leaderboard`
* 🏆 Online leaderboard and individual player history.
* 📊 MongoDB-powered backend with Flask.
* 📱 Mobile-responsive canvas UI with retro CRT aesthetic.

### 🆕 New Features Added

* 🎁 **Power-ups System**:
  * Health restoration items (❤️) - Restore player health
  * Temporary invincibility shield (🛡️) - Protect from damage
  * Speed boost (⚡) - Move faster for a limited time
  * Weapon upgrades (🔫) - Shoot back at enemies
  * Bomb (💣) - Clear all enemies on screen

* 👹 **Enhanced Enemy Variety**:
  * Boss enemies appear every 5 waves (👹 or 👾)
  * Different enemy movement patterns:
    * Direct - Move straight toward player
    * Zigzag - Move in zigzag pattern
    * Circular - Move in circular pattern
    * Teleport - Occasionally teleport closer to player
  * Special enemy abilities:
    * Splitter bosses that break into smaller enemies
    * Multi-projectile attacks from bosses

---

## 🛠 Tech Stack

| Layer      | Stack                                                 |
| ---------- | ----------------------------------------------------- |
| Frontend   | HTML5, CSS3, JavaScript (Canvas API)                  |
| Game Logic | JavaScript                                            |
| Backend    | Flask (Python)                                        |
| Database   | MongoDB Atlas                                         |
| Hosting    | Localhost / Future: Render, Vercel                    |
| Assets     | Emoji graphics, background music hosted on Cloudinary |

---

## 📁 Folder Structure

```
emoji-survival-arena/
├── static/
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   └── game.js
│   ├── favicon.ico
│   └── assets/
│       ├── music.mp3
│       ├── star-bg.png
│       ├── enemy-emojis/
│       └── player-emojis/
├── templates/
│   ├── index.html            # Home page with start/view leaderboard
│   ├── game.html             # Game canvas page
│   ├── gameover.html         # Post-game score screen
│   └── leaderboard.html      # Leaderboard page
├── app.py
├── .env
└── README.md
```

---

## 🔐 Environment Variables

Create a `.env` file in the root directory:

```env
MONGO_URI=mongodb+srv://username:password@cluster0.zbozo.mongodb.net/emoji_survival_arena?retryWrites=true&w=majority&appName=Cluster0
```

Install and use `python-dotenv` in `app.py`:

```bash
pip install python-dotenv
```

```python
from dotenv import load_dotenv
import os
load_dotenv()
mongo_uri = os.getenv("MONGO_URI")
client = MongoClient(mongo_uri)
```

---

## 🧠 Game Mechanics & Progression

* ⏱ **Every 15 seconds**:

  * New wave begins
  * Enemy difficulty increases
  * New enemy types may appear

* 🎯 **Every 5 waves**:
  * Boss wave with special enemy
  * Harder to defeat but gives satisfaction

* 🎁 **Power-ups appear randomly**:
  * Health restoration (❤️)
  * Shield (🛡️)
  * Speed boost (⚡)
  * Weapon (🔫)
  * Bomb (💣)

* Game ends upon health reaching zero.

---

## 🔊 Audio & Visual Assets (Cloudinary)

| Type             | Asset Link                                                                                                                                                      |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Background Music | [VAPORCHROME - DECKED](https://res.cloudinary.com/dfzqhhywm/video/upload/v1748808227/VAPORCHROME_-_DECKED_slowed_reverb_instrumental_TikTok_version_jaevtg.mp3) |
| Acceleration SFX | [SFX](https://res.cloudinary.com/dfzqhhywm/video/upload/v1748808614/acceleration-sfx_G_minor_myayoh.wav)                                                        |
| Brake SFX        | [SFX](https://res.cloudinary.com/dfzqhhywm/video/upload/v1748808607/violent-car-breaks_136bpm_F_major_i9i8tg.wav)                                               |
| Enemy Emojis     | 😈 🤖 💀 👿 👹 👾 (Unicode or custom sprite)                                                                                                                    |
| Player Emojis    | 😎 😂 🦄 (user selected / default emoji)                                                                                                                        |
| Power-up Emojis  | ❤️ 🛡️ ⚡ 🔫 💣 (Unicode)                                                                                                                                      |

---

## 🧪 Setup Instructions

### 1. 📦 Backend (Flask + MongoDB)

```bash
# Clone the repo
git clone https://github.com/yourusername/emoji-survival-arena.git
cd emoji-survival-arena

# Create and activate a virtual environment
python3 -m venv venv
source venv/bin/activate  # For Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

**requirements.txt:**

```txt
Flask
pymongo
python-dotenv
flask-cors
```

### 2. 🔄 Run the Flask Server

```bash
python app.py
```

Access at `http://localhost:5000`.

### 3. 🌐 Frontend

Pages:

* `/` → Home with `Start Game` and `View Leaderboard`
* `/game` → Game view with stars and retro theme
* `/gameover` → Shows score + buttons: `Back Home`, `View Leaderboard`
* `/leaderboard` → Shows top players

---

## 🔗 API Endpoints

| Endpoint       | Method | Description                                |
| -------------- | ------ | ------------------------------------------ |
| `/submit`      | POST   | Submit score `{name, time_survived, wave}` |
| `/leaderboard` | GET    | Get top 10 players sorted by survival time |

---

## 🌟 Styling & Visuals

* **Theme**: Retro CRT-style glow, pixelated fonts.
* **Stars**: Animated stars float in background site-wide (HTML + CSS).
* **Canvas**: Game rendered in HTML5 `<canvas>` styled like an arcade screen.

---

## 📈 Future Add-ons

* 🧙 More power-ups and abilities
* 🎭 Custom emoji selector with more options
* 🔐 Authentication (OAuth2 via Google)
* 📱 Mobile joystick support
* 🏆 Weekly/monthly leaderboards
* 🎮 Multiplayer mode

---

## 👨‍💻 Author

Built with ❤️ by Rishi ([@mehtahrishi45](https://github.com/mehtahrishi45))
