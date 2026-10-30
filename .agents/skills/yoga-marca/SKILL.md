---
name: yoga-marca
description: Pautas de diseño, identidad visual y experiencia de usuario para el estudio de yoga de Andrea. Incluye paleta cromática, componentes, tipografía y lineamientos de interacción para mantener una estética zen, minimalista y cálida.
---

# Skill de Diseño e Identidad Visual — Yoga Estudio

Esta skill define la personalidad estética, la paleta cromática y las reglas de diseño de interfaz para el sistema de gestión del estudio de yoga de Andrea. Su objetivo es asegurar coherencia visual y una experiencia de usuario placentera, orientada a la calma, la claridad y el uso ágil desde el teléfono móvil.

---

## 1. Paleta de Colores

La identidad visual está inspirada en elementos de la naturaleza (tierra, hojas, luz natural y fibras vegetales). Evitar saturaciones intensas o colores sintéticos chillones.

| Nombre | HEX | Rol en la UI | Clase Tailwind / CSS sugerida |
| :--- | :--- | :--- | :--- |
| **Blanco Cálido** | `#FAF8F3` | Fondo principal de la app, fondos limpios y luminosos. | `bg-[#FAF8F3]` o `var(--background)` |
| **Verde Salvia** | `#718B78` | Color primario para acciones clave, botones principales y tarjetas de paquete. | `bg-[#718B78]`, `text-[#718B78]`, `var(--primary)` |
| **Verde Oscuro** | `#314A3A` | Textos de alto contraste, encabezados y detalles de marca. | `text-[#314A3A]`, `var(--foreground)` |
| **Beige** | `#EEE5D8` | Fondos secundarios, divisores suaves, bordes y badges neutros. | `bg-[#EEE5D8]`, `border-[#EEE5D8]`, `var(--muted)` |
| **Terracota** | `#C77D65` | Color de acento para alertas, estados por renovar o destacar elementos importantes sin ser agresivo. | `text-[#C77D65]`, `bg-[#C77D65]`, `var(--earth)` |

---

## 2. Tipografía y Jerarquía

- **Cuerpo y Controles:** Sans-serif moderna, geométrica o humanist (como *DM Sans*, *Inter* o similar), con alto nivel de legibilidad y altura de x generosa.
- **Títulos y Saldo:** Serif elegante o display con personalidad cálida (como *Fraunces* o similar) reservada para nombres, títulos principales y el número destacado de clases disponibles.
- **Espaciado y jerarquía:** Priorizar espacios en blanco generosos (`p-4`, `p-6`, `gap-4`). No comprimir elementos ni saturar la pantalla.

---

## 3. Componentes Visuales

### 3.1. Tarjeta Digital de Paquete (Protagonista de la UI)
El saldo del paquete es la información más consultada por alumnas e instructoras:
- **Formato:** Tarjeta con bordes redondeados pronunciados (`rounded-3xl`), fondo en verde salvia (`#718B78`) y texto en blanco cálido (`#FAF8F3`).
- **Grilla de clases:** Representación visual de los 10 casilleros del paquete (2 filas de 5 o grilla adaptativa).
  - Casillero consumido: Relleno con icono orgánico (hoja/tilde).
  - Casillero disponible: Borde fino translúcido con número claro.
- **Cifras destacadas:** Muestra de "Clases disponibles" en tamaño grande (`text-3xl` o `text-4xl`) y "Clases usadas" de forma secundaria.

### 3.2. Botones y Controles
- **Botón Primario:** Verde salvia (`#718B78`), texto blanco cálido, esquinas redondeadas (`rounded-xl` o `rounded-2xl`), altura mínima de 44px para toque táctil cómodo.
- **Botón Secundario / Outline:** Fondo transparente o blanco cálido, borde beige o verde suave, texto verde oscuro.
- **Inputs y Selects:** Fondo beige claro o blanco cálido, bordes suaves, foco con anillo sutil en verde salvia (`focus:ring-2 focus:ring-[#718B78]/40`).

### 3.3. Mensajes de Estado y Feedback
- **Éxito (Asistencia registrada / Paquete asignado):** Fondo verde salvia muy suave (`#718B78` al 15%), borde y texto verde oscuro. Icono de confirmación amable.
- **Aviso / Error (Sin saldo / Duplicado / Límite excedido):** Fondo terracota suave (`#C77D65` al 15%), texto terracota oscuro. Lenguaje empático y explicativo ("Esta alumna ya registró su asistencia hoy", "No quedan clases disponibles en este paquete").

---

## 4. Principios de Interacción (Mobile First)

1. **Operación con una mano:** Ubicar los botones de acción ("Registrar asistencia", "Asignar paquete") al alcance del pulgar.
2. **Claridad sobre densidad:** Si hay 5 movimientos recientes, mostrar solo los últimos y permitir ver más en un scroll suave. Evitar tablas pesadas de escritorio con decenas de columnas.
3. **Flujos sin ambigüedad:** Cada modal o pantalla debe resolver una única pregunta principal a la vez.

---

## 5. Ubicación y Descubrimiento en Antigravity

- **Ruta canónica en el proyecto:** `.agent/skills/yoga-marca/SKILL.md` (también replicado en `.agents/skills/yoga-marca/SKILL.md` para compatibilidad exhaustiva con los patrones de descubrimiento de Antigravity).
- **Descubrimiento oficial:** Antigravity escanea automáticamente las carpetas `.agent/` y `.agents/` desde la raíz del repositorio hacia arriba.
