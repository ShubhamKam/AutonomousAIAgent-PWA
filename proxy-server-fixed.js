// Fixed Node.js proxy server with model fallbacks
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3001;

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// Serve static files from current directory
app.use(express.static('.'));

// Available models to try (in order of preference)
const CLAUDE_MODELS = [
    'claude-3-5-sonnet-20241022',
    'claude-3-5-sonnet-20240620', 
    'claude-3-sonnet-20240229',
    'claude-3-haiku-20240307'
];

// Proxy endpoint for Anthropic API
app.post('/api/anthropic', async (req, res) => {
    try {
        const { apiKey, message, systemPrompt } = req.body;

        if (!apiKey) {
            return res.status(400).json({ error: 'API key is required' });
        }

        if (!apiKey.startsWith('sk-ant-api03-')) {
            return res.status(400).json({ error: 'Invalid API key format. Must start with sk-ant-api03-' });
        }

        // Try models in order until one works
        let lastError = null;
        
        for (const model of CLAUDE_MODELS) {
            try {
                console.log(`Trying model: ${model}`);
                
                const response = await fetch('https://api.anthropic.com/v1/messages', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-api-key': apiKey,
                        'anthropic-version': '2023-06-01'
                    },
                    body: JSON.stringify({
                        model: model,
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

                if (response.ok) {
                    const data = await response.json();
                    console.log(`✅ Success with model: ${model}`);
                    return res.json(data);
                }

                const errorText = await response.text();
                console.log(`❌ Failed with model ${model}: ${response.status} - ${errorText}`);
                lastError = { status: response.status, text: errorText };
                
                // If it's not a model-specific error, don't try other models
                if (response.status === 401 || response.status === 429) {
                    break;
                }
                
            } catch (fetchError) {
                console.log(`❌ Network error with model ${model}:`, fetchError.message);
                lastError = { status: 500, text: fetchError.message };
            }
        }

        // If all models failed, return the last error
        console.error('All models failed. Last error:', lastError);
        return res.status(lastError.status || 500).json({ 
            error: `All Claude models failed. Last error: ${lastError.text}`,
            details: lastError 
        });

    } catch (error) {
        console.error('Proxy Error:', error);
        res.status(500).json({ 
            error: 'Proxy server error',
            details: error.message 
        });
    }
});

// Test endpoint to check which models are available
app.post('/api/test-models', async (req, res) => {
    const { apiKey } = req.body;
    
    if (!apiKey) {
        return res.status(400).json({ error: 'API key required' });
    }

    const results = [];
    
    for (const model of CLAUDE_MODELS) {
        try {
            const response = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': apiKey,
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                    model: model,
                    max_tokens: 10,
                    messages: [{ role: 'user', content: 'test' }]
                })
            });

            results.push({
                model,
                available: response.ok,
                status: response.status
            });
            
        } catch (error) {
            results.push({
                model,
                available: false,
                error: error.message
            });
        }
    }
    
    res.json({ models: results });
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        message: 'Proxy server running',
        models: CLAUDE_MODELS 
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Proxy server running on http://localhost:${PORT}`);
    console.log(`📱 Open your PWA at: http://localhost:${PORT}/api-version.html`);
    console.log(`🔧 Available models: ${CLAUDE_MODELS.join(', ')}`);
});