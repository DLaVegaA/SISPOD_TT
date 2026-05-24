/**
 * generarExpedientePDF.ts
 * Genera el expediente clínico en PDF conforme a NOM-004-SSA3-2012.
 * Las cartas de consentimiento informado se descargan desde Azure Blob Storage
 * y se fusionan como páginas reales al final del documento.
 *
 * Uso en Express:
 *   import { generarExpedientePDF } from './generarExpedientePDF';
 *   router.get('/expediente/:id/pdf', async (req, res) => {
 *     await generarExpedientePDF(req.params.id, res, models);
 *   });
 *
 * Dependencias:
 *   npm install pdfkit pdf-lib @azure/storage-blob
 *   npm install --save-dev @types/pdfkit @types/node
 */

import PDFDocument from 'pdfkit';
import { PDFDocument as LibPDF } from 'pdf-lib';
import {
  BlobServiceClient,
  generateBlobSASQueryParameters,
  BlobSASPermissions,
  StorageSharedKeyCredential,
} from '@azure/storage-blob';
import https from 'https';
import http from 'http';
import { Op } from 'sequelize';
import { Response } from 'express';

// ─── Tipos de datos y modelos (definiciones mínimas) ─────────────────────────
// Ajusta estos tipos según tus modelos reales de Sequelize
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
  Usuario?: Usuario;
  Direccion?: Direccion;
}

interface Dentista {
  Usuario?: Usuario;
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
  Paciente?: Paciente;
  Dentista?: Dentista;
}

interface Padecimiento {
  nombre_padecimiento: string;
}

interface ExpedientePadecimiento {
  tipo_antecedente: string;
  nota?: string;
  Padecimiento?: Padecimiento;
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
  Cita?: Cita;
  Usuario?: Usuario;
}

interface Consentimiento {
  id_cita: number;
  nombre_archivo: string;
  fecha_consentimiento: Date;
}

// Tipo para el objeto de modelos que recibe la función principal
export interface Models {
  Expediente: any; // Sequelize model, usar any o definir más específico
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

// ─── Azure Blob Storage ───────────────────────────────────────────────────────
const _azureConnectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
const _azureContainer = process.env.AZURE_STORAGE_CONTAINER;

/**
 * Descarga un blob de Azure como Buffer.
 * @param blobName - Valor de nombre_archivo en la tabla consentimientos
 */
async function descargarBlobComoBuffer(blobName: string): Promise<Buffer> {
  if (!_azureConnectionString || !_azureContainer) {
    throw new Error(
      'Variables de entorno AZURE_STORAGE_CONNECTION_STRING y AZURE_STORAGE_CONTAINER no definidas'
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
    blobServiceClient.credential as StorageSharedKeyCredential
  ).toString();

  const url = `${blobClient.url}?${sasToken}`;

  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    lib
      .get(url, (response) => {
        if (response.statusCode !== 200) {
          return reject(
            new Error(`Azure respondió ${response.statusCode} para blob: ${blobName}`)
          );
        }
        const chunks: Buffer[] = [];
        response.on('data', (chunk) => chunks.push(chunk));
        response.on('end', () => resolve(Buffer.concat(chunks)));
        response.on('error', reject);
      })
      .on('error', reject);
  });
}

/**
 * Fusiona el expediente principal con los PDFs de consentimiento descargados de Azure.
 * @param expedienteBuffer - PDF del expediente generado con pdfkit
 * @param consentimientos - Lista de consentimientos con nombre_archivo
 */
async function fusionarConConsentimientos(
  expedienteBuffer: Buffer,
  consentimientos: Pick<Consentimiento, 'nombre_archivo'>[]
): Promise<Buffer> {
  const docFinal = await LibPDF.load(expedienteBuffer);

  for (const consent of consentimientos) {
    let blobBuffer: Buffer;
    try {
      blobBuffer = await descargarBlobComoBuffer(consent.nombre_archivo);
    } catch (err: any) {
      console.warn(`[PDF] No se pudo descargar consentimiento ${consent.nombre_archivo}:`, err.message);
      continue;
    }

    try {
      const consentPdf = await LibPDF.load(blobBuffer);
      const pageCount = consentPdf.getPageCount();
      const copiedPages = await docFinal.copyPages(
        consentPdf,
        Array.from({ length: pageCount }, (_, i) => i)
      );
      copiedPages.forEach((page) => docFinal.addPage(page));
    } catch (err: any) {
      console.warn(`[PDF] No se pudo fusionar consentimiento ${consent.nombre_archivo}:`, err.message);
    }
  }

  return Buffer.from(await docFinal.save());
}

