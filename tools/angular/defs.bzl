"""Macros for dsp-app's Angular and TypeScript libraries."""

load("@aspect_rules_jest//jest:defs.bzl", "jest_test")

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
