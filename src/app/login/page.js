'use client'
import { useRouter } from 'next/navigation'
import { React, useState } from 'react'
import {
    Box,
    Button,
    Checkbox,
    Typography,
    FormControlLabel,
} from '@mui/material'
import SideInfo from '../components/SideInfo'
import UserForm from '../components/UserForm'
import styles from '../styles/login.module.css'

export default function Login() {
    return (
        <Box className={styles.loginPage}>
            <SideInfo />
            <LoginForm />
        </Box>
    )
}

function LoginForm() {
    const router = useRouter()
    const [userInput, setUserInput] = useState('')
    const [passInput, setPassInput] = useState('')
    const [rememberMe, setRememberMe] = useState(false)
    const [error, setError] = useState()

    // Send credentials to backend for authorization
    async function authorize() {
        setError()

        if (userInput === '') {
            setError('Please Enter a Username')
            return
        } else if (passInput === '') {
            setError('Please Enter a Password')
            return
        }

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: userInput,
                    password: passInput,
                }),
            })

            if (res.status === 400) {
                setError('Incorrect Username or Password')
            } else if (res.status === 500) {
                setError('Internal Server Error :(')
            } else if (res.ok) {
                const data = await res.json()

                // Set the JWT token as a cookie
                document.cookie = `token=${data.token}; path=/; Secure; SameSite=Strict`

                // Use client-side navigation to go to home
                router.push('/home')
            }
        } catch (e) {
            console.error(e)
            setError('Login failed')
        }
    }

    function signup() {
        router.push('/signup')
    }

    return (
        <Box className={styles.loginFormContainer}>
            <Box
                component="form"
                className={styles.form}
                onSubmit={(e) => {
                    e.preventDefault()
                    authorize()
                }}
            >
                <Typography variant="h4" className={styles.title}>
                    Sign In
                </Typography>
                <UserForm
                    id="user"
                    label="Username"
                    fieldLabel="Username"
                    value={userInput}
                    setInput={setUserInput}
                />
                <UserForm
                    id="password"
                    label="Password"
                    fieldLabel="Password"
                    value={passInput}
                    setInput={setPassInput}
                />
                {error && (
                    <Typography variant="caption" className={styles.error}>
                        {error}
                    </Typography>
                )}
                <FormControlLabel
                    control={
                        <Checkbox
                            size="small"
                            checked={rememberMe}
                            onChange={() => setRememberMe(!rememberMe)}
                        />
                    }
                    label={
                        <Typography variant="subtitle2">Remember Me</Typography>
                    }
                />
                <Button variant="contained" color="primary" type="submit">
                    Login
                </Button>
                <Box className={styles.noAccount}>
                    <Typography variant="caption">{`Don't have an account?`}</Typography>
                    <Button
                        variant="text"
                        size="small"
                        onClick={(e) => {
                            e.preventDefault()
                            signup()
                        }}
                    >
                        <Typography variant="caption">Sign Up</Typography>
                    </Button>
                </Box>
            </Box>
        </Box>
    )
}
