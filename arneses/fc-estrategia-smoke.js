// fc-estrategia-smoke: portada viva del municipio + indicadores con avance automático.
const fs = require('fs');
const { JSDOM } = require('/home/hatch/workspace/finanzas-sheets/audit/node_modules/jsdom');
const html = fs.readFileSync('/home/hatch/workspace/facticuba-datos-site/candidato/index.html', 'utf8');
let fallos = 0;
const ok = (n, c) => { console.log((c ? '✔' : '✘ FALLO') + ' ' + n); if (!c) fallos++; };
const espera = ms => new Promise(r => setTimeout(r, ms));
const dig = s => String(s).replace(/[^0-9]/g, '');

const datos = {
  proyecto: {}, plan: { provincia: 'Matanzas', municipio: 'Ciénaga de Zapata' },
  onei: { pobTot: '9 000 habitantes', hogares: '3 100 hogares' },
  necesidades: { provincia: 'Matanzas', municipio: 'Ciénaga de Zapata', tasa: '', filas: [
    { programa: 'Producción de alimentos', linea: 'Organopónicos', unidad: 'ha', cantidad: '2', costoCUP: '100000', costoUSD: '', tipo: 'CAPEX', dist: [20,20,20,15,15,10] }
  ], web: null }
};
const dom = new JSDOM(html, {
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
const w = dom.window; const $ = s => w.document.querySelector(s); const $$ = s => w.document.querySelectorAll(s);

(async () => {
  await espera(300);
  ok('la Estrategia Viva es la primera pestaña', $$('.tab')[0] && $$('.tab')[0].id === 'tabEstrategia');
  $('#tabEstrategia').click(); await espera(200);
  const txt = $('#formCtn').textContent;
  ok('portada con el municipio', txt.includes('Ciénaga de Zapata'));
  ok('tarjeta viva: población 9 000 desde ONEI', dig(txt).includes('9000'));
  ok('tarjeta viva: inversión del plan 200 000', dig(txt).includes('200000'));
  ok('indicadores sembrados (7)', $$('#estTabla tbody tr').length === 7);
  ok('el primero es el autoabastecimiento (alimentos)', $$('#estTabla tbody tr')[0].querySelector('[data-c="nombre"]').value.includes('Autoabastecimiento'));
  const inp = $$('#estTabla tbody tr')[0].querySelector('[data-c="actual"]');
  inp.value = '40'; inp.dispatchEvent(new w.Event('input', { bubbles: true })); await espera(100);
  ok('avance automático: 40 de 80 = 50 %', $$('#estTabla tbody tr')[0].querySelector('.estPct').textContent.includes('50'));
  const g = JSON.parse(w.localStorage.getItem('facticuba_data_admin'));
  ok('indicador persistido', g.estrategia.indicadores[0].actual === '40');
  $('#estAdd').click(); await espera(150);
  ok('añadir indicador suma una fila', $$('#estTabla tbody tr').length === 8);
  console.log(fallos ? '— fc-estrategia-smoke CON FALLOS' : '— fc-estrategia-smoke OK');
  w.close(); process.exitCode = fallos ? 1 : 0;
})();
