import { httpClient } from '@/shared/api/http'

export interface ConsentimientoBackend {
  id: string; // o _id dependiendo si usas un UUID o id autoincremental
  paciente: {
    nombre: string;
    expediente: string;
  };
  fecha: string;
  procedimiento: string;
  archivoUrl: string;
}

export interface ConsentimientoVista {
  id: string;
  pacienteNombre: string;
  pacienteExpediente: string;
  fecha: string;
  citaProcedimiento: string;
  archivoUrl: string;
  idCita: number;
}

export interface CitaOpcion {
  id_cita: number;
  pacienteNombre: string;
  procedimiento: string;
  fecha: string;
}

export const consentimientoApi = {
  async getAll(): Promise<ConsentimientoVista[]> {
    const response = await httpClient.get('/consentimiento'); 
    const data = response.data ? response.data : response;

    if (!Array.isArray(data)) return []; 
  
    return data.map((item: any): ConsentimientoVista => ({
      id: item.id_consentimiento || item.id,
      idCita: item.id_cita || item.cita?.id_cita,
      // Unificamos nombre y apellido para que el .includes(q) lo encuentre fácil
      pacienteNombre: item.cita?.paciente?.usuario?.nombre 
          ? `${item.cita.paciente.usuario.nombre} ${item.cita.paciente.usuario.apellido_paterno || ''}`.trim()
          : 'Desconocido',
      pacienteExpediente: item.cita?.paciente?.expediente?.id_expediente || 'S/E',
      fecha: item.fecha_consentimiento || new Date().toISOString(),
      // Usamos nombre_corto para que coincida con el procedimiento de la tarjeta
      citaProcedimiento: item.cita?.tipo?.nombre_corto || 'Procedimiento General',
      archivoUrl: item.nombre_archivo || '#'
    }));
  },

  // <-- NUEVA FUNCIÓN PARA PEDIR LA URL DE AZURE -->
  async getUrlDocumento(id_cita: number | string): Promise<string> {
    // Llama a tu endpoint: router.get('/cita/:id_cita', verConsentimiento)
    const response = await httpClient.get(`/consentimiento/cita/${id_cita}`);
    const data = response.data ? response.data : response;
    
    // Tu controlador devuelve { message: '...', url: '...' }
    return data.url; 
  },

  /**
   * Obtiene un consentimiento por su ID
   */
  async getById(id: string): Promise<ConsentimientoVista> {
    // Corrección: Usar httpClient en lugar de http
    const response = await httpClient.get(`/consentimientos/${id}`);
    
    const item = response.data;
    
    // Es buena práctica mapearlo aquí también para que respete la interfaz ConsentimientoVista
    return {
      id: item.id || item._id,
      pacienteNombre: item.paciente?.nombre || item.pacienteNombre || 'Desconocido',
      pacienteExpediente: item.paciente?.expediente || item.pacienteExpediente || 'S/E',
      fecha: item.fecha || new Date().toISOString(),
      citaProcedimiento: item.procedimiento || item.citaProcedimiento || 'Procedimiento General',
      archivoUrl: item.archivoUrl || '#'
    };
  },

  // Aquí podrías agregar en un futuro: create(), update(), delete(), etc.

  /**
   * Sube un nuevo consentimiento firmado (PDF)
   */
  async upload(archivo: File, id_cita: number | string) {
    const formData = new FormData();
    formData.append('archivo', archivo); 
    formData.append('id_cita', id_cita.toString()); 

    const response = await httpClient.post('/consentimiento', formData, {
      headers: {
        // Esto obliga a Axios a ignorar el application/json global
        'Content-Type': 'multipart/form-data' 
      }
    }); 
    
    return response.data;
  },

  async delete(id_cita: number | string) {
    // Llama a tu endpoint: router.delete('/cita/:id_cita', eliminarConsentimiento)
    const response = await httpClient.delete(`/consentimiento/cita/${id_cita}`);
    return response.data;
  },

  async getCitasDisponibles(): Promise<CitaOpcion[]> {
    // 1. Hacemos la petición (asegúrate que la ruta sea '/citas' según tu router[cite: 10])
    const response = await httpClient.get('/citas'); 
    
    // 2. Extraemos el objeto de respuesta. 
    // Si usas un interceptor que ya extrae el .data, usa 'response'. Si no, 'response.data'.
    const data = response.data ? response.data : response;

    // 3. ¡AQUÍ ESTÁ EL TRUCO! Accedemos a data.citas
    const listaCitas = Array.isArray(data.citas) ? data.citas : [];

    return listaCitas.map((cita: any): CitaOpcion => ({
      id_cita: cita.id_cita,
      pacienteNombre: cita.paciente?.usuario?.nombre 
        ? `${cita.paciente.usuario.nombre} ${cita.paciente.usuario.apellido_paterno || ''}`.trim()
        : 'Paciente',
      procedimiento: cita.tipo?.nombre_corto || 'Procedimiento General',
      fecha: new Date(cita.fecha_hora_inicio).toLocaleDateString('es-MX')
    }));
  }

  /* async getCitasDisponibles(): Promise<CitaOpcion[]> {     Para el futuro cuando definamos en que estado debe estar la cita
    const response = await httpClient.get('/citas'); 
    const data = response.data ? response.data : response;

    if (!Array.isArray(data)) return [];

    // Agregamos este .filter antes del .map
    return data
      .filter((cita: any) => cita.estado === 'Completada') // <-- FILTRO AQUÍ
      .map((cita: any): CitaOpcion => ({
        id_cita: cita.id_cita,
        pacienteNombre: cita.paciente?.usuario?.nombre 
          ? `${cita.paciente.usuario.nombre} ${cita.paciente.usuario.apellidos || ''}`.trim()
          : 'Paciente',
        procedimiento: cita.tipo?.nombre || 'Procedimiento General',
        fecha: new Date(cita.fecha_hora_inicio).toLocaleDateString('es-MX')
      }));
  } */
};