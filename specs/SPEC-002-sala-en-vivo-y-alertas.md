# SPEC-002 — Monitor de Sala en Vivo (Cupo 12 Mats), Check-in Rápido y Alertas Preventivas de Saldo

- **Autor:** Equipo de Producto y Desarrollo
- **Fecha:** 2 de noviembre de 2026
- **Estado:** Lista para Implementación y Validación
- **Dependencia:** Construye sobre `specs/SPEC-001-gestion-paquetes.md`
- **Feature foco:** Gestión visual en tiempo real de la sala (límite de 12 mats), registro de asistencia en un toque (Quick Check-in), prevención estricta de sobrecupo y sistema de alertas de renovación ("Semáforo Zen").

---

## 1. Problema de Negocio

En la Tarea 1 y SPEC-001 se resolvió el núcleo de la asignación de paquetes de 10 clases y el descuento unitario por asistencia. Sin embargo, en el día a día operativo persisten dos fricciones críticas identificadas en el perfil de nuestras usuarias (Andrea, Carla y Valentina):

1. **Sobrecupo y desorden en el turno pico:** Las clases de la tarde (18:30 y 20:00) tienen una capacidad física máxima de **12 mats**. Cuando las alumnas llegan en grupo, Carla debe verificar una por una manualmente, lo que ocasiona que a veces ingresen 13 o 14 personas, quitándole espacio vital a la práctica y generando incomodidad.
2. **Sorpresa de saldo agotado en recepción:** Las alumnas se enteran de que consumieron su décima clase justo cuando van a ingresar a la sala. Esto fuerza a Andrea o Carla a gestionar un cobro de urgencia en la puerta, interrumpiendo el inicio puntual de la sesión.
3. **Lentitud en la entrada:** El proceso de búsqueda tradicional de alumnas en listas largas demora la recepción cuando ingresan varias personas al mismo tiempo.

---

## 2. Objetivo de la Feature

Diseñar e implementar un **Monitor de Sala en Vivo** pensado para usarse desde el smartphone en recepción o al frente del salón, que permita:
1. Visualizar gráficamente los **12 mats del salón** en tiempo real (mats libres vs. mats ocupados con nombre y saldo de la alumna).
2. Realizar el **Check-in Rápido en 1 toque** descontando la clase del paquete y asignando automáticamente el mat disponible.
3. **Bloquear en forma estricta el ingreso** si la sala alcanza los 12 mats (capacidad al 100%).
4. Emitir **Alertas Preventivas de Saldo ("Semáforo Zen")**:
   - 🟢 **Verde (Saldo óptimo):** $\ge 3$ clases disponibles.
   - 🟡 **Ámbar (Alerta de renovación):** $1$ o $2$ clases disponibles restantes. Dispara recomendación visual de renovación preventiva y enlace directo a WhatsApp.
   - 🔴 **Rojo (Agotado):** $0$ clases disponibles. Impide el check-in y ofrece botón de renovación inmediata con 1 click.
5. Permitir la **liberación de mat / cancelación de check-in** si una alumna tiene un imprevisto antes de comenzar, reintegrando la clase y liberando el cupo de forma transparente.

---

## 3. Modelo de Datos y Contratos de Dominio

### 3.1. Entidad Sesión en Vivo (`LiveSession`)
```typescript
interface LiveSession {
  id: string
  name: string
  instructor: 'Andrea' | 'Carla' | 'Sofía'
  startTime: string
  capacity: 12 // Capacidad fija de mats físicos en el estudio
  occupiedMats: LiveMatOccupancy[]
}

interface LiveMatOccupancy {
  matNumber: number // 1 a 12
  studentId: string
  studentName: string
  packageId: string
  remainingClassesAfterCheckIn: number
  statusTier: 'optimal' | 'warning_low' | 'exhausted' // Semáforo Zen
  checkedInAt: string // ISO 8601
}
```

### 3.2. Reglas de Transición del "Semáforo Zen"
- Si `disponibles >= 3` $\rightarrow$ `statusTier: 'optimal'` (🟢)
- Si `disponibles === 1 || disponibles === 2` $\rightarrow$ `statusTier: 'warning_low'` (🟡 Alerta preventiva)
- Si `disponibles === 0` $\rightarrow$ `statusTier: 'exhausted'` (🔴 Paquete agotado)

