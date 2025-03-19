/* eslint-disable no-undef */
import bcrypt from 'bcryptjs'
import { NextResponse } from 'next/server'
import connectToDatabase from '@lib/mongodb'
import User from '@models/User'
import { generateJWTToken } from '@lib/auth'

// const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_secret' // Store secret in env file

export async function POST(req) {
    const { username, password } = await req.json()

    try {
        await connectToDatabase()

        // Check if the user already exists
        const existingUser = await User.findOne({ username })
        if (existingUser) {
            return NextResponse.json(
                { message: 'User already exists' },
                { status: 400 }
            )
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10)

        // Create a new user
        const newUser = new User({ username, password: hashedPassword })
        await newUser.save()

        // Generate a JWT token
        const token = generateJWTToken(newUser)

        return NextResponse.json({ token })
    } catch (error) {
        console.log(error)
        return NextResponse.json(
            { message: 'Error signing up' },
            { status: 500 }
        )
    }
}
