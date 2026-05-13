import { Router } from "express";
import {verificarToken} from '../middleware/authMiddleware';
import {permitirRoles} from '../middleware/rolesMiddleware';
import {
    crearBitacora,
    editarBitacora,
    eliminarBitacora,
    listarBitacora,
    obtenerBitacora,
    revisarBitacora
} from '../controllers/bitacoraController'


const router = Router();

router.post('/', verificarToken, crearBitacora)
router.put('/:id', verificarToken, editarBitacora);
router.delete('/:id/eliminar', verificarToken,eliminarBitacora);
router.get('/', verificarToken, listarBitacora);
router.get('/:id', verificarToken, obtenerBitacora);
router.patch('/:id/revisar', verificarToken, permitirRoles(2), revisarBitacora);

export default router;