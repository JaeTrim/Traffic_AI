# main.py

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import tensorflow as tf
import numpy as np
import pandas as pd
from typing import List, Dict, Any, Optional
import os

app = FastAPI()

# Dictionary to cache loaded models
models_cache = {}

def load_model(model_id: str):
    if model_id in models_cache:
        return models_cache[model_id]
    model_path = f"models/{model_id}"
    if not os.path.exists(model_path):
        raise HTTPException(status_code=404, detail=f"Model {model_id} not found.")
    model = tf.keras.models.load_model(model_path)
    models_cache[model_id] = model
    return model

class PredictionInput(BaseModel):
    inputs: Dict[str, Any]

class BatchPredictionRequest(BaseModel):
    modelId: str
    predictions: List[Dict[str, Any]]
    applyLogTransform: Optional[bool] = True


class PredictionResult(BaseModel):
    inputs: Dict[str, Any]
    result: float

class BatchPredictionResponse(BaseModel):
    results: List[PredictionResult]

class SinglePredictionRequest(BaseModel):
    modelId: str
    inputs: Dict[str, Any]
    logTransform: Optional[bool] = False  # Optional log transform flag

class SinglePredictionResponse(BaseModel):
    inputs: Dict[str, Any]
    result: float

@app.post("/predict_batch", response_model=BatchPredictionResponse)
def predict_batch(request: BatchPredictionRequest):
    model_id = request.modelId
    predictions = request.predictions
    apply_log_transform = request.applyLogTransform

    # Load the model
    try:
        model = load_model(model_id)
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    # Create DataFrame from the predictions, ensuring all values are numeric
    df = pd.DataFrame(predictions)
    df = df.apply(pd.to_numeric, errors='coerce').fillna(0)  # Convert to numeric and fill non-numeric with 0

    # Apply log transformation if requested
    if apply_log_transform:
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        df[numeric_cols] = df[numeric_cols].apply(lambda x: np.log(x + 1))

    # Run predictions
    try:
        features = df.values  # Convert DataFrame to NumPy array
        test_predictions = model.predict(features).flatten()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

    # Prepare response with results
    return {
        "results": [
            {"inputs": input_data, "result": float(pred)}
            for input_data, pred in zip(predictions, test_predictions)
        ]
    }

@app.post("/predict_single", response_model=SinglePredictionResponse)
def predict_single(request: SinglePredictionRequest):
    model_id = request.modelId
    inputs = request.inputs
    log_transform = request.logTransform  # Use the value from the request

    # Load the model
    try:
        model = load_model(model_id)
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    # Prepare input as DataFrame
    df = pd.DataFrame([inputs])

    # Convert all columns to numeric, coercing errors and filling NaNs
    df = df.apply(pd.to_numeric, errors='coerce').fillna(0)

    # Apply log transformation if requested
    if log_transform:
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        df[numeric_cols] = df[numeric_cols].apply(lambda x: np.log(x + 1))

    # Predict
    try:
        prediction = model.predict(df).flatten()[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

    return SinglePredictionResponse(inputs=inputs, result=float(prediction))