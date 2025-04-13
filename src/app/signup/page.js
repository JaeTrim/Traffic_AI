
'use client'

//colors:
//maroon: 861F41
//orange: C95B0C

import { useRouter } from 'next/navigation'
import { React, useState } from 'react'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined'
import PersonAddAltOutlinedIcon from '@mui/icons-material/PersonAddAltOutlined'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'

import {
    Box,
    Button,
    Typography,
    Container,
    Card,
    CardContent,
    TextField,
    Alert,
    InputAdornment,
    IconButton,
    Divider,
} from '@mui/material'

export default function SignUp() {
    const router = useRouter()
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPass, setConfirmPass] = useState('')
    const [error, setError] = useState(null)
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPass, setShowConfirmPass] = useState(false)

    async function register(e) { // Registering a new user
        e.preventDefault()
        setError(null)
        setLoading(true)
        if (username === '') {
            setError('Please enter a username')
            setLoading(false)
            return
        } 
        else if (password === '') {
            setError('Please enter a password')
            setLoading(false)
            return
        } 
        else if (password !== confirmPass) {
            setError('Passwords do not match')
            setLoading(false)
            return
        } 
        else if (password.length < 6) {
            setError('Password must be at least 6 characters long')
            setLoading(false)
            return
        }
        try {
            const res = await fetch('/api/auth/register', {
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
                setError('Username already exists')
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
                setError('Registration failed, try again')
            }
        } 
        catch (e) {
            console.error(e)
            setError('Connection error, check your internet connection')
        } 
        finally {
            setLoading(false)
        }
    }
    function login() {
        router.push('/login')
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
                    backgroundColor: '#861F41', //background of left panel 
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
                    <Button
                        startIcon={<ArrowBackIcon />}
                        onClick={login}
                        sx={{ 
                            mb: 3, 
                            textTransform: 'none',
                            color: 'black', // back to login color
                        }}
                    >
                        Back to Login
                    </Button>
                    
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
                                backgroundColor: '#C95B0C', //accent bar color
                                borderTopLeftRadius: '8px',
                                borderTopRightRadius: '8px',
                            }
                        }}
                    >
                        <CardContent sx={{ p: 4 }}>
                            <Box sx={{ textAlign: 'center', mb: 4 }}>
                                <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: '#C95B0C' }}>
                                    Create Account
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                    Sign up to get started with your traffic analysis
                                </Typography>
                            </Box>                            
                            <Box
                                component="form"
                                onSubmit={register}
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
                                <TextField
                                    label="Confirm Password"
                                    variant="outlined"
                                    fullWidth
                                    required
                                    type={showConfirmPass ? 'text' : 'password'}
                                    value={confirmPass}
                                    onChange={(e) => setConfirmPass(e.target.value)}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <LockOutlinedIcon color="action" />
                                            </InputAdornment>
                                        ),
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton
                                                    aria-label="toggle confirm password"
                                                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                                                    edge="end"
                                                >
                                                    {showConfirmPass ? <VisibilityOffOutlinedIcon /> : <VisibilityOutlinedIcon />}
                                                </IconButton>
                                            </InputAdornment>
                                        ),
                                        sx: { borderRadius: 1 }
                                    }}
                                />            
                                <Button
                                    variant="contained"
                                    type="submit"
                                    fullWidth
                                    disabled={loading}
                                    startIcon={<PersonAddAltOutlinedIcon />}
                                    sx={{ 
                                        mt: 2, 
                                        borderRadius: 2,
                                        py: 1.2,
                                        backgroundColor: '#C95B0C', //create account button color
                                        '&:hover': {
                                            backgroundColor: '#C95B0C',
                                        },
                                        textTransform: 'none',
                                        fontWeight: 500,
                                    }}
                                >
                                    {loading ? 'Creating Account...' : 'Create Account'}
                                </Button>
                                
                                <Divider sx={{ my: 2 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        OR
                                    </Typography>
                                </Divider>
                                
                                <Box sx={{ 
                                    display: 'flex', 
                                    justifyContent: 'center', 
                                    alignItems: 'center',
                                    mt: 1, 
                                    gap: 1
                                }}>
                                    <Typography variant="body2" color="text.secondary">
                                        Already have an account?
                                    </Typography>
                                    <Button
                                        variant="text"
                                        size="small"
                                        onClick={login}
                                        sx={{ 
                                            textTransform: 'none',
                                            fontWeight: 500,
                                        }}
                                    >
                                        Sign In
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
