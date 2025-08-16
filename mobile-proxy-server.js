#!/usr/bin/env node

const http = require('http');
const https = require('https');
const url = require('url');

const PORT = 3001;

// Simple proxy server to enable mobile API access
const server = http.createServer((req, res) => {
    // Enable CORS for mobile apps
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type,x-api-key,anthropic-version');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    if (req.method === 'POST' && req.url === '/api/claude') {
        let body = '';
        
        req.on('data', chunk => {
            body += chunk.toString();
        });
        
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                
                // Forward to Claude API
                const postData = JSON.stringify({
                    model: 'claude-3-sonnet-20240229',
                    max_tokens: 1024,
                    messages: [{
                        role: 'user',
                        content: data.message
                    }],
                    system: data.systemPrompt || 'You are an autonomous AI agent with Bloomberg Terminal interface. Provide professional, concise responses.'
                });

                const options = {
                    hostname: 'api.anthropic.com',
                    port: 443,
                    path: '/v1/messages',
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-api-key': data.apiKey,
                        'anthropic-version': '2023-06-01',
                        'Content-Length': Buffer.byteLength(postData)
                    }
                };

                const claudeReq = https.request(options, (claudeRes) => {
                    let responseData = '';
                    
                    claudeRes.on('data', (chunk) => {
                        responseData += chunk;
                    });
                    
                    claudeRes.on('end', () => {
                        res.writeHead(claudeRes.statusCode, {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        });
                        res.end(responseData);
                    });
                });

                claudeReq.on('error', (err) => {
                    console.error('Claude API Error:', err);
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Proxy server error: ' + err.message }));
                });

                claudeReq.write(postData);
                claudeReq.end();

            } catch (err) {
                console.error('Parse Error:', err);
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid JSON in request' }));
            }
        });
    } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Endpoint not found' }));
    }
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Mobile Proxy Server running!`);
    console.log(`📱 Local: http://localhost:${PORT}`);
    console.log(`🌐 Network: http://0.0.0.0:${PORT}`);
    console.log('');
    console.log('✅ This proxy enables full Claude API access in mobile apps!');
    console.log('📋 Mobile App Configuration:');
    console.log('   - Set API endpoint to: http://YOUR_IP:3001/api/claude');
    console.log('   - Or use http://localhost:3001/api/claude for local testing');
    console.log('');
    console.log('🔧 Usage:');
    console.log('   1. Keep this server running');
    console.log('   2. Update mobile app to use this proxy endpoint');
    console.log('   3. Enjoy full Claude API functionality!');
});

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Proxy server shutting down...');
    server.close(() => {
        console.log('✅ Proxy server closed.');
        process.exit(0);
    });
});