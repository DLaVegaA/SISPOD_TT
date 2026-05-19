import { PreguntaBase, Cuestionario, CuestionarioPregunta, Catalogo_Procedimientos } from '../models/index';

// ─────────────────────────────────────────────────────────────────────────────
// BANCO DE PREGUNTAS BASE
// Fuente: Tabla 2 (24h) y Tabla 3 (72h) del documento TT2-2026-A006
// Las que tienen valor_alerta corresponden exactamente a RN13.
// ─────────────────────────────────────────────────────────────────────────────

const PREGUNTAS_24H = [
    // ── Sin alerta ─────────────────────────────────────────────────────────
    {
        texto_pregunta: 'En una escala del 1 al 10, ¿cómo calificaría su dolor?',
        tipo_control:   'escala_1_10',
        opciones:       null,
        valor_alerta:   null,   // RN13 no lo lista explícitamente como trigger
        aplica_24h:     true,
        aplica_72h:     false,
        activa:         true,
    },
    {
        texto_pregunta: '¿La medicación dada le está proporcionando un alivio adecuado?',
        tipo_control:   'booleano_si_no',
        opciones:       null,
        valor_alerta:   null,
        aplica_24h:     true,
        aplica_72h:     false,
        activa:         true,
    },
    {
        texto_pregunta: '¿Tiene alguna pregunta sobre su procedimiento postoperatorio?',
        tipo_control:   'booleano_si_no',
        opciones:       null,
        valor_alerta:   null,
        aplica_24h:     true,
        aplica_72h:     false,
        activa:         true,
    },
    {
        texto_pregunta: '¿Has estado aplicando compresas frías en la zona?',
        tipo_control:   'booleano_si_no',
        opciones:       null,
        valor_alerta:   null,
        aplica_24h:     true,
        aplica_72h:     false,
        activa:         true,
    },
    {
        texto_pregunta: '¿Ha evitado moverse o hacer alguna actividad?',
        tipo_control:   'booleano_si_no',
        opciones:       null,
        valor_alerta:   null,
        aplica_24h:     true,
        aplica_72h:     false,
        activa:         true,
    },
    {
        texto_pregunta: '¿Ha evitado enjuagarse?',
        tipo_control:   'booleano_si_no',
        opciones:       null,
        valor_alerta:   null,
        aplica_24h:     true,
        aplica_72h:     false,
        activa:         true,
    },
    {
        texto_pregunta: '¿Ha evitado comer alimentos calientes, duros o crujientes?',
        tipo_control:   'booleano_si_no',
        opciones:       null,
        valor_alerta:   null,
        aplica_24h:     true,
        aplica_72h:     false,
        activa:         true,
    },
    {
        texto_pregunta: '¿Tomó su primera dosis de analgésico antes de que desapareciera el efecto de la anestesia?',
        tipo_control:   'booleano_si_no',
        opciones:       null,
        valor_alerta:   null,
        aplica_24h:     true,
        aplica_72h:     false,
        activa:         true,
    },

    // ── Con alerta crítica (RN13) ───────────────────────────────────────────
    {
        // RN13: alerta crítica si responde SÍ
        texto_pregunta: '¿Todavía experimenta un sangrado activo que deje la gasa empapada?',
        tipo_control:   'booleano_si_no',
        opciones:       null,
        valor_alerta:   { valor: 'true' },
        aplica_24h:     true,
        aplica_72h:     false,
        activa:         true,
    },
    {
        // RN13: alerta crítica si responde SÍ
        texto_pregunta: '¿Ha presentado alguna reacción alérgica u otras reacciones como náuseas, vómitos, sarpullidos u otros efectos con la medicación dada?',
        tipo_control:   'booleano_si_no',
        opciones:       null,
        valor_alerta:   { valor: 'true' },
        aplica_24h:     true,
        aplica_72h:     false,
        activa:         true,
    },
    {
        // RN13: alerta crítica si responde SÍ
        texto_pregunta: '¿Tiene alguna dificultad para respirar o tragar?',
        tipo_control:   'booleano_si_no',
        opciones:       null,
        valor_alerta:   { valor: 'true' },
        aplica_24h:     true,
        aplica_72h:     false,
        activa:         true,
    },
    {
        // RN13: alerta crítica si responde SÍ (cualquier opción seleccionada indica una reacción adversa)
        // Nota: la estructura actual de valor_alerta solo permite verificar una opción a la vez.
        // Se usa 'Náuseas' como valor primario. Si se necesita alertar por cualquier opción,
        // actualizar evaluarAlertasRN13 para soportar { incluyeAlguno: string[] }.
        texto_pregunta: '¿Qué tipo de reacción ha experimentado?',
        tipo_control:   'opcion_multiple',
        opciones:       ['Náuseas', 'Vómitos', 'Sarpullidos', 'Otro'],
        valor_alerta:   { incluye: 'Náuseas' },
        aplica_24h:     true,
        aplica_72h:     false,
        activa:         true,
    },
    {
        // RN13: alerta crítica si responde NO (valor 'false')
        texto_pregunta: '¿Ha evitado tomar alcohol o fumar?',
        tipo_control:   'booleano_si_no',
        opciones:       null,
        valor_alerta:   { valor: 'false' },
        aplica_24h:     true,
        aplica_72h:     false,
        activa:         true,
    },
];

