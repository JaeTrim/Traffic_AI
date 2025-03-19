/* eslint-disable no-undef */
// src/app/api/predict/csv/route.js
import connectToDatabase from '@lib/mongodb'
import PredictionCollection from '@models/PredictionCollection'
import Model from '@models/Model'
import axios from 'axios'
import { parse } from 'csv-parse/sync'
import path from 'path' // Import the path module to handle file paths

export const config = {
    api: {
        bodyParser: false,
    },
}

export async function POST(request) {
    try {
        const contentType = request.headers.get('content-type') || ''
        if (!contentType.includes('multipart/form-data')) {
            return new Response(
                JSON.stringify({
                    error: 'Invalid Content-Type. Expected multipart/form-data.',
                }),
                { status: 400 }
            )
        }

        const formData = await request.formData()
        const collectionId = formData.get('collectionId')
        const modelId = formData.get('modelId')
        const csvFile = formData.get('csv')
        const logTransformRaw = formData.get('logTransform') // Extract logTransform

        // Validate required fields
        if (!collectionId || !modelId || !csvFile) {
            return new Response(
                JSON.stringify({
                    error: 'collectionId, modelId, and csv file are required.',
                }),
                { status: 400 }
            )
        }

        // Validate logTransform
        if (logTransformRaw === null) {
            return new Response(
                JSON.stringify({
                    error: 'logTransform is required and must be a boolean (true or false).',
                }),
                { status: 400 }
            )
        }

        // Convert logTransform to boolean
        let logTransform
        if (typeof logTransformRaw === 'string') {
            if (logTransformRaw.toLowerCase() === 'true') {
                logTransform = true
            } else if (logTransformRaw.toLowerCase() === 'false') {
                logTransform = false
            } else {
                return new Response(
                    JSON.stringify({
                        error: 'logTransform must be a boolean (true or false).',
                    }),
                    { status: 400 }
                )
            }
        } else if (typeof logTransformRaw === 'boolean') {
            logTransform = logTransformRaw
        } else {
            return new Response(
                JSON.stringify({
                    error: 'logTransform must be a boolean (true or false).',
                }),
                { status: 400 }
            )
        }

        // Validate csvFile
        if (!(csvFile instanceof File)) {
            return new Response(
                JSON.stringify({ error: 'Invalid file upload.' }),
                { status: 400 }
            )
        }

        await connectToDatabase()

        const collection = await PredictionCollection.findById(collectionId)
        if (!collection) {
            return new Response(
                JSON.stringify({ error: 'Prediction Collection not found.' }),
                { status: 404 }
            )
        }

        const model = await Model.findById(modelId)
        if (!model) {
            return new Response(
                JSON.stringify({ error: 'Associated model not found.' }),
                { status: 404 }
            )
        }

        const csvContent = await csvFile.text()

        // Parse CSV to extract headers and records
        const records = parse(csvContent, {
            columns: true,
            skip_empty_lines: true,
            trim: true,
        })

        if (records.length === 0) {
            return new Response(
                JSON.stringify({
                    error: 'CSV file is empty or improperly formatted.',
                }),
                { status: 400 }
            )
        }

        // Extract the filename from the model's filepath
        const modelFilename = path.basename(model.filePath) // e.g., "model_1.keras"

        // Fetch the model's expected input fields
        const expectedInputFields = model.inputFields // Assuming inputFields is an array of strings

        // Extract CSV headers
        const csvHeaders = Object.keys(records[0])

        // Validation: Check if CSV columns match the model's input fields
        const missingFields = expectedInputFields.filter(
            (field) => !csvHeaders.includes(field)
        )
        const extraFields = csvHeaders.filter(
            (header) => !expectedInputFields.includes(header)
        )

        if (missingFields.length > 0 || extraFields.length > 0) {
            let errorMessage = ''
            if (missingFields.length > 0) {
                errorMessage += `Missing columns: ${missingFields.join(', ')}. `
            }
            if (extraFields.length > 0) {
                errorMessage += `Unexpected columns: ${extraFields.join(', ')}.`
            }
            return new Response(
                JSON.stringify({
                    error: `CSV validation failed. Please make sure the CSV file 
                    has the correct fields for the chosen model. ${errorMessage}`,
                }),
                { status: 400 }
            )
        }

        // Enforce column order
        const rearrangedRecords = records.map((record) => {
            const rearranged = {}
            expectedInputFields.forEach((field) => {
                rearranged[field] = record[field]
            })
            return rearranged
        })

        // Optional: Ensure no missing fields after rearrangement
        rearrangedRecords.forEach((record, index) => {
            expectedInputFields.forEach((field) => {
                if (record[field] === undefined) {
                    throw new Error(
                        `Missing value for field "${field}" in record ${
                            index + 1
                        }`
                    )
                }
            })
        })

        // Send batch prediction request to FastAPI
        const fastApiUrl = process.env.ML_API_URL
            ? `${process.env.ML_API_URL}/predict_batch`
            : 'http://127.0.0.1:8000/predict_batch'

        const predictionPayload = {
            modelId: modelFilename, // Send the filename as modelId
            predictions: rearrangedRecords, // Use the rearranged records
            applyLogTransform: logTransform, // Include logTransform
        }

        // Optional: Log the payload for debugging
        console.log('Sending payload to FastAPI:', predictionPayload)

        const predictionResponse = await axios.post(
            fastApiUrl,
            predictionPayload,
            {
                headers: {
                    'Content-Type': 'application/json',
                },
                timeout: 10000,
            }
        )

        const { results } = predictionResponse.data

        if (!results || results.length !== records.length) {
            return new Response(
                JSON.stringify({ error: 'Mismatch in prediction results.' }),
                { status: 500 }
            )
        }

        const predictionResults = results.map((result, index) => ({
            modelId: modelId, // Keeping modelId as is for tracking in MongoDB
            inputs: Object.entries(records[index]).map(([key, value]) => ({
                key,
                value,
            })),
            result: result.result,
            sourceType: 'csv',
            createdAt: new Date(),
        }))

        collection.predictions.push(...predictionResults)
        await collection.save()

        return new Response(
            JSON.stringify({
                message: 'CSV predictions saved successfully',
                predictions: predictionResults,
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
    } catch (error) {
        console.error('Error processing CSV predictions:', error)

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

        return new Response(JSON.stringify({ error: errorMessage }), { status })
    }
}
