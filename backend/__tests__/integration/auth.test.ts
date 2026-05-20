import '../setup'
import request from 'supertest'

jest.mock('../../src/config/mailer', () => ({ transporter: { sendMail: jest.fn() } }))
jest.mock('../../src/config/database', () => ({
  connectBD: jest.fn().mockResolvedValue(true),
  sequelize: { sync: jest.fn().mockResolvedValue(true), transaction: jest.fn() },
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
jest.mock('../../src/models/index', () => ({
  Usuario:   { findOne: jest.fn(), findByPk: jest.fn(), update: jest.fn() },
  Paciente:  { findOne: jest.fn() },
  Dentista:  { findOne: jest.fn() },
  Asistente: { findOne: jest.fn() },
  Token:     { findOne: jest.fn(), create: jest.fn() },
  Direccion: { findOne: jest.fn() },
  Role:      { findOne: jest.fn() },
}))

import app from '../../src/app'
import { Usuario } from '../../src/models/index'

describe('POST /api/auth/login', () => {
  beforeEach(() => jest.clearAllMocks())

  it('retorna 200 y token con credenciales correctas', async () => {
    ;(Usuario.findOne as jest.Mock).mockResolvedValue({
      id_usuario:        1,
      correo:            'dentista@test.com',
      estado:            'activo',
      intentos_fallidos: 0,
      id_rol:            2,
      nombre:            'Test',
      validarPassword:   jest.fn().mockResolvedValue(true),  // ← método del modelo
      update:            jest.fn(),
    })

    const res = await request(app)
      .post('/api/auth/login')
      .send({ correo: 'dentista@test.com', password: 'TestPass2024!' })  // ← password no contrasena

    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('token')
  })

  it('retorna 401 con contraseña incorrecta', async () => {
    ;(Usuario.findOne as jest.Mock).mockResolvedValue({
      id_usuario:        1,
      correo:            'dentista@test.com',
      estado:            'activo',
      intentos_fallidos: 0,
      id_rol:            2,
      validarPassword:   jest.fn().mockResolvedValue(false),  // ← false = contraseña inválida
      update:            jest.fn(),
    })

    const res = await request(app)
      .post('/api/auth/login')
      .send({ correo: 'dentista@test.com', password: 'Incorrecta123!' })

    expect(res.status).toBe(401)
  })

  it('retorna 404 si el usuario no existe', async () => {
    ;(Usuario.findOne as jest.Mock).mockResolvedValue(null)

    const res = await request(app)
      .post('/api/auth/login')
      .send({ correo: 'noexiste@test.com', password: 'TestPass2024!' })

    expect(res.status).toBe(404)
  })

  it('retorna 403 si la cuenta no está activa — RNF-5', async () => {
    ;(Usuario.findOne as jest.Mock).mockResolvedValue({
      id_usuario:        1,
      correo:            'bloqueado@test.com',
      estado:            'bloqueado',   // ← distinto de 'activo' → 403
      intentos_fallidos: 5,
      id_rol:            3,
      validarPassword:   jest.fn(),
      update:            jest.fn(),
    })

    const res = await request(app)
      .post('/api/auth/login')
      .send({ correo: 'bloqueado@test.com', password: 'TestPass2024!' })

    expect(res.status).toBe(403)
  })
})