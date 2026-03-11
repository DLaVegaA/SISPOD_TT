import { Router } from 'express';
import { login, activarCuenta} from '../controllers/authController';



const router = Router();

router.post('/login',login);
router.post('/activar-cuenta/:token',activarCuenta);

export default router;