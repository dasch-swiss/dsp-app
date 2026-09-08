import { devices } from "@pixeleye/cli-devices";

export default {
  token: process.env["PIXELEYE_TOKEN"] || "",
  endpoint: "http://localhost:5001",
  // PoC: one device instead of the default four (Chrome/Firefox/Safari/Edge)
  devices: [devices["Desktop Chrome"]],
};
