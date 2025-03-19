'use client'
import { React, useState, useEffect } from 'react'
import {
    Box,
    AppBar,
    Toolbar,
    IconButton,
    FormControl,
    MenuItem,
    InputLabel,
    Select,
    Typography,
    Button,
    TextField,
    Divider,
    Paper,
    TableContainer,
    Table,
    TableHead,
    TableBody,
    TableRow,
    TableCell,
} from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import styles from '../styles/Home.module.css'

// Root Component
export default function Home() {
    return (
        <Box className={styles.app}>
            <Box>
                <UIAppBar />
            </Box>
            <Box className={styles.mainContainer}>
                <UIInputSection /> {/* Add Input Section onto page */}
                <Divider /> {/* Add Divider for styling */}
                <UIUserLog /> {/* Add User Log onto page */}
            </Box>
        </Box>
    )
}

function UIAppBar() {
    return (
        <Box className={styles.appBar}>
            <AppBar>
                <Toolbar>
                    <IconButton>
                        <MenuIcon />
                    </IconButton>
                    <Box className={styles.appBar}></Box>
                    <Button variant="contained" className={styles.userButton}>
                        User
                    </Button>
                </Toolbar>
            </AppBar>
        </Box>
    )
}

function UIInputSection() {
    const placeholder_models = [
        { id: 0, model: 'Model 1.0' },
        { id: 1, model: 'Model 1.1' },
        { id: 2, model: 'Model 2.0' },
        { id: 3, model: 'horsepower_model' },
    ]

    const [modelList, setModelList] = useState([])
    const [selectedModel, setSelectedModel] = useState('')
    const [ADT, setADT] = useState('')
    const [Length, setLength] = useState('')
    const [prediction, setPrediction] = useState(null)

    // Attempt to fetch model list from backend
    useEffect(() => {
        const fetchModels = async () => {
            try {
                const response = await fetch('https://api.example.com/data')
                const result = await response.json()
                setModelList(result)
            } catch {
                setModelList(placeholder_models)
            }
        }
        fetchModels()
    }, [])

    // Handle form submission to send data to the backend
    const handleSubmit = async (e) => {
        e.preventDefault()

        try {
            const res = await fetch('/api/predict', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ ADT, Length, modelName: selectedModel }),
            })

            const data = await res.json()
            console.log('Prediction received from backend:', data) // Debug log

            setPrediction(data.crash_rate || 'Prediction failed') // Ensure we are updating the state with crashRate
        } catch (error) {
            console.error('Error fetching prediction:', error)
            setPrediction('Prediction failed')
        }
    }

    return (
        <Box className={styles.uiInputSection}>
            <Box className={styles.inputRow}>
                <Box className={styles.formControlBox}>
                    <FormControl fullWidth>
                        <InputLabel id="select-label">Choose Model</InputLabel>
                        <Select
                            labelId="select-label"
                            value={selectedModel}
                            label="Model"
                            onChange={(e) => setSelectedModel(e.target.value)}
                        >
                            {modelList.map((model) => (
                                <MenuItem key={model.id} value={model.model}>
                                    {model.model}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Box>
                <Box className={styles.formControlBox}>
                    <TextField
                        label="ADT"
                        variant="outlined"
                        value={ADT}
                        onChange={(e) => setADT(e.target.value)}
                        fullWidth
                    />
                </Box>
                <Box className={styles.formControlBox}>
                    <TextField
                        label="Length"
                        variant="outlined"
                        value={Length}
                        onChange={(e) => setLength(e.target.value)}
                        fullWidth
                    />
                </Box>
            </Box>
            <Button
                variant="contained"
                onClick={handleSubmit}
                className={styles.formControlBox}
            >
                Predict Crash Rate
            </Button>

            {prediction !== null && (
                <Box className={styles.predictionResult}>
                    <Typography variant="h6">
                        Predicted Crash Rate: {prediction}
                    </Typography>
                </Box>
            )}
        </Box>
    )
}

function UIUserLog() {
    const [userLog, setUserLog] = useState([])

    // Attempt to fetch user log from backend
    useEffect(() => {
        const fetchLog = async () => {
            try {
                const res = await fetch('/api/log', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                })
                if (!res.ok) {
                    throw new Error(`Backend Error - ${res}`)
                }
                const result = await res.json()
                setUserLog(result.log)
            } catch (error) {
                console.error('Error fetching user log:', error)
                // setUserLog(placeholder_rows);
            }
        }
        fetchLog()
    }, [])

    const tableKeys =
        userLog.length > 0
            ? Object.keys(userLog[0]).filter((k) => k !== 'id')
            : []

    const tableLabels =
        tableKeys.length > 0
            ? tableKeys.map((cell, cellIndex) => (
                  <TableCell key={cellIndex}>{cell}</TableCell>
              ))
            : []

    const tableCells =
        userLog.length > 0 && tableKeys.length > 0
            ? userLog.map((row, rowIndex) => (
                  <TableRow key={rowIndex}>
                      {tableKeys.map((label, labelIndex) => (
                          <TableCell key={labelIndex}>{row[label]}</TableCell>
                      ))}
                  </TableRow>
              ))
            : []

    return (
        <Box className={styles.userLogContainer}>
            <Typography variant="h5" className={styles.userLogTitle}>
                User Log
            </Typography>
            <Paper>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>{tableLabels}</TableRow>
                        </TableHead>
                        <TableBody>{tableCells}</TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </Box>
    )
}
