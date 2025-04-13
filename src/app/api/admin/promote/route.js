import { NextResponse } from 'next/server'
import connectToDatabase from '@lib/mongodb'
import User from '@models/User'
import { verifyToken } from '@lib/auth'

export async function POST(req) {
    const token = req.cookies.get('token')?.value
    if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    try {
        const payload = verifyToken(token)
        await connectToDatabase()
        const admin = await User.findById(payload.userId)
        
        if (!admin || admin.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
        }
        
        const { username } = await req.json()
        if (!username) {
            return NextResponse.json({ error: 'Username is required' }, { status: 400 })
        }
        
        const currUser = await User.findOne({ username })
        if (!currUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        currUser.role = 'admin'
        await currUser.save()
        
        return NextResponse.json({ 
            message: 'User promoted to admin successfully',
            user: {
                _id: currUser._id,
                username: currUser.username,
                role: currUser.role
            }
        }, { status: 200 })
    } 
    catch (error) {
        console.error('Error promoting user to admin:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
