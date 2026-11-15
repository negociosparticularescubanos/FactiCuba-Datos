# HANDOFF-AI · FactiCuba-Datos

## Objetivo
Sitio para llenar en línea las 3 plantillas oficiales del estudio de factibilidad
PDL (Proyecto, Plan municipal EDM, Datos ONEI) con revisión e informe, guardando
cada dato en una base de Google Sheets de la cuenta de negocios.

## Direcciones
- Sitio en vivo: https://negociosparticularescubanos.github.io/FactiCuba-Datos/
- Repo: https://github.com/negociosparticularescubanos/FactiCuba-Datos (público, cuenta negociosparticularescubanos)
- Base «FactiCuba-Datos DB»: https://docs.google.com/spreadsheets/d/1NLycvaLYb-as7hjgPLvxu3zf10SsIO5CjmT4f4TeDuo/edit
- Servidor Apps Script (proyecto «FactiCuba-Datos Servidor», v2, 2026-11-14):
  https://script.google.com/macros/s/AKfycbzVAc0OZAWV8_XDeiRBRGDVYw7YZoDla99r89i6azBy54IzzM5aF8TlTvR5iPcrDvaLWg/exec

## Estado (2026-11-14 18:03)
- LOGIN CERRADO (pedido por Leonardo): solo existe el usuario **admin**, fijo y
  no editable en el formulario; eliminado todo rastro de creación de cuentas
  (setupRow, doSetupAdmin). En un equipo nuevo, la primera contraseña escrita
  al entrar queda fijada como la del admin (la pone él, en la app). Arnés
  fc-login-smoke 7/7. Publicado y verificado en vivo (huella fea3465b…).
- CAMBIAR CONTRASEÑA dentro de la app (módulo fcClave): botón «🔑 Contraseña»
  junto a «Salir»; pide la actual y la nueva dos veces; se guarda solo en el
  equipo (localStorage `facticuba_users`). Arnés fc-clave-smoke 9/9. Publicado
  y verificado en vivo — **huella actual de la página: cb6c9b3e…**
- Leonardo pasó una contraseña por el chat el 2026-11-14: NO se usó, no se
  guardó en ningún sitio y no está en el código (la página es pública). Se le
  avisó de la exposición y por eso se añadió el cambio de contraseña interno.

## Estado (2026-11-14 00:27)
- Sitio creado por Leonardo (ZIP del 2026-11-13) y publicado tal cual (huella f0cb80b9…).
- CONEXIÓN A LA BASE publicada y verificada en vivo (huella ceb4be18…): módulo
  fcNube añadido al final del index.html + texto de ayuda del login corregido
  (ya no dice «sin servidores»). El resto del código de Leonardo no se tocó.
- Base con 6 pestañas: Portada, Registros, Proyecto (76 campos), PlanEDM (28),
  ONEI (34), Diccionario (138 campos documentados). Unión por id_registro.
- Servidor verificado con ida y vuelta real: guardar → cargar → listar;
  % correctos contra el total de cada plantilla (4/76=5 %, 1/28=4 %, 1/34=3 %).

## Cómo funciona
- La página guarda local (localStorage `facticuba_data_admin`; único usuario: admin).
- fcNube vigila cambios cada 4 s y sube el juego completo al servidor (POST
  guardar); el servidor hace upsert por usuario en Proyecto/PlanEDM/ONEI y
  actualiza Registros con los %.
- Pastilla fija abajo a la derecha: punto verde «conectada» / rojo «sin
  conexión» (ping real al cargar y cada 2 min) + botón «Restaurar de la nube»
  (trae la copia de la base, la escribe en localStorage y recarga).
- Sin internet la app sigue local como siempre; al volver la conexión, el
  siguiente cambio re-sincroniza.

