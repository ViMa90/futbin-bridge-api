import express from "express";
import fetch from "node-fetch";

const app = express();
const PORT = process.env.PORT || 10000;

/**
 * FUTNEXT Bridge API
 * Esempio:
 * /api/futnext?url=https://www.futnext.com/player/lamine-yamal/277643
 */
app.get("/api/futnext", async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: "Missing FutNext URL" });

    const html = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; FC26Analyzer/1.0)" },
    }).then((r) => r.text());

    // Estrae il JSON interno di Next.js
    const match = html.match(
      /<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/
    );
    if (!match) return res.status(404).json({ error: "No data found in HTML" });

    const data = JSON.parse(match[1]);
    const props = data?.props?.pageProps || {};

    const player = props?.player?.name || "Unknown";
    const ps = Number(props?.prices?.ps || 0);
    const xbox = Number(props?.prices?.xbox || 0);
    const pc = Number(props?.prices?.pc || 0);

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.json({
      player,
      ps,
      xbox,
      pc,
      source: "FutNext",
      updated: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () =>
  console.log(`✅ FUTNEXT Bridge API running on port ${PORT}`)
);
