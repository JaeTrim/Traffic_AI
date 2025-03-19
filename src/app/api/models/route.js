/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
import fs from 'fs'
import path from 'path'
import { NextResponse } from 'next/server'
import { verifyToken } from '@lib/auth' // Adjust the path based on your auth file location
import connectToDatabase from '@lib/mongodb'
import Model from '@models/Model'

export const config = {
    api: {
        bodyParser: false, // Disable Next.js default body parsing to handle multipart/form-data
    },
}

export async function POST(request) {
    try {
        // Ensure the request is of type multipart/form-data
        const contentType = request.headers.get('content-type') || ''
        if (!contentType.includes('multipart/form-data')) {
            return new Response(
                JSON.stringify({
                    error: 'Invalid Content-Type. Expected multipart/form-data.',
                }),
                { status: 400 }
            )
        }

        // Parse the formData
        const formData = await request.formData()
        const name = formData.get('name')
        const inputFields = formData.get('inputFields')
        const userId = formData.get('userId')
        const modelFile = formData.get('modelFile')

        // Validate required fields
        if (!name || !inputFields || !userId || !modelFile) {
            return new Response(
                JSON.stringify({
                    error: 'Name, inputFields, userId, and model file are required.',
                }),
                { status: 400 }
            )
        }

        const inputFieldsArray = JSON.parse(inputFields)
        if (!Array.isArray(inputFieldsArray) || inputFieldsArray.length === 0) {
            return new Response(
                JSON.stringify({
                    error: 'inputFields must be a non-empty array.',
                }),
                { status: 400 }
            )
        }

        // Construct the path to the FastAPI models directory
        const modelsDir = path.join(process.cwd(), 'FastAPI', 'models')
        if (!fs.existsSync(modelsDir)) {
            fs.mkdirSync(modelsDir, { recursive: true })
        }

        // Save the uploaded file with its original filename
        const savedFilePath = path.join(modelsDir, modelFile.name)
        const fileBuffer = await modelFile.arrayBuffer()
        fs.writeFileSync(savedFilePath, Buffer.from(fileBuffer))

        await connectToDatabase()

        // Create a new model entry in MongoDB
        const newModel = new Model({
            name, // Name provided by user
            filePath: `/models/${modelFile.name}`, // Save path with original filename
            inputFields: inputFieldsArray,
            createdBy: userId,
        })

        await newModel.save()

        // Return response with the saved model details
        return NextResponse.json({
            message: 'Model uploaded and saved successfully',
            model: newModel,
        })
    } catch (error) {
        console.error('Error uploading model:', error)
        return NextResponse.json(
            { error: 'Error uploading model' },
            { status: 500 }
        )
    }
}

export async function GET(req) {
    try {
        await connectToDatabase()

        // Fetch all models in the database
        const models = await Model.find({}).exec()

        return new Response(JSON.stringify(models), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        })
    } catch (error) {
        console.error('Error fetching models:', error)
        return new Response(
            JSON.stringify({ error: 'Error fetching models' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        )
    }
}

export async function DELETE(req) {
    try {
        // Extract token from request headers
        const token = req.headers.get('authorization')?.split(' ')[1]
        if (!token) {
            return new Response(
                JSON.stringify({ error: 'No token provided' }),
                { status: 401 }
            )
        }

        // Verify the token
        const decoded = verifyToken(token)
        if (!decoded) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 403,
            })
        }

        // Parse model ID from the URL and trim any extra whitespace
        const url = new URL(req.url)
        const modelId = url.searchParams.get('modelId')?.trim() // Ensure no whitespace or newline

        if (!modelId) {
            return new Response(
                JSON.stringify({ error: 'Model ID is required' }),
                { status: 400 }
            )
        }

        // Connect to the database
        await connectToDatabase()

        // Find the model in the database
        const model = await Model.findById(modelId)
        if (!model) {
            return new Response(JSON.stringify({ error: 'Model not found' }), {
                status: 404,
            })
        }

        // Delete the model file from the filesystem
        const modelPath = path.join(
            process.cwd(),
            'FastAPI',
            'models',
            path.basename(model.filePath) // Use only the file name from filePath
        )
        fs.unlink(modelPath, (err) => {
            if (err) {
                console.error('Error deleting file:', err)
            }
        })

        // Delete the model document from MongoDB
        await Model.findByIdAndDelete(modelId)

        return new Response(
            JSON.stringify({ message: 'Model deleted successfully' }),
            { status: 200 }
        )
    } catch (error) {
        console.error('Error deleting model:', error)
        return new Response(
            JSON.stringify({ error: 'Internal server error' }),
            { status: 500 }
        )
    }
}
