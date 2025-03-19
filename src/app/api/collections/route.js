import { NextResponse } from 'next/server'
import connectToDatabase from '@lib/mongodb'
import PredictionCollection from '@models/PredictionCollection'
import mongoose from 'mongoose'

// GET /api/collections?userId=your_user_id
export async function GET(req) {
    try {
        // Parse the query parameters to get userId
        const { searchParams } = new URL(req.url)
        const userId = searchParams.get('userId')

        if (!userId) {
            return NextResponse.json(
                { error: 'userId is required' },
                { status: 400 }
            )
        }

        await connectToDatabase()

        const collections = await PredictionCollection.find({
            userId: new mongoose.Types.ObjectId(userId),
        })
            .sort({ createdAt: -1 }) // Optional: Sort by creation date descending
            .exec()

        return NextResponse.json(collections, {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        })
    } catch (error) {
        console.error('Error fetching prediction collections:', error)
        return NextResponse.json(
            { error: 'Error fetching prediction collections' },
            { status: 500 }
        )
    }
}

// POST /api/collections
// Body: { "collectionName": "Name", "userId": "user_id_here" }
export async function POST(req) {
    try {
        const { collectionName, userId } = await req.json()

        if (!userId) {
            return NextResponse.json(
                { error: 'userId is required' },
                { status: 400 }
            )
        }

        if (!collectionName) {
            return NextResponse.json(
                { error: 'collectionName is required' },
                { status: 400 }
            )
        }

        await connectToDatabase()

        // Check for duplicate collection name
        const existingCollection = await PredictionCollection.findOne({
            userId: new mongoose.Types.ObjectId(userId),
            collectionName: collectionName.trim(),
        })

        if (existingCollection) {
            return NextResponse.json(
                { error: 'Collection name already exists. Please choose a different name.' },
                { status: 409 } // 409 Conflict
            )
        }

        const newCollection = new PredictionCollection({
            collectionName: collectionName.trim(),
            userId: new mongoose.Types.ObjectId(userId),
            predictions: [],
            createdAt: new Date(),
        })

        await newCollection.save()

        return NextResponse.json(
            {
                message: 'Prediction collection created successfully',
                collectionId: newCollection._id,
            },
            { status: 201 }
        )
    } catch (error) {
        console.error('Error creating prediction collection:', error)
        return NextResponse.json(
            { error: 'Error creating prediction collection' },
            { status: 500 }
        )
    }
}

// DELETE /api/collections?collectionId=your_collection_id&userId=your_user_id
export async function DELETE(req) {
    try {
        // Parse the query parameters to get collectionId and userId
        const { searchParams } = new URL(req.url)
        const collectionId = searchParams.get('collectionId')
        const userId = searchParams.get('userId')

        if (!collectionId) {
            return NextResponse.json(
                { error: 'collectionId is required' },
                { status: 400 }
            )
        }

        if (!userId) {
            return NextResponse.json(
                { error: 'userId is required' },
                { status: 400 }
            )
        }

        await connectToDatabase()

        const result = await PredictionCollection.deleteOne({
            _id: new mongoose.Types.ObjectId(collectionId),
            userId: new mongoose.Types.ObjectId(userId),
        })

        if (result.deletedCount === 0) {
            return NextResponse.json(
                { error: 'Collection not found or not owned by user' },
                { status: 404 }
            )
        }

        return NextResponse.json(
            {
                message: 'Prediction collection deleted successfully',
                collectionId,
            },
            { status: 200 }
        )
    } catch (error) {
        console.error('Error deleting prediction collection:', error)
        return NextResponse.json(
            { error: 'Error deleting prediction collection' },
            { status: 500 }
        )
    }
}
