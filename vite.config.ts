import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/costos-app/", // <-- el nombre de tu repositorio
});
