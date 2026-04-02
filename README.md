# NepseUnofficialApi (JavaScript)

JavaScript/Node.js port of the original Python `NepseUnofficialApi` project for interfacing with `nepalstock.com`.

## Install

```bash
npm install
```

## Usage

```js
import { Nepse } from "./src/index.js";

const nepse = new Nepse();
nepse.setTLSVerification(false);

const companyList = await nepse.getCompanyList();
console.log(companyList.length);
```

Run the included demo script:

```bash
npm run demo
```

## API Surface

The `Nepse` class mirrors the original Python library methods, including:

- market status/summary endpoints
- top gainers/losers/trade/turnover/transaction endpoints
- index and sub-index graph endpoints
- company/security list and ID maps
- floorsheet and symbol-specific floorsheet
- symbol market depth

All methods are async and return Promises.

## API Reference

Response structures for each `Nepse` method live here: `src/nepseLib.response-examples.md`.

## Notes

- Requires Node.js `18+` (uses built-in `fetch` and `WebAssembly`).
- Token decoding uses the upstream `css.wasm` file included in `nepse/data/css.wasm`.
- TLS verification toggle is preserved as an API flag for compatibility, but Node fetch uses system TLS behavior.

