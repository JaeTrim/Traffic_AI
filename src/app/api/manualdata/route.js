// app/api/random-numbers/route.js

export async function GET(request) {
    // Generate an array of 5 random numbers between 0 and 100
    const randomNumbers = Array.from({ length: 5 }, () =>
        Math.floor(Math.random() * 101)
    )

    // Return the array as a JSON response
    return new Response(JSON.stringify({ numbers: randomNumbers }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
    })
}
