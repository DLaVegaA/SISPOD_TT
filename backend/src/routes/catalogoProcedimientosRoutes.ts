import {verificarToken} from '../middleware/authMiddleware';
import {permitirRoles} from '../middleware/rolesMiddleware'
import {listarCatalogoProcedimientos, obtenerProcedimiento} from '../controllers/catalogoProcedimientosController'
import { Router } from 'express';


const router = Router();

router.get('/', verificarToken, permitirRoles(2,4), listarCatalogoProcedimientos);
router.get('/:id_procedimiento', verificarToken, permitirRoles(2,4), obtenerProcedimiento);

export default router