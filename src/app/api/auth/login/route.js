/* eslint-disable no-undef */
import bcrypt from 'bcryptjs'
import { NextResponse } from 'next/server'
import connectToDatabase from '@lib/mongodb'
import { generateJWTToken } from '@lib/auth'
import User from '@models/User'

const JWT_SECRET = process.env.JWT_SECRET

export async function POST(req) {
    const { username, password } = await req.json()

    if (!JWT_SECRET) {
        console.error('JWT_SECRET is not defined!')
        return NextResponse.json(
            { message: 'Server misconfiguration' },
            { status: 500 }
        )
    }

    try {
        await connectToDatabase()

        // Find user by username
        const user = await User.findOne({ username })
        if (!user) {
            return NextResponse.json(
                { message: 'Invalid credentials' },
                { status: 400 }
            )
        }

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password)
        if (!isMatch) {
            return NextResponse.json(
                { message: 'Invalid credentials' },
                { status: 400 }
            )
        }

        // Generate JWT token
        const token = generateJWTToken(user)

        // Return token in JSON response
        return NextResponse.json({ token }, { status: 200 })
    } catch (error) {
        console.error('Error logging in:', error)
        return NextResponse.json(
            { message: 'Error logging in' },
            { status: 500 }
        )
    }
}
