import { Response } from 'express';
import { Op } from 'sequelize';
import puppeteer from 'puppeteer';
import { PDFDocument as LibPDF, PDFPage } from 'pdf-lib';
import {
  BlobServiceClient,
  generateBlobSASQueryParameters,
  BlobSASPermissions,
  StorageSharedKeyCredential,
} from '@azure/storage-blob';
import https from 'https';
import http from 'http';

// ─── Tipos de datos y modelos (igual que antes) ─────────────────────────
interface Usuario {
  nombre: string;
  apellido_paterno: string;
  apellido_materno?: string;
  fecha_nacimiento?: Date | string;
  genero?: string;
  curp?: string;
  correo?: string;
  telefono?: string;
}

interface Direccion {
  calle: string;
  num_ext?: string;
  num_int?: string;
  colonia: string;
  municipio: string;
  estado: string;
  codigo_postal: string;
}

interface Paciente {
  usuario?: Usuario;
  direccion?: Direccion;
}

interface Dentista {
  usuario?: Usuario;
  no_cedula?: string;
}

interface Expediente {
  id_expediente: number;
  id_paciente: number;
  tipo_sangre?: string;
  estatura?: number;
  peso?: number;
  ocupacion?: string;
  observaciones_generales?: string;
  fecha_creacion: Date;
  paciente?: Paciente;
  dentista?: Dentista;
}

interface Padecimiento {
  nombre_padecimiento: string;
}

interface ExpedientePadecimiento {
  tipo_antecedente: string;
  nota?: string;
  padecimiento?: Padecimiento;
}

interface Odontograma {
  fecha_actualizacion: Date;
  datos_odontograma?: OdontogramaDiente[];
}

interface OdontogramaDiente {
  num: number;
  condition?: string;
  surfaces?: Record<string, string>;
}

interface Cita {
  id_cita: number;
  id_paciente: number;
  fecha_hora_inicio?: Date;
}

interface Bitacora {
  fecha_creacion: Date;
  accion_realizada?: string;
  descripcion?: string;
  estado_bitacora?: string;
  cita?: Cita;
  autor?: Usuario;
}

interface Consentimiento {
  id_cita: number;
  nombre_archivo: string;
  fecha_consentimiento: Date;
}

export interface Models {
  Expediente: any;
  Paciente: any;
  Usuario: any;
  Dentista: any;
  Direccion: any;
  ExpedientePadecimiento: any;
  Padecimiento: any;
  Odontograma: any;
  Bitacora: any;
  Cita: any;
  Consentimiento: any;
}

// ─── Azure Blob Storage (sin cambios) ─────────────────────────────────────
const _azureConnectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
const _azureContainer = process.env.AZURE_STORAGE_CONTAINER;

async function descargarBlobComoBuffer(blobName: string): Promise<Buffer> {
  if (!_azureConnectionString || !_azureContainer) {
    throw new Error(
      'Variables de entorno AZURE_STORAGE_CONNECTION_STRING y AZURE_STORAGE_CONTAINER no definidas',
    );
  }
  const blobServiceClient = BlobServiceClient.fromConnectionString(_azureConnectionString);
  const containerClient = blobServiceClient.getContainerClient(_azureContainer);
  const blobClient = containerClient.getBlobClient(blobName);
  const expiraEn = new Date();
  expiraEn.setMinutes(expiraEn.getMinutes() + 5);
  const sasToken = generateBlobSASQueryParameters(
    {
      containerName: _azureContainer,
      blobName,
      permissions: BlobSASPermissions.parse('r'),
      expiresOn: expiraEn,
      contentType: 'application/pdf',
    },
    blobServiceClient.credential as StorageSharedKeyCredential,
  ).toString();
  const url = `${blobClient.url}?${sasToken}`;
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    lib
      .get(url, (response) => {
        if (response.statusCode !== 200) {
          return reject(new Error(`Azure respondió ${response.statusCode} para blob: ${blobName}`));
        }
        const chunks: Buffer[] = [];
        response.on('data', (chunk) => chunks.push(chunk));
        response.on('end', () => resolve(Buffer.concat(chunks)));
        response.on('error', reject);
      })
      .on('error', reject);
  });
}

