# Plantando Semillas STEAM – Plataforma de Retos Educativos

> **«Despierta su curiosidad. Impulsa su futuro»**

Plataforma educativa gamificada desarrollada desde cero para los alumnos de la academia de programación y robótica **Plantando Semillas STEAM**. Permite a los estudiantes resolver retos lógicos (**Semidokus** y **Aventuras Deductivas**), retos de **programación de código mediante bloques**, sumar puntos, desbloquear insignias y avanzar de nivel, mientras el profesor gestiona las cuentas de alumnos, diseña retos con validación en servidor y supervisa el progreso del aula.

---

## 🌟 Novedades y Características Principales

### 🧒 Para Alumnos
- **Acceso seguro sin correos**: Inicio de sesión sencillo y privado mediante **Alias** y **Código personal**. No se solicitan datos personales de menores.
- **Tipos de Retos Educativos**:
  1. **Semidokus Clásicos (4×4 y 5×5)**: Cuadrículas de lógica con símbolos STEAM (Robots, Microchips, Circuitos, etc.) donde ningún elemento se puede repetir en filas ni columnas.
  2. **Aventura Deductiva (Ej. Semidoku 03: ¡La aventura de Semillito en Minecraft!)**:
     - Semillito 🌱, Steve 🧑, Creeper 💚, Alex 🧑🚀 y Enderman 🟪.
     - 5 filas y 5 columnas, con un personaje por fila y columna.
     - Pistas ordenadas paso a paso (1 a 9) con preguntas didácticas guiadas para deducción lógica.
     - Colocación interactiva y borrado al volver a pulsar.
  3. **Programación por Bloques**:
     - Ensamblaje visual de algoritmos (`Avanzar 1 paso`, `Girar Derecha ↷`, `Girar Izquierda ↶`, `Recoger Objeto 💎`, `Repetir x2 / x3`).
     - Simulador interactivo en tiempo real donde Semillito recorre el laberinto recogiendo gemas y esquivando rocas.
- **Jerarquía de Subniveles STEAM (Nivel 3 más bajo ➔ Nivel 1 más alto)**:
  Cada rango se subdivide en tres niveles de maestría:
  - **Explorador Tecnológico**: Nivel 3 (Iniciación) ➔ Nivel 2 ➔ Nivel 1 (Avanzado)
  - **Aprendiz Digital**: Nivel 3 (Iniciación) ➔ Nivel 2 ➔ Nivel 1 (Avanzado)
  - **Constructor de Ideas**: Nivel 3 (Iniciación) ➔ Nivel 2 ➔ Nivel 1 (Avanzado)
  - **Inventor STEAM**: Nivel 3 (Iniciación) ➔ Nivel 2 ➔ Nivel 1 (Avanzado)
  - **Maestro Tecnológico**: Nivel 3 (Iniciación) ➔ Nivel 2 ➔ Nivel 1 (Máxima Distinción)
- **Catálogo Extenso de Insignias**:
  - Más de 20 insignias temáticas (*Aventurero Minecraft*, *Detective Lógico*, *Primer Algoritmo*, *Bucle Perfecto*, *Guía Robótico*, *Rachas*, *Subniveles*, etc.).
  - Posibilidad de que el profesor cree nuevas insignias cuando lo desee.
- **Mascota Oficial «Semillito»**: Imagen oficial integrada en la navegación, tarjetas, avatares y globos de consejos pedagógicos.

### 👩‍🏫 Para el Profesor / Administrador
- **Panel privado de administración** (`/profesor`).
- **Dashboard con KPIs**: Alumnos registrados, retos publicados, retos completados y feed de actividad reciente en tiempo real.
- **Gestión integral de alumnos**:
  - Alta de alumnos con alias único y generación automática de códigos personales seguros (ej. `ROBO24`, `CHIP77`).
  - Activación o desactivación de cuentas con un clic.
  - Regeneración / reseteo de códigos personales en caso de olvido.
- **Diseñador de Retos**:
  - Creador de Semidokus y retos de Programación por Bloques.
  - Comprobación de validez estricta en servidor.
- **Gestor de Insignias Ampliables**:
  - Pestaña para crear nuevas insignias personalizadas con nombre, descripción, icono emoji/gráfico y categoría.
- **Auditoría y Resultados**:
  - Historial de resoluciones por alumno, fecha, puntos e **informe exportable a CSV** compatible con Excel.

---

## 📋 Cuentas de Demostración Iniciales

### Cuenta de Profesor
- **Usuario:** `profesor`
- **Contraseña:** `STEAMprofesor2026!`

### Cuentas de Alumnos
- **Lucas:** Alias `Lucas` | Código `ROBO24` (Explorador Nivel 1)
- **Sofia:** Alias `Sofia` | Código `CHIP77` (Explorador Nivel 2)
- **Mateo:** Alias `Mateo` | Código `STEAM10` (Explorador Nivel 3)

*(En el formulario de acceso de alumnos se dispone de accesos directos para probar cualquiera de las cuentas de demostración con un solo clic).*

---

## ☁️ Despliegue en Cloudflare (Workers + D1)

```bash
# 1. Crear base de datos en Cloudflare D1
npx wrangler d1 create plantando-semillas-db

# 2. Configurar database_id en wrangler.jsonc
# 3. Aplicar migraciones SQL
npx wrangler d1 migrations apply plantando-semillas-db --remote

# 4. Compilar y Desplegar
npm run build
npx wrangler deploy
```
