// fc-conocimiento-datos-smoke: FactiCuba-Datos busca PRIMERO en la Base de Conocimiento;
// si hay >=5 no va a la web; si hay pocas, completa con la web y GUARDA lo nuevo en la base;
// al generar el estudio oficial, el estudio queda guardado en la base.
const fs = require('fs');
const { JSDOM } = require('/home/hatch/workspace/finanzas-sheets/audit/node_modules/jsdom');
const html = fs.readFileSync('/home/hatch/workspace/facticuba-datos-site/candidato/index.html', 'utf8');
let fallos = 0;
const ok = (n, c) => { console.log((c ? '✔' : '✘ FALLO') + ' ' + n); if (!c) fallos++; };
const espera = ms => new Promise(r => setTimeout(r, ms));

const ITEMS = [
  { titulo: 'Agua', fuente: 'Web (DuckDuckGo)', url: 'https://ejemplo.cu/agua', extracto: 'El acueducto presenta un déficit serio y la población reclama problemas con el abasto de agua potable en varias comunidades del municipio.' },
  { titulo: 'Viviendas', fuente: 'Web (DuckDuckGo)', url: 'https://ejemplo.cu/viv', extracto: 'El fondo habitacional muestra deterioro: cientos de viviendas necesitan rehabilitación tras años sin mantenimiento y hay déficit de nuevas construcciones.' },
  { titulo: 'Apagones', fuente: 'Wikipedia', url: 'https://ejemplo.cu/elec', extracto: 'Los apagones afectan el servicio eléctrico y el alumbrado público es insuficiente en los asentamientos rurales del territorio.' },
  { titulo: 'Viales', fuente: 'Web (DuckDuckGo)', url: 'https://ejemplo.cu/vial', extracto: 'Las carreteras y viales de acceso tienen un marcado deterioro y el transporte público es insuficiente para la demanda de la población.' },
  { titulo: 'Salud', fuente: 'Web (DuckDuckGo)', url: 'https://ejemplo.cu/salud', extracto: 'El policlínico municipal necesita reparación y hay carencia de medicamentos y equipamiento en los consultorios de salud.' }
];
const REF = (tema, dato) => ({ id: 'x', fecha: '2026-11-10', app: 'FactiCuba', provincia: 'Matanzas', municipio: 'Ciénaga de Zapata', tema, dato, fuente: 'Web (DuckDuckGo)', url: 'https://ejemplo.cu/ref' });
const REFS6 = [
  REF('Producción de alimentos', 'La producción de alimentos del municipio es insuficiente y falta abasto estable a la población.'),
  REF('Agua y saneamiento', 'El abasto de agua potable presenta déficit y problemas de redes en varias comunidades.'),
  REF('Vivienda', 'Cientos de viviendas con deterioro necesitan rehabilitación urgente en el territorio.'),
  REF('Energía', 'Los apagones afectan el servicio eléctrico y falta alumbrado público en los asentamientos.'),
  REF('Salud', 'El policlínico municipal necesita reparación y equipamiento para atender a la población.'),
  REF('Vialidad y transporte', 'Los viales de acceso presentan deterioro marcado y el transporte es insuficiente.')
];

function crearDOM(refs) {
  return new JSDOM(html, {
    url: 'https://negociosparticularescubanos.github.io/FactiCuba-Datos/',
    runScripts: 'dangerously', pretendToBeVisual: true,
    beforeParse(w) {
      if (!w.AbortController) w.AbortController = AbortController;
      w.alert = () => {}; w.confirm = () => true;
      w.__buscarCalls = 0; w.__kbPosts = [];
      w.fetch = (url, opts) => {
        const u = String(url);
        if (u.includes('AKfycbzDmBLwgQj0Mx')) {
          if (opts && opts.method === 'POST') { w.__kbPosts.push(JSON.parse(opts.body)); return Promise.resolve({ text: () => Promise.resolve('{"ok":true}') }); }
          return Promise.resolve({ json: () => Promise.resolve({ ok: true, refs }) });
        }
        if (u.includes('ruta=buscar')) { w.__buscarCalls++; return Promise.resolve({ json: () => Promise.resolve({ ok: true, items: ITEMS }) }); }
        return Promise.resolve({ json: () => Promise.resolve({ ok: true }), text: () => Promise.resolve('{"ok":true}') });
      };
      w.localStorage.setItem('facticuba_users', JSON.stringify({ admin: '1234' }));
      w.localStorage.setItem('facticuba_session', 'admin');
      w.localStorage.setItem('facticuba_data_admin', JSON.stringify({
        proyecto: {}, plan: { provincia: 'Matanzas', municipio: 'Ciénaga de Zapata' }, onei: {}
      }));
    }
  });
}

(async () => {
  // Escenario A: la base ya tiene 6 → no se va a la web
  let dom = crearDOM(REFS6); let w = dom.window; let $ = s => w.document.querySelector(s); let $$ = s => w.document.querySelectorAll(s);
  await espera(300);
  $('#tabNecesidades').click(); await espera(200);
  $('#necBuscar').click(); await espera(700);
  ok('A: se muestran las de la base (>=5)', $$('#necWeb .necWebAdd').length >= 5);
  ok('A: distintivo «Base de conocimiento» visible', $('#necWeb').textContent.includes('Base de Conocimiento') || $('#necWeb').textContent.includes('Base de conocimiento'));
  ok('A: NO se buscó en la web', w.__buscarCalls === 0);
  ok('A: no se guardaron refs nuevas', !w.__kbPosts.some(p => p.accion === 'guardar_refs'));
  ok('A: alimentos primero', ($('#necWeb').textContent.indexOf('Producción de alimentos') < $('#necWeb').textContent.indexOf('Vivienda')));
  w.close();

  // Escenario B: la base tiene 2 → completa con la web y guarda lo nuevo; el estudio se guarda
  dom = crearDOM(REFS6.slice(0, 2)); w = dom.window; $ = s => w.document.querySelector(s); $$ = s => w.document.querySelectorAll(s);
  await espera(300);
  $('#tabNecesidades').click(); await espera(200);
  $('#necBuscar').click(); await espera(900);
  ok('B: lista combinada >=5', $$('#necWeb .necWebAdd').length >= 5);
  ok('B: sí se buscó en la web para completar', w.__buscarCalls > 0);
  const gr = w.__kbPosts.find(p => p.accion === 'guardar_refs');
  ok('B: lo hallado en la web se guardó en la base', !!gr && gr.refs.length >= 3 && gr.refs.every(r => r.app === 'FactiCuba-Datos' && r.municipio === 'Ciénaga de Zapata'));
  $('#necEstudio').click(); await espera(400);
  const ge = w.__kbPosts.find(p => p.accion === 'guardar_estudio');
  ok('B: el estudio generado quedó guardado en la base', !!ge && ge.estudio.app === 'FactiCuba-Datos' && /Estudio de factibilidad/.test(ge.estudio.resumen));
  w.close();

  console.log(fallos ? '— fc-conocimiento-datos-smoke CON FALLOS' : '— fc-conocimiento-datos-smoke OK');
  process.exitCode = fallos ? 1 : 0;
})();
