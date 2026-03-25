# Test Data Guidelines

## Overview

This directory contains test data used by dsp-js unit tests. The data is organized by API version and endpoint.

## Test Data Workflow

### Generated Test Data (Legacy)

The test data in `api/` directories (e.g., `api/v2/lists/`, `api/admin/`) was originally generated from real API responses. **This data is no longer regenerated.**

**Important:** Do not modify generated test data files to match new API response formats. These files represent historical API responses and may be used by multiple tests.

### Manually-Generated Test Data

When you need test data that reflects current API behavior or tests specific scenarios not covered by the legacy data:

1. Create new test data files in the `manually-generated/` subdirectory within the appropriate API version folder (e.g., `api/v2/manually-generated/`)
2. Name the file descriptively to indicate its purpose (e.g., `treelist-with-comments.json`)
3. Document the scenario being tested in a comment or in the test file itself

### When to Use Each Approach

| Scenario | Approach |
|----------|----------|
| Existing tests pass with legacy data | Keep using legacy data |
| API response format changed | Add new manually-generated test data |
| Testing new features not in legacy data | Add new manually-generated test data |
| Testing edge cases | Add new manually-generated test data |

### Example

If the API now returns comments in a different format than the legacy test data:

```
test/data/api/v2/
├── lists/
│   ├── treelist.json          # Legacy - do not modify
│   └── listnode.json          # Legacy - do not modify
└── manually-generated/
    └── treelist-with-comments.json  # New test data for comment parsing
```

Then in your test file:

```typescript
// Use legacy data for basic functionality tests
it('should return a list', done => {
  const data = require('../../../../test/data/api/v2/lists/treelist.json');
  // ...
});

// Use manually-generated data for new/changed features
describe('comments parsing', () => {
  it('should parse comments', done => {
    const data = require('../../../../test/data/api/v2/manually-generated/treelist-with-comments.json');
    // ...
  });
});
```
