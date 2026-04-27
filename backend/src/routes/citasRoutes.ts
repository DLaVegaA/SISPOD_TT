import { Router } from "express";
import {crearCita, listarDisponibilidad, listarCitas, editarCita, cancelarCita} from '../controllers/citaController';
import {verificarToken} from '../middleware/authMiddleware';
import {permitirRoles} from '../middleware/rolesMiddleware';

const router = Router();

router.post('/',verificarToken, permitirRoles(2,3,4), crearCita);
router.get('/disponibilidad', listarDisponibilidad);
router.get('/',verificarToken, listarCitas);
router.post('/:id', verificarToken, editarCita);
router.post('/:id/cancelar', verificarToken, cancelarCita);

export default router;