import { verificarToken } from '../middleware/authMiddleware';
import { permitirRoles } from '../middleware/rolesMiddleware';
import { Router } from 'express';
import {
    crearSeguimiento,
    listarSeguimientos,
    obtenerSeguimiento,
    editarSeguimiento,
    cancelarSeguimiento,
    finalizarSeguimiento,
    obtenerCuestionarioSeguimiento,
    guardarRespuestas,
    obtenerRespuestasSeguimiento,
    resolverAlerta
} from '../controllers/seguimientoController';

const router = Router();

// Gestión de seguimientos (dentista)
router.post('/', verificarToken, permitirRoles(2), crearSeguimiento);
router.get('/', verificarToken, listarSeguimientos);
router.get('/:id_seguimiento', verificarToken, obtenerSeguimiento);
router.put('/:id_seguimiento', verificarToken, permitirRoles(2), editarSeguimiento);
router.patch('/:id_seguimiento/cancelar', verificarToken, permitirRoles(2), cancelarSeguimiento);

// BUG FIX: endpoint correcto para finalizar (CU16) — antes llamaba a /cancelar
router.patch('/:id_seguimiento/finalizar', verificarToken, permitirRoles(2), finalizarSeguimiento);

// Cuestionario para el paciente (CU22)
router.get('/:id_seguimiento/cuestionario/:tipo_cuestionario', verificarToken, obtenerCuestionarioSeguimiento);
router.post('/:id_seguimiento/respuestas', verificarToken, guardarRespuestas);
router.get('/:id_seguimiento/respuestas', verificarToken, permitirRoles(2), obtenerRespuestasSeguimiento);
router.patch('/:id_seguimiento/resolver-alerta', verificarToken, permitirRoles(2), resolverAlerta);

export default router;