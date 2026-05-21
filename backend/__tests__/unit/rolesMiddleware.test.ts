import '../setup'
import { permitirRoles } from '../../src/middleware/rolesMiddleware'

const mockRes = () => {
  const res: any = {}
  res.status = jest.fn().mockReturnValue(res)
  res.json   = jest.fn().mockReturnValue(res)
  return res
}

describe('permitirRoles', () => {
  it('llama next() cuando el rol está permitido', () => {
    const req: any = { userData: { id: 1, id_rol: 2 } }
    const next = jest.fn()
    permitirRoles(2)(req, mockRes(), next)
    expect(next).toHaveBeenCalled()
  })

  it('retorna 403 cuando el rol NO está permitido', () => {
    const req: any = { userData: { id: 5, id_rol: 3 } } // paciente intentando acceso de dentista
    const res = mockRes()
    permitirRoles(2)(req, res, jest.fn())
    expect(res.status).toHaveBeenCalledWith(403)
    expect(res.json).toHaveBeenCalledWith({ message: 'No tienes permisos' })
  })

  it('retorna 401 si no hay userData (token no verificado)', () => {
    const req: any = {}
    const res = mockRes()
    permitirRoles(2)(req, res, jest.fn())
    expect(res.status).toHaveBeenCalledWith(401)
  })

  it('permite múltiples roles — acepta cualquiera del array', () => {
    const reqDentista:  any = { userData: { id: 1, id_rol: 2 } }
    const reqAsistente: any = { userData: { id: 2, id_rol: 4 } }
    const next = jest.fn()
    permitirRoles(1, 2, 4)(reqDentista,  mockRes(), next)
    permitirRoles(1, 2, 4)(reqAsistente, mockRes(), next)
    expect(next).toHaveBeenCalledTimes(2)
  })
})