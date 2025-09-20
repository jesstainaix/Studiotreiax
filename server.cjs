const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;

const server = http.createServer((req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    let filePath = '';
    
    if (req.url === '/' || req.url === '/index.html') {
        filePath = path.join(__dirname, 'index.html');
    } else {
        filePath = path.join(__dirname, req.url);
    }

    // Verificar se arquivo existe
    fs.access(filePath, fs.constants.F_OK, (err) => {
        if (err) {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(`
                <html>
                    <head><title>Servidor de Desenvolvimento</title></head>
                    <body>
                        <h1>🚀 Servidor funcionando na porta ${PORT}!</h1>
                        <p>Arquivo solicitado: ${req.url}</p>
                        <p>Caminho: ${filePath}</p>
                        <p>Status: Arquivo não encontrado</p>
                        <hr>
                        <p>Tente acessar: <a href="/index.html">index.html</a></p>
                        <p>Timestamp: ${new Date().toISOString()}</p>
                    </body>
                </html>
            `);
            return;
        }

        // Detectar tipo de conteúdo
        const ext = path.extname(filePath);
        let contentType = 'text/html';
        
        switch (ext) {
            case '.js':
            case '.tsx':
            case '.ts':
                contentType = 'application/javascript';
                break;
            case '.css':
                contentType = 'text/css';
                break;
            case '.json':
                contentType = 'application/json';
                break;
            case '.png':
                contentType = 'image/png';
                break;
            case '.jpg':
                contentType = 'image/jpg';
                break;
            case '.svg':
                contentType = 'image/svg+xml';
                break;
        }

        // Ler e servir arquivo
        fs.readFile(filePath, (err, content) => {
            if (err) {
                res.writeHead(500);
                res.end('Erro interno do servidor');
            } else {
                res.writeHead(200, { 'Content-Type': contentType });
                res.end(content);
            }
        });
    });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor HTTP funcionando em http://localhost:${PORT}`);
    console.log(`📁 Servindo arquivos de: ${__dirname}`);
    console.log(`✨ Acesse a aplicação em: http://localhost:${PORT}`);
});

// Lidar com erros
server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.log(`❌ Porta ${PORT} já está em uso. Tente uma porta diferente.`);
    } else {
        console.log('❌ Erro no servidor:', err);
    }
});