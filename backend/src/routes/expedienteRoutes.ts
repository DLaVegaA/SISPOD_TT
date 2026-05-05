import { Router } from "express";
import {verificarToken } from '../middleware/authMiddleware';
import {permitirRoles} from '../middleware/rolesMiddleware';
import {
    crearExpediente,
    agregarPadecimiento,
    obtenerExpediente,
    eliminarPadecimiento
} from '../controllers/expedienteController';

const router = Router();

router.post('/', verificarToken,crearExpediente);
router.post('/:id_expediente/padecimiento',verificarToken, agregarPadecimiento);
router.get('/:id_expediente', verificarToken, obtenerExpediente);
router.delete('/:id_expediente/padecimientos/:id_padecimiento', eliminarPadecimiento);
export default router;
