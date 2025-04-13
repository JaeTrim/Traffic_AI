// src/app/api/collections/[collectionId]/route.js

import { NextResponse } from 'next/server'
import connectToDatabase from '@lib/mongodb'
import PredictionCollection from '@models/PredictionCollection'
import mongoose from 'mongoose'

export async function GET(request, { params }) {
    const { collectionId } = params

    try {
        await connectToDatabase()

        if (!mongoose.Types.ObjectId.isValid(collectionId)) {
            return NextResponse.json(
                { error: 'Invalid collection ID.' },
                { status: 400 }
            )
        }

        const collection = await PredictionCollection.findById(
            collectionId
        ).exec()

        if (!collection) {
            return NextResponse.json(
                { error: 'Collection not found.' },
                { status: 404 }
            )
        }

        return NextResponse.json(collection, { status: 200 })
    } catch (error) {
        console.error('Error fetching collection:', error)
        return NextResponse.json(
            { error: 'Internal server error.' },
            { status: 500 }
        )
    }
}

export async function DELETE(request, { params }) {
    const { collectionId } = params;

    try {
        await connectToDatabase();

        if (!mongoose.Types.ObjectId.isValid(collectionId)) {
            return NextResponse.json({ error: 'Invalid collection ID.' }, { status: 400 });
        }

        const deletedCollection = await PredictionCollection.findByIdAndDelete(collectionId);

        if (!deletedCollection) {
            return NextResponse.json({ error: 'Collection not found.' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Collection deleted successfully.' }, { status: 200 });
    } catch (error) {
        console.error('Error deleting collection:', error);
        return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
    }
}

export async function PATCH(request, { params }) {
    const { collectionId } = params;

    try {
        await connectToDatabase();

        if (!mongoose.Types.ObjectId.isValid(collectionId)) {
            return NextResponse.json({ error: 'Invalid collection ID.' }, { status: 400 });
        }
        
        // Parse the request body to get the new collection name
        const { collectionName } = await request.json();
        
        if (!collectionName || !collectionName.trim()) {
            return NextResponse.json({ error: 'Collection name is required.' }, { status: 400 });
        }

        // Find and update the collection
        const updatedCollection = await PredictionCollection.findByIdAndUpdate(
            collectionId,
            { $set: { collectionName: collectionName.trim() } },
            { new: true } // Return the updated document
        );

        if (!updatedCollection) {
            return NextResponse.json({ error: 'Collection not found.' }, { status: 404 });
        }

        return NextResponse.json(updatedCollection, { status: 200 });
    } catch (error) {
        console.error('Error updating collection:', error);
        return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
    }
}