const PREGUNTAS_72H = [
    // ── Sin alerta ─────────────────────────────────────────────────────────
    {
        // Pregunta de evolución comparativa (Empeorado / Mejorado / Igual)
        // RN13 no lista esta pregunta como trigger de alerta; la pregunta de Sí/No
        // sobre disminución es la que sí aparece en RN13.
        texto_pregunta: 'Comparado con los primeros días después de la cirugía, ¿tu dolor e hinchazón han...?',
        tipo_control:   'opcion_multiple',
        opciones:       ['Empeorado', 'Mejorado', 'Se ha mantenido igual'],
        valor_alerta:   null,
        aplica_24h:     false,
        aplica_72h:     true,
        activa:         true,
    },
    {
        texto_pregunta: '¿Ha mejorado tu capacidad para abrir la boca desde la cirugía?',
        tipo_control:   'booleano_si_no',
        opciones:       null,
        valor_alerta:   null,
        aplica_24h:     false,
        aplica_72h:     true,
        activa:         true,
    },
    {
        texto_pregunta: '¿Has podido reanudar gradualmente una dieta más blanda?',
        tipo_control:   'booleano_si_no',
        opciones:       null,
        valor_alerta:   null,
        aplica_24h:     false,
        aplica_72h:     true,
        activa:         true,
    },
    {
        texto_pregunta: '¿Ha evitado la actividad física intensa durante los primeros 3 días?',
        tipo_control:   'booleano_si_no',
        opciones:       null,
        valor_alerta:   null,
        aplica_24h:     false,
        aplica_72h:     true,
        activa:         true,
    },
    {
        texto_pregunta: '¿Ha intentado descansar con la cabeza elevada sobre almohadas?',
        tipo_control:   'booleano_si_no',
        opciones:       null,
        valor_alerta:   null,
        aplica_24h:     false,
        aplica_72h:     true,
        activa:         true,
    },
    {
        texto_pregunta: '¿Ha evitado el uso de popotes?',
        tipo_control:   'booleano_si_no',
        opciones:       null,
        valor_alerta:   null,
        aplica_24h:     false,
        aplica_72h:     true,
        activa:         true,
    },
    {
        texto_pregunta: '¿Ha bebido abundantes líquidos?',
        tipo_control:   'booleano_si_no',
        opciones:       null,
        valor_alerta:   null,
        aplica_24h:     false,
        aplica_72h:     true,
        activa:         true,
    },
    {
        texto_pregunta: '¿Ha tenido algún problema con sus suturas, como que se hayan salido antes de tiempo o que se sientan irritantes?',
        tipo_control:   'booleano_si_no',
        opciones:       null,
        valor_alerta:   null,
        aplica_24h:     false,
        aplica_72h:     true,
        activa:         true,
    },
    {
        texto_pregunta: 'En una escala del 1 al 10, ¿qué tan satisfecho está con su cuidado postoperatorio?',
        tipo_control:   'escala_1_10',
        opciones:       null,
        valor_alerta:   null,
        aplica_24h:     false,
        aplica_72h:     true,
        activa:         true,
    },
    {
        texto_pregunta: '¿Ha podido retomar una dieta normal?',
        tipo_control:   'booleano_si_no',
        opciones:       null,
        valor_alerta:   null,
        aplica_24h:     false,
        aplica_72h:     true,
        activa:         true,
    },
    {
        texto_pregunta: 'En una escala del 1 al 10, ¿qué tan satisfecho está con el resultado de la operación?',
        tipo_control:   'escala_1_10',
        opciones:       null,
        valor_alerta:   null,
        aplica_24h:     false,
        aplica_72h:     true,
        activa:         true,
    },

    // ── Con alerta alta (RN13) ──────────────────────────────────────────────
    {
        // RN13: alerta alta si selecciona Pus (signo clínico de infección activa)
        // Nota: Mal sabor y Mal olor también son señales de alerta según RN13.
        // Para cubrir todas las opciones, actualizar evaluarAlertasRN13 para soportar
        // { incluyeAlguno: ['Mal sabor', 'Mal olor', 'Pus', 'Otro'] }.
        texto_pregunta: '¿Has notado alguno de los siguientes síntomas en donde se hizo la cirugía?',
        tipo_control:   'opcion_multiple',
        opciones:       ['Mal sabor', 'Mal olor', 'Pus', 'Otro'],
        valor_alerta:   { incluye: 'Pus' },
        aplica_24h:     false,
        aplica_72h:     true,
        activa:         true,
    },
    {
        // RN13: alerta alta si responde SÍ
        texto_pregunta: '¿Has tenido fiebre?',
        tipo_control:   'booleano_si_no',
        opciones:       null,
        valor_alerta:   { valor: 'true' },
        aplica_24h:     false,
        aplica_72h:     true,
        activa:         true,
    },
    {
        // RN13: alerta alta si responde SÍ
        texto_pregunta: '¿Has tenido escalofríos?',
        tipo_control:   'booleano_si_no',
        opciones:       null,
        valor_alerta:   { valor: 'true' },
        aplica_24h:     false,
        aplica_72h:     true,
        activa:         true,
    },
    {
        // RN13: alerta alta si responde NO (valor 'false')
        texto_pregunta: '¿Su dolor e hinchazón han estado disminuyendo en comparación a los primeros días?',
        tipo_control:   'booleano_si_no',
        opciones:       null,
        valor_alerta:   { valor: 'false' },
        aplica_24h:     false,
        aplica_72h:     true,
        activa:         true,
    },
];

