import { Router } from 'express';
import { registrarPaciente,listarPacientes, obtenerPaciente, actualizarPaciente,obtenerPerfilPaciente} from '../controllers/pacienteController';
import { verificarToken } from '../middleware/authMiddleware'
import { permitirRoles } from '../middleware/rolesMiddleware'

const router = Router();

router.post('/', verificarToken, permitirRoles(1, 2, 4), registrarPaciente);
router.get('/',listarPacientes);
router.get('/me', verificarToken,permitirRoles(3),obtenerPerfilPaciente); //Primero las rutas fijas
router.get('/:id',obtenerPaciente); //despues rutas con parametros
router.put('/:id', verificarToken, actualizarPaciente);

export default router;