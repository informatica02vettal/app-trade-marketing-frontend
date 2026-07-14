// Se arma con el mismo host desde el que se cargó la página (en vez de
// "localhost" fijo) para que funcione igual accediendo desde este PC o
// desde cualquier otro dispositivo de la red local a la IP del backend.
export const environment = {
  production: false,
  apiBaseUrl: `http://${window.location.hostname}:8081/api/v1`,
};
