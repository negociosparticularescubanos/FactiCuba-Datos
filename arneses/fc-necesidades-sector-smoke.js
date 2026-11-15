// fc-necesidades-sector-smoke: cada necesidad web debe hablar del tema correcto y del municipio elegido (nada de otro tema ni de otro municipio).
const fs = require('fs');
const { JSDOM } = require('/home/hatch/workspace/finanzas-sheets/audit/node_modules/jsdom');
const html = fs.readFileSync('/home/hatch/workspace/facticuba-datos-site/candidato/index.html', 'utf8');
let fallos = 0;
const ok = (n, c) => { console.log((c ? '✔' : '✘ FALLO') + ' ' + n); if (!c) fallos++; };
const espera = ms => new Promise(r => setTimeout(r, ms));

const ITEMS = [
  { titulo: 'Alimentos', fuente: 'Web A', url: 'https://ejemplo.cu/a1', extracto: 'En Ciénaga de Zapata la producción de alimentos es insuficiente y hay déficit de viandas y hortalizas para la población.' },
  { titulo: 'Transporte en Cárdenas', fuente: 'Web B', url: 'https://ejemplo.cu/b1', extracto: 'En Cárdenas el transporte público presenta un deterioro y falta de ómnibus para los vecinos.' },
  { titulo: 'Ciénaga de Zapata hoy', fuente: 'Web C', url: 'https://ejemplo.cu/c1', extracto: 'En Ciénaga de Zapata faltan ómnibus y el transporte tiene un fuerte deterioro. La agricultura local tiene problemas por la falta de insumos y semillas.' },
  { titulo: 'Problemas de transporte en Cuba', fuente: 'Web D', url: 'https://ejemplo.cu/d1', extracto: 'El transporte tiene déficit y deterioro en todo el país según varios informes.' },
  { titulo: 'Ciénaga', fuente: 'Web E', url: 'https://ejemplo.cu/e1', extracto: 'En Ciénaga de Zapata falta agua y falta transporte para los vecinos.' },
  { titulo: 'Agua', fuente: 'Web F', url: 'https://ejemplo.cu/f1', extracto: 'En Ciénaga de Zapata el acueducto presenta un déficit y hay salideros en las redes de varias comunidades.' },
  { titulo: 'Vivienda', fuente: 'Web G', url: 'https://ejemplo.cu/g1', extracto: 'En Ciénaga de Zapata el fondo habitacional tiene deterioro y hay déficit de viviendas nuevas.' },
  { titulo: 'Energía', fuente: 'Web H', url: 'https://ejemplo.cu/h1', extracto: 'En Ciénaga de Zapata los apagones afectan a la población y el alumbrado público es insuficiente.' },
  { titulo: 'Salud', fuente: 'Web I', url: 'https://ejemplo.cu/i1', extracto: 'En Ciénaga de Zapata el policlínico necesita reparación y hay carencia de medicamentos en los consultorios.' }
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
  $('#necBuscar').click(); await espera(700);
  const guardado = JSON.parse(w.localStorage.getItem('facticuba_data_admin'));
  const lista = (guardado.necesidades.web && guardado.necesidades.web.lista) || [];
  const txt = x => x.hallazgo.toLowerCase();
  ok('hay al menos 5 necesidades', lista.length >= 5);
  ok('todas con fuente', lista.every(x => x.fuente && x.url));
  const ali = lista.filter(x => x.sector === 'Producción de alimentos');
  ok('alimentos: hay al menos una', ali.length >= 1);
  ok('alimentos: ninguna habla de transporte, ómnibus ni agua', ali.every(x => !/transporte|[oó]mnibus|acueducto|apagon/.test(txt(x))));
  const tra = lista.filter(x => x.sector === 'Vialidad y transporte');
  ok('la frase de ómnibus quedó en Vialidad y transporte', tra.some(x => /[oó]mnibus/.test(txt(x))));
  ok('nada de otro municipio (Cárdenas)', lista.every(x => !/c[aá]rdenas/.test(txt(x))));
  ok('nada genérico de «todo el país»', lista.every(x => !/todo el pa[ií]s/.test(txt(x))));
  ok('la frase ambigua (agua + transporte) se descartó', lista.every(x => !/falta agua y falta transporte/.test(txt(x))));
  ok('cada necesidad cabe en su sector (sin mezclar temas)', lista.every(x => !(x.sector === 'Agua y saneamiento' && /ómnibus|transporte/.test(txt(x)))));
  console.log(fallos ? '— fc-necesidades-sector-smoke CON FALLOS' : '— fc-necesidades-sector-smoke OK');
  w.close(); process.exitCode = fallos ? 1 : 0;
})();
