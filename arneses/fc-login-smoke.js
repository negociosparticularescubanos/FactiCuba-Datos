// fc-login-smoke: login cerrado — solo admin, sin creación de cuentas.
const fs = require('fs');
const { JSDOM } = require('/home/hatch/workspace/finanzas-sheets/audit/node_modules/jsdom');
const html = fs.readFileSync('/home/hatch/workspace/facticuba-datos-site/candidato/index.html', 'utf8');
let fallos = 0;
const ok = (n, c) => { console.log((c ? '✔' : '✘ FALLO') + ' ' + n); if (!c) fallos++; };
const espera = ms => new Promise(r => setTimeout(r, ms));

function crear(semilla) {
  return new JSDOM(html, {
    url: 'https://negociosparticularescubanos.github.io/FactiCuba-Datos/',
    runScripts: 'dangerously', pretendToBeVisual: true,
    beforeParse(w) {
      if (!w.AbortController) w.AbortController = AbortController;
      w.alert = () => {}; w.confirm = () => true;
      w.fetch = () => Promise.resolve({ json: () => Promise.resolve({ ok: true }) });
      if (semilla) w.localStorage.setItem('facticuba_users', JSON.stringify(semilla));
    }
  });
}
async function intentar(w, pass) {
  w.document.querySelector('#loginPassInput').value = pass;
  w.document.querySelector('#loginBtn').click();
  await espera(150);
  return {
    dentro: w.document.querySelector('#appView').style.display === 'block',
    toast: w.document.querySelector('#toast').textContent
  };
}

(async () => {
  // A) Equipo nuevo: no hay forma de crear cuentas; la 1ª contraseña queda fijada
  let dom = crear(null); let w = dom.window;
  ok('no existe el botón de crear cuenta', !w.document.querySelector('#setupAdminBtn') && !w.document.querySelector('#setupRow'));
  ok('usuario fijo admin y no editable', w.document.querySelector('#loginUserInput').value === 'admin' && w.document.querySelector('#loginUserInput').readOnly);
  ok('la pastilla de la base sigue presente', !!w.document.querySelector('#fcNube'));
  let r = await intentar(w, 'claveX');
  ok('1ª entrada: entra y fija la contraseña', r.dentro && JSON.parse(w.localStorage.getItem('facticuba_users')).admin === 'claveX');
  w.close();

  // B) Equipo con contraseña fijada: la mala no entra ni sobrescribe; la buena entra
  dom = crear({ admin: 'claveX' }); w = dom.window;
  r = await intentar(w, 'otraCosa');
  ok('contraseña mala rechazada', !r.dentro && /incorrecta/.test(r.toast));
  ok('la contraseña guardada no cambió', JSON.parse(w.localStorage.getItem('facticuba_users')).admin === 'claveX');
  r = await intentar(w, 'claveX');
  ok('contraseña buena entra', r.dentro);
  w.close();

  console.log(fallos ? '— fc-login-smoke CON FALLOS' : '— fc-login-smoke OK');
  process.exitCode = fallos ? 1 : 0;
})();
