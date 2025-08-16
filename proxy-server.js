// Simple Node.js proxy server to handle CORS for Anthropic API
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3001;

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// Serve static files from current directory
app.use(express.static('.'));

// Proxy endpoint for Anthropic API
app.post('/api/anthropic', async (req, res) => {
    try {
        const { apiKey, message, systemPrompt } = req.body;

        if (!apiKey) {
            return res.status(400).json({ error: 'API key is required' });
        }

        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-3-5-sonnet-20241022',
                max_tokens: 1024,
                system: systemPrompt || 'You are an autonomous AI agent designed to bridge the gap between mind and action.',
                messages: [
                    {
                        role: 'user',
                        content: message
                    }
                ]
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Anthropic API Error:', response.status, errorText);
            return res.status(response.status).json({ 
                error: `API Error: ${response.status}`,
                details: errorText 
            });
        }

        const data = await response.json();
        res.json(data);

    } catch (error) {
        console.error('Proxy Error:', error);
        res.status(500).json({ 
            error: 'Proxy server error',
            details: error.message 
        });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'Proxy server running' });
});

app.listen(PORT, () => {
    console.log(`🚀 Proxy server running on http://localhost:${PORT}`);
    console.log(`📱 Open your PWA at: http://localhost:${PORT}/api-version.html`);
});