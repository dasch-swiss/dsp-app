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

      # `.nvmrc` is the single source of truth for the Node version: CI reads it
      # via `actions/setup-node`, and the dev shell derives its package from the
      # same file rather than repeating the number. Bumping `.nvmrc` to another
      # major moves the shell with it.
      nvmrc = nixpkgs.lib.fileContents ./.nvmrc;
      nodeMajor = nixpkgs.lib.head (nixpkgs.lib.splitString "." nvmrc);
      nodeAttr = "nodejs_${nodeMajor}";
    in
    {
      devShells = forEachSystem (pkgs: {
        default = pkgs.mkShell {
          packages = [
            # Node and npm, selected by `.nvmrc`'s major. nixpkgs pins one patch
            # per major, so the shell's patch can differ from `.nvmrc`'s exact
            # value; package.json's `engines` is a caret range (^22.13.0), so any
            # patch on the line satisfies it. Without this shell, a host on the
            # next major fails `npm ci` with `notsup` before any script runs.
            pkgs.${nodeAttr}

            # agent-browser — drives the running app for `/eng:test-browser`
            # (navigate, screenshot, console and network reads, axe sweeps).
            pkgs.agent-browser
          ];

          shellHook = ''
            echo "dsp-app dev shell — node $(node --version) (.nvmrc: ${nvmrc}), npm $(npm --version)"
          '';
        };
      });
    };
}
