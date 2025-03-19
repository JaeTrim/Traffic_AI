// models/User.js
import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true }, // Username is now the unique identifier
    password: { type: String, required: true }, // Hashed password
    role: { type: String, enum: ['user', 'admin'], default: 'user' }, // Role-based access (user/admin)
    createdAt: { type: Date, default: Date.now },
})

const User = mongoose.models.User || mongoose.model('User', userSchema)

export default User
