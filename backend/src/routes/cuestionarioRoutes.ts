import { Router } from 'express';
import { verificarToken } from '../middleware/authMiddleware';
import { permitirRoles } from '../middleware/rolesMiddleware';
import {
    crearCuestionario,
    listarCuestionarios,
    asignarPreguntas,
    listarPreguntasDeCuestionario,
    desactivarCuestionario
} from '../controllers/cuestionarioController';

const router = Router();

// GET  /cuestionario                         → lista de cuestionarios del dentista
router.get('/', verificarToken, listarCuestionarios);

// POST /cuestionario                         → crear cuestionario (dentista)
router.post('/', verificarToken, permitirRoles(2), crearCuestionario);

// POST /cuestionario/:id_cuestionario/preguntas  → asignar/reemplazar preguntas
router.post('/:id_cuestionario/preguntas', verificarToken, permitirRoles(2), asignarPreguntas);

// GET  /cuestionario/:id_cuestionario/preguntas  → ver preguntas del cuestionario
router.get('/:id_cuestionario/preguntas', verificarToken, listarPreguntasDeCuestionario);

// PATCH /cuestionario/:id_cuestionario  → desactivar cuestionario
router.patch('/:id_cuestionario', verificarToken, permitirRoles(2), desactivarCuestionario);

export default router;