## Archivos (~/workspace/facticuba-datos-site/)
- index.html — copia canónica local (= lo que sirve GitHub, verificar por sha256)
- servidor/Servidor.gs — código del Apps Script (fuente)
- modulos/fc-nube.html — módulo de conexión (fuente; la URL va sustituida en el index)
- modulos/fc-clave.html — módulo «cambiar mi contraseña» (fuente)
- arneses/fc-nube-smoke.js — prueba jsdom del módulo (8/8)
- arneses/fc-login-smoke.js — prueba del login cerrado (7/7)
- arneses/fc-clave-smoke.js — prueba del cambio de contraseña (9/9)
- FactiCuba-Datos-DB.xlsx — libro original del que nació la base
- candidato/ — donde se construye antes de publicar

## Reglas
- GitHub es la fuente de verdad: antes de publicar, bajar el index de GitHub,
  comprobar que coincide con la copia local y construir sobre él.
- El login y las contraseñas los pone Leonardo en su equipo; nunca en el chat.
- Cambios de código del servidor = editar Servidor.gs y redesplegar como
  NUEVA VERSIÓN sobre la misma implementación (la URL /exec no cambia).

## Pendientes
- Leonardo: probar en el teléfono (cerrar la pestaña y reabrir con conexión
  para coger la versión nueva), entrar como admin y escribir un dato para ver
  la fila aparecer en la base; cambiar su contraseña desde «🔑 Contraseña»
  (la anterior pasó por el chat).

## Pestaña «Necesidades del Municipio» (2026-11-14, PUBLICADA, huella 6da5741b)

- Petición de Leonardo: 4ª pestaña de datos (va tras ONEI, antes de Revisión) que, eligiendo provincia y municipio, arma el **plan de inversiones 2027-2032 en CUP y USD** según las necesidades del municipio, «en tiempo real». Ampliación suya el mismo día: que la pestaña **busque en la web las necesidades y carencias del municipio y muestre las más importantes (mínimo 5) con su fuente**.
- Módulo `modulos/fc-necesidades.html` (fcNecesidades): botón propio insertado antes de Revisión (NO usa el sistema de pestañas de Leonardo: su render() rompería con una clave desconocida; el botón «Vaciar» queda bloqueado con aviso mientras esta vista está activa). Estado en `data.necesidades` = {provincia, municipio, tasa, web, filas[]}; se guarda con persist() como el resto.
- **Precarga solo en vacío**: provincia/municipio desde Plan o Proyecto; arriba muestra como referencia población y hogares (ONEI, mayor número del texto) y los textos de déficit y necesidades del Plan EDM.
- **Tabla de líneas**: catálogo inicial de 11 programas (agua, energía, vivienda, viales, salud, educación, alimentos, turismo, industria/comercio, ambiente, comunicaciones), todo editable; cantidad × costo unitario CUP y USD; reparto % por año (defecto 20/20/20/15/15/10); añadir/quitar filas. **Cálculo en vivo**: totales por línea, tabla por años 2027-2032, resumen por programa y gran total; con la tasa puesta, equivalencia USD→CUP y total equivalente. Botón imprimir (usa el CSS de impresión del sitio). NO inventa cifras: cantidades y costos los pone Leonardo (plan municipal, presupuestos, cotizaciones).
- **Búsqueda web (v2)**: botón «Buscar necesidades del municipio» → 4 consultas al espejo de FactiCuba (Apps Script ?ruta=buscar; si hay <4 resultados, 2 consultas de respaldo a nivel provincia) → clasifica los extractos por sector (palabras clave) y frases de carencia (falta/déficit/necesidad/problema/…) → presenta hasta 8 necesidades (la mejor por sector primero; objetivo ≥5) con fuente enlazada y sello «Web — VERIFICAR»; botón «➕ Añadir al plan» por necesidad (suma la línea; cantidades/costos los rellena él). La búsqueda queda guardada en data.necesidades.web.
- Arneses: `arneses/fc-necesidades-smoke.js` 16/16 y `arneses/fc-necesidades-web-smoke.js` 7/7 (espejo simulado). Forma real del espejo verificada por curl: {items:[{fuente, titulo, extracto, url}]}.
- ⚠️ REGLA DE CONSTRUCCIÓN de este sitio: los módulos van AÑADIDOS al final del index; para ACTUALIZAR un módulo hay que RETIRAR su bloque <script> anterior del archivo base antes de añadir la versión nueva (si no, quedan dos copias y manda la primera). Aplicado en la v2 (se retiró la v1, huella intermedia 0c0edad5).
- ⚠️ PENDIENTE TÉCNICO: la pestaña se guarda en el equipo y viaja en el respaldo a la nube, pero el servidor de la base SOLO escribe las 3 plantillas (Proyecto/PlanEDM/ONEI): las necesidades NO quedan aún en la hoja de cálculo. Si Leonardo lo pide: hoja «Necesidades» (una fila por línea del plan) + acción en el servidor.

