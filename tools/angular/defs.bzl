"""Macros for dsp-app's Angular and TypeScript libraries."""

load("@aspect_rules_esbuild//esbuild:defs.bzl", "esbuild")
load("@aspect_rules_jest//jest:defs.bzl", "jest_test")
load("@aspect_rules_js//js:defs.bzl", "js_library", "js_run_binary")
load("@aspect_rules_ts//ts:defs.bzl", "ts_config")
load("@bazel_lib//lib:copy_file.bzl", "copy_file")
load("@bazel_lib//lib:copy_to_directory.bzl", "copy_to_directory")
load("@bazel_skylib//rules:write_file.bzl", "write_file")
load("@rules_angular//src/ng_project:index.bzl", "ng_project")
load("@rules_sass//src:index.bzl", "sass_binary")
load("@rules_shell//shell:sh_test.bzl", "sh_test")
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

# The stories and their helpers: only the Storybook build (//:storybook) compiles them.
STORY_SRCS = [
    "src/**/*.stories.ts",
    "src/**/stories.helpers.ts",
    "src/**/*.stories.helpers.ts",
    "src/**/*-stories.helper.ts",
]

# What a library's `srcs` glob leaves out: the test files, a spec helper (which a library lists in
# its `test_srcs` by name) and the stories.
LIBRARY_EXCLUDES = TEST_SRCS + STORY_SRCS + ["src/**/*.spec-helper.ts"]

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

def _sass_include_paths(sass_deps):
    # A bare `@use 'config'` resolves in the package of each local sass_library.
    return {
        label.package: True
        for label in [native.package_relative_label(d) for d in sass_deps]
        if label.repo_name == ""
    }.keys()

def _stylesheets(stylesheets, sass_deps):
    """Compiles each `.scss` to the `.css` beside it that `styleUrl` names; returns the targets."""
    css = []
    for scss in stylesheets:
        directory, _, file = scss.rpartition("/")
        sass_binary(
            name = _css_target(scss),
            src = scss,
            output_dir = directory,
            output_name = file.removesuffix(".scss") + ".css",
            sourcemap = False,
            include_paths = _sass_include_paths(sass_deps),
            deps = sass_deps,
        )
        css.append(":" + _css_target(scss))
    return css

