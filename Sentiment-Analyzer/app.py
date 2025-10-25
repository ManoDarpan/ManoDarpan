from fastapi import FastAPI, Response
from pydantic import BaseModel
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch
import uvicorn
import os

MODEL_NAME = "boltuix/bert-emotion"
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
model = AutoModelForSequenceClassification.from_pretrained(MODEL_NAME)
labels = model.config.id2label

app = FastAPI(title="BERT Emotion Analyzer API", version="1.0")

class TextInput(BaseModel):
    text: str

@app.post("/analyze")
async def analyze(input: TextInput):
    inputs = tokenizer(input.text, return_tensors="pt", truncation=True)
    outputs = model(**inputs)
    probs = torch.sigmoid(outputs.logits)[0]
    emotion_scores = {labels[i]: round(float(probs[i]), 4) for i in range(len(labels))}
    sorted_emotions = dict(sorted(emotion_scores.items(), key=lambda x: x[1], reverse=True))
    
    return {"emotions": sorted_emotions}

@app.get("/")
async def home():
    return {"message": "BERT Emotion Analyzer API is running!"}

@app.head("/")
async def head_check():
    return Response(status_code=200)

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
