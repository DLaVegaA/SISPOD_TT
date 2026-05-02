import { Router } from "express";
import {upload} from '../middleware/uploadMiddleware'
import {verificarToken} from '../middleware/authMiddleware'
import {permitirRoles} from '../middleware/rolesMiddleware'
import {crearConsentimiento, verConsentimiento, eliminarConsentimiento} from '../controllers/consentimientoController'

const router = Router();

router.post('/', upload.single('archivo'),crearConsentimiento);
router.get('/cita/:id_cita',verConsentimiento);
router.delete('/cita/:id_cita', eliminarConsentimiento)

export default router;

