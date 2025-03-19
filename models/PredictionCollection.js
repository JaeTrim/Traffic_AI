import mongoose from 'mongoose'

const predictionCollectionSchema = new mongoose.Schema({
    collectionName: {
        type: String,
        required: true,
        unique: true,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    predictions: [
        {
            modelId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Model',
                required: true,
            }, // Reference to the model used for this prediction
            inputs: [
                {
                    key: String,
                    value: mongoose.Schema.Types.Mixed,
                },
            ], // Ordered input field names and their values
            result: { type: Number }, // The predicted result for each input
            sourceType: {
                type: String,
                enum: ['manual', 'csv'],
                required: true,
            },
            createdAt: {
                type: Date,
                default: Date.now,
            }, // Timestamp for when each prediction was added
        },
    ],
    csvFilePath: {
        type: String,
        required: false,
    }, // Optional path to the uploaded CSV file, if applicable
    createdAt: {
        type: Date,
        default: Date.now,
    }, // Timestamp for when the collection was created
})

const PredictionCollection =
    mongoose.models.PredictionCollection ||
    mongoose.model('PredictionCollection', predictionCollectionSchema)

export default PredictionCollection
