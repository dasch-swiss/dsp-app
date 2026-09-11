import { devices } from "@pixeleye/cli-devices";

export default {
  token: process.env["PIXELEYE_TOKEN"] || "",
  // Endpoint is environment-driven so the same config serves a local instance
  // and the hosted VM. CI sets PIXELEYE_ENDPOINT from a repository variable.
  endpoint: process.env["PIXELEYE_ENDPOINT"] || "http://localhost:5001",
  // One device instead of the default four (Chrome/Firefox/Safari/Edge).
  // Note: the CLI installs chromium+firefox+webkit regardless of this list, so
  // CI caches ~/.cache/ms-playwright rather than relying on this to save time.
  devices: [devices["Desktop Chrome"]],
  // Leave false: the -w/--wait CLI flag is a no-op in 0.8.8 (stored as `wait`,
  // read as `waitForStatus`), and advisory mode does not block on the verdict.
  waitForStatus: false,
};
