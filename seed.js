import 'dotenv/config';
import fs from 'fs/promises';

import { createClient } from '@supabase/supabase-js';
import { getEmbedding } from './embed.js';

const SUPABASE_PROJECT_URL = process.env.SUPABASE_PROJECT_URL;
const SUPABASE_SECRECT_KEY = process.env.SUPABASE_SECRECT_KEY;

if (!SUPABASE_PROJECT_URL || !SUPABASE_SECRECT_KEY) {
  throw new Error("Missing Supabase configuration.");
}

const supabase = createClient(SUPABASE_PROJECT_URL, SUPABASE_SECRECT_KEY);

const BATCH_SIZE = 10;

// Load knowledge JSON
async function loadKnowledge() {
  const raw = await fs.readFile('./knowledge.json', 'utf-8');
  return JSON.parse(raw);
}

async function seed() {
  console.log("🚀 Start seeding...");

  try {
    const knowledge = await loadKnowledge();

    for (let i = 0; i < knowledge.length; i += BATCH_SIZE) {
      const batch = knowledge.slice(i, i + BATCH_SIZE);

      const data = await Promise.all(
        batch.map(async (item) => {
          const embedding = await getEmbedding(item.content);

          // console.log(item.id, embedding.length);

          return {
            id: item.id,
            content: item.content,
            embedding,
            type: item.type,
            group: item.group || null,
            tags: item.tags || [],
            priority: item.priority || 2
          };
        })
      );

      const { error } = await supabase
        .from('documents')
        .upsert(data);

      if (error) throw error;

      console.log(`✅ Inserted batch ${i / BATCH_SIZE + 1}`);
    }

    console.log("🎉 Seeding completed successfully!");
  } catch (error) {
    console.error("❌ Seed failed:", error.message);
  }
}

seed();