require("dotenv").config({ path: __dirname + "/.env" });

const express = require("express");
const fs = require("fs");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

// ===== ENV =====
const PORT = process.env.PORT || 3000;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

// ===== DEBUG ENV =====
console.log("===== ENV CHECK =====");
console.log("TOKEN:", TELEGRAM_BOT_TOKEN ? "OK" : "MISSING ❌");
console.log("CHAT_ID:", CHAT_ID ? "OK" : "MISSING ❌");
console.log("=====================");

// ===== LOAD DATA =====
let foods = [];
try {
  foods = JSON.parse(fs.readFileSync(__dirname + "/foods.json", "utf-8"));
  console.log("✅ Loaded foods:", foods.length);
} catch (err) {
  console.error("❌ Load foods.json lỗi:", err.message);
}

// ===== RANDOM LOGIC =====
function randomFood(filters) {
  let filtered = foods.filter(f => {
    return (!filters.mood || f.mood === filters.mood) &&
           (!filters.style || f.style === filters.style) &&
           (!filters.type || f.type === filters.type);
  });

  if (filtered.length === 0) filtered = foods;

  return filtered[Math.floor(Math.random() * filtered.length)];
}

// ===== TELEGRAM =====
async function sendTelegram(msg) {
  if (!TELEGRAM_BOT_TOKEN || !CHAT_ID) {
    console.error("❌ Missing TELEGRAM config");
    return;
  }

  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

    await axios.post(url, {
      chat_id: CHAT_ID,
      text: msg
    });

    console.log("✅ Sent Telegram");
  } catch (err) {
    console.error("❌ Telegram error:", err.response?.data || err.message);
  }
}

// ===== API =====
app.post("/api/food", async (req, res) => {
  const data = req.body;

  let message = "";

  if (data.type === "unknown") {
    message = `🤔 Không biết ăn gì\nStyle: ${data.style}\nNote: ${data.note}`;
  }

  if (data.type === "list") {
    message = `🍜 Chọn món\nMón: ${data.selected.join(", ")}\nNote: ${data.note}`;
  }

  if (data.type === "decide") {
    message = `😎 Anh chọn đi\nNote: ${data.note}`;
  }

  if (data.type === "random") {
    const food = foods[Math.floor(Math.random() * foods.length)];

    await sendTelegram(`🎲 Random cho người yêu: ${food.name}`);

    return res.json(food);
  }

  await sendTelegram(message);

  res.json({ status: "ok" });
});

// ===== HEALTH CHECK =====
app.get("/", (req, res) => {
  res.send("Server is running 🚀");
});

// ===== START SERVER =====
app.listen(PORT, () => {
  console.log("=================================");
  console.log(`🚀 Server chạy tại http://localhost:${PORT}`);
  console.log("=================================");
});