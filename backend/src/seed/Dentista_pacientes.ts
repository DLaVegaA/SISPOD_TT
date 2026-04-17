import { sequelize } from '../config/database';
import { Usuario, Paciente, Direccion, Expediente, Dentista } from '../models/index';

// =====================================================================
// 1. SEED PARA CREAR AL DENTISTA (Requisito para los expedientes)
// =====================================================================
export const seedDentista = async () => {
    try {
        console.log('Iniciando generación de Dentista de prueba...');

        const correoDentista = "dr.prueba@sispod.com";
        const existe = await Usuario.findOne({ where: { correo: correoDentista } });

        if (!existe) {
            const t = await sequelize.transaction();
            try {
                // Crear Usuario (Rol 2 = Dentista)
                const nuevoUsuario = await Usuario.create({
                    nombre: "Doctor",
                    apellido_paterno: "Sistema",
                    apellido_materno: "SISPOD",
                    correo: correoDentista,
                    contrasena: "Password123", // El hook beforeCreate lo encriptará
                    telefono: "5599887766",
                    fecha_nacimiento: "1980-05-15",
                    curp: "DOCS800515HDFRRS00",
                    genero: "Masculino",
                    id_rol: 2, 
                    estado: "activo"
                }, { transaction: t });

                // Crear el Dentista ligado a ese usuario
                await Dentista.create({
                    id_usuario: nuevoUsuario.id_usuario,
                    no_cedula: "CEDULA12345"
                }, { transaction: t });

                await t.commit();
                console.log(`✅ Dentista creado con éxito: ${correoDentista}`);
            } catch (error) {
                await t.rollback();
                console.error('[-] Error al crear el Dentista:', error);
            }
        } else {
            console.log(`[~] El Dentista ${correoDentista} ya existe. Saltando...`);
        }
    } catch (error) {
        console.error('Error general en el seed de dentistas:', error);
    }
};


// =====================================================================
// 2. SEED PARA CREAR MÚLTIPLES PACIENTES
// =====================================================================
const generarCurpUnica = (indice: number): string => {
    const homoclave = indice.toString().padStart(2, '0');
    return `SISP900515HDFRRS${homoclave}`;
};

export const seedPacientes = async () => {
    const CANTIDAD_A_CREAR = 10; // Cambia esto para generar más o menos pacientes

    try {
        console.log(`Iniciando generación de ${CANTIDAD_A_CREAR} pacientes de prueba...`);

        // Buscamos un dentista activo para asignarle los expedientes
        const dentistaBase = await Dentista.findOne({
            include: [{
                model: Usuario,
                as: 'usuario',
                where: { estado: 'activo' }
            }]
        });

        if (!dentistaBase) {
            console.log('⚠️ ERROR: No se encontró ningún Dentista. Corre seedDentista() primero.');
            return;
        }

        for (let i = 1; i <= CANTIDAD_A_CREAR; i++) {
            const correoUnico = `paciente_prueba${i}@sispod.com`;
            const curpUnica = generarCurpUnica(i);

            const existe = await Usuario.findOne({ where: { correo: correoUnico } });
            
            if (!existe) {
                const t = await sequelize.transaction();
                
                try {
                    // 1. Crear Usuario (Rol 3 = Paciente)
                    const nuevoUsuario = await Usuario.create({
                        nombre: `PacientePrueba${i}`,
                        apellido_paterno: "Sistema",
                        apellido_materno: "ESCOM",
                        correo: correoUnico,
                        contrasena: "Password123", 
                        telefono: "55" + i.toString().padStart(8, '0'), 
                        fecha_nacimiento: "1990-05-15",
                        curp: curpUnica,
                        genero: i % 2 === 0 ? "Femenino" : "Masculino",
                        id_rol: 3, 
                        estado: "activo" 
                    }, { transaction: t });

                    // 2. Crear Paciente 
                    const nuevoPaciente = await Paciente.create({
                        id_usuario: nuevoUsuario.id_usuario
                    }, { transaction: t });

                    // 3. Crear Dirección
                    await Direccion.create({
                        id_paciente: nuevoPaciente.id_paciente,
                        calle: "Av. Juan de Dios Bátiz",
                        num_ext: "S/N",
                        colonia: "Nueva Industrial Vallejo",
                        municipio: "Gustavo A. Madero",
                        estado: "CDMX",
                        codigo_postal: "07738"
                    }, { transaction: t });

                    // 4. Crear Expediente (Ligado al Paciente y al Dentista)
                    await Expediente.create({
                        id_paciente: nuevoPaciente.id_paciente,
                        id_dentista: dentistaBase.id_dentista,
                        observaciones_generales: `Expediente generado automáticamente. Paciente de prueba #${i}.`
                    }, { transaction: t });

                    await t.commit();
                    console.log(`[+] Paciente ${i} (con expediente) creado con éxito: ${correoUnico}`);
                } catch (error) {
                    await t.rollback();
                    console.error(`[-] Error al crear al paciente ${i}:`, error);
                }
            } else {
                console.log(`[~] El paciente ${correoUnico} ya existe. Saltando...`);
            }
        }
        
        console.log('✅ Seed de pacientes finalizado correctamente.');
    } catch (error) {
        console.error('Error general en el seed de pacientes:', error);
    }
};