// fc-nube-smoke: verifica el módulo de nube sobre el candidato conectado.
// 1) la pastilla de conexión aparece y queda verde con ping OK
// 2) al cambiar un dato (flujo real: data + persist) se captura el POST guardar correcto
const fs = require('fs');
const { JSDOM } = require('/home/hatch/workspace/finanzas-sheets/audit/node_modules/jsdom');
const html = fs.readFileSync('/home/hatch/workspace/facticuba-datos-site/candidato/index.html', 'utf8');

const posts = [];
let pingOk = true;
const dom = new JSDOM(html, {
  url: 'https://negociosparticularescubanos.github.io/FactiCuba-Datos/',
  runScripts: 'dangerously', pretendToBeVisual: true,
  beforeParse(w) {
    if (!w.AbortController) w.AbortController = AbortController;
    w.alert = () => {}; w.confirm = () => true;
    w.fetch = (url, opts = {}) => {
      const u = String(url);
      if ((opts.method || 'GET') === 'POST') {
        posts.push(JSON.parse(opts.body));
        return Promise.resolve({ json: () => Promise.resolve({ ok: true, id: 'FD-ADMIN', fecha: '2026-11-14T00:00:00Z' }) });
      }
      if (u.includes('accion=ping')) return Promise.resolve({ json: () => Promise.resolve(pingOk ? { ok: true } : { ok: false }) });
      if (u.includes('accion=cargar')) return Promise.resolve({ json: () => Promise.resolve({ ok: true, datos: { proyecto: {}, plan: {}, onei: {} } }) });
      return Promise.resolve({ json: () => Promise.resolve({ ok: false }) });
    };
    w.localStorage.setItem('facticuba_users', JSON.stringify({ admin: '1234' }));
    w.localStorage.setItem('facticuba_session', 'admin');
    w.localStorage.setItem('facticuba_data_admin', JSON.stringify({ proyecto: { denominacion: 'Inicial' }, plan: {}, onei: {} }));
  }
});
const w = dom.window;
const ok = (n, c) => console.log((c ? '✔' : '✘ FALLO') + ' ' + n) || (c ? 0 : process.exitCode = 1);
const espera = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  await espera(600);
  const pill = w.document.querySelector('#fcNube');
  ok('pastilla #fcNube existe', !!pill);
  ok('pastilla verde tras ping OK', pill && pill.className === 'ok');
  ok('texto «conectada»', pill && /conectada/.test(pill.textContent));
  // dejar que el vigilante tome la foto inicial del hash (tick 4 s)
  await espera(4200);
  w.eval("data.proyecto.denominacion='Cambiado'; persist();");
  // tick (≤4 s) + debounce 2,5 s + POST
  await espera(8000);
  ok('se envió 1 POST guardar', posts.length === 1);
  if (posts.length) {
    ok('accion guardar', posts[0].accion === 'guardar');
    ok('usuario admin', posts[0].usuario === 'admin');
    ok('datos con el cambio', posts[0].datos && posts[0].datos.proyecto && posts[0].datos.proyecto.denominacion === 'Cambiado');
    ok('texto muestra guardado', /guardado/.test(w.document.querySelector('#fcNube').textContent));
  }
  console.log('— fin fc-nube-smoke');
  w.close();
})();