// ─────────────────────────────────────────────────────────────────────────────
// FUNCIÓN PRINCIPAL DEL SEEDER
// ─────────────────────────────────────────────────────────────────────────────

export const seedCuestionarios = async () => {
    console.log('\n📋 Iniciando seed de preguntas y cuestionarios...');

    // ── 1. Insertar banco de preguntas ──────────────────────────────────────
    // ignoreDuplicates evita falla si ya existen (re-run seguro)
    const preguntas24 = await PreguntaBase.bulkCreate(PREGUNTAS_24H as any[], {
        ignoreDuplicates: true,
        returning: true,
    });

    const preguntas72 = await PreguntaBase.bulkCreate(PREGUNTAS_72H as any[], {
        ignoreDuplicates: true,
        returning: true,
    });

    console.log(`  ✓ ${preguntas24.length} preguntas de 24h insertadas`);
    console.log(`  ✓ ${preguntas72.length} preguntas de 72h insertadas`);

    // ── 2. Obtener las preguntas recién creadas del banco ───────────────────
    // Se recuperan por texto para ser robusto ante ignoreDuplicates (que no retorna IDs en algunos drivers)
    const textos24  = PREGUNTAS_24H.map(p => p.texto_pregunta);
    const textos72  = PREGUNTAS_72H.map(p => p.texto_pregunta);

    const bancо24 = await PreguntaBase.findAll({ where: { texto_pregunta: textos24 } });
    const bancо72 = await PreguntaBase.findAll({ where: { texto_pregunta: textos72 } });

    // ── 3. Obtener procedimiento para asociar los cuestionarios ─────────────
    // Los cuestionarios requieren un id_procedimiento válido.
    // Se usa el primer procedimiento disponible como default del seeder.
    // El dentista puede crear cuestionarios adicionales por procedimiento desde la UI.
    const procedimiento = await Catalogo_Procedimientos.findOne({
        order: [['id_procedimiento', 'ASC']],
    });

    if (!procedimiento) {
        console.warn('  ⚠ No se encontró ningún procedimiento. Ejecuta primero el seeder principal.');
        console.warn('    Los cuestionarios NO fueron creados. Ejecuta el seeder de nuevo después de -i.');
        return;
    }

    console.log(`  ✓ Usando procedimiento "${procedimiento.nombre_procedimiento}" (ID ${procedimiento.id_procedimiento}) para los cuestionarios base`);

    // ── 4. Crear cuestionario de 24h ────────────────────────────────────────
    const [cuest24, created24] = await Cuestionario.findOrCreate({
        where: {
            nombre_cuestionario: 'Cuestionario Postoperatorio 24h',
            tipo_cuestionario:   '24h',
            id_procedimiento:    procedimiento.id_procedimiento,
        },
        defaults: {
            descripcion: 'Cuestionario base para evaluar el estado inicial del paciente tras el procedimiento quirúrgico. Detecta síntomas agudos como dolor, sangrado y reacciones adversas.',
            activo: true,
        },
    });

    if (created24) {
        // Asignar preguntas 24h en el orden del documento
        const ordenado24 = PREGUNTAS_24H.map(p =>
            bancо24.find((b: any) => b.texto_pregunta === p.texto_pregunta)
        ).filter(Boolean);

        await CuestionarioPregunta.bulkCreate(
            ordenado24.map((p: any, idx: number) => ({
                id_cuestionario:  cuest24.id_cuestionario,
                id_pregunta_base: p.id_pregunta_base,
                orden:            idx,
            })),
            { ignoreDuplicates: true }
        );
        console.log(`  ✓ Cuestionario 24h creado con ${ordenado24.length} preguntas (ID ${cuest24.id_cuestionario})`);
    } else {
        console.log(`  · Cuestionario 24h ya existe (ID ${cuest24.id_cuestionario}), omitido`);
    }

    // ── 5. Crear cuestionario de 72h ────────────────────────────────────────
    const [cuest72, created72] = await Cuestionario.findOrCreate({
        where: {
            nombre_cuestionario: 'Cuestionario Postoperatorio 72h',
            tipo_cuestionario:   '72h',
            id_procedimiento:    procedimiento.id_procedimiento,
        },
        defaults: {
            descripcion: 'Cuestionario base para evaluar la evolución del paciente pasados los primeros días. Detecta signos de infección, fiebre y problemas de recuperación.',
            activo: true,
        },
    });

    if (created72) {
        const ordenado72 = PREGUNTAS_72H.map(p =>
            bancо72.find((b: any) => b.texto_pregunta === p.texto_pregunta)
        ).filter(Boolean);

        await CuestionarioPregunta.bulkCreate(
            ordenado72.map((p: any, idx: number) => ({
                id_cuestionario:  cuest72.id_cuestionario,
                id_pregunta_base: p.id_pregunta_base,
                orden:            idx,
            })),
            { ignoreDuplicates: true }
        );
        console.log(`  ✓ Cuestionario 72h creado con ${ordenado72.length} preguntas (ID ${cuest72.id_cuestionario})`);
    } else {
        console.log(`  · Cuestionario 72h ya existe (ID ${cuest72.id_cuestionario}), omitido`);
    }

    console.log('📋 Seed de cuestionarios completado.\n');
};