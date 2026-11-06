"""Macros for dsp-app's Angular and TypeScript libraries."""

load("@aspect_rules_jest//jest:defs.bzl", "jest_test")
load("@aspect_rules_ts//ts:defs.bzl", "ts_config")
load("@bazel_skylib//rules:write_file.bzl", "write_file")
load("@rules_angular//src/ng_project:index.bzl", "ng_project")
load("@rules_sass//src:index.bzl", "sass_binary")
load(":loose.bzl", "LOOSE_LIBRARIES")
load(":visibility.bzl", "ENFORCE_VISIBILITY", "LIBRARIES", "library_visibility")

# What the shared preset (jest.preset.js) loads, for every test target.
_JEST_RUNTIME = [
    Label("//:jest_preset"),
    Label("//:node_modules/@jscutlery/swc-angular"),
    Label("//:node_modules/@jscutlery/swc-angular-plugin"),
    Label("//:node_modules/@swc/core"),
    Label("//:node_modules/@swc/helpers"),
    Label("//:node_modules/@swc/jest"),
    Label("//:node_modules/jest-environment-jsdom"),
    Label("//:node_modules/jest-preset-angular"),
    Label("//:node_modules/reflect-metadata"),
    Label("//:node_modules/ts-node"),
    Label("//:node_modules/typescript"),
]

# jest-preset-angular's setup requires these although no spec imports them. A darwin sandbox
# resolves a missing one through the execroot and passes; only the Linux CI run proves the list.
_ANGULAR_TEST_PEERS = [
    Label("//:node_modules/zone.js"),
    Label("//:node_modules/@angular/common"),
    Label("//:node_modules/@angular/compiler"),
    Label("//:node_modules/@angular/core"),
    Label("//:node_modules/@angular/platform-browser"),
    Label("//:node_modules/@angular/platform-browser-dynamic"),
    Label("//:node_modules/rxjs"),
    Label("//:node_modules/tslib"),
]

def vre_jest_test(name, srcs, deps = [], data = [], config = "jest.config.js", size = None, shard_count = None, **kwargs):
    """Jest over a library's TypeScript sources with the shared SWC preset.

    Args:
        name: the test target's name.
        srcs: the library's sources, specs and test-setup.ts included; Jest compiles them itself.
        deps: what the sources import: npm packages and other libraries' sources.
        data: files a spec reads at run time, such as fixtures.
        config: the library's Jest config, which sets the shared preset.
        size: passed to the test rule.
        shard_count: passed to the test rule.
        **kwargs: passed to jest_test.
    """
    # A library's own deps may repeat a runtime or peer package.
    test_data = {
        str(native.package_relative_label(label)): True
        for label in srcs + deps + data + _JEST_RUNTIME + _ANGULAR_TEST_PEERS + native.glob(["tsconfig*.json"])
    }
    jest_test(
        name = name,
        config = config,
        # Jest 30 looks for a config file upward from its working directory; the runfiles root has none.
        chdir = native.package_name(),
        data = test_data.keys(),
        node_modules = Label("//:node_modules"),
        size = size,
        shard_count = shard_count,
        **kwargs
    )

# What every library compiles against: tsconfig.base.json sets `importHelpers` and the libraries'
# `types` name the declarations in types/.
_LIBRARY_DEPS = [
    Label("//:ambient_types"),
    Label("//:node_modules/tslib"),
]

_STRICT_FLAGS = [
    "strict",
    "noImplicitOverride",
    "noPropertyAccessFromIndexSignature",
    "noImplicitReturns",
]

def _alias(label):
    # tsconfig.base.json's naming: libs/vre/ui/ui is @dasch-swiss/vre/ui/ui.
    return "@dasch-swiss/" + label.package.removeprefix("libs/")

def _is_library(label):
    return label.repo_name == "" and label.package.startswith("libs/")

def _css_target(scss):
    return "css_" + scss.removesuffix(".scss").replace("/", "_").replace("-", "_").replace(".", "_")

