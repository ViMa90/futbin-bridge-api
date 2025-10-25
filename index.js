import express from "express";
import fetch from "node-fetch";

const app = express();
const PORT = process.env.PORT || 10000;

app.get("/api/futbin", async (req, res) => {
  try {
    const { url, id } = req.query;
    const targetUrl = url || (id ? `https://www.futbin.com/26/player/${id}` : null);
    if (!targetUrl) return res.status(400).json({ error: "Missing Futbin ID or URL" });

    const html = await fetch(targetUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; FC26Analyzer/1.0)" }
    }).then(r => r.text());

    // 🆕 nuovo pattern: estrai il blocco JSON dentro __NEXT_DATA__
    const jsonMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/);
    if (!jsonMatch) return res.status(404).json({ error: "No data block found" });

    const pageData = JSON.parse(jsonMatch[1]);
    const playerData = pageData?.props?.pageProps?.player || {};
    const player = playerData?.name || "Unknown";

    // Trova i prezzi (PS, Xbox, PC)
    const prices = pageData?.props?.pageProps?.prices || {};
    const ps = Number(prices?.ps?.LCPrice) || 0;
    const xbox = Number(prices?.xbox?.LCPrice) || 0;
    const pc = Number(prices?.pc?.LCPrice) || 0;

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.json({ player, ps, xbox, pc });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => console.log(`✅ Futbin Bridge API running on port ${PORT}`));
