from fastapi import FastAPI
from sentence_transformers import SentenceTransformer

app = FastAPI()

# Load the embedding model once
model = SentenceTransformer("all-MiniLM-L6-v2")

@app.post("/embed")
def embed(text: str):
    embedding = model.encode(text, normalize_embeddings=True)
    return {
        "embedding": embedding.tolist()
    }
