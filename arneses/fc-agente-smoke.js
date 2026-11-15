// fc-agente-smoke: (1) el agente del servidor (Agente.gs) con búsquedas simuladas; (2) la tarjeta del agente en la página.
const fs = require('fs'), vm = require('vm');
const { JSDOM } = require('/home/hatch/workspace/finanzas-sheets/audit/node_modules/jsdom');
const html = fs.readFileSync('/home/hatch/workspace/facticuba-datos-site/candidato/index.html', 'utf8');
const gs = fs.readFileSync(__dirname + '/../servidor/Agente.gs', 'utf8');
let fallos = 0;
const ok = (n, c) => { console.log((c ? '✔' : '✘ FALLO') + ' ' + n); if (!c) fallos++; };
const espera = ms => new Promise(r => setTimeout(r, ms));

// ---------- 1) Servidor ----------
const ddg = '<a class="result__a" href="//duckduckgo.com/l/?uddg=https%3A%2F%2Fcubadebate.cu%2Fa1&rut=x">Ciénaga de Zapata: alimentos</a><a class="result__snippet" href="x">En Ciénaga de Zapata la producción de alimentos es insuficiente y hay déficit de viandas.</a>' +
  '<a class="result__a" href="//duckduckgo.com/l/?uddg=https%3A%2F%2Fradio.cu%2Fb1&rut=x">Más alimentos</a><a class="result__snippet" href="x">La agricultura de Ciénaga de Zapata tiene problemas por falta de insumos.</a>' +
  '<a class="result__a" href="//duckduckgo.com/l/?uddg=https%3A%2F%2Fotro.cu%2Fc1&rut=x">Cárdenas</a><a class="result__snippet" href="x">En Cárdenas el transporte presenta deterioro y falta de ómnibus.</a>';
const PAG = {
  'https://cubadebate.cu/a1': '<p>En Ciénaga de Zapata la producción de alimentos es insuficiente y hay déficit de viandas.</p><p>En Ciénaga de Zapata faltan ómnibus y el transporte tiene un fuerte deterioro.</p><p>Noticias del deporte nacional hoy.</p>',
  'https://radio.cu/b1': '<p>Se informa que en Ciénaga de Zapata la producción de alimentos es insuficiente y hay déficit de viandas.</p>',
  'https://otro.cu/c1': '<p>En Cárdenas el transporte presenta deterioro y falta de ómnibus.</p>'
};
const resp = (txt, code = 200) => ({ getResponseCode: () => code, getContentText: () => txt });
const ctx = { console, DB_ID: 'x', SpreadsheetApp: {}, Utilities: { sleep() {} }, Logger: { log() {} },
  UrlFetchApp: {
    fetchAll: reqs => reqs.map(r => r.url.includes('duckduckgo.com/html') ? resp(ddg) : resp(PAG[r.url] || '', PAG[r.url] ? 200 : 404)),
    fetch: () => resp('', 404)
  } };
vm.createContext(ctx); vm.runInContext(gs, ctx);
const res = ctx.agEstudiar_('Matanzas', 'Ciénaga de Zapata', ['Cárdenas', 'Colón']);
const L = res.hallazgos, t = h => h.hallazgo.toLowerCase();
ok('el agente devuelve hallazgos', L.length >= 2);
const ali = L.filter(h => h.sector === 'Producción de alimentos');
ok('alimentos: hay hallazgos y ninguno habla de transporte', ali.length >= 1 && ali.every(h => !/transporte|[oó]mnibus/.test(t(h))));
ok('alimentos: respaldado por 2 fuentes distintas', ali.some(h => h.corrobora >= 2));
ok('el transporte de Ciénaga quedó en su tema', L.some(h => h.sector === 'Vialidad y transporte' && /[oó]mnibus/.test(t(h))));
ok('nada de Cárdenas', L.every(h => !/c[aá]rdenas/.test(t(h))));
ok('no cuela frases sin carencia ni de otros temas', L.every(h => !/deporte/.test(t(h))));
ok('cada hallazgo trae fuente y enlace', L.every(h => h.fuente && /^https:/.test(h.url)));

