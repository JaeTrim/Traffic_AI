// app/api/random-numbers/route.js

export async function GET(request) {

    const placeholder_rows = [
        { id: 1, timestamp: `1984/01/01 12:00 AM`, model: `Model ${randInt(1, 3)}.${randInt(0, 3)}`, input: `Input_${randInt(1, 999)}.txt`, output: `Output_${randInt(1, 999)}.txt` },
        { id: 2, timestamp: `1985/02/01 12:00 AM`, model: `Model ${randInt(1, 3)}.${randInt(0, 3)}`, input: `Input_${randInt(1, 999)}.txt`, output: `Output_${randInt(1, 999)}.txt` },
        { id: 3, timestamp: `1986/03/01 12:00 AM`, model: `Model ${randInt(1, 3)}.${randInt(0, 3)}`, input: `Input_${randInt(1, 999)}.txt`, output: `Output_${randInt(1, 999)}.txt` },
        { id: 4, timestamp: `1987/04/01 12:00 AM`, model: `Model ${randInt(1, 3)}.${randInt(0, 3)}`, input: `Input_${randInt(1, 999)}.txt`, output: `Output_${randInt(1, 999)}.txt` },
        { id: 5, timestamp: `1988/05/01 12:00 AM`, model: `Model ${randInt(1, 3)}.${randInt(0, 3)}`, input: `Input_${randInt(1, 999)}.txt`, output: `Output_${randInt(1, 999)}.txt` }
    ]

    // Return the array as a JSON response
    return new Response(JSON.stringify({ log: placeholder_rows }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
    })
}

function randInt(min, max) {
    return Math.floor((Math.random() * (max - min)) + min);
}
