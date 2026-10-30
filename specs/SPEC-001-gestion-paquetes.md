# SPEC-001 — Gestión de Paquetes de 10 Clases y Control de Asistencias

- **Autor:** Equipo de desarrollo
- **Fecha:** 30 de octubre de 2026
- **Estado:** Validada y Aprobada
- **Feature foco:** Registro de alumnas, asignación de paquetes de 10 clases, cómputo de saldo, deducción de asistencias, historial de movimientos y ajustes administrativos.

---

## 1. Problema

En el estudio de Andrea se ofrecen clases de yoga con cupos reducidos. La modalidad principal de cobro y asistencia es mediante paquetes de 10 clases. Actualmente, el control se lleva de forma manual con tarjetas personales de cartulina que se sellan al ingresar a la sala.

Esta metodología analógica genera varios dolores de cabeza diarios:
- Las alumnas con frecuencia olvidan o extravían la tarjeta física.
- Se generan discusiones involuntarias sobre la cantidad de clases ya tomadas o restantes.
- Andrea y las dos instructoras (Carla y Sofía) no cuentan con una fuente única ni con un historial confiable de asistencias.
- No hay forma rápida de saber si una alumna que asiste tiene saldo a favor o ya consumió la totalidad de su paquete.

Digitalizar este flujo resuelve la principal fricción operativa del estudio, asegurando transparencia tanto para Andrea y su equipo como para las alumnas.

---

## 2. Objetivo

Desarrollar un módulo sencillo, confiable y usable desde el celular que le permita a Andrea:
1. Registrar y consultar alumnas.
2. Asignar paquetes estándar de 10 clases.
3. Registrar la asistencia a una clase determinada, descontando automáticamente una clase.
4. Consultar en cualquier momento las clases disponibles y utilizadas junto con el historial completo de movimientos.
5. Realizar ajustes administrativos justificados en caso de errores humanos, garantizando la consistencia del saldo.

---

## 3. Diseño de la solución

### 3.1. Funcionalidades incluidas

1. **Registro de alumnas:** Alta con nombre, correo electrónico, teléfono y notas opcionales (por ejemplo, condiciones físicas a tener en cuenta).
2. **Asignación de paquete de 10 clases:** Asocia un nuevo paquete activo a la alumna con un cupo inicial de 10 clases.
3. **Consulta de saldo en tiempo real:** Visualización clara de clases totales (10), clases utilizadas y clases disponibles (totales - utilizadas).
4. **Registro de asistencia:** Identifica a la alumna y a la sesión de clase, valida que existan clases disponibles y que no haya asistencia previa para dicha sesión, descuenta 1 clase y genera el movimiento de auditoría.
5. **Historial de movimientos (Audit Trail):** Registro inmutable de cada evento que altere el paquete (alta, asistencia o ajuste).
6. **Prevención de asistencias duplicadas:** Control estricto de unicidad mediante la combinación `(alumnaId, sesionId)`.
7. **Control de saldo disponible:** Bloqueo preventivo de asistencias cuando el saldo sea igual a 0.
8. **Ajustes administrativos:** Funcionalidad exclusiva para Andrea que permite sumar o restar clases ante un error operativo, exigiendo obligatoriamente un motivo justificado y validando los límites permitidos.

### 3.2. Modelo de datos

#### Paquete (`Package`)
- `id`: Identificador único (string).
- `studentId`: Identificador de la alumna asociada (string).
- `total`: Cantidad total de clases (fijo en 10 para este alcance).
- `used`: Cantidad de clases utilizadas (entero $\ge 0$).
- `available`: Clases disponibles calculadas (`total - used`, rango 0 a 10).
- `assignedAt`: Fecha y hora de asignación (formato ISO 8601).
- `status`: Estado del paquete (`'active'` mientras `available > 0`, `'exhausted'` cuando `available === 0`).

#### Movimiento (`Movement`)
- `id`: Identificador único del movimiento.
- `packageId`: Paquete asociado.
- `studentId`: Alumna asociada.
- `type`: Tipo de movimiento:
  - `'pack_assignment'`: Asignación inicial (+10 clases de cupo).
  - `'attendance'`: Asistencia a una clase (-1 clase disponible / +1 usada).
  - `'adjustment'`: Corrección manual realizada por Andrea (+N o -N clases disponibles).
- `delta`: Variación de clases disponibles (+10, -1, +N, -N).
- `sessionId`: Identificador único de la sesión o clase (obligatorio para `type: 'attendance'`).
- `reason`: Motivo o referencia humana (nombre de clase/fecha para asistencia; explicación obligatoria para ajustes).
- `performedBy`: Usuario responsable (`'Andrea'`, `'Carla'` o `'Sofía'`).
- `timestamp`: Fecha y hora exacta del registro (ISO 8601).

