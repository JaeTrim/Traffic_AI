// app/api/log/route.js
import { NextResponse } from 'next/server';
import connectToDatabase from '@lib/mongodb';
import mongoose from 'mongoose';

// Define log schema if not already defined elsewhere
const logSchema = new mongoose.Schema({
    timestamp: { type: Date, default: Date.now },
    modelName: { type: String, required: true },
    inputSource: { type: String, default: 'Manual input' },
    predictionsCount: { type: Number, default: 1 },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

// Get or create model (prevent model overwrite error)
const LogEntry = mongoose.models.LogEntry || mongoose.model('LogEntry', logSchema);

export async function GET(request) {
    try {
        await connectToDatabase();
        
        // Fetch the most recent log entries
        const logs = await LogEntry.find({})
            .sort({ timestamp: -1 })
            .limit(100)
            .exec();
            
        return NextResponse.json({ log: logs }, { status: 200 });
    } catch (error) {
        console.error('Error fetching activity logs:', error);
        return NextResponse.json({ log: [] }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        await connectToDatabase();
        
        const data = await request.json();
        console.log("Received log POST request with data:", data);
        
        // Validate the data
        if (!data.modelName) {
            console.error("Missing required field: modelName");
            return NextResponse.json({ error: 'Missing required field: modelName' }, { status: 400 });
        }
        
        // Create a new log entry
        const logEntry = new LogEntry({
            modelName: data.modelName,
            inputSource: data.inputSource || 'Manual input',
            predictionsCount: data.predictionsCount || 1,
            userId: data.userId
        });
        
        console.log("Saving log entry:", logEntry);
        
        const savedLog = await logEntry.save();
        console.log("Log entry saved successfully:", savedLog);
        
        // Create response with no-cache headers
        const response = NextResponse.json({ 
            success: true, 
            logEntry: savedLog 
        }, { status: 201 });
        
        // Add cache control headers
        response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
        response.headers.set('Pragma', 'no-cache');
        response.headers.set('Expires', '0');
        
        return response;
    } catch (error) {
        console.error('Error logging prediction:', error);
        return NextResponse.json({ error: `Failed to log prediction: ${error.message}` }, { status: 500 });
    }
}

export async function DELETE(request) {
    try {
        await connectToDatabase();
        
        // Delete all log entries
        await LogEntry.deleteMany({});
            
        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        console.error('Error clearing activity logs:', error);
        return NextResponse.json({ error: 'Failed to clear logs' }, { status: 500 });
    }
}