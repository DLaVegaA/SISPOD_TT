import {Cita} from '../models/index';
import {Op} from 'sequelize';

type CitaFormateada = {
    inicio:string,
    fin:string
}
type TiposCita = {
  [key: number]: number
}

const tipos:TiposCita = {
    1:60,
    2:30
}
export const validarTipoCita =(tipo_cita:number)=>{
    const tipo = Number(tipo_cita);

    if(isNaN(tipo)){
        throw new Error('Tipo_cita_invalido');
    }
    const duracion = tipos[tipo_cita];
    if(!duracion){
        throw new Error('Tipo_cita_invalido');
    }
    return {tipo, duracion};

}

const generarSlots = (inicio:string, fin:string, intervalo:number, fecha:string)=>{
    const slots = [];
   
    let hora = new Date(`${fecha}T${inicio}:00`);
    const finDia = new Date(`${fecha}T${fin}:00`);

    while(hora<finDia){
        slots.push(new Date(hora));
        hora = new Date(hora.getTime()+intervalo*60000)
    }

    return slots
}

const traerCitasDia = async(fecha:string, id_dentista:number) =>{
    const inicioDia = new Date(`${fecha}T00:00:00Z`);
    const finDia = new Date(`${fecha}T23:59:59Z`);
    const citasDelDia = await Cita.findAll({
        where:{
            id_dentista,
            fecha_hora_inicio:{
                [Op.gte]:inicioDia,
                [Op.lt]:finDia
            },
            estado:{
                [Op.ne]: 'Cancelada'
            }
        }
    });
    return citasDelDia;
}

const formatearCitas = (citas:Cita[]) =>{
    const citasFormateadas = citas.map(cita =>({
        inicio: cita.fecha_hora_inicio.toISOString(),
        fin:cita.fecha_hora_fin.toISOString()
    }));
    return citasFormateadas;
}
const filtrarSlotsDisponibles = (slots:Date[],citas:CitaFormateada[], duracion:number) =>{
    return slots.filter(slot => {
        const inicio = slot;

        const fin = new Date(slot.getTime()+duracion*60000);

        const hayConflicto = citas.some(cita=>{
            const citaInicio = new Date(cita.inicio);
            const citaFin = new Date(cita.fin);
            return inicio < citaFin && fin > citaInicio
        });

        return !hayConflicto
    });
}

export const obtenerDisponibilidad = async(fecha:string, id_dentista:number, tipo_cita:number)=>{
    const citasBD = await traerCitasDia(fecha,id_dentista);
    const citasConFormato = formatearCitas(citasBD);
    const diaSemana = new Date(fecha).getDay();
    let inicio = '09:00';
    let fin = '20:00';
    const intervalo =30;
    const duracion = tipos[tipo_cita]//ver que hacer con tipo cita (tabla en bd o objeto en codigo)
    if(!duracion){
        throw new Error('Tipo_cita_invalido');
    }
    if (diaSemana === 0) {
        return [];
    }

    if (diaSemana === 6) {
        fin = '14:00';
    }
    const slots = generarSlots(inicio,fin, intervalo,fecha );

    const disponibles = filtrarSlotsDisponibles(slots, citasConFormato,duracion);

    return disponibles.map(slot=> slot.toISOString());
}
