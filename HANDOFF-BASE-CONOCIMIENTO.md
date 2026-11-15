# HANDOFF — Base de Conocimiento compartida (FactiCuba · FactiCuba-Datos · EDM Ciénaga)

## Objetivo
Que las apps guarden TODO lo que generan y aprenden (referencias web y estudios) en una sola base, y que busquen PRIMERO en ella y solo después en la web.

## Estado (2026-11-14, PUBLICADO y verificado)
- Hoja «Base-Conocimiento» (cuenta de negocios): https://docs.google.com/spreadsheets/d/1lbng7y8RKAWN9IC1UThkRO7gUhQOpFhdYsZ9oh19IeE/edit — pestañas Portada, Referencias (id, fecha, app, provincia, municipio, tema, dato, fuente, url) y Estudios (id, fecha, app, usuario, provincia, municipio, proyecto_o_programa, resumen, total_cup, total_usd, dictamen_o_nota). SIN filas de prueba (borradas).
- Servidor Apps Script «Base de Conocimiento — Servidor» (proyecto 1CDaDTD12ghKbLNOPI_TIf3OZ-rv-XDE0sBSwXWdRD7XeFx8ObmIE8OaE): https://script.google.com/macros/s/AKfycbzDmBLwgQj0Mx-YKryieWePKs7jFO29FX5D1Mn3KLj9ICnkSUsJwztwtNzUHj6e_5PJ6g/exec — GET ping | refs&municipio | estudios&municipio; POST guardar_refs (deduplica por municipio+tema+dato) | guardar_estudio. Código: ~/workspace/base-conocimiento/ServidorConocimiento.gs. Ida y vuelta verificada por curl (el POST muestra la página 411 en la redirección pero SÍ escribe).
- FactiCuba-Datos (huella viva 10bfe17d): módulo fc-necesidades v6 — buscarWeb consulta primero la base (≥5 → presenta con sello «📚 Base de conocimiento» y botón «Buscar de nuevo en la web» para forzar); si hay pocas, completa con la web y guarda lo nuevo (guardar_refs); al generar el estudio oficial o el informe para el pueblo guarda el estudio (guardar_estudio). Arnés arneses/fc-conocimiento-datos-smoke.js en verde + regresión completa (10 arneses).
- FactiCuba (huella viva ac87431e): módulo modulos/fc-conocimiento.html — envuelve generarInforme (captura _refWeb ANTES de generar, porque la app lo reinicia) y guarda el estudio (dictamen, inversión, VAN/TIR/margen) + la referencia de ventas una sola vez por búsqueda (guardia localStorage fcKbRefGuardada). Arnés arneses/fc-smoke40.js 6/6.
- Página EDM Ciénaga: guarda el estado de la estrategia (app «EDM-Cienaga») y consulta refs/estudios del municipio.

## Pendiente (ladrillo siguiente)
- FactiCuba: lectura cache-first dentro de fcReferencia/fcPerfil (hoy guarda en la base pero su buscador aún no la consulta antes de ir a la web; requiere abrir esos módulos con cuidado).
