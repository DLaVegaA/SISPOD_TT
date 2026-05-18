import { Padecimiento } from '../models/index';
import { AppError } from '../helpers/AppError';

export const obtenerPadecimientosService = async (categoria: any) => {
  const where: any = {};
  if (categoria) {
    where.categoria_padecimiento = categoria;
  }

  const padecimientos = await Padecimiento.findAll({
    where,
    attributes: ['id_padecimiento', 'nombre_padecimiento', 'categoria_padecimiento'],
    limit: 20,
  });

  const listaPadecimientos = padecimientos.map((p: any) => ({
    id_padecimiento: p.id_padecimiento,
    nombre_padecimiento: p.nombre_padecimiento,
    categoria_padecimiento: p.categoria_padecimiento,
  }));

  return listaPadecimientos;
};
