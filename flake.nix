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
            # Node, selected by `.nvmrc`'s major. nixpkgs pins one patch per
            # major, so the shell's patch can differ from `.nvmrc`'s exact
            # value; package.json's `engines` is a caret range (^24.20.0) whose
            # floor is nixpkgs' nodejs_24. Without this shell, a host on another
            # major fails `pnpm install` under engine-strict before any script runs.
            pkgs.${nodeAttr}

            # pnpm on the 10 line. nixpkgs' patch differs from packageManager's
            # 10.33.2, so pnpm downloads 10.33.2 on first use and runs that.
            pkgs.pnpm_10

            # agent-browser — drives the running app for `/eng:test-browser`
            # (navigate, screenshot, console and network reads, axe sweeps).
            pkgs.agent-browser
          ];

          shellHook = ''
            echo "dsp-app dev shell — node $(node --version) (.nvmrc: ${nvmrc}), pnpm $(pnpm --version)"
          '';
        };
      });
    };
}
