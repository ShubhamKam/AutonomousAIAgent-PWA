#!/usr/bin/env node

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 8080;

// MIME types
const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.wav': 'audio/wav',
    '.mp4': 'video/mp4',
    '.woff': 'application/font-woff',
    '.ttf': 'application/font-ttf',
    '.eot': 'application/vnd.ms-fontobject',
    '.otf': 'application/font-otf',
    '.wasm': 'application/wasm'
};

const server = http.createServer((req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    const parsedUrl = url.parse(req.url);
    let pathname = parsedUrl.pathname;

    // Default to index.html
    if (pathname === '/') {
        pathname = '/fixed-final.html';
    }

    // Security: prevent directory traversal
    pathname = pathname.replace(/\.\./g, '');
    
    const filePath = path.join(__dirname, pathname);
    
    fs.readFile(filePath, (err, data) => {
        if (err) {
            // Try common alternatives
            const alternatives = [
                path.join(__dirname, 'index.html'),
                path.join(__dirname, 'fixed-final.html'),
                path.join(__dirname, 'bloomberg-ui.html')
            ];
            
            let found = false;
            for (const alt of alternatives) {
                try {
                    const altData = fs.readFileSync(alt);
                    const ext = path.extname(alt);
                    const mimeType = mimeTypes[ext] || 'text/plain';
                    
                    res.writeHead(200, { 'Content-Type': mimeType });
                    res.end(altData);
                    found = true;
                    break;
                } catch (e) {
                    // Continue to next alternative
                }
            }
            
            if (!found) {
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end(`
                    <h1>🤖 Autonomous AI Agent</h1>
                    <p>File not found: ${pathname}</p>
                    <p>Available files:</p>
                    <ul>
                        <li><a href="/fixed-final.html">Main App</a></li>
                        <li><a href="/bloomberg-ui.html">Bloomberg UI</a></li>
                        <li><a href="/tools-ui.html">Tools Interface</a></li>
                        <li><a href="/create-web-apk.html">APK Guide</a></li>
                    </ul>
                `);
            }
            return;
        }

        const ext = path.extname(filePath);
        const mimeType = mimeTypes[ext] || 'text/plain';
        
        res.writeHead(200, { 'Content-Type': mimeType });
        res.end(data);
    });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Autonomous AI Agent Server running!`);
    console.log(`📱 Local: http://localhost:${PORT}`);
    console.log(`🌐 Network: http://0.0.0.0:${PORT}`);
    console.log(`💎 Main App: http://localhost:${PORT}/fixed-final.html`);
    console.log(`🔧 APK Guide: http://localhost:${PORT}/create-web-apk.html`);
    console.log('');
    console.log('✅ Use this URL with PWABuilder to generate APK!');
});

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Server shutting down...');
    server.close(() => {
        console.log('✅ Server closed.');
        process.exit(0);
    });
});