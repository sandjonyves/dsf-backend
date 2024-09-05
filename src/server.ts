import http from 'http';
import app from './app';
import 'dotenv/config';
import connectDB from './db/connect';
import { initDB } from './utils';


process.on('uncaughtException', (err: Error) => {
	process.exit(1);
});

const server = http.createServer(app);

const port: string = process.env.PORT || '8000';

const startServer = async () => {
	try {
		await connectDB(
			process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/dsf-admin'
		);
		await initDB()
		server.listen(port, () => {
			console.log(`server is listenning on port ${port}`);
		});
	} catch (error) {
		console.log(['Error [SERVER] Server launching fails']);
	}
};

startServer();

process.on('unhandledRejection', (err: Error) => {
	console.log(err);
	server.close(() => {
		process.exit(1);
	});
});
