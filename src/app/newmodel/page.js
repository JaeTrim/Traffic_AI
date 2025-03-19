// src/app/newmodel/page.js

'use client'

import React, { useState } from 'react'
import { Box, Typography, Button, TextField, IconButton } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import RemoveIcon from '@mui/icons-material/Remove'
import { useRouter } from 'next/navigation'
import UIMenu from '../components/UIMenu' // Adjust the import path as needed

export default function NewModelPage() {
    const [modelName, setModelName] = useState('')
    const [inputs, setInputs] = useState(['']) // Initialize with one input field
    const [modelFile, setModelFile] = useState(null)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    // Handle changes in input fields
    const handleInputChange = (index, value) => {
        const newInputs = [...inputs]
        newInputs[index] = value
        setInputs(newInputs)
    }

    // Add a new input field
    const handleAddInput = () => {
        setInputs([...inputs, ''])
    }

    // Remove an input field
    const handleRemoveInput = (index) => {
        if (inputs.length === 1) return // Prevent removing the last input field
        const newInputs = inputs.filter((_, i) => i !== index)
        setInputs(newInputs)
    }

    // Handle file selection
    const handleFileChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            setModelFile(e.target.files[0])
        }
    }

    // Handle form submission
    const handleSubmit = async () => {
        // Validation
        if (!modelName.trim()) {
            setError('Model name is required.')
            return
        }

        if (inputs.some((input) => !input.trim())) {
            setError('All input fields must be filled.')
            return
        }

        let extension = modelFile.name.split(".")[1]

        if (extension !== "keras" && extension !== "h5") {
            setError('Invalid model file.')
            return
        }

        if (!modelFile) {
            setError('Model file is required.')
            return
        }

        setError('')
        setLoading(true)

        try {
            // Fetch user info to get userId
            const userRes = await fetch('/api/auth/user', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include', // Include cookies if needed
            })

            if (!userRes.ok) {
                throw new Error('User not authenticated. Please log in.')
            }

            const userData = await userRes.json()
            const userId = userData.userId

            // Prepare form data
            const formData = new FormData()
            formData.append('name', modelName)
            formData.append('inputFields', JSON.stringify(inputs)) // Send as JSON array
            formData.append('userId', userId)
            formData.append('modelFile', modelFile)

            // Send POST request to the backend API
            const response = await fetch('/api/models', {
                method: 'POST',
                body: formData,
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Failed to upload model.')
            }

            const responseData = await response.json()
            console.log('Model uploaded successfully:', responseData)

            // Redirect to manage models page
            router.push('/managemodel')
        } catch (err) {
            console.error('Error uploading model:', err)
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Box sx={{ padding: 4 }}>
            <UIMenu />
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 4,
                    padding: 4,
                    marginTop: 10,
                }}
            >
                <Typography
                    variant="h4"
                    component="h1"
                    sx={{ marginBottom: 4 }}
                >
                    New Model
                </Typography>

                {/* New Text Field for Model Name */}
                <Box sx={{ width: '100%', maxWidth: 400 }}>
                    <Typography variant="subtitle1" sx={{ marginBottom: 1 }}>
                        Model Name
                    </Typography>
                    <TextField
                        variant="outlined"
                        fullWidth
                        value={modelName}
                        onChange={(e) => setModelName(e.target.value)}
                        placeholder="Enter model name"
                        InputLabelProps={{ shrink: true }}
                    />
                </Box>

                {/* Dynamic Input Fields */}
                <Box sx={{ width: '100%', maxWidth: 400 }}>
                    <Typography variant="subtitle1" sx={{ marginBottom: 1 }}>
                        Input Fields (Ordered)
                    </Typography>
                    {inputs.map((input, index) => (
                        <Box
                            key={index}
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                marginBottom: 2,
                            }}
                        >
                            <TextField
                                variant="outlined"
                                fullWidth
                                value={input}
                                onChange={(e) =>
                                    handleInputChange(index, e.target.value)
                                }
                                placeholder={`Input ${index + 1}`}
                                InputLabelProps={{ shrink: true }}
                            />
                            <IconButton
                                aria-label="remove input"
                                onClick={() => handleRemoveInput(index)}
                                disabled={inputs.length === 1}
                            >
                                <RemoveIcon />
                            </IconButton>
                        </Box>
                    ))}
                    <Button
                        variant="outlined"
                        startIcon={<AddIcon />}
                        onClick={handleAddInput}
                    >
                        Add Input
                    </Button>
                </Box>

                {/* File Upload */}
                <Box sx={{ width: '100%', maxWidth: 400, marginTop: 4 }}>
                    <Typography variant="subtitle1" sx={{ marginBottom: 1 }}>
                        Upload Model File (only .keras and .h5 files accepted)
                    </Typography>
                    <Button variant="contained" component="label">
                        Choose File
                        <input type="file" hidden onChange={handleFileChange} />
                    </Button>
                    {modelFile && (
                        <Typography variant="body2" sx={{ marginTop: 1 }}>
                            {modelFile.name}
                        </Typography>
                    )}
                </Box>

                {/* Display Error */}
                {error && (
                    <Typography
                        variant="body1"
                        color="error"
                        align="center"
                        sx={{ marginTop: 2 }}
                    >
                        {error}
                    </Typography>
                )}

                {/* Submit Button */}
                <Button
                    variant="contained"
                    onClick={handleSubmit}
                    sx={{ marginTop: 4, maxWidth: 240 }}
                    disabled={loading}
                >
                    {loading ? 'Submitting...' : 'Submit'}
                </Button>
            </Box>
        </Box>
    )
}