async function fusionarConConsentimientos(
  expedienteBuffer: Buffer,
  consentimientos: Pick<Consentimiento, 'nombre_archivo'>[],
): Promise<Buffer> {
  const docFinal = await LibPDF.load(expedienteBuffer);
  for (const consent of consentimientos) {
    let blobBuffer: Buffer;
    try {
      blobBuffer = await descargarBlobComoBuffer(consent.nombre_archivo);
    } catch (err: any) {
      console.warn(
        `[PDF] No se pudo descargar consentimiento ${consent.nombre_archivo}:`,
        err.message,
      );
      continue;
    }
    try {
      const consentPdf = await LibPDF.load(blobBuffer);
      const pageCount = consentPdf.getPageCount();
      const copiedPages = await docFinal.copyPages(
        consentPdf,
        Array.from({ length: pageCount }, (_, i) => i),
      );
      copiedPages.forEach((page: PDFPage) => docFinal.addPage(page));
    } catch (err: any) {
      console.warn(
        `[PDF] No se pudo fusionar consentimiento ${consent.nombre_archivo}:`,
        err.message,
      );
    }
  }
  return Buffer.from(await docFinal.save());
}

// ─── Helpers de formato (sin cambios) ─────────────────────────────────────
function calcularEdad(fechaNacimiento?: Date | string): string {
  if (!fechaNacimiento) return '-';
  const hoy = new Date();
  const nac = new Date(fechaNacimiento);
  let edad = hoy.getFullYear() - nac.getFullYear();
  const m = hoy.getMonth() - nac.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
  return `${edad} años`;
}

