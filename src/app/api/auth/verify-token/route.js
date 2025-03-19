/* eslint-disable no-undef */
import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { verifyToken } from '@lib/auth'

export async function POST(req) {
    // Get token from request body
    const body = await req.json()
    const token = body.token

    // Check if token exists
    if (!token) {
        console.log(`[VERIFY-TOKEN] - Token not found`)
        return NextResponse.json({ msg: 'Token Not Found' }, { status: 401 })
    }

    console.log(`[VERIFY-TOKEN] - Token: ${token}`)

    // Get the JWT secret from environment variables
    // const jwtSecret = process.env.JWT_SECRET

    // Verify token with the correct secret
    try {
        // const payload = jwt.verify(token, jwtSecret) // Use the secret from environment variables
        const payload = verifyToken(token) 

        console.log(`[VERIFY-TOKEN] - ${JSON.stringify(payload)}`)
        return NextResponse.json(
            payload, 
            { status: 200 }
        )
    } catch (error) {
        console.log(`[VERIFY-TOKEN] - Invalid token: ${error}`)
        return NextResponse.json({ msg: 'Invalid Token' }, { status: 401 })
    }
}
