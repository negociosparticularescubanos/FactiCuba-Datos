// fc-necesidades-estudio-smoke: estudio oficial de 16 secciones según el modelo real + tipo CAPEX/OPEX.
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
  necesidades: {
    provincia: 'Matanzas', municipio: 'Ciénaga de Zapata', tasa: '900', web: null,
    filas: [
      { programa: 'Producción de alimentos', linea: 'Organopónicos nuevos', unidad: 'ha', cantidad: '2', costoCUP: '100000', costoUSD: '1000', tipo: 'CAPEX', dist: [20,20,20,15,15,10] },
      { programa: 'Agua y saneamiento', linea: 'Reparar el acueducto', unidad: 'km', cantidad: '1', costoCUP: '50000', costoUSD: '', tipo: 'CAPEX', dist: [20,20,20,15,15,10] },
      { programa: 'Producción de alimentos', linea: 'Semillas y compost de arranque', unidad: 'lotes', cantidad: '1', costoCUP: '30000', costoUSD: '', tipo: 'OPEX', dist: [100,0,0,0,0,0] }
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
  ok('la tabla trae el selector de tipo', !!w.document.querySelector('[data-c="tipo"]'));
  const sel = w.document.querySelector('#necTabla tbody tr[data-fila="2"] [data-c="tipo"]');
  ok('la fila OPEX viene marcada como capital de trabajo', sel && sel.value === 'OPEX');
  ok('botón del estudio presente', !!$('#necEstudio'));
  $('#necEstudio').click(); await espera(200);
  const txt = $('#formCtn').textContent;
  ok('portada institucional', txt.includes('REPÚBLICA DE CUBA') && txt.includes('MUNICIPIO CIÉNAGA DE ZAPATA'));
  ok('secciones del modelo presentes', ['1. Resumen Ejecutivo','2. Marco Jurídico','5. Cartera de Programas','6. Costos de Inversión (CAPEX)','7. Capital de Trabajo','8. Monto Total','11. Demanda Energética','13. Fuentes de Financiamiento','15. Principales Riesgos','16. Conclusiones'].every(t => txt.includes(t)));
  ok('CAPEX = 250 000 CUP', dig(txt).includes('250000'));
  ok('contingencia 10% = 28 000', dig(txt).includes('28000'));
  ok('MONTO TOTAL = 308 000 CUP', dig(txt).includes('308000'));
  ok('la Ley 148 aparece (hay alimentos)', txt.includes('Ley 148/2022'));
  ok('población ONEI en el resumen', dig(txt).includes('9000'));
  $('#necEstVolver').click(); await espera(200);
  ok('volver restaura el plan', !!$('#necTabla'));
  console.log(fallos ? '— fc-necesidades-estudio-smoke CON FALLOS' : '— fc-necesidades-estudio-smoke OK');
  w.close(); process.exitCode = fallos ? 1 : 0;
})();
