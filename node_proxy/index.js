import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 3000;

// GIPHY (NOWE)
const GIPHY_BASE = "https://api.giphy.com/v1/gifs";
const GIPHY_API_KEY = "J7X0Pq5Kg5cImGNSyIuXlClC0QZyOaXY";

app.use(cors());
  
// GIPHY /random 
app.get("/giphy/random", async (req, res) => {
  try {
    if (!GIPHY_API_KEY) {
      return res.status(500).json({ error: "Brak GIPHY_API_KEY po stronie serwera." });
    }
    
    const rating = encodeURIComponent(req.query.rating || "g"); // tip: rating jako query
    const url = `${GIPHY_BASE}/random?api_key=${encodeURIComponent(GIPHY_API_KEY)}&rating=${rating}`;

    const r = await fetch(url);
    const json = await r.json(); 
    if (!r.ok) {
      return res.status(r.status).json(json || { error: "GIPHY error" });
    }
    // data to gif
    res.json(json);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.get("/giphy/search", async (req, res) => {
  try {
    const q       = encodeURIComponent(String(req.query.q || "").trim());
    const limit   = Number(req.query.limit || 12);
    const offset  = Number(req.query.offset || 0);
    const rating  = encodeURIComponent(req.query.rating || "g");
    const lang    = encodeURIComponent(req.query.lang || "en");

    if (!q) return res.status(400).json({ error: "Parametr q jest wymagany." });

    const url = `${GIPHY_BASE}/search?api_key=${encodeURIComponent(GIPHY_API_KEY)}&q=${q}&limit=${limit}&offset=${offset}&rating=${rating}&lang=${lang}`;
    const r = await fetch(url);
    const json = await r.json(); 
    if (!r.ok) {                          // <<< CHANGED
      return res.status(r.status).json(json || { error: "GIPHY error" }); // <<< CHANGED
    }
    res.json(json);
  } catch (err) {
    res.status(err.status || 500).json(err.body || { error: err.message });
  }
});


app.listen(PORT, () => {
  console.log(`Proxy działa na http://localhost:${PORT}`);
});
