// src/app/api/predict/add/route.js
import { NextResponse } from 'next/server'
import { connectToDatabase } from '@lib/mongodb'
import PredictionCollection from '@models/PredictionCollection'

export async function POST(req) {
    const { collectionId, newPredictions } = await req.json()

    try {
        // Connect to MongoDB
        await connectToDatabase()

        // Find the existing PredictionCollection by ID
        const existingCollection = await PredictionCollection.findById(
            collectionId
        )

        if (!existingCollection) {
            return NextResponse.json(
                { message: 'PredictionCollection not found' },
                { status: 404 }
            )
        }

        // Append the new predictions to the existing collection
        newPredictions.forEach((prediction) => {
            existingCollection.predictions.push({
                inputs: prediction.inputs.map(({ key, value }) => ({
                    key,
                    value,
                })),
                result: prediction.result,
                sourceType: prediction.sourceType,
                createdAt: new Date(),
            })
        })

        // Save the updated collection
        await existingCollection.save()

        return NextResponse.json({
            message: 'Predictions added successfully',
            collectionId: existingCollection._id,
        })
    } catch (error) {
        console.error('Error adding predictions:', error)
        return NextResponse.json(
            { message: 'Error adding predictions' },
            { status: 500 }
        )
    }
}
