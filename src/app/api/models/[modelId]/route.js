// // src/app/api/models/[modelId]/route.js

// import { NextResponse } from 'next/server'
// import connectToDatabase from '@lib/mongodb'
// import Model from '@models/Model' // Replace with your actual model import
// import mongoose from 'mongoose'

// export async function GET(request, { params }) {
//     const { modelId } = params

//     try {
//         await connectToDatabase()

//         if (!mongoose.Types.ObjectId.isValid(modelId)) {
//             return NextResponse.json(
//                 { error: 'Invalid model ID.' },
//                 { status: 400 }
//             )
//         }

//         const model = await Model.findById(modelId).exec()

//         if (!model) {
//             return NextResponse.json(
//                 { error: 'Model not found.' },
//                 { status: 404 }
//             )
//         }

//         return NextResponse.json(model, { status: 200 })
//     } catch (error) {
//         console.error('Error fetching model:', error)
//         return NextResponse.json(
//             { error: 'Internal server error.' },
//             { status: 500 }
//         )
//     }
// }

// src/app/api/models/[modelId]/route.js

import { NextResponse } from 'next/server'
import connectToDatabase from '@lib/mongodb'
import Model from '@models/Model' // Replace with your actual model import
import mongoose from 'mongoose'
import path from 'path'
import fs from 'fs'

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

export async function PATCH(request, { params }) {
    const { modelId } = params;

    try {
        await connectToDatabase();

        if (!mongoose.Types.ObjectId.isValid(modelId)) {
            return NextResponse.json({ error: 'Invalid model ID.' }, { status: 400 });
        }
        
        // Find the existing model first
        const existingModel = await Model.findById(modelId);
        if (!existingModel) {
            return NextResponse.json({ error: 'Model not found.' }, { status: 404 });
        }
        
        // Check content type to determine how to handle the request
        const contentType = request.headers.get('content-type') || '';
        
        // Handle file upload case (multipart/form-data)
        if (contentType.includes('multipart/form-data')) {
            const formData = await request.formData();
            const name = formData.get('name');
            const inputFieldsJson = formData.get('inputFields');
            const modelFile = formData.get('modelFile');
            
            // Prepare update data
            const updateData = {};
            
            if (name) {
                updateData.name = name.trim();
            }
            
            if (inputFieldsJson) {
                try {
                    const inputFields = JSON.parse(inputFieldsJson);
                    if (Array.isArray(inputFields) && inputFields.length > 0) {
                        updateData.inputFields = inputFields.map(field => field.trim());
                    }
                } catch (e) {
                    console.error("Error parsing inputFields JSON:", e);
                    return NextResponse.json({ error: 'Invalid inputFields format' }, { status: 400 });
                }
            }
            
            // Handle model file update if provided
            if (modelFile && modelFile.size > 0) {
                // Construct the path to the FastAPI models directory
                const modelsDir = path.join(process.cwd(), 'FastAPI', 'models');
                
                // Ensure directory exists
                if (!fs.existsSync(modelsDir)) {
                    fs.mkdirSync(modelsDir, { recursive: true });
                }
                
                // Delete old file if it exists
                if (existingModel.filePath) {
                    const oldFilePath = path.join(
                        process.cwd(),
                        'FastAPI',
                        existingModel.filePath
                    );
                    
                    try {
                        if (fs.existsSync(oldFilePath)) {
                            fs.unlinkSync(oldFilePath);
                        }
                    } catch (fileError) {
                        console.error('Error deleting old model file:', fileError);
                    }
                }
                
                // Save new file
                const savedFilePath = path.join(modelsDir, modelFile.name);
                const fileBuffer = await modelFile.arrayBuffer();
                fs.writeFileSync(savedFilePath, Buffer.from(fileBuffer));
                
                // Update file path in the database
                updateData.filePath = `/models/${modelFile.name}`;
            }
            
            // Update the model in the database
            const updatedModel = await Model.findByIdAndUpdate(
                modelId,
                { $set: updateData },
                { new: true }
            );
            
            return NextResponse.json(updatedModel, { status: 200 });
        } 
        // Handle JSON request (no file update)
        else if (contentType.includes('application/json')) {
            const { name, inputFields } = await request.json();
            
            // Prepare update object with only provided fields
            const updateData = {};
            
            if (name !== undefined) {
                if (!name.trim()) {
                    return NextResponse.json({ error: 'Model name cannot be empty.' }, { status: 400 });
                }
                updateData.name = name.trim();
            }
            
            if (inputFields !== undefined) {
                if (!Array.isArray(inputFields) || inputFields.length === 0) {
                    return NextResponse.json({ error: 'inputFields must be a non-empty array.' }, { status: 400 });
                }
                
                updateData.inputFields = inputFields.map(field => field.trim());
            }
            
            if (Object.keys(updateData).length === 0) {
                return NextResponse.json({ error: 'No valid update data provided.' }, { status: 400 });
            }

            // Find and update the model
            const updatedModel = await Model.findByIdAndUpdate(
                modelId,
                { $set: updateData },
                { new: true }
            );

            return NextResponse.json(updatedModel, { status: 200 });
        } else {
            return NextResponse.json({ 
                error: 'Unsupported content type. Use multipart/form-data for file uploads or application/json for metadata updates.' 
            }, { status: 400 });
        }
    } catch (error) {
        console.error('Error updating model:', error);
        return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
    }
}