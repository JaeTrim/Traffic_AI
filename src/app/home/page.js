'use client'

import React, { useState, useEffect } from 'react'
import {
    Box,
    Paper,
    TableContainer,
    Table,
    TableHead,
    TableBody,
    TableRow,
    TableCell,
    Typography,
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
} from '@mui/material'
import { useRouter } from 'next/navigation'
import UIMenu from '../components/UIMenu' 

export default function Collections() {
    const [collections, setCollections] = useState([])
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [openDialog, setOpenDialog] = useState(false)
    const [selectedCollectionId, setSelectedCollectionId] = useState(null)
    const router = useRouter()

    useEffect(() => {
        const fetchUserAndCollections = async () => {
            try {
                const userRes = await fetch('/api/auth/user', {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                })

                if (!userRes.ok) throw new Error('User not authenticated. Please log in.')

                const userData = await userRes.json()
                setUser({ userId: userData.userId, username: userData.username })

                const collectionsRes = await fetch(`/api/collections?userId=${userData.userId}`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                })

                if (!collectionsRes.ok) throw new Error('Failed to fetch collections.')

                const collectionsData = await collectionsRes.json()
                const processedCollections = collectionsData.map((collection) => ({
                    id: collection._id,
                    collectionName: collection.collectionName,
                    createdAt: collection.createdAt,
                    numberOfPredictions: collection.predictions.length,
                }))

                setCollections(processedCollections)
            } catch (err) {
                console.error('Error:', err)
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }

        fetchUserAndCollections()
    }, [])

    const handleView = (collectionId) => {
        router.push(`/reports_page/${collectionId}`)
    }

    const handleDeleteClick = (collectionId) => {
        setSelectedCollectionId(collectionId)
        setOpenDialog(true)
    }

    const handleConfirmDelete = async () => {
        try {
            // Assume delete API call
            const deleteRes = await fetch(`/api/collections/${selectedCollectionId}`, {
                method: 'DELETE',
            })

            if (deleteRes.ok) {
                setCollections((prev) =>
                    prev.filter((collection) => collection.id !== selectedCollectionId)
                )
            } else {
                console.error('Failed to delete collection')
            }
        } catch (error) {
            console.error('Error during deletion:', error)
        } finally {
            setOpenDialog(false)
            setSelectedCollectionId(null)
        }
    }

    const handleCloseDialog = () => {
        setOpenDialog(false)
        setSelectedCollectionId(null)
    }

    return (
        <Box sx={{ padding: 4 }}>
            <UIMenu />
            <Box sx={{ marginTop: 10 }}>
                <Typography variant="h4" align="left" gutterBottom>
                    Your Collections
                </Typography>

                {loading && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                        <CircularProgress />
                    </Box>
                )}

                {error && (
                    <Typography variant="body1" color="error" align="center">
                        {error}
                    </Typography>
                )}

                {!loading && !error && (
                    <>
                        {collections.length === 0 ? (
                            <Typography variant="body1" align="center" sx={{ mt: 4 }}>
                                You have no collections. Start by creating a new one!
                            </Typography>
                        ) : (
                            <Paper sx={{ marginTop: 2 }}>
                                <TableContainer>
                                    <Table>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Actions</TableCell>
                                                <TableCell>Created At</TableCell>
                                                <TableCell>Collection Name</TableCell>
                                                <TableCell>Number of Predictions</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {collections.map((collection) => (
                                                <TableRow key={collection.id}>
                                                    <TableCell>
                                                        <Button
                                                            variant="contained"
                                                            color="primary"
                                                            onClick={() => handleView(collection.id)}
                                                        >
                                                            View
                                                        </Button>
                                                        <Button
                                                            variant="contained"
                                                            color="primary"
                                                            sx={{ ml: 1 }}
                                                            onClick={() => handleDeleteClick(collection.id)}
                                                        >
                                                            Delete
                                                        </Button>
                                                    </TableCell>
                                                    <TableCell>
                                                        {new Date(collection.createdAt).toLocaleString()}
                                                    </TableCell>
                                                    <TableCell>{collection.collectionName}</TableCell>
                                                    <TableCell>{collection.numberOfPredictions}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Paper>
                        )}
                    </>
                )}

                <Box sx={{ display: 'flex', justifyContent: 'center', marginTop: 4 }}>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={() => router.push('/newcollection')}
                    >
                        Add New Collection
                    </Button>
                </Box>
            </Box>

            {/* Confirmation Dialog */}
            <Dialog open={openDialog} onClose={handleCloseDialog}>
                <DialogTitle>Confirm Deletion</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete this collection? This action cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog} color="primary">
                        Cancel
                    </Button>
                    <Button onClick={handleConfirmDelete} color="primary" variant="contained">
                        Confirm
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    )
}
