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

    theme: {
      defaultTheme: "light",

      themes: {
        light: {
          dark: false,

          colors: {
            primary: "#326690",
            secondary: "#5C7A99",

            background: "#F4F6F8",
            surface: "#FFFFFF",

            accent: "#2C7BE5",
            success: "#28A745",
            warning: "#E9A100",
            error: "#DC3545",
            info: "#326690",

            create: "#28A745",   // green, matches pgAdmin's "Save/Create" affordance
            cancel: "#6C757D",   // neutral gray, pgAdmin's secondary button gray

            "on-background": "#26333F",
            "on-surface": "#26333F",

            "on-primary": "#FFFFFF",
            "on-secondary": "#FFFFFF",
            "on-accent": "#FFFFFF",
            "on-success": "#FFFFFF",
            "on-warning": "#FFFFFF",
            "on-error": "#FFFFFF",
            "on-info": "#FFFFFF",
            "on-create": "#FFFFFF",
            "on-cancel": "#FFFFFF",

            "on-lose": "#EF4444",
            "on-win": "#1E9C07",

            "close-btn": "#DC3545",
          },
        },
      },
    },
  });

  nuxtApp.vueApp.use(vuetify);
});