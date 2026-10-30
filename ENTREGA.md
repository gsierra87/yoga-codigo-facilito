# Informe de Entrega — Ejercicio de Spec Driven Development (SDD)

Este documento resume cómo encaré y resolví el ejercicio de desarrollo guiado por especificaciones para el estudio de yoga de Andrea. Está organizado según los cuatro ejes de la actividad.

---

## 1. Contexto persistente (`AGENTS.md`)

Para arrancar el trabajo creé el archivo `AGENTS.md` en la raíz del repositorio. La idea fundamental de este archivo es que funcione como la "memoria fija" y la guía de referencia tanto para mí como para cualquier agente o desarrollador que toque el proyecto.

En vez de llenarlo de párrafos teóricos, lo armé como un manual operativo directo:
- **El escenario real:** Andrea gestiona su estudio con dos instructoras (Carla y Sofía). Usaban tarjetas de cartulina para los paquetes de 10 clases, lo que traía pérdidas de tarjetas, dudas sobre cuántas clases se habían tomado y falta de un registro confiable.
- **Los roles:** Administradora (Andrea, control y ajustes), Instructoras (toma de asistencia rápida en sala) y Alumnas (transparencia total de su saldo).
- **El límite del alcance:** Dejé en claro desde el minuto cero que en esta etapa sólo resolvemos la gestión de paquetes de 10 clases y asistencias. Módulos como pagos online, reservas complejas o videos quedaron explícitamente fuera.
- **Reglas no negociables:** Saldo no negativo (entre 0 y 10), no permitir asistencias duplicadas para una misma sesión, historial inmutable para auditar movimientos y obligatoriedad de justificar cualquier ajuste manual con un motivo.

Tener este contexto escrito evitó que me desviara agregando pantallas o funciones innecesarias.

---

## 2. Especificación funcional (`specs/SPEC-001-gestion-paquetes.md`)

Elegí enfocarme en la **gestión digital de paquetes de 10 clases y el control de asistencias** porque ataca la herida principal del estudio: eliminar el papel y darle certeza al saldo de cada alumna.

En la especificación detallé el modelo de datos (`Package`, `Movement`, `AttendanceRecord`), el cálculo de saldo y los cinco Criterios de Aceptación (CA):
- **CA-01 (Asignación de paquete):** Al asignar un paquete nuevo a una alumna registrada, arranca con 10 clases disponibles y 0 consumidas.
- **CA-02 (Registro de asistencia):** Con saldo disponible, la asistencia descuenta 1 clase y asienta el movimiento en el historial.
- **CA-03 (Prevención de duplicados):** Si se intenta registrar dos veces la asistencia de una alumna en la misma sesión, se rechaza la operación sin tocar el saldo.
- **CA-04 (Control de saldo):** Si el paquete está agotado (0 disponibles), se bloquea el registro con un mensaje explicativo y el paquete pasa a estado `exhausted`.
- **CA-05 (Historial y ajustes):** Andrea puede consultar el historial y corregir un saldo erróneo, pero siempre indicando un motivo válido y asegurando que el saldo resultante quede en el rango de 0 a 10 clases.

### Revisión previa a programar
Antes de escribir código revisé la spec y afiné tres puntos clave:
1. Definí la clave de unicidad para la asistencia combinando `(studentId, sessionId)`.
2. Aclaré que los ajustes pueden ser positivos o negativos (sumar o restar clases), exigiendo un motivo de al menos 3 caracteres y bloqueando valores fuera de $[0, 10]$.
3. Establecí el cambio de estado automático a `exhausted` al consumir la décima clase.

---

## 3. Skill de diseño e identidad visual (`yoga-marca`)

Creé la skill reutilizable en `.agent/skills/yoga-marca/SKILL.md` (y su réplica en `.agents/` para garantizar descubrimiento en cualquier variante de entorno).

Su función principal es evitar que la interfaz parezca una planilla de cálculo fría o un software administrativo genérico. Establecí lineamientos basados en la calma, la calidez y el yoga:
- **Paleta oficial:** Blanco cálido (`#FAF8F3`), Verde salvia (`#718B78`), Verde oscuro (`#314A3A`), Beige (`#EEE5D8`) y Terracota (`#C77D65`).
- **Diseño Mobile First:** Pensado para usarse desde un celular en la entrada de la sala, con botones grandes al alcance del pulgar.
- **La Tarjeta Digital como protagonista:** Reemplazamos la cartulina física por un componente visual con los 10 casilleros del paquete, donde cada clase usada se marca con un sello orgánico y el saldo disponible se ve de un vistazo.
- **Feedback humano:** Mensajes de éxito y error en un tono sereno pero claro, sin mensajes crípticos del sistema.

