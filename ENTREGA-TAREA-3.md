# Informe de Entrega — Tarea 3: Lanzamiento a Producción

Este documento detalla la resolución integral de la **Tarea 3 (Lanzamiento a Producción)** para el sistema de gestión del estudio de yoga de Andrea (*Prana Yoga Studio*), estructurado en sus tres pasos fundamentales.

---

## Paso 1: ICP (Ideal Customer Profile) y User Persona

Basado en la definición del problema abordada en la Tarea 1 (estudio de yoga de barrio con paquetes de 10 clases, tarjetas de cartulina extraviadas, discusiones de saldo y sobrecupos en las clases de 12 personas de la tarde), se definió el siguiente perfil estratégico:

### 1. Perfil de Cliente Ideal (ICP)

- **Vertical:** Estudios boutique y de barrio de bienestar y movimiento (Yoga, Pilates reformer/mat, Barre, Danza consciente).
- **Tamaño de infraestructura:** 1 o 2 salas con cupo físico reducido (12 mats en la sala de Andrea).
- **Equipo operativo:** 2 a 5 personas (1 dueña/directora fundadora que da clases y gestiona el negocio + 2 a 4 instructoras colaboradoras part-time).
- **Volumen de alumnas:** Entre 70 y 160 alumnas activas por mes.
- **Modelo de cobro:** Paquetes flexibles de 10 clases (con pago en efectivo o transferencia bancaria).
- **Ubicación:** Zonas residenciales de nivel socioeconómico medio y medio-alto.
- **Herramientas previas:** Cartulinas físicas selladas a mano, cuadernos de espiral, planillas de cálculo y WhatsApp Business.
- **Por qué rechazan sistemas tradicionales (Mindbody, Gympass):** Son excesivamente caros en dólares, exigen hardware innecesario (molinetes, lectores de tarjeta) y tienen interfaces frías y corporativas que chocan con la atmósfera de calma y conexión del yoga.
- **Propuesta de valor:** *"Un sistema digital sereno, transparente y móvil que elimina el papel, garantiza que nunca se superen los 12 mats de la sala y erradica las discusiones de saldo antes de cada clase."*

### 2. User Personas

| Arquetipo | Rol | Dolores Clave | Impacto en la Solución |
| :--- | :--- | :--- | :--- |
| **Andrea Molina (41 años)**<br>*Fundadora y Directora* | Dueña del estudio, enseña por la mañana y administra todo. | Pérdida de tiempo en cuadre de fichas, cobros tardíos cuando la alumna ya no tiene saldo, discusiones por clases perdidas. | **Panel de control con auditoría inmutable:** Asignación de packs en 1 click, alertas de renovación anticipada y ajustes de saldo justificados. |
| **Valentina López (32 años)**<br>*Alumna Regular (End-User)* | Product Designer remota, asiste 2-3 veces por semana para desconectar. | Se olvida la cartulina en otra cartera, no sabe si le quedan 2 o 3 clases, vergüenza de preguntar en recepción. | **Pase Digital Zen:** Vista clara de sus 10 casilleros botánicos, saldo restante y botón de WhatsApp para renovar con un toque. |
| **Carla Rossi (28 años)**<br>*Instructora en Sala* | Dicta Vinyasa Flow en los turnos pico de la tarde (18:30 y 20:00). | Sellos de tinta gastados, demoras de 5 minutos en la puerta, sobrecupos de 13 o 14 personas en una sala de 12. | **Monitor de Sala en Vivo (12 Mats):** Check-in en 1 toque desde el celular con bloqueo estricto cuando se llega al mat 12. |

*(El detalle exhaustivo y biográfico de cada perfil se encuentra documentado en `specs/ICP-USER-PERSONA.md`).*

---

## Paso 2: Funciona e Importa — Nueva SPEC (SPEC-002)

Para este paso se diseñó, especificó y programó la nueva funcionalidad:

> **`specs/SPEC-002-sala-en-vivo-y-alertas.md`**  
> *Monitor de Sala en Vivo (Cupo de 12 Mats), Check-in Rápido y Alertas Preventivas de Saldo ("Semáforo Zen").*

### 1. Criterios de Aceptación (Gherkin)

