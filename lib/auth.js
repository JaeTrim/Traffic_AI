/* eslint-disable no-undef */
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret'

export function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET)
    } catch (error) {
        console.error(`[AUTH] - Token verification failed: ${error.message}`)
        return null
    }
}

export function generateJWTToken(user) {
        // Create Payload, Include Username, UserID
        const payload = {
            username: user.username,
            userId: user._id,
            isAdmin: user.role === 'admin',
        }
        // Encode (Sign) JWT token
        const token = jwt.sign(payload, JWT_SECRET, {
            expiresIn: '1h',
        })
        return token // Send token to caller

}
