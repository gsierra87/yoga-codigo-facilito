# Guía de Desarrollo y Contexto — Estudio de Yoga

Este documento define el contexto general, las reglas de negocio, los criterios de diseño y las pautas de trabajo para el desarrollo del sistema de gestión del estudio de yoga de Andrea.

---

## 1. Descripción del proyecto

Andrea es dueña de un estudio de yoga de barrio y trabaja junto a dos instructoras (Carla y Sofía). Ofrecen clases con cupos limitados y venden paquetes de 10 clases para que las alumnas asistan con flexibilidad.

### El problema actual
Hoy el control se lleva mediante fichas y tarjetas de papel que se sellan a mano en cada clase:
- Las alumnas pierden o se olvidan las tarjetas.
- Se generan discusiones sobre cuántas clases quedan o cuántas se usaron.
- No existe un registro histórico confiable de asistencias.
- Las clases de la tarde tienen un cupo de 12 personas y se llenan rápido, sin registro claro de quién fue.
- Cuando una instructora falta o surge un imprevisto, la comunicación es desordenada.

### Objetivo
Construir una herramienta web sencilla, clara y accesible desde el celular que reemplace las tarjetas de papel por un registro digital transparente, confiable y fácil de usar en el día a día.

---

## 2. Usuarios del sistema

- **Administradora (Andrea):** Propietaria del estudio. Registra alumnas, asigna paquetes nuevos de 10 clases, consulta el estado de cuentas, supervisa el historial y realiza ajustes administrativos cuando ocurre algún error operativo.
- **Instructoras (Carla y Sofía):** Toman asistencia al inicio de cada clase, descontando la clase correspondiente del paquete de la alumna.
- **Alumnas:** Consultan en todo momento cuántas clases tienen disponibles, cuántas usaron y el detalle de sus asistencias.

---

## 3. Alcance actual (Feature foco)

Para esta etapa nos enfocamos exclusivamente en el corazón del problema:

> **Gestión digital de paquetes de 10 clases y control de asistencias.**

### Fuera de alcance en esta etapa
No se implementarán en esta iteración:
- Sistema de reservas online o autogestión de turnos.
- Calendario interactivo completo o sincronización externa.
- Listas de espera automáticas.
- Notificaciones por WhatsApp o email automáticas.
- Pasarelas de cobro online.
- Reportes estadísticos avanzados.
- Videos, rutinas o tienda online.

---

## 4. Reglas generales de negocio

1. **Paquetes fijos:** Los paquetes estándar son de 10 clases. Al crearse, inician con 10 clases disponibles y 0 utilizadas.
2. **Saldo no negativo:** Ninguna operación (asistencia o ajuste) puede dejar el saldo de clases disponibles por debajo de 0.
3. **Límite superior:** Ningún ajuste puede hacer que las clases disponibles superen el total del paquete (10 clases).
4. **Descuento por asistencia:** Cada asistencia confirmada descuenta exactamente 1 clase disponible e incrementa 1 clase utilizada.
5. **Prevención de asistencias duplicadas:** No se permite asentar dos veces la asistencia de una misma alumna para la misma sesión o clase. Cada asistencia debe asociarse a una referencia de sesión única.
6. **Sin saldo no hay clase:** Si una alumna no tiene clases disponibles en su paquete activo, el sistema debe rechazar el registro de asistencia con un mensaje explicativo claro.
7. **Ajustes justificados con auditoría:** Andrea puede corregir el saldo ante una equivocación (por ejemplo, un doble descuento manual previo o una clase que no correspondía cobrar). Todo ajuste exige un motivo obligatorio y queda registrado en el historial sin borrar los movimientos previos.
8. **Historial inmutable:** Cada movimiento guarda fecha y hora, tipo de movimiento, cantidad de clases afectadas (delta), motivo/referencia y usuario responsable.

---

## 5. Pautas de diseño y experiencia de usuario

- **Mobile First:** La aplicación se utilizará principalmente en la recepción o en la entrada de la sala desde teléfonos móviles y tablets. Las acciones críticas deben poder hacerse con una sola mano.
- **Identidad visual (Skill `yoga-marca`):**
  - Paleta cálida y serena: Blanco cálido (`#FAF8F3`), Verde salvia (`#718B78`), Verde oscuro (`#314A3A`), Beige (`#EEE5D8`) y Terracota (`#C77D65`).
  - Tarjetas con esquinas redondeadas (`rounded-3xl` o `rounded-2xl`).
  - Tipografía sans-serif legible y espaciado generoso para transmitir tranquilidad y orden.
  - Protagonismo absoluto al saldo de clases disponibles (en formato de tarjeta digital o indicador claro tipo 10 casilleros).
- **Mensajes directos:** Respuestas de confirmación y mensajes de error humanos, claros y sin tecnicismos en español rioplatense cotidiano.
- **Sin pantallas sobrecargadas:** Mostrar solo la información necesaria para la tarea en curso.

---

## 6. Criterios de calidad y arquitectura

- **Separación de capas:** La lógica de negocio y las validaciones deben residir en módulos puros de TypeScript (`lib/`), independientes de los componentes visuales de React.
- **Manejo de errores predecible:** Las funciones de negocio deben devolver resultados estructurados con estado de éxito (`ok: true`) o mensaje descriptivo de error (`ok: false, error: string`).
- **Simplicidad ante todo:** No agregar abstracciones prematuras ni librerías pesadas que no se justifiquen para el alcance actual.
- **Prototipo con persistencia local:** Para este ejercicio se utiliza estado en memoria y almacenamiento local del navegador (`localStorage`), dejando clara la separación con respecto a una base de datos de producción.

---

## 7. Instrucciones para trabajar con Spec Driven Development (SDD)

1. **La especificación es la fuente de verdad:** Toda funcionalidad responde a lo definido en `specs/SPEC-001-gestion-paquetes.md`.
2. **Revisión antes de programar:** Antes de escribir una sola línea de código, validar que los criterios de aceptación sean precisos, no ambiguos y verificables.
3. **Pruebas automatizadas como contrato:** Cada criterio de aceptación (CA-01 a CA-05) debe contar con una prueba automatizada correspondiente que verifique tanto el camino feliz como las restricciones de borde y error.
4. **Sin trampas en los tests:** Jamás debilitar un criterio de aceptación para forzar que una prueba pase. Si surge una discrepancia real, se corrige primero la especificación fundamentando el cambio, y luego se actualiza el código.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
