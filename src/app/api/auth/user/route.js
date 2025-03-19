// src/app/api/auth/user/route.js

import { NextResponse } from 'next/server'
import { verifyToken } from '@lib/auth'
import connectToDatabase from '@lib/mongodb'
import User from '@models/User'
import mongoose from 'mongoose'
//import UserForm from '@/app/components/UserForm'

export async function GET(req) {
    // Get token from cookies
    const token = req.cookies.get('token')?.value

    if (!token) {
        return NextResponse.json({ error: 'Token not found' }, { status: 401 })
    }

    try {
        const payload = verifyToken(token)
        const { userId, username } = payload
        await connectToDatabase()

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return NextResponse.json(
                { error: 'Invalid user ID.' },
                { status: 400 }
            )
        }

        const user = await User.findById(userId).select('role').exec()

        if (!user) {
            return NextResponse.json(
                { error: 'User not found.' },
                { status: 404 }
            )
        }
        const role = user.role
        return NextResponse.json({ userId, username, role }, { status: 200 })
    } catch (error) {
        console.error('Invalid token:', error)
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }
}
