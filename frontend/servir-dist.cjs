/**
 * Servidor estatico minimo para el build de produccion (frontend/dist).
 *
 * No usa dependencias externas: solo modulos nativos de Node. Sirve los
 * archivos de dist en http://localhost:5173 y aplica fallback a index.html
 * para que funcione el enrutado de React Router (SPA).
 *
 * El puerto 5173 NO es casual: el backend tiene CORS configurado con
 * origin = http://localhost:5173. Si se cambia este puerto, hay que ajustar
 * FRONTEND_URL en el .env del backend o las llamadas a la API se bloquean.
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const PUERTO = process.env.FRONT_PORT || 5173;
const RAIZ = path.join(__dirname, 'dist');

const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.map': 'application/json',
};

if (!fs.existsSync(RAIZ)) {
  console.error('[frontend] No existe la carpeta dist. Ejecuta "npm run build" en frontend antes de servir.');
  process.exit(1);
}

const servidor = http.createServer((req, res) => {
  try {
    const url = decodeURIComponent(req.url.split('?')[0]);
    let rutaArchivo = path.join(RAIZ, url === '/' ? 'index.html' : url);

    // Evitar path traversal fuera de la raiz.
    if (!rutaArchivo.startsWith(RAIZ)) {
      res.writeHead(403);
      return res.end('Prohibido');
    }

    fs.stat(rutaArchivo, (err, stat) => {
      if (err || !stat.isFile()) {
        // Fallback SPA: cualquier ruta desconocida devuelve index.html.
        rutaArchivo = path.join(RAIZ, 'index.html');
      }
      const ext = path.extname(rutaArchivo).toLowerCase();
      const tipo = TIPOS[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': tipo });
      fs.createReadStream(rutaArchivo).pipe(res);
    });
  } catch (e) {
    res.writeHead(500);
    res.end('Error interno');
  }
});

servidor.listen(PUERTO, () => {
  console.log(`[frontend] Sirviendo dist en http://localhost:${PUERTO}`);
});
