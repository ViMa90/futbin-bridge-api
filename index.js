import express from "express";
import fetch from "node-fetch";

const app = express();
const PORT = process.env.PORT || 10000;

app.get("/api/futbin", async (req, res) => {
  try {
    const { url, id } = req.query;
    const targetUrl = url || (id ? `https://www.futbin.com/26/player/${id}` : null);
    if (!targetUrl)
      return res.status(400).json({ error: "Missing Futbin ID or URL" });

    const html = await fetch(targetUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; FC26Analyzer/1.0)" },
    }).then((r) => r.text());

    // cerca qualsiasi script JSON che contenga "pageProps"
    const matches = html.match(
      /<script[^>]*type="application\/json"[^>]*>([\s\S]*?"pageProps"[\s\S]*?)<\/script>/
    );
    if (!matches) return res.status(404).json({ error: "No data block found" });

    const jsonText = matches[1];
    let pageData;
    try {
      pageData = JSON.parse(jsonText);
    } catch (e) {
      return res.status(500).json({ error: "Invalid JSON structure" });
    }

    const playerData = pageData?.props?.pageProps?.player || {};
    const prices = pageData?.props?.pageProps?.prices || {};

    const player = playerData?.name || "Unknown";
    const ps = Number(prices?.ps?.LCPrice) || 0;
    const xbox = Number(prices?.xbox?.LCPrice) || 0;
    const pc = Number(prices?.pc?.LCPrice) || 0;

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.json({
      player,
      ps,
      xbox,
      pc,
      updated: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () =>
  console.log(`✅ Futbin Bridge API running on port ${PORT}`)
);