- **CA-01 (Control estricto de cupo de 12 mats):** La sesión bloquea terminantemente el ingreso si la sala ya cuenta con 12 alumnas registradas. El 13º intento es rechazado con el mensaje *"Cupo completo: la sala alcanzó el límite estricto de 12 personas"*.
- **CA-02 (Check-in rápido en 1 click con asignación de mat):** Al registrar una alumna con saldo disponible, descuenta automáticamente 1 clase de su paquete, genera el movimiento de auditoría y le asigna el primer mat físico libre (1 al 12).
- **CA-03 (Alerta preventiva — Semáforo Zen):** Si al hacer check-in a la alumna le quedan 1 o 2 clases, el sistema marca el mat con alerta ámbar y habilita un botón directo de WhatsApp con mensaje personalizado para invitarla a renovar antes de que se quede sin saldo.
- **CA-04 (Bloqueo de paquetes agotados y acceso directo a nuevo pack):** Si una alumna tiene 0 clases, el check-in se bloquea y se ofrece la acción inmediata de "Asignar nuevo paquete de 10 clases" sin salir de la vista.
- **CA-05 (Liberación de mat y reintegro por cancelación):** Si una alumna debe retirarse de urgencia antes de la clase, la instructora puede liberar el mat, reintegrando 1 clase al paquete de la alumna y auditando la causa.

### 2. Métricas de Éxito Definidas

1. **Tasa de Sobrecupo Cero (M1):** $100\%$ de las sesiones respetan la capacidad máxima de 12 mats (0 sobrecupos en turnos concurridos).
2. **Velocidad de Check-in en Sala (M2):** Registro completo de los 12 mats en $< 25$ segundos totales ($< 2.5$ seg/alumna), frente a los $3-4$ minutos del sellado analógico.
3. **Tasa de Renovación Anticipada (M3):** $\ge 45\%$ de las alumnas con alerta ámbar renuevan antes de agotar su saldo, eliminando cobros apurados en la puerta.
4. **Satisfacción de Alumnas y Profesoras (M4):** CSAT $\ge 92\%$ en encuestas de transparencia del pase digital.

### 3. Validación Automatizada (19 Tests Aprobados)

Se implementó el módulo puro `lib/live-room.ts` y la suite `tests/spec-002.test.ts`, complementando los tests de `SPEC-001`:

```bash
$ vitest run

 ✓ tests/spec-002.test.ts (7 tests) 31ms
 ✓ tests/package-management.test.ts (12 tests) 77ms

 Test Files  2 passed (2)
      Tests  19 passed (19)
```

---

## Paso 3: Lanzamiento a Producción y Diferenciación de Producto

### 1. Plataforma Elegida: Vercel

Se eligió **Vercel** como entorno de lanzamiento a producción por ser la infraestructura oficial, nativa y optimizada para proyectos Next.js App Router, ofreciendo:
- Despliegue continuo (CI/CD) conectado a la rama `main` de GitHub.
- Edge Network global con tiempos de respuesta ultra rápidos para dispositivos móviles.
- Certificado SSL automático (HTTPS seguro).
- Soporte nativo para Server Components y rutas estáticas optimizadas.

### 2. Pasos para la Activación en Línea

El repositorio se encuentra versionado en GitHub:
👉 **`https://github.com/gsierra87/yoga-codigo-facilito`**

Para dejar la URL en línea 100% activa en Vercel:
1. Ingresar a [vercel.com/new](https://vercel.com/new) con tu cuenta de GitHub.
2. Seleccionar el repositorio **`yoga-codigo-facilito`**.
3. Vercel detectará el framework **Next.js** y el package manager **pnpm**.
4. Clic en **Deploy**.
5. En menos de 60 segundos la aplicación estará disponible en una URL pública (ejemplo: `https://yoga-codigo-facilito.vercel.app`).

### 3. Diferenciación Visual del Producto (Skill `yoga-marca`)

A diferencia del prototipo inicial, la aplicación cuenta con un rediseño integral enfocado en la serenidad y la identidad visual de un estudio de yoga:
- **Monitor de Sala en Vivo (12 Mats):** Representación visual de los 12 mats del salón con identificación de estados (Libre / Ocupado / Alerta de saldo).
- **Semáforo Zen:** Códigos cromáticos no invasivos (Verde Salvia `#718B78` para saldo óptimo, Ámbar cálido para alertas de renovación, Terracota `#C77D65` para paquetes agotados).
- **Pase Digital Zen de Alumna:** Tarjeta interactiva con 10 casilleros botánicos que sustituye la cartulina física, con botón de WhatsApp directo para solicitar renovaciones a Andrea.
- **Tipografía y Estilo:** Títulos con serif cálido y espaciado generoso que transmite calma y profesionalismo.
