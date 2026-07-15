export function obtenerGps(): Promise<{ lat: number; lng: number } | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
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

export type GpsError = 'SIN_SOPORTE' | 'PERMISO_DENEGADO' | 'NO_DISPONIBLE' | 'TIEMPO_AGOTADO';

export interface GpsResultado {
  coords: { lat: number; lng: number } | null;
  error: GpsError | null;
}

// Igual que obtenerGps(), pero conserva el motivo del fallo (permiso negado,
// sin proveedor de ubicación disponible, tiempo agotado) para poder
// mostrarle al usuario algo más útil que "no se pudo obtener la ubicación".
export function obtenerGpsConDiagnostico(): Promise<GpsResultado> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({ coords: null, error: 'SIN_SOPORTE' });
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
