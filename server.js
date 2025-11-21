import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.send("✅ Qdrant Proxy is running!");
});

app.post("/qdrant/search", async (req, res) => {
  try {
    const {
      query_text,
      limit = 5,
      with_payload = true
    } = req.body;

    if (!query_text) {
      return res.status(400).json({ error: "query_text is required" });
    }

    // 1) Call OpenAI Embeddings (or your chosen model)
    const embResponse = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "text-embedding-3-small",  // or whichever model you're using
        input: query_text
      })
    });

    if (!embResponse.ok) {
      const errText = await embResponse.text();
      console.error("OpenAI embeddings error:", errText);
      return res.status(500).json({ error: "Failed to generate embedding" });
    }

    const embData = await embResponse.json();
    const vector = embData.data[0].embedding; // e.g. 1536 floats

    // 2) Call Qdrant search with the computed vector
    const qdrantBody = {
      vector,
      limit,
      with_payload
    };

    const qdrantResponse = await fetch(
      "https://5fb1afda-8f24-4b0a-bc27-3e72849a8024.us-east4-0.gcp.cloud.qdrant.io/collections/deliverables/points/search",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": process.env.QDRANT_API_KEY
        },
        body: JSON.stringify(qdrantBody)
      }
    );

    const qdrantData = await qdrantResponse.json();
    res.status(qdrantResponse.status).json(qdrantData);
  } catch (error) {
    console.error("Error in /qdrant/search:", error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
