'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import MenuIcon from '@mui/icons-material/Menu'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import AddCircleIcon from '@mui/icons-material/AddCircle'
import BarChartIcon from '@mui/icons-material/BarChart'
import AssessmentIcon from '@mui/icons-material/Assessment'
import EditIcon from '@mui/icons-material/Edit'

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
    AppBar,
    Toolbar,
    IconButton,
    Menu,
    MenuItem,
    Container,
    Card,
    CardContent,
    Alert,
    Chip,
    Divider,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    TextField,
} from '@mui/material'

export default function ReportsPage() {
    const router = useRouter()
    const { collectionId } = useParams()

    const [collection, setCollection] = useState(null)
    const [groupedPredictions, setGroupedPredictions] = useState({})
    const [modelsInfo, setModelsInfo] = useState({})
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    const [user, setUser] = useState(null)
    const [userLoading, setUserLoading] = useState(true)

    const [userMenuAnchor, setUserMenuAnchor] = useState(null)
    const [mainMenuAnchor, setMainMenuAnchor] = useState(null)

    const [editDialogOpen, setEditDialogOpen] = useState(false)
    const [newCollectionName, setNewCollectionName] = useState('')

    useEffect(() => {
        const userData = async () => {
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
                setUser({
                    userId: data.userId,
                    username: data.username
                })
            } 
            catch (err) {
                console.error('Error fetching user data:', err)
            } 
            finally {
                setUserLoading(false)
            }
        }
        userData()
    }, [])

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
                setNewCollectionName(data.collectionName)
            } 
            catch (err) {
                console.error('Error fetching collection:', err)
                setError(err.message || 'Failed to fetch collection')
            } 
            finally {
                setLoading(false)
            }
        }

        fetchCollection()
    }, [collectionId])

    useEffect(() => {
        const groupPredictionsByModel = async () => {
            if (!collection || !collection.predictions) {
                return
            }
            const groups = {}
            const tempInfo = {}
            const ids = [
                ...new Set(collection.predictions.map((p) => p.modelId)),
            ]

            for (const modelId of ids) {
                try {
                    const response = await fetch(`/api/models/${modelId}`, {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        credentials: 'include',
                    })

                    if (response.ok) {
                        const data = await response.json()
                        tempInfo[modelId] = data
                    } 
                    else {
                        tempInfo[modelId] = { name: modelId }
                    }
                } catch (err) {
                    console.error(`Error fetching model info for modelId ${modelId}:`, err)
                    tempInfo[modelId] = { name: modelId }
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
            setModelsInfo(tempInfo)
        }
        groupPredictionsByModel()
    }, [collection])

    const userMenuOpen = (event) => {
        setUserMenuAnchor(event.currentTarget)
    }

    const userMenuClose = () => {
        setUserMenuAnchor(null)
    }

    const mainMenuOpen = (event) => {
        setMainMenuAnchor(event.currentTarget)
    }

    const mainMenuClose = () => {
        setMainMenuAnchor(null)
    }

    const logout = () => {
        document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
        router.push('/login')
        userMenuClose()
    }

    const goHome = () => {
        router.push('/')
        mainMenuClose()
    }

    const goAddModel = () => {
        router.push('/newmodel')
        mainMenuClose()
    }

    const goModelsList = () => {
        router.push('/managemodel')
        mainMenuClose()
    }

    const addPrediction = () => {
        router.push(`/input_page/${collectionId}`)
    }

    const editClick = () => {
        setNewCollectionName(collection.collectionName);
        setEditDialogOpen(true);
    }

    const closeDialog = () => {
        setEditDialogOpen(false);
    }

    const nameChange
 = (e) => {
        setNewCollectionName(e.target.value);
    }

    const handleSaveCollectionName = async () => {
        if (!newCollectionName.trim()) {
            return;
        }
        
        try {
            const response = await fetch(`/api/collections/${collectionId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    collectionName: newCollectionName
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to update collection name');
            }

            // Update the local state
            setCollection({
                ...collection,
                collectionName: newCollectionName
            });
            
            setEditDialogOpen(false);
        } catch (err) {
            console.error('Error updating collection name:', err);
            setError(err.message || 'Failed to update collection name');
        }
    }

    const formatValue = (value) => {
        if (typeof value === 'number') {
            // Format number with comma separators and up to 2 decimal places
            return value.toLocaleString(undefined, {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2
            })
        }
        return value !== undefined ? value : '-'
    }

    return (
        <Box sx={{ 
            minHeight: '100vh',
            backgroundColor: '#f5f7fa',
        }}>
            {/*app bar that matches home page*/}
            <AppBar position="fixed" elevation={3} sx={{ backgroundColor: '#861F41' }}>
                <Toolbar>
                    <IconButton 
                        edge="start" 
                        color="inherit" 
                        aria-label="menu" 
                        sx={{ mr: 2 }}
                        onClick={mainMenuOpen}
                    >
                        <MenuIcon />
                    </IconButton>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
                        Crash Rate Prediction Dashboard
                    </Typography>
                    <Button 
                        variant="contained" 
                        color="secondary" 
                        onClick={userMenuOpen}
                        sx={{ 
                            borderRadius: 2,
                            backgroundColor: 'white', 
                            color: 'black',
                            '&:hover': {
                                backgroundColor: '#e0e0e0',
                            },
                            textTransform: 'none',
                            fontWeight: 500,
                        }}
                    >
                        {user ? user.username : 'User'}
                    </Button>
                    
                    {/*user menu*/}
                    <Menu
                        anchorEl={userMenuAnchor}
                        open={Boolean(userMenuAnchor)}
                        onClose={userMenuClose}
                        sx={{ mt: 1 }}
                    >
                        <MenuItem onClick={logout}>Logout</MenuItem>
                    </Menu>
                    
                    {/* Main Menu */}
                    <Menu
                        anchorEl={mainMenuAnchor}
                        open={Boolean(mainMenuAnchor)}
                        onClose={mainMenuClose}
                        sx={{ mt: 1 }}
                    >
                        <MenuItem onClick={goHome}>Home</MenuItem>
                        <MenuItem onClick={goAddModel}>Add New Model</MenuItem>
                        <MenuItem onClick={goModelsList}>View All Models</MenuItem>
                    </Menu>
                </Toolbar>
            </AppBar>

            <Container maxWidth="lg" sx={{ pt: 10, pb: 6 }}>
                <Card 
                    elevation={3} 
                    sx={{ 
                        borderRadius: 2,
                        overflow: 'visible',
                        position: 'relative',
                        '&::before': {
                            content: '""',
                            display: 'block',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '8px',
                            backgroundColor: '#861F41', //accent bar color
                            borderTopLeftRadius: '8px',
                            borderTopRightRadius: '8px',
                        },
                        mb: 3
                    }}
                >
                    <CardContent sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <IconButton 
                                    onClick={goHome}
                                    sx={{ mr: 2 }}
                                    aria-label="go back to home"
                                >
                                    <ArrowBackIcon />
                                </IconButton>
                                <Typography variant="h5" component="h1" sx={{ 
                                    fontWeight: 'bold', 
                                    display: 'flex', 
                                    alignItems: 'center',
                                    color: '#861F41'
                                }}>
                                    <AssessmentIcon sx={{ mr: 1 }} /> Collection Reports
                                </Typography>
                            </Box>
                            
                            <Button
                                variant="contained"
                                startIcon={<AddCircleIcon />}
                                onClick={addPrediction}
                                sx={{ 
                                    borderRadius: 2,
                                    backgroundColor: '#861F41', //add prediciton button color
                                    '&:hover': {
                                        backgroundColor: '#861F41',
                                    },
                                    textTransform: 'none',
                                }}
                            >
                                Add Prediction
                            </Button>
                        </Box>
                        
                        {loading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', my: 8 }}>
                                <CircularProgress />
                            </Box>
                        ) : error ? (
                            <Alert severity="error" sx={{ my: 2 }}>
                                {error}
                            </Alert>
                        ) : collection ? (
                            <Box>
                                <Box sx={{ 
                                    mb: 4, 
                                    p: 3, 
                                    backgroundColor: '#f8f9fa', 
                                    borderRadius: 2,
                                    border: '1px solid #e0e0e0' 
                                }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                                        <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#861F41' }}>
                                            {collection.collectionName}
                                        </Typography>
                                        <Button
                                            variant="outlined"
                                            startIcon={<EditIcon />}
                                            onClick={editClick}
                                            size="small"
                                            sx={{ 
                                                borderRadius: 2,
                                                textTransform: 'none',
                                                borderColor: '#C95B0C',
                                                color: '#C95B0C',
                                                '&:hover': {
                                                    backgroundColor: '#e8eaf6',
                                                    borderColor: '#C95B0C',
                                                },
                                            }}
                                        >
                                            Edit Name
                                        </Button>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <Typography variant="body1">
                                            Total Predictions: 
                                        </Typography>
                                        <Chip 
                                            label={collection.predictions.length} 
                                            color="#861F41" 
                                            size="small" 
                                            sx={{ fontWeight: 'bold' }}
                                        />
                                    </Box>
                                </Box>

                                {Object.keys(groupedPredictions).length === 0 ? (
                                    <Box sx={{ textAlign: 'center', my: 6, p: 4, backgroundColor: '#f5f5f5', borderRadius: 2 }}>
                                        <BarChartIcon sx={{ fontSize: 48, color: '#9e9e9e', mb: 2 }} />
                                        <Typography variant="h6" gutterBottom>
                                            No predictions found
                                        </Typography>
                                        <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
                                            Add a prediction to get started
                                        </Typography>
                                        <Button
                                            variant="contained"
                                            startIcon={<AddCircleIcon />}
                                            onClick={addPrediction}
                                            sx={{ 
                                                borderRadius: 2,
                                                backgroundColor: '#861F41', //add prediction button
                                                '&:hover': {
                                                    backgroundColor: '#861F41',
                                                },
                                                textTransform: 'none',
                                            }}
                                        >
                                            Add Prediction
                                        </Button>
                                    </Box>
                                ) : (
                                    Object.keys(groupedPredictions).map((modelId) => {
                                        const predictions = groupedPredictions[modelId]
                                        const modelName = modelsInfo[modelId]?.name || modelId

                                        const inputKeysSet = new Set()
                                        predictions.forEach((prediction) => {
                                            prediction.inputs.forEach((input) => {
                                                inputKeysSet.add(input.key)
                                            })
                                        })
                                        const inputKeys = Array.from(inputKeysSet)

                                        return (
                                            <Box key={modelId} sx={{ mt: 4, mb: 6 }}>
                                                <Box sx={{ 
                                                    p: 2, 
                                                    backgroundColor: '#e8eaf6', 
                                                    borderRadius: '8px 8px 0 0',
                                                    border: '1px solid #c5cae9',
                                                    borderBottom: 'none'
                                                }}>
                                                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1a237e' }}>
                                                        Model: {modelName}
                                                    </Typography>
                                                </Box>
                                                <TableContainer component={Paper} elevation={2} sx={{ borderRadius: '0 0 8px 8px', overflow: 'hidden' }}>
                                                    <Table sx={{ minWidth: 650 }}>
                                                        <TableHead>
                                                            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                                                                {inputKeys.map((key) => (
                                                                    <TableCell key={key} sx={{ fontWeight: 'bold' }}>
                                                                        {key}
                                                                    </TableCell>
                                                                ))}
                                                                <TableCell sx={{ fontWeight: 'bold' }}>
                                                                    Result
                                                                </TableCell>
                                                                <TableCell sx={{ fontWeight: 'bold' }}>
                                                                    Source Type
                                                                </TableCell>
                                                            </TableRow>
                                                        </TableHead>
                                                        <TableBody>
                                                            {predictions.map((prediction, index) => {
                                                                const inputValues = {}
                                                                prediction.inputs.forEach((input) => {
                                                                    inputValues[input.key] = input.value
                                                                })

                                                                return (
                                                                    <TableRow
                                                                        key={prediction._id || index}
                                                                        sx={{ 
                                                                            '&:nth-of-type(odd)': {
                                                                                backgroundColor: '#f8f9fa',
                                                                            },
                                                                            '&:hover': {
                                                                                backgroundColor: '#e8eaf6',
                                                                            }
                                                                        }}
                                                                    >
                                                                        {inputKeys.map((key) => (
                                                                            <TableCell key={key}>
                                                                                {formatValue(inputValues[key])}
                                                                            </TableCell>
                                                                        ))}
                                                                        <TableCell sx={{ fontWeight: 'bold' }}>
                                                                            {formatValue(prediction.result)}
                                                                        </TableCell>
                                                                        <TableCell>
                                                                            <Chip 
                                                                                label={prediction.sourceType || "Manual"} 
                                                                                size="small"
                                                                                color={prediction.sourceType === 'csv' ? 'secondary' : 'default'}
                                                                                variant="outlined"
                                                                            />
                                                                        </TableCell>
                                                                    </TableRow>
                                                                )
                                                            })}
                                                        </TableBody>
                                                    </Table>
                                                </TableContainer>
                                            </Box>
                                        )
                                    })
                                )}
                            </Box>
                        ) : (
                            <Alert severity="info" sx={{ my: 2 }}>
                                No collection data found.
                            </Alert>
                        )}
                    </CardContent>
                </Card>
            </Container>

            {/* Edit Collection Name Dialog */}
            <Dialog open={editDialogOpen} onClose={closeDialog}>
                <DialogTitle sx={{ color: '#1a237e', fontWeight: 'bold' }}>
                    Edit Collection Name
                </DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Collection Name"
                        type="text"
                        fullWidth
                        variant="outlined"
                        value={newCollectionName}
                        onChange={nameChange
}
                        sx={{ mt: 1, minWidth: '300px' }}
                        InputProps={{
                            sx: { borderRadius: 1 }
                        }}
                    />
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3 }}>
                    <Button 
                        onClick={closeDialog}
                        sx={{ 
                            textTransform: 'none',
                            fontWeight: 500,
                            borderRadius: 2,
                        }}
                    >
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleSaveCollectionName} 
                        variant="contained"
                        sx={{ 
                            textTransform: 'none',
                            fontWeight: 500,
                            borderRadius: 2,
                            backgroundColor: '#1a237e',
                            '&:hover': {
                                backgroundColor: '#303f9f',
                            },
                        }}
                    >
                        Save
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    )
}