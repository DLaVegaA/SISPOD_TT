<script setup lang="ts">
import logoUrl from '@/shared/assets/logo_diente.png'
import { ROUTE_NAMES } from '@/shared/routes'
</script>

<template>
  <div class="min-h-screen relative">
    <!-- Fondo fijo -->
    <img
      src="https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80"
      class="fixed inset-0 w-full h-full object-cover z-0"
      alt="Clínica Dental"
    />
    <div class="fixed inset-0 bg-black/55 z-10" />

    <!-- Botón regresar -->
    <router-link
      :to="{ name: ROUTE_NAMES.HOME }"
      class="fixed top-6 left-6 z-30 flex items-center gap-2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 px-4 py-2 rounded-xl text-sm font-medium transition"
    >
      ← Regresar
    </router-link>

    <!-- Contenido scrollable -->
    <div class="relative z-20 max-w-3xl mx-auto px-4 py-20 pb-16">

      <!-- Encabezado -->
      <div class="flex flex-col items-center mb-10 gap-2">
        <div class="flex items-center gap-2">
          <img :src="logoUrl" alt="Logo" class="h-7 w-auto brightness-0 invert" />
          <span class="text-white font-semibold text-sm">Consultorio González</span>
        </div>
        <h1 class="text-3xl font-bold text-white text-center mt-2">Políticas de Privacidad</h1>
        <p class="text-white/50 text-xs text-center mt-1">
          En cumplimiento a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares y su Reglamento
        </p>
      </div>

      <!-- Card principal -->
      <div class="bg-white/15 backdrop-blur-xl border border-white/25 shadow-2xl rounded-3xl p-8 sm:p-10 space-y-8">

        <!-- Introducción -->
        <div class="space-y-4 text-white/85 text-sm leading-relaxed">
          <p>
            En cumplimiento a la <strong class="text-white">Ley Federal de Protección de Datos Personales
            en Posesión de los Particulares y su Reglamento</strong>, <strong class="text-white">Manuel
            González Gasso</strong>, en adelante <strong class="text-white">EL RESPONSABLE</strong>,
            con domicilio en <em class="text-white/70">Calle del deporte 26a, Colonia el mirador,
            Tlalnepantla de Baz, Estado de México, C.P. 54080</em>, hace de su conocimiento que los datos
            personales y/o <strong class="text-white">sensibles</strong> que de manera voluntaria nos
            proporcione o haya proporcionado (Datos Personales), son confidenciales y está comprometido a
            resguardarlos con los más altos índices de seguridad tecnológica y administrativa.
          </p>
          <p>
            Por ello, al momento de registrarse y leer el presente Aviso de Privacidad usted como Titular
            otorga su consentimiento a <strong class="text-white">EL RESPONSABLE</strong> para usar,
            divulgar, almacenar y transferir sus Datos Personales con el propósito de cumplir con los fines
            y las obligaciones de la relación jurídica y clínica para los que fueron proporcionados.
          </p>
        </div>

        <!-- Sección I -->
        <div class="space-y-3">
          <h2 class="text-xs font-bold text-white/50 uppercase tracking-widest border-b border-white/20 pb-2">
            I) Fines para los cuales utilizaremos sus Datos Personales
          </h2>
          <ul class="space-y-2 text-white/85 text-sm">
            <li class="flex gap-2">
              <span class="text-white/40 shrink-0">(i)</span>
              <span>Para llevar a cabo la suscripción y alta del paciente en la plataforma digital de seguimiento postoperatorio;</span>
            </li>
            <li class="flex gap-2">
              <span class="text-white/40 shrink-0">(ii)</span>
              <span>Para la generación del acceso seguro y perfil del paciente en la plataforma;</span>
            </li>
            <li class="flex gap-2">
              <span class="text-white/40 shrink-0">(iii)</span>
              <span>Para el monitoreo clínico continuo, evaluación y seguimiento de la evolución y recuperación postoperatoria del paciente;</span>
            </li>
            <li class="flex gap-2">
              <span class="text-white/40 shrink-0">(iv)</span>
              <span>Para que <strong class="text-white">EL RESPONSABLE</strong> cuente con la información de contacto del Titular para ofrecerle soporte, alertas de seguimiento, recordatorios y gestión de citas de revisión;</span>
            </li>
            <li class="flex gap-2">
              <span class="text-white/40 shrink-0">(v)</span>
              <span>Para aquellos que se requieran con el propósito de cumplir con los fines y las obligaciones de la relación médico-paciente para los que fueron proporcionados.</span>
            </li>
          </ul>
        </div>

        <!-- Sección II -->
        <div class="space-y-3">
          <h2 class="text-xs font-bold text-white/50 uppercase tracking-widest border-b border-white/20 pb-2">
            II) Datos Personales que utilizaremos para estos fines
          </h2>
          <div class="space-y-3 text-white/85 text-sm leading-relaxed">
            <div class="bg-white/10 rounded-2xl p-4 space-y-1">
              <p><strong class="text-white">(i) De identificación y contacto:</strong> Nombre, apellidos,
              fecha de nacimiento, edad, género, teléfono, dirección de correo electrónico, Clave Única de
              Registro de Población (CURP) y domicilio.</p>
            </div>
            <div class="bg-red-500/10 border border-red-400/20 rounded-2xl p-4 space-y-1">
              <p><strong class="text-red-300">(ii) Datos Personales Sensibles (Salud):</strong> Debido a
              la naturaleza clínica del sistema, se tratarán datos sobre el estado de salud del Titular,
              tales como historial clínico dental relacionado con la intervención, reporte de síntomas
              postoperatorios (niveles de dolor, inflamación, sangrado, temperatura), proporcionados
              voluntariamente por el Titular para la evaluación a distancia del odontólogo.</p>
            </div>
          </div>
        </div>

        <!-- Sección III -->
        <div class="space-y-3">
          <h2 class="text-xs font-bold text-white/50 uppercase tracking-widest border-b border-white/20 pb-2">
            III) Uso, divulgación y transferencia de sus Datos Personales
          </h2>
          <p class="text-white/85 text-sm leading-relaxed">
            <strong class="text-white">EL RESPONSABLE</strong> se compromete a (i) no usar o divulgar sus
            Datos Personales a favor de terceros sin su consentimiento, con excepción de aquellos que se
            requieran con el propósito de cumplir con los fines y las obligaciones de la relación jurídica
            para los que fueron proporcionados, o bien, sean requeridos por organismos públicos o autoridades
            sanitarias y judiciales nacionales dentro del país si fuere necesario para las finalidades señaladas
            en el presente Aviso de Privacidad; y a (ii) no transferirlos a terceros, salvo en los supuestos
            previstos en el <strong class="text-white">artículo 37 de la LEY FEDERAL DE PROTECCIÓN DE DATOS
            PERSONALES EN POSESIÓN DE LOS PARTICULARES</strong>, particularmente cuando la transferencia sea
            necesaria para la prevención o el diagnóstico médico, la prestación de asistencia sanitaria,
            tratamiento médico o la gestión de servicios sanitarios en beneficio del Titular; para el
            reconocimiento, ejercicio o defensa de un derecho en un proceso judicial y para el mantenimiento
            o cumplimiento de la relación clínica entre <strong class="text-white">EL RESPONSABLE</strong>
            y el Titular.
          </p>
        </div>

        <!-- Sección IV -->
        <div class="space-y-3">
          <h2 class="text-xs font-bold text-white/50 uppercase tracking-widest border-b border-white/20 pb-2">
            IV) Medios para ejercer los derechos de acceso, rectificación, cancelación u oposición al uso de sus Datos Personales (ARCO)
          </h2>
          <div class="space-y-3 text-white/85 text-sm leading-relaxed">
            <p>
              Usted tiene derecho a (i) conocer qué Datos Personales tenemos de usted, para qué los utilizamos
              y las condiciones del uso que les damos (<strong class="text-white">Acceso</strong>); (ii)
              solicitar la corrección de su información en caso de que esté desactualizada, sea inexacta o
              incompleta (<strong class="text-white">Rectificación</strong>); (iii) solicitar que la eliminemos
              de nuestros registros o bases de datos cuando considere que la misma no está siendo utilizada
              adecuadamente (<strong class="text-white">Cancelación</strong>); (iv) así como oponerse al uso
              de sus Datos Personales para fines específicos (<strong class="text-white">Oposición</strong>).
            </p>
            <p>
              Para ejercer alguno de estos derechos póngase en contacto con nosotros a través de los medios
              que se indican más adelante. <strong class="text-white">EL RESPONSABLE</strong> tendrá
              <strong class="text-white">20 veinte días hábiles</strong> contados a partir de la recepción
              de su solicitud para pronunciarse sobre su procedencia y, en su caso, ejecutar la medida
              solicitada dentro de los <strong class="text-white">15 quince días hábiles</strong> siguientes
              al pronunciamiento sobre la viabilidad de la misma.
            </p>
            <p>
              La cancelación dará lugar a un periodo de bloqueo tras el cual se procederá a la supresión del(os)
              dato(s). <strong class="text-white">EL RESPONSABLE</strong> podrá conservarlo(s) exclusivamente
              para efectos de las responsabilidades nacidas del tratamiento. El periodo de bloqueo será
              equivalente al plazo de prescripción de las acciones derivadas de la relación clínica que funda
              el tratamiento. Una vez cancelado(s) el(los) dato(s) se dará aviso al Titular.
            </p>
          </div>
        </div>

        <!-- Sección V -->
        <div class="space-y-3">
          <h2 class="text-xs font-bold text-white/50 uppercase tracking-widest border-b border-white/20 pb-2">
            V) Opciones y medios para dudas, preguntas, ejercer derechos ARCO o limitar el uso o divulgación de sus Datos Personales
          </h2>
          <div class="space-y-3">
            <div class="flex items-start gap-3 text-sm text-white/85">
              <span class="text-white/40 shrink-0 mt-0.5">✉</span>
              <p>
                <strong class="text-white">Correo electrónico:</strong>
                <a
                  href="mailto:consultoriodentalgonzalezmx@gmail.com"
                  class="ml-1 text-blue-300 hover:text-blue-200 transition underline underline-offset-2"
                >
                  consultoriodentalgonzalezmx@gmail.com
                </a>
                <span class="text-white/50"> con atención a Manuel González Gassos.</span>
              </p>
            </div>
            <div class="flex items-start gap-3 text-sm text-white/85">
              <span class="text-white/40 shrink-0 mt-0.5">📍</span>
              <p>
                <strong class="text-white">Domicilio:</strong>
                <span class="ml-1">Calle del deporte 26a, Colonia el mirador, Tlalnepantla de Baz, Estado de México, C.P. 54080</span>
              </p>
            </div>
          </div>
        </div>

      </div>

      <!-- Pie -->
      <p class="text-center text-white/30 text-xs mt-8">
        © 2026 Consultorio Dental González · Todos los derechos reservados
      </p>
    </div>
  </div>
</template>