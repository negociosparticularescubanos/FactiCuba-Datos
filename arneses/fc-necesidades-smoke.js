// fc-necesidades-smoke: pestaña Necesidades — precarga, cálculo en vivo, años, persistencia.
const fs = require('fs');
const { JSDOM } = require('/home/hatch/workspace/finanzas-sheets/audit/node_modules/jsdom');
const html = fs.readFileSync('/home/hatch/workspace/facticuba-datos-site/candidato/index.html', 'utf8');
let fallos = 0;
const ok = (n, c) => { console.log((c ? '✔' : '✘ FALLO') + ' ' + n); if (!c) fallos++; };
const espera = ms => new Promise(r => setTimeout(r, ms));
const sinEsp = s => String(s).replace(/\s/g, '');
const dig = s => String(s).replace(/[^0-9]/g, '');

const dom = new JSDOM(html, {
  url: 'https://negociosparticularescubanos.github.io/FactiCuba-Datos/',
  runScripts: 'dangerously', pretendToBeVisual: true,
  beforeParse(w) {
    if (!w.AbortController) w.AbortController = AbortController;
    w.alert = () => {}; w.confirm = () => true;
    w.fetch = () => Promise.resolve({ json: () => Promise.resolve({ ok: true }) });
    w.localStorage.setItem('facticuba_users', JSON.stringify({ admin: '1234' }));
    w.localStorage.setItem('facticuba_session', 'admin');
    w.localStorage.setItem('facticuba_data_admin', JSON.stringify({
      proyecto: { denominacion: 'Proyecto X' },
      plan: { provincia: 'Matanzas', municipio: 'Ciénaga de Zapata', deficit: 'Déficit: agua potable', necesidades: 'Necesidades: viviendas' },
      onei: { pobTot: 'ONEI 2024: 52 345 habitantes', hogares: '18 500 hogares' }
    }));
  }
});
const w = dom.window;
const $ = s => w.document.querySelector(s);
const $$ = s => w.document.querySelectorAll(s);
function poner(sel, val) { const el = $(sel); el.value = val; el.dispatchEvent(new w.Event('input', { bubbles: true })); }

(async () => {
  await espera(300);
  const btn = $('#tabNecesidades');
  ok('botón de pestaña existe', !!btn);
  const res = w.document.querySelector('[data-tab="resumen"]');
  ok('va antes de Revisión', !!(btn && res && (btn.compareDocumentPosition(res) & w.Node.DOCUMENT_POSITION_FOLLOWING)));
  btn.click(); await espera(200);
  ok('tabla con las 11 líneas del catálogo', $$('#necTabla tbody tr').length === 11);
  ok('provincia precargada del Plan', $('#necProv').value === 'Matanzas');
  ok('municipio precargado del Plan', $('#necMuni').value === 'Ciénaga de Zapata');
  ok('referencia ONEI con población 52 345', dig($('#formCtn').textContent).includes('52345'));
  ok('referencia al déficit del Plan visible', $('#formCtn').textContent.includes('Déficit: agua potable'));

  const fila0 = '#necTabla tbody tr[data-fila="0"] ';
  poner(fila0 + '[data-c="cantidad"]', '10');
  poner(fila0 + '[data-c="costoCUP"]', '1000');
  poner(fila0 + '[data-c="costoUSD"]', '50');
  await espera(100);
  ok('total fila CUP = 10 000', dig($(fila0 + '.necTotCUP').textContent) === '10000');
  ok('total fila USD = 500', $(fila0 + '.necTotUSD').textContent.trim() === '500');
  ok('año 2027 = 20% → 2 000 CUP', dig($('#necAnos').textContent).includes('2027') && dig($('#necAnos').textContent).includes('2000'));
  ok('resumen: necesidad total 10 000 CUP', dig($('#necResumen').textContent).includes('10000'));

  poner('#necTasa', '300'); await espera(100);
  ok('equivalencia: 500 USD × 300 = 150 000 CUP', dig($('#necResumen').textContent).includes('150000'));
  ok('total equivalente ≈ 160 000 CUP', dig($('#necResumen').textContent).includes('160000'));

  const guardado = JSON.parse(w.localStorage.getItem('facticuba_data_admin'));
  ok('persistido en localStorage (data.necesidades)', !!guardado.necesidades && guardado.necesidades.filas[0].cantidad === '10' && guardado.necesidades.tasa === '300');
  ok('el proyecto no se tocó', guardado.proyecto.denominacion === 'Proyecto X');

  // El «Vaciar» de la app no debe borrar plantillas estando en Necesidades
  w.document.querySelector('#clearBtn').click(); await espera(100);
  const tras = JSON.parse(w.localStorage.getItem('facticuba_data_admin'));
  ok('Vaciar bloqueado en esta pestaña', tras.proyecto.denominacion === 'Proyecto X' && /Necesidades/.test(w.document.querySelector('#toast').textContent));

  console.log(fallos ? '— fc-necesidades-smoke CON FALLOS' : '— fc-necesidades-smoke OK');
  w.close();
  process.exitCode = fallos ? 1 : 0;
})();
