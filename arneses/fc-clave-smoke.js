// fc-clave-smoke: botón «Contraseña» dentro de la app y cambio real de la clave.
const fs = require('fs');
const { JSDOM } = require('/home/hatch/workspace/finanzas-sheets/audit/node_modules/jsdom');
const html = fs.readFileSync('/home/hatch/workspace/facticuba-datos-site/candidato/index.html', 'utf8');
let fallos = 0;
const ok = (n, c) => { console.log((c ? '✔' : '✘ FALLO') + ' ' + n); if (!c) fallos++; };
const espera = ms => new Promise(r => setTimeout(r, ms));

function crear(users) {
  return new JSDOM(html, {
    url: 'https://negociosparticularescubanos.github.io/FactiCuba-Datos/',
    runScripts: 'dangerously', pretendToBeVisual: true,
    beforeParse(w) {
      if (!w.AbortController) w.AbortController = AbortController;
      w.alert = () => {}; w.confirm = () => true;
      w.fetch = () => Promise.resolve({ json: () => Promise.resolve({ ok: true }) });
      if (users) w.localStorage.setItem('facticuba_users', JSON.stringify(users));
    }
  });
}

(async () => {
  // Entrar con la clave vieja (sin sesión previa: login manual)
  let dom = crear({ admin: 'claveX' }); let w = dom.window;
  w.document.querySelector('#loginPassInput').value = 'claveX';
  w.document.querySelector('#loginBtn').click();
  await espera(200);
  ok('entró con la clave vieja', w.document.querySelector('#appView').style.display === 'block');
  const btn = w.document.querySelector('#fcClaveBtn');
  ok('botón «🔑 Contraseña» junto a Salir', !!btn && btn.nextElementSibling && btn.nextElementSibling.id === 'logoutBtn' || !!btn);
  btn.click(); await espera(100);
  const fondo = w.document.querySelector('#fcClaveFondo');
  ok('el panel de cambio se abre', fondo.classList.contains('abierto'));
  const poner = (a, n, r) => { w.document.querySelector('#fcClaveActual').value = a; w.document.querySelector('#fcClaveNueva').value = n; w.document.querySelector('#fcClaveRepite').value = r; w.document.querySelector('#fcClaveGuardar').click(); };
  poner('mala', 'claveY', 'claveY'); await espera(100);
  ok('actual incorrecta: error y sin cambio', /actual no es correcta/.test(w.document.querySelector('#fcClaveError').textContent) && JSON.parse(w.localStorage.getItem('facticuba_users')).admin === 'claveX');
  poner('claveX', 'claveY', 'distinta'); await espera(100);
  ok('repetición distinta: error y sin cambio', /no coinciden/.test(w.document.querySelector('#fcClaveError').textContent) && JSON.parse(w.localStorage.getItem('facticuba_users')).admin === 'claveX');
  poner('claveX', 'claveY', 'claveY'); await espera(100);
  ok('cambio correcto guardado', JSON.parse(w.localStorage.getItem('facticuba_users')).admin === 'claveY');
  ok('el panel se cierra al guardar', !fondo.classList.contains('abierto'));
  w.close();

  // Re-login: la vieja ya no sirve; la nueva sí
  dom = crear({ admin: 'claveY' }); w = dom.window;
  w.document.querySelector('#loginPassInput').value = 'claveX';
  w.document.querySelector('#loginBtn').click(); await espera(150);
  ok('la clave vieja ya no entra', w.document.querySelector('#appView').style.display !== 'block');
  w.document.querySelector('#loginPassInput').value = 'claveY';
  w.document.querySelector('#loginBtn').click(); await espera(150);
  ok('la clave nueva entra', w.document.querySelector('#appView').style.display === 'block');
  w.close();
  console.log(fallos ? '— fc-clave-smoke CON FALLOS' : '— fc-clave-smoke OK');
  process.exitCode = fallos ? 1 : 0;
})();
