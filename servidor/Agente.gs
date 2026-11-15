// FactiCuba-Datos · AGENTE DE ESTUDIO MUNICIPAL (segundo plano)
// Qué hace: toma municipios de una cola, busca en la web pública (11 temas × 1 consulta), lee las páginas halladas,
// extrae SOLO frases de carencia que traten del municipio y del tema correcto, mide cuántas fuentes distintas las respaldan
// y las guarda en la hoja «Agente_Necesidades». No envía correos ni entra en cuentas: solo lee páginas públicas, con poco volumen.
// Instalación: pegar este archivo junto a Servidor.gs → ejecutar una vez probarAgente() → ejecutar una vez instalarAgente().
var AG = { MAX_COLA: 30, HORAS_MIN: 6, SEG_MAX: 270, PAGS: 3, PAUSA_MS: 700,
  UA: 'FactiCuba-Agente/1.0 (estudio de necesidades municipales; lectura de paginas publicas)' };
var AG_SEC = [
  ['Agua y saneamiento', /\b(agua|acueducto\w*|alcantarillad\w*|saneamiento|potabilizadora\w*|salidero\w*|cisterna\w*|hidraulic\w*)\b/, 'agua acueducto alcantarillado'],
  ['Energía', /\b(electric\w*|apagon\w*|alumbrado|energia|paneles solares|termoelectrica\w*|fotovoltaic\w*|transformador\w*)\b/, 'electricidad apagones alumbrado'],
  ['Vivienda', /\b(vivienda\w*|habitacional\w*|derrumbe\w*|albergue\w*|techo\w*)\b/, 'viviendas fondo habitacional'],
  ['Vialidad y transporte', /\b(vial\w*|carretera\w*|puente\w*|transporte\w*|omnibus|baches|calle\w*|terraplen\w*|camino\w*|ferrocarril|parque automotor)\b/, 'transporte viales carreteras'],
  ['Salud', /\b(salud|hospital\w*|policlinic\w*|consultorio\w*|medicamento\w*|medico\w*|ambulancia\w*|farmacia\w*)\b/, 'salud policlinico hospital'],
  ['Educación', /\b(escuela\w*|circulo\w* infantil\w*|educacion|maestro\w*|docente\w*|aula\w*|universidad\w*|politecnico\w*)\b/, 'escuelas educacion maestros'],
  ['Producción de alimentos', /\b(alimento\w*|alimentaci\w*|agricola\w*|agricultur\w*|agropecuari\w*|cultivo\w*|siembra\w*|cosecha\w*|ganader\w*|vianda\w*|hortaliza\w*|vegetales|frutas?|leche|carne|huevo\w*|arroz|frijol\w*|organopon\w*|huerto\w*|patio\w*|campesin\w*|acopio|autoabastecimiento|porcin\w*|pesca|pesquer\w*|avicola\w*)\b/, 'agricultura alimentos produccion'],
  ['Turismo', /\b(turismo|turistic\w*|turista\w*|hotel\w*|hostal\w*|visitante\w*|playa\w*|cayo\w*|alojamiento\w*)\b/, 'turismo hoteles'],
  ['Industria y comercio local', /\b(industria\w*|comercio|comercial\w*|minindustria|fabrica\w*|empleo\w*|desempleo|mipyme\w*|tienda\w*|taller\w*)\b/, 'industria comercio empleo'],
  ['Medio ambiente', /\b(medio ambiente|medioambiental\w*|contaminaci\w*|residuales|manglar\w*|erosion|deforestaci\w*|reforestaci\w*|desechos|vertedero\w*|basura|salinizaci\w*|sequia)\b/, 'medio ambiente contaminacion'],
  ['Comunicaciones', /\b(internet|telefon\w*|comunicaciones|etecsa|conectividad|wifi|datos moviles|senal movil)\b/, 'internet telefonia comunicaciones']
];
var AG_NECE = /\b(falta\w*|deficit\w*|necesid\w*|problem\w*|deterior\w*|escasez|carencia\w*|insuficien\w*|afectaci\w*|afectad\w*|mal estado|sin acceso|limitaci\w*|ausencia|baja\w* producci\w*|dependencia|no cuenta\w*|requiere\w*|reparaci\w*)\b/;
var AG_SKIP = /facebook\.com|youtube\.com|youtu\.be|instagram\.com|twitter\.com|x\.com|tiktok\.com|\.pdf($|\?)/i;

