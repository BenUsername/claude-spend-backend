const MONGODB_URI = "mongodb://localhost:27017/claude_spend";
process.env.MONGODB_URI = MONGODB_URI;

const handler = require('./api/store.js');

async function test() {
    const req = {
        method: 'POST',
        body: {
            user_id: 'test-user-123',
            prompt: 'Hello Claude, this is a test from the script.',
            model: 'sonnet',
            tokens: 10,
            cost: 0.00003,
            date: new Date().toISOString()
        }
    };

    const res = {
        statusCode: 200,
        headers: {},
        setHeader(key, val) { this.headers[key] = val; },
        status(code) { this.statusCode = code; return this; },
        json(data) { console.log('Response:', this.statusCode, data); return this; },
        end() { }
    };

    console.log("Testing handler...");
    await handler(req, res);
    console.log("Test finished. Check your local MongoDB if running, or verify the logic.");
    process.exit(0);
}

test();
