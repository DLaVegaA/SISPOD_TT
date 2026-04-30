import { Router } from "express";
import {upload} from '../middleware/uploadMiddleware'
import {verificarToken} from '../middleware/authMiddleware'
import {permitirRoles} from '../middleware/rolesMiddleware'
import {crearConsentimiento} from '../controllers/consentimientoController'

const router = Router();

router.post('/', upload.single('archivo'),crearConsentimiento);


export default router;

