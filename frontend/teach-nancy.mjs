import * as cheerio from 'cheerio';
import { Pinecone } from '@pinecone-database/pinecone';
import { pipeline, env } from '@xenova/transformers';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
env.remoteHost = 'https://hf-mirror.com';
env.allowLocalModels = false;

const FORUM_INDEX_URL = "https://forums.bhvr.com/dead-by-daylight/kb/categories/9-patch-notes";

async function teachNancy() {
  try {
    const discoveredLinks = new Set();
    
    // 1. Loop through Pages 1 to 10 of the forum to grab EVERYTHING from 10.0.2 down to 2.0.0
    for (let page = 1; page <= 10; page++) {
      console.log(`[0] Scanning forum index page ${page}...`);
      const indexResponse = await fetch(`${FORUM_INDEX_URL}/p${page}`);
      if (!indexResponse.ok) continue;
      
      const indexHtml = await indexResponse.text();
      const $index = cheerio.load(indexHtml);
      
      $index('a').each((_, element) => {
        const href = $index(element).attr('href');
        if (href && href.includes('/kb/articles/')) {
          const fullUrl = href.startsWith('http') ? href : `https://forums.bhvr.com${href}`;
          discoveredLinks.add(fullUrl);
        }
      });
      // Small delay to keep Cloudflare happy
      await new Promise(r => setTimeout(r, 500)); 
    }

    const linksToScrape = Array.from(discoveredLinks);
    console.log(`📊 Discovered ${linksToScrape.length} total patch note articles!`);

    const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
    const index = pc.index("nancy-dbd-brain");
    const generateEmbedding = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');

    for (const url of linksToScrape) {
      console.log(`\n[1] Fetching live data from: ${url}...`);
      
      // CRITICAL: 1 second delay so BHVR doesn't IP Ban you for scraping 100+ links at once
      await new Promise(r => setTimeout(r, 1000)); 

      const response = await fetch(url);
      if (!response.ok) continue;
      
      const html = await response.text();
      const $ = cheerio.load(html);
      $('script, style, nav, footer, header, aside, .UserNavigation, .SiteHeader').remove();
      
      let rawText = $('body').text().replace(/\s+/g, ' ').trim();
      let chunks = rawText.match(/.{1,800}(\s|$)/g) || [];
      chunks = chunks.map(c => c.trim()).filter(c => c.length > 50);

      const patchVersionString = url.split('/').pop().replace(/-/g, ' '); 
      const vectors = [];

      for (let i = 0; i < chunks.length; i++) {
        const enrichedChunk = `[Patch Version: ${patchVersionString}] ${chunks[i]}`;
        const output = await generateEmbedding(enrichedChunk, { pooling: 'mean', normalize: true });
        const vectorArray = Array.from(output.data);

        if (vectorArray.length > 0) {
          vectors.push({
            id: `patch-${url.split('/').pop()}-chunk-${i}`, 
            values: vectorArray,
            metadata: { text: enrichedChunk, source: url } 
          });
        }
      }

      if (vectors.length === 0) continue;

      const batchSize = 10;
      for (let i = 0; i < vectors.length; i += batchSize) {
        const batch = vectors.slice(i, i + batchSize);
        await index.upsert({ records: batch });
      }
    }
    
    console.log("\n🎉 Process complete! NANCY has mapped the entire history of DBD.");
  } catch (error) {
    console.error("❌ Error teaching NANCY:", error);
  }
}

teachNancy();