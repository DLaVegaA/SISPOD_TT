import { Router } from "express";
import {verificarToken} from  '../middleware/authMiddleware';
import {permitirRoles} from  '../middleware/rolesMiddleware';
import {crearCuestionario} from '../controllers/cuestionarioController';


const router  =Router()

router.post('/', verificarToken, crearCuestionario)


export default router;