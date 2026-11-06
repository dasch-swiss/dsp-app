"""Libraries compiled with the Angular CLI app program's flags instead of the strict family.

A closed list: `vre_library` forces `strict`, `noImplicitOverride`,
`noPropertyAccessFromIndexSignature`, `noImplicitReturns` and `strictTemplates` on for every other
library, whatever its own tsconfig says, and turns them off for these. Each entry maps a
library's package to the Linear issue that removes it from this list.
"""

LOOSE_LIBRARIES = {
    "//libs/vre/pages/ontology/list": "pending: Linear issue created by the session",
    "//libs/vre/pages/project/project": "pending: Linear issue created by the session",
    "//libs/vre/resource-editor/resource-editor": "DEV-7796",
}
