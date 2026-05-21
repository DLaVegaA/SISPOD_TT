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
        valor_alerta:   null,
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
        texto_pregunta: '¿Tiene alguna duda o pregunta sobre su recuperación? (Escríbala aquí o deje en blanco si no tiene)',
        // Asegúrate de usar el tipo de control de texto que soporte tu frontend ('texto', 'texto_corto', etc.)
        tipo_control:   'texto_libre', 
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
        texto_pregunta: '¿Ha evitado hacer esfuerzo físico intenso o cargar cosas pesadas?',
        tipo_control:   'booleano_si_no',
        opciones:       null,
        valor_alerta:   null,
        aplica_24h:     true,
        aplica_72h:     false,
        activa:         true,
    },
    {
        texto_pregunta: '¿Ha evitado enjuagarse fuertemente la boca?',
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
        texto_pregunta: '¿Todavía experimenta un sangrado activo que deje la gasa empapada?',
        tipo_control:   'booleano_si_no',
        opciones:       null,
        valor_alerta:   { valor: 'true' },
        aplica_24h:     true,
        aplica_72h:     false,
        activa:         true,
    },
    {
        texto_pregunta: '¿Ha presentado alguna reacción alérgica (náuseas, vómitos, sarpullidos) con la medicación dada?',
        tipo_control:   'booleano_si_no',
        opciones:       null,
        valor_alerta:   { valor: 'true' },
        aplica_24h:     true,
        aplica_72h:     false,
        activa:         true,
    },
    {
        texto_pregunta: '¿Tiene alguna dificultad grave para respirar o tragar?',
        tipo_control:   'booleano_si_no',
        opciones:       null,
        valor_alerta:   { valor: 'true' },
        aplica_24h:     true,
        aplica_72h:     false,
        activa:         true,
    },
    {
        texto_pregunta: 'En caso de haber presentado reacciones, ¿cuál fue?',
        tipo_control:   'opcion_multiple',
        // ¡Se agregó 'Ninguna'!
        opciones:       ['Ninguna', 'Náuseas', 'Vómitos', 'Sarpullidos', 'Otro'],
        valor_alerta:   { incluye: 'Náuseas' }, 
        aplica_24h:     true,
        aplica_72h:     false,
        activa:         true,
    },
    {
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
        texto_pregunta: '¿Ha mejorado tu capacidad para abrir la boca desde la cirugía?',
        tipo_control:   'booleano_si_no',
        opciones:       null,
        valor_alerta:   null,
        aplica_24h:     false,
        aplica_72h:     true,
        activa:         true,
    },
    {
        // Esta es la buena de la dieta
        texto_pregunta: '¿Ha podido retomar gradualmente una dieta normal (sólida)?',
        tipo_control:   'booleano_si_no',
        opciones:       null,
        valor_alerta:   null,
        aplica_24h:     false,
        aplica_72h:     true,
        activa:         true,
    },
    {
        texto_pregunta: '¿Ha evitado la actividad física intensa durante estos primeros 3 días?',
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
        texto_pregunta: '¿Ha evitado el uso de popotes (pajillas)?',
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
        texto_pregunta: '¿Ha tenido algún problema con sus suturas (se salieron antes de tiempo o están irritando)?',
        tipo_control:   'booleano_si_no',
        opciones:       null,
        valor_alerta:   null,
        aplica_24h:     false,
        aplica_72h:     true,
        activa:         true,
    },
    {
        texto_pregunta: 'En una escala del 1 al 10, ¿qué tan satisfecho está con la atención postoperatoria recibida?',
        tipo_control:   'escala_1_10',
        opciones:       null,
        valor_alerta:   null,
        aplica_24h:     false,
        aplica_72h:     true,
        activa:         true,
    },

    // ── Con alerta alta (RN13) ──────────────────────────────────────────────
    {
        texto_pregunta: '¿Has notado alguno de los siguientes síntomas extraños donde se hizo la cirugía?',
        tipo_control:   'opcion_multiple',
        // ¡Se agregó 'Ninguno'!
        opciones:       ['Ninguno', 'Mal sabor', 'Mal olor', 'Pus', 'Otro'],
        valor_alerta:   { incluye: 'Pus' },
        aplica_24h:     false,
        aplica_72h:     true,
        activa:         true,
    },
    {
        texto_pregunta: '¿Has tenido fiebre en las últimas horas?',
        tipo_control:   'booleano_si_no',
        opciones:       null,
        valor_alerta:   { valor: 'true' },
        aplica_24h:     false,
        aplica_72h:     true,
        activa:         true,
    },
    {
        texto_pregunta: '¿Has tenido escalofríos?',
        tipo_control:   'booleano_si_no',
        opciones:       null,
        valor_alerta:   { valor: 'true' },
        aplica_24h:     false,
        aplica_72h:     true,
        activa:         true,
    },
    {
        texto_pregunta: '¿Su dolor e hinchazón han estado disminuyendo en comparación al día de la cirugía?',
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