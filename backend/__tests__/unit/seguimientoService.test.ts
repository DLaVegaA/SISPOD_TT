import '../setup'

// Corta la cadena ESM antes de que Jest la cargue
jest.mock('../../src/config/mailer', () => ({
  transporter: { sendMail: jest.fn() },
}))
jest.mock('../../src/services/emailService', () => ({
  enviarCorreoBienvenida:    jest.fn(),
  enviarCorreoRecuperacion:  jest.fn(),
  enviarCorreoCuestionario:  jest.fn(),
  enviarCorreoRestablecimiento: jest.fn(),
}))

import { obtenerSeguimientoService, guardarRespuestasService } from '../../src/services/seguimientoService'
import { AppError } from '../../src/helpers/AppError'
import {
  Seguimiento, Cuestionario, CuestionarioPregunta,
  Respuesta_paciente, PreguntaBase
} from '../../src/models/index'

jest.mock('../../src/models/index', () => ({
  Seguimiento:             { findByPk: jest.fn(), findOne: jest.fn() },
  Cita:                    { findByPk: jest.fn(), update: jest.fn() },
  Catalogo_Procedimientos: { findByPk: jest.fn() },
  Usuario:                 { findByPk: jest.fn() },
  Paciente:                { findByPk: jest.fn() },
  Cuestionario:            { findByPk: jest.fn() },
  CuestionarioPregunta:    { findAll: jest.fn() },  // ← nuevo
  Respuesta_paciente:      { bulkCreate: jest.fn() }, // ← nuevo
  PreguntaBase:            { findAll: jest.fn() },    // ← nuevo
}))

describe('obtenerSeguimientoService', () => {
  it('retorna el seguimiento cuando existe', async () => {
    const mockSeg = { id_seguimiento: 1, estado_seguimiento: 'en curso' }
    ;(Seguimiento.findByPk as jest.Mock).mockResolvedValue(mockSeg)

    const result = await obtenerSeguimientoService(1)
    expect(result).toEqual(mockSeg)
    expect(Seguimiento.findByPk).toHaveBeenCalledWith(1, expect.any(Object))
  })

  it('lanza AppError 404 cuando el seguimiento no existe', async () => {
    ;(Seguimiento.findByPk as jest.Mock).mockResolvedValue(null)

    await expect(obtenerSeguimientoService(99))
      .rejects.toThrow(AppError)
    await expect(obtenerSeguimientoService(99))
      .rejects.toThrow('No se encontró el seguimiento')
  })
})

describe('guardarRespuestasService — RN13', () => {
  const mockSeguimiento = {
    id_seguimiento:      1,
    estado_seguimiento:  'en curso',
    id_cuestionario_24h: 1,
    id_cuestionario_72h: null,
    update:              jest.fn().mockResolvedValue(true),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(Seguimiento.findByPk      as jest.Mock).mockResolvedValue(mockSeguimiento)
    ;(Cuestionario.findByPk     as jest.Mock).mockResolvedValue({ id_cuestionario: 1, tipo_cuestionario: '24h' })
    ;(CuestionarioPregunta.findAll as jest.Mock).mockResolvedValue([{ id_pregunta_base: 10 }])
    ;(Respuesta_paciente.bulkCreate as jest.Mock).mockResolvedValue([])
  })

  it('no activa alerta cuando respuestas son normales', async () => {
    // Pregunta sin valor_alerta → no dispara alerta
    ;(PreguntaBase.findAll as jest.Mock).mockResolvedValue([
      { id_pregunta_base: 10, tipo_control: 'escala_1_10', valor_alerta: null },
    ])

    const result = await guardarRespuestasService(1, 1, [
      { id_pregunta_base: 10, valor_respuesta: '3' },
    ])

    expect(result.alerta).toBe(false)
    expect(mockSeguimiento.update).not.toHaveBeenCalledWith(
      expect.objectContaining({ estado_seguimiento: 'alerta' })
    )
  })

  it('activa alerta RN13 cuando dolor >= 7 y cambia estado a alerta', async () => {
    // Pregunta con umbral de alerta min=7
    ;(PreguntaBase.findAll as jest.Mock).mockResolvedValue([
      { id_pregunta_base: 10, tipo_control: 'escala_1_10', valor_alerta: { min: 7 } },
    ])

    const result = await guardarRespuestasService(1, 1, [
      { id_pregunta_base: 10, valor_respuesta: '9' },
    ])

    expect(result.alerta).toBe(true)
    expect(mockSeguimiento.update).toHaveBeenCalledWith(
      expect.objectContaining({ estado_seguimiento: 'alerta' })
    )
  })

  it('activa alerta RN13 en booleano — sangrado activo = true', async () => {
    ;(PreguntaBase.findAll as jest.Mock).mockResolvedValue([
      { id_pregunta_base: 10, tipo_control: 'booleano_si_no', valor_alerta: { valor: 'true' } },
    ])

    const result = await guardarRespuestasService(1, 1, [
      { id_pregunta_base: 10, valor_respuesta: 'true' },
    ])

    expect(result.alerta).toBe(true)
  })

  it('lanza AppError si el seguimiento está finalizado', async () => {
    ;(Seguimiento.findByPk as jest.Mock).mockResolvedValue({
      ...mockSeguimiento,
      estado_seguimiento: 'finalizado',
    })

    await expect(
      guardarRespuestasService(1, 1, [{ id_pregunta_base: 10, valor_respuesta: '5' }])
    ).rejects.toThrow('No se pueden registrar respuestas en un seguimiento cerrado')
  })
})