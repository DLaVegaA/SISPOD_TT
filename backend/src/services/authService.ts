// backend/src/services/authService.ts
import { Op } from 'sequelize';
import { Token } from '../models/index';

export const verificarTokenReset = async (token: string) => {
  const registro = await Token.findOne({ where: { token } });

  if (!registro) {
    throw new Error('Token_No_existe');
  }

  // ✅ Implementar la validación que tenía el TODO
  if (registro.expira_en < new Date()) {
    throw new Error('Token_Expirado');
  }

  return registro;
};