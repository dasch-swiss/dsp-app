"""Libraries allowed to compile with their own tsconfig's `strict` flags off.

A closed list: `vre_library` reads it, and no other switch turns the flags off. Each entry maps a
library's package to the Linear issue that removes it from this list.
"""

LOOSE_LIBRARIES = {
}
