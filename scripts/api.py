from datetime import datetime
from pathlib import Path

import joblib
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from predictor import predict_future, predictor_health
from complaint_classifier import classify_text, is_valid_complaint


BASE_DIR = Path(__file__).resolve().parent

app = FastAPI(title="NagrikConnect Prediction API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5500",
        "http://localhost:5500",
        "null",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

try:
    spam_model = joblib.load(BASE_DIR / "model.pkl")
    spam_vectorizer = joblib.load(BASE_DIR / "vectorizer.pkl")
    print("Spam model loaded successfully")
except Exception as exc:
    print(f"Error loading spam model: {exc}")
    spam_model = None
    spam_vectorizer = None


class SpamRequest(BaseModel):
    description: str


class ComplaintClassificationRequest(BaseModel):
    text: str
    min_confidence: float = 0.6


@app.get("/")
def home():
    return {
        "message": "NagrikConnect API is running",
        "spam_model_loaded": spam_model is not None,
        "future_predictor": predictor_health(),
        "endpoints": {
            "spam": "POST /predict",
            "future_complaints": "GET /predict?date=YYYY-MM-DD",
            "classify_complaint": "POST /classify-complaint",
        },
    }


@app.post("/predict")
def predict_spam(request: SpamRequest):
    if spam_model is None or spam_vectorizer is None:
        raise HTTPException(status_code=503, detail="Spam model not loaded")

    try:
        vectorized = spam_vectorizer.transform([request.description.lower()])
        prediction = spam_model.predict(vectorized)[0]
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Prediction error: {exc}") from exc

    return {
        "spam": bool(prediction),
        "message": "Spam detected" if prediction else "Not spam",
    }


@app.get("/predict")
def predict_future_complaints(date: str = Query(..., description="Target date in YYYY-MM-DD format")):
    try:
        datetime.strptime(date, "%Y-%m-%d")
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD") from exc

    try:
        return predict_future(date)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {exc}") from exc


@app.get("/predict-future")
def predict_future_complaints_alias(date: str = Query(..., description="Target date in YYYY-MM-DD format")):
    return predict_future_complaints(date)


@app.post("/classify-complaint")
def classify_complaint(request: ComplaintClassificationRequest):
    """
    AI-powered complaint classification endpoint
    
    Returns:
    {
        "type": "HELP_REQUEST" | "INFORMATIONAL" | "RESOLVED" | "SPAM",
        "confidence": float (0.0-1.0),
        "is_valid": boolean,
        "scores": {"help": float, "resolved": float, "spam": float, "info": float},
        "sentiment": "positive" | "negative" | "neutral",
        "reason": string
    }
    """
    try:
        classification = classify_text(request.text)
        classification["is_valid"] = is_valid_complaint(classification, request.min_confidence)
        return classification
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Classification error: {exc}") from exc


@app.post("/classify-bulk")
def classify_complaints_bulk(requests: list):
    """
    Classify multiple complaints at once
    
    Expects: [{"text": "...", "min_confidence": 0.6}, ...]
    Returns: [{"type": "...", "confidence": ..., "is_valid": ..., ...}, ...]
    """
    try:
        results = []
        for req in requests:
            text = req.get("text", "")
            min_conf = req.get("min_confidence", 0.6)
            
            classification = classify_text(text)
            classification["is_valid"] = is_valid_complaint(classification, min_conf)
            results.append(classification)
        
        return {"classified_count": len(results), "results": results}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Bulk classification error: {exc}") from exc
