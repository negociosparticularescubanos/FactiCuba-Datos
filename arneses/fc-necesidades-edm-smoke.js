// fc-necesidades-edm-smoke: alimentos prioridad (1º + estrella + porqué) y estrategia EDM de Ciénaga.
const fs = require('fs');
const { JSDOM } = require('/home/hatch/workspace/finanzas-sheets/audit/node_modules/jsdom');
const html = fs.readFileSync('/home/hatch/workspace/facticuba-datos-site/candidato/index.html', 'utf8');
let fallos = 0;
const ok = (n, c) => { console.log((c ? '✔' : '✘ FALLO') + ' ' + n); if (!c) fallos++; };
const espera = ms => new Promise(r => setTimeout(r, ms));

function sesion(datos) {
  return new JSDOM(html, {
    url: 'https://negociosparticularescubanos.github.io/FactiCuba-Datos/',
    runScripts: 'dangerously', pretendToBeVisual: true,
    beforeParse(w) {
      if (!w.AbortController) w.AbortController = AbortController;
      w.alert = () => {}; w.confirm = () => true;
      w.fetch = () => Promise.resolve({ json: () => Promise.resolve({ ok: true }) });
      w.localStorage.setItem('facticuba_users', JSON.stringify({ admin: '1234' }));
      w.localStorage.setItem('facticuba_session', 'admin');
      w.localStorage.setItem('facticuba_data_admin', JSON.stringify(datos));
    }
  });
}

(async () => {
  // Caso 1: Ciénaga de Zapata
  let dom = sesion({ proyecto: {}, plan: { provincia: 'Matanzas', municipio: 'Ciénaga de Zapata' }, onei: {} });
  let w = dom.window; let $ = s => w.document.querySelector(s); let $$ = s => w.document.querySelectorAll(s);
  await espera(300);
  $('#tabNecesidades').click(); await espera(200);
  ok('alimentos es la primera línea del catálogo', $$('#necTabla tbody tr')[0].querySelector('[data-c="programa"]').value === 'Producción de alimentos');
  ok('la fila de alimentos lleva la estrella', $$('#necTabla tbody tr')[0].textContent.includes('⭐'));
  ok('tarjeta del porqué visible (Ley 148)', $('#formCtn').textContent.includes('Prioridad en todos los municipios') && $('#formCtn').textContent.includes('Ley 148/2022'));
  ok('tarjeta EDM de Ciénaga con Finca Yatobá y la meta del 80%', $('#formCtn').textContent.includes('Finca Yatobá') && $('#formCtn').textContent.includes('80% de autoabastecimiento'));
  const antes = $$('#necTabla tbody tr').length;
  $('#necEdm').click(); await espera(200);
  ok('cargar la estrategia suma 13 líneas', $$('#necTabla tbody tr').length === antes + 13);
  const g = JSON.parse(w.localStorage.getItem('facticuba_data_admin'));
  const mercados = g.necesidades.filas.find(f => /Mercados agroecológicos/.test(f.linea));
  ok('mercados con su meta: cantidad 5', !!mercados && mercados.cantidad === '5');
  ok('el Puerto Pesquero Caletón entró al plan', g.necesidades.filas.some(f => /Caletón/.test(f.linea)));
  $('#necEdm').click(); await espera(200);
  ok('segunda carga no duplica líneas', $$('#necTabla tbody tr').length === antes + 13);
  w.close();

  // Caso 2: otro municipio → sin tarjeta EDM
  dom = sesion({ proyecto: {}, plan: { provincia: 'Matanzas', municipio: 'Cárdenas' }, onei: {} });
  w = dom.window; $ = s => w.document.querySelector(s);
  await espera(300);
  $('#tabNecesidades').click(); await espera(200);
  ok('en Cárdenas NO aparece la estrategia de Ciénaga', !$('#formCtn').textContent.includes('Finca Yatobá') && !w.document.querySelector('#necEdm'));
  ok('el porqué de alimentos sí aparece en todo municipio', $('#formCtn').textContent.includes('Prioridad en todos los municipios'));
  w.close();
  console.log(fallos ? '— fc-necesidades-edm-smoke CON FALLOS' : '— fc-necesidades-edm-smoke OK');
  process.exitCode = fallos ? 1 : 0;
})();