function fmtFecha(iso?: Date | string): string {
  if (!iso) return '-';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return String(iso);
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function fmtFechaHora(iso?: Date | string): string {
  if (!iso) return '-';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return String(iso);
  return d.toLocaleString('es-MX', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function buildDomicilio(direccion?: Direccion): string {
  if (!direccion) return '-';
  const partes = [
    direccion.calle,
    direccion.num_ext ? `#${direccion.num_ext}` : null,
    direccion.num_int ? `Int. ${direccion.num_int}` : null,
    direccion.colonia,
    direccion.municipio,
    direccion.estado,
    direccion.codigo_postal,
  ].filter(Boolean);
  return partes.join(', ') || '-';
}

// ─── Renderizado del odontograma en SVG (estático, basado en datos) ─────────
function renderOdontogramaSVG(odontogramaData: OdontogramaDiente[]): string {
  // Mismas constantes del componente Vue
  const S = 36;
  const OFF = 10;
  const GAP = 4;
  const STEP = S + GAP;
  const PAD = 18;
  const W = 700;
  const H = 190;

  const SURF_LABELS: Record<string, string> = {
    top: 'Oclusal',
    bottom: 'Cervical',
    left: 'Mesial',
    right: 'Distal',
    center: 'Central',
  };
  const CONDICION_LABELS: Record<string, string> = {
    caries: 'Caries',
    restoration: 'Restauracion',
    sealant: 'Sellador',
    fracture: 'Fractura',
    crown: 'Corona',
    extracted: 'Extraido',
  };

  // Construir un mapa rápido diente -> estado
  const toothMap: Record<number, OdontogramaDiente> = {};
  odontogramaData.forEach((t) => {
    toothMap[t.num] = t;
  });

  // Definir grupos de dientes (igual que en el componente)
  const upperRight = [18, 17, 16, 15, 14, 13, 12, 11];
  const upperLeft = [21, 22, 23, 24, 25, 26, 27, 28];
  const lowerRight = [48, 47, 46, 45, 44, 43, 42, 41];
  const lowerLeft = [31, 32, 33, 34, 35, 36, 37, 38];

  const cx = W / 2;
  const xPos = (q: string, i: number) =>
    q.includes('r') ? cx - PAD - STEP * (i + 1) : cx + PAD + STEP * i;
  const teethPos = [
    ...upperRight.map((num, i) => ({ num, x: xPos('ur', i), y: 18 })),
    ...upperLeft.map((num, i) => ({ num, x: xPos('ul', i), y: 18 })),
    ...lowerRight.map((num, i) => ({ num, x: xPos('lr', i), y: 105 })),
    ...lowerLeft.map((num, i) => ({ num, x: xPos('ll', i), y: 105 })),
  ];

  // Superficies polígonos y rectángulos (igual que en el componente)
  const surfacePoints = {
    top: `1,1 ${S - 1},1 ${S - OFF},${OFF} ${OFF},${OFF}`,
    bottom: `${OFF},${S - OFF} ${S - OFF},${S - OFF} ${S - 1},${S - 1} 1,${S - 1}`,
    left: `1,1 ${OFF},${OFF} ${OFF},${S - OFF} 1,${S - 1}`,
    right: `${S - OFF},${OFF} ${S - 1},1 ${S - 1},${S - 1} ${S - OFF},${S - OFF}`,
  };
  const centerRect = { x: OFF, y: OFF, w: S - OFF * 2, h: S - OFF * 2 };

  const dividerLines = [
    { x1: OFF, y1: OFF, x2: S - OFF, y2: OFF },
    { x1: OFF, y1: S - OFF, x2: S - OFF, y2: S - OFF },
    { x1: OFF, y1: OFF, x2: OFF, y2: S - OFF },
    { x1: S - OFF, y1: OFF, x2: S - OFF, y2: S - OFF },
    { x1: 1, y1: 1, x2: OFF, y2: OFF },
    { x1: S - 1, y1: 1, x2: S - OFF, y2: OFF },
    { x1: 1, y1: S - 1, x2: OFF, y2: S - OFF },
    { x1: S - 1, y1: S - 1, x2: S - OFF, y2: S - OFF },
  ];

  const getSurfaceClass = (tooth: OdontogramaDiente | undefined, surf: string) => {
    const val = tooth?.surfaces?.[surf];
    return val ? `surf-${val}` : 'surf-healthy';
  };

  const getConditionFill = (tooth: OdontogramaDiente | undefined) => {
    const cond = tooth?.condition;
    if (cond === 'extracted') return 'xt-line-group';
    if (cond === 'crown') return 'surf-crown';
    return '';
  };

  // Generar SVG
  let svg = `<svg width="100%" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="background: white; border-radius: 8px; margin-top: 8px;">`;
  // Líneas guía
  svg += `<line x1="0" y1="${H / 2}" x2="${W}" y2="${H / 2}" stroke="#e5e7eb" stroke-width="0.5" stroke-dasharray="3 3" />`;
  svg += `<line x1="${W / 2}" y1="0" x2="${W / 2}" y2="${H}" stroke="#e5e7eb" stroke-width="0.5" stroke-dasharray="3 3" />`;
  // Etiquetas
  svg += `<text x="10" y="12" font-size="8" fill="#9ca3af">SUP. DERECHO</text>`;
  svg += `<text x="${W - 80}" y="12" font-size="8" fill="#9ca3af">SUP. IZQUIERDO</text>`;
  svg += `<text x="10" y="${H - 8}" font-size="8" fill="#9ca3af">INF. DERECHO</text>`;
  svg += `<text x="${W - 80}" y="${H - 8}" font-size="8" fill="#9ca3af">INF. IZQUIERDO</text>`;

  for (const t of teethPos) {
    const tooth = toothMap[t.num];
    const condClass = getConditionFill(tooth);
    svg += `<g transform="translate(${t.x},${t.y})">`;
    svg += `<rect x="1" y="1" width="${S - 2}" height="${S - 2}" rx="4" fill="#f9fafb" stroke="#d1d5db" stroke-width="1.5" />`;
    // Superficies
    for (const surf of ['top', 'bottom', 'left', 'right'] as const) {
      const cls = getSurfaceClass(tooth, surf);
      svg += `<polygon points="${surfacePoints[surf]}" class="${cls}" />`;
    }
    // Centro
    const centerCls = getSurfaceClass(tooth, 'center');
    svg += `<rect x="${centerRect.x}" y="${centerRect.y}" width="${centerRect.w}" height="${centerRect.h}" class="${centerCls}" />`;
    // Líneas divisorias
    for (const line of dividerLines) {
      svg += `<line x1="${line.x1}" y1="${line.y1}" x2="${line.x2}" y2="${line.y2}" stroke="#c0bfba" stroke-width="0.8" pointer-events="none" />`;
    }
    // Condiciones especiales (extraído o corona)
    if (condClass === 'xt-line-group') {
      svg += `<line x1="5" y1="5" x2="${S - 5}" y2="${S - 5}" stroke="#f97316" stroke-width="2.5" stroke-linecap="round" />`;
      svg += `<line x1="${S - 5}" y1="5" x2="5" y2="${S - 5}" stroke="#f97316" stroke-width="2.5" stroke-linecap="round" />`;
    } else if (condClass === 'surf-crown') {
      svg += `<rect x="3" y="3" width="${S - 6}" height="${S - 6}" rx="3" fill="none" stroke="#a78bfa" stroke-width="2.5" />`;
    }
    // Número del diente
    svg += `<text x="${S / 2}" y="${S + 10}" text-anchor="middle" font-size="7.5" fill="#9ca3af" font-family="monospace">${t.num}</text>`;
    svg += `</g>`;
  }

  // Estilos inline (para colorear las superficies)
  svg += `<style>
    .surf-caries { fill: #ef4444; }
    .surf-restoration { fill: #10b981; }
    .surf-sealant { fill: #3b82f6; }
    .surf-fracture { fill: #fbbf24; }
    .surf-crown { fill: none; stroke: #a78bfa; stroke-width: 2.5; }
    .surf-healthy { fill: transparent; }
    .xt-line-group { fill: none; stroke: #f97316; stroke-width: 2.5; stroke-linecap: round; }
  </style>`;
  svg += `</svg>`;

  return svg;
}

// ─── Generación del HTML responsivo ─────────────────────────────────────
function buildExpedienteHTML(
  expediente: Expediente,
  patientInfo: any,
  generalInfo: any,
  antecedentes: {
    heredofamiliares: any[];
    patologicos: any[];
    noPatologicos: any[];
    ginecoObstetrico: any[];
  },
  odontogramaData: OdontogramaDiente[],
  odontogramaFecha: Date | null,
  bitacoras: Bitacora[],
  consentimientos: Consentimiento[],
): string {
  const escapeHtml = (str: string) =>
    String(str || '').replace(/[&<>]/g, (m) => {
      if (m === '&') return '&amp;';
      if (m === '<') return '&lt;';
      if (m === '>') return '&gt;';
      return m;
    });

  const renderAntecedentesLista = (titulo: string, lista: any[]) => `
    <div class="antecedente-group">
      <h3>${escapeHtml(titulo)}</h3>
      ${
        lista.length === 0
          ? '<p class="empty">Sin antecedentes registrados.</p>'
          : `
        <ul>
          ${lista
            .map(
              (item) => `
            <li><strong>${escapeHtml(item.nombre)}</strong>${item.nota ? ` <span class="nota">- ${escapeHtml(item.nota)}</span>` : ''}</li>
          `,
            )
            .join('')}
        </ul>
      `
      }
    </div>
  `;

  const odontogramaSVG = renderOdontogramaSVG(odontogramaData);

  const renderOdontogramaTabla = () => {
    if (!odontogramaData.length) {
      return '<p class="empty">Sin hallazgos odontológicos registrados.</p>';
    }
    const SURF_LABELS: Record<string, string> = {
      top: 'Oclusal',
      bottom: 'Cervical',
      left: 'Mesial',
      right: 'Distal',
      center: 'Central',
    };
    const CONDICION_LABELS: Record<string, string> = {
      caries: 'Caries',
      restoration: 'Restauración',
      sealant: 'Sellador',
      fracture: 'Fractura',
      crown: 'Corona',
      extracted: 'Extraído',
    };
    return `
      <table class="odontograma-table">
        <thead>
          <tr><th>Diente</th><th>Condición</th><th>Superficies afectadas</th></tr>
        </thead>
        <tbody>
          ${odontogramaData
            .map((tooth) => {
              const surfStr = Object.entries(tooth.surfaces || {})
                .filter(([, v]) => v)
                .map(([k, v]) => `${SURF_LABELS[k] || k}: ${CONDICION_LABELS[v] || v}`)
                .join('  |  ');
              return `
              <tr>
                <td>${tooth.num}</td>
                <td>${CONDICION_LABELS[tooth.condition ?? ''] || '-'}</td>
                <td>${surfStr || '-'}</td>
              </tr>
            `;
            })
            .join('')}
        </tbody>
      </table>
    `;
  };

  const renderBitacorasTabla = () => {
    if (!bitacoras.length) {
      return '<p class="empty">Sin notas de evolución registradas.</p>';
    }
    return `
      <table class="bitacora-table">
        <thead>
          <tr><th>Fecha</th><th>Acción realizada</th><th>Descripción</th><th>Estado</th></tr>
        </thead>
        <tbody>
          ${bitacoras
            .map(
              (bit) => `
            <tr>
              <td>${fmtFechaHora(bit.fecha_creacion)}</td>
              <td>${escapeHtml(bit.accion_realizada || '-')}</td>
              <td>${escapeHtml(bit.descripcion || '-')}</td>
              <td class="estado-${(bit.estado_bitacora || 'pendiente').toLowerCase()}">${escapeHtml(bit.estado_bitacora || 'Pendiente')}</td>
            </tr>
          `,
            )
            .join('')}
        </tbody>
      </table>
    `;
  };

  return `<!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <title>Expediente Clínico - ${escapeHtml(patientInfo.nombre)}</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body {
        font-family: 'Helvetica', 'Arial', sans-serif;
        font-size: 9pt;
        line-height: 1.4;
        margin: 0.5cm;
        color: #1C2833;
      }
      .header {
        background-color: #1B4F72;
        color: white;
        padding: 0.5cm;
        text-align: center;
        margin-bottom: 0.5cm;
      }
      .header h1 { font-size: 16pt; margin-bottom: 4px; }
      .header p { font-size: 8pt; color: #AED6F1; }
      .info-bar {
        background-color: #EBF5FB;
        padding: 0.3cm;
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;
        margin-bottom: 0.5cm;
        border-left: 4px solid #2E86C1;
      }
      .info-bar > div { flex: 1; min-width: 200px; }
      .section { margin-bottom: 0.6cm; page-break-inside: avoid; }
      .section h2 {
        background-color: #D6EAF8;
        padding: 4px 8px;
        font-size: 10pt;
        color: #1B4F72;
        margin-bottom: 6px;
      }
      .section h3 {
        font-size: 9pt;
        color: #2E86C1;
        margin-top: 8px;
        margin-bottom: 4px;
      }
      .two-columns {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        margin-bottom: 8px;
      }
      .col { flex: 1; min-width: 180px; }
      .data-row {
        display: flex;
        margin-bottom: 4px;
        flex-wrap: wrap;
      }
      .data-key {
        font-weight: bold;
        color: #7F8C8D;
        width: 110px;
        flex-shrink: 0;
      }
      .data-value { flex: 1; word-break: break-word; }
      .full-width { margin-top: 4px; }
      table {
        width: 100%;
        border-collapse: collapse;
        margin: 8px 0;
        font-size: 8pt;
      }
      th, td {
        border: 1px solid #AEB6BF;
        padding: 5px;
        text-align: left;
        vertical-align: top;
      }
      th {
        background-color: #2E86C1;
        color: white;
        font-weight: bold;
      }
      tr:nth-child(even) { background-color: #F4F6F7; }
      .odontograma-table td, .bitacora-table td { word-break: break-word; }
      .estado-revisado { color: #1E8449; font-weight: bold; }
      .estado-anulada { color: #922B21; font-weight: bold; }
      .estado-pendiente { color: #B7950B; font-weight: bold; }
      .empty { color: #7F8C8D; font-style: italic; margin: 8px 0; }
      .footer {
        margin-top: 0.8cm;
        border-top: 1px solid #AEB6BF;
        padding-top: 0.2cm;
        font-size: 6.5pt;
        color: #7F8C8D;
        display: flex;
        justify-content: space-between;
        flex-wrap: wrap;
      }
      .consent-item { margin: 8px 0 0 12px; font-size: 8pt; }
      @media print {
        body { margin: 1cm; }
        .section { page-break-inside: avoid; }
      }
    </style>
  </head>
  <body>
    <div class="header">
      <h1>EXPEDIENTE CLÍNICO</h1>
    </div>

    <div class="info-bar">
      <div><strong>${escapeHtml(generalInfo.consultorio)}</strong><br>
      Odontólogo: ${escapeHtml(generalInfo.odontologo)}<br>
      Cédula: ${escapeHtml(generalInfo.cedulaProfesional)}</div>
      <div>Fecha apertura: ${generalInfo.fechaElaboracion}<br>
      Impresión: ${generalInfo.fechaImpresion}<br>
      Estado: <span style="color:${generalInfo.estadoExpediente === 'En tratamiento' ? '#1E8449' : '#B7950B'}">${generalInfo.estadoExpediente}</span></div>
    </div>

    <div class="section">
      <h2>1. Datos Generales del Paciente</h2>
      <div class="two-columns">
        <div class="col">
          <div class="data-row"><div class="data-key">Nombre completo:</div><div class="data-value">${escapeHtml(patientInfo.nombre)}</div></div>
          <div class="data-row"><div class="data-key">Fecha nacimiento:</div><div class="data-value">${patientInfo.fechaNacimiento}</div></div>
          <div class="data-row"><div class="data-key">Edad:</div><div class="data-value">${patientInfo.edad}</div></div>
          <div class="data-row"><div class="data-key">Sexo:</div><div class="data-value">${escapeHtml(patientInfo.sexo)}</div></div>
          <div class="data-row"><div class="data-key">CURP:</div><div class="data-value">${escapeHtml(patientInfo.curp)}</div></div>
          <div class="data-row"><div class="data-key">Ocupación:</div><div class="data-value">${escapeHtml(patientInfo.ocupacion)}</div></div>
        </div>
        <div class="col">
          <div class="data-row"><div class="data-key">Correo:</div><div class="data-value">${escapeHtml(patientInfo.correo)}</div></div>
          <div class="data-row"><div class="data-key">Teléfono:</div><div class="data-value">${escapeHtml(patientInfo.telefono)}</div></div>
          <div class="data-row"><div class="data-key">Tipo sangre:</div><div class="data-value">${escapeHtml(patientInfo.tipoSangre)}</div></div>
          <div class="data-row"><div class="data-key">Estatura:</div><div class="data-value">${patientInfo.estatura}</div></div>
          <div class="data-row"><div class="data-key">Peso:</div><div class="data-value">${patientInfo.peso}</div></div>
        </div>
      </div>
      <div class="data-row full-width"><div class="data-key">Domicilio:</div><div class="data-value">${escapeHtml(patientInfo.domicilio)}</div></div>
    </div>

    <div class="section">
      <h2>2. Interrogatorio - Antecedentes</h2>
      ${renderAntecedentesLista('Heredofamiliares', antecedentes.heredofamiliares)}
      ${renderAntecedentesLista('Personales Patológicos (incluye tabaco, alcohol y sustancias adictivas)', antecedentes.patologicos)}
      ${renderAntecedentesLista('Personales No Patológicos', antecedentes.noPatologicos)}
      ${antecedentes.ginecoObstetrico.length ? renderAntecedentesLista('Gineco-Obstétricos', antecedentes.ginecoObstetrico) : ''}
    </div>

    <div class="section">
      <h2>3. Exploración Física</h2>
      <div class="two-columns">
        <div class="col"><div class="data-row"><div class="data-key">Tipo sangre:</div><div class="data-value">${escapeHtml(patientInfo.tipoSangre)}</div></div></div>
        <div class="col"><div class="data-row"><div class="data-key">Peso:</div><div class="data-value">${patientInfo.peso}</div></div></div>
        <div class="col"><div class="data-row"><div class="data-key">Estatura:</div><div class="data-value">${patientInfo.estatura}</div></div></div>
      </div>
      <p class="empty">Nota: Los campos de signos vitales (T/A, FC, FR, Temp.), habitus exterior y exploración de cavidad oral, ATM, encías y estructuras adyacentes deberán completarse en la consulta.</p>
    </div>

    <div class="section">
      <h2>4. Diagnóstico - Observaciones Generales</h2>
      <p>${escapeHtml(expediente.observaciones_generales || 'Sin observaciones registradas.')}</p>
    </div>

    <div class="section">
        <h2>5. Odontograma - Hallazgos Dentales</h2>
        ${odontogramaFecha ? `<p class="empty">Última actualización: ${fmtFechaHora(odontogramaFecha)}</p>` : ''}
        
        <!-- Leyenda de colores -->
        <div style="display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 12px; font-size: 7.5pt;">
            <div style="display: flex; align-items: center; gap: 4px;"><span style="background: #ef4444; width: 12px; height: 12px; border-radius: 2px;"></span> Caries</div>
            <div style="display: flex; align-items: center; gap: 4px;"><span style="background: #10b981; width: 12px; height: 12px; border-radius: 2px;"></span> Restauración</div>
            <div style="display: flex; align-items: center; gap: 4px;"><span style="background: #3b82f6; width: 12px; height: 12px; border-radius: 2px;"></span> Sellador</div>
            <div style="display: flex; align-items: center; gap: 4px;"><span style="background: #fbbf24; width: 12px; height: 12px; border-radius: 2px;"></span> Fractura</div>
            <div style="display: flex; align-items: center; gap: 4px;"><span style="background: #a78bfa; width: 12px; height: 12px; border-radius: 2px;"></span> Corona (contorno)</div>
            <div style="display: flex; align-items: center; gap: 4px;"><span style="background: #f97316; width: 12px; height: 12px; border-radius: 2px;"></span> Extraído (aspa)</div>
        </div>
        
        <!-- SVG del odontograma (visual) -->
        ${odontogramaData.length ? odontogramaSVG : '<p class="empty">Sin hallazgos odontológicos registrados.</p>'}
        
        <!-- Tabla detallada SIEMPRE visible -->
        ${renderOdontogramaTabla()}
    </div>

    <div class="section">
      <h2>6. Notas de Evolución (Bitácoras)</h2>
      ${renderBitacorasTabla()}
    </div>

    <div class="section">
      <h2>7. Carta de Consentimiento Informado</h2>
      ${
        consentimientos.length === 0
          ? '<p class="empty">No se encontró carta de consentimiento informado registrada para este paciente.</p>'
          : `<p>Se encontr${consentimientos.length === 1 ? 'o' : 'aron'} ${consentimientos.length} carta${consentimientos.length === 1 ? '' : 's'} de consentimiento informado. El documento${consentimientos.length === 1 ? '' : 's'} original${consentimientos.length === 1 ? '' : 'es'} se adjunta a continuación conforme a la NOM-004-SSA3-2012.</p>
         ${consentimientos.map((c, idx) => `<div class="consent-item">- Consentimiento ${idx + 1}  -  Fecha: ${fmtFecha(c.fecha_consentimiento)}  |  Cita ID: ${c.id_cita}</div>`).join('')}`
      }
    </div>

    <div class="footer">
      <span>Generado conforme a NOM-004-SSA3-2012 - Expediente Clínico</span>
      <span>Página <span class="pageNumber"></span> de <span class="totalPages"></span></span>
    </div>
  </body>
  </html>`;
}

// ─── Función principal con Puppeteer (reemplaza a la anterior) ────────────
export async function generarExpedientePDF(
  expedienteId: number | string,
  res: Response,
  models: Models,
): Promise<void> {
  const {
    Expediente,
    Paciente,
    Usuario,
    Dentista,
    Direccion,
    ExpedientePadecimiento,
    Padecimiento,
    Odontograma,
    Bitacora,
    Cita,
    Consentimiento,
  } = models;

  // 1. Consultar expediente (igual que antes)
  const expediente = (await Expediente.findByPk(expedienteId, {
    include: [
      {
        model: Paciente,
        as: 'paciente',
        include: [
          { model: Usuario, as: 'usuario' },
          { model: Direccion, as: 'direccion' },
        ],
      },
      { model: Dentista, as: 'dentista', include: [{ model: Usuario, as: 'usuario' }] },
    ],
  })) as Expediente | null;

  if (!expediente) {
    res.status(404).json({ message: 'Expediente no encontrado' });
    return;
  }

  // Antecedentes
  const antecedentes = (await ExpedientePadecimiento.findAll({
    where: { id_expediente: expedienteId },
    include: [{ model: Padecimiento, as: 'padecimiento' }],
    order: [['tipo_antecedente', 'ASC']],
  })) as ExpedientePadecimiento[];

  // Odontograma
  const odontograma = (await Odontograma.findOne({
    where: { id_expediente: expedienteId },
    order: [['fecha_actualizacion', 'DESC']],
  })) as Odontograma | null;

  // Bitácoras
  const bitacoras = (await Bitacora.findAll({
    where: { '$cita.id_paciente$': expediente.id_paciente },
    include: [{ model: Cita, as: 'cita', attributes: ['fecha_hora_inicio', 'id_paciente'] }],
    order: [['fecha_creacion', 'DESC']],
    limit: 50,
  })) as Bitacora[];

  // Consentimientos
  const citasDelPaciente = (await Cita.findAll({
    where: { id_paciente: expediente.id_paciente },
    attributes: ['id_cita'],
  })) as Pick<Cita, 'id_cita'>[];
  const idCitas = citasDelPaciente.map((c) => c.id_cita);
  const consentimientos =
    idCitas.length > 0
      ? ((await Consentimiento.findAll({
          where: { id_cita: { [Op.in]: idCitas } },
          order: [['fecha_consentimiento', 'ASC']],
        })) as Consentimiento[])
      : [];

  // Preparar datos para el HTML
  const pacUsuario = expediente.paciente?.usuario || ({} as Usuario);
  const dentUsuario = expediente.dentista?.usuario || ({} as Usuario);
  const direccion = expediente.paciente?.direccion;

  const patientInfo = {
    nombre:
      [pacUsuario.nombre, pacUsuario.apellido_paterno, pacUsuario.apellido_materno]
        .filter(Boolean)
        .join(' ') || '-',
    fechaNacimiento: fmtFecha(pacUsuario.fecha_nacimiento),
    edad: calcularEdad(pacUsuario.fecha_nacimiento),
    sexo: pacUsuario.genero || '-',
    curp: pacUsuario.curp || '-',
    correo: pacUsuario.correo || '-',
    telefono: pacUsuario.telefono || '-',
    domicilio: buildDomicilio(direccion),
    tipoSangre: expediente.tipo_sangre || '-',
    estatura: expediente.estatura ? `${expediente.estatura} cm` : '-',
    peso: expediente.peso ? `${expediente.peso} kg` : '-',
    ocupacion: expediente.ocupacion || '-',
  };

  const generalInfo = {
    consultorio: 'Consultorio Dental',
    odontologo: `${dentUsuario.nombre || ''} ${dentUsuario.apellido_paterno || ''}`.trim() || '-',
    cedulaProfesional: expediente.dentista?.no_cedula || '-',
    fechaElaboracion: fmtFecha(expediente.fecha_creacion),
    fechaImpresion: fmtFecha(new Date()),
    estadoExpediente: 'En tratamiento',
  };

  const groupAntecedentes = (tipo: string) =>
    antecedentes
      .filter((a) => a.tipo_antecedente === tipo)
      .map((a) => ({ nombre: a.padecimiento?.nombre_padecimiento || '-', nota: a.nota || '' }));

  const heredofamiliares = groupAntecedentes('heredofamiliar');
  const patologicos = groupAntecedentes('patologico_personal');
  const noPatologicos = groupAntecedentes('no_patologico');
  const ginecoObstetrico = groupAntecedentes('gineco_obstetrico');

  const odontogramaData = odontograma?.datos_odontograma || [];

  // Generar HTML
  const htmlContent = buildExpedienteHTML(
    expediente,
    patientInfo,
    generalInfo,
    { heredofamiliares, patologicos, noPatologicos, ginecoObstetrico },
    odontogramaData,
    odontograma?.fecha_actualizacion || null,
    bitacoras,
    consentimientos,
  );

  // Generar PDF con Puppeteer
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--no-first-run',
      '--no-zygote',
      '--single-process'
    ]
  });
  const page = await browser.newPage();
  await page.setContent(htmlContent, { waitUntil: 'load' });
  const expedienteBuffer = await page.pdf({
    format: 'Letter',
    printBackground: true,
    margin: { top: '0.5in', bottom: '0.5in', left: '0.5in', right: '0.5in' },
  });
  await browser.close();

  // Fusionar con consentimientos de Azure
  const pdfFinal =
    consentimientos.length > 0
      ? await fusionarConConsentimientos(Buffer.from(expedienteBuffer), consentimientos)
      : Buffer.from(expedienteBuffer);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Length', pdfFinal.length);
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="expediente_${expedienteId}_${Date.now()}.pdf"`,
  );
  res.end(pdfFinal);
}
