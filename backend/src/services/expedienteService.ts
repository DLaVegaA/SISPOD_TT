import { Expediente, Dentista, Expediente_Padecimientos, Padecimiento } from "../models/index";
import { AppError } from "../helpers/AppError";


export const crearExpedienteService = async(data:any,user:any) =>{
    const dentista = await Dentista.findOne({where:{id_usuario:user.id}});
    if(!dentista){
        throw new AppError('Dentista no encontrado',404);
    }

    const existeExpediente = await Expediente.findOne({where:{id_paciente:data.id_paciente}});

    if(existeExpediente){
        throw new AppError('El paciente ya tiene un expediente',400);
    }

    const expediente = await Expediente.create({
        id_paciente:data.id_paciente,
        id_dentista:dentista.id_dentista,
        fecha_creacion:new Date(),
        observaciones_generales:data.observaciones_generales
    });

    return expediente;

}

export const agregarPadecimientoService = async(id_expediente:number,data:any)=>{
    const expediente = await Expediente.findByPk(id_expediente);

    if(!expediente){
        throw new AppError('Expediente no encontrado', 404);
    }

    const existe = await Expediente_Padecimientos.findOne({
        where:{
            id_expediente:expediente.id_expediente,
            id_padecimiento:data.id_padecimiento
        }
    });

    if(existe){
        throw new AppError('Este padecimiento ya está registrado',400);
    }

    return await Expediente_Padecimientos.create({
        id_expediente:expediente.id_expediente,
        id_padecimiento:data.id_padecimiento,
        tipo_antecedente: data.tipo_antecedente ||null,
        nota:data.nota ||null
    });
}

export const obtenerExpedienteService = async(id_expediente:number) =>{

    const expediente = await Expediente.findByPk(id_expediente,
        {
            include:[
                {
                    model:Expediente_Padecimientos,
                    as:'padecimientos',
                    include:[
                        {
                            model:Padecimiento,
                            as:'padecimiento'
                        }
                    ]
                }
            ]
        }
    ) as any;

    if(!expediente){
        throw new AppError('Expediente no encontrado',404);
    }

    const expedienteLimpio ={
        id_expediente:expediente.id_expediente,
        observaciones_generales: expediente.observaciones_generales,
        padecimientos :expediente.padecimientos.map((p:any) => ({
            id: p.id_padecimiento,
            nombre: p.nombre_padecimiento,
            categoria: p.padecimiento.categoria_padecimiento,
            tipo_antecedente: p.tipo_antecedente,
            nota: p.nota
        }))
    }

    return expedienteLimpio;
}

export const eliminarPadecimientoService = async(id_expediente:number,id_padecimiento:number) =>{
    const registro = await Expediente_Padecimientos.findOne({
        where:{
            id_expediente, 
            id_padecimiento
        }
    });

    if(!registro){
        throw new AppError('El padecimiento no está en el expediente', 404);
    }

    registro.destroy();
}


export const listarExpedientesService = async(limit:number, offset:number)=>{
    const {count, rows} = await Expediente.findAndCountAll(
        {
            limit,
            offset,
            include:[
                {
                    model:Expediente_Padecimientos,
                    as:'padecimientos',
                    include:[
                        {
                            model:Padecimiento,
                            as:'padecimiento'
                        }
                    ]
                }
            ]
        }
    ) as any;

    

    const listaExpedientes = rows.map((r:any)=>({
        id_expediente:r.id_expediente,
        observaciones_generales: r.observaciones_generales,
        padecimientos :r.padecimientos.map((p:any) => ({
            id: p.id_padecimiento,
            nombre: p.nombre_padecimiento,
            categoria: p.padecimiento.categoria_padecimiento,
            tipo_antecedente: p.tipo_antecedente,
            nota: p.nota
        }))  
    }))

    

    return {
        listaExpedientes,
        total:count,
        totalPaginas:count === 0 ? 1 :Math.ceil(count/limit),
        limitResponse:limit
    };
}