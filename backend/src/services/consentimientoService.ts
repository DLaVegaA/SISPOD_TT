import {Consentimiento} from '../models/index'
import {subirArchivoAzure} from '../services/azureStorageService';
import {AppError} from '../helpers/AppError'
import {obtenerCitaId} from '../services/citaService'
import fs from 'fs';

export const crearConsentimientoService = async (file: Express.Multer.File, id_cita: number) => {
  const cita = await obtenerCitaId(id_cita);
    if (!cita) {
        throw new AppError('La cita no existe', 404);
    }
  const existe = await verificarConsentimientoEnCita(id_cita);

  if (existe) {
    throw new AppError('La cita ya tiene un consentimiento', 400);
  }

  const safeName = file.originalname.replace(/\s+/g, '-');
  const blobName = `consentimientos/${id_cita}-${Date.now()}-${safeName}`;

  try {
    const nombreSubido = await subirArchivoAzure(file.path, blobName);

    const consentimiento = await Consentimiento.create({
      id_cita,
      nombre_archivo: nombreSubido,
      fecha_consentimiento: new Date()
    });

    return consentimiento;

  } finally {
    if (file?.path) {
      try {
        fs.unlinkSync(file.path);
      } catch (err) {
        console.error('Error al borrar archivo local:', err);
      }
    }
  }
};

const verificarConsentimientoEnCita = async(id_cita:number)=>{
    const existe = await Consentimiento.findOne({
        where:{
            id_cita
        }
    });
    return !!existe;
}