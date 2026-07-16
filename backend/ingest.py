import json
import os
from dotenv import load_dotenv
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.embeddings import HuggingFaceEmbeddings
from pinecone import Pinecone

# 1. Load environment variables securely
load_dotenv()
api_key = os.getenv("PINECONE_API_KEY")
index_name = os.getenv("PINECONE_INDEX_NAME")

if not api_key:
    raise ValueError("PINECONE_API_KEY not found in .env file.")

# 2. Initialize Pinecone connection
pc = Pinecone(api_key=api_key)
index = pc.Index(index_name)

def ingest_data():
    print("Loading local patch notes...")
    file_path = 'data/patch_notes.json'
    
    if not os.path.exists(file_path):
        print("No data found. Run scraper.py first.")
        return

    with open(file_path, 'r', encoding='utf-8') as f:
        raw_text_list = json.load(f)

    # Join the list into a single massive string for the splitter
    full_text = " ".join(raw_text_list)

    print("Chunking data...")
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=100,
        length_function=len
    )
    chunks = text_splitter.split_text(full_text)

    print(f"Created {len(chunks)} chunks. Generating embeddings...")
    
    # 4. Use a free, local open-source embedding model
    # all-MiniLM-L6-v2 outputs 384 dimensions
    embeddings_model = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
    
    # 5. Batch upload to Pinecone
    # We upload in batches of 100 to avoid overwhelming the free tier API limits
    batch_size = 100
    for i in range(0, len(chunks), batch_size):
        batch_chunks = chunks[i:i+batch_size]
        
        # Generate the mathematical vectors for this batch
        batch_vectors = embeddings_model.embed_documents(batch_chunks)
        
        # Format data for Pinecone: (id, vector, metadata)
        # Metadata holds the actual readable text so NANCY can retrieve it later
        vectors_to_upsert = []
        for j, chunk in enumerate(batch_chunks):
            vector_id = f"chunk_{i+j}"
            vectors_to_upsert.append((vector_id, batch_vectors[j], {"text": chunk}))
        
        print(f"Upserting batch {i//batch_size + 1}...")
        index.upsert(vectors=vectors_to_upsert)

    print("Ingestion complete. NANCY's brain is loaded.")

if __name__ == "__main__":
    ingest_data()