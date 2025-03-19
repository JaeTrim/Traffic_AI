// src/app/api/models/[modelId]/route.js

import { NextResponse } from 'next/server'
import connectToDatabase from '@lib/mongodb'
import Model from '@models/Model' // Replace with your actual model import
import mongoose from 'mongoose'

export async function GET(request, { params }) {
    const { modelId } = params

    try {
        await connectToDatabase()

        if (!mongoose.Types.ObjectId.isValid(modelId)) {
            return NextResponse.json(
                { error: 'Invalid model ID.' },
                { status: 400 }
            )
        }

        const model = await Model.findById(modelId).exec()

        if (!model) {
            return NextResponse.json(
                { error: 'Model not found.' },
                { status: 404 }
            )
        }

        return NextResponse.json(model, { status: 200 })
    } catch (error) {
        console.error('Error fetching model:', error)
        return NextResponse.json(
            { error: 'Internal server error.' },
            { status: 500 }
        )
    }
}
