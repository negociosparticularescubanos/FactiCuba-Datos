// fc-necesidades-informe-smoke: informe para el pueblo — 5 necesidades, lenguaje simple, beneficios.
const fs = require('fs');
const { JSDOM } = require('/home/hatch/workspace/finanzas-sheets/audit/node_modules/jsdom');
const html = fs.readFileSync('/home/hatch/workspace/facticuba-datos-site/candidato/index.html', 'utf8');
let fallos = 0;
const ok = (n, c) => { console.log((c ? '✔' : '✘ FALLO') + ' ' + n); if (!c) fallos++; };
const espera = ms => new Promise(r => setTimeout(r, ms));
const dig = s => String(s).replace(/[^0-9]/g, '');

const datos = {
  proyecto: {}, onei: {},
  plan: { provincia: 'Matanzas', municipio: 'Ciénaga de Zapata' },
  necesidades: {
    provincia: 'Matanzas', municipio: 'Ciénaga de Zapata', tasa: '',
    web: { fecha: 'hoy', municipio: 'Ciénaga de Zapata', lista: [
      { sector: 'Vivienda', hallazgo: 'El fondo habitacional muestra deterioro: cientos de viviendas necesitan rehabilitación urgente.', fuente: 'Web', url: 'https://ejemplo.cu/v' },
      { sector: 'Salud', hallazgo: 'El policlínico municipal necesita reparación y hay carencia de medicamentos.', fuente: 'Web', url: 'https://ejemplo.cu/s' }
    ]},
    filas: [
      { programa: 'Producción de alimentos', linea: 'Fomento agrícola', unidad: 'ha', cantidad: '2', costoCUP: '100000', costoUSD: '1000', dist: [20,20,20,15,15,10] },
      { programa: 'Agua y saneamiento', linea: 'Reparar el acueducto', unidad: 'km', cantidad: '1', costoCUP: '50000', costoUSD: '', dist: [20,20,20,15,15,10] },
      { programa: 'Energía', linea: 'Alumbrado', unidad: 'puntos', cantidad: '1', costoCUP: '', costoUSD: '2000', dist: [20,20,20,15,15,10] }
    ]
  }
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
const w = dom.window; const $ = s => w.document.querySelector(s);

(async () => {
  await espera(300);
  $('#tabNecesidades').click(); await espera(200);
  ok('botón del informe presente', !!$('#necInforme'));
  $('#necInforme').click(); await espera(200);
  const txt = $('#formCtn').textContent;
  ok('exactamente 5 necesidades presentadas', (txt.match(/Qué gana la gente/g) || []).length === 5);
  ok('la primera es alimentos', txt.indexOf('1. Producción de alimentos') >= 0 && txt.indexOf('1. Producción de alimentos') < txt.indexOf('2. Agua y saneamiento'));
  ok('beneficio de alimentos en palabras del pueblo', txt.includes('Comida fresca cerca de casa'));
  ok('beneficio del agua en palabras del pueblo', txt.includes('Agua limpia en la llave'));
  ok('la vivienda trae su situación desde la web', txt.includes('cientos de viviendas necesitan rehabilitación'));
  ok('sin costo calculado se dice con honestidad', txt.includes('todavía se está calculando'));
  ok('totales del plan presentes (250 000 CUP · 4 000 USD)', dig(txt).includes('250000') && dig(txt).includes('4000'));
  ok('sin tecnicismos (nada de VAN/TIR/factibilidad)', !/VAN|TIR|factibilidad/.test(txt));
  ok('cierre con el control popular', txt.includes('la población puede preguntar'));
  $('#necInfVolver').click(); await espera(200);
  ok('volver restaura la tabla del plan', !!$('#necTabla'));
  console.log(fallos ? '— fc-necesidades-informe-smoke CON FALLOS' : '— fc-necesidades-informe-smoke OK');
  w.close(); process.exitCode = fallos ? 1 : 0;
})();