## Prioridad de alimentos + Estrategia EDM Ciénaga (2026-11-14, PUBLICADA, huella viva = candidato v3)

- Orden de Leonardo: tener en cuenta la Estrategia de Desarrollo Municipal y fijar la **producción de alimentos como prioridad en TODOS los municipios, con los porqués**. Aportó el texto completo de la Línea 1 de Ciénaga de Zapata (Política Local de Soberanía Alimentaria), guardado en `documentos/estrategia-cienaga-linea1-alimentos.md` del sitio (ojo: su texto cita la ley como 148/22 en la introducción y 154/22 en el marco jurídico; en la app se usa Ley 148/2022).
- Cambios en fcNecesidades v3: (1) «Producción de alimentos» es la PRIMERA línea del catálogo, con ⭐; (2) tarjeta fija «⭐ Prioridad en todos los municipios» con los 4 porqués (prioridad estratégica/Ley 148, dependencia de importaciones, potencialidades locales subutilizadas, producción 0 km = precios, empleo rural, frescura); (3) en la búsqueda web, los hallazgos de alimentos salen primero en el ranking; (4) si el municipio es Ciénaga de Zapata, tarjeta EDM Línea 1 con objetivo, metas (2026-27: +20% patios/organopónicos y 5 mercados; 2028-29: 60% hortalizas/frutas/viandas; 2030: 80% autoabastecimiento), programas y los 8 PDL, con botón «Cargar las líneas de esta estrategia al plan» que añade 13 líneas (mercados con cantidad 5; sin duplicar si se pulsa dos veces).
- Arnés `arneses/fc-necesidades-edm-smoke.js`: 10/10; regresiones de los otros dos arneses de necesidades en verde.

## Informe para el pueblo (2026-11-14, PUBLICADO y verificado en vivo)

- Petición de Leonardo: un informe UNIFORME (mismo formato en cualquier municipio) para PRESENTAR el plan, en palabras no profesionales, que la gente del pueblo entienda, con las 5 necesidades bien descritas y los beneficios de implementarlas.
- fcNecesidades v4: tarjeta «Presentar el plan al pueblo» + botón «🗣️ Hacer el informe para el pueblo» → vista `pintarInforme()` con: portada (municipio, provincia, 2027-2032), «¿De qué trata este plan?» en llano, las **5 necesidades** y cierre con el dinero en resumen y el control popular («lo que aquí se promete, se cumple o se explica»), botones imprimir/volver.
- Selección de las 5: programas del plan CON inversión primero (alimentos siempre el n.º 1; el resto por monto), se completa con las necesidades halladas en la web y luego con el catálogo. Cada necesidad: **Cómo estamos hoy** (el hallazgo web de ese sector si existe; si no, texto llano por sector), **Qué se va a hacer** (las líneas reales del plan de ese programa; si no, la acción llana por sector), **Cuánto cuesta** (totales reales CUP/USD del programa; si aún no hay costo: «todavía se está calculando… no se pone un número inventado»), **Qué gana la gente** (beneficios en lenguaje del pueblo por sector, diccionario PUEBLO en el módulo).
- Sin tecnicismos por diseño (el arnés verifica que no aparezcan VAN/TIR/factibilidad). Arnés `arneses/fc-necesidades-informe-smoke.js`: 11/11; regresiones de necesidades en verde.

