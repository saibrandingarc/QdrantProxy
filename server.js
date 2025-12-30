// qdrant-proxy/server.js
import express from "express";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

// ✅ Root health-check route
app.get("/", (req, res) => {
  res.send("✅ Qdrant Proxy is running!");
});

app.post("/qdrant/search", async (req, res) => {
  try {
    const {
      query_text,
      limit = 5,
      with_payload = true,
    } = req.body;

    if (!query_text) {
      return res.status(400).json({ error: "query_text is required" });
    }

    // 1️⃣  Generate embedding from OpenAI
    const embResponse = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input: query_text,
      }),
    });

    if (!embResponse.ok) {
      const errText = await embResponse.text();
      console.error("OpenAI embeddings error:", errText);
      return res.status(500).json({ error: "Failed to generate embedding", details: errText });
    }

    const embData = await embResponse.json();
    const vector = embData.data?.[0]?.embedding;

    if (!vector) {
      return res.status(500).json({ error: "No embedding returned from OpenAI" });
    }

    // 2️⃣  Search Qdrant
    const collection = process.env.QDRANT_COLLECTION || "my_collection";
    const qdrantUrl = `https://${process.env.QDRANT_HOST}/collections/${collection}/points/search`;

    const qdrantBody = {
      vector,
      limit,
      with_payload,
      vector_name: "text-embedding-3-small",
    };

    const qdrantResponse = await fetch(qdrantUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": process.env.QDRANT_API_KEY,
      },
      body: JSON.stringify(qdrantBody),
    });

    const qdrantData = await qdrantResponse.json();

    if (!qdrantResponse.ok) {
      console.error("Qdrant search error:", qdrantData);
      return res.status(qdrantResponse.status).json({ error: "Qdrant search failed", details: qdrantData });
    }

    // ✅ Success response
    res.status(200).json({
      success: true,
      count: qdrantData.result?.length ?? 0,
      results: qdrantData.result ?? [],
    });
  } catch (error) {
    console.error("Error in /qdrant/search:", error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Qdrant Proxy running on port ${PORT}`));
