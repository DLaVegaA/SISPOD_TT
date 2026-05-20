import '../setup'
import request from 'supertest'
import jwt from 'jsonwebtoken'

// ── Mocks — deben ir ANTES de cualquier import del proyecto ──────────────────
jest.mock('../../src/config/mailer', () => ({
  transporter: { sendMail: jest.fn() },
}))
jest.mock('../../src/config/database', () => ({
  connectBD: jest.fn().mockResolvedValue(true),
  sequelize: { sync: jest.fn().mockResolvedValue(true), transaction: jest.fn() },
}))
jest.mock('../../src/config/telegram', () => ({
  default: { launch: jest.fn(), telegram: { getMe: jest.fn() } },
}))
jest.mock('../../src/services/telegramService', () => ({
  configurarBot: jest.fn(),
}))
jest.mock('../../src/services/azureStorageService', () => ({
  subirArchivoAzure:    jest.fn().mockResolvedValue('https://fake-url.blob.core.windows.net/test.pdf'),
  eliminarArchivoAzure: jest.fn().mockResolvedValue(true),
}))
jest.mock('../../src/services/catalogoProcedimientosService', () => ({
  listarCatalogoService: jest.fn().mockResolvedValue([]),
  obtenerProcedimientoService: jest.fn().mockResolvedValue({
    id_procedimiento:     1,
    nombre_procedimiento: 'Exodoncia simple',
    dias_seguimiento:     3,
  }),
}))
jest.mock('../../src/models/index', () => ({
  Seguimiento:             { findByPk: jest.fn(), findOne: jest.fn(), findAll: jest.fn(), findAndCountAll: jest.fn() },
  Cita:                    { findByPk: jest.fn(), update: jest.fn() },
  Catalogo_Procedimientos: { findByPk: jest.fn() },
  Cuestionario:            { findByPk: jest.fn() },
  CuestionarioPregunta:    { findAll: jest.fn() },
  Respuesta_paciente:      { bulkCreate: jest.fn() },
  PreguntaBase:            { findAll: jest.fn() },
  Usuario:                 { findOne: jest.fn(), findByPk: jest.fn() },
  Paciente:                { findOne: jest.fn(), findByPk: jest.fn() },
  Dentista:                { findOne: jest.fn(), findByPk: jest.fn() },
  Token:                   { findOne: jest.fn() },
  Role:                    { findOne: jest.fn() },
}))

import app from '../../src/app'
import {
  Seguimiento,
  Cita,
  Cuestionario,
  CuestionarioPregunta,
  Respuesta_paciente,
  PreguntaBase,
  Paciente,
} from '../../src/models/index'

const SECRET         = process.env.JWT_SECRET ?? 'test_secret_sispod_2026'
const tokenDentista  = jwt.sign({ id: 1, id_rol: 2 }, SECRET)
const tokenPaciente  = jwt.sign({ id: 5, id_rol: 3 }, SECRET)
const tokenAsistente = jwt.sign({ id: 6, id_rol: 4 }, SECRET)

// ════════════════════════════════════════════════════════════════════════════
// SUITE 1 — Control de acceso por roles
// ════════════════════════════════════════════════════════════════════════════
describe('Seguimiento — control de acceso', () => {
  beforeEach(() => jest.clearAllMocks())

  it('GET /api/seguimiento — paciente ve sus seguimientos (200)', async () => {
    // Paciente encontrado → el servicio puede filtrar por id_paciente
    ;(Paciente.findOne as jest.Mock).mockResolvedValue({ id_paciente: 5 })
    ;(Seguimiento.findAndCountAll as jest.Mock).mockResolvedValue({ count: 0, rows: [] })

    const res = await request(app)
      .get('/api/seguimiento')
      .set('Authorization', `Bearer ${tokenPaciente}`)

    expect(res.status).toBe(200)
  })

  it('POST /api/seguimiento — asistente no puede crear seguimiento (403)', async () => {
    const res = await request(app)
      .post('/api/seguimiento')
      .set('Authorization', `Bearer ${tokenAsistente}`)
      .send({ id_cita: 1, id_procedimiento: 1 })

    expect(res.status).toBe(403)
  })

  it('POST /api/seguimiento — sin token retorna 401', async () => {
    const res = await request(app)
      .post('/api/seguimiento')
      .send({ id_cita: 1, id_procedimiento: 1 })

    expect(res.status).toBe(401)
  })

  it('POST /api/seguimiento — dentista crea seguimiento (201)', async () => {
    ;(Cita.findByPk as jest.Mock).mockResolvedValue({ id_cita: 1 })
    ;(Seguimiento.findOne as jest.Mock).mockResolvedValue(null)
    ;(Seguimiento as any).create = jest.fn().mockResolvedValue({ id_seguimiento: 10 })
    ;(Cita.update as jest.Mock).mockResolvedValue([1])

    const res = await request(app)
      .post('/api/seguimiento')
      .set('Authorization', `Bearer ${tokenDentista}`)
      .send({ id_cita: 1, id_procedimiento: 1 })

    expect(res.status).toBe(201)
    expect(res.body).toHaveProperty('seguimiento')
  })
})

// ════════════════════════════════════════════════════════════════════════════
// SUITE 2 — RN13 Alerta de complicaciones
// ════════════════════════════════════════════════════════════════════════════
describe('RN13 — alerta de complicaciones vía HTTP', () => {
  // Mock del seguimiento con método update
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

  it('respuestas normales → 201, sin alerta, estado no cambia', async () => {
    ;(PreguntaBase.findAll as jest.Mock).mockResolvedValue([
      { id_pregunta_base: 10, tipo_control: 'escala_1_10', valor_alerta: null },
    ])

    const res = await request(app)
      .post('/api/seguimiento/1/respuestas')
      .set('Authorization', `Bearer ${tokenPaciente}`)
      .send({
        id_cuestionario: 1,
        respuestas: [{ id_pregunta_base: 10, valor_respuesta: '3' }],
      })

    expect(res.status).toBe(201)
    expect(res.body.alerta).toBe(false)
    expect(mockSeguimiento.update).not.toHaveBeenCalledWith(
      expect.objectContaining({ estado_seguimiento: 'alerta' })
    )
  })

  it('sangrado activo = true → 201, alerta activada, estado cambia a "alerta" — RN13', async () => {
    ;(PreguntaBase.findAll as jest.Mock).mockResolvedValue([
      { id_pregunta_base: 10, tipo_control: 'booleano_si_no', valor_alerta: { valor: 'true' } },
    ])

    const res = await request(app)
      .post('/api/seguimiento/1/respuestas')
      .set('Authorization', `Bearer ${tokenPaciente}`)
      .send({
        id_cuestionario: 1,
        respuestas: [{ id_pregunta_base: 10, valor_respuesta: 'true' }],
      })

    expect(res.status).toBe(201)
    expect(res.body.alerta).toBe(true)
    expect(mockSeguimiento.update).toHaveBeenCalledWith(
      expect.objectContaining({ estado_seguimiento: 'alerta' })
    )
  })
})