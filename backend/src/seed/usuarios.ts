import bcrypt from 'bcryptjs'

const usuarios= [
    {
        id_rol: 1,
        nombre: 'Ian Imanol',
        apellido_paterno: 'Gonzalez',
        apellido_materno: 'Gonzalez',
        correo: 'imanol@mail.com',
        contrasena: bcrypt.hashSync('password',10),
        telefono: '5580187642',
        fecha_nacimiento: '2003-02-05',
        curp: 'GOGI030205HMCNNNA7',
        genero:'Masculino'

    }
]

export default usuarios;