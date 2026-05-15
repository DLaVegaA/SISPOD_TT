import { Request, Response, NextFunction } from "express";
import { AppError } from "../helpers/AppError";
import { crearPreguntaService } from "../services/preguntaService";
const TIPOS_CONTROL = [
    'escala_1_10',
    'booleano_si_no',
    'texto_libre',
    'opcion_multiple'
];

export const crearPregunta = async(
    req: Request,
    res: Response,
    next: NextFunction
) => {

    try {

        const {
            id_cuestionario,
            texto_pregunta,
            tipo_control,
            opciones,
            valor_alerta
        } = req.body;

        if(Number.isNaN(Number(id_cuestionario))){
            throw new AppError(
                'Cuestionario inválido',
                400
            );
        }

        if(
            typeof texto_pregunta !== 'string' ||
            !texto_pregunta.trim()
        ){
            throw new AppError(
                'La pregunta es obligatoria',
                400
            );
        }

        if(
            typeof tipo_control !== 'string' ||
            !TIPOS_CONTROL.includes(tipo_control)
        ){
            throw new AppError(
                'Tipo de control inválido',
                400
            );
        }

        if(
            opciones &&
            !Array.isArray(opciones)
        ){
            throw new AppError(
                'Las opciones deben ser un arreglo',
                400
            );
        }

        if(tipo_control === 'opcion_multiple'){

            if(
                !Array.isArray(opciones) ||
                opciones.length < 2
            ){
                throw new AppError(
                    'Debe agregar mínimo dos opciones',
                    400
                );
            }

            const opcionesValidas = opciones.every(
                (opcion:any)=>
                    typeof opcion === 'string' &&
                    opcion.trim()
            );

            if(!opcionesValidas){
                throw new AppError(
                    'Las opciones deben ser texto válido',
                    400
                );
            }

        }

        if(
            valor_alerta &&
            typeof valor_alerta !== 'object'
        ){
            throw new AppError(
                'Valor alerta inválido',
                400
            );
        }

        if(tipo_control === 'escala_1_10'){

            if(
                valor_alerta &&
                typeof valor_alerta.min !== 'number'
            ){
                throw new AppError(
                    'El valor mínimo de alerta es inválido',
                    400
                );
            }

        }

        if(tipo_control === 'booleano_si_no'){

            if(
                valor_alerta &&
                typeof valor_alerta.valor !== 'string'
            ){
                throw new AppError(
                    'Valor de alerta inválido',
                    400
                );
            }

        }

        if(tipo_control === 'opcion_multiple'){

            if(
                valor_alerta &&
                typeof valor_alerta.incluye !== 'string'
            ){
                throw new AppError(
                    'Valor de alerta inválido',
                    400
                );
            }

        }

        const data = {
            texto_pregunta,
            tipo_control,
            opciones: opciones || null,
            valor_alerta: valor_alerta || null
        };

        const pregunta = await crearPreguntaService(id_cuestionario,data);

        return res.status(201).json({
            message:'Pregunta creada',
            pregunta
        });

    } catch (error) {
        next(error);
    }

}