// ─── Colores corporativos ────────────────────────────────────────────────────
const COLOR = {
  primary: '#1B4F72',
  accent: '#2E86C1',
  light: '#D6EAF8',
  muted: '#7F8C8D',
  border: '#AEB6BF',
  white: '#FFFFFF',
  dark: '#1C2833',
  green: '#1E8449',
  amber: '#B7950B',
  red: '#922B21',
};

// ─── Helpers de dibujo ──────────────────────────────────────────────────────
function filledRect(doc: PDFKit.PDFDocument, x: number, y: number, w: number, h: number, color: string): void {
  doc.save().rect(x, y, w, h).fill(color).restore();
}

function hLine(doc: PDFKit.PDFDocument, x: number, y: number, w: number, color: string = COLOR.border, lw: number = 0.5): void {
  doc.save().moveTo(x, y).lineTo(x + w, y).strokeColor(color).lineWidth(lw).stroke().restore();
}

function sectionHeader(doc: PDFKit.PDFDocument, title: string, y: number, pageMargin: number, contentWidth: number): number {
  filledRect(doc, pageMargin, y, contentWidth, 16, COLOR.light);
  doc
    .fontSize(8)
    .fillColor(COLOR.primary)
    .font('Helvetica-Bold')
    .text(title.toUpperCase(), pageMargin + 6, y + 4, { width: contentWidth - 12 });
  return y + 16 + 4;
}

function kvRow(
  doc: PDFKit.PDFDocument,
  key: string,
  value: string,
  x: number,
  y: number,
  keyW: number,
  valW: number,
  fontSize: number = 8
): void {
  doc
    .fontSize(fontSize)
    .fillColor(COLOR.muted)
    .font('Helvetica-Bold')
    .text(key + ':', x, y, { width: keyW, continued: false });
  doc
    .fontSize(fontSize)
    .fillColor(COLOR.dark)
    .font('Helvetica')
    .text(String(value || '—'), x + keyW + 4, y, { width: valW - 4 });
}

function drawFooter(doc: PDFKit.PDFDocument, pageNum: number, totalPages: number, nomRef: string): void {
  const y = doc.page.height - 30;
  const pw = doc.page.width;
  const mx = 40;
  hLine(doc, mx, y - 4, pw - mx * 2, COLOR.border);
  doc.fontSize(6.5).fillColor(COLOR.muted).font('Helvetica');
  doc.text(nomRef, mx, y, { width: (pw - mx * 2) * 0.7 });
  doc.text(`Pág. ${pageNum} / ${totalPages}`, mx, y, {
    width: pw - mx * 2,
    align: 'right',
  });
}

function calcularEdad(fechaNacimiento?: Date | string): string {
  if (!fechaNacimiento) return '—';
  const hoy = new Date();
  const nac = new Date(fechaNacimiento);
  let edad = hoy.getFullYear() - nac.getFullYear();
  const m = hoy.getMonth() - nac.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
  return `${edad} años`;
}

