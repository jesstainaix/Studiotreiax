import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const port = 3001;
const baseDir = __dirname;

const mimeTypes = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  console.log(`📥 ${new Date().toISOString()} - ${req.method} ${req.url}`);
  
  let filePath = path.join(baseDir, req.url === '/' ? 'test-media-library-upload.html' : req.url);
  
  // Security check - prevent directory traversal
  if (!filePath.startsWith(baseDir)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }
  
  // Check if file exists
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      res.writeHead(404);
      res.end(`File not found: ${req.url}`);
      return;
    }
    
    const ext = path.extname(filePath).toLowerCase();
    const mimeType = mimeTypes[ext] || 'application/octet-stream';
    
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(500);
        res.end(`Error reading file: ${err.message}`);
        return;
      }
      
      res.writeHead(200, {
        'Content-Type': mimeType,
        'Cache-Control': 'no-cache'
      });
      res.end(data);
    });
  });
});

server.listen(port, () => {
  console.log(`🚀 Test server running at http://localhost:${port}`);
  console.log(`📂 Serving files from: ${baseDir}`);
  console.log(`🧪 MediaLibrary Upload Test ready!`);
  console.log(`📊 Open http://localhost:${port} to run tests`);
});

server.on('error', (err) => {
  console.error(`❌ Server error: ${err.message}`);
});