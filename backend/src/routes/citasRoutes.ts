import { Router } from "express";
import {crearCita, listarDisponibilidad, listarCitas, editarCita, cancelarCita} from '../controllers/citaController';
import {verificarToken} from '../middleware/authMiddleware';
import {permitirRoles} from '../middleware/rolesMiddleware';

const router = Router();

router.post('/',verificarToken, permitirRoles(2,3,4), crearCita);
router.post('/', crearCita);
router.get('/disponibilidad', listarDisponibilidad);
router.get('/',verificarToken, listarCitas);
router.put('/:id', verificarToken, editarCita);
router.patch('/:id/cancelar', verificarToken, cancelarCita);

export default router;