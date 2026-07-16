export function obtenerGps(): Promise<{ lat: number; lng: number } | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation || !window.isSecureContext) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  });
}

export type GpsError = 'SIN_SOPORTE' | 'PERMISO_DENEGADO' | 'NO_DISPONIBLE' | 'TIEMPO_AGOTADO' | 'CONTEXTO_INSEGURO';

export interface GpsResultado {
  coords: { lat: number; lng: number } | null;
  error: GpsError | null;
}

// Igual que obtenerGps(), pero conserva el motivo del fallo (permiso negado,
// sin proveedor de ubicación disponible, tiempo agotado, sitio sin HTTPS)
// para poder mostrarle al usuario algo más útil que "no se pudo obtener la
// ubicación".
export function obtenerGpsConDiagnostico(): Promise<GpsResultado> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({ coords: null, error: 'SIN_SOPORTE' });
      return;
    }
    // Los navegadores solo exponen la API de geolocalización en "contextos
    // seguros" (HTTPS, o localhost). En un origen HTTP normal (ej. la IP de
    // la red local en desarrollo) getCurrentPosition falla de inmediato con
    // PERMISSION_DENIED SIN llegar a mostrar el diálogo de permiso — por eso
    // se distingue de un rechazo real del usuario, que sí se puede corregir
    // desde los ajustes del navegador.
    if (!window.isSecureContext) {
      resolve({ coords: null, error: 'CONTEXTO_INSEGURO' });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ coords: { lat: pos.coords.latitude, lng: pos.coords.longitude }, error: null }),
      (err) => {
        const error: GpsError =
          err.code === err.PERMISSION_DENIED
            ? 'PERMISO_DENEGADO'
            : err.code === err.TIMEOUT
              ? 'TIEMPO_AGOTADO'
              : 'NO_DISPONIBLE';
        resolve({ coords: null, error });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  });
}

export function mensajeGpsError(error: GpsError): string {
  switch (error) {
    case 'CONTEXTO_INSEGURO':
      return 'No se pudo pedir el permiso de ubicación porque este sitio no usa una conexión segura (HTTPS). ' +
        'El navegador bloquea el GPS automáticamente en ese caso, sin preguntar — no es algo que puedas activar tú mismo. ' +
        'Avisa a sistemas para que habiliten HTTPS en el servidor.';
    case 'PERMISO_DENEGADO':
      return 'No se concedió el permiso de ubicación. Actívalo en los ajustes de ubicación del navegador/teléfono para poder registrar el GPS de tus visitas.';
    case 'TIEMPO_AGOTADO':
      return 'Tardó demasiado en obtener la ubicación GPS. Intenta de nuevo en un lugar con mejor señal.';
    case 'SIN_SOPORTE':
      return 'Este navegador no soporta geolocalización.';
    case 'NO_DISPONIBLE':
    default:
      return 'No se pudo obtener la ubicación GPS del dispositivo.';
  }
}
