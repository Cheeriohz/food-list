import express, { Request, Response } from 'express';
import path from 'path';
import { spawn, ChildProcess } from 'child_process';
import http from 'http';

// Start backend server
console.log('Starting backend server...');
const backend: ChildProcess = spawn('node', ['backend/dist/simple-server.js'], {
  stdio: 'inherit',
  cwd: __dirname
});

// Simple static file server for frontend (since react-scripts has issues)
const frontendApp = express();
const FRONTEND_PORT = 3000;

// Serve static files
frontendApp.use(express.static(path.join(__dirname, 'frontend/public')));
frontendApp.use('/static', express.static(path.join(__dirname, 'frontend/src')));

// API proxy to backend
frontendApp.use('/api', (req: Request, res: Response) => {
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: req.url,
    method: req.method,
    headers: req.headers
  };
  
  const proxy = http.request(options, (apiRes) => {
    res.writeHead(apiRes.statusCode!, apiRes.headers);
    apiRes.pipe(res);
  });
  
  req.pipe(proxy);
});

// Serve React app for all other routes
frontendApp.get('*', (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, 'frontend/public/index.html'));
});

frontendApp.listen(FRONTEND_PORT, () => {
  console.log(`Frontend server running on http://localhost:${FRONTEND_PORT}`);
  console.log(`Backend API running on http://localhost:3001`);
  console.log('\n🚀 Recipe Management App is ready!');
  console.log(`\n📖 Open http://localhost:${FRONTEND_PORT} in your browser`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down servers...');
  backend.kill();
  process.exit(0);
});