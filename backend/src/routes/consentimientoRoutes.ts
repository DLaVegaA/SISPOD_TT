import { Router } from "express";
import {upload} from '../middleware/uploadMiddleware'
import {verificarToken} from '../middleware/authMiddleware'
import {permitirRoles} from '../middleware/rolesMiddleware'
import {crearConsentimiento, verConsentimiento} from '../controllers/consentimientoController'

const router = Router();

router.post('/', upload.single('archivo'),crearConsentimiento);
router.get('/cita/:id_cita',verConsentimiento);

export default router;

