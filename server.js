import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.send("✅ Qdrant Proxy is running!");
});

// POST route to Qdrant
app.post("/qdrant/search", async (req, res) => {
  try {
    const response = await fetch(
      "https://5fb1afda-8f24-4b0a-bc27-3e72849a8024.us-east4-0.gcp.cloud.qdrant.io/collections/deliverables/points/search",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": process.env.QDRANT_API_KEY,
        },
        body: JSON.stringify(req.body),
      }
    );

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error("Error contacting Qdrant:", error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

