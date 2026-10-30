# Estudio de Yoga — Gestión de Paquetes y Asistencias (SDD)

Este proyecto es una aplicación web para la administración de un estudio de yoga, desarrollada aplicando **Spec Driven Development (SDD)**.

El alcance de este ejercicio se centra en el feature más importante del estudio: la **gestión digital de paquetes de 10 clases y control de asistencias**, reemplazando las tarjetas físicas de papel por un registro confiable con auditoría completa.

---

## 📁 Estructura del Proyecto

- `AGENTS.md`: Contexto persistente, reglas de negocio y pautas para el agente y el equipo.
- `specs/SPEC-001-gestion-paquetes.md`: Especificación funcional formal con los 5 Criterios de Aceptación (CA-01 a CA-05).
- `.agent/skills/yoga-marca/SKILL.md`: Skill de diseño con la paleta de identidad visual (#FAF8F3, #718B78, #314A3A, #EEE5D8, #C77D65) y pautas UX mobile-first.
- `lib/package-management.ts`: Capa de dominio pura en TypeScript con las reglas de negocio, validaciones y datos de prueba.
- `tests/package-management.test.ts`: Suite de pruebas automatizadas con Vitest que valida los 5 criterios de aceptación y casos de error.
- `app/admin/paquetes/page.tsx`: Pantalla principal del feature central de paquetes, asistencias y ajustes.
- `ENTREGA.md`: Documento de entrega reflexivo en primera persona.

---

## 🚀 Requisitos e Instalación

- Node.js (versión 20 o superior recomendada; probado en v24)
- pnpm (o npm)

Para instalar las dependencias:

```bash
pnpm install
```

---

## 🧪 Ejecución de Pruebas Automatizadas

Para correr la suite de pruebas unitarias y de integración que valida los criterios de aceptación:

```bash
pnpm test
```

Para correr las pruebas en modo interactivo con recarga en vivo:

```bash
pnpm vitest
```

---

## 🖥️ Ejecutar la Aplicación Web

### Opción 1 — Mediante scripts automáticos:
- En **Windows (PowerShell)**:
  ```powershell
  .\iniciar.ps1
  ```
- En **Windows (CMD o doble clic)**:
  ```cmd
  iniciar.bat
  ```

### Opción 2 — Modo manual:
```bash
pnpm dev
```

Luego abrí [http://localhost:3000](http://localhost:3000) en el navegador.

- En la pantalla de bienvenida podés ingresar directamente al feature central haciendo clic en **"Gestión de Paquetes y Asistencias (SDD)"** o navegar como **Administradora** (`/admin`) o **Instructora** (`/instructora`).
- La pantalla específica del feature se encuentra en `/admin/paquetes`.

Para compilar la versión optimizada de producción:

```bash
pnpm build
pnpm start
```

---

## 🧘 Datos de Demostración Incluidos

El sistema incluye datos iniciales precargados listos para probar:
- **Andrea Molina:** Administradora del estudio.
- **Carla Ruiz y Sofía Benítez:** Instructoras.
- **Valentina López:** Alumna con paquete nuevo recién asignado (10 clases disponibles, 0 usadas).
- **Martina Gómez:** Alumna con uso parcial (4 clases disponibles, 6 usadas e historial de asistencias).
- **Camila Díaz:** Alumna con paquete agotado (0 disponibles, 10 usadas).
- **Lucía Fernández:** Alumna con 7 disponibles y 3 usadas.
- **Julieta Romero:** Alumna registrada sin paquete activo.

Podés hacer clic en **"Reiniciar Demo Seed"** en la esquina superior de la pantalla de paquetes para volver al estado inicial en cualquier momento.
