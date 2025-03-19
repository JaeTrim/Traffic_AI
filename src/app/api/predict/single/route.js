// src/app/api/predict/single/route.js

/* eslint-disable no-undef */
// src/app/api/predict/single/route.js
import { NextResponse } from 'next/server'
import connectToDatabase from '@lib/mongodb'
import PredictionCollection from '@models/PredictionCollection'
import Model from '@models/Model'
import axios from 'axios'
import path from 'path' // Import the path module to handle file paths

export async function POST(req) {
    try {
        const { collectionId, userId, modelId, inputs, logTransform } =
            await req.json()

        // Validate required fields
        if (!collectionId || !userId || !modelId || !inputs) {
            return NextResponse.json(
                {
                    error: 'collectionId, userId, modelId, and inputs are required.',
                },
                { status: 400 }
            )
        }

        // Validate logTransform
        if (typeof logTransform !== 'boolean') {
            return NextResponse.json(
                {
                    error: 'logTransform is required and must be a boolean (true or false).',
                },
                { status: 400 }
            )
        }

        // Connect to MongoDB
        await connectToDatabase()

        const collection = await PredictionCollection.findById(collectionId)
        if (!collection) {
            return NextResponse.json(
                { error: 'Prediction Collection not found.' },
                { status: 404 }
            )
        }

        const model = await Model.findById(modelId)
        if (!model) {
            return NextResponse.json(
                { error: 'Specified model not found.' },
                { status: 404 }
            )
        }

        // Extract the filename from the model's filepath
        const modelFilename = path.basename(model.filePath) // e.g., "model_1.keras"

        // Set FastAPI URL with proper precedence
        const fastApiUrl = process.env.ML_API_URL
            ? `${process.env.ML_API_URL}/predict_single`
            : 'http://127.0.0.1:8000/predict_single'

        // Prepare payload for FastAPI
        const payload = {
            modelId: modelFilename, // Send the filename as modelId
            inputs: inputs,
            logTransform: logTransform,
        }

        // Log the payload for debugging (optional)
        console.log('Sending payload to FastAPI:', payload)

        // Call FastAPI with the updated payload
        const predictionResponse = await axios.post(fastApiUrl, payload, {
            headers: {
                'Content-Type': 'application/json',
            },
            timeout: 5000,
        })

        // Extract the result from FastAPI's response
        const { result } = predictionResponse.data

        // Prepare the new prediction object
        const newPrediction = {
            modelId,
            inputs: Object.entries(inputs).map(([key, value]) => ({
                key,
                value,
            })),
            result,
            sourceType: 'manual',
            createdAt: new Date(),
        }

        // Add the new prediction to the collection
        collection.predictions.push(newPrediction)
        await collection.save()

        // Return a successful response with the new prediction
        return NextResponse.json({
            message: 'Prediction added successfully',
            prediction: newPrediction,
        })
    } catch (error) {
        console.error('Error processing single prediction:', error)

        let status = 500
        let errorMessage = 'Internal Server Error'

        if (error.response) {
            status = error.response.status
            errorMessage =
                error.response.data.detail ||
                error.response.data.error ||
                'Error from FastAPI service.'
        } else if (error.request) {
            errorMessage = 'No response from FastAPI service.'
        } else if (error.message) {
            errorMessage = error.message
        }

        return NextResponse.json({ error: errorMessage }, { status })
    }
}
