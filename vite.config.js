// Dos compilaciones:
//  - normal (dist/): la app instalable, que funciona sin conexión gracias al service worker.
//  - single (dist-single/): todo en un solo HTML para la vista previa publicada (sin modo sin conexión).
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => {
  if (mode === "single") {
    return {
      base: "./",
      build: { outDir: "dist-single", assetsInlineLimit: () => true, cssCodeSplit: false, modulePreload: false },
    };
  }
  return {
    base: "./",
    build: { outDir: "dist" },
    plugins: [
      VitePWA({
        registerType: "autoUpdate",
        injectRegister: "auto",
        workbox: { globPatterns: ["**/*.{js,css,html,woff2,png,svg}"] },
        manifest: {
          name: "Hola, Español",
          short_name: "Hola, Español",
          description: "Aprende el español que necesitas para vivir en España y prepara los exámenes oficiales.",
          lang: "es",
          start_url: "./",
          display: "standalone",
          background_color: "#eaf2ff",
          theme_color: "#eaf2ff",
          icons: [
            { src: "icons/icon-192.png", sizes: "192x192", type: "image/png" },
            { src: "icons/icon-512.png", sizes: "512x512", type: "image/png" },
            { src: "icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
          ],
        },
      }),
    ],
  };
});
