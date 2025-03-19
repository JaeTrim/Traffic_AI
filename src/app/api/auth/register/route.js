import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import mongoose from 'mongoose'
import User from '@models/User'
import { NextResponse } from 'next/server'

export async function POST(req) {
    const mongoURL = 'mongodb://localhost:27017/users'

    // Connect to MongoDB
    try {
        await mongoose.connect(mongoURL, {})
        console.log('[AUTH/REGISTER] - Connected to MongoDB')
    } catch (error) {
        console.error('[AUTH/REGISTER] - Error Connecting to MongoDB:', error)
        return NextResponse.json(
            { error: 'Error Connecting to MongoDB' },
            { status: 500 }
        )
    }

    // Receive request body and unpack vars
    const body = await req.json()
    const { username, password } = body
    console.log(`[AUTH/REGISTER] - USER: ${username}, PASS: ${password}`)

    // Check if user exists in MongoDB
    try {
        const user = await User.findOne({
            username: { $regex: new RegExp(username, 'i') },
        })
        console.log(`${JSON.stringify(user)}`)

        if (user) {
            console.log(
                `[AUTH/REGISTER] - User Already Exists: '${user.username}'`
            )
            mongoose.connection.close()
            return NextResponse.json(
                { msg: 'Username Already Taken' },
                { status: 400 }
            )
        }
    } catch (error) {
        console.error('[AUTH/REGISTER] - Error Checking Existing User', error)
        mongoose.connection.close()
        return NextResponse.json(
            { error: 'Error Checking Existing User' },
            { status: 500 }
        )
    }

    // Hash Password
    let passwordHash
    try {
        passwordHash = await bcrypt.hash(password, 10)
        if (!passwordHash) {
            mongoose.connection.close()
            return NextResponse.json(
                { error: 'Error Hashing Password' },
                { status: 500 }
            )
        }
    } catch (error) {
        console.error('[AUTH/REGISTER] - Error Hashing Password:', error)
        mongoose.connection.close()
        return NextResponse.json(
            { error: 'Error Hashing Password:' },
            { status: 500 }
        )
    }

    // Add user to MongoDB
    let newUser
    try {
        newUser = new User({
            username: username,
            password: passwordHash,
            // password: 'password'
        })

        await newUser.save()
        console.log('[AUTH/REGISTER] - User Created Successfully:', newUser)
        mongoose.connection.close()
    } catch (error) {
        console.error('[AUTH/REGISTER] - Error Creating User:', error)
        mongoose.connection.close()
        return NextResponse.json(
            { error: 'Error Creating User' },
            { status: 500 }
        )
    }

    // Create JWT token
    try {
        const payload = {
            id: newUser._id,
        }

        console.log(`[AUTH/REGISTER] - payload: ${JSON.stringify(payload)}`)

        let token = jwt.sign(payload, 'test_secret', { expiresIn: 3600 })
        if (!token) {
            mongoose.connection.close()
            return NextResponse.json(
                { msg: 'Failed to create token' },
                { status: 500 }
            )
        }

        console.log(`[AUTH/REGISTER] - Created token: '${token}'`)

        mongoose.connection.close()
        return NextResponse.json(
            { msg: 'registered', token: token },
            { status: 200 }
        )
    } catch (error) {
        console.error('[AUTH/REGISTER] - Error Creating JWT Token')
        mongoose.connection.close()
        return NextResponse.json(
            { error: 'Error Creating JWT Token' },
            { status: 500 }
        )
    }
}
