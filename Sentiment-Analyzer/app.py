from fastapi import FastAPI, Response # Import FastAPI and Response class
from pydantic import BaseModel # Import BaseModel for request body definition
from transformers import AutoTokenizer, AutoModelForSequenceClassification # Hugging Face transformers for model loading
import torch # PyTorch for tensor operations
import uvicorn # ASGI server to run the app
import os # For accessing environment variables

MODEL_NAME = "boltuix/bert-emotion" # Pre-trained model name
# Load tokenizer and model from Hugging Face
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
model = AutoModelForSequenceClassification.from_pretrained(MODEL_NAME)
labels = model.config.id2label # Map of label IDs to emotion names

app = FastAPI(title="BERT Emotion Analyzer API", version="1.0") # Initialize FastAPI app

# Pydantic model to define the expected structure of the incoming request body
class TextInput(BaseModel):
    text: str

@app.post("/analyze")
async def analyze(input: TextInput): # Endpoint for emotion analysis
    # Tokenize input text (truncation handles long text)
    inputs = tokenizer(input.text, return_tensors="pt", truncation=True)
    outputs = model(**inputs) # Get model outputs (logits)
    # Apply sigmoid to convert logits to probabilities (since it's a multi-label classification)
    probs = torch.sigmoid(outputs.logits)[0]
    # Map probabilities to emotion labels and round the scores
    emotion_scores = {labels[i]: round(float(probs[i]), 4) for i in range(len(labels))}
    # Sort emotions by score in descending order
    sorted_emotions = dict(sorted(emotion_scores.items(), key=lambda x: x[1], reverse=True))
    
    return {"emotions": sorted_emotions}

@app.get("/")
async def home(): # Root endpoint
    return {"message": "BERT Emotion Analyzer API is running!"}

@app.head("/")
async def head_check(): # Health check endpoint for HEAD requests
    return Response(status_code=200)

if __name__ == "__main__":
    # Get port from environment variables or default to 8000
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port) # Run the FastAPI application
