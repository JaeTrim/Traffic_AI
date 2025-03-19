// models/Model.js
import mongoose from 'mongoose'

const modelSchema = new mongoose.Schema({
    name: { type: String, required: true }, // Name of the model
    filePath: { type: String, required: true }, // Path to where the model is stored
    inputFields: [{ type: String, required: true }], // Ordered list of input field names
    createdAt: { type: Date, default: Date.now },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    }, // Admin who uploaded the model
})

const Model = mongoose.models.Model || mongoose.model('Model', modelSchema)

export default Model
