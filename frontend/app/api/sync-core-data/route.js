import { Pinecone } from "@pinecone-database/pinecone";
import { pipeline, env } from "@xenova/transformers";
import * as cheerio from 'cheerio';

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
    console.log("[NANCY DB] Initiating Official Wiki Extractor...");
    
    const model = await getEmbedder();
    const index = pc.index("nancy-dbd-brain");
    
    // 1. Fetch the exact URL you provided
    const TARGET_URL = "https://deadbydaylight.wiki.gg/wiki/Perks";
    console.log(`[NANCY DB] Fetching data from: ${TARGET_URL}`);
    
    const response = await fetch(TARGET_URL, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/122.0.0.0" }
    });
    
    if (!response.ok) throw new Error(`Wiki responded with status: ${response.status}`);
    const html = await response.text();
    const $ = cheerio.load(html);
    
    const vectors = [];
    let perkCount = 0;

    // 2. Target the specific 'wikitable' classes used by the DBD Wiki
    $('.wikitable tbody tr').each((_, row) => {
      // The Wiki structures perks with <th> for names/characters and <td> for the description
      const headerCells = $(row).find('th');
      const dataCells = $(row).find('td');
      
      // Skip structural rows or headers
      if (headerCells.length < 2 || dataCells.length === 0) return;

      // Extract raw text and clean up Wiki formatting artifacts
      let perkName = $(headerCells[1]).text().replace(/\n/g, '').trim();
      let character = $(headerCells[2]).text().replace(/\n/g, '').trim() || "Universal";
      
      // The description cell often has image tags and breaks. We replace them with spaces.
      let description = $(dataCells[0]).text().replace(/\s+/g, ' ').trim();

      // Ensure we actually grabbed a perk and not a layout element
      if (perkName && description.length > 20) {
        perkCount++;
        
        // Structure the data perfectly for the LLM
        const aiReadableText = `
          PERK NAME: ${perkName}
          CHARACTER ORIGIN: ${character}
          DESCRIPTION: ${description}
        `.trim();

        vectors.push({
          id: `perk-${perkName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
          metadata: {
            category: "core_knowledge",
            type: "perk",
            name: perkName,
            character: character,
            text: aiReadableText
          },
          // We will generate the embedding below
          rawText: aiReadableText 
        });
      }
    });

    console.log(`[NANCY DB] Extracted ${perkCount} perks. Generating mathematical embeddings...`);

    // 3. Generate embeddings for the extracted data
    for (const item of vectors) {
      const output = await model(item.rawText, { pooling: 'mean', normalize: true });
      item.values = Array.from(output.data);
      delete item.rawText; // Clean up before sending to Pinecone
    }

    // 4. Batch Upload to Pinecone (Pinecone prefers batches of ~50-100)
    console.log("[NANCY DB] Uploading to Pinecone...");
    const batchSize = 50;
    for (let i = 0; i < vectors.length; i += batchSize) {
      const batch = vectors.slice(i, i + batchSize);
      await index.upsert({ records: batch });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Successfully extracted and memorized ${perkCount} perks from the official wiki!` 
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error("Extraction failed:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}