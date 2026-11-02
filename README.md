# Estudio de Yoga — Plataforma de Gestión Zen (SDD & Producción)

Sistema de gestión para el estudio de yoga de Andrea (*Prana Yoga Studio*), desarrollado con **Next.js (App Router)**, **TypeScript**, **Tailwind CSS** y **Vitest**, aplicando rigurosamente **Spec Driven Development (SDD)**.

---

## 🌟 Estado de las Entregas

- ✅ **Tarea 1 & 2:** `specs/SPEC-001-gestion-paquetes.md` (Gestión de paquetes de 10 clases, saldos no negativos, prevención de duplicados, auditoría y ajustes).
- ✅ **Tarea 3 (Actual):**
  - **Paso 1:** Definición formal de ICP y User Personas (`specs/ICP-USER-PERSONA.md`).
  - **Paso 2:** Nueva `specs/SPEC-002-sala-en-vivo-y-alertas.md` (Monitor de Sala en Vivo de 12 Mats, Quick Check-in, Semáforo Zen y métricas de éxito).
  - **Paso 3:** Lanzamiento a producción en **Vercel** (`ENTREGA-TAREA-3.md`).

---

## 📁 Arquitectura y Especificaciones

```text
├── specs/
│   ├── ICP-USER-PERSONA.md             # Paso 1: ICP, atributos firmográficos y User Personas
│   ├── SPEC-001-gestion-paquetes.md     # SPEC-001: Núcleo de paquetes y asistencias
│   └── SPEC-002-sala-en-vivo-y-alertas.md # Paso 2: Monitor de 12 mats, cupo estricto y alertas
├── lib/
│   ├── package-management.ts          # Dominio puro de paquetes y auditoría
│   └── live-room.ts                   # Dominio puro de sala en vivo y semáforo zen
├── tests/
│   ├── package-management.test.ts     # 12 tests para SPEC-001
│   └── spec-002.test.ts               # 7 tests para SPEC-002
├── app/
│   ├── page.tsx                       # Home renovado con selector de roles e identidad zen
│   ├── admin/
│   │   ├── sala/page.tsx              # Monitor interactivo de los 12 mats en vivo
│   │   └── paquetes/page.tsx          # Pantalla de paquetes y ajustes
│   └── alumna/page.tsx                # Pase Digital Zen con alertas de renovación y WhatsApp
└── .agent/skills/yoga-marca/          # Identidad visual (#FAF8F3, #718B78, #314A3A, #EEE5D8, #C77D65)
```

---

## 🧪 Pruebas Automatizadas (19 Tests Aprobados)

Ambas especificaciones están respaldadas por suites de pruebas automatizadas en Vitest:

```bash
pnpm test
```

Salida esperada:
```text
 ✓ tests/spec-002.test.ts (7 tests)
 ✓ tests/package-management.test.ts (12 tests)

 Test Files  2 passed (2)
      Tests  19 passed (19)
```

---

## 🚀 Despliegue a Producción (Vercel)

El proyecto está listo para producción y versionado en GitHub:  
👉 **`https://github.com/gsierra87/yoga-codigo-facilito`**

Para desplegarlo en 1 minuto:
1. Conectate a [vercel.com/new](https://vercel.com/new).
2. Importá el repositorio `yoga-codigo-facilito`.
3. Vercel detecta Next.js automáticamente y ejecuta `pnpm build`.
4. ¡Listo! La URL de producción quedará activa con HTTPS automático.

---

## 🖥️ Ejecución Local

```bash
pnpm install
pnpm dev
```

Abrí [http://localhost:3000](http://localhost:3000) en el navegador:
- **Monitor de Sala en Vivo (12 Mats):** `/admin/sala`
- **Gestión de Paquetes:** `/admin/paquetes`
- **Pase Digital de Alumna:** `/alumna`
