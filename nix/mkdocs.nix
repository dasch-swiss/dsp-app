# The mkdocs environment `just docs-build`, `docs-serve` and `docs-lint` run in.
# nixpkgs carries mkdocs, mkdocs-material and mkdocs-include-markdown-plugin;
# `git-revision-date` (mkdocs.yml) is not in nixpkgs, so it is built here from
# its PyPI wheel, pinned by hash.
{ python3 }:
let
  mkdocs-git-revision-date-plugin = python3.pkgs.buildPythonPackage rec {
    pname = "mkdocs_git_revision_date_plugin";
    version = "0.3.2";
    format = "wheel";
    src = python3.pkgs.fetchPypi {
      inherit pname version format;
      dist = "py3";
      python = "py3";
      hash = "sha256-LmeVbLAYI90kGOKDPzYj3uhgTN8iO93QBf42ImpW9u8=";
    };
    propagatedBuildInputs = with python3.pkgs; [
      gitpython
      jinja2
      mkdocs
    ];
  };
in
python3.withPackages (ps: [
  ps.mkdocs
  ps.mkdocs-material
  ps.mkdocs-include-markdown-plugin
  mkdocs-git-revision-date-plugin
])
