import express, { Application } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import cookieParser from 'cookie-parser';
import 'dotenv/config';

//

import errorHandlerMiddleware from './middlewares/error-handler';
import notFound from './middlewares/not-found';
import router from './routes';

const app: Application = express();

// middleware
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));
app.use(helmet());
app.use(mongoSanitize());
app.use(
	cors({
		origin: [
			'https://main.daosnrc38pscd.amplifyapp.com',
			'http://localhost:1212',
			'http://localhost:5173',
			'https://dsf-frontentd-admin-client.vercel.app',
			'https://dsf-frontentd-admin-client-ih58qhazw-sandjonyves-projects.vercel.app',
		],
		methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
		credentials: true,
	})
);
if (process.env.NODE_ENV === 'development') {
	app.use(morgan('dev'));
}
app.use(cookieParser());

//routes
app.use(router);
app.use(errorHandlerMiddleware);
app.use(notFound);

export default app;
