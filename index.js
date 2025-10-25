import express from "express";
import fetch from "node-fetch";

const app = express();
const PORT = process.env.PORT || 10000;

/**
 * Endpoint per leggere dati da FutNext
 * Esempio:
 * /api/futnext?url=https://www.futnext.com/player/lamine-yamal
 */
app.get("/api/futnext", async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: "Missing FutNext URL" });

    const html = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; FC26Analyzer/1.0)" }
    }).then(r => r.text());

    // Cerca il blocco JSON interno (Next.js style)
    const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/);
    if (!match) return res.status(404).json({ error: "No data found" });

    const data = JSON.parse(match[1]);
    const props = data?.props?.pageProps || {};

    // Estrai info giocatore e prezzi
    const player = props?.player?.name || props?.playerName || "Unknown";
    const ps = Number(props?.prices?.ps || props?.market?.ps?.price || 0);
    const xbox = Number(props?.prices?.xbox || props?.market?.xbox?.price || 0);
    const pc = Number(props?.prices?.pc || props?.market?.pc?.price || 0);

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.json({ player, ps, xbox, pc, updated: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => console.log(`✅ FUTNEXT Bridge API running on port ${PORT}`));
