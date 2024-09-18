import express from 'express';
import {
	loginUser,logoutUser,registerUser
} from '../controllers/user';

const router = express.Router();

router.post('/', registerUser);
router.post('/auth', loginUser);
router.post('/logout', logoutUser);



export default router;
