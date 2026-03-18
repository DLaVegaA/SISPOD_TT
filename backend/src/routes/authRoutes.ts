import { Router } from 'express';
import { login, activarCuenta,cerrarSesion, olvidoContrasena, resetPassword} from '../controllers/authController';



const router = Router();

router.post('/login',login);
router.post('/activar-cuenta/:token',activarCuenta);
router.post('/cerrar-sesion', cerrarSesion);
router.post('/forgot-password', olvidoContrasena);
router.post('/reset-password/:token', resetPassword);

export default router;