import http from 'http';
import app from './app';
import 'dotenv/config';
import connectDB from './db/connect';
import { initDB } from './utils';

process.on('uncaughtException', (err: Error) => {
    console.error('Uncaught Exception:', err);
    process.exit(1);
});

const server = http.createServer(app);

// Utiliser PORT et MONGO_URI depuis le fichier .env
const port: string = process.env.PORT; 
const mongoUri: string = process.env.MONGO_URI; 

const startServer = async () => {
    try {
        if (!mongoUri) {
            throw new Error('MONGO_URI is not defined in .env');
        }
        if (!port) {
            throw new Error('PORT is not defined in .env');
        }

        console.log('Tentative de connexion à MongoDB...');
        await connectDB(mongoUri);
        await initDB();
        server.listen(port, () => {
            console.log(`Server is listening on port ${port}`);
        });
    } catch (error) {
        console.error('Error [SERVER] Server launching fails:', error);
    }
};

startServer();

process.on('unhandledRejection', (err: Error) => {
    console.error('Unhandled Rejection:', err);
    server.close(() => {
        process.exit(1);
    });
});