def vre_library(
        name,
        srcs,
        deps = [],
        stylesheets = [],
        sass_deps = [],
        assets = [],
        extra_visibility = [],
        test_srcs = [],
        test_deps = [],
        test_data = [],
        jest_config = "jest.config.js"):
    """An Angular library: its stylesheets, its ng_project compile and its Jest target.

    The library's ADR-0001 type and scope come from `LIBRARIES` in visibility.bzl, which fails the
    load for a package it does not list. The generated tsconfig maps only the declared library
    `deps` to their compiled `.d.ts`, so an import of any other library fails with TS2307
    (Decision 7 of DEV-7767, evidence in docs/contribution/bazel-baselines.md). The derived
    visibility applies only while `ENFORCE_VISIBILITY` is on; until then every library is public
    and `extra_visibility` has no effect.

    A library compiles under the strict flags below unless `LOOSE_LIBRARIES` lists it, whatever
    its own tsconfig says.

    Args:
        name: the ng_project target; by convention the package's last path segment.
        srcs: the library's TypeScript sources, listed explicitly; never a glob over a gitignored
            directory.
        deps: other libraries and npm packages the sources import.
        stylesheets: `.scss` files, each compiled to the `.css` beside it that `styleUrl` names.
        sass_deps: sass_library targets the stylesheets `@use`.
        assets: templates and other files the compiler reads.
        extra_visibility: packages ADR-0001 does not allow but that depend on the library today,
            each with a comment naming the ADR and the issue that removes it.
        test_srcs: specs and test-setup.ts; no Jest target without them.
        test_deps: what only the specs import.
        test_data: files a spec reads at run time.
        jest_config: the library's Jest config.
    """
    package = "//" + native.package_name()
    if package not in LIBRARIES:
        fail("%s is not in LIBRARIES in tools/angular/visibility.bzl; add it with its ADR-0001 type and scope" % package)
    kind = LIBRARIES[package]
    allowed = library_visibility(kind.type, kind.scope) + extra_visibility
    visibility = allowed if ENFORCE_VISIBILITY else ["//visibility:public"]

    css = []
    for scss in stylesheets:
        directory, _, file = scss.rpartition("/")
        sass_binary(
            name = _css_target(scss),
            src = scss,
            output_dir = directory,
            output_name = file.removesuffix(".scss") + ".css",
            sourcemap = False,
            deps = sass_deps,
        )
        css.append(":" + _css_target(scss))

    paths = {}
    for dep in deps:
        label = native.package_relative_label(dep)
        if _is_library(label):
            paths[_alias(label)] = [label.package + "/src/index.d.ts"]

    compiler_options = {
        # Must be "."; a checked-in outDir would win and ng_project would emit nothing.
        "outDir": ".",
        "module": "preserve",
        "moduleResolution": "bundler",
        # Replaces tsconfig.base.json's source mapping, which would compile every library from source.
        "paths": paths,
    }
    # A loose library mirrors the Angular CLI's app program, which compiles every library unstrict.
    strict = package not in LOOSE_LIBRARIES
    compiler_options.update({flag: strict for flag in _STRICT_FLAGS})
    tsconfig = {
        "extends": "./tsconfig.lib.json",
        "compilerOptions": compiler_options,
        "angularCompilerOptions": {
            "strictInjectionParameters": True,
            "strictInputAccessModifiers": True,
            "strictTemplates": strict,
        },
        "include": srcs,
    }
    write_file(
        name = "tsconfig_bazel_json",
        out = "tsconfig.bazel.json",
        content = [json.encode_indent(tsconfig)],
    )
    ts_config(
        name = "tsconfig_bazel",
        src = ":tsconfig_bazel_json",
        deps = native.glob(["tsconfig*.json"]) + [Label("//:tsconfig_base")],
    )

    ng_project(
        name = name,
        srcs = srcs,
        assets = css + assets,
        tsconfig = ":tsconfig_bazel",
        declaration = True,
        declaration_map = True,
        resolve_json_module = True,
        source_map = True,
        # ngc emits the .js; a separate transpiler would skip the Angular compilation.
        transpiler = "tsc",
        deps = deps + _LIBRARY_DEPS,
        visibility = visibility,
    )

    if test_srcs:
        vre_jest_test(
            name = "test",
            srcs = srcs + test_srcs,
            deps = deps + test_deps,
            data = assets + test_data,
            config = jest_config,
        )