---

## 4. Criterios de Aceptación (Gherkin / BDD)

### CA-01 — Control estricto de cupo de 12 mats en sala
- **Dado** que una clase en vivo tiene 12 mats ocupados (capacidad máxima alcanzada),
- **Cuando** la instructora o Andrea intenta registrar el check-in de una alumna adicional,
- **Entonces** el sistema debe rechazar la operación informando claramente: *"Cupo completo: la sala alcanzó el límite de 12 personas"*, sin descontar clases del paquete de la alumna ni alterar la grilla.

### CA-02 — Check-in rápido en 1 click con asignación automática de mat
- **Dado** que la sala tiene al menos un mat libre ($< 12$) y la alumna seleccionada posee un paquete activo con saldo disponible ($\ge 1$),
- **Cuando** se ejecuta la acción de "Check-in Rápido",
- **Entonces** el sistema debe:
  1. Asignar el primer mat libre disponible (entre 1 y 12).
  2. Descontar exactamente 1 clase del paquete disponible.
  3. Incrementar las clases utilizadas y generar el movimiento de auditoría en el historial.
  4. Reflejar inmediatamente a la alumna ocupando su mat en la pantalla.

### CA-03 — Alerta preventiva de renovación ("Semáforo Zen")
- **Dado** que una alumna realiza su check-in y su saldo resultante de clases disponibles queda en 1 o 2 clases,
- **Cuando** se confirma el ingreso en la grilla de la sala,
- **Entonces** el sistema debe marcar a la alumna con un indicador ámbar de advertencia (*"Quedan X clases — Sugerir renovación"*) y disponibilizar una acción de 1 toque para enviar recordatorio de renovación por WhatsApp.

### CA-04 — Bloqueo de check-in para paquetes agotados y acceso directo a nuevo paquete
- **Dado** una alumna cuyo paquete activo tiene 0 clases disponibles,
- **Cuando** se intenta realizar el check-in rápido en la sala,
- **Entonces** el sistema debe impedir el ingreso con el mensaje: *"Sin clases disponibles en el paquete"*, y presentar de inmediato la opción de *"Asignar nuevo paquete de 10 clases"* sin salir de la vista de sala.

### CA-05 — Liberación de mat y reintegro por cancelación en sala
- **Dada** una alumna que ya fue registrada en un mat de la sesión en curso,
- **Cuando** la instructora presiona "Liberar mat" por retiro temprano o error de selección,
- **Entonces** el sistema debe liberar el número de mat en la grilla, reintegrar (+1) la clase al paquete de la alumna, registrar el movimiento compensatorio en el historial y decrementar la ocupación de la sala.

---

## 5. Métricas de Éxito

Para validar el impacto real de esta característica en el estudio de Andrea, se establecen las siguientes cuatro métricas cuantitativas:

| Métrica | Definición | Meta / Target | Método de Medición |
| :--- | :--- | :--- | :--- |
| **M1: Tasa de Sobrecupo Cero** | Porcentaje de sesiones de la tarde que no exceden los 12 alumnos físicos en sala. | **100% de cumplimiento** (0 sobrecupos en turnos pico). | Auditoría de asistencias vs. capacidad de sesión (`occupiedMats.length <= 12`). |
| **M2: Tiempo de Check-in en Recepción** | Tiempo promedio empleado para registrar la asistencia completa de las 12 personas de una clase. | **$< 25$ segundos por clase completa** ($< 2.5$ seg/alumna). Reducción del $85\%$ respecto a los $3-4$ minutos de las cartulinas. | Muestreo de tiempo entre primer y último check-in de la sesión. |
| **M3: Tasa de Renovación Anticipada** | Porcentaje de alumnas en estado ámbar (1 o 2 clases restantes) que adquieren su nuevo pack antes de llegar a saldo 0. | **$\ge 45\%$ de renovaciones anticipadas**. | Ratio de paquetes asignados mientras `disponibles >= 1` sobre el total de renovaciones. |
| **M4: Satisfacción de Usuario (CSAT)** | Nivel de satisfacción de alumnas y profesoras con la visibilidad del pase y la ocupación de la sala. | **$\ge 92\%$ de valoración positiva** (NPS $\ge 65$). | Encuesta rápida de 1 pregunta al consultar el pase digital. |
