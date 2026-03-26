import { Router } from 'express';
import { registrarPaciente,listarPacientes, obtenerPaciente, actualizarPaciente} from '../controllers/pacienteController';
import { verificarToken } from '../middleware/authMiddleware'

const router = Router();

router.post('/',registrarPaciente);
router.get('/',listarPacientes);
router.get('/:id',obtenerPaciente);
router.put('/:id',actualizarPaciente);

export default router;