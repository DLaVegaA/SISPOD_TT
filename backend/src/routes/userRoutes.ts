import {Router} from 'express';
import {registrarUsuario} from '../controllers/userController';

const router = Router();

router.post('/usuarios', registrarUsuario);

export default router;