// ---------- 2) Página ----------
const RES = [
  { fecha: '2026-11-15', sector: 'Producción de alimentos', hallazgo: 'En Ciénaga de Zapata la producción de alimentos es insuficiente y hay déficit de viandas.', fuente: 'cubadebate.cu', url: 'https://cubadebate.cu/a1', corrobora: 2 },
  { fecha: '2026-11-15', sector: 'Vialidad y transporte', hallazgo: 'En Ciénaga de Zapata faltan ómnibus y el transporte tiene un fuerte deterioro.', fuente: 'cubadebate.cu', url: 'https://cubadebate.cu/a1', corrobora: 1 }
];
const llamadas = [];
const dom = new JSDOM(html, { url: 'https://negociosparticularescubanos.github.io/FactiCuba-Datos/', runScripts: 'dangerously', pretendToBeVisual: true,
  beforeParse(w) {
    w.alert = () => {}; w.confirm = () => true;
    w.fetch = (url, op) => {
      const u = String(url); let b = {}; try { b = JSON.parse((op && op.body) || '{}'); } catch (e) {}
      llamadas.push(u.includes('accion=') ? u.split('accion=')[1].split('&')[0] : (b.accion || 'otra'));
      if (u.includes('accion=agente_estado')) return Promise.resolve({ json: () => Promise.resolve({ ok: true, estado: 'hecho', hallazgos: 2 }) });
      if (u.includes('accion=agente_resultados')) return Promise.resolve({ json: () => Promise.resolve({ ok: true, resultados: RES }) });
      if (b.accion === 'agente_encolar') { w.__otros = b.otros; return Promise.resolve({ json: () => Promise.resolve({ ok: true, estado: 'pendiente' }) }); }
      return Promise.resolve({ json: () => Promise.resolve({ ok: true, items: [] }) });
    };
    w.localStorage.setItem('facticuba_users', JSON.stringify({ admin: '1234' }));
    w.localStorage.setItem('facticuba_session', 'admin');
    w.localStorage.setItem('facticuba_data_admin', JSON.stringify({ proyecto: {}, plan: { provincia: 'Matanzas', municipio: 'Ciénaga de Zapata' }, onei: {} }));
  } });
const w = dom.window, $ = s => w.document.querySelector(s);
(async () => {
  await espera(300); $('#tabNecesidades').click(); await espera(250);
  ok('la tarjeta del agente aparece en Necesidades', !!$('#fcAgente'));
  $('#agPedir').click(); await espera(300);
  ok('«Pedir estudio» encola el municipio con los demás municipios para filtrar', llamadas.includes('agente_encolar') && Array.isArray(w.__otros));
  ok('el estado se consulta y se muestran los hallazgos', llamadas.includes('agente_estado') && $('#agRes').textContent.includes('Respaldada por 2 fuentes'));
  ok('lo de una sola fuente se avisa para verificar', $('#agRes').textContent.includes('Una sola fuente'));
  $('.agAdd').click(); await espera(150);
  const g0 = JSON.parse(w.localStorage.getItem('facticuba_data_admin')).necesidades;
  ok('«Añadir al plan» suma la línea y queda guardada', g0.filas.some(f => /producción de alimentos es insuficiente/.test(f.linea) && f.programa === 'Producción de alimentos'));
  $('#agIncorporar').click(); await espera(150);
  const g = JSON.parse(w.localStorage.getItem('facticuba_data_admin')).necesidades;
  ok('«Incorporar» lleva los hallazgos al estudio e informe', g.web && g.web.lista.some(x => x.origen === 'agente'));
  $('#agCarta').click(); await espera(150);
  const txt = $('#agTexto').value;
  ok('la solicitud nombra al municipio, la norma y trae preguntas concretas', /Ciénaga de Zapata/.test(txt) && /Decreto 174\/2026/.test(txt) && /1\. /.test(txt));
  ok('no inventa correos ni teléfonos', !/@|\+53|\d{7,}/.test(txt));
  console.log(fallos ? '— fc-agente-smoke CON FALLOS' : '— fc-agente-smoke OK');
  w.close(); process.exitCode = fallos ? 1 : 0;
})();
