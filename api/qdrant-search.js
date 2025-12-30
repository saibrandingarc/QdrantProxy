export default async function handler(req, res) {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }
  
    const { query_text, limit = 5, with_payload = true } = req.body;
  
    if (!query_text) {
      return res.status(400).json({ error: "query_text is required" });
    }
  
    try {
      // 1️⃣ Generate embedding
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
  
      const embData = await embResponse.json();
      const vector = embData.data?.[0]?.embedding;
  
      if (!vector) {
        return res.status(500).json({ error: "No embedding returned from OpenAI" });
      }
  
      // 2️⃣ Search Qdrant
      const qdrantResponse = await fetch(
        `https://${process.env.QDRANT_HOST}/collections/${process.env.QDRANT_COLLECTION}/points/search`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "api-key": process.env.QDRANT_API_KEY,
          },
          body: JSON.stringify({
            vector_name: "text-embedding-3-small",
            vector,
            limit,
            with_payload
          }),
        }
      );
  
      const qdrantData = await qdrantResponse.json();
      return res.status(200).json(qdrantData);
  
    } catch (error) {
      console.error("Error in /api/qdrant-search:", error);
      return res.status(500).json({ error: error.message });
    }
  }
  