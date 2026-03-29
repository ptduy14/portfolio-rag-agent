import 'dotenv/config';
import express from 'express';
import axios from 'axios';
import { createClient } from '@supabase/supabase-js';
import { getEmbedding } from './embed.js';
import { buildPrompt } from './build-promt.js';

const app = express();
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_PROJECT_URL,
  process.env.SUPABASE_SECRECT_KEY
);

const GROQ_API = process.env.GROQ_API_URL;

app.post('/chat', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    console.log(`\n📩 Question: "${message}"`);

    // 1. Embedding
    const embedding = await getEmbedding(message);
    console.log("Vector length:", embedding.length);

    // 2. Vector search
    const { data: documents, error } = await supabase.rpc(
      'match_documents_portfolio',
      {
        query_embedding: embedding,
        match_count: 3, // Retrieve top 3 matches
        similarity_threshold: 0.25, // (0.0 to 1.0)
        filter_type: null,
        filter_group: null
      } 
    );

    if (error) {
      console.error("❌ Supabase RPC error:", error.message);
      return res.status(500).json({ error: "Database search failed" });
    }

    const docsArray = documents || [];

    console.log(`🔍 Found ${docsArray.length} matches`);

    // If not found any relevant document, return a default message
    if (docsArray.length === 0) {
      return res.json({
        reply: "I’m not sure about that. I don’t have enough information to answer."
      });
    }

    // 3. Build context
    const context = docsArray.map(d => d.content).join('\n');

    // 4. Build prompt
    const prompt = buildPrompt({
      message,
      context
    });

    // 5. Call LLM
    const response = await axios.post(
      GROQ_API,
      {
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: 'You are Tan Duy. Answer briefly using the context provided.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.6, // Reduce creativity for more accurate responses
        max_tokens: 300,  // Set token limit to control response length
        top_p: 1,
        stream: false
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_SECRET_KEY.trim()}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const reply = response.data?.choices?.[0]?.message?.content;

    if (!reply) {
      throw new Error("Empty response from Groq");
    }

    console.log("🤖 Duy:", reply);

    res.json({ reply });

  } catch (err) {
    if (err.response) {
      console.error("❌ Groq error:", JSON.stringify(err.response.data, null, 2));
    } else {
      console.error("💥 System error:", err.message);
    }

    res.status(500).json({ error: "Internal Server Error" });
  }
});

const PORT = process.env.PORT || 7860; 
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});