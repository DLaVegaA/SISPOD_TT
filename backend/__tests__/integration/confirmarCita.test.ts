import '../setup'
import request from 'supertest'

jest.mock('../../src/config/mailer', () => ({ default: { sendMail: jest.fn(), use: jest.fn() } }))
jest.mock('../../src/config/database', () => ({
  connectBD: jest.fn(),
  sequelize: { sync: jest.fn(), transaction: jest.fn() },
}))
jest.mock('../../src/config/telegram', () => ({
  default: { launch: jest.fn(), telegram: { getMe: jest.fn() } },
}))
jest.mock('../../src/services/telegramService', () => ({ configurarBot: jest.fn() }))
jest.mock('../../src/services/azureStorageService', () => ({
  subirArchivoAzure: jest.fn(), eliminarArchivoAzure: jest.fn(),
}))
jest.mock('../../src/services/catalogoProcedimientosService', () => ({
  listarCatalogoService: jest.fn(), obtenerProcedimientoService: jest.fn(),
}))

const mockCita = {
  estado:               'Pendiente',
  recordatorio_enviado: true,
  fecha_hora_inicio:    new Date(Date.now() + 86400000), // mañana
  update:               jest.fn().mockResolvedValue(true),
}

jest.mock('../../src/models/index', () => ({
  Cita:     { findByPk: jest.fn() },
  Paciente: { findOne: jest.fn() },
  Dentista: { findOne: jest.fn() },
  Token:    { findOne: jest.fn() },
  Usuario:  { findOne: jest.fn(), findByPk: jest.fn() },
  Role:     { findOne: jest.fn() },
}))

import app    from '../../src/app'
import { Cita } from '../../src/models/index'

describe('POST /api/citas/:id/confirmar', () => {
  beforeEach(() => jest.clearAllMocks())

  it('200 — confirma correctamente', async () => {
    ;(Cita.findByPk as jest.Mock).mockResolvedValue(mockCita)
    const res = await request(app).post('/api/citas/1/confirmar').send({})
    expect(res.status).toBe(200)
    expect(mockCita.update).toHaveBeenCalledWith({ estado: 'Confirmada' })
  })

  it('400 — cita ya confirmada', async () => {
    ;(Cita.findByPk as jest.Mock).mockResolvedValue({ ...mockCita, estado: 'Confirmada' })
    const res = await request(app).post('/api/citas/1/confirmar').send({})
    expect(res.status).toBe(400)
    expect(res.body.message).toMatch(/ya está confirmada/i)
  })

  it('400 — recordatorio no enviado aún', async () => {
    ;(Cita.findByPk as jest.Mock).mockResolvedValue({ ...mockCita, recordatorio_enviado: false })
    const res = await request(app).post('/api/citas/1/confirmar').send({})
    expect(res.status).toBe(400)
  })

  it('400 — cita ya pasó', async () => {
    ;(Cita.findByPk as jest.Mock).mockResolvedValue({
      ...mockCita,
      fecha_hora_inicio: new Date(Date.now() - 86400000), // ayer
    })
    const res = await request(app).post('/api/citas/1/confirmar').send({})
    expect(res.status).toBe(400)
    expect(res.body.message).toMatch(/ya pasó/i)
  })

  it('404 — cita no existe', async () => {
    ;(Cita.findByPk as jest.Mock).mockResolvedValue(null)
    const res = await request(app).post('/api/citas/1/confirmar').send({})
    expect(res.status).toBe(404)
  })
})