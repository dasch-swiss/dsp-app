"""Macros for dsp-app's Angular and TypeScript libraries."""

load("@aspect_rules_jest//jest:defs.bzl", "jest_test")
load("@aspect_rules_js//js:defs.bzl", "js_library")
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

# A library's specs; never part of its compile (Decision 4 of DEV-7767).
TEST_SRCS = [
    "src/**/*.spec.ts",
    "src/test-setup.ts",
]

# What a library's `srcs` glob leaves out: the test files, a spec helper (which a library lists in
# its `test_srcs` by name) and the stories, which Storybook compiles.
LIBRARY_EXCLUDES = TEST_SRCS + [
    "src/**/*.spec-helper.ts",
    "src/**/*.stories.ts",
    "src/**/stories.helpers.ts",
    "src/**/*.stories.helpers.ts",
    "src/**/*-stories.helper.ts",
]

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

def eslint_config():
    """The package's eslint.config.mjs, one of the configs the lint aspect (tools/lint) carries.

    With it the files ESLint reads beside the config: package.json, without which
    eslint-plugin-import's `import/order` crashes on the aspect's bin-tree copies, and the
    tsconfigs a typed config names.
    """
    js_library(
        # tools/lint/linters.bzl names every package's `:eslintrc`.
        name = "eslintrc",
        srcs = ["eslint.config.mjs"] + native.glob(["package.json", "tsconfig*.json"], allow_empty = True),
        deps = [Label("//:eslintrc")],
        # Not the library's visibility: the aspect reads every package's config.
        visibility = ["//visibility:public"],
    )

def _alias(label):
    # tsconfig.base.json's naming: libs/vre/ui/ui is @dasch-swiss/vre/ui/ui.
    return "@dasch-swiss/" + label.package.removeprefix("libs/")

def _is_library(label):
    return label.repo_name == "" and label.package.startswith("libs/")

def _sources(dep):
    # Jest compiles a library's dependencies from their sources, so a test needs theirs, not the
    # compiled output.
    label = native.package_relative_label(dep)
    return label.same_package_label("sources") if _is_library(label) else label

def _css_target(scss):
    return "css_" + scss.removesuffix(".scss").replace("/", "_").replace("-", "_").replace(".", "_")

def _bazel_tsconfig(name, out, extends, srcs, deps, strict, extra_paths = {}, extra_options = {}):
    """Writes a Bazel tsconfig `out` and its ts_config target `name`.

    `paths` maps only the declared library `deps` to their compiled `.d.ts`, so an import of any
    other library fails with TS2307 (Decision 7 of DEV-7767).
    """
    paths = {}
    for dep in deps:
        label = native.package_relative_label(dep)
        if _is_library(label):
            paths[_alias(label)] = [label.package + "/src/index.d.ts"]
    paths.update(extra_paths)

    compiler_options = {
        # Must be "."; a checked-in outDir would win and ng_project would emit nothing.
        "outDir": ".",
        "module": "preserve",
        "moduleResolution": "bundler",
        # Replaces tsconfig.base.json's source mapping, which would compile every library from source.
        "paths": paths,
    }
    compiler_options.update({flag: strict for flag in _STRICT_FLAGS})
    compiler_options.update(extra_options)
    write_file(
        name = name + "_json",
        out = out,
        content = [json.encode_indent({
            "extends": extends,
            "compilerOptions": compiler_options,
            "angularCompilerOptions": {
                "strictInjectionParameters": True,
                "strictInputAccessModifiers": True,
                "strictTemplates": strict,
            },
            "include": srcs,
        })],
    )
    ts_config(
        name = name,
        src = ":" + name + "_json",
        deps = native.glob(["tsconfig*.json"]) + [Label("//:tsconfig_base")],
    )

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
        test_size = None,
        test_shard_count = None,
        testing_srcs = [],
        testing_deps = [],
        jest_config = "jest.config.js"):
    """An Angular library: its stylesheets, its ng_project compile and its Jest target.

    Besides the `name` target the package gets `sources`, the library's sources and templates with
    its dependencies' `sources`, which a dependent library's Jest target runs on, and `eslintrc`
    (`eslint_config`).

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
        sass_deps: sass_library targets the stylesheets `@use`; a bare `@use 'config'` resolves
            in the package of each local one.
        assets: templates and other files the compiler reads.
        extra_visibility: packages ADR-0001 does not allow but that depend on the library today,
            each with a comment naming the ADR and the issue that removes it.
        test_srcs: specs and test-setup.ts; no Jest target without them.
        test_deps: what only the specs import.
        test_data: files a spec reads at run time.
        test_size: the Jest target's size, which sets its timeout.
        test_shard_count: how many shards Jest splits the specs into.
        testing_srcs: the `<alias>/testing` entry point other libraries' specs import, compiled
            by its own ng_project `testing` against the library's compiled output; `src/testing.ts`
            first. Never in `srcs`, so test helpers stay out of the library.
        testing_deps: what only the testing entry point imports.
        jest_config: the library's Jest config.
    """
    package = "//" + native.package_name()
    if package not in LIBRARIES:
        fail("%s is not in LIBRARIES in tools/angular/visibility.bzl; add it with its ADR-0001 type and scope" % package)
    kind = LIBRARIES[package]
    allowed = library_visibility(kind.type, kind.scope) + extra_visibility
    visibility = allowed if ENFORCE_VISIBILITY else ["//visibility:public"]

    include_paths = {
        label.package: True
        for label in [native.package_relative_label(d) for d in sass_deps]
        if label.repo_name == ""
    }
    css = []
    for scss in stylesheets:
        directory, _, file = scss.rpartition("/")
        sass_binary(
            name = _css_target(scss),
            src = scss,
            output_dir = directory,
            output_name = file.removesuffix(".scss") + ".css",
            sourcemap = False,
            include_paths = include_paths.keys(),
            deps = sass_deps,
        )
        css.append(":" + _css_target(scss))

    # A loose library mirrors the Angular CLI's app program, which compiles every library unstrict.
    strict = package not in LOOSE_LIBRARIES
    _bazel_tsconfig("tsconfig_bazel", "tsconfig.bazel.json", "./tsconfig.lib.json", srcs, deps, strict)

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

    if testing_srcs:
        own_alias = _alias(native.package_relative_label(":" + name))
        _bazel_tsconfig(
            "tsconfig_testing",
            "tsconfig.testing.json",
            "./tsconfig.lib.json",
            testing_srcs,
            deps,
            strict,
            extra_paths = {own_alias: [native.package_name() + "/src/index.d.ts"]},
        )
        ng_project(
            name = "testing",
            srcs = testing_srcs,
            tsconfig = ":tsconfig_testing",
            declaration = True,
            declaration_map = True,
            resolve_json_module = True,
            source_map = True,
            transpiler = "tsc",
            deps = [":" + name] + deps + testing_deps + _LIBRARY_DEPS,
            visibility = visibility,
        )

    eslint_config()

    js_library(
        name = "sources",
        srcs = srcs + assets + testing_srcs,
        deps = [_sources(d) for d in deps],
        visibility = visibility,
    )

    if test_srcs:
        vre_jest_test(
            name = "test",
            srcs = test_srcs,
            deps = [":sources"] + [_sources(d) for d in test_deps],
            data = test_data,
            config = jest_config,
            size = test_size,
            shard_count = test_shard_count,
        )
