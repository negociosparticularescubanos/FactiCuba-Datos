// fc-necesidades-web-smoke: búsqueda web de necesidades (espejo simulado) — mínimo 5 con fuente y pase al plan.
const fs = require('fs');
const { JSDOM } = require('/home/hatch/workspace/finanzas-sheets/audit/node_modules/jsdom');
const html = fs.readFileSync('/home/hatch/workspace/facticuba-datos-site/candidato/index.html', 'utf8');
let fallos = 0;
const ok = (n, c) => { console.log((c ? '✔' : '✘ FALLO') + ' ' + n); if (!c) fallos++; };
const espera = ms => new Promise(r => setTimeout(r, ms));

const ITEMS = [
  { titulo: 'Agua en Ciénaga', fuente: 'Web (DuckDuckGo)', url: 'https://ejemplo.cu/agua', extracto: 'El acueducto presenta un déficit serio y la población reclama problemas con el abasto de agua potable en varias comunidades del municipio.' },
  { titulo: 'Viviendas', fuente: 'Web (DuckDuckGo)', url: 'https://ejemplo.cu/viv', extracto: 'El fondo habitacional muestra deterioro: cientos de viviendas necesitan rehabilitación tras años sin mantenimiento y hay déficit de nuevas construcciones.' },
  { titulo: 'Apagones', fuente: 'Wikipedia', url: 'https://ejemplo.cu/elec', extracto: 'Los apagones afectan el servicio eléctrico y el alumbrado público es insuficiente en los asentamientos rurales del territorio.' },
  { titulo: 'Viales', fuente: 'Web (DuckDuckGo)', url: 'https://ejemplo.cu/vial', extracto: 'Las carreteras y viales de acceso tienen un marcado deterioro y el transporte público es insuficiente para la demanda de la población.' },
  { titulo: 'Salud', fuente: 'Web (DuckDuckGo)', url: 'https://ejemplo.cu/salud', extracto: 'El policlínico municipal necesita reparación y hay carencia de medicamentos y equipamiento en los consultorios de salud.' },
  { titulo: 'Alimentos', fuente: 'Web (DuckDuckGo)', url: 'https://ejemplo.cu/agr', extracto: 'La producción de alimentos es insuficiente: la agricultura local no cubre la demanda y el abasto a la población presenta problemas.' }
];
const dom = new JSDOM(html, {
  url: 'https://negociosparticularescubanos.github.io/FactiCuba-Datos/',
  runScripts: 'dangerously', pretendToBeVisual: true,
  beforeParse(w) {
    if (!w.AbortController) w.AbortController = AbortController;
    w.alert = () => {}; w.confirm = () => true;
    w.fetch = (url) => {
      const u = String(url);
      if (u.includes('ruta=buscar')) return Promise.resolve({ json: () => Promise.resolve({ ok: true, items: ITEMS }) });
      return Promise.resolve({ json: () => Promise.resolve({ ok: true }) });
    };
    w.localStorage.setItem('facticuba_users', JSON.stringify({ admin: '1234' }));
    w.localStorage.setItem('facticuba_session', 'admin');
    w.localStorage.setItem('facticuba_data_admin', JSON.stringify({
      proyecto: {}, plan: { provincia: 'Matanzas', municipio: 'Ciénaga de Zapata' }, onei: {}
    }));
  }
});
const w = dom.window; const $ = s => w.document.querySelector(s); const $$ = s => w.document.querySelectorAll(s);

(async () => {
  await espera(300);
  $('#tabNecesidades').click(); await espera(200);
  ok('botón de búsqueda presente', !!$('#necBuscar'));
  const filasAntes = $$('#necTabla tbody tr').length;
  $('#necBuscar').click(); await espera(600);
  const halladas = $$('#necWeb .necWebAdd').length;
  ok('se muestran mínimo 5 necesidades', halladas >= 5);
  ok('cada una con su fuente enlazada', $$('#necWeb a').length >= 5);
  ok('aviso VERIFICAR presente', $('#necWeb').textContent.includes('VERIFICAR'));
  const guardado = JSON.parse(w.localStorage.getItem('facticuba_data_admin'));
  ok('búsqueda persistida', !!(guardado.necesidades.web && guardado.necesidades.web.lista.length >= 5));
  $$('#necWeb .necWebAdd')[0].click(); await espera(200);
  ok('«Añadir al plan» suma una línea', $$('#necTabla tbody tr').length === filasAntes + 1);
  const tras = JSON.parse(w.localStorage.getItem('facticuba_data_admin'));
  ok('la línea añadida quedó guardada con su sector', tras.necesidades.filas.length === filasAntes + 1 && tras.necesidades.filas[filasAntes].programa.length > 0);
  console.log(fallos ? '— fc-necesidades-web-smoke CON FALLOS' : '— fc-necesidades-web-smoke OK');
  w.close(); process.exitCode = fallos ? 1 : 0;
})();
