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
        <h1 class="text-3xl font-bold text-white text-center mt-2">
          Aceptación de los Términos y Condiciones del Uso del Sitio de Seguimiento Postoperatorio
        </h1>
        <p class="text-white/50 text-xs text-center mt-1">Versión 1.0 (Actualizado en mayo de 2026)</p>
      </div>
 
      <!-- Aviso urgencias -->
      <div class="bg-red-500/20 border border-red-400/40 rounded-2xl p-4 mb-6 flex gap-3 items-start">
        <span class="text-red-300 text-lg shrink-0 mt-0.5">⚠</span>
        <div class="space-y-1">
          <p class="text-red-200 text-sm font-bold">Aviso importante — Emergencias médicas</p>
          <p class="text-red-200/80 text-xs leading-relaxed">
            SISPOD <strong class="text-red-200">NO es un servicio de urgencias 24/7</strong>.
            Si presenta hemorragia severa que no cesa, dificultad crítica para respirar o tragar,
            fiebre alta o reacciones alérgicas graves, <strong class="text-red-200">comuníquese
            inmediatamente al consultorio, llame al número de emergencias o acuda al hospital más cercano</strong>.
          </p>
        </div>
      </div>
 
      <!-- Card principal -->
      <div class="bg-white/15 backdrop-blur-xl border border-white/25 shadow-2xl rounded-3xl p-8 sm:p-10 space-y-8">
 
        <!-- Introducción -->
        <div class="space-y-4 text-white/85 text-sm leading-relaxed">
          <p>
            El presente documento establece el marco normativo que regula el acceso, registro y utilización
            del portal de internet <strong class="text-white">https://sispod.duckdns.org/</strong> (<strong class="text-white">Sitio</strong>).
          </p>
          <p>
            La operación técnica está a cargo de <strong class="text-white">Manuel González Gassos</strong>
            (en adelante, <strong class="text-white">Proveedor</strong>), quien pone esta tecnología a disposición
            de sus pacientes (en adelante, el <strong class="text-white">Usuario</strong>).
          </p>
          <p>
            Al interactuar o navegar dentro del <strong class="text-white">Sitio</strong>, el
            <strong class="text-white">Usuario</strong> manifiesta su conformidad absoluta y se obliga legalmente
            al cumplimiento de las cláusulas descritas a continuación. Si el <strong class="text-white">Usuario</strong>
            no está de acuerdo con estas disposiciones, deberá suspender de inmediato el uso del sistema.
          </p>
          <p>
            El <strong class="text-white">Proveedor</strong> conserva la facultad exclusiva de realizar
            modificaciones, adaptaciones o actualizaciones al texto de estos Términos y Condiciones en el momento
            que lo considere oportuno y sin obligación de notificación previa. Cualquier cambio normativo será
            vigente de forma inmediata a partir del momento en que se publique en este espacio. Por lo anterior,
            es entera responsabilidad del <strong class="text-white">Usuario</strong> revisar este apartado de
            manera periódica. El ingreso y uso continuo del sistema tras la publicación de cualquier reforma se
            interpretará como una aceptación expresa y vinculante de los nuevos términos. El quebrantamiento de
            estas reglas facultará al <strong class="text-white">Proveedor</strong> para restringir, suspender
            o revocar definitivamente el acceso a la cuenta del <strong class="text-white">Usuario</strong> sin
            responsabilidad alguna.
          </p>
          <p class="text-white font-semibold uppercase text-xs tracking-wide border border-white/20 rounded-xl p-3 text-center">
            Al utilizar el Sitio usted acepta quedar obligado de conformidad con lo establecido en los siguientes Términos y Condiciones
          </p>
        </div>
 
        <!-- Cláusula 1 -->
        <div class="space-y-3">
          <h2 class="text-xs font-bold text-white/50 uppercase tracking-widest border-b border-white/20 pb-2">
            1. Asignación y Acceso al Servicio
          </h2>
          <p class="text-white/85 text-sm leading-relaxed">
            El acceso al <strong class="text-white">Sitio</strong> no tiene un costo comercial para El Paciente,
            sino que se deriva de la relación clínica con el consultorio. El <strong class="text-white">Proveedor</strong>
            generará un perfil de acceso con credenciales (usuario y contraseña) para que El
            <strong class="text-white">Usuario</strong> pueda ingresar al sistema y comenzar su monitoreo.
            El uso de esta cuenta es estrictamente personal e intransferible.
          </p>
        </div>
 
        <!-- Cláusula 2 -->
        <div class="space-y-3">
          <h2 class="text-xs font-bold text-white/50 uppercase tracking-widest border-b border-white/20 pb-2">
            2. Uso del Servicio del Sitio
          </h2>
          <p class="text-white/85 text-sm leading-relaxed">
            El servicio del <strong class="text-white">Sitio</strong> consiste en permitir al Usuario el acceso
            online para el registro de síntomas y evolución clínica, relacionadas exclusivamente con su proceso
            de recuperación postoperatoria.
          </p>
          <p class="text-white/85 text-sm leading-relaxed">
            La funcionalidad del servicio es la que se muestra por medio de las opciones de menú o flujos de
            conversación del <strong class="text-white">Sitio</strong>. El <strong class="text-white">Usuario</strong> se obliga a:
          </p>
          <ul class="space-y-2 text-white/80 text-sm">
            <li class="flex gap-2">
              <span class="text-white/40 shrink-0 mt-0.5">›</span>
              <span>Proporcionar información 100% verídica, exacta y oportuna respecto a su estado de salud.</span>
            </li>
            <li class="flex gap-2">
              <span class="text-white/40 shrink-0 mt-0.5">›</span>
              <span>No utilizar el servicio de forma inadecuada, interferir con sus funciones ni intentar acceder a él usando métodos distintos a las instrucciones proporcionadas.</span>
            </li>
          </ul>
        </div>
 
        <!-- Cláusula 3 -->
        <div class="space-y-3">
          <h2 class="text-xs font-bold text-white/50 uppercase tracking-widest border-b border-white/20 pb-2">
            3. Deslinde de Responsabilidad Médica y Urgencias
          </h2>
          <div class="bg-white/10 rounded-2xl p-4 space-y-3 text-white/85 text-sm leading-relaxed">
            <p>
              El <strong class="text-white">Usuario</strong> acepta y reconoce que el
              <strong class="text-white">Sitio</strong> es una herramienta complementaria de monitoreo y
              <strong class="text-white">NO es un servicio de atención médica de urgencias disponible las 24 horas del día, los 7 días de la semana</strong>.
              El personal odontológico revisará los reportes de síntomas en horarios clínicos laborables.
            </p>
            <p>
              <strong class="text-white">Si el Usuario presenta una emergencia médica</strong>
              (como hemorragia severa que no cesa, dificultad crítica para respirar o tragar, fiebre alta
              o reacciones alérgicas graves), <strong class="text-white">se obliga a no esperar respuesta
              a través del Sitio</strong> y deberá comunicarse inmediatamente a los teléfonos de atención
              directa del consultorio, llamar al número de emergencias o acudir al hospital más cercano.
              El <strong class="text-white">Proveedor</strong> queda libre de cualquier responsabilidad civil,
              penal o médica por la omisión del <strong class="text-white">Usuario</strong> ante una urgencia.
            </p>
          </div>
        </div>
 
        <!-- Cláusula 4 -->
        <div class="space-y-3">
          <h2 class="text-xs font-bold text-white/50 uppercase tracking-widest border-b border-white/20 pb-2">
            4. Seguridad de la Cuenta
          </h2>
          <p class="text-white/85 text-sm leading-relaxed">
            El <strong class="text-white">Usuario</strong> es completamente responsable de mantener la
            confidencialidad de sus credenciales de acceso, códigos o enlaces de inicio de sesión enviados
            a su dispositivo, aceptando estar de acuerdo en que es responsable de todos los actos que deriven
            del uso de su cuenta. El <strong class="text-white">Proveedor</strong> no será responsable de
            ninguna pérdida de información o daño derivado del mal uso de las contraseñas o el acceso por
            parte de terceros no autorizados.
          </p>
        </div>
 
        <!-- Cláusula 5 -->
        <div class="space-y-3">
          <h2 class="text-xs font-bold text-white/50 uppercase tracking-widest border-b border-white/20 pb-2">
            5. Término del Servicio y Conservación de Datos
          </h2>
          <p class="text-white/85 text-sm leading-relaxed">
            Una vez que el odontólogo tratante determine la alta clínica postoperatoria del
            <strong class="text-white">Usuario</strong>, el periodo de seguimiento activo concluirá.
            El <strong class="text-white">Proveedor</strong> conservará el registro de sus reportes y síntomas
            en el expediente clínico digital conforme a los plazos exigidos por la legislación sanitaria vigente
            y las normas oficiales aplicables. El <strong class="text-white">Usuario</strong> podrá solicitar
            un resumen de su historial de monitoreo conforme a los derechos estipulados en nuestra Política
            de Privacidad.
          </p>
        </div>
 
        <!-- Cláusula 6 -->
        <div class="space-y-3">
          <h2 class="text-xs font-bold text-white/50 uppercase tracking-widest border-b border-white/20 pb-2">
            6. Política de Privacidad
          </h2>
          <p class="text-white/85 text-sm leading-relaxed">
            El <strong class="text-white">Proveedor</strong> se compromete a resguardar, no publicar, no
            compartir, no transmitir, no vender o no distribuir a cualquier título los Datos Personales y
            Datos Personales Sensibles (información de salud) del <strong class="text-white">Usuario</strong>
            ingresados al <strong class="text-white">Sitio</strong>, dando estricto cumplimiento a la
            <strong class="text-white">LEY FEDERAL DE PROTECCIÓN DE DATOS PERSONALES EN POSESIÓN DE LOS
            PARTICULARES</strong> y conforme al Aviso de Privacidad.
          </p>
        </div>
 
        <!-- Cláusula 7 -->
        <div class="space-y-3">
          <h2 class="text-xs font-bold text-white/50 uppercase tracking-widest border-b border-white/20 pb-2">
            7. Información Confidencial y Propiedad Intelectual del Software
          </h2>
          <div class="space-y-3 text-white/85 text-sm leading-relaxed">
            <p>
              El <strong class="text-white">Usuario</strong> declara que tiene conocimiento de que el diseño,
              código fuente, algoritmos, flujos de trabajo e interfaces de Software a los que tiene acceso por
              el uso del <strong class="text-white">Sitio</strong> significan para El
              <strong class="text-white">Proveedor</strong> una ventaja competitiva y económica frente a
              terceros, estando protegidos como secreto industrial y propiedad intelectual de acceso restringido.
            </p>
            <p>
              El <strong class="text-white">Usuario</strong> tiene prohibición expresa para copiar, modificar,
              distribuir, vender, rentar, aplicar técnicas de ingeniería inversa o intentar extraer el código
              fuente del <strong class="text-white">Sitio</strong>, así como usar cualquiera de las marcas o
              logotipos expuestos.
            </p>
            <p>
              En caso de que el <strong class="text-white">Usuario</strong> revele, copie, se apodere o use la
              información confidencial del <strong class="text-white">Proveedor</strong> sin consentimiento,
              o incurra en alguna de las hipótesis previstas por la legislación de la Propiedad Industrial y
              los artículos <strong class="text-white">210, 211, 211 Bis 1 a 211 Bis 7 del Código Penal
              Federal</strong>, se hará acreedor a las penas y sanciones ahí establecidas, además de la
              obligación del pago de los daños y perjuicios patrimoniales y morales causados.
            </p>
          </div>
        </div>
 
        <!-- Cláusula 8 -->
        <div class="space-y-3">
          <h2 class="text-xs font-bold text-white/50 uppercase tracking-widest border-b border-white/20 pb-2">
            8. Disponibilidad y Límites del Servicio
          </h2>
          <p class="text-white/85 text-sm leading-relaxed">
            El servicio proporcionado tiene como objetivo mantener un alto nivel de disponibilidad tecnológica;
            sin embargo, si existiera alguna situación de fuerza mayor, caída de servidores, fallas en la red
            de telecomunicaciones o problemas de conectividad ajenos al control de la organización por la cual
            el sistema no estuviera accesible, El <strong class="text-white">Proveedor</strong> no será
            responsable de ningún daño incidental o consecuente, y no se aplicarán penalizaciones de ninguna
            índole.
          </p>
        </div>
 
      </div>
 
      <!-- Pie -->
      <p class="text-center text-white/30 text-xs mt-8">
        © 2026 Consultorio Dental González · Todos los derechos reservados
      </p>
    </div>
  </div>
</template>