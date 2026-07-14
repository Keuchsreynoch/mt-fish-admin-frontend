// app/plugins/vuetify.ts
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import "vuetify/styles";
import "@mdi/font/css/materialdesignicons.min.css";
import "vuetify-sonner/style.css";

export default defineNuxtPlugin((nuxtApp) => {
  const vuetify = createVuetify({
    components,
    directives,
    defaults: {
      VTextField: {
        color: "primary",
        variant: "outlined",
      },
    },
    theme: {
      defaultTheme: "crystalLagoon",
      themes: {
        crystalLagoon: {
          dark: false,
          colors: {
            primary: "#0097A7",
            secondary: "#00BCD4",
            create: "#0CED0C",
            cancel: "#FF2C2C",
            background: "#F0FBFF",
            surface: "#FFFFFF",
            accent: "#FF8F00",
            success: "#0CED0C",
            warning: "#E53935",
            error: "#E53935",
            info: "#0097A7",
            "on-background": "#1A3A4A",
            "on-surface": "#1A3A4A",
            "on-primary": "#E0F7FA",
            "on-secondary": "#FFFFFF",
            "on-create": "#FFFFFF",
            "on-cancel": "#FFFFFF",
            "on-accent": "#FFFFFF",
            "on-success": "#FFFFFF",
            "on-warning": "#FFFFFF",
            "on-error": "#FFFFFF",
            "on-info": "#FFFFFF",
            "close-btn": "#E53935",
          },
        },
      },
    },
  });

  nuxtApp.vueApp.use(vuetify);
});
