import express from 'express';
import {
	createKey, deleteKey, getAllKeys, getKey
} from '../controllers/key';
import { protect } from '../middlewares/auth-middleware';

const router = express.Router();

router.post('/',protect,createKey);
router.delete('/:id/delete',protect, deleteKey);
router.get('/:id',protect,getKey);
router.get('/',protect,getAllKeys);



export default router;
