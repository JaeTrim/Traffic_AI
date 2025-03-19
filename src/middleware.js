import { NextResponse } from 'next/server'

export async function middleware(req) {
    //console.log([MIDDLEWARE] - Checking Redirects)

    // Extract token value from cookie
    const token = req.cookies.get('token')?.value
    // console.log([MIDDLEWARE] - Token: ${token});

    const baseURL = new URL(req.url).origin

    const url = req.nextUrl
    // console.log([MIDDLEWARE] - url: ${url});
    // console.log([MIDDLEWARE] - pathname: ${url.pathname});

    try {
        // Verify JWT Token
        const res = await fetch(`${baseURL}/api/auth/verify-token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token }),
        })

        /* 
            Handle verify-token response & redirect

            If authorized, then send login to home
            If unauthorized, only send to login
        */
        if (res.status === 200) {
            // JWT Authorized
            if (url.pathname === '/') {
                return NextResponse.redirect(new URL('/home', req.url))
            } else if (url.pathname === '/login') {
                return NextResponse.redirect(new URL('/home', req.url))
            } else if (url.pathname === '/signup') {
                return NextResponse.redirect(new URL('/home', req.url))
            } else {
                return NextResponse.next()
            }
        } else {
            // JWT Unauthorized
            if (url.pathname === '/login') {
                return NextResponse.next()
            } else {
                return NextResponse.redirect(new URL('/login', req.url))
            }
        }
    } catch (error) {
        //console.log([MIDDLEWARE] - Error in verifying token)
        return NextResponse.redirect(new URL('/login', req.url))
    }
}

export const config = {
    matcher: ['/', '/home', '/login'], // Routes to apply redirects to
}
