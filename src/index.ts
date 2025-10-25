import { app } from './app';

const PORT = Number(process.env.PORT) || 3000;

console.log('Starting server...');

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌐 Available at: http://localhost:${PORT}`);
});