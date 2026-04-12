import { Router } from "express";
import {obtenerRoles} from '../controllers/rolesController';

const router = Router();

router.get('/', obtenerRoles);

export default router;