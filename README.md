# Qdrant Proxy API

A secure Node.js + Express proxy to safely call your Qdrant Cloud endpoint
without exposing your API key.

## Quick Start

```bash
npm install
npm start
```

The server runs at `http://localhost:3000`

## Deploy on Vercel

- Push this project to GitHub
- Go to [Vercel.com](https://vercel.com)
- Import your repo
- Add Environment Variable:
  ```
  QDRANT_API_KEY=your-real-api-key
  ```
- Deploy 🚀

