// FactiCuba-Datos · Servidor — guarda las plantillas en la base «FactiCuba-Datos DB»
// Base: https://docs.google.com/spreadsheets/d/1NLycvaLYb-as7hjgPLvxu3zf10SsIO5CjmT4f4TeDuo/edit
// Acciones: GET ?accion=ping | cargar&usuario=X | listar · POST {accion:'guardar', usuario, datos:{proyecto,plan,onei}}
var DB_ID = '1NLycvaLYb-as7hjgPLvxu3zf10SsIO5CjmT4f4TeDuo';
var HOJAS = { proyecto: 'Proyecto', plan: 'PlanEDM', onei: 'ONEI' };

function db() { return SpreadsheetApp.openById(DB_ID); }
function salida(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
function cabecera(ws) {
  var last = ws.getLastColumn();
  return ws.getRange(1, 1, 1, last).getValues()[0].map(function (h) { return String(h).trim(); });
}
function filaDeUsuario(ws, cols, usuario) {
  var iU = cols.indexOf('usuario');
  var last = ws.getLastRow();
  if (last < 2) return -1;
  var vals = ws.getRange(2, iU + 1, last - 1, 1).getValues();
  for (var i = 0; i < vals.length; i++) if (String(vals[i][0]) === String(usuario)) return i + 2;
  return -1;
}
function leerDatos(usuario) {
  var ss = db(), datos = {}, fecha = '';
  for (var k in HOJAS) {
    var ws = ss.getSheetByName(HOJAS[k]);
    var cols = cabecera(ws);
    var fila = filaDeUsuario(ws, cols, usuario);
    datos[k] = {};
    if (fila > 0) {
      var vals = ws.getRange(fila, 1, 1, cols.length).getValues()[0];
      for (var i = 0; i < cols.length; i++) {
        var c = cols[i];
        if (c === 'id_registro' || c === 'fecha_guardado' || c === 'usuario') continue;
        if (vals[i] !== '' && vals[i] !== null) datos[k][c] = String(vals[i]);
      }
      var f = vals[cols.indexOf('fecha_guardado')];
      if (f) fecha = String(f);
    }
  }
  return { datos: datos, fecha: fecha };
}
function pctFila(cols, row) {
  var t = 0, n = 0;
  for (var i = 0; i < cols.length; i++) {
    var c = cols[i];
    if (c === 'id_registro' || c === 'fecha_guardado' || c === 'usuario') continue;
    n++; if (String(row[i]).trim() !== '') t++;
  }
  return n ? Math.round(100 * t / n) : 0;
}
function guardar(usuario, datos) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var ss = db();
    var fecha = new Date().toISOString();
    var id = 'FD-' + String(usuario).replace(/\W+/g, '').toUpperCase().slice(0, 20);
    var pcts = {};
    for (var k in HOJAS) {
      var ws = ss.getSheetByName(HOJAS[k]);
      var cols = cabecera(ws);
      var fila = filaDeUsuario(ws, cols, usuario);
      var d = datos[k] || {};
      var row = cols.map(function (c) {
        if (c === 'id_registro') return id;
        if (c === 'fecha_guardado') return fecha;
        if (c === 'usuario') return usuario;
        return d[c] != null ? String(d[c]) : '';
      });
      if (fila > 0) ws.getRange(fila, 1, 1, cols.length).setValues([row]);
      else ws.appendRow(row);
      pcts[k] = pctFila(cols, row);
    }
    var wr = ss.getSheetByName('Registros');
    var cr = cabecera(wr);
    var fr = filaDeUsuario(wr, cr, usuario);
    var p = datos.proyecto || {};
    var reg = {
      id_registro: id, fecha_guardado: fecha, usuario: usuario,
      denominacion: p.denominacion || '', provincia: p.provincia || '', municipio: p.municipio || '',
      gestion: p.gestion || '', pct_proyecto: pcts.proyecto || 0, pct_plan: pcts.plan || 0,
      pct_onei: pcts.onei || 0, notas: ''
    };
    if (fr > 0) { var vieja = wr.getRange(fr, 1, 1, cr.length).getValues()[0]; reg.notas = vieja[cr.indexOf('notas')] || ''; }
    var rowR = cr.map(function (c) { return reg[c] != null ? reg[c] : ''; });
    if (fr > 0) wr.getRange(fr, 1, 1, cr.length).setValues([rowR]);
    else wr.appendRow(rowR);
    return { ok: true, id: id, fecha: fecha };
  } finally { lock.releaseLock(); }
}
function doGet(e) {
  var a = (e.parameter.accion || 'ping').toLowerCase();
  try {
    if (a === 'ping') return salida({ ok: true, servicio: 'FactiCuba-Datos', ts: new Date().toISOString() });
    if (a === 'cargar') {
      var u = e.parameter.usuario || '';
      if (!u) return salida({ ok: false, error: 'Falta usuario' });
      var r = leerDatos(u);
      return salida({ ok: true, usuario: u, fecha: r.fecha, datos: r.datos });
    }
    if (a === 'listar') {
      var ws = db().getSheetByName('Registros');
      var cols = cabecera(ws), out = [], last = ws.getLastRow();
      if (last >= 2) {
        var vals = ws.getRange(2, 1, last - 1, cols.length).getValues();
        vals.forEach(function (v) { var o = {}; cols.forEach(function (c, i) { o[c] = v[i]; }); out.push(o); });
      }
      return salida({ ok: true, registros: out });
    }
    return salida({ ok: false, error: 'Acción no reconocida' });
  } catch (err) { return salida({ ok: false, error: String(err) }); }
}
function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents || '{}');
    if (body.accion === 'guardar') {
      if (!body.usuario || !body.datos) return salida({ ok: false, error: 'Faltan usuario o datos' });
      return salida(guardar(String(body.usuario), body.datos));
    }
    return salida({ ok: false, error: 'Acción no reconocida' });
  } catch (err) { return salida({ ok: false, error: String(err) }); }
}
