const http = require('http');

const PORT = 6054;

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Hello, Dockerized Node.js Server!\n');
});


server.listen(PORT, () => {
  console.log(`This server is listening on port ${PORT}`);
});
