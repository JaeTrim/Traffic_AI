// src/app/models/page.js

'use client'

import React, { useState, useEffect } from 'react'
import {
    Box,
    Typography,
    Button,
    IconButton,
    Table,
    TableBody,
    TableContainer,
    TableHead,
    TableRow,
    TableCell,
    Paper,
    CircularProgress,
    Snackbar,
    Alert,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
} from '@mui/material'
import { Delete as DeleteIcon } from '@mui/icons-material'
import UIMenu from '../components/UIMenu' // Adjust the import path as needed

export default function ManageModelPage() {
    const [models, setModels] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [snackbarOpen, setSnackbarOpen] = useState(false)
    const [snackbarMessage, setSnackbarMessage] = useState('')
    const [snackbarSeverity, setSnackbarSeverity] = useState('success')

    // State for the confirmation dialog
    const [dialogOpen, setDialogOpen] = useState(false)
    const [modelToDelete, setModelToDelete] = useState(null)

    useEffect(() => {
        // Fetch models from the backend API on component mount
        const fetchModels = async () => {
            try {
                const token = getCookie('token') // Retrieve the JWT token from cookies
                if (!token) {
                    throw new Error('User not authenticated. Please log in.')
                }

                const response = await fetch('/api/models', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                })

                if (!response.ok) {
                    const errorData = await response.json()
                    throw new Error(
                        errorData.error || 'Failed to fetch models.'
                    )
                }

                const data = await response.json()

                // Map backend models to frontend models
                const mappedModels = data.map((model) => ({
                    id: model._id, // Use '_id' from MongoDB as 'id'
                    name: model.name,
                    date: new Date(model.createdAt).toLocaleString(),
                }))

                setModels(mappedModels)
            } catch (err) {
                console.error('Error fetching models:', err)
                setError(err.message || 'Failed to fetch models.')
                setSnackbarMessage(err.message || 'Failed to fetch models.')
                setSnackbarSeverity('error')
                setSnackbarOpen(true)
            } finally {
                setLoading(false)
            }
        }

        fetchModels()
    }, [])

    const handleDeleteClick = (model) => {
        setModelToDelete(model)
        setDialogOpen(true)
    }

    const handleCloseDialog = () => {
        setDialogOpen(false)
        setModelToDelete(null)
    }

    const confirmDelete = async () => {
        if (!modelToDelete) return

        try {
            const token = getCookie('token') // Retrieve the JWT token from cookies
            if (!token) {
                throw new Error('User not authenticated. Please log in.')
            }

            const response = await fetch(
                `/api/models?modelId=${encodeURIComponent(modelToDelete.id)}`,
                {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                }
            )

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(
                    errorData.error || 'Failed to delete the model.'
                )
            }

            // Remove the model from the state
            setModels((prevModels) =>
                prevModels.filter((m) => m.id !== modelToDelete.id)
            )

            // Show success snackbar
            setSnackbarMessage('Model deleted successfully.')
            setSnackbarSeverity('success')
            setSnackbarOpen(true)
        } catch (err) {
            console.error('Error deleting model:', err)
            setError(err.message || 'Failed to delete the model.')
            setSnackbarMessage(err.message || 'Failed to delete the model.')
            setSnackbarSeverity('error')
            setSnackbarOpen(true)
        } finally {
            handleCloseDialog()
        }
    }

    const handleSnackbarClose = (event, reason) => {
        if (reason === 'clickaway') {
            return
        }
        setSnackbarOpen(false)
    }

    // Utility function to get cookie by name
    const getCookie = (name) => {
        if (typeof window === 'undefined') return null
        const value = `; ${document.cookie}`
        const parts = value.split(`; ${name}=`)
        if (parts.length === 2) return parts.pop().split(';').shift()
        return null
    }

    return (
        <Box sx={{ padding: 4 }}>
            <UIMenu /> {/* Navigation and AppBar */}
            <Box sx={{ marginTop: 10 }}>
                <Typography variant="h4" align="left">
                    Manage Models
                </Typography>

                {loading ? (
                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'center',
                            marginTop: 4,
                        }}
                    >
                        <CircularProgress />
                    </Box>
                ) : (
                    <>
                        <Paper sx={{ marginTop: 2 }}>
                            <TableContainer>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Name</TableCell>
                                            <TableCell>Date</TableCell>
                                            <TableCell align="center">
                                                Action
                                            </TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {models.length > 0 ? (
                                            models.map((model) => (
                                                <TableRow key={model.id}>
                                                    <TableCell>
                                                        {model.name}
                                                    </TableCell>
                                                    <TableCell>
                                                        {model.date}
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        <IconButton
                                                            color="error"
                                                            onClick={() =>
                                                                handleDeleteClick(
                                                                    model
                                                                )
                                                            }
                                                        >
                                                            <DeleteIcon />
                                                        </IconButton>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell
                                                    colSpan={3}
                                                    align="center"
                                                >
                                                    No models found.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Paper>
                    </>
                )}

                {/* Confirmation Dialog */}
                <Dialog
                    open={dialogOpen}
                    onClose={handleCloseDialog}
                    aria-labelledby="confirm-delete-dialog-title"
                    aria-describedby="confirm-delete-dialog-description"
                >
                    <DialogTitle id="confirm-delete-dialog-title">
                        Confirm Deletion
                    </DialogTitle>
                    <DialogContent>
                        <DialogContentText id="confirm-delete-dialog-description">
                            Are you sure you want to delete the model "
                            {modelToDelete?.name}"? This action cannot be
                            undone.
                        </DialogContentText>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseDialog} color="primary">
                            No
                        </Button>
                        <Button
                            onClick={confirmDelete}
                            color="error"
                            variant="contained"
                            autoFocus
                        >
                            Yes
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Snackbar for Notifications */}
                <Snackbar
                    open={snackbarOpen}
                    autoHideDuration={6000}
                    onClose={handleSnackbarClose}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                >
                    <Alert
                        onClose={handleSnackbarClose}
                        severity={snackbarSeverity}
                        sx={{ width: '100%' }}
                    >
                        {snackbarMessage}
                    </Alert>
                </Snackbar>
            </Box>
        </Box>
    )
}
