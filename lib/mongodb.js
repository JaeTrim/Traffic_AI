/* eslint-disable no-undef */
// lib/mongodb.js
import mongoose from 'mongoose'

// Ensure that the MONGODB_URI is defined
const MONGODB_URI = process.env.MONGODB_URL

if (!MONGODB_URI) {
    throw new Error(
        'Please define the MONGODB_URL environment variable inside .env.local'
    )
}

/**
 * Global is used here to maintain a cached connection across
 * hot reloads in development. This prevents connections growing
 * exponentially during API Route usage.
 */
let cached = global.mongoose

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null }
}

export default async function connectToDatabase() {
    if (cached.conn) {
        return cached.conn
    }

    if (!cached.promise) {
        const opts = {
            bufferCommands: false,
        }

        cached.promise = mongoose
            .connect(MONGODB_URI, opts)
            .then((mongoose) => {
                return mongoose
            })
    }
    cached.conn = await cached.promise
    return cached.conn
}
