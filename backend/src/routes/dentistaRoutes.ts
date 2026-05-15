import {Router} from 'express';
import {
    registrarDentista,
    listarDentistas, 
    obtenerDentista,
    actualizarDentista, 
    obtenerPerfilDentista,
    actualizarPerfilDentista
} from '../controllers/dentistaController';
import {verificarToken} from '../middleware/authMiddleware';
import {permitirRoles} from '../middleware/rolesMiddleware';


const router = Router();

router.post('/',registrarDentista);
router.get('/',listarDentistas);
router.get('/me',verificarToken, permitirRoles(2),obtenerPerfilDentista);
router.put('/me', verificarToken, permitirRoles(2), actualizarPerfilDentista);
router.get('/:id',obtenerDentista);
router.put('/:id', actualizarDentista);

export default router;