import { Router } from "express";
import {verificarToken} from '../middleware/authMiddleware';
import {permitirRoles} from '../middleware/rolesMiddleware';
import {
    crearBitacora,
    editarBitacora
} from '../controllers/bitacoraController'


const router = Router();

router.post('/', verificarToken, crearBitacora)
router.put('/:id', verificarToken, editarBitacora);

export default router;