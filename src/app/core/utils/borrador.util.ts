/**
 * Persiste borradores de formularios en progreso (sobre todo fotos ya
 * subidas) en localStorage, para que sobrevivan aunque el mercaderista
 * cierre la aplicación a mitad de una auditoría y evitar que tenga que
 * volver a tomar/subir las mismas fotos. Se usa localStorage (no
 * sessionStorage) justamente porque debe sobrevivir al cierre completo de
 * la pestaña/app, no solo a la navegación dentro de la misma sesión.
 */
export function cargarBorrador<T>(clave: string, porDefecto: T): T {
  try {
    const raw = localStorage.getItem(clave);
    return raw ? { ...porDefecto, ...JSON.parse(raw) } : porDefecto;
  } catch {
    return porDefecto;
  }
}

export function guardarBorrador<T>(clave: string, valor: T): void {
  try {
    localStorage.setItem(clave, JSON.stringify(valor));
  } catch {
    // Almacenamiento no disponible (modo privado, cuota llena, etc.): se ignora,
    // el formulario sigue funcionando, solo no persiste entre sesiones.
  }
}

export function borrarBorrador(clave: string): void {
  localStorage.removeItem(clave);
}
