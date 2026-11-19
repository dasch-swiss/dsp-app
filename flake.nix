{
  description = "DSP-APP dev environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
  };

  outputs =
    { self, nixpkgs }:
    let
      systems = [
        "aarch64-darwin"
        "x86_64-darwin"
        "aarch64-linux"
        "x86_64-linux"
      ];
      forEachSystem = f: nixpkgs.lib.genAttrs systems (system: f nixpkgs.legacyPackages.${system});
    in
    {
      formatter = forEachSystem (pkgs: pkgs.nixfmt-rfc-style);

      devShells = forEachSystem (
        pkgs:
        let
          # What building, testing and serving the app needs; both shells carry it.
          base = [
            # bazelisk reads .bazelversion. Wrapped rather than added whole: the package also
            # ships a `sha256sum` that shadows coreutils' (scripts/tree-hash.sh).
            (pkgs.writeShellScriptBin "bazel" ''exec ${pkgs.bazelisk}/bin/bazelisk "$@"'')
            (pkgs.writeShellScriptBin "bazelisk" ''exec ${pkgs.bazelisk}/bin/bazelisk "$@"'')
            pkgs.bazel-watcher
            pkgs.just

            # pnpm on the 10 line. nixpkgs' patch differs from packageManager's
            # 10.33.2, so pnpm downloads 10.33.2 on first use and runs that.
            pkgs.pnpm_10

            # Node for the IDE and the host-side recipes. Bazel's Node is the
            # one MODULE.bazel pins; `just node-version-check` compares the majors.
            pkgs.nodejs_24

            # `just serve`, `storybook`, `storybook-test` and `e2e` serve the Bazel-built
            # output with it: no-store headers and index.html for unknown paths.
            pkgs.miniserve

            pkgs.uv
            pkgs.gh
            pkgs.cacert
            pkgs.go-containerregistry
            pkgs.yq-go
            pkgs.curl
          ];

          default = pkgs.mkShell {
            packages = base ++ [
              pkgs.markdownlint-cli
              (pkgs.callPackage ./nix/mkdocs.nix { })
              pkgs.playwright-driver.browsers

              # agent-browser drives the running app for `/eng:test-browser`.
              pkgs.agent-browser
            ];

            # The one Playwright the repo uses; `just playwright-version-check`
            # fails when package.json's pin and this driver's version differ.
            PLAYWRIGHT_BROWSERS_PATH = "${pkgs.playwright-driver.browsers}";
            PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS = "true";
          };
        in
        {
          inherit default;

          # Cypress on Linux runs Chrome from here; on macOS it uses its bundled Electron. Not built
          # on `default`: the E2E jobs use neither the docs tooling nor Playwright's browsers.
          e2e = pkgs.mkShell {
            packages = base ++ pkgs.lib.optionals pkgs.stdenv.hostPlatform.isLinux [ pkgs.chromium ];
            shellHook = pkgs.lib.optionalString pkgs.stdenv.hostPlatform.isLinux ''
              export CHROME_BIN=${pkgs.chromium}/bin/chromium
            '';
          };
        }
      );
    };
}
