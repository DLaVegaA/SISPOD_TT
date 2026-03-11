import { Router } from 'express';
import { crearDireccionPaciente } from '../controllers/pacienteController';
import { verificarToken } from '../middleware/authMiddleware'

const router = Router();

router.post('/:id/direccion',crearDireccionPaciente);

export default router;