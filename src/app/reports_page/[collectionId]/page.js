// src/app/reports_page/[collectionId]/page.js

'use client'

import React, { useState, useEffect } from 'react'
import {
    Box,
    Typography,
    CircularProgress,
    TableContainer,
    Table,
    TableHead,
    TableBody,
    TableRow,
    TableCell,
    Paper,
    Button,
} from '@mui/material'
import { useRouter, useParams } from 'next/navigation'
import UIMenu from '../../components/UIMenu' // Adjust the import path as needed

export default function ReportsPage() {
    const router = useRouter()
    const { collectionId } = useParams()

    const [collection, setCollection] = useState(null)
    const [groupedPredictions, setGroupedPredictions] = useState({})
    const [modelsInfo, setModelsInfo] = useState({})
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    function handleRouter(route) {
        router.push(route) // Route to the desired page
        //setDrawerOpen(false); // Close the drawer after navigation
    }

    useEffect(() => {
        const fetchCollection = async () => {
            if (!collectionId) {
                setError('No collection ID provided.')
                setLoading(false)
                return
            }

            try {
                const response = await fetch(
                    `/api/collections/${collectionId}`,
                    {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        credentials: 'include',
                    }
                )

                if (!response.ok) {
                    const errorData = await response.json()
                    throw new Error(
                        errorData.error || 'Failed to fetch collection details.'
                    )
                }

                const data = await response.json()
                setCollection(data)
            } catch (err) {
                console.error('Error fetching collection:', err)
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }

        fetchCollection()
    }, [collectionId])

    useEffect(() => {
        const groupPredictionsByModel = async () => {
            if (!collection || !collection.predictions) return

            const groups = {}
            const modelsInfoTemp = {}

            const modelIds = [
                ...new Set(collection.predictions.map((p) => p.modelId)),
            ]

            for (const modelId of modelIds) {
                try {
                    const response = await fetch(`/api/models/${modelId}`, {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        credentials: 'include',
                    })

                    if (response.ok) {
                        const modelData = await response.json()
                        modelsInfoTemp[modelId] = modelData
                    } else {
                        modelsInfoTemp[modelId] = { name: modelId }
                    }
                } catch (err) {
                    console.error(
                        `Error fetching model info for modelId ${modelId}:`,
                        err
                    )
                    modelsInfoTemp[modelId] = { name: modelId }
                }
            }

            collection.predictions.forEach((prediction) => {
                const { modelId } = prediction
                if (!groups[modelId]) {
                    groups[modelId] = []
                }
                groups[modelId].push(prediction)
            })

            setGroupedPredictions(groups)
            setModelsInfo(modelsInfoTemp)
        }

        groupPredictionsByModel()
    }, [collection])

    const handleBack = () => {
        router.back()
    }

    // Handle "Add Prediction" button click
    const handleAddPrediction = () => {
        router.push(`/input_page/${collectionId}`)
    }

    return (
        <Box sx={{ padding: 4 }}>
            <UIMenu />
            <Box sx={{ marginTop: 10 }}>
                {/* Add Prediction Button */}
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        marginBottom: 2,
                    }}
                >
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleAddPrediction}
                    >
                        Add Prediction
                    </Button>
                </Box>

                <Button
                    variant="outlined"
                    onClick={() => {
                        handleRouter('/home')
                    }}
                    sx={{ mb: 2 }}
                >
                    Back to Collections
                </Button>

                {loading && (
                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'center',
                            mt: 4,
                        }}
                    >
                        <CircularProgress />
                    </Box>
                )}

                {error && (
                    <Typography variant="body1" color="error" align="center">
                        {error}
                    </Typography>
                )}

                {!loading && !error && collection && (
                    <Box>
                        <Typography variant="h4" gutterBottom>
                            Collection: {collection.collectionName}
                        </Typography>
                        <Typography variant="subtitle1" gutterBottom>
                            Number of Predictions:{' '}
                            {collection.predictions.length}
                        </Typography>

                        {Object.keys(groupedPredictions).map((modelId) => {
                            const predictions = groupedPredictions[modelId]
                            const modelName =
                                modelsInfo[modelId]?.name || modelId

                            const inputKeysSet = new Set()
                            predictions.forEach((prediction) => {
                                prediction.inputs.forEach((input) => {
                                    inputKeysSet.add(input.key)
                                })
                            })
                            const inputKeys = Array.from(inputKeysSet)

                            return (
                                <Box key={modelId} sx={{ marginTop: 6 }}>
                                    <Typography variant="h5" gutterBottom>
                                        Model: {modelName}
                                    </Typography>
                                    <Paper>
                                        <TableContainer>
                                            <Table>
                                                <TableHead>
                                                    <TableRow>
                                                        {inputKeys.map(
                                                            (key) => (
                                                                <TableCell
                                                                    key={key}
                                                                >
                                                                    {key}
                                                                </TableCell>
                                                            )
                                                        )}
                                                        <TableCell>
                                                            Result
                                                        </TableCell>
                                                        <TableCell>
                                                            Source Type
                                                        </TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {predictions.map(
                                                        (prediction) => {
                                                            const inputValues =
                                                                {}
                                                            prediction.inputs.forEach(
                                                                (input) => {
                                                                    inputValues[
                                                                        input.key
                                                                    ] =
                                                                        input.value
                                                                }
                                                            )

                                                            return (
                                                                <TableRow
                                                                    key={
                                                                        prediction._id
                                                                    }
                                                                >
                                                                    {inputKeys.map(
                                                                        (
                                                                            key
                                                                        ) => (
                                                                            <TableCell
                                                                                key={
                                                                                    key
                                                                                }
                                                                            >
                                                                                {inputValues[
                                                                                    key
                                                                                ] !==
                                                                                undefined
                                                                                    ? inputValues[
                                                                                          key
                                                                                      ]
                                                                                    : '-'}
                                                                            </TableCell>
                                                                        )
                                                                    )}
                                                                    <TableCell>
                                                                        {
                                                                            prediction.result
                                                                        }
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        {
                                                                            prediction.sourceType
                                                                        }
                                                                    </TableCell>
                                                                </TableRow>
                                                            )
                                                        }
                                                    )}
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                    </Paper>
                                </Box>
                            )
                        })}
                    </Box>
                )}
            </Box>
        </Box>
    )
}
