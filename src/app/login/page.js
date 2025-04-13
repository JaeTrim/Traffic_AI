'use client'

//colors:
//maroon: 861F41
//orange: C95B0C

import { useRouter } from 'next/navigation'
import { React, useState } from 'react'

// icons for the login form
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined'
import LoginIcon from '@mui/icons-material/Login'

import {
    Box,
    Button,
    Checkbox,
    Typography,
    FormControlLabel,
    Container,
    Card,
    CardContent,
    TextField,
    Alert,
    InputAdornment,
    IconButton,
} from '@mui/material'

export default function Login() {
    const router = useRouter()
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [remember, setRemember] = useState(false)
    const [error, setError] = useState(null)
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)

    //handling the login
    async function authorize(e) {
        e.preventDefault()
        setError(null)
        setLoading(true)

        if (username === '') {
            setError('Enter a Username')
            setLoading(false)
            return
        } 
        else if (password === '') {
            setError('Enter a Password')
            setLoading(false)
            return
        }
        try {
            //login header for API
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: username,
                    password: password,
                }),
            })
            if (res.status === 400) {
                setError('Incorrect username or password')
            } 
            else if (res.status === 500) {
                setError('Internal server error, try again later')
            } 
            else if (res.ok) {
                const data = await res.json()
                document.cookie = `token=${data.token}; path=/; Secure; SameSite=Strict`
                router.push('/')
            } 
            else {
                setError('Login failed, try again')
            }
        } 
        catch (e) {
            console.error(e)
            setError('Connection error, please check internet connection')
        } 
        finally {
            setLoading(false)
        }
    }
    function signup() {
        router.push('/signup')
    }
    return (
        <Box sx={{ 
            minHeight: '100vh',
            display: 'flex',
            backgroundColor: '#f5f7fa',
        }}>
            {/*Left Headboard Panel*/}
            <Box 
                sx={{ 
                    display: { xs: 'none', md: 'flex' },
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: '#861F41 ', //background left panel color
                    color: 'white',
                    width: '40%',
                    padding: 6,
                }}
            >
                <Typography variant="h3" component="h1" sx={{ fontWeight: 'bold', mb: 4, textAlign: 'center' }}>
                    Crash Rate Prediction Dashboard
                </Typography>
                <Typography variant="subtitle1" sx={{ mb: 2, maxWidth: '80%', textAlign: 'center' }}>
                    An Advanced Dashboard for Crash Rate Prediction and Analysis
                </Typography>
            </Box>
            
            {/*Login Card*/}
            <Box 
                sx={{ 
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: 4,
                }}
            >
                <Container maxWidth="xs">
                    <Card 
                        elevation={3} 
                        sx={{ 
                            borderRadius: 2,
                            overflow: 'visible',
                            position: 'relative',
                            //accent color for bar
                            '&::before': {
                                content: '""',
                                display: 'block',
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '8px',
                                backgroundColor: '#C95B0C ', //accent bar color
                                borderTopLeftRadius: '8px',
                                borderTopRightRadius: '8px',
                            }
                        }}
                    >
                        <CardContent sx={{ p: 4 }}>
                            <Box sx={{ textAlign: 'center', mb: 4 }}>
                                <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: '#C95B0C ' }}>
                                    Sign In
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                    Login to access traffic analysis
                                </Typography>
                            </Box>
                            
                            <Box
                                component="form"
                                onSubmit={authorize}
                                sx={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 3,
                                }}
                            >
                                {error && (
                                    <Alert severity="error" sx={{ mb: 2 }}>
                                        {error}
                                    </Alert>
                                )}
                                
                                <TextField
                                    label="Username"
                                    variant="outlined"
                                    fullWidth
                                    required
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <PersonOutlineOutlinedIcon color="action" />
                                            </InputAdornment>
                                        ),
                                        sx: { borderRadius: 1 }
                                    }}
                                />
                                
                                <TextField
                                    label="Password"
                                    variant="outlined"
                                    fullWidth
                                    required
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <LockOutlinedIcon color="action" />
                                            </InputAdornment>
                                        ),
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton
                                                    aria-label="toggle password visibility"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    edge="end"
                                                >
                                                    {showPassword ? <VisibilityOffOutlinedIcon /> : <VisibilityOutlinedIcon />}
                                                </IconButton>
                                            </InputAdornment>
                                        ),
                                        sx: { borderRadius: 1 }
                                    }}
                                />                               
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            size="small"
                                            checked={remember}
                                            onChange={() => setRemember(!remember)}
                                            color="primary"
                                        />
                                    }
                                    label={
                                        <Typography variant="body2">Remember Me</Typography>
                                    }
                                />                              
                                <Button
                                    variant="contained"
                                    type="submit"
                                    fullWidth
                                    disabled={loading}
                                    startIcon={<LoginIcon />}
                                    sx={{ 
                                        mt: 2, 
                                        borderRadius: 2,
                                        py: 1.2,
                                        backgroundColor: '#C95B0C', //sign in button color
                                        '&:hover': {
                                            backgroundColor: '#C95B0C',
                                        },
                                        textTransform: 'none',
                                        fontWeight: 500,
                                    }}
                                >
                                    {loading ? 'Signing in...' : 'Sign In'}
                                </Button>                               
                                <Box sx={{ 
                                    display: 'flex', 
                                    justifyContent: 'center', 
                                    alignItems: 'center',
                                    mt: 2, 
                                    gap: 1
                                }}>
                                    <Typography variant="body2" color="text.secondary">
                                        Don't have an account?
                                    </Typography>
                                    <Button
                                        variant="text"
                                        size="small"
                                        onClick={signup}
                                        sx={{ 
                                            textTransform: 'none',
                                            fontWeight: 500,
                                        }}
                                    >
                                        Sign Up
                                    </Button>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Container>
            </Box>
        </Box>
    )
}
