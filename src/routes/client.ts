import express from 'express';
import {
	createClient, deleteClient, getActivationKey, getAllClients, getClient, getRemoteDb, sendOTP, updateClient, verifyOTP
} from '../controllers/client';
import { protect, protectClient } from '../middlewares/auth-middleware';

const router = express.Router();

router.post('/', protect,createClient);
router.patch('/:id/update', protect,updateClient);
router.delete('/:id/delete', protect,deleteClient);
router.get('/:id', protect,getClient);
router.get('/',protect,getAllClients);
router.post('/db/get-remote', protectClient,getRemoteDb);
router.post('/access/get-key', protectClient,getActivationKey);
router.post('/send-otp', sendOTP);
router.post('/verify', verifyOTP);


export default router;
