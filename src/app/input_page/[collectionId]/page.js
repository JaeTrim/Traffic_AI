
'use client'


//colors:
//maroon: 861F41
//orange: C95B0C

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import MenuIcon from '@mui/icons-material/Menu'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import BarChartIcon from '@mui/icons-material/BarChart'

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
    AppBar,
    Toolbar,
    IconButton,
    Menu,
    Container,
    Card,
    CardContent,
    Alert,
    Grid,
    Divider,
} from '@mui/material'

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
    const [logTransform, setLogTransform] = useState(false)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)

    const [user, setUser] = useState(null)
    const [userLoading, setUserLoading] = useState(true)

    const [userMenuAnchor, setUserMenuAnchor] = useState(null)
    const [mainMenuAnchor, setMainMenuAnchor] = useState(null)

    useEffect(() => {
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
                setUser({
                    userId: data.userId,
                    username: data.username
                })
            } 
            catch (err) {
                console.error('Error fetching user data:', err)
                setError(err.message || 'Failed to fetch user data.')
            } 
            finally {
                setUserLoading(false)
            }
        }

        fetchUserData()
    }, [])

    useEffect(() => {
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
            } 
            catch (err) {
                console.error('Error fetching collection details:', err)
                setError(err.message || 'Failed to fetch collection details.')
            } 
            finally {
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
                    setModel(data[0]?._id || 'default') 
                }
            } 
            catch (error) {
                console.error('Error fetching models:', error)
            }
        }

        fetchModels()
    }, [])

    const modelChange = async (e) => {
        const model = e.target.value
        setModel(model)

        try {
            const res = await fetch(`/api/models/${model}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
            })

            const data = await res.json()
            if (data && Array.isArray(data.inputFields)) {
                setModelInputs(data.inputFields)
            } 
            else {
                setModelInputs([])
            }
        } 
        catch (err) {
            console.error(`Error fetching fields for model ${model}:`, err)
            setModelInputs([])
        }
    }

    const inputChange = (name, value) => {
        setInputFields((prev) => ({
            ...prev,
            [name]: value,
        }))
    }

    const fileChange = (e) => {
        setFile(e.target.files[0])
    }

    const logTransformChange = (e) => {
        setLogTransform(e.target.checked)
    }

    const submit = async (e) => {
        e.preventDefault()
        if (!model.trim()) {
            setError('Model selection is required')
            return
        }
        if (inputType === 'manual' && modelInputs.length > 0) {
            const hasEmptyInputs = modelInputs.some(
                (input) => !inputFields[input]?.toString().trim()
            )
            if (hasEmptyInputs) {
                setError('Fill all input fields')
                return
            }
        }
        if (inputType === 'csv' && !file) { //checking for csv file
            setError('CSV file is required.')
            return
        }
        if (userLoading) { //checking user info loading
            setError('Loading user information')
            return
        }
        if (!user || !user.userId) {
            setError('User not authenticated')
            return
        }
        setError('')
        setSubmitting(true)

        try {
            const token = getCookie('token')
            if (!token) {
                throw new Error('User not authenticated. Please log in.')
            }
            let response
            if (inputType === 'csv') { //for submitting csv
                const formData = new FormData()
                formData.append('collectionId', collectionId)
                formData.append('modelId', model)
                formData.append('csv', file)
                formData.append('logTransform', logTransform.toString())

                response = await fetch('/api/predict/csv', {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    body: formData,
                })
            } 
            else if (inputType === 'manual') {
                const numericInputFields = {}
                for (const key in inputFields) {
                    numericInputFields[key] = parseFloat(inputFields[key])
                    if (isNaN(numericInputFields[key])) {
                        setError(`Input "${key}" must be a number.`)
                        setSubmitting(false)
                        return
                    }
                }

                const payload = { //json, manual submission
                    collectionId,
                    userId: user.userId, //userid in payload
                    modelId: model,
                    inputs: numericInputFields,
                    logTransform,
                }

                response = await fetch('/api/predict/single', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(payload),
                })
            } 
            else {
                throw new Error('Input type invalid')
            }

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Failed to add prediction')
            }

            const data = await response.json()
            console.log('Prediction added:', data)

            try {
                console.log("Creating log entry...");
                if (!user || !user.userId) {
                    const userResponse = await fetch('/api/auth/user', {
                        method: 'GET',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                    });
                    
                    if (!userResponse.ok) {
                        throw new Error('Failed to get user data for logging');
                    }
                    
                    const userData = await userResponse.json();
                    console.log("Retrieved user data for logging:", userData);
                    await entry(userData.userId, models.find(m => m._id === model)?.name || model);
                } 
                else {
                    await entry(user.userId, models.find(m => m._id === model)?.name || model);
                }
            } 
            catch (logError) {
                console.error('Error creating log entry:', logError);
            }

            if (inputType === 'manual') {
                setInputFields({})
            }
            if (inputType === 'csv') {
                setFile(null)
            }
            setPrediction(data.prediction)
            router.push(`/reports_page/${collectionId}`)
        } 
        catch (err) {
            console.error('Error adding prediction:', err)
            setError(err.message || 'Failed to add prediction')
        } 
        finally {
            setSubmitting(false)
        }
    }

    const getCookie = (name) => {
        if (typeof window === 'undefined') return null
        const value = `; ${document.cookie}`
        const parts = value.split(`; ${name}=`)
        if (parts.length === 2) return parts.pop().split(';').shift()
        return null
    }
    
    // User menu handlers
    const userMenuOpen = (event) => {
        setUserMenuAnchor(event.currentTarget)
    }

    const userMenuClose = () => {
        setUserMenuAnchor(null)
    }

    // Main menu handlers
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
    
    const goCollection = () => {
        router.push(`/reports_page/${collectionId}`)
    }

    async function entry(userId, modelName) {
        try {
            let count = 1; 
            if (inputType === 'csv' && file) {
                try {
                    const reader = new FileReader();
                    const numRows = await new Promise((resolve) => {
                        reader.onload = function(event) {
                            const csvContent = event.target.result;
                            const lines = csvContent.split('\n').filter(line => line.trim().length > 0);
                            resolve(lines.length > 1 ? lines.length - 1 : 1);
                        };
                        reader.readAsText(file);
                    });
                    
                    count = numRows;
                    console.log(`Determined ${count} rows from CSV file`);
                } 

                catch (fileError) {
                    console.error("Error reading CSV file:", fileError);
                    if (prediction && Array.isArray(prediction)) {
                        count = prediction.length;
                    }
                }
            }
            console.log(`Creating log entry with count: ${count} for ${inputType} source`);
            const payload = {
                modelName: modelName,
                inputSource: inputType === 'csv' ? (file ? file.name : 'CSV import') : 'Manual input',
                predictionsCount: count,
                userId: userId,
                timestamp: new Date()
            };
            
            console.log("Sending log payload:", payload);

            const logResponse = await fetch('/api/log', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });
            
            const responseText = await logResponse.text();
            
            if (logResponse.ok) {
                console.log("Log entry created successfully:", responseText);
                setTimeout(() => {
                    window.dispatchEvent(new Event('refreshActivityLog'));
                }, 1000);
                return true;
            } 
            else {
                console.error("Failed to create log entry:", responseText);
                return false;
            }
        } 
        catch (error) {
            console.error("Error in entry:", error);
            return false;
        }
    }

    // UI ELEMENTS 

    return (
        <Box sx={{ 
            minHeight: '100vh',
            backgroundColor: '#f5f7fa',
        }}>
            {/*app bar that matches the home page*/}
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
                            color: 'black', //logout button text color
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
                    
                    {/*main menu */}
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

            <Container maxWidth="md" sx={{ pt: 10, pb: 6 }}>
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
                            backgroundColor: '#861F41', //accent card color
                            borderTopLeftRadius: '8px',
                            borderTopRightRadius: '8px',
                        },
                        mb: 3
                    }}
                >
                    <CardContent sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                            <IconButton 
                                onClick={goCollection}
                                sx={{ mr: 2 }}
                                aria-label="go back"
                            >
                                <ArrowBackIcon />
                            </IconButton>
                            <Typography variant="h5" component="h1" sx={{ 
                                fontWeight: 'bold', 
                                display: 'flex', 
                                alignItems: 'center',
                                color: '#861F41' //add prediciton text color
                            }}>
                                <BarChartIcon sx={{ mr: 1 }} /> Add Prediction to Collection
                            </Typography>
                        </Box>
                        
                        {loading || userLoading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                                <CircularProgress />
                            </Box>
                        ) : (
                            <>
                                <Box sx={{ mb: 4 }}>
                                    <Typography variant="h6" color="#861F41" sx={{ fontWeight: 'bold' }}>
                                        Collection: {collectionName}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Enter prediction inputs below or upload a CSV file
                                    </Typography>
                                </Box>
                                
                                <Grid container spacing={3}>
                                    {/*dropdown for choosing the model*/}
                                    <Grid item xs={12} md={6}>
                                        <FormControl fullWidth variant="outlined">
                                            <InputLabel id="model-label">Select Model</InputLabel>
                                            <Select
                                                labelId="model-label"
                                                value={model}
                                                label="Choose Model"
                                                onChange={modelChange}
                                                required
                                                sx={{ borderRadius: 1 }}
                                            >
                                                {models.map((modelItem) => (
                                                    <MenuItem key={modelItem._id} value={modelItem._id}>
                                                        {modelItem.name}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Grid>

                                    {/*dropdown for choosing the input type*/}
                                    <Grid item xs={12} md={6}>
                                        <FormControl fullWidth variant="outlined">
                                            <InputLabel id="input-type-label">Input Type</InputLabel>
                                            <Select
                                                labelId="input-type-label"
                                                value={inputType}
                                                label="Input Type"
                                                onChange={(e) => setInputType(e.target.value)}
                                                sx={{ borderRadius: 1 }}
                                            >
                                                <MenuItem value="manual">Manual Input</MenuItem>
                                                <MenuItem value="csv">CSV File Upload</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                </Grid>
                                
                                <Divider sx={{ my: 4 }} />
                                
                                {/*selecting the input*/}
                                <Box 
                                    component="form" 
                                    onSubmit={submit} 
                                    sx={{ 
                                        mt: 2,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: 3,
                                    }}
                                >
                                    {inputType === 'manual' ? (
                                        <>
                                            {/*input fields*/}
                                            {modelInputs.length > 0 ? (
                                                <>
                                                    <Grid container spacing={3}>
                                                        {modelInputs.map((input, index) => (
                                                            <Grid item xs={12} md={6} key={index}>
                                                                <TextField
                                                                    label={input}
                                                                    variant="outlined"
                                                                    type="number"
                                                                    onChange={(e) => inputChange(input, e.target.value)}
                                                                    fullWidth
                                                                    required
                                                                    sx={{ borderRadius: 1 }}
                                                                    placeholder={`Enter ${input}`}
                                                                    InputProps={{
                                                                        sx: { borderRadius: 1 }
                                                                    }}
                                                                />
                                                            </Grid>
                                                        ))}
                                                    </Grid>

                                                    {/*manual input log transform*/}
                                                    <FormControlLabel
                                                        control={
                                                            <Checkbox
                                                                checked={logTransform}
                                                                onChange={logTransformChange}
                                                                name="logTransform"
                                                                color="black"
                                                            />
                                                        }
                                                        label="Apply Log Transform"
                                                    />
                                                </>
                                            ) : (
                                                <Alert severity="info">
                                                    No inputs available for the selected model. Please select a different model.
                                                </Alert>
                                            )}
                                        </>
                                    ) : (
                                        <Box
                                            sx={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: 3,
                                                p: 3,
                                                border: '1px dashed #C95B0C',
                                                borderRadius: 2,
                                                backgroundColor: '#f8f9fa',
                                            }}
                                        >
                                            <Box sx={{ textAlign: 'center' }}>
                                                <CloudUploadIcon sx={{ fontSize: 48, color: '#861F41', mb: 2 }} />
                                                <Typography variant="h6" gutterBottom>
                                                    Upload CSV File
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                                    Upload a CSV file with your prediction data
                                                </Typography>
                                            </Box>
                                            
                                            <TextField
                                                variant="outlined"
                                                type="file"
                                                onChange={fileChange}
                                                InputLabelProps={{ shrink: true }}
                                                fullWidth
                                                required
                                                inputProps={{ accept: '.csv' }}
                                            />
                                            
                                            {/*csv upload log transform*/}
                                            <FormControlLabel
                                                control={
                                                    <Checkbox
                                                        checked={logTransform}
                                                        onChange={logTransformChange}
                                                        name="logTransform"
                                                        color="primary"
                                                    />
                                                }
                                                label="Apply Log Transform"
                                            />
                                        </Box>
                                    )}

                                    {/*displaying error*/}
                                    {error && (
                                        <Alert severity="error" sx={{ mt: 2 }}>
                                            {error}
                                        </Alert>
                                    )}

                                    {/*predict crash rate submit button*/}
                                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                                        <Button
                                            variant="contained"
                                            type="submit"
                                            disabled={submitting || userLoading}
                                            startIcon={<PlayArrowIcon />}
                                            sx={{ 
                                                borderRadius: 2, 
                                                px: 4, 
                                                py: 1.2,
                                                backgroundColor: '#861F41',
                                                '&:hover': {
                                                    backgroundColor: '#861F41',
                                                },
                                                textTransform: 'none'
                                            }}
                                        >
                                            {submitting ? 'Processing...' : 'Predict Crash Rate'}
                                        </Button>
                                    </Box>
                                </Box>
                            </>
                        )}
                        
                        {/*displaying result*/}
                        {prediction !== null && (
                            <Box 
                                sx={{ 
                                    mt: 4,
                                    p: 3,
                                    backgroundColor: '#e8eaf6',
                                    borderRadius: 2,
                                    border: '1px solid #c5cae9'
                                }}
                            >
                                <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', color: '#1a237e' }}>
                                    Prediction Results
                                </Typography>
                                
                                {Array.isArray(prediction) ? (
                                    <Box>
                                        {prediction.map((pred, index) => (
                                            <Typography key={index} sx={{ mb: 1 }}>
                                                Result {index + 1}: {pred}
                                            </Typography>
                                        ))}
                                    </Box>
                                ) : typeof prediction === 'object' ? (
                                    <Typography>
                                        {prediction.result}
                                    </Typography>
                                ) : (
                                    <Typography variant="h5" sx={{ fontWeight: 'bold', textAlign: 'center' }}>
                                        {prediction}
                                    </Typography>
                                )}
                            </Box>
                        )}
                    </CardContent>
                </Card>
            </Container>
        </Box>
    )
}