---

## 4. Implementación y validación

### Arquitectura de la solución
Decidí separar estrictamente las reglas de negocio de la interfaz:
1. **Capa de Dominio puro (`lib/package-management.ts`):** Funciones de TypeScript sin dependencias de React ni del navegador (`assignPackage`, `recordAttendance`, `applyAdjustment`, `registerStudent`). Esto permitió probar toda la lógica de negocio de manera limpia e instantánea.
2. **Interfaz de usuario (`app/admin/paquetes/page.tsx`):** Pantalla reactiva con la paleta de `yoga-marca`, selector de instructora/responsable, tarjeta digital con los 10 casilleros interactivos, registro de asistencias por sesión, modal de ajustes administrativos y vista del historial de movimientos.
3. **Persistencia local y datos de demostración (`createDemoState`):** Implementé los perfiles requeridos para que la aplicación arranque lista para probar:
   - Andrea (Admin), Carla y Sofía (Instructoras).
   - Valentina López: paquete nuevo (10 disponibles, 0 usadas).
   - Martina Gómez: paquete con uso parcial (4 disponibles, 6 usadas).
   - Camila Díaz: paquete agotado (0 disponibles, 10 usadas).
   - Lucía Fernández y Julieta Romero para pruebas adicionales.
   - Historial de movimientos reales precargados.

### Resultados reales de las pruebas automáticas
Configuré **Vitest** en el proyecto y escribí una suite completa (`tests/package-management.test.ts`) cubriendo los 5 criterios de aceptación y los escenarios de error:

```bash
$ vitest run

 ✓ tests/package-management.test.ts (12 tests) 28ms

 Test Files  1 passed (1)
      Tests  12 passed (12)
   Duration  391ms
```

Detalle de los 12 casos probados y aprobados:
- **CA-01:** Asignación inicial con 10 clases disponibles y 0 consumidas (PASÓ).
- **CA-01 (Error):** Rechazo de asignación a alumna inexistente (PASÓ).
- **CA-02:** Descuento de 1 clase y generación de movimiento y asistencia (PASÓ).
- **CA-03:** Rechazo de asistencia duplicada para la misma sesión y preservación de saldo (PASÓ).
- **CA-04:** Bloqueo de asistencia cuando no hay saldo disponible (paquete agotado) (PASÓ).
- **CA-04:** Transición automática a estado `exhausted` al consumir la última clase (PASÓ).
- **CA-05:** Consulta de historial completo y aplicación de ajuste positivo válido (PASÓ).
- **CA-05 (Error):** Bloqueo de ajuste que intenta dejar saldo menor a 0 (PASÓ).
- **CA-05 (Error):** Bloqueo de ajuste que intenta dejar saldo mayor a 10 (PASÓ).
- **CA-05 (Error):** Rechazo de ajuste si no se proporciona un motivo justificado (PASÓ).
- **Alta de alumna:** Registro exitoso con datos básicos (PASÓ).
- **Alta de alumna (Error):** Rechazo de registro sin nombre (PASÓ).

Además, ejecuté `pnpm build` para verificar la compilación estática de Next.js, la cual finalizó sin errores generando la ruta `/admin/paquetes`.

---

## Conclusión personal sobre Spec Driven Development

Trabajar con SDD en este ejercicio me demostró el valor de desacelerar al principio para acelerar después:
- Escribir primero `AGENTS.md` y `SPEC-001` me obligó a pensar en los casos bordes antes de tirar una sola línea de código (por ejemplo, ¿qué pasa si Andrea quiere ajustar una clase pero no pone motivo?, o ¿cómo evito que se marque dos veces la misma clase?).
- Al tener los 5 criterios de aceptación bien cerrados, escribir los tests fue directo: cada criterio se convirtió en una prueba concreta con datos de entrada y salida esperados.
- Desacoplar la lógica de dominio de los componentes visuales de React hizo que implementar la pantalla fuera simplemente conectar botones a funciones que ya estaban 100% probadas y validadas.
- En resumen, SDD da mucha tranquilidad: cuando ves que los 12 tests pasan y la app compila limpia, sabés con certeza que la regla de negocio se cumple sin tener que "cruzar los dedos".
