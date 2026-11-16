"""ADR-0001's dependency rules as Bazel visibility: who may depend on a library of a given type and scope.

A library takes its visibility from `package_visibility()`, which reads its `LIBRARIES` entry. The
package groups it names are declared in `tools/angular/BUILD.bazel` from `LIBRARIES` and
`APPLICATIONS`.
"""

# Decision 2 of ADR-0001: the types a library of each type may depend on.
TYPE_MAY_DEPEND_ON = {
    "app": ["feature", "ui", "data-access", "util"],
    "feature": ["feature", "ui", "data-access", "util"],
    "ui": ["ui", "util"],
    "data-access": ["data-access", "util"],
    "util": ["util"],
}

SCOPES = ["shared", "project", "ontology", "search", "user", "system", "app"]

# Every library package with its ADR-0001 type and scope, e.g.
# "//libs/vre/ui/ui": struct(type = "ui", scope = "shared"). The only place a library's type and
# scope are written: `package_visibility()` reads a library's own entry.
LIBRARIES = {
    "//libs/vre/3rd-party-services/analytics": struct(type = "data-access", scope = "shared"),
    "//libs/vre/3rd-party-services/api": struct(type = "data-access", scope = "shared"),
    "//libs/vre/3rd-party-services/open-api": struct(type = "data-access", scope = "shared"),
    "//libs/vre/core/config": struct(type = "data-access", scope = "shared"),
    "//libs/vre/core/error-handler": struct(type = "data-access", scope = "shared"),
    "//libs/vre/core/session": struct(type = "data-access", scope = "shared"),
    "//libs/vre/pages/data-browser": struct(type = "feature", scope = "shared"),
    "//libs/vre/pages/ontology/list": struct(type = "feature", scope = "ontology"),
    "//libs/vre/pages/ontology/ontology": struct(type = "feature", scope = "ontology"),
    "//libs/vre/pages/project/project": struct(type = "feature", scope = "project"),
    "//libs/vre/pages/search/advanced-search": struct(type = "feature", scope = "search"),
    "//libs/vre/pages/search/search": struct(type = "feature", scope = "search"),
    "//libs/vre/pages/search/search-filters": struct(type = "feature", scope = "shared"),
    "//libs/vre/pages/system/system": struct(type = "feature", scope = "system"),
    "//libs/vre/pages/user-settings/user": struct(type = "feature", scope = "user"),
    "//libs/vre/resource-editor/resource-editor": struct(type = "feature", scope = "shared"),
    "//libs/vre/shared/app-common": struct(type = "data-access", scope = "shared"),
    # ADR-0001 assigns no tags until the library is split; feature/shared keeps its importers legal.
    "//libs/vre/shared/app-common-to-move": struct(type = "feature", scope = "shared"),
    "//libs/vre/shared/app-help-page": struct(type = "feature", scope = "shared"),
    "//libs/vre/shared/app-helper-services": struct(type = "data-access", scope = "shared"),
    "//libs/vre/shared/calendar": struct(type = "util", scope = "shared"),
    "//libs/vre/ui/date-picker": struct(type = "ui", scope = "shared"),
    "//libs/vre/ui/nested-menu": struct(type = "ui", scope = "shared"),
    "//libs/vre/ui/notification": struct(type = "util", scope = "shared"),
    "//libs/vre/ui/progress-indicator": struct(type = "ui", scope = "shared"),
    "//libs/vre/ui/string-literal": struct(type = "ui", scope = "shared"),
    "//libs/vre/ui/ui": struct(type = "ui", scope = "shared"),
}

# Application packages with their ADR-0001 type and scope; they depend on libraries, never the
# reverse, and are not libraries for vre_library.
APPLICATIONS = {
    "//apps/dsp-app": struct(type = "app", scope = "app"),
}

def scope_may_depend_on(src_scope, dst_scope):
    """Decision 3 of ADR-0001: a domain stays in itself or uses shared; app uses anything."""
    return src_scope == "app" or dst_scope == "shared" or src_scope == dst_scope

def _check(type, scope):
    if type not in TYPE_MAY_DEPEND_ON:
        fail("unknown type %r; ADR-0001 types: %s" % (type, ", ".join(TYPE_MAY_DEPEND_ON)))
    if scope not in SCOPES:
        fail("unknown scope %r; ADR-0001 scopes: %s" % (scope, ", ".join(SCOPES)))

def dependents_group_name(type, scope):
    _check(type, scope)
    return "dependents_%s_%s" % (type.replace("-", "_"), scope)

def package_visibility():
    """The calling package's library is visible to the packages whose type and scope may depend on it."""
    package = "//" + native.package_name()
    if package not in LIBRARIES:
        fail("%s is not in LIBRARIES in tools/angular/visibility.bzl; add it with its ADR-0001 type and scope" % package)
    kind = LIBRARIES[package]
    return [Label("//tools/angular:" + dependents_group_name(kind.type, kind.scope))]

def declare_package_groups():
    """One group per type tier, one per scope, and one per type and scope listing its dependents.

    Bazel visibility is a union of groups, so the dependents of a library, which must satisfy
    both the type and the scope rule, get a group of their own.
    """
    packages = dict(LIBRARIES)
    packages.update(APPLICATIONS)
    for type in TYPE_MAY_DEPEND_ON:
        native.package_group(
            name = "type_" + type.replace("-", "_"),
            packages = [p for p, lib in packages.items() if lib.type == type],
        )
    for scope in SCOPES:
        native.package_group(
            name = "scope_" + scope,
            packages = [p for p, lib in packages.items() if lib.scope == scope],
        )
    for type in TYPE_MAY_DEPEND_ON:
        for scope in SCOPES:
            native.package_group(
                name = dependents_group_name(type, scope),
                packages = [
                    p
                    for p, lib in packages.items()
                    if type in TYPE_MAY_DEPEND_ON[lib.type] and scope_may_depend_on(lib.scope, scope)
                ],
            )
