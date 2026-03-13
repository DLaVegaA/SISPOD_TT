import { Router } from 'express';
import { login, activarCuenta,cerrarSesion} from '../controllers/authController';



const router = Router();

router.post('/login',login);
router.post('/activar-cuenta/:token',activarCuenta);
router.post('/cerrar-sesion', cerrarSesion);

export default router;