function agNorm_(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }
function agSectorDeFrase_(f) {
  var nf = agNorm_(f), mejor = null, mN = 0, emp = false;
  AG_SEC.forEach(function (s) {
    var n = (nf.match(new RegExp(s[1].source, 'g')) || []).length;
    if (n > mN) { mejor = s[0]; mN = n; emp = false; } else if (n === mN && n > 0) emp = true;
  });
  return (mejor && !emp) ? mejor : null;
}
function agAlias_(m) { var nm = agNorm_(m).trim(), a = [nm], pre = nm.split(' de ')[0].trim(); if (pre !== nm && pre.length >= 6) a.push(pre); return a; }
function agMenciona_(t, al) { for (var i = 0; i < al.length; i++) if (al[i].length >= 3 && t.indexOf(al[i]) >= 0) return true; return false; }
function agLugarOk_(frase, contexto, mun, otros) {
  var nf = agNorm_(frase), al = agAlias_(mun);
  if (agMenciona_(nf, al)) return true;
  for (var i = 0; i < (otros || []).length; i++) { var o = agNorm_(otros[i]); if (o.length > 4 && nf.indexOf(o) >= 0) return false; }
  return agMenciona_(agNorm_(contexto), al);
}
// Extrae de un texto las frases válidas: carencia + tema único + lugar correcto.
function agExtraer_(texto, titulo, url, mun, otros) {
  var ctx = titulo + ' ' + texto + ' ' + url, out = [];
  String(texto).split(/(?<=[.!?])\s+/).forEach(function (f) {
    f = f.trim();
    if (f.length < 30 || f.length > 400 || !AG_NECE.test(agNorm_(f)) || !agLugarOk_(f, ctx, mun, otros)) return;
    var sec = agSectorDeFrase_(f);
    if (sec) out.push({ sector: sec, hallazgo: f.slice(0, 260), url: url, fuente: agDominio_(url),
      puntos: (/\d/.test(f) ? 1 : 0) + (agMenciona_(agNorm_(f), agAlias_(mun)) ? 1 : 0) });
  });
  return out;
}
function agDominio_(u) { var m = String(u).match(/^https?:\/\/(?:www\.)?([^\/?#]+)/i); return m ? m[1] : ''; }
function agTexto_(html) {
  return String(html).replace(/<(script|style|noscript|svg|nav|footer|header)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<\/(p|div|li|h\d|br|tr)>/gi, '. ').replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&aacute;/g, 'á').replace(/&eacute;/g, 'é').replace(/&iacute;/g, 'í').replace(/&oacute;/g, 'ó').replace(/&uacute;/g, 'ú').replace(/&ntilde;/g, 'ñ')
    .replace(/\s+/g, ' ').replace(/(\. ){2,}/g, '. ');
}
function agParseBusqueda_(html) {
  var res = [], re = /<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g, m;
  var snips = []; String(html).replace(/<a[^>]+class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g, function (_, s) { snips.push(agTexto_(s)); return ''; });
  var i = 0;
  while ((m = re.exec(html))) {
    var h = m[1], u = h.match(/uddg=([^&]+)/); u = u ? decodeURIComponent(u[1]) : h.replace(/^\/\//, 'https://');
    res.push({ url: u, titulo: agTexto_(m[2]), extracto: snips[i++] || '' });
  }
  return res;
}
function agRobotsOk_(url, cache) {
  var d = agDominio_(url); if (d in cache) return cache[d];
  var ok = true;
  try {
    var r = UrlFetchApp.fetch('https://' + d + '/robots.txt', { muteHttpExceptions: true, headers: { 'User-Agent': AG.UA }, followRedirects: true });
    if (r.getResponseCode() === 200) {
      var bloque = false, txt = r.getContentText().split(/\r?\n/);
      txt.forEach(function (l) {
        var t = l.trim().toLowerCase();
        if (t.indexOf('user-agent:') === 0) bloque = t.indexOf('*') > 0;
        else if (bloque && /^disallow:\s*\/\s*$/.test(t)) ok = false;
      });
    }
  } catch (e) {}
  return (cache[d] = ok);
}
function agEstudiar_(prov, mun, otros) {
  var t0 = Date.now(), cache = {}, hall = [], vistos = {}, partes = 0;
  var reqs = AG_SEC.map(function (s) {
    var q = '"' + mun + '" ' + prov + ' ' + s[2] + ' problemas déficit falta';
    return { url: 'https://html.duckduckgo.com/html/?q=' + encodeURIComponent(q), muteHttpExceptions: true, headers: { 'User-Agent': AG.UA } };
  });
  for (var b = 0; b < reqs.length; b += 4) {
    if (Date.now() - t0 > AG.SEG_MAX * 1000) { partes = 1; break; }
    var resp = UrlFetchApp.fetchAll(reqs.slice(b, b + 4)), paginas = [];
    resp.forEach(function (r) {
      if (r.getResponseCode() !== 200) return;
      agParseBusqueda_(r.getContentText()).slice(0, AG.PAGS).forEach(function (it) {
        if (AG_SKIP.test(it.url) || vistos[it.url]) return; vistos[it.url] = 1;
        hall = hall.concat(agExtraer_(it.extracto, it.titulo, it.url, mun, otros));   // el resumen del buscador ya cuenta
        if (agRobotsOk_(it.url, cache)) paginas.push(it);
      });
    });
    if (paginas.length) {
      var pr = UrlFetchApp.fetchAll(paginas.map(function (p) { return { url: p.url, muteHttpExceptions: true, headers: { 'User-Agent': AG.UA } }; }));
      pr.forEach(function (r, i) {
        if (r.getResponseCode() !== 200) return;
        var tx = agTexto_(r.getContentText()).slice(0, 60000);
        hall = hall.concat(agExtraer_(tx, paginas[i].titulo, paginas[i].url, mun, otros));
      });
    }
    Utilities.sleep(AG.PAUSA_MS);
  }
  // Agrupar: por tema, quitar duplicados, medir corroboración (fuentes distintas) y quedarse con las 3 mejores
  var porSec = {};
  hall.forEach(function (h) { (porSec[h.sector] = porSec[h.sector] || []).push(h); });
  var out = [];
  Object.keys(porSec).forEach(function (sec) {
    var lista = porSec[sec], dom = {}, vis = {};
    lista.forEach(function (h) { dom[h.fuente] = 1; });
    var corr = Object.keys(dom).length;
    lista.filter(function (h) { var k = agNorm_(h.hallazgo).slice(0, 80); if (vis[k]) return false; vis[k] = 1; return true; })
      .sort(function (a, b) { return b.puntos - a.puntos; }).slice(0, 3)
      .forEach(function (h) { h.corrobora = corr; out.push(h); });
  });
  return { hallazgos: out, parcial: !!partes };
}
// ---- Hojas y cola ----
function agHoja_(nombre, cols) {
  var ss = SpreadsheetApp.openById(DB_ID), ws = ss.getSheetByName(nombre);
  if (!ws) { ws = ss.insertSheet(nombre); ws.appendRow(cols); ws.setFrozenRows(1); }
  return ws;
}
var AG_COLA = ['provincia', 'municipio', 'estado', 'pedido', 'iniciado', 'terminado', 'hallazgos', 'nota', 'otros'];
var AG_RES = ['fecha', 'provincia', 'municipio', 'sector', 'hallazgo', 'fuente', 'url', 'corrobora'];
function agFilas_(ws) { var l = ws.getLastRow(); return l < 2 ? [] : ws.getRange(2, 1, l - 1, ws.getLastColumn()).getValues(); }
function agFilaCola_(ws, prov, mun) {
  var f = agFilas_(ws);
  for (var i = 0; i < f.length; i++) if (agNorm_(f[i][0]) === agNorm_(prov) && agNorm_(f[i][1]) === agNorm_(mun)) return i + 2;
  return -1;
}
function agEncolar_(prov, mun, otros, forzar) {
  var ws = agHoja_('Agente_Cola', AG_COLA), fila = agFilaCola_(ws, prov, mun), ahora = new Date();
  var pend = agFilas_(ws).filter(function (r) { return r[2] === 'pendiente' || r[2] === 'en_curso'; }).length;
  if (fila > 0) {
    var v = ws.getRange(fila, 1, 1, 9).getValues()[0];
    if (v[2] === 'pendiente' || v[2] === 'en_curso') return { ok: true, estado: v[2] };
    if (v[2] === 'hecho' && !forzar && v[5] && (ahora - new Date(v[5])) < AG.HORAS_MIN * 3600000) return { ok: true, estado: 'hecho', reciente: true };
    ws.getRange(fila, 3, 1, 7).setValues([['pendiente', ahora.toISOString(), '', '', 0, '', JSON.stringify((otros || []).slice(0, 80))]]);
    return { ok: true, estado: 'pendiente' };
  }
  if (pend >= AG.MAX_COLA) return { ok: false, error: 'La cola está llena; intenta más tarde.' };
  ws.appendRow([prov, mun, 'pendiente', ahora.toISOString(), '', '', 0, '', JSON.stringify((otros || []).slice(0, 80))]);
  return { ok: true, estado: 'pendiente' };
}
function agEstado_(prov, mun) {
  var ws = agHoja_('Agente_Cola', AG_COLA), fila = agFilaCola_(ws, prov, mun);
  if (fila < 0) return { ok: true, estado: 'sin_pedido' };
  var v = ws.getRange(fila, 1, 1, 9).getValues()[0];
  return { ok: true, estado: v[2], pedido: v[3], terminado: v[5], hallazgos: v[6], nota: v[7] };
}
function agResultados_(prov, mun) {
  var ws = agHoja_('Agente_Necesidades', AG_RES), out = [];
  agFilas_(ws).forEach(function (r) {
    if (agNorm_(r[1]) === agNorm_(prov) && agNorm_(r[2]) === agNorm_(mun))
      out.push({ fecha: String(r[0]).slice(0, 10), sector: r[3], hallazgo: r[4], fuente: r[5], url: r[6], corrobora: Number(r[7]) || 1 });
  });
  return { ok: true, resultados: out };
}
// ---- Trabajo en segundo plano (disparador cada 10 min) ----
function agenteTick() {
  var lock = LockService.getScriptLock(); if (!lock.tryLock(5000)) return;
  try {
    var t0 = Date.now(), ws = agHoja_('Agente_Cola', AG_COLA), wr = agHoja_('Agente_Necesidades', AG_RES);
    agFilas_(ws).forEach(function (r, i) {   // rescatar trabajos colgados > 20 min
      if (r[2] === 'en_curso' && r[4] && (Date.now() - new Date(r[4])) > 20 * 60000) ws.getRange(i + 2, 3).setValue('pendiente');
    });
    while (Date.now() - t0 < 120000) {
      var f = agFilas_(ws), idx = -1;
      for (var i = 0; i < f.length; i++) if (f[i][2] === 'pendiente') { idx = i; break; }
      if (idx < 0) return;
      var fila = idx + 2, r = f[idx];
      ws.getRange(fila, 3).setValue('en_curso'); ws.getRange(fila, 5).setValue(new Date().toISOString());
      try {
        var otros = []; try { otros = JSON.parse(r[8] || '[]'); } catch (e) {}
        var res = agEstudiar_(String(r[0]), String(r[1]), otros), fecha = new Date().toISOString();
        if (res.hallazgos.length) wr.getRange(wr.getLastRow() + 1, 1, res.hallazgos.length, 8).setValues(res.hallazgos.map(function (h) { return [fecha, r[0], r[1], h.sector, h.hallazgo, h.fuente, h.url, h.corrobora]; }));
        ws.getRange(fila, 3, 1, 5).setValues([['hecho', r[3], r[4] || fecha, fecha, res.hallazgos.length]]);
        ws.getRange(fila, 8).setValue(res.hallazgos.length ? (res.parcial ? 'Estudio parcial (se acabó el tiempo)' : '') : 'La web pública casi no habla de este municipio: pide datos a las instituciones.');
      } catch (err) { ws.getRange(fila, 3).setValue('error'); ws.getRange(fila, 8).setValue(String(err).slice(0, 200)); }
    }
  } finally { lock.releaseLock(); }
}
function instalarAgente() {
  ScriptApp.getProjectTriggers().forEach(function (t) { if (t.getHandlerFunction() === 'agenteTick') ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('agenteTick').timeBased().everyMinutes(10).create();
  Logger.log('Agente instalado: se ejecuta cada 10 minutos.');
}
function probarAgente() {
  var r = agEstudiar_('Matanzas', 'Ciénaga de Zapata', ['Cárdenas', 'Colón', 'Jovellanos']);
  Logger.log(JSON.stringify(r.hallazgos.slice(0, 5), null, 1)); Logger.log('Hallazgos: ' + r.hallazgos.length);
}
// ---- Rutas (se llaman desde doGet/doPost de Servidor.gs) ----
function agenteRuta_(accion, p, body) {
  if (accion === 'agente_estado') return agEstado_(p.provincia, p.municipio);
  if (accion === 'agente_resultados') return agResultados_(p.provincia, p.municipio);
  if (accion === 'agente_encolar') return agEncolar_(String(body.provincia || ''), String(body.municipio || ''), body.otros || [], !!body.forzar);
  return null;
}