#### Sesión de referencia (`Session`)
Para este alcance acotado, no se construye un gestor de calendario completo. Se definen sesiones con identificadores únicos legibles (ej: `SES-20261030-1830-VINYASA`) para asociar fehacientemente cada asistencia.

---

## 4. Criterios de aceptación (Gherkin)

### CA-01 — Asignación de paquete
- **Dado** que Andrea tiene una alumna registrada en el sistema,
- **Cuando** Andrea le asigna un paquete nuevo de 10 clases,
- **Entonces** el sistema debe registrar el paquete como activo, reflejar exactamente 10 clases disponibles y 0 utilizadas, y generar en el historial el movimiento de tipo asignación con saldo inicial.

### CA-02 — Registro de asistencia
- **Dado** un paquete activo con saldo disponible ($\ge 1$),
- **Cuando** la instructora o Andrea registra una asistencia válida para una sesión determinada,
- **Entonces** el sistema debe descontar una clase disponible (incrementar en 1 las utilizadas) y guardar el movimiento correspondiente en el historial con fecha, sesión, delta (-1) y responsable.

### CA-03 — Prevención de duplicados
- **Dada** una asistencia ya registrada para una alumna en una sesión determinada,
- **Cuando** se intenta registrar nuevamente esa misma asistencia para la misma alumna y sesión,
- **Entonces** el sistema debe rechazar la operación con un error explicativo y mantener el saldo y el historial sin cambios.

### CA-04 — Control de saldo
- **Dado** un paquete sin clases disponibles (saldo = 0, estado agotado),
- **Cuando** se intenta registrar otra asistencia,
- **Entonces** el sistema debe impedir la operación, rechazar el descuento y mostrar un mensaje claro indicando que la alumna no tiene clases disponibles.

### CA-05 — Historial y ajustes
- **Dado** un paquete con movimientos registrados,
- **Cuando** Andrea consulta la ficha de la alumna,
- **Entonces** debe poder ver el historial completo y ordenado cronológicamente, y tener la posibilidad de registrar un ajuste manual indicando obligatoriamente el motivo, impidiendo que el saldo resultante sea menor a 0 o mayor a 10 clases disponibles.

---

## 5. Fuera de alcance

Quedan formalmente excluidas de esta versión:
- Reservas online autogestionadas por las alumnas.
- Calendario interactivo semanal o mensual.
- Listas de espera automáticas para clases llenas.
- Notificaciones automáticas por WhatsApp, push o email.
- Pasarela de pagos online (Mercado Pago, tarjetas de crédito, etc.).
- Reportes financieros o estadísticas avanzadas.
- Contenidos grabados, biblioteca de posturas o tienda de productos.

---

## 6. Validación de la especificación

Antes de avanzar con la programación, se revisaron los 5 criterios de aceptación para detectar posibles vacíos o ambigüedades técnicas:

1. **Clarificación sobre el cálculo de saldo y estado del paquete (CA-01 y CA-04):**
   - *Duda inicial:* ¿Qué ocurre cuando un paquete llega a 0 clases disponibles?
   - *Resolución:* El paquete pasa automáticamente a estado `exhausted` (agotado). Si la alumna adquiere un nuevo paquete posteriormente, se asocia un nuevo paquete activo independiente, preservando el histórico del anterior.
2. **Definición precisa de la clave de duplicado en asistencia (CA-03):**
   - *Duda inicial:* ¿Cómo se distingue si dos asistencias son iguales sin tener un calendario completo?
   - *Resolución:* Toda asistencia exige un `sessionId` canónico (por ejemplo `clase_id` o fecha+horario). La regla de negocio valida `asistencias.some(a => a.studentId === studentId && a.sessionId === sessionId)`.
3. **Reglas de contorno para ajustes administrativos (CA-05):**
   - *Duda inicial:* ¿Un ajuste puede ser positivo o negativo? ¿Qué pasa si Andrea no pone motivo?
   - *Resolución:* Un ajuste puede ser positivo (devolver una clase mal descontada) o negativo (descontar una clase omitida). Se establecen dos validaciones estrictas: el motivo debe tener al menos 3 caracteres, y el saldo final disponible debe quedar estrictamente en el intervalo $[0, 10]$.
4. **Verificabilidad:** Los 5 criterios son 100% deterministas y comprobables mediante pruebas unitarias y de integración automatizadas.
