// Sirve el build de producción de Angular (dist/app-trade-marketing-frontend/browser)
// por HTTPS con el certificado real de IT — reemplaza a "serve", que no
// soporta HTTPS. Usa solo módulos nativos de Node (https, fs, path):
// no requiere instalar ningún paquete en el servidor.
//
// Ajusta CERT_PATH/KEY_PATH a donde copies el certificado real.
//
// Uso: node deploy/https-static-server.js
// (ejecutar desde la raíz del proyecto, o ajustar ROOT si se corre desde otro lado)

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const HTTPS_PORT = 443;
const HTTP_PORT = 80; 
const ROOT = path.join(__dirname, '..', 'dist', 'app-trade-marketing-frontend', 'browser');
const CERT_PATH = 'M:/web/certificado/server.crt';
const KEY_PATH = 'M:/web/certificado/server.key';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.webmanifest': 'application/manifest+json',
};

function servirArchivo(req, res) {
  const urlPath = decodeURIComponent(req.url.split('?')[0]);
  let filePath = path.normalize(path.join(ROOT, urlPath));

  // Evita salir de ROOT con rutas tipo "../../".
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // Fallback de SPA: cualquier ruta desconocida sirve index.html
      // (el router de Angular decide qué mostrar).
      filePath = path.join(ROOT, 'index.html');
    }
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  });
}

const sslOptions = {
  cert: fs.readFileSync(CERT_PATH),
  key: fs.readFileSync(KEY_PATH),
};

https.createServer(sslOptions, servirArchivo).listen(HTTPS_PORT, () => {
  console.log(`Frontend por HTTPS escuchando en el puerto ${HTTPS_PORT}, sirviendo ${ROOT}`);
});

if (HTTP_PORT) {
  http
    .createServer((req, res) => {
      const host = (req.headers.host || '').split(':')[0];
      res.writeHead(301, { Location: `https://${host}${req.url}` });
      res.end();
    })
    .listen(HTTP_PORT, () => {
      console.log(`Redirección HTTP → HTTPS escuchando en el puerto ${HTTP_PORT}`);
    });
}
