"""ADR-0001's dependency rules as Bazel visibility: who may depend on a library of a given type and scope.

`vre_library` takes the visibility of a library from `library_visibility(type, scope)`. The
package groups it names are declared in `tools/angular/BUILD.bazel` from `LIBRARIES`.
"""

# Off until every library carries its type and scope; vre_library then applies the computed
# visibility instead of //visibility:public.
ENFORCE_VISIBILITY = False

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
# scope are written: vre_library reads its own entry.
LIBRARIES = {
    "//libs/vre/3rd-party-services/analytics": struct(type = "data-access", scope = "shared"),
    "//libs/vre/3rd-party-services/api": struct(type = "data-access", scope = "shared"),
    "//libs/vre/3rd-party-services/open-api": struct(type = "data-access", scope = "shared"),
    "//libs/vre/core/config": struct(type = "data-access", scope = "shared"),
    "//libs/vre/core/error-handler": struct(type = "data-access", scope = "shared"),
    "//libs/vre/core/session": struct(type = "data-access", scope = "shared"),
    "//libs/vre/shared/app-common": struct(type = "data-access", scope = "shared"),
    "//libs/vre/shared/app-help-page": struct(type = "feature", scope = "shared"),
    "//libs/vre/shared/app-helper-services": struct(type = "data-access", scope = "shared"),
    "//libs/vre/shared/calendar": struct(type = "util", scope = "shared"),
    "//libs/vre/ui/date-picker": struct(type = "ui", scope = "shared"),
    "//libs/vre/ui/notification": struct(type = "util", scope = "shared"),
    "//libs/vre/ui/progress-indicator": struct(type = "ui", scope = "shared"),
    "//libs/vre/ui/string-literal": struct(type = "ui", scope = "shared"),
    "//libs/vre/ui/ui": struct(type = "ui", scope = "shared"),
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

def library_visibility(type, scope):
    """The visibility of a library: the packages whose type and scope may depend on it."""
    return [Label("//tools/angular:" + dependents_group_name(type, scope))]

def declare_package_groups():
    """One group per type tier, one per scope, and one per type and scope listing its dependents.

    Bazel visibility is a union of groups, so the dependents of a library, which must satisfy
    both the type and the scope rule, get a group of their own.
    """
    for type in TYPE_MAY_DEPEND_ON:
        native.package_group(
            name = "type_" + type.replace("-", "_"),
            packages = [p for p, lib in LIBRARIES.items() if lib.type == type],
        )
    for scope in SCOPES:
        native.package_group(
            name = "scope_" + scope,
            packages = [p for p, lib in LIBRARIES.items() if lib.scope == scope],
        )
    for type in TYPE_MAY_DEPEND_ON:
        for scope in SCOPES:
            native.package_group(
                name = dependents_group_name(type, scope),
                packages = [
                    p
                    for p, lib in LIBRARIES.items()
                    if type in TYPE_MAY_DEPEND_ON[lib.type] and scope_may_depend_on(lib.scope, scope)
                ],
            )
