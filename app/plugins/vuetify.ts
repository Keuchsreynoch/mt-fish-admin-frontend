import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import "@mdi/font/css/materialdesignicons.min.css";
import "vuetify-sonner/style.css";

export default defineNuxtPlugin((nuxtApp) => {
  const vuetify = createVuetify({
    components,
    directives,
    theme: {
      defaultTheme: "slateLight",
      themes: {
        slateLight: {
          dark: false,
          colors: {
            primary:         "#1F2937",
            secondary:       "#4B5563",
            background:      "#F3F4F6",
            surface:         "#FFFFFF",
            accent:          "#111827",
            success:         "#1E9C07",
            warning:         "#F59E0B",
            error:           "#EF4444",
            info:            "#6B7280",
            "on-background": "#1F2937",
            "on-surface":    "#1F2937",
            "on-primary":    "#FFFFFF",
            "on-secondary":  "#FFFFFF",
            "on-accent":     "#FFFFFF",
            "on-success":    "#FFFFFF",
            "on-warning":    "#FFFFFF",
            "on-error":      "#FFFFFF",
            "on-info":       "#FFFFFF",
            "close-btn":     "#EF4444",
          },
        },
      },
    },
  });

  nuxtApp.vueApp.use(vuetify);
});