def _bazel_tsconfig(name, out, extends, srcs, deps, strict, extra_paths = {}):
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

    css = _stylesheets(stylesheets, sass_deps)

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

    # What the Storybook build reads of the library: the stories, the sources they import and the
    # compiled `.css` the components' `styleUrl` names.
    js_library(
        name = "storybook_sources",
        srcs = srcs + assets + testing_srcs + css + native.glob(STORY_SRCS, allow_empty = True),
        visibility = ["//:__pkg__"],
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

def vre_application(
        name,
        srcs,
        environments,
        deps = [],
        stylesheets = [],
        sass_deps = [],
        global_stylesheet = "src/styles.scss",
        index_html = "src/index.html",
        scripts = [],
        static_files = [],
        optimized_configs = ["production"],
        development_configs = ["development"],
        storybook_data = [],
        test_srcs = [],
        test_data = [],
        visibility = None):
    """The Angular application: its shell's ng_project, the esbuild bundle and the `name` directory.

    The configuration comes from the package's `config_setting`s, one per key of `environments`
    and named after it. `name` holds what the CLI's application builder wrote: the hashed bundle,
    `index.html`, the minified global stylesheet and the global scripts (both under hashed names),
    and the `static_files`.

    Args:
        name: the output directory, e.g. `dist`.
        srcs: the shell's TypeScript sources, without the environment file.
        environments: configuration name to the environment file `src/environments/environment.ts`
            is copied from.
        deps: libraries and npm packages the shell imports.
        stylesheets: the shell's component `.scss` files.
        sass_deps: sass_library targets the stylesheets and the global stylesheet `@use`.
        global_stylesheet: compiled, minified, to `styles-<hash>.css`.
        index_html: the page the entries and the stylesheet are written into.
        scripts: plain scripts concatenated into `scripts-<hash>.js`, loaded before the entries.
        static_files: copied into `name` with their path below `src/`.
        optimized_configs: configurations bundled minified and without Angular's dev-mode checks,
            with the critical CSS inlined into `index.html`.
        development_configs: configurations that resolve packages without the `production`
            export condition.
        storybook_data: what else of the package the Storybook build reads.
        test_srcs: the shell's specs and test-setup.ts; no Jest target without them.
        test_data: files a spec reads at run time.
        visibility: of the `name` directory.
    """
    package = native.package_name()
    copy_file(
        name = "environment",
        src = select({":" + config: env for config, env in environments.items()}),
        out = "src/environments/environment.ts",
    )

    css = _stylesheets(stylesheets, sass_deps)
    _bazel_tsconfig(
        "tsconfig_bazel",
        "tsconfig.bazel.json",
        "./tsconfig.app.json",
        srcs + ["src/environments/environment.ts"],
        deps,
        # The Angular CLI compiled the shell unstrict, as tsconfig.json says.
        strict = False,
    )
    ng_project(
        name = "app",
        srcs = srcs + [":environment"],
        assets = css,
        tsconfig = ":tsconfig_bazel",
        declaration = False,
        resolve_json_module = True,
        source_map = True,
        transpiler = "tsc",
        deps = deps + _LIBRARY_DEPS,
    )
    eslint_config()

    js_library(
        name = "sources",
        srcs = srcs,
        deps = [_sources(d) for d in deps],
    )

    js_library(
        name = "storybook_sources",
        srcs = srcs + css + static_files + storybook_data + [":environment", global_stylesheet],
        visibility = ["//:__pkg__"],
    )
    if test_srcs:
        vre_jest_test(
            name = "test",
            srcs = test_srcs,
            deps = [":sources"],
            data = test_data,
        )

    # Every library's alias to its compiled entry point; esbuild runs in the bin directory.
    alias = {"@dasch-swiss/dsp-js": "./libs/dsp-js/src/index.js"}
    for library in LIBRARIES:
        label = Label(library)
        alias[_alias(label)] = "./" + label.package + "/src/index.js"
    up = "../" * len(package.split("/"))
    for config in environments:
        write_file(
            name = "esbuild_config_" + config,
            out = "esbuild.%s.config.mjs" % config,
            content = [
                "import { angularEsbuildConfig } from '%stools/angular/esbuild.config.mjs';" % up,
                "export default angularEsbuildConfig(%s);" % json.encode({
                    "alias": alias,
                    "development": config in development_configs,
                    "optimize": config in optimized_configs,
                }),
            ],
        )
    esbuild(
        name = "bundle",
        bundle = True,
        config = select({":" + config: ":esbuild_config_" + config for config in environments}),
        entry_points = ["src/polyfills.js", "src/main.js"],
        # Packages that reference Node built-ins they never call in a browser.
        external = ["fs", "http", "https", "url"],
        format = "esm",
        metafile = True,
        output_dir = True,
        platform = "browser",
        # No sourceMappingURL comment: the maps are uploaded to Sentry, not served to the browser.
        sourcemap = "external",
        splitting = True,
        target = "es2022",
        deps = [
            ":app",
            Label("//tools/angular:esbuild_config"),
        ],
    )

    sass_binary(
        name = "global_styles",
        src = global_stylesheet,
        output_name = "styles.css",
        include_paths = _sass_include_paths(sass_deps),
        sourcemap = False,
        deps = sass_deps,
    )

    # esbuild's CSS minifier is the CLI's; Sass's compressed output is about 10 percent larger.
    esbuild(
        name = "global_styles_min",
        entry_point = ":global_styles",
        output = "minified/styles.css",
        bundle = False,
        minify = True,
        sourcemap = "",
    )
    native.genrule(
        name = "scripts",
        srcs = scripts,
        outs = ["scripts.js"],
        # In the order given, as the CLI's `scripts` option concatenates them.
        cmd = "cat %s > $@" % " ".join(["$(execpath %s)" % s for s in scripts]),
    )
    js_run_binary(
        name = "index",
        srcs = [index_html, ":bundle", ":global_styles_min", ":scripts"],
        out_dirs = ["index"],
        args = [
            package + "/" + index_html,
            package + "/bundle",
            package + "/bundle_metadata.json",
            package + "/minified/styles.css",
            package + "/scripts.js",
            package + "/index",
        ] + select({
            ":" + config: [str(config in optimized_configs).lower()]
            for config in environments
        }),
        tool = Label("//tools/angular:write_index"),
    )

    copy_to_directory(
        name = name,
        srcs = static_files + [":bundle", ":index"],
        exclude_srcs_patterns = ["**/bundle_metadata.json"],
        replace_prefixes = {
            "src/": "",
            "bundle/": "",
            "index/": "",
        },
        visibility = visibility,
    )

    sh_test(
        name = "bundle_size_test",
        size = "small",
        srcs = [Label("//tools/angular:bundle_size_test.sh")],
        args = ["$(rootpath :%s)" % name],
        data = [":" + name],
    )

    sh_test(
        name = "optimization_test",
        size = "small",
        srcs = [Label("//tools/angular:optimization_test.sh")],
        args = ["$(rootpath :%s)" % name] + select({
            ":" + config: [str(config in optimized_configs).lower()]
            for config in environments
        }),
        data = [":" + name],
    )
