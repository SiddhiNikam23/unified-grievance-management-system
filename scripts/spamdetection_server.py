from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import os

os.chdir(os.path.dirname(os.path.abspath(__file__)))

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://127.0.0.1:5500", "http://localhost:5500", "null"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

try:
    model = joblib.load("model.pkl")
    vectorizer = joblib.load("vectorizer.pkl")
    print("✅ Spam detection model loaded successfully!")
except Exception as e:
    print(f"❌ Error loading model: {e}")
    model = None
    vectorizer = None

class SpamRequest(BaseModel):
    description: str

@app.get("/")
def home():
    return {
        "message": "Spam Detection API is running!",
        "model_loaded": model is not None,
        "endpoint": "/predict"
    }

@app.post("/predict")
def predict_spam(request: SpamRequest):
    if model is None or vectorizer is None:
        return {"error": "Model not loaded", "spam": False}
    
    try:
        description_vectorized = vectorizer.transform([request.description.lower()])
        
        prediction = model.predict(description_vectorized)[0]
        
        return {
            "spam": bool(prediction),
            "message": "Spam detected!" if prediction else "Not spam"
        }
    except Exception as e:
        print(f"Prediction error: {e}")
        return {"error": str(e), "spam": False}
