import { NextResponse } from 'next/server'
import connectToDatabase from '@lib/mongodb'
import User from '@models/User'
import { verifyToken } from '@lib/auth'

export async function GET(req) {
    const token = req.cookies.get('token')?.value
    if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    try {
        const payload = verifyToken(token)      
        await connectToDatabase()
        const admin = await User.findById(payload.userId)
        
        if (!admin || admin.role !== 'admin') {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
        }

        const users = await User.find({}, { password: 0 }).sort({ username: 1 })
        return NextResponse.json({ users }, { status: 200 })
    } 
    catch (error) {
        console.error('Error fetching users:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
