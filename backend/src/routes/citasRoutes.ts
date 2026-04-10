import { Router } from "express";
import {crearCita, listarDisponibilidad} from '../controllers/citaController';
import {verificarToken} from '../middleware/authMiddleware';
import {permitirRoles} from '../middleware/rolesMiddleware';

const router = Router();

// router.post('/',verificarToken, permitirRoles(2,3,4), crearCita);
router.post('/', crearCita);
router.get('/disponibilidad', listarDisponibilidad);

export default router;