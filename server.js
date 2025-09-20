import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Use environment variable set in Render for security
const NEWS_API_KEY = process.env.NEWS_API_KEY;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve frontend (index.html)
app.use(express.static(__dirname));

app.post("/checkArticle", async (req, res) => {
  const { url } = req.body;

  try {
    const query = encodeURIComponent(url.split("/")[2] || url);
    console.log("🔎 Querying NewsAPI with:", decodeURIComponent(query));

    const newsApi = `https://newsapi.org/v2/everything?q=${query}&language=en&apiKey=${NEWS_API_KEY}`;
    const newsResponse = await fetch(newsApi);
    const newsData = await newsResponse.json();

    let credibilityStatus = "Unknown";
    let credibilityMessage = "No related articles found.";
    let score = 0;
    let alternates = [];

    if (newsData.articles && newsData.articles.length > 0) {
      const count = newsData.articles.length;
      const articles = newsData.articles.slice(0, 3); // top 3 references

      // Simple scoring
      if (count > 30) { credibilityStatus = "Likely Credible"; score = 90; }
      else if (count > 10) { credibilityStatus = "Possibly Credible"; score = 70; }
      else { credibilityStatus = "Low Coverage"; score = 40; }

      credibilityMessage = `Found ${count} related articles. Showing top ${articles.length} references.`;

      alternates = articles.map(a => ({
        title: a.title,
        url: a.url,
        source: a.source?.name || "Unknown",
        date: a.publishedAt,
        image: a.urlToImage
      }));
    }

    res.json({ status: credibilityStatus, message: credibilityMessage, score, alternates });

  } catch (error) {
    console.error("❌ Error:", error);
    res.status(500).json({ error: "Error while checking article" });
  }
});

// For Render deployment
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Running on port ${PORT}`));