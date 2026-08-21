// app.config.ts
import { defineConfig } from "vinxi/config";
import tsConfigPaths from "vite-tsconfig-paths";
var app_config_default = defineConfig({
  routers: [
    {
      name: "public",
      type: "static",
      dir: "./public"
    },
    {
      name: "ssr",
      type: "http",
      handler: "./app/ssr.tsx",
      target: "server",
      plugins: () => [
        tsConfigPaths({
          projects: ["./tsconfig.json"]
        })
      ]
    },
    {
      name: "client",
      type: "spa",
      handler: "./index.html",
      target: "browser",
      plugins: () => [
        tsConfigPaths({
          projects: ["./tsconfig.json"]
        })
      ]
    }
  ]
});
export {
  app_config_default as default
};
