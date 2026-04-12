from fastapi import FastAPI
import pickle
from pydantic import BaseModel
import uvicorn
from fastapi.middleware.cors import CORSMiddleware

with open("model.pkl", "rb") as model_file:
    model = pickle.load(model_file)

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class GrievanceRequest(BaseModel):
    description: str

@app.post("/predict")
async def predict(request: GrievanceRequest):
    description = request.description

    prediction = model.predict([description])[0]

    return {"spam": bool(prediction)}

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)
