
from fastapi import FastAPI
import joblib
import numpy as np
import xgboost as xgb

model = xgb.Booster()
model.load_model("grievance_classifier.json")
vectorizer = joblib.load("vectorizer.pkl")
label_encoder = joblib.load("label_encoder.pkl")

app = FastAPI()

@app.get("/")
def home():
    return {"message": "Grievance Classification Model is Running!"}

@app.post("/predict/")
def predict_grievance(description: str):
    description_cleaned = description.lower()
    description_vectorized = vectorizer.transform([description_cleaned]).toarray()
    
    numeric_prediction = model.predict(description_vectorized)[0]
    
    category_prediction = label_encoder.inverse_transform([numeric_prediction])[0]
    
    return {"grievance_category": category_prediction}
