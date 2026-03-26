import { Router } from 'express';
import { registrarPaciente,listarPacientes, obtenerPaciente} from '../controllers/pacienteController';
import { verificarToken } from '../middleware/authMiddleware'

const router = Router();

router.post('/',registrarPaciente);
router.get('/',listarPacientes);
router.get('/:id',obtenerPaciente);

export default router;