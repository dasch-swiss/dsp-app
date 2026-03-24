# @dasch-swiss/dsp-js

TypeScript client library for DSP-API (Digital Scholarly Publishing API).

## Overview

This library provides a JavaScript/TypeScript interface for interacting with DSP-API. It's framework-agnostic and works with Angular, React, Vue.js, etc.

## Installation

```bash
npm install @dasch-swiss/dsp-js
```

## Usage

```typescript
import { KnoraApiConnection, KnoraApiConfig } from '@dasch-swiss/dsp-js';

const config = new KnoraApiConfig('https', 'api.example.com', 443);
const connection = new KnoraApiConnection(config);

// Authentication
connection.v2.auth.login('username', identifier, 'password').subscribe(response => {
  console.log('Logged in:', response);
});

// Fetch resources
connection.v2.res.getResource(resourceIri).subscribe(resource => {
  console.log('Resource:', resource);
});
```

## API Documentation

See the [DSP-API documentation](https://docs.dasch.swiss/) for full API reference.

## License

AGPL-3.0
