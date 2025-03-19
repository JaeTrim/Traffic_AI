// src/app/newcollection/page.js

'use client'

import React, { useState, useEffect } from 'react'
import { Box, TextField, Button, Typography } from '@mui/material'
import { useRouter } from 'next/navigation'
import UIMenu from '../components/UIMenu'

export default function NewCollectionPage() {
    const [collectionName, setCollectionName] = useState('')
    const [error, setError] = useState('')
    const router = useRouter()

    const [user, setUser] = useState(null)
    const [userLoading, setUserLoading] = useState(true)
    const [userError, setUserError] = useState(null)

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await fetch('/api/auth/user', {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                })

                if (response.ok) {
                    const data = await response.json()
                    setUser({ userId: data.userId, username: data.username })
                } else {
                    router.push('/login')
                }
            } catch (err) {
                console.error('Error fetching user:', err)
                setUserError(err)
                router.push('/login')
            } finally {
                setUserLoading(false)
            }
        }
        fetchUser()
    }, [router])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')

        if (!collectionName.trim()) {
            setError('Collection name is required.')
            return
        }

        if (userLoading) {
            setError('User information is still loading.')
            return
        }

        if (!user) {
            setError('User not authenticated.')
            return
        }

        try {
            const response = await fetch('/api/collections', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    collectionName,
                    userId: user.userId,
                }),
            })

            const data = await response.json()
            if (!response.ok)
                throw new Error(data.error || 'Failed to create collection.')

            const { collectionId } = data
            // Update the redirect URL to include collectionId in the path
            router.push(`/input_page/${collectionId}`)
        } catch (err) {
            console.error('Error creating collection:', err)
            setError(err.message || 'Failed to create collection.')
        }
    }

    return (
        <Box sx={{ padding: 4 }}>
            <UIMenu />
            <Box
                component="form"
                onSubmit={handleSubmit}
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 4,
                    padding: 4,
                    marginTop: 8,
                    maxWidth: 600,
                    margin: '0 auto',
                }}
            >
                <Typography variant="h4" align="center" className="page-title">
                    Create New Collection
                </Typography>

                {userLoading && (
                    <Typography variant="body1">
                        Loading user information...
                    </Typography>
                )}

                {userError && (
                    <Typography variant="body1" color="error">
                        {userError.message ||
                            'Failed to fetch user information.'}
                    </Typography>
                )}

                <TextField
                    label="Collection Name"
                    variant="outlined"
                    value={collectionName}
                    onChange={(e) => setCollectionName(e.target.value)}
                    required
                    fullWidth
                />

                {error && (
                    <Typography variant="body1" color="error">
                        {error}
                    </Typography>
                )}

                <Button
                    variant="contained"
                    type="submit"
                    className="button"
                    disabled={userLoading}
                >
                    Create Collection
                </Button>
            </Box>
        </Box>
    )
}
