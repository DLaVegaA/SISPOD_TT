import { Response } from 'express';
import { Op } from 'sequelize';
import { Resvg } from '@resvg/resvg-js';
import { PDFDocument, PDFPage, PDFFont, StandardFonts, rgb, RGB, degrees } from 'pdf-lib';
import {
  BlobServiceClient,
  generateBlobSASQueryParameters,
  BlobSASPermissions,
  StorageSharedKeyCredential,
} from '@azure/storage-blob';
import https from 'https';
import http from 'http';

// ─── Tipos de datos ──────────────────────────────────────────────────────
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

interface OdontogramaDiente {
  num: number;
  condition?: string;
  surfaces?: Record<string, string>;
}

interface Odontograma {
  fecha_actualizacion: Date;
  datos_odontograma?: OdontogramaDiente[];
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

// ─── Azure Blob Storage ───────────────────────────────────────────────────
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
  const docFinal = await PDFDocument.load(expedienteBuffer);
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
      const consentPdf = await PDFDocument.load(blobBuffer);
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

// ─── Helpers de formato ───────────────────────────────────────────────────
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

// ─── Renderizado SVG del odontograma (sin cambios) ────────────────────────
function renderOdontogramaSVG(odontogramaData: OdontogramaDiente[]): string {
  const S = 36;
  const OFF = 10;
  const GAP = 4;
  const STEP = S + GAP;
  const PAD = 18;
  const W = 700;
  const H = 190;

  const toothMap: Record<number, OdontogramaDiente> = {};
  odontogramaData.forEach((t) => {
    toothMap[t.num] = t;
  });

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

  const SURF_FILL: Record<string, string> = {
    caries: '#ef4444',
    restoration: '#10b981',
    sealant: '#3b82f6',
    fracture: '#fbbf24',
  };

  const getSurfaceFill = (tooth: OdontogramaDiente | undefined, surf: string): string => {
    const val = tooth?.surfaces?.[surf];
    return val ? SURF_FILL[val] || 'transparent' : 'transparent';
  };

  let svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="background:white;">`;
  svg += `<rect width="${W}" height="${H}" fill="white"/>`;
  svg += `<line x1="0" y1="${H / 2}" x2="${W}" y2="${H / 2}" stroke="#e5e7eb" stroke-width="0.5" stroke-dasharray="3 3"/>`;
  svg += `<line x1="${W / 2}" y1="0" x2="${W / 2}" y2="${H}" stroke="#e5e7eb" stroke-width="0.5" stroke-dasharray="3 3"/>`;
  svg += `<text x="10" y="12" font-size="8" fill="#9ca3af" font-family="Arial,sans-serif">SUP. DERECHO</text>`;
  svg += `<text x="${W - 80}" y="12" font-size="8" fill="#9ca3af" font-family="Arial,sans-serif">SUP. IZQUIERDO</text>`;
  svg += `<text x="10" y="${H - 8}" font-size="8" fill="#9ca3af" font-family="Arial,sans-serif">INF. DERECHO</text>`;
  svg += `<text x="${W - 80}" y="${H - 8}" font-size="8" fill="#9ca3af" font-family="Arial,sans-serif">INF. IZQUIERDO</text>`;

  for (const t of teethPos) {
    const tooth = toothMap[t.num];
    svg += `<g transform="translate(${t.x},${t.y})">`;
    svg += `<rect x="1" y="1" width="${S - 2}" height="${S - 2}" rx="4" fill="#f9fafb" stroke="#d1d5db" stroke-width="1.5"/>`;
    for (const surf of ['top', 'bottom', 'left', 'right'] as const) {
      svg += `<polygon points="${surfacePoints[surf]}" fill="${getSurfaceFill(tooth, surf)}" stroke="none"/>`;
    }
    svg += `<rect x="${centerRect.x}" y="${centerRect.y}" width="${centerRect.w}" height="${centerRect.h}" fill="${getSurfaceFill(tooth, 'center')}" stroke="none"/>`;
    for (const line of dividerLines) {
      svg += `<line x1="${line.x1}" y1="${line.y1}" x2="${line.x2}" y2="${line.y2}" stroke="#c0bfba" stroke-width="0.8"/>`;
    }
    if (tooth?.condition === 'extracted') {
      svg += `<line x1="5" y1="5" x2="${S - 5}" y2="${S - 5}" stroke="#f97316" stroke-width="2.5" stroke-linecap="round"/>`;
      svg += `<line x1="${S - 5}" y1="5" x2="5" y2="${S - 5}" stroke="#f97316" stroke-width="2.5" stroke-linecap="round"/>`;
    } else if (tooth?.condition === 'crown') {
      svg += `<rect x="3" y="3" width="${S - 6}" height="${S - 6}" rx="3" fill="none" stroke="#a78bfa" stroke-width="2.5"/>`;
    }
    svg += `<text x="${S / 2}" y="${S + 10}" text-anchor="middle" font-size="7.5" fill="#9ca3af" font-family="monospace,Arial">${t.num}</text>`;
    svg += `</g>`;
  }
  svg += `</svg>`;
  return svg;
}

// ─── Constantes de layout del PDF ────────────────────────────────────────
const PAGE_W = 612; // Letter width en puntos
const PAGE_H = 792; // Letter height en puntos
const MARGIN = 36; // 0.5 in
const COL_W = PAGE_W - MARGIN * 2;

// Colores
const C_HEADER_BG = rgb(0.106, 0.31, 0.447); // #1B4F72
const C_HEADER_TEXT = rgb(1, 1, 1);
const C_SECTION_BG = rgb(0.839, 0.918, 0.973); // #D6EAF8
const C_SECTION_FG = rgb(0.106, 0.31, 0.447);
const C_TH_BG = rgb(0.18, 0.525, 0.757); // #2E86C1
const C_INFO_BAR = rgb(0.918, 0.957, 0.984); // #EBF5FB
const C_BORDER = rgb(0.682, 0.718, 0.733); // #AEB6BF
const C_ROW_EVEN = rgb(0.957, 0.965, 0.969);
const C_MUTED = rgb(0.498, 0.549, 0.553);
const C_BLACK = rgb(0.11, 0.157, 0.2); // #1C2833

// ─── Clase helper para dibujo incremental de páginas ─────────────────────
class PdfBuilder {
  private doc: PDFDocument;
  private pages: PDFPage[] = [];
  private currentPage!: PDFPage;
  private y = 0;
  private fontR!: PDFFont;
  private fontB!: PDFFont;
  private pageCount = 0;

  constructor(doc: PDFDocument, fontR: PDFFont, fontB: PDFFont) {
    this.doc = doc;
    this.fontR = fontR;
    this.fontB = fontB;
    this.addPage();
  }

  addPage() {
    this.currentPage = this.doc.addPage([PAGE_W, PAGE_H]);
    this.pages.push(this.currentPage);
    this.pageCount++;
    this.y = PAGE_H - MARGIN;
  }

  get curY() {
    return this.y;
  }
  get page() {
    return this.currentPage;
  }
  get totalPages() {
    return this.pageCount;
  }
  get allPages() {
    return this.pages;
  }

  needsSpace(height: number) {
    if (this.y - height < MARGIN + 30) {
      this.addPage();
    }
  }

  moveDown(pts: number) {
    this.y -= pts;
  }

  drawRect(x: number, y: number, w: number, h: number, color: RGB) {
    this.currentPage.drawRectangle({ x, y, width: w, height: h, color });
  }

  drawLine(x1: number, y1: number, x2: number, y2: number, color = C_BORDER, thickness = 0.5) {
    this.currentPage.drawLine({ start: { x: x1, y: y1 }, end: { x: x2, y: y2 }, thickness, color });
  }

  text(
    str: string,
    x: number,
    y: number,
    size: number,
    color: RGB = C_BLACK,
    bold = false,
    maxWidth?: number,
  ) {
    const font = bold ? this.fontB : this.fontR;
    let display = str;
    if (maxWidth) {
      while (display.length > 0 && font.widthOfTextAtSize(display, size) > maxWidth) {
        display = display.slice(0, -1);
      }
      if (display !== str) display = display.slice(0, -1) + '…';
    }
    this.currentPage.drawText(display, { x, y, size, font, color });
  }

  // Texto con saltos de línea automáticos. Retorna nueva Y.
  wrapText(
    str: string,
    x: number,
    startY: number,
    size: number,
    maxWidth: number,
    lineH: number,
    color: RGB = C_BLACK,
    bold = false,
  ): number {
    const font = bold ? this.fontB : this.fontR;
    const words = str.split(' ');
    let line = '';
    let curY = startY;
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(test, size) > maxWidth && line) {
        if (curY - lineH < MARGIN) {
          this.addPage();
          curY = this.y;
        }
        this.currentPage.drawText(line, { x, y: curY, size, font, color });
        curY -= lineH;
        line = word;
      } else {
        line = test;
      }
    }
    if (line) {
      if (curY - lineH < MARGIN) {
        this.addPage();
        curY = this.y;
      }
      this.currentPage.drawText(line, { x, y: curY, size, font, color });
      curY -= lineH;
    }
    this.y = curY;
    return curY;
  }

  // Cabecera de sección (fondo azul claro)
  sectionHeader(title: string) {
    this.needsSpace(22);
    this.drawRect(MARGIN, this.y - 14, COL_W, 18, C_SECTION_BG);
    this.text(title, MARGIN + 6, this.y - 11, 9, C_SECTION_FG, true);
    this.y -= 20;
  }

  // Fila "Clave: Valor"
  dataRow(key: string, value: string, indent = 0) {
    this.needsSpace(14);
    this.text(key, MARGIN + indent, this.y, 8, C_MUTED, true);
    this.wrapText(
      value,
      MARGIN + indent + 100,
      this.y,
      8,
      COL_W - indent - 105,
      11,
      C_BLACK,
      false,
    );
    if (this.y > PAGE_H - MARGIN) return; // wrap ya movió y
    this.y -= 2;
  }
}

// ─── Tabla genérica ───────────────────────────────────────────────────────
function drawTable(
  builder: PdfBuilder,
  headers: string[],
  rows: string[][],
  colWidths: number[],
  rowH = 16,
  fontSize = 7,
) {
  const startX = MARGIN;
  const fontR = builder['fontR'] as PDFFont;
  const fontB = builder['fontB'] as PDFFont;

  // Cabecera
  builder.needsSpace(rowH + 4);
  let x = startX;
  for (let i = 0; i < headers.length; i++) {
    builder.drawRect(x, builder.curY - rowH + 4, colWidths[i], rowH, C_TH_BG);
    builder.text(
      headers[i],
      x + 3,
      builder.curY - rowH + 8,
      fontSize,
      C_HEADER_TEXT,
      true,
      colWidths[i] - 6,
    );
    x += colWidths[i];
  }
  builder.moveDown(rowH);

  // Filas
  rows.forEach((row, rowIdx) => {
    // Calcular la altura de la fila más alta (por wrap)
    let maxLines = 1;
    row.forEach((cell, ci) => {
      const font = fontR;
      const words = cell.split(' ');
      let line = '';
      let lines = 1;
      for (const word of words) {
        const test = line ? `${line} ${word}` : word;
        if (font.widthOfTextAtSize(test, fontSize) > colWidths[ci] - 6 && line) {
          lines++;
          line = word;
        } else {
          line = test;
        }
      }
      if (lines > maxLines) maxLines = lines;
    });
    const fRowH = Math.max(rowH, maxLines * (fontSize + 3) + 4);

    builder.needsSpace(fRowH + 2);
    x = startX;
    const bgColor = rowIdx % 2 === 1 ? C_ROW_EVEN : rgb(1, 1, 1);

    for (let i = 0; i < row.length; i++) {
      builder.drawRect(x, builder.curY - fRowH + 4, colWidths[i], fRowH, bgColor);
      builder.drawLine(x, builder.curY - fRowH + 4, x + colWidths[i], builder.curY - fRowH + 4);
      builder.drawLine(x, builder.curY + 4, x + colWidths[i], builder.curY + 4);
      builder.drawLine(x, builder.curY - fRowH + 4, x, builder.curY + 4);
      // Wrap manual en celda
      const words = row[i].split(' ');
      let line = '';
      let cellY = builder.curY - fontSize - 1;
      const maxW = colWidths[i] - 6;
      for (const word of words) {
        const test = line ? `${line} ${word}` : word;
        if (fontR.widthOfTextAtSize(test, fontSize) > maxW && line) {
          builder.page.drawText(line, {
            x: x + 3,
            y: cellY,
            size: fontSize,
            font: fontR,
            color: C_BLACK,
          });
          cellY -= fontSize + 3;
          line = word;
        } else {
          line = test;
        }
      }
      if (line)
        builder.page.drawText(line, {
          x: x + 3,
          y: cellY,
          size: fontSize,
          font: fontR,
          color: C_BLACK,
        });
      x += colWidths[i];
    }
    builder.drawLine(x, builder.curY - fRowH + 4, x, builder.curY + 4); // borde derecho final
    builder.moveDown(fRowH);
  });
  builder.moveDown(4);
}

// ─── Función principal ─────────────────────────────────────────────────────
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

  // ── 1. Fetch de datos ──────────────────────────────────────────────────
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

  // Azure ya no abre el navegador local. Se conecta al servicio en la nube por WebSocket.
  const browser = await puppeteer.connect({
    browserWSEndpoint: `wss://chrome.browserless.io?token=${browserlessToken}`
  });

  const odontograma = (await Odontograma.findOne({
    where: { id_expediente: expedienteId },
    order: [['fecha_actualizacion', 'DESC']],
  })) as Odontograma | null;

  const bitacoras = (await Bitacora.findAll({
    where: { '$cita.id_paciente$': expediente.id_paciente },
    include: [{ model: Cita, as: 'cita', attributes: ['fecha_hora_inicio', 'id_paciente'] }],
    order: [['fecha_creacion', 'DESC']],
    limit: 50,
  })) as Bitacora[];

  const citasDelPaciente = (await Cita.findAll({
    where: { id_paciente: expediente.id_paciente },
    attributes: ['id_cita'],
  })) as Pick<Cita, 'id_cita'>[];
  const idCitas = citasDelPaciente.map((c) => c.id_cita);
  const consentimientos: Consentimiento[] =
    idCitas.length > 0
      ? ((await Consentimiento.findAll({
          where: { id_cita: { [Op.in]: idCitas } },
          order: [['fecha_consentimiento', 'ASC']],
        })) as Consentimiento[])
      : [];

  // ── 2. Preparar info ───────────────────────────────────────────────────
  const pacUsuario = expediente.paciente?.usuario || ({} as Usuario);
  const dentUsuario = expediente.dentista?.usuario || ({} as Usuario);
  const direccion = expediente.paciente?.direccion;

  const nombrePaciente =
    [pacUsuario.nombre, pacUsuario.apellido_paterno, pacUsuario.apellido_materno]
      .filter(Boolean)
      .join(' ') || '-';

  const nombreDentista =
    `${dentUsuario.nombre || ''} ${dentUsuario.apellido_paterno || ''}`.trim() || '-';

  const groupAntecedentes = (tipo: string) =>
    antecedentes
      .filter((a) => a.tipo_antecedente === tipo)
      .map((a) => ({
        nombre: a.padecimiento?.nombre_padecimiento || '-',
        nota: a.nota || '',
      }));

  const odontogramaData: OdontogramaDiente[] = odontograma?.datos_odontograma || [];

  // ── 3. Generar PNG del odontograma con @resvg/resvg-js ────────────────
  let odontogramaPng: Uint8Array | null = null;
  if (odontogramaData.length > 0) {
    try {
      const svgStr = renderOdontogramaSVG(odontogramaData);
      const resvg = new Resvg(svgStr, { fitTo: { mode: 'width', value: 700 } });
      odontogramaPng = resvg.render().asPng();
    } catch (err) {
      console.warn('[PDF] No se pudo renderizar odontograma SVG:', err);
    }
  }

  // ── 4. Construir PDF con pdf-lib ───────────────────────────────────────
  try {
    const doc = await PDFDocument.create();
    const fontR = await doc.embedFont(StandardFonts.Helvetica);
    const fontB = await doc.embedFont(StandardFonts.HelveticaBold);

    const builder = new PdfBuilder(doc, fontR, fontB);

    // — HEADER —
    builder.drawRect(MARGIN, PAGE_H - MARGIN - 30, COL_W, 32, C_HEADER_BG);
    builder.text(
      'EXPEDIENTE CLÍNICO',
      MARGIN + COL_W / 2 - 60,
      PAGE_H - MARGIN - 8,
      14,
      C_HEADER_TEXT,
      true,
    );
    builder.moveDown(38);

    // — BARRA INFO —
    builder.needsSpace(50);
    builder.drawRect(MARGIN, builder.curY - 44, COL_W, 48, C_INFO_BAR);
    builder.drawRect(MARGIN, builder.curY - 44, 3, 48, C_TH_BG); // borde izq azul
    const iy = builder.curY - 10;
    builder.text('Consultorio Dental', MARGIN + 8, iy, 9, C_BLACK, true);
    builder.text(`Odontólogo: ${nombreDentista}`, MARGIN + 8, iy - 12, 8, C_BLACK);
    builder.text(
      `Cédula: ${expediente.dentista?.no_cedula || '-'}`,
      MARGIN + 8,
      iy - 23,
      8,
      C_BLACK,
    );
    const col2x = MARGIN + COL_W / 2;
    builder.text(`Fecha apertura: ${fmtFecha(expediente.fecha_creacion)}`, col2x, iy, 8, C_BLACK);
    builder.text(`Impresión: ${fmtFecha(new Date())}`, col2x, iy - 12, 8, C_BLACK);
    builder.text('Estado: En tratamiento', col2x, iy - 23, 8, rgb(0.118, 0.518, 0.275), true);
    builder.moveDown(52);

    // ── SECCIÓN 1: Datos del Paciente ──────────────────────────────────
    builder.sectionHeader('1. Datos Generales del Paciente');
    builder.moveDown(4);

    const leftCols: [string, string][] = [
      ['Nombre completo:', nombrePaciente],
      ['Fecha nacimiento:', fmtFecha(pacUsuario.fecha_nacimiento)],
      ['Edad:', calcularEdad(pacUsuario.fecha_nacimiento)],
      ['Sexo:', pacUsuario.genero || '-'],
      ['CURP:', pacUsuario.curp || '-'],
      ['Ocupación:', expediente.ocupacion || '-'],
    ];
    const rightCols: [string, string][] = [
      ['Correo:', pacUsuario.correo || '-'],
      ['Teléfono:', pacUsuario.telefono || '-'],
      ['Tipo sangre:', expediente.tipo_sangre || '-'],
      ['Estatura:', expediente.estatura ? `${expediente.estatura} cm` : '-'],
      ['Peso:', expediente.peso ? `${expediente.peso} kg` : '-'],
    ];

    const savedY = builder.curY;
    for (const [k, v] of leftCols) {
      builder.needsSpace(13);
      builder.text(k, MARGIN, builder.curY, 8, C_MUTED, true);
      builder.text(v, MARGIN + 95, builder.curY, 8, C_BLACK, false, COL_W / 2 - 100);
      builder.moveDown(13);
    }
    const afterLeftY = builder.curY;

    // Columna derecha (mismo bloque, volvemos al savedY lógicamente en misma pág)
    // Sólo si cabe en la misma página; si no, igual es aceptable.
    let rightY = savedY;
    for (const [k, v] of rightCols) {
      builder.page.drawText(k, {
        x: MARGIN + COL_W / 2,
        y: rightY,
        size: 8,
        font: fontB,
        color: C_MUTED,
      });
      builder.page.drawText(v.slice(0, 35), {
        x: MARGIN + COL_W / 2 + 80,
        y: rightY,
        size: 8,
        font: fontR,
        color: C_BLACK,
      });
      rightY -= 13;
    }

    builder['y'] = Math.min(afterLeftY, rightY) - 4;
    builder.dataRow('Domicilio:', buildDomicilio(direccion));
    builder.moveDown(8);

    // ── SECCIÓN 2: Antecedentes ────────────────────────────────────────
    builder.sectionHeader('2. Interrogatorio - Antecedentes');
    builder.moveDown(4);

    const grupos: { titulo: string; tipo: string }[] = [
      { titulo: 'Heredofamiliares', tipo: 'heredofamiliar' },
      { titulo: 'Personales Patológicos', tipo: 'patologico_personal' },
      { titulo: 'Personales No Patológicos', tipo: 'no_patologico' },
      { titulo: 'Gineco-Obstétricos', tipo: 'gineco_obstetrico' },
    ];

    for (const g of grupos) {
      const lista = groupAntecedentes(g.tipo);
      if (g.tipo === 'gineco_obstetrico' && lista.length === 0) continue;
      builder.needsSpace(14);
      builder.text(g.titulo, MARGIN, builder.curY, 9, C_TH_BG, true);
      builder.moveDown(12);
      if (lista.length === 0) {
        builder.text('Sin antecedentes registrados.', MARGIN + 8, builder.curY, 8, C_MUTED);
        builder.moveDown(12);
      } else {
        for (const item of lista) {
          builder.needsSpace(12);
          builder.text('•', MARGIN + 6, builder.curY, 8, C_BLACK);
          const txt = item.nota ? `${item.nombre}  — ${item.nota}` : item.nombre;
          builder.wrapText(txt, MARGIN + 16, builder.curY, 8, COL_W - 20, 11);
          builder.moveDown(2);
        }
      }
      builder.moveDown(4);
    }

    // ── SECCIÓN 3: Exploración física ─────────────────────────────────
    builder.sectionHeader('3. Exploración Física');
    builder.moveDown(4);
    builder.dataRow('Tipo sangre:', expediente.tipo_sangre || '-');
    builder.dataRow('Peso:', expediente.peso ? `${expediente.peso} kg` : '-');
    builder.dataRow('Estatura:', expediente.estatura ? `${expediente.estatura} cm` : '-');
    builder.moveDown(4);
    builder.wrapText(
      'Nota: Los campos de signos vitales (T/A, FC, FR, Temp.), habitus exterior y exploración de cavidad oral, ATM, encías y estructuras adyacentes deberán completarse en la consulta.',
      MARGIN,
      builder.curY,
      7.5,
      COL_W,
      11,
      C_MUTED,
    );
    builder.moveDown(10);

    // ── SECCIÓN 4: Diagnóstico ─────────────────────────────────────────
    builder.sectionHeader('4. Diagnóstico - Observaciones Generales');
    builder.moveDown(4);
    builder.wrapText(
      expediente.observaciones_generales || 'Sin observaciones registradas.',
      MARGIN,
      builder.curY,
      8.5,
      COL_W,
      13,
    );
    builder.moveDown(10);

    // ── SECCIÓN 5: Odontograma ─────────────────────────────────────────
    builder.sectionHeader('5. Odontograma - Hallazgos Dentales');
    builder.moveDown(4);

    if (odontograma?.fecha_actualizacion) {
      builder.text(
        `Última actualización: ${fmtFechaHora(odontograma.fecha_actualizacion)}`,
        MARGIN,
        builder.curY,
        8,
        C_MUTED,
      );
      builder.moveDown(12);
    }

    // Leyenda de colores (texto plano)
    const leyenda = [
      { label: 'Caries', color: rgb(0.937, 0.267, 0.267) },
      { label: 'Restauración', color: rgb(0.063, 0.725, 0.506) },
      { label: 'Sellador', color: rgb(0.231, 0.51, 0.965) },
      { label: 'Fractura', color: rgb(0.984, 0.749, 0.141) },
      { label: 'Corona', color: rgb(0.655, 0.545, 0.98) },
      { label: 'Extraído', color: rgb(0.976, 0.447, 0.086) },
    ];
    let lx = MARGIN;
    const ly = builder.curY;
    for (const item of leyenda) {
      builder.page.drawRectangle({ x: lx, y: ly - 7, width: 10, height: 10, color: item.color });
      builder.page.drawText(item.label, {
        x: lx + 13,
        y: ly - 5,
        size: 7,
        font: fontR,
        color: C_BLACK,
      });
      lx += fontR.widthOfTextAtSize(item.label, 7) + 24;
    }
    builder.moveDown(18);

    // Imagen PNG del odontograma
    if (odontogramaPng) {
      builder.needsSpace(130);
      const pngImage = await doc.embedPng(odontogramaPng);
      const imgW = COL_W;
      const imgH = Math.round((190 / 700) * imgW);
      builder.page.drawImage(pngImage, {
        x: MARGIN,
        y: builder.curY - imgH,
        width: imgW,
        height: imgH,
      });
      builder.moveDown(imgH + 6);
    } else {
      builder.text('Sin hallazgos odontológicos registrados.', MARGIN, builder.curY, 8, C_MUTED);
      builder.moveDown(12);
    }

    // Tabla de dientes afectados
    if (odontogramaData.length > 0) {
      const SURF_LABELS: Record<string, string> = {
        top: 'Oclusal',
        bottom: 'Cervical',
        left: 'Mesial',
        right: 'Distal',
        center: 'Central',
      };
      const COND_LABELS: Record<string, string> = {
        caries: 'Caries',
        restoration: 'Restauración',
        sealant: 'Sellador',
        fracture: 'Fractura',
        crown: 'Corona',
        extracted: 'Extraído',
      };
      const rows = odontogramaData.map((tooth) => {
        const surfStr = Object.entries(tooth.surfaces || {})
          .filter(([, v]) => v)
          .map(([k, v]) => `${SURF_LABELS[k] || k}: ${COND_LABELS[v] || v}`)
          .join(' | ');
        return [String(tooth.num), COND_LABELS[tooth.condition ?? ''] || '-', surfStr || '-'];
      });
      drawTable(builder, ['Diente', 'Condición', 'Superficies afectadas'], rows, [
        50,
        90,
        COL_W - 140,
      ]);
    }
    builder.moveDown(6);

    // ── SECCIÓN 6: Bitácoras ───────────────────────────────────────────
    builder.sectionHeader('6. Notas de Evolución (Bitácoras)');
    builder.moveDown(4);

    if (bitacoras.length === 0) {
      builder.text('Sin notas de evolución registradas.', MARGIN, builder.curY, 8, C_MUTED);
      builder.moveDown(12);
    } else {
      const bRows = bitacoras.map((bit) => [
        fmtFechaHora(bit.fecha_creacion),
        bit.accion_realizada || '-',
        bit.descripcion || '-',
        bit.estado_bitacora || 'Pendiente',
      ]);
      drawTable(builder, ['Fecha', 'Acción realizada', 'Descripción', 'Estado'], bRows, [
        85,
        110,
        COL_W - 85 - 110 - 65,
        65,
      ]);
    }
    builder.moveDown(6);

    // ── SECCIÓN 7: Consentimientos ─────────────────────────────────────
    builder.sectionHeader('7. Carta de Consentimiento Informado');
    builder.moveDown(4);

    if (consentimientos.length === 0) {
      builder.wrapText(
        'No se encontró carta de consentimiento informado registrada para este paciente.',
        MARGIN,
        builder.curY,
        8,
        COL_W,
        12,
        C_MUTED,
      );
      builder.moveDown(12);
    } else {
      builder.wrapText(
        `Se encontr${consentimientos.length === 1 ? 'ó' : 'aron'} ${consentimientos.length} carta${consentimientos.length === 1 ? '' : 's'} de consentimiento informado. El documento${consentimientos.length === 1 ? '' : 's'} original${consentimientos.length === 1 ? '' : 'es'} se adjunta a continuación conforme a la NOM-004-SSA3-2012.`,
        MARGIN,
        builder.curY,
        8,
        COL_W,
        12,
      );
      builder.moveDown(6);
      consentimientos.forEach((c, idx) => {
        builder.needsSpace(12);
        builder.text(
          `- Consentimiento ${idx + 1}  |  Fecha: ${fmtFecha(c.fecha_consentimiento)}  |  Cita ID: ${c.id_cita}`,
          MARGIN + 10,
          builder.curY,
          8,
          C_BLACK,
        );
        builder.moveDown(12);
      });
    }

    // — Footer en todas las páginas —
    const totalPgs = builder.totalPages;
    builder.allPages.forEach((pg, idx) => {
      pg.drawLine({
        start: { x: MARGIN, y: MARGIN + 14 },
        end: { x: PAGE_W - MARGIN, y: MARGIN + 14 },
        thickness: 0.5,
        color: C_BORDER,
      });
      pg.drawText('Generado conforme a NOM-004-SSA3-2012 - Expediente Clínico', {
        x: MARGIN,
        y: MARGIN + 4,
        size: 6.5,
        font: fontR,
        color: C_MUTED,
      });
      pg.drawText(`Página ${idx + 1} de ${totalPgs}`, {
        x: PAGE_W - MARGIN - 60,
        y: MARGIN + 4,
        size: 6.5,
        font: fontR,
        color: C_MUTED,
      });
    });

    // ── 5. Serializar y fusionar consentimientos ───────────────────────
    const expedienteBuffer = Buffer.from(await doc.save());
    const pdfFinal =
      consentimientos.length > 0
        ? await fusionarConConsentimientos(expedienteBuffer, consentimientos)
        : expedienteBuffer;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', pdfFinal.length);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="expediente_${expedienteId}_${Date.now()}.pdf"`,
    );
    res.end(pdfFinal);
  } catch (error) {
    console.error('Error generando PDF:', error);
    res.status(500).json({ message: 'Error al generar el expediente PDF' });
  }
}