function fmtFecha(iso?: Date | string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return String(iso);
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function fmtFechaHora(iso?: Date | string): string {
  if (!iso) return '—';
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
  if (!direccion) return '—';
  const partes = [
    direccion.calle,
    direccion.num_ext ? `#${direccion.num_ext}` : null,
    direccion.num_int ? `Int. ${direccion.num_int}` : null,
    direccion.colonia,
    direccion.municipio,
    direccion.estado,
    direccion.codigo_postal,
  ].filter(Boolean);
  return partes.join(', ') || '—';
}

// ─── Sección: Odontograma (tabla textual) ───────────────────────────────────
const CONDICION_LABELS: Record<string, string> = {
  caries: 'Caries',
  restoration: 'Restauración',
  sealant: 'Sellador',
  fracture: 'Fractura',
  crown: 'Corona',
  extracted: 'Extraído',
};

function renderOdontograma(
  doc: PDFKit.PDFDocument,
  odontogramaData: OdontogramaDiente[],
  pageMargin: number,
  contentWidth: number,
  startY: number
): number {
  const affected = (odontogramaData || []).filter((t) => {
    if (t.condition) return true;
    return Object.values(t.surfaces || {}).some(Boolean);
  });

  if (affected.length === 0) {
    doc
      .fontSize(8)
      .fillColor(COLOR.muted)
      .font('Helvetica')
      .text('Sin hallazgos odontológicos registrados.', pageMargin, startY);
    return startY + 14;
  }

  const cols = {
    num: { x: pageMargin, w: 36, label: 'Diente' },
    condition: { x: pageMargin + 36, w: 68, label: 'Condición' },
    surfaces: { x: pageMargin + 104, w: contentWidth - 104, label: 'Superficies afectadas' },
  };

  const rowH = 13;
  let y = startY;

  filledRect(doc, pageMargin, y, contentWidth, rowH, COLOR.accent);
  Object.values(cols).forEach((col) => {
    doc
      .fontSize(7)
      .fillColor(COLOR.white)
      .font('Helvetica-Bold')
      .text(col.label, col.x + 3, y + 3, { width: col.w - 4 });
  });
  y += rowH;

  const SURF_LABELS: Record<string, string> = {
    top: 'Oclusal',
    bottom: 'Cervical',
    left: 'Mesial',
    right: 'Distal',
    center: 'Central',
  };

  affected.forEach((tooth, idx) => {
    if (y > doc.page.height - 60) {
      doc.addPage();
      y = 40;
    }
    const bg = idx % 2 === 0 ? '#F4F6F7' : COLOR.white;
    filledRect(doc, pageMargin, y, contentWidth, rowH, bg);

    const surfStr = Object.entries(tooth.surfaces || {})
      .filter(([, v]) => v)
      .map(([k, v]) => `${SURF_LABELS[k] || k}: ${CONDICION_LABELS[v] || v}`)
      .join('  |  ');

    doc.fontSize(7.5).fillColor(COLOR.dark).font('Helvetica-Bold');
    doc.text(String(tooth.num), cols.num.x + 3, y + 3, { width: cols.num.w - 4 });
    doc
      .fontSize(7.5)
      .fillColor(COLOR.dark)
      .font('Helvetica')
      .text(CONDICION_LABELS[tooth.condition ?? ''] || '—', cols.condition.x + 3, y + 3, {
        width: cols.condition.w - 4,
      })
      .text(surfStr || '—', cols.surfaces.x + 3, y + 3, { width: cols.surfaces.w - 4 });

    hLine(doc, pageMargin, y + rowH, contentWidth, COLOR.border, 0.3);
    y += rowH;
  });

  return y + 6;
}

// ─── Función principal ───────────────────────────────────────────────────────
/**
 * Genera el PDF del expediente clínico y lo envía como respuesta HTTP.
 * @param expedienteId - ID del expediente a generar
 * @param res - Objeto Response de Express
 * @param models - Objeto con los modelos de Sequelize
 */
export async function generarExpedientePDF(
  expedienteId: number | string,
  res: Response,
  models: Models
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

  // ── 1. Consulta de datos ─────────────────────────────────────────────────
  const expediente = (await Expediente.findByPk(expedienteId, {
    include: [
      {
        model: Paciente,
        include: [
          { model: Usuario },
          { model: Direccion },
        ],
      },
      {
        model: Dentista,
        include: [{ model: Usuario }],
      },
    ],
  })) as Expediente | null;

  if (!expediente) {
    res.status(404).json({ message: 'Expediente no encontrado' });
    return;
  }

  // Antecedentes (padecimientos)
  const antecedentes = (await ExpedientePadecimiento.findAll({
    where: { id_expediente: expedienteId },
    include: [{ model: Padecimiento }],
    order: [['tipo_antecedente', 'ASC']],
  })) as ExpedientePadecimiento[];

  // Odontograma (más reciente)
  const odontograma = (await Odontograma.findOne({
    where: { id_expediente: expedienteId },
    order: [['fecha_actualizacion', 'DESC']],
  })) as Odontograma | null;

  // Bitácoras (notas de evolución)
  const bitacoras = (await Bitacora.findAll({
    where: { '$Cita.id_paciente$': expediente.id_paciente },
    include: [
      {
        model: Cita,
        attributes: ['fecha_hora_inicio', 'id_paciente'],
      },
      {
        model: Usuario,
        attributes: ['nombre', 'apellido_paterno'],
      },
    ],
    order: [['fecha_creacion', 'DESC']],
    limit: 50,
  })) as Bitacora[];

  // Consentimientos del paciente
  const citasDelPaciente = (await Cita.findAll({
    where: { id_paciente: expediente.id_paciente },
    attributes: ['id_cita'],
  })) as Pick<Cita, 'id_cita'>[];

  const idCitas = citasDelPaciente.map((c) => c.id_cita);

  const consentimientos = idCitas.length > 0
    ? ((await Consentimiento.findAll({
        where: { id_cita: { [Op.in]: idCitas } },
        order: [['fecha_consentimiento', 'ASC']],
      })) as Consentimiento[])
    : [];

  // ── 2. Extracción de datos del modelo ────────────────────────────────────
  const pacUsuario = expediente.Paciente?.Usuario || ({} as Usuario);
  const dentUsuario = expediente.Dentista?.Usuario || ({} as Usuario);
  const direccion = expediente.Paciente?.Direccion || null;

  const patientInfo = {
    nombre: [pacUsuario.nombre, pacUsuario.apellido_paterno, pacUsuario.apellido_materno]
      .filter(Boolean)
      .join(' ') || '—',
    fechaNacimiento: fmtFecha(pacUsuario.fecha_nacimiento),
    edad: calcularEdad(pacUsuario.fecha_nacimiento),
    sexo: pacUsuario.genero || '—',
    curp: pacUsuario.curp || '—',
    correo: pacUsuario.correo || '—',
    telefono: pacUsuario.telefono || '—',
    domicilio: buildDomicilio(direccion),
    tipoSangre: expediente.tipo_sangre || '—',
    estatura: expediente.estatura || '—',
    peso: expediente.peso || '—',
    ocupacion: expediente.ocupacion || '—',
  };

  const generalInfo = {
    consultorio: 'Consultorio Dental',
    odontologo: `${dentUsuario.nombre || ''} ${dentUsuario.apellido_paterno || ''}`.trim() || '—',
    cedulaProfesional: expediente.Dentista?.no_cedula || '—',
    fechaElaboracion: fmtFecha(expediente.fecha_creacion),
    fechaImpresion: fmtFecha(new Date()),
    estadoExpediente: 'En tratamiento',
  };

  // Agrupa antecedentes por tipo
  const groupAntecedentes = (tipo: string) =>
    antecedentes
      .filter((a) => a.tipo_antecedente === tipo)
      .map((a) => ({ nombre: a.Padecimiento?.nombre_padecimiento || '—', nota: a.nota || '' }));

  const heredofamiliares = groupAntecedentes('heredofamiliar');
  const patologicos = groupAntecedentes('patologico_personal');
  const noPatologicos = groupAntecedentes('no_patologico');
  const ginecoObstetrico = groupAntecedentes('gineco_obstetrico');

  const odontogramaData = odontograma?.datos_odontograma || [];

  // ── 3. Construcción del PDF ──────────────────────────────────────────────
  const doc = new PDFDocument({
    size: 'LETTER',
    margins: { top: 40, bottom: 40, left: 40, right: 40 },
    bufferPages: true,
    info: {
      Title: `Expediente Clínico — ${patientInfo.nombre}`,
      Author: generalInfo.odontologo,
      Subject: 'Historia Clínica NOM-004-SSA3-2012',
      Creator: 'Sistema de Gestión Dental',
    },
  });

  const PAGE_MARGIN = 40;
  const CONTENT_WIDTH = doc.page.width - PAGE_MARGIN * 2;
  const NOM_REF = 'Generado conforme a NOM-004-SSA3-2012 — Expediente Clínico';

  const bufferChunks: Buffer[] = [];
  doc.on('data', (chunk) => bufferChunks.push(chunk));

  let y = PAGE_MARGIN;

  // ════════════════════════════════════════════════════════════════════════
  // PÁGINA 1 — Portada + Datos Generales + Interrogatorio
  // ════════════════════════════════════════════════════════════════════════

  filledRect(doc, 0, 0, doc.page.width, 54, COLOR.primary);
  doc
    .fontSize(14)
    .fillColor(COLOR.white)
    .font('Helvetica-Bold')
    .text('EXPEDIENTE CLÍNICO', PAGE_MARGIN, 12, { width: CONTENT_WIDTH, align: 'center' });
  doc
    .fontSize(8)
    .fillColor('#AED6F1')
    .font('Helvetica')
    .text('Consulta Odontológica  ·  NOM-004-SSA3-2012', PAGE_MARGIN, 30, {
      width: CONTENT_WIDTH,
      align: 'center',
    });
  y = 68;

  filledRect(doc, PAGE_MARGIN, y, CONTENT_WIDTH, 36, '#EBF5FB');
  doc
    .fontSize(9)
    .fillColor(COLOR.primary)
    .font('Helvetica-Bold')
    .text(generalInfo.consultorio, PAGE_MARGIN + 8, y + 6, { width: CONTENT_WIDTH / 2 });
  doc
    .fontSize(7.5)
    .fillColor(COLOR.muted)
    .font('Helvetica')
    .text(
      `Odontólogo: ${generalInfo.odontologo}   |   Cédula: ${generalInfo.cedulaProfesional}`,
      PAGE_MARGIN + 8,
      y + 20
    );

  const col2x = PAGE_MARGIN + CONTENT_WIDTH / 2;
  doc
    .fontSize(7.5)
    .fillColor(COLOR.muted)
    .font('Helvetica')
    .text(`Fecha apertura: ${generalInfo.fechaElaboracion}`, col2x, y + 6)
    .text(`Impresión:  ${generalInfo.fechaImpresion}`, col2x, y + 18);

  const estadoColor =
    generalInfo.estadoExpediente === 'En tratamiento'
      ? COLOR.green
      : generalInfo.estadoExpediente === 'Pendiente'
      ? COLOR.amber
      : COLOR.muted;

  doc
    .fontSize(7.5)
    .fillColor(estadoColor)
    .font('Helvetica-Bold')
    .text(`Estado: ${generalInfo.estadoExpediente}`, col2x, y + 30);

  y += 44;

  // ─── SECCIÓN 1: Datos Generales del Paciente ────────────────────────────
  y = sectionHeader(doc, '1. Datos Generales del Paciente', y, PAGE_MARGIN, CONTENT_WIDTH);

  const halfW = (CONTENT_WIDTH - 12) / 2;
  const KW = 70;
  const VW = halfW - KW - 4;

  const leftCol = PAGE_MARGIN;
  const rightCol = PAGE_MARGIN + halfW + 12;

  const rows1: [string, string][] = [
    ['Nombre completo', patientInfo.nombre],
    ['Fecha nacimiento', patientInfo.fechaNacimiento],
    ['Edad', patientInfo.edad],
    ['Sexo', patientInfo.sexo],
    ['CURP', patientInfo.curp],
    ['Ocupación', patientInfo.ocupacion],
  ];
  const rows2: [string, string][] = [
    ['Correo', patientInfo.correo],
    ['Teléfono', patientInfo.telefono],
    ['Tipo de sangre', patientInfo.tipoSangre],
    ['Estatura', patientInfo.estatura ? `${patientInfo.estatura} cm` : '—'],
    ['Peso', patientInfo.peso ? `${patientInfo.peso} kg` : '—'],
  ];

  const rowH = 13;
  rows1.forEach(([k, v], i) => kvRow(doc, k, v, leftCol, y + i * rowH, KW, VW));
  rows2.forEach(([k, v], i) => kvRow(doc, k, v, rightCol, y + i * rowH, KW, VW));

  y += Math.max(rows1.length, rows2.length) * rowH + 4;

  kvRow(doc, 'Domicilio', patientInfo.domicilio, PAGE_MARGIN, y, KW, CONTENT_WIDTH - KW - 4);
  y += rowH + 8;

  // ─── SECCIÓN 2: Interrogatorio / Antecedentes ───────────────────────────
  y = sectionHeader(doc, '2. Interrogatorio — Antecedentes', y, PAGE_MARGIN, CONTENT_WIDTH);

  const renderAntecedentes = (
    titulo: string,
    lista: { nombre: string; nota: string }[],
    startY: number
  ): number => {
    let currentY = startY;
    if (currentY > doc.page.height - 80) {
      doc.addPage();
      currentY = PAGE_MARGIN;
    }

    doc
      .fontSize(7.5)
      .fillColor(COLOR.accent)
      .font('Helvetica-Bold')
      .text(titulo, PAGE_MARGIN, currentY);
    currentY += 11;

    if (lista.length === 0) {
      doc
        .fontSize(7.5)
        .fillColor(COLOR.muted)
        .font('Helvetica')
        .text('Sin antecedentes registrados.', PAGE_MARGIN + 8, currentY);
      return currentY + 12;
    }

    lista.forEach((item) => {
      if (currentY > doc.page.height - 60) {
        doc.addPage();
        currentY = PAGE_MARGIN;
      }
      doc
        .fontSize(7.5)
        .fillColor(COLOR.dark)
        .font('Helvetica-Bold')
        .text(`• ${item.nombre}`, PAGE_MARGIN + 8, currentY, { continued: !!item.nota });
      if (item.nota) {
        doc
          .font('Helvetica')
          .fillColor(COLOR.muted)
          .text(`  — ${item.nota}`, { width: CONTENT_WIDTH - 16 });
      }
      currentY += 11;
    });
    return currentY + 4;
  };

  y = renderAntecedentes('Heredofamiliares', heredofamiliares, y);
  y = renderAntecedentes('Personales Patológicos (incluye tabaco, alcohol y sustancias adictivas)', patologicos, y);
  y = renderAntecedentes('Personales No Patológicos', noPatologicos, y);
  if (ginecoObstetrico.length > 0) {
    y = renderAntecedentes('Gineco-Obstétricos', ginecoObstetrico, y);
  }

  // ─── SECCIÓN 3: Exploración Física ──────────────────────────────────────
  if (y > doc.page.height - 120) {
    doc.addPage();
    y = PAGE_MARGIN;
  }
  y = sectionHeader(doc, '3. Exploración Física', y, PAGE_MARGIN, CONTENT_WIDTH);

  const explRows: [string, string][] = [
    ['Tipo de sangre', patientInfo.tipoSangre],
    ['Peso', patientInfo.peso ? `${patientInfo.peso} kg` : '—'],
    ['Estatura', patientInfo.estatura ? `${patientInfo.estatura} cm` : '—'],
  ];
  explRows.forEach(([k, v], i) => kvRow(doc, k, v, PAGE_MARGIN, y + i * rowH, 90, 160));
  y += explRows.length * rowH;

  doc
    .fontSize(7.5)
    .fillColor(COLOR.muted)
    .font('Helvetica')
    .text(
      'Nota: Los campos de signos vitales (T/A, FC, FR, Temp.), habitus exterior y exploración de cavidad oral, ATM, encías y estructuras adyacentes deberán completarse en la consulta.',
      PAGE_MARGIN,
      y + 4,
      { width: CONTENT_WIDTH }
    );
  y += 30;

  // ─── SECCIÓN 4: Diagnóstico / Observaciones Generales ───────────────────
  if (y > doc.page.height - 100) {
    doc.addPage();
    y = PAGE_MARGIN;
  }
  y = sectionHeader(doc, '4. Diagnóstico — Observaciones Generales', y, PAGE_MARGIN, CONTENT_WIDTH);

  const observaciones = expediente.observaciones_generales || 'Sin observaciones registradas.';
  doc
    .fontSize(8)
    .fillColor(COLOR.dark)
    .font('Helvetica')
    .text(observaciones, PAGE_MARGIN, y, { width: CONTENT_WIDTH });
  y = doc.y + 10;

  // ─── SECCIÓN 5: Odontograma ──────────────────────────────────────────────
  if (y > doc.page.height - 120) {
    doc.addPage();
    y = PAGE_MARGIN;
  }
  y = sectionHeader(doc, '5. Odontograma — Hallazgos Dentales', y, PAGE_MARGIN, CONTENT_WIDTH);

  if (odontograma) {
    doc
      .fontSize(7)
      .fillColor(COLOR.muted)
      .font('Helvetica')
      .text(
        `Última actualización: ${fmtFechaHora(odontograma.fecha_actualizacion)}`,
        PAGE_MARGIN,
        y
      );
    y += 11;
  }

  const leyenda = [
    { label: 'Caries', color: '#ef4444' },
    { label: 'Restauración', color: '#10b981' },
    { label: 'Sellador', color: '#3b82f6' },
    { label: 'Fractura', color: '#fbbf24' },
    { label: 'Corona', color: '#a78bfa' },
    { label: 'Extraído', color: '#f97316' },
  ];
  leyenda.forEach((item, idx) => {
    const lx = PAGE_MARGIN + idx * (CONTENT_WIDTH / leyenda.length);
    doc.save().rect(lx, y, 8, 8).fill(item.color).restore();
    doc.fontSize(6.5).fillColor(COLOR.dark).font('Helvetica').text(item.label, lx + 10, y + 1);
  });
  y += 14;

  y = renderOdontograma(doc, odontogramaData, PAGE_MARGIN, CONTENT_WIDTH, y);

  // ─── SECCIÓN 6: Notas de Evolución (Bitácoras) ──────────────────────────
  if (y > doc.page.height - 120) {
    doc.addPage();
    y = PAGE_MARGIN;
  }
  y = sectionHeader(doc, '6. Notas de Evolución (Bitácoras)', y, PAGE_MARGIN, CONTENT_WIDTH);

  if (bitacoras.length === 0) {
    doc
      .fontSize(8)
      .fillColor(COLOR.muted)
      .font('Helvetica')
      .text('Sin notas de evolución registradas.', PAGE_MARGIN, y);
    y += 14;
  } else {
    const bcols = {
      fecha: { x: PAGE_MARGIN, w: 70 },
      accion: { x: PAGE_MARGIN + 70, w: 110 },
      desc: { x: PAGE_MARGIN + 180, w: CONTENT_WIDTH - 250 },
      estado: { x: PAGE_MARGIN + CONTENT_WIDTH - 68, w: 68 },
    };
    const bHeaders = ['Fecha', 'Acción realizada', 'Descripción', 'Estado'];
    const bRowH = 13;

    filledRect(doc, PAGE_MARGIN, y, CONTENT_WIDTH, bRowH, COLOR.accent);
    Object.values(bcols).forEach((col, i) => {
      doc
        .fontSize(7)
        .fillColor(COLOR.white)
        .font('Helvetica-Bold')
        .text(bHeaders[i], col.x + 3, y + 3, { width: col.w - 4 });
    });
    y += bRowH;

    bitacoras.forEach((bit, idx) => {
      if (y > doc.page.height - 60) {
        doc.addPage();
        y = PAGE_MARGIN;
      }
      const bg = idx % 2 === 0 ? '#F4F6F7' : COLOR.white;
      filledRect(doc, PAGE_MARGIN, y, CONTENT_WIDTH, bRowH, bg);

      const estadoBit = bit.estado_bitacora || 'Pendiente';
      const estadoC =
        estadoBit.toLowerCase() === 'revisado'
          ? COLOR.green
          : estadoBit.toLowerCase() === 'anulada'
          ? COLOR.red
          : COLOR.amber;

      doc
        .fontSize(7)
        .fillColor(COLOR.dark)
        .font('Helvetica')
        .text(fmtFechaHora(bit.fecha_creacion), bcols.fecha.x + 3, y + 3, { width: bcols.fecha.w - 4 })
        .text(bit.accion_realizada || '—', bcols.accion.x + 3, y + 3, { width: bcols.accion.w - 4 })
        .text(bit.descripcion || '—', bcols.desc.x + 3, y + 3, { width: bcols.desc.w - 4 });
      doc
        .fontSize(7)
        .fillColor(estadoC)
        .font('Helvetica-Bold')
        .text(estadoBit, bcols.estado.x + 3, y + 3, { width: bcols.estado.w - 4 });

      hLine(doc, PAGE_MARGIN, y + bRowH, CONTENT_WIDTH, COLOR.border, 0.3);
      y += bRowH;
    });
    y += 8;
  }

  // ─── SECCIÓN 7: Carta(s) de Consentimiento Informado ────────────────────
  if (y > doc.page.height - 100) {
    doc.addPage();
    y = PAGE_MARGIN;
  }
  y = sectionHeader(doc, '7. Carta de Consentimiento Informado', y, PAGE_MARGIN, CONTENT_WIDTH);

  if (consentimientos.length === 0) {
    doc
      .fontSize(8)
      .fillColor(COLOR.muted)
      .font('Helvetica')
      .text(
        'No se encontró carta de consentimiento informado registrada para este paciente.',
        PAGE_MARGIN,
        y,
        { width: CONTENT_WIDTH }
      );
    y = doc.y + 10;
  } else {
    doc
      .fontSize(8)
      .fillColor(COLOR.dark)
      .font('Helvetica')
      .text(
        `Se encontr${consentimientos.length === 1 ? 'ó' : 'aron'} ${consentimientos.length} ` +
          `carta${consentimientos.length === 1 ? '' : 's'} de consentimiento informado. ` +
          `El documento${consentimientos.length === 1 ? '' : 's'} original${consentimientos.length === 1 ? '' : 'es'} ` +
          'se adjunta a continuación conforme a la NOM-004-SSA3-2012.',
        PAGE_MARGIN,
        y,
        { width: CONTENT_WIDTH }
      );
    y = doc.y + 6;

    consentimientos.forEach((c, idx) => {
      if (y > doc.page.height - 50) {
        doc.addPage();
        y = PAGE_MARGIN;
      }
      doc
        .fontSize(7.5)
        .fillColor(COLOR.muted)
        .font('Helvetica')
        .text(
          `• Consentimiento ${idx + 1}  —  Fecha: ${fmtFecha(c.fecha_consentimiento)}  |  Cita ID: ${c.id_cita}`,
          PAGE_MARGIN + 8,
          y,
          { width: CONTENT_WIDTH - 8 }
        );
      y += 12;
    });
  }

  // ─── Numeración de páginas (solo del expediente base) ────────────────────
  const totalPagesBase = doc.bufferedPageRange().count;
  for (let i = 0; i < totalPagesBase; i++) {
    doc.switchToPage(i);
    const suffix = consentimientos.length > 0 ? ` + ${consentimientos.length} consentimiento(s)` : '';
    drawFooter(doc, i + 1, totalPagesBase, NOM_REF + suffix);
  }

  // ─── Finalizar expediente base y fusionar con consentimientos de Azure ───
  await new Promise<void>((resolve, reject) => {
    doc.on('end', resolve);
    doc.on('error', reject);
    doc.end();
  });

  const expedienteBuffer = Buffer.concat(bufferChunks);

  const pdfFinal =
    consentimientos.length > 0
      ? await fusionarConConsentimientos(expedienteBuffer, consentimientos)
      : expedienteBuffer;

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Length', pdfFinal.length);
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="expediente_${expedienteId}_${Date.now()}.pdf"`
  );
  res.end(pdfFinal);
}