import express from 'express';
import clientRouter from './client'
import userRouter from './user'
import keyRouter from './key'
import { protect } from '../middlewares/auth-middleware';

const router = express.Router();

router.use('/api/v1/user',userRouter)
router.use('/api/v1/client',clientRouter)
router.use('/api/v1/key',protect,keyRouter)

export default router