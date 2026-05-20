import '../setup'
import { verificarToken } from '../../src/middleware/authMiddleware'
import jwt from 'jsonwebtoken'

const mockRes = () => {
  const res: any = {}
  res.status = jest.fn().mockReturnValue(res)
  res.json   = jest.fn().mockReturnValue(res)
  return res
}

describe('verificarToken', () => {
  const SECRET = 'test_secret_sispod_2026'

  it('llama next() con token válido en header Authorization', () => {
    const token = jwt.sign({ id: 1, id_rol: 2 }, SECRET)
    const req: any = {
      cookies: {},
      headers: { authorization: `Bearer ${token}` },
    }
    const next = jest.fn()
    verificarToken(req, mockRes(), next)
    expect(next).toHaveBeenCalled()
    expect(req.userData).toMatchObject({ id: 1, id_rol: 2 })
  })

  it('llama next() con token válido en cookie', () => {
    const token = jwt.sign({ id: 2, id_rol: 3 }, SECRET)
    const req: any = { cookies: { token }, headers: {} }
    const next = jest.fn()
    verificarToken(req, mockRes(), next)
    expect(next).toHaveBeenCalled()
  })

  it('retorna 401 si no hay token', () => {
    const req: any = { cookies: {}, headers: {} }
    const res = mockRes()
    verificarToken(req, res, jest.fn())
    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({ message: 'No autorizado' })
  })

  it('retorna 401 con token expirado', () => {
    const token = jwt.sign({ id: 1, id_rol: 2 }, SECRET, { expiresIn: '-1s' })
    const req: any = {
      cookies: {},
      headers: { authorization: `Bearer ${token}` },
    }
    const res = mockRes()
    verificarToken(req, res, jest.fn())
    expect(res.status).toHaveBeenCalledWith(401)
  })

  it('retorna 401 con token manipulado', () => {
    const req: any = {
      cookies: {},
      headers: { authorization: 'Bearer token.invalido.aqui' },
    }
    const res = mockRes()
    verificarToken(req, res, jest.fn())
    expect(res.status).toHaveBeenCalledWith(401)
  })
})