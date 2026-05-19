import { Router } from "express";
import {verificarToken} from '../middleware/authMiddleware'
import {permitirRoles} from '../middleware/rolesMiddleware'
import {actualizarOdontograma,crearOdontograma,obtenerOdontogramaPorExpediente} from '../controllers/odontogramaController'


const router = Router()

router.post('/',verificarToken,crearOdontograma);
router.get('/expediente/:id_expediente', verificarToken, obtenerOdontogramaPorExpediente);
router.put('/:id_odontograma', verificarToken, actualizarOdontograma);


export default router;