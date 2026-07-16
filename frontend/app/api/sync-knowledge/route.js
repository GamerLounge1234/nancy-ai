import { Pinecone } from "@pinecone-database/pinecone";
import { pipeline, env } from "@xenova/transformers";

env.remoteHost = 'https://hf-mirror.com';
env.allowLocalModels = false;

const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
let embedder = null;

async function getEmbedder() {
  if (!embedder) embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  return embedder;
}

export async function GET(req) {
  try {
    // SECURITY: Prevent random people on the internet from triggering your database sync
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new Response('Unauthorized', { status: 401 });
    }

    console.log("[NANCY SYNC] Initiating global DBD knowledge sync...");
    const model = await getEmbedder();
    const index = pc.index("nancy-dbd-brain");
    
    // We use the NightLight public API (or similar open-source DBD JSON repos)
    // This provides clean, mathematically accurate stats for every item in the game
    const response = await fetch("https://api.nightlight.gg/v1/perks", {
      headers: { "Accept": "application/json" }
    });
    
    if (!response.ok) throw new Error("Failed to fetch game data");
    const data = await response.json();
    
    const vectors = [];
    
    // Loop through every single perk in the game
    for (const perk of data.data) {
      // 1. Create a perfectly structured paragraph for the AI to read
      const readableText = `PERK NAME: ${perk.name}\nROLE: ${perk.role}\nCHARACTER: ${perk.character || 'General'}\nDESCRIPTION: ${perk.description}`;
      
      // 2. Generate the mathematical embedding
      const output = await model(readableText, { pooling: 'mean', normalize: true });
      const vectorArray = Array.from(output.data);
      
      // 3. Package it with RICH METADATA
      vectors.push({
        id: `perk-${perk.id}`,
        values: vectorArray,
        metadata: {
          category: "game_knowledge",
          item_type: "perk",
          role: perk.role, // "Killer" or "Survivor"
          name: perk.name,
          text: readableText
        }
      });
    }

    // 4. Upload in batches of 50 to Pinecone
    const batchSize = 50;
    for (let i = 0; i < vectors.length; i += batchSize) {
      const batch = vectors.slice(i, i + batchSize);
      await index.upsert({ records: batch });
    }

    return new Response(JSON.stringify({ success: true, message: `Successfully synced ${vectors.length} items to Nancy's brain!` }), { status: 200 });

  } catch (error) {
    console.error(error);
    return new Response('Sync failed', { status: 500 });
  }
}