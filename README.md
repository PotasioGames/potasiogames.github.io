# 🍌 Potasio Games - Official Website

Bienvenido al repositorio oficial del sitio web de **Potasio Games**. Este espacio es el corazón digital de nuestro estudio, diseñado para reflejar nuestra pasión por los videojuegos y conectar con nuestra comunidad.

## 🕹️ Sobre el Estudio

**Potasio Games** es un estudio independiente dedicado a la creación de experiencias digitales originales. Creemos en la importancia de la innovación, el diseño cuidado y, por sobre todo, la diversión. Desde juegos de deducción social hasta nuevas aventuras, exploramos diversos géneros para ofrecer contenido de calidad a jugadores de todo el mundo.

## 🚀 Nuestros Juegos

### **Impostor ¿Sabes mentir?**
Nuestro primer gran lanzamiento. Un juego de deducción social diseñado para reuniones con amigos donde el ingenio y la capacidad de engaño son tus mejores herramientas.
-   **Disponible en**: [Google Play Store](https://play.google.com/store/apps/details?id=com.augustodelisio.impostor)

*Próximamente más títulos en desarrollo...*

## 🌐 Visítanos
Puedes ver el sitio en vivo aquí: [https://potasiogames.github.io/](https://potasiogames.github.io/)

## 📬 Contacto
¿Tienes dudas, sugerencias o quieres colaborar con nosotros?
-   **Email**: [potasiogames@hotmail.com](mailto:potasiogames@hotmail.com)
-   **Perfil de Desarrollador**: [Potasio Games en Google Play](https://play.google.com/store/apps/developer?id=Potasio)

---

## 🛠️ Desarrollo y Compilación

Este proyecto está desarrollado con **Vite**, **TypeScript** y **Tailwind CSS**.

### Requisitos Previos
Asegúrate de tener instalado [Node.js](https://nodejs.org/) (se recomienda versión LTS).

### Pasos para iniciar el desarrollo:

1. **Instalar dependencias:**
   ```bash
   npm install
   ```

2. **Iniciar servidor de desarrollo local:**
   ```bash
   npm run dev
   ```
   Esto levantará el servidor local (generalmente en `http://localhost:5173`).

3. **Compilar para producción:**
   ```bash
   npm run build
   ```
   Los archivos compilados y listos para distribución se generarán en la carpeta `/dist`.

## 🌿 Flujo de Ramas (Git branching)

El repositorio sigue un esquema de desarrollo basado en las siguientes ramas principales:

*   **`dev`**: Rama principal de desarrollo. Todos los nuevos cambios, características y correcciones de errores deben integrarse aquí primero.
*   **`main`**: Rama de producción. Contiene el código estable que se despliega en producción ([potasiogames.github.io](https://potasiogames.github.io/)).

### Flujo de trabajo sugerido:
1. Crea una nueva rama a partir de `dev`:
   ```bash
   git checkout dev
   git pull
   git checkout -b feature/nombre-de-la-rama
   ```
2. Realiza tus cambios y haz los commits correspondientes.
3. Envía tus cambios y abre un Pull Request (o realiza el merge) hacia la rama `dev`.
4. Una vez validada y probada la rama `dev`, se realiza la fusión de `dev` a `main` para desplegar la nueva versión del sitio web.

---
*© 2026 Potasio Games. Hecho con ❤️ para la comunidad indie.*
