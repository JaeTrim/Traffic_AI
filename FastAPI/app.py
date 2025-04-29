# main.py
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.responses import JSONResponse, FileResponse
import io
import tensorflow as tf
import numpy as np
import pandas as pd
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

from sklearn.model_selection import KFold
from sklearn.metrics import r2_score
from tensorflow import keras
from tensorflow.keras import layers
from fastapi.middleware.cors import CORSMiddleware

import os
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Or set to specific domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def build_and_compile_model(norm):
    model = keras.Sequential([
        norm,
        layers.Dense(64, activation='relu'),
        layers.Dense(64, activation='relu'),
        layers.Dense(1, activation='linear')
    ])
    model.compile(
        loss='mean_absolute_error',
        metrics=[keras.metrics.MeanSquaredError(), keras.metrics.MeanAbsoluteError()],
        optimizer=keras.optimizers.Adam(0.0001)
    )
    return model

def kfold(dataset: pd.DataFrame, epochs: int = 10, n_splits: int = 10):
    dataset = dataset.copy()
    dataset.dropna(inplace=True)
    kf = KFold(n_splits=n_splits, shuffle=True, random_state=42)

    all_train_mse, all_train_mae, all_train_r2 = [], [], []
    all_test_mse, all_test_mae, all_test_r2 = [], [], []

    epsilon = 1e-6

    for i, (train_index, test_index) in enumerate(kf.split(dataset)):
        train_dataset = dataset.iloc[train_index]
        test_dataset = dataset.iloc[test_index]

        # Transform training data
        train_transform = train_dataset.copy()
        for col in ['CountStation', 'Weaving', 'Lanes', 'Curvature(degrees/100feet)',
                    'CalLength(meters)', 'CAR_SPEED_', 'ADT']:
            train_transform[f'Log {col}'] = np.log(train_transform[col] + epsilon)
            del train_transform[col]

        train_features = train_transform.copy()
        train_labels = train_features.pop('Crashes')

        # Normalize based on training features
        normalizer = tf.keras.layers.Normalization(axis=-1)
        normalizer.adapt(np.array(train_features))

        # Build and train the model
        dnn_model = build_and_compile_model(normalizer)
        dnn_model.fit(
            train_features,
            train_labels,
            validation_split=0.2,
            epochs=epochs,
            verbose=0
        )

        # Train predictions and metrics
        y_pred_train = dnn_model.predict(train_features).flatten()
        mse_train = np.mean((y_pred_train - train_labels) ** 2)
        mae_train = np.mean(abs(y_pred_train - train_labels))
        r2_train = r2_score(train_labels, y_pred_train)

        all_train_mse.append(mse_train)
        all_train_mae.append(mae_train)
        all_train_r2.append(r2_train)

        # Transform test data
        test_transform = test_dataset.copy()
        for col in ['CountStation', 'Weaving', 'Lanes', 'Curvature(degrees/100feet)',
                    'CalLength(meters)', 'CAR_SPEED_', 'ADT']:
            test_transform[f'Log {col}'] = np.log(test_transform[col] + epsilon)
            del test_transform[col]

        test_features = test_transform.copy()
        test_labels = test_features.pop('Crashes')

        # Test predictions and metrics
        y_pred_test = dnn_model.predict(test_features).flatten()
        mse_test = np.mean((y_pred_test - test_labels) ** 2)
        mae_test = np.mean(abs(y_pred_test - test_labels))
        r2_test = r2_score(test_labels, y_pred_test)

        all_test_mse.append(mse_test)
        all_test_mae.append(mae_test)
        all_test_r2.append(r2_test)

        print(f"=== Fold {i+1} ===")
        print(f"Train -> MSE: {mse_train:.4f}, MAE: {mae_train:.4f}, R²: {r2_train:.4f}")
        print(f"Test  -> MSE: {mse_test:.4f}, MAE: {mae_test:.4f}, R²: {r2_test:.4f}")
        print()

    # Average metrics
    avg_train_mse = np.mean(all_train_mse)
    avg_train_mae = np.mean(all_train_mae)
    avg_train_r2 = np.mean(all_train_r2)

    avg_test_mse = np.mean(all_test_mse)
    avg_test_mae = np.mean(all_test_mae)
    avg_test_r2 = np.mean(all_test_r2)

    print(f"\n=== Average Metrics Across All Folds ===")
    print(f"Training -> Avg MSE: {avg_train_mse:.4f}, Avg MAE: {avg_train_mae:.4f}, Avg R²: {avg_train_r2:.4f}")
    print(f"Testing  -> Avg MSE: {avg_test_mse:.4f}, Avg MAE: {avg_test_mae:.4f}, Avg R²: {avg_test_r2:.4f}")

    return {
        "Average Train MSE": round(avg_train_mse, 4),
        "Average Train MAE": round(avg_train_mae, 4),
        "Average Train R²": round(avg_train_r2, 4),
    }






@app.post("/train_model")
async def train_model(file: UploadFile = File(...), epochs: int = Form(...), kfolds: int = Form(...)):
    try:
        contents = await file.read()
        df = pd.read_csv(io.BytesIO(contents))
        results = kfold(df, epochs, kfolds)
        return JSONResponse(content={"results": results})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

#downloads the most recent trained model (dnnmodel.keras) and sends it to the client from the train model page
@app.get("/download_model")
async def download_model():
    file_path = os.path.join(os.path.dirname(__file__), "dnnmodel.keras")
    print(f"Resolved path: {file_path}")
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Model file not found")

    return FileResponse(
        path=file_path,
        filename="dnnmodel.keras",
        media_type="application/octet-stream"
    )
#==================


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
