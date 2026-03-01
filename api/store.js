// Vercel Serverless Function
// Stores intercepted claude.ai usage data to MongoDB for benchmarking
const { MongoClient } = require('mongodb');

// Ensure you set MONGODB_URI in your Vercel Environment Variables
const uri = process.env.MONGODB_URI;

if (!uri) {
    throw new Error('MONGODB_URI environment variable is not set');
}

// Cache the client promise across warm invocations
let cachedClient = null;
let cachedDb = null;

async function connectToDatabase() {
    if (cachedClient && cachedDb) {
        return { client: cachedClient, db: cachedDb };
    }

    const client = new MongoClient(uri);
    await client.connect();

    const db = client.db('claude_spend_benchmarking');

    cachedClient = client;
    cachedDb = db;

    return { client, db };
}

module.exports = async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*'); // Or restrict to specific extension IDs
    res.setHeader('Access-Control-Allow-Methods', 'OPTIONS,POST');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    // Handle preflight
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const data = req.body;

        // Validate basic structure
        if (!data || !data.user_id || !data.prompt) {
            return res.status(400).json({ error: 'Invalid payload. user_id and prompt are required.' });
        }

        const { user_id, timestamp, prompt, model, tokens, cost, date } = data;

        const { db } = await connectToDatabase();
        const collection = db.collection('usage_data');

        // Store the data into MongoDB
        await collection.insertOne({
            user_id,
            timestamp: timestamp || new Date().toISOString(),
            prompt,
            model,
            tokens,
            cost,
            date: date || new Date().toISOString(),
            recorded_at: new Date()
        });

        return res.status(200).json({ success: true, message: 'Data recorded for benchmarking.' });
    } catch (error) {
        console.error('Error saving to MongoDB:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};
