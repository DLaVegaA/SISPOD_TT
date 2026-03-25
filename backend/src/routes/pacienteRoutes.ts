import { Router } from 'express';
import { registrarPaciente } from '../controllers/pacienteController';
import { verificarToken } from '../middleware/authMiddleware'

const router = Router();

router.post('/',registrarPaciente);

export default router;