## Estudio de referencia real + Estudio oficial de 16 secciones (2026-11-14, PUBLICADO)

- Leonardo subió un ESTUDIO DE FACTIBILIDAD REAL (PDF: «Estudio de Factibilidad – Soberanía Alimentaria, Ciénaga de Zapata», nov 2026) y ordenó: aprender de él para FactiCuba y FactiCuba-Datos; informes lo más parecidos posible. El PDF y el modelo destilado viven en `~/workspace/referencia-estudio-real/` (MODELO-ESTUDIO-REAL.md + estudio.txt) y copia en documentos/ del proyecto.
- El modelo: portada institucional + 16 secciones (Art. 28 Decreto 174/2026): resumen ejecutivo, marco jurídico, diagnóstico y demanda (canasta g/persona/día), precios de referencia, cartera de programas/PDL, CAPEX por bloques con rangos y valor central, capital de trabajo (ciclo 12-18 meses), monto total = CAPEX + OPEX + contingencia 10 % con distribución por horizontes, niveles de actividad e ingresos, costos de producción en régimen, energía renovable, flujo y viabilidad, fuentes de financiamiento (a-f), impactos, riesgos→mitigación, conclusiones y recomendación.
- ⚠️ DEFECTO DEL EJEMPLO (avisado a Leonardo): su Resumen Ejecutivo dice 487,6 M CUP pero las secciones 6-8 suman 3 410 M CUP — resumen de una versión anterior. Se copia la ESTRUCTURA, no la inconsistencia: en la app todo sale de una sola fuente de números (el plan).
- fcNecesidades v5: (1) cada línea del plan tiene TIPO: Inversión fija (CAPEX) / Capital de trabajo (OPEX) — selector en la tabla, defecto CAPEX; (2) botón «📄 Estudio de factibilidad (formato oficial)» → pintarEstudio(): portada institucional y las 16 secciones alimentadas del plan y de las plantillas (población ONEI, déficit/necesidades del Plan, evidencia web, cartera por programas, CAPEX/OPEX con totales, contingencia 10 %, distribución por años real del plan, metas físicas, fuentes a-f, impactos desde los beneficios por sector, riesgos estándar del modelo, conclusiones con el monto). Lo no cuantificado se declara, no se inventa. Arnés fc-necesidades-estudio-smoke 11/11 + 4 regresiones en verde.
- ⏭️ BLOQUE SIGUIENTE (pendiente): aplicar el mismo modelo al DOCUMENTO OFICIAL de la FactiCuba principal (reordenar sus partes al esqueleto de 16 secciones: añadir precios de referencia, demanda energética, riesgos y mitigación, fuentes recomendadas; su motor ya trae flujo, VAN/TIR y DSCR).

## VISIÓN: la EDM viva + pestaña «Estrategia Viva» (2026-11-14, PUBLICADA)

- VISIÓN FIJADA POR LEONARDO (2026-11-14): el servicio ES «la Página Web de la Estrategia de Desarrollo Municipal para cada municipio», una EDM VIVA: al introducir los datos de los diferentes indicadores, ella misma actualiza las cifras correspondientes. Documento: `documentos/VISION-EDM-VIVA.md` (con la hoja de ladrillos).
- Módulo `modulos/fc-estrategia.html` (fcEstrategia): pestaña «🏛️ Estrategia Viva» insertada como PRIMERA (portada del municipio; botón propio, mismo patrón que Necesidades: no usa el render de Leonardo y el «Vaciar» queda bloqueado en esta vista). Contenido:
  - Tarjetas vivas calculadas de los datos del momento: población y hogares (ONEI), inversión total del plan de necesidades (CUP/USD y n.º de líneas), inversión en alimentos, n.º de necesidades halladas en la web.
  - Tabla de INDICADORES de la EDM (data.estrategia.indicadores): nombre, unidad, línea base, meta, año meta, VALOR ACTUAL editable → AVANCE % automático con barra ((actual−base)/(meta−base), base vacía = 0). Semilla de 7: autoabastecimiento de alimentos 80 % (2030), cobertura local hortalizas/frutas/viandas 60 % (2029), +20 % patios y organopónicos (2027), 5 mercados agroecológicos (2027), agua regular 100 %, viviendas, empleos. Añadir/quitar indicadores.
  - Los informes (estudio e informe para el pueblo) ya se generan siempre con los datos del momento: la cadena viva queda cerrada.
