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

        const { userId } = await req.json()
        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
        }

        const currUser = await User.findById(userId)
        if (!currUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        if (currUser._id.toString() === admin._id.toString()) {
            return NextResponse.json({ error: 'Cannot revoke your own admin privileges' }, { status: 400 })
        }

        currUser.role = 'user'
        await currUser.save()

        return NextResponse.json({ 
            message: 'Admin privileges revoked successfully',
            user: {
                _id: currUser._id,
                username: currUser.username,
                role: currUser.role
            }
        }, { status: 200 })
    } 
    catch (error) {
        console.error('Error revoking admin privileges:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
