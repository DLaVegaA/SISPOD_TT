import { Router } from 'express';
import { login, activarCuenta,cerrarSesion, olvidoContrasena, resetPassword} from '../controllers/authController';
import {verificarToken} from '../middleware/authMiddleware';
import {permitirRoles} from '../middleware/rolesMiddleware';


const router = Router();

router.post('/login',login);
router.post('/cerrar-sesion',verificarToken,permitirRoles(1,2,3,4) ,cerrarSesion);

router.post('/activar-cuenta/:token',activarCuenta);
router.post('/forgot-password', olvidoContrasena);
router.post('/reset-password/:token', resetPassword);

export default router;