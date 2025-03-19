// src/app/input_page/[collectionId]/page.js

'use client'

import React, { useState, useEffect } from 'react'
import {
    Box,
    FormControl,
    MenuItem,
    InputLabel,
    Select,
    Button,
    TextField,
    Typography,
    FormControlLabel,
    Checkbox,
    CircularProgress,
} from '@mui/material'
import { useRouter, useParams } from 'next/navigation'
import UIMenu from '../../components/UIMenu' // Adjust the import path as needed

export default function InputPage() {
    const router = useRouter()
    const { collectionId } = useParams()

    const [collectionName, setCollectionName] = useState('')
    const [inputFields, setInputFields] = useState({})
    const [file, setFile] = useState(null)
    const [inputType, setInputType] = useState('csv')
    const [prediction, setPrediction] = useState(null)
    const [model, setModel] = useState('default')
    const [models, setModels] = useState([])
    const [modelInputs, setModelInputs] = useState([])
    const [logTransform, setLogTransform] = useState(false) // Track log transform option
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(true)

    // New state variables for user data
    const [userId, setUserId] = useState(null)
    const [userLoading, setUserLoading] = useState(true)

    useEffect(() => {
        // Fetch user data to get userId
        const fetchUserData = async () => {
            try {
                const res = await fetch('/api/auth/user', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                })

                if (!res.ok) {
                    throw new Error('Failed to fetch user data.')
                }

                const data = await res.json()
                setUserId(data.userId)
            } catch (err) {
                console.error('Error fetching user data:', err)
                setError(err.message || 'Failed to fetch user data.')
            } finally {
                setUserLoading(false)
            }
        }

        fetchUserData()
    }, [])

    useEffect(() => {
        // Fetch collection details to get collectionName
        const fetchCollectionDetails = async () => {
            try {
                const res = await fetch(`/api/collections/${collectionId}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                })

                if (!res.ok) {
                    const errorData = await res.json()
                    throw new Error(
                        errorData.error || 'Failed to fetch collection details.'
                    )
                }

                const data = await res.json()
                setCollectionName(data.collectionName)
            } catch (err) {
                console.error('Error fetching collection details:', err)
                setError(err.message || 'Failed to fetch collection details.')
            } finally {
                setLoading(false)
            }
        }

        if (collectionId) {
            fetchCollectionDetails()
        }
    }, [collectionId])

    useEffect(() => {
        const fetchModels = async () => {
            try {
                const res = await fetch('/api/models', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                })
                const data = await res.json()
                if (data && Array.isArray(data)) {
                    setModels(data)
                    setModel(data[0]?._id || 'default') // Default model if available
                }
            } catch (error) {
                console.error('Error fetching models:', error)
            }
        }

        fetchModels()
    }, [])

    const handleModelChange = async (e) => {
        const selectedModel = e.target.value
        setModel(selectedModel)

        // Fetch dynamic fields for the selected model
        try {
            const res = await fetch(`/api/models/${selectedModel}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
            })
            const data = await res.json()

            if (data && Array.isArray(data.inputFields)) {
                setModelInputs(data.inputFields)
            } else {
                setModelInputs([])
            }
        } catch (err) {
            console.error(
                `Error fetching fields for model ${selectedModel}:`,
                err
            )
            setModelInputs([])
        }
    }

    const handleInputChange = (name, value) => {
        setInputFields((prev) => ({
            ...prev,
            [name]: value,
        }))
    }

    const handleFileChange = (e) => {
        setFile(e.target.files[0])
    }

    const handleLogTransformChange = (e) => {
        setLogTransform(e.target.checked) // Update log transform value
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        // Validation
        if (!model.trim()) {
            setError('Model selection is required.')
            return
        }

        if (inputType === 'manual' && modelInputs.length > 0) {
            const hasEmptyInputs = modelInputs.some(
                (input) => !inputFields[input]?.toString().trim()
            )
            if (hasEmptyInputs) {
                setError('All input fields must be filled.')
                return
            }
        }

        if (inputType === 'csv' && !file) {
            setError('CSV file is required.')
            return
        }

        if (userLoading) {
            setError('User information is still loading.')
            return
        }

        if (!userId) {
            setError('User not authenticated.')
            return
        }

        setError('')
        setLoading(true)

        try {
            // Retrieve the JWT token from cookies
            const token = getCookie('token') // Implement getCookie to retrieve the token from cookies

            if (!token) {
                throw new Error('User not authenticated. Please log in.')
            }

            let response

            if (inputType === 'csv') {
                // Prepare FormData for CSV submission
                const formData = new FormData()
                formData.append('collectionId', collectionId)
                formData.append('modelId', model)
                formData.append('csv', file)
                formData.append('logTransform', logTransform.toString())

                // Send POST request to /api/predict/csv
                response = await fetch('/api/predict/csv', {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    body: formData,
                })
            } else if (inputType === 'manual') {
                // Convert inputFields values to numbers
                const numericInputFields = {}
                for (const key in inputFields) {
                    numericInputFields[key] = parseFloat(inputFields[key])
                    if (isNaN(numericInputFields[key])) {
                        setError(`Input "${key}" must be a number.`)
                        setLoading(false)
                        return
                    }
                }

                // Prepare JSON payload for Manual submission
                const payload = {
                    collectionId,
                    userId, // Include userId in the payload
                    modelId: model,
                    inputs: numericInputFields, // Use numeric inputs
                    logTransform, // Ensure this is a boolean
                }

                // Send POST request to /api/predict/single
                response = await fetch('/api/predict/single', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(payload),
                })
            } else {
                throw new Error('Invalid input type selected.')
            }

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Failed to add prediction.')
            }

            const data = await response.json()
            console.log('Prediction added successfully:', data)

            // Optionally, reset the form or navigate back
            if (inputType === 'manual') {
                setInputFields({})
            }

            // Reset file if CSV
            if (inputType === 'csv') {
                setFile(null)
            }

            // Update the prediction state with the prediction data
            setPrediction(data.prediction)

            // Optionally, redirect back to Reports Page
            router.push(`/reports_page/${collectionId}`)
        } catch (err) {
            console.error('Error adding prediction:', err)
            setError(err.message || 'Failed to add prediction.')
        } finally {
            setLoading(false)
        }
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
                {/* Display Collection Name */}
                {loading ? (
                    <CircularProgress />
                ) : error ? (
                    <Typography variant="body1" color="error">
                        {error}
                    </Typography>
                ) : (
                    <Typography variant="h5" sx={{ marginBottom: 2 }}>
                        Collection: {collectionName}
                    </Typography>
                )}

                {/* Choose Model Dropdown */}
                <FormControl fullWidth sx={{ maxWidth: 400, marginTop: 4 }}>
                    <InputLabel id="model-label">Choose Model</InputLabel>
                    <Select
                        labelId="model-label"
                        value={model}
                        label="Choose Model"
                        onChange={handleModelChange}
                        required
                    >
                        {models.map((modelItem) => (
                            <MenuItem key={modelItem._id} value={modelItem._id}>
                                {modelItem.name}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                {/* Input Type Dropdown */}
                <FormControl fullWidth sx={{ maxWidth: 400, marginTop: 4 }}>
                    <InputLabel id="input-type-label">Input Type</InputLabel>
                    <Select
                        labelId="input-type-label"
                        value={inputType}
                        label="Input Type"
                        onChange={(e) => setInputType(e.target.value)}
                    >
                        <MenuItem value="manual">Manual Input</MenuItem>
                        <MenuItem value="csv">CSV File Upload</MenuItem>
                    </Select>
                </FormControl>

                {inputType === 'manual' ? (
                    <>
                        {/* Render dynamic input fields */}
                        {modelInputs.length > 0 ? (
                            <>
                                {modelInputs.map((input, index) => (
                                    <Box
                                        key={index}
                                        sx={{
                                            display: 'flex',
                                            gap: 4,
                                            marginTop: 4,
                                        }}
                                    >
                                        <Typography>{input}</Typography>
                                        <TextField
                                            label={input}
                                            variant="outlined"
                                            type="number" // Enforce numeric input
                                            onChange={(e) =>
                                                handleInputChange(
                                                    input,
                                                    e.target.value
                                                )
                                            }
                                            sx={{ maxWidth: 180 }}
                                            required
                                        />
                                    </Box>
                                ))}

                                {/* Log Transform Checkbox for Manual Input */}
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={logTransform}
                                            onChange={handleLogTransformChange}
                                            name="logTransform"
                                        />
                                    }
                                    label="Apply Log Transform"
                                    sx={{ marginTop: 2 }}
                                />
                            </>
                        ) : (
                            <Typography sx={{ marginTop: 4 }}>
                                No inputs available for the selected model.
                            </Typography>
                        )}
                    </>
                ) : (
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 2,
                            alignItems: 'center',
                            marginTop: 4,
                            maxWidth: 400,
                        }}
                    >
                        <TextField
                            label="Upload CSV"
                            variant="outlined"
                            type="file"
                            onChange={handleFileChange}
                            InputLabelProps={{ shrink: true }}
                            fullWidth
                            required
                        />
                        {/* Log Transform Checkbox for CSV Upload */}
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={logTransform}
                                    onChange={handleLogTransformChange}
                                    name="logTransform"
                                />
                            }
                            label="Apply Log Transform"
                        />
                    </Box>
                )}

                {/* Display Error */}
                {error && (
                    <Typography variant="body1" color="error">
                        {error}
                    </Typography>
                )}

                {/* Submit Button */}
                <Button
                    variant="contained"
                    type="submit"
                    sx={{ marginTop: 4, maxWidth: 240 }}
                    disabled={loading || userLoading}
                >
                    {loading ? 'Submitting...' : 'Submit'}
                </Button>

                {/* Display Prediction Result */}
                {prediction !== null && (
                    <Box sx={{ marginTop: 2 }}>
                        {Array.isArray(prediction) ? (
                            <>
                                <Typography variant="h6">
                                    Predicted Results:
                                </Typography>
                                {prediction.map((pred, index) => (
                                    <Typography key={index}>{pred}</Typography>
                                ))}
                            </>
                        ) : typeof prediction === 'object' ? (
                            <>
                                <Typography variant="h6">
                                    Prediction Result:
                                </Typography>
                                <Typography>{prediction.result}</Typography>
                            </>
                        ) : (
                            <Typography variant="h6">
                                Prediction: {prediction}
                            </Typography>
                        )}
                    </Box>
                )}
            </Box>
        </Box>
    )
}
