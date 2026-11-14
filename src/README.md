# FactiCuba-Datos 2026

Plataforma web para llenar online las 3 plantillas oficiales del estudio de
factibilidad de Proyectos de Desarrollo Local (PDL) en Cuba.

- **Pestaña 1 · Proyecto** — 10 bloques, 76 campos (fiel a `FactiCuba-proyecto.pdf`)
- **Pestaña 2 · Plan EDM** — 8 bloques, 28 campos (`FactiCuba-plan.pdf`)
- **Pestaña 3 · Datos ONEI** — 7 bloques, 34 campos (`FactiCuba-onei.pdf`)
- **Pestaña 4 · Revisión e informe** — % por plantilla, lista de datos
  faltantes con salto directo al campo y vista previa del informe completo.

## Características

- Pantalla de login solo-admin (contraseña en `localStorage`; alta única con el
  botón de configuración si el equipo aún no tiene cuenta).
- Autoguardado por usuario (`facticuba_data_<usuario>`), barras de progreso.
- Exportar / importar JSON, descargar informe `.html` autocontenido,
  imprimir / guardar PDF.
- Fondo: `src/images/fondo-cuba.jpg` (La Habana). Estilo 2026: glassmorphism,
  degradados neón, responsive (móvil 390px verificado).

## Estructura

- `index.html` — toda la app (CSS + plantillas + lógica). Las plantillas se
  definen en el objeto JS `TEMPLATES`; cada campo es
  `[clave, etiqueta, tipo, ayuda]` con tipos `t` (texto), `ta` (área) y
  `s:A|B` (selector).
- `main.pjs` — solo `$meta` (título/descripción).
- `src/images/fondo-cuba.jpg` — imagen de fondo.

## Notas

- Sin backend: los datos nunca salen del navegador del usuario.
- Base legal citada en la app: Decreto 174/2026, Decreto 327/2014,
  Res. Conjunta 1/2022 MEP-MINCEX, Res. 148/2023 MFP.