- Arnés `arneses/fc-estrategia-smoke.js`: 9/9 (portada, tarjetas, avance 40/80 = 50 %, persistencia).
- Ladrillos que siguen (VISION-EDM-VIVA.md): respaldo en la base de Necesidades e Indicadores (hojas propias + servidor v3); FactiCuba principal al esqueleto de 16 secciones; precios de referencia vivos (espejo) en la sección 4 del estudio.

## Pulido de interfaz v1 (módulo `modulos/fc-pulido.html`, añadido al final del index)

- Se añadió estructura HTML válida al index (`<!DOCTYPE>`, `lang="es"`, `charset`, `viewport`, título y descripción): antes faltaban y en teléfono la página se dibujaba a escala reducida.
- Textos: ajuste de palabras largas, campos de tablas que crecen según su contenido (con tooltip y ampliación al enfocar), tarjetas y avisos que ya no se solapan, aviso (toast) por encima de la pastilla de conexión.
- Móvil: pestañas en franja deslizable (ya no tapan la pantalla), botones de 44 px mínimo, letra de 16 px en campos (evita el zoom automático en iOS).
- Guía «Cómo empezar en 4 pasos» en el panel; las imágenes que no existan (p. ej. `src/images/fondo-cuba.jpg`) se ocultan sin icono roto.
- Pendiente de datos: la carpeta `src/images/` no venía en el ZIP; si se tiene `fondo-cuba.jpg`, colocarla en `src/images/`.
- Regla de construcción: igual que los demás módulos, para actualizar este hay que retirar su bloque `<style id="fc-pulido-css">` y `<script id="fc-pulido-js">` antes de añadir la versión nueva.

## Necesidades web: precisión por tema y por municipio (fcNecesidades v6)

- Problema reportado: en «Producción de alimentos» aparecían frases de transporte. Causas: la palabra «producción» y «abasto» activaban alimentos en casi cualquier texto; se clasificaba el artículo entero y, si no había frase adecuada, se mostraban los primeros 200 caracteres; no se comprobaba que el texto hablara del municipio elegido.
- Ahora: (1) cada FRASE se asigna a un solo sector, el que más palabras propias reúne; con empate o sin coincidencia se descarta (mejor no mostrar que mostrar mal); (2) palabras clave más estrictas y sin tildes (agua, vivienda, vialidad…); alimentos ya no se activa por «producción»; (3) la frase debe indicar una carencia (falta, déficit, deterioro…); (4) filtro de lugar: la frase vale si nombra al municipio elegido (o su primera parte, p. ej. «Ciénaga»); si nombra a OTRO municipio se descarta; si no nombra ninguno, solo vale si el artículo trata del municipio elegido; (5) las entradas de la Base de Conocimiento se revalidan al leerlas (se reclasifican o se descartan); (6) limpieza única de búsquedas ya guardadas en el equipo; (7) se añadió una consulta específica de alimentos.
- Efecto esperado: salen MENOS necesidades, pero correctas. Si la web no ofrece evidencia clara del municipio, la pestaña lo dice en lugar de rellenar con otros temas.
- Arneses: nuevo `fc-necesidades-sector-smoke.js` (9/9); se actualizaron los datos simulados de `fc-necesidades-web-smoke.js` y `fc-conocimiento-datos-smoke.js` para que nombren al municipio, como hace una búsqueda real. Los 11 arneses pasan.
