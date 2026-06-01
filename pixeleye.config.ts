import { defineConfig } from "pixeleye";

export default defineConfig({
  // Get this token from http://localhost:3000 after creating a project
  token: process.env["PIXELEYE_TOKEN"] || "",
  // Point at your local pixeleye instance
  endpoint: "http://localhost:5000",
});
