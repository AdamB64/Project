const http = require('http');
const fs = require('fs');
const path = require('path');

// Define the path to the HTML file
const htmlFilePath = path.join(__dirname, 'HTML', 'start.html');

// Create an HTTP server
const server = http.createServer((req, res) => {
    // Read the HTML file
    fs.readFile(htmlFilePath, (err, data) => {
        if (err) {
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Error loading the HTML file.');
        } else {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(data);
        }
    });
});

// Server listens on port 3000
server.listen(3000, () => {
    console.log('Server running at http://localhost:3000/');
});
