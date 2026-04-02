# NepseUnofficialApi JS - Nepse Response Structures

This file documents the response *structure* (type + key fields) returned by the `Nepse` class methods in `src/nepseLib.js`.

Notes
- All methods are `async` and return Promises.
- Response shapes come from live smoke tests against `https://www.nepalstock.com` using symbol `NABIL`.
- Field sets can change over time; treat `keys` lists as “observed today”.
- `getFloorSheetOf()` may return `403` depending on NEPSE session/permissions.

## General errors
- HTTP `400` => throws `NepseInvalidClientRequest`
- HTTP `401` => throws `NepseTokenExpired` (client refreshes & retries inside request helpers)
- HTTP `502` => throws `NepseInvalidServerResponse`
- Other non-2xx => throws `NepseNetworkError`

## Method -> response structure (observed)

### `getMarketStatus()`
- Type: `object`
- Keys: `isOpen`, `asOf`, `id`

Example:
```json
{
  "isOpen": "OPEN",
  "asOf": "2026-04-02T12:22:25.746796",
  "id": 80
}
```

### `getPriceVolume()`
- Type: (not fully enumerated here)
- Origin: `POST`-less GET endpoint `/api/nots/securityDailyTradeStat/58` (see `API_ENDPOINTS.json`)

Example (array with 1 item):
```json
[
  {
    "securityId": "2790",
    "securityName": "Aarambha Chautari Laghubitta Bittiya Sanstha Limited",
    "symbol": "ACLBSL",
    "indexId": 58,
    "totalTradeQuantity": 235,
    "lastTradedPrice": 1019.2,
    "percentageChange": -2.468899522,
    "previousClose": 1045,
    "closePrice": null
  }
]
```

### `getSummary()`
- Type: `array`
- First item keys: `detail`, `value`
- Observed length: `4`

Example (array with 1 item):
```json
[
  {
    "detail": "Total Turnover Rs:",
    "value": 3570416841.29
  }
]
```

### `getTopTenTradeScrips()`
- Type: `array`
- Observed length: `~311`

Example (array with 1 item):
```json
[
  {
    "symbol": "KBL",
    "shareTraded": 493175,
    "closingPrice": 224,
    "securityName": "Kumari Bank Limited",
    "securityId": 142
  }
]
```

### `getTopTenTransactionScrips()`
- Type: `array`
- Observed length: `~311`

Example (array with 1 item):
```json
[
  {
    "securityId": 9311,
    "totalTrades": 3034,
    "lastTradedPrice": 661.2,
    "securityName": "Solu Hydropower Limited",
    "symbol": "SOHL"
  }
]
```

### `getTopTenTurnoverScrips()`
- Type: `array`
- Observed length: `~311`

Example (array with 1 item):
```json
[
  {
    "symbol": "SYPNL",
    "turnover": 202862450.8,
    "closingPrice": 1845,
    "securityName": "SY Panel Nepal Limited",
    "securityId": 9303
  }
]
```

### `getSupplyDemand()`
- Type: `object`
- Keys: `supplyList`, `demandList`

Example:
```json
{
  "supplyList": [
    {
      "totalQuantity": 741239,
      "totalOrder": 10,
      "securityId": 9254,
      "symbol": "NMBHF2",
      "securityName": "NMB Hybrid Fund L- II"
    }
  ],
  "demandList": [
    {
      "totalQuantity": 608297,
      "totalOrder": 6,
      "securityId": 8111,
      "symbol": "HIDCLP",
      "securityName": "Hydorelectricity Investment and Development Company Limited Promoter"
    }
  ]
}
```

### `getTopGainers()`
- Type: `array`
- First item keys: `symbol`, `ltp`, `cp`, `pointChange`, `percentageChange`, `securityName`, `securityId`

Example (array with 1 item):
```json
[
  {
    "symbol": "RSML",
    "ltp": 3241.9,
    "cp": 0,
    "pointChange": 294.7,
    "percentageChange": 10,
    "securityName": "Reliance Spinning Mills Limited",
    "securityId": 9306
  }
]
```

### `getTopLosers()`
- Type: `array`
- First item keys: `symbol`, `ltp`, `cp`, `pointChange`, `percentageChange`, `securityName`, `securityId`

Example (array with 1 item):
```json
[
  {
    "symbol": "JHAPA",
    "ltp": 1340.4,
    "cp": 0,
    "pointChange": -74.6,
    "percentageChange": -5.27,
    "securityName": "Jhapa Energy Limited",
    "securityId": 9300
  }
]
```

### `isNepseOpen()`
- Type: `object` (same endpoint shape as `getMarketStatus()`)

Example:
```json
{
  "isOpen": "OPEN",
  "asOf": "2026-04-02T12:22:25.746796",
  "id": 80
}
```

### `getNepseIndex()`
- Type: `array`
- Elements are index summary objects (see `getNepseSubIndices()` for common fields)

Example (array with 1 item):
```json
[
  {
    "id": 63,
    "auditId": null,
    "exchangeIndexId": null,
    "generatedTime": "2026-04-02T12:22:27.603",
    "index": "Sensitive Float Index",
    "close": 161.95,
    "high": 162.4281,
    "low": 159.7846,
    "previousClose": 161.9493,
    "change": 0.14,
    "perChange": 0.09,
    "fiftyTwoWeekHigh": 177.31,
    "fiftyTwoWeekLow": 147.61,
    "currentValue": 162.09
  }
]
```

### `getNepseSubIndices()`
- Type: `array`
- Element keys observed include: `id`, `index`, `change`, `perChange`, `currentValue`

Example (array with 1 item):
```json
[
  {
    "id": 55,
    "index": "Development Bank Index",
    "change": 3.57,
    "perChange": 0.05,
    "currentValue": 5972.31
  }
]
```

### `getLiveMarket()`
- Type: `array` (large)
- Observed length: `~310`

Example (array with 1 item):
```json
[
  {
    "securityId": "9140",
    "securityName": "Unique Nepal Laghubitta Bittiya Sanstha Limited",
    "symbol": "UNLB",
    "indexId": 58,
    "openPrice": 1690,
    "highPrice": 1690,
    "lowPrice": 1660.2,
    "totalTradeQuantity": 1651,
    "totalTradeValue": 2751559.5,
    "lastTradedPrice": 1670,
    "percentageChange": -1.42,
    "lastUpdatedDateTime": "2026-04-02 12:22:33.837549",
    "lastTradedVolume": 10,
    "previousClose": 1694,
    "averageTradedPrice": 1666.6
  }
]
```

---

## Graph / time-series endpoints

### `getPriceVolumeHistory(businessDate = today)`
- Type: `object` (Spring-style pageable wrapper)
- Top-level keys observed:
  - `content`, `pageable`, `last`, `totalPages`, `totalElements`, `size`, `number`, `sort`, `first`, `numberOfElements`, `empty`
- First item keys in `content` observed:
  - `id`, `businessDate`, `securityId`, `symbol`, `securityName`, `openPrice`, `highPrice`, `lowPrice`, `closePrice`,
  - `totalTradedQuantity`, `totalTradedValue`, `previousDayClosePrice`, `fiftyTwoWeekHigh`, `fiftyTwoWeekLow`,
  - `lastUpdatedTime`, `lastUpdatedPrice`, `totalTrades`, `averageTradedPrice`, `marketCapitalization`

Example (shows only `content` with 1 item):
```json
{
  "content": [
    {
      "id": null,
      "businessDate": "2026-04-02",
      "securityId": 2790,
      "symbol": "ACLBSL",
      "securityName": "Aarambha Chautari Laghubitta Bittiya Sanstha Limited",
      "openPrice": 1040,
      "highPrice": 1040,
      "lowPrice": 1019.2,
      "closePrice": null,
      "totalTradedQuantity": 235,
      "totalTradedValue": 241376,
      "previousDayClosePrice": 1045,
      "fiftyTwoWeekHigh": 1240,
      "fiftyTwoWeekLow": 900,
      "lastUpdatedTime": "2026-04-02T11:53:07.937468",
      "lastUpdatedPrice": 1019.2,
      "totalTrades": 8,
      "averageTradedPrice": 1027.13,
      "marketCapitalization": null
    }
  ]
}
```

### Daily index graph methods
`getDailyNepseIndexGraph()`, `getDailySensitiveIndexGraph()`, `getDailyFloatIndexGraph()`, `getDailySensitiveFloatIndexGraph()`
`getDailyBankSubindexGraph()`, `getDailyDevelopmentBankSubindexGraph()`, `getDailyFinanceSubindexGraph()`,
`getDailyHotelTourismSubindexGraph()`, `getDailyHydroSubindexGraph()`, `getDailyInvestmentSubindexGraph()`,
`getDailyLifeInsuranceSubindexGraph()`, `getDailyManufacturingSubindexGraph()`, `getDailyMicrofinanceSubindexGraph()`,
`getDailyMutualfundSubindexGraph()`, `getDailyNonLifeInsuranceSubindexGraph()`, `getDailyOthersSubindexGraph()`,
`getDailyTradingSubindexGraph()`

- Type: `array`
- Each element is a point tuple:
  - `[timestamp, value]` (observed as numbers)

Example (array with 1 point):
```json
[
  [
    1775106300,
    2770.82
  ]
]
```

---

## Company / security list endpoints

### `getCompanyList()`
- Type: `array`
- First item keys observed:
  - `id`, `companyName`, `symbol`, `securityName`, `status`, `companyEmail`, `website`, `sectorName`,
  - `regulatoryBody`, `instrumentType`
- Observed length: `~624`

Example (array with 1 item):
```json
[
  {
    "id": 131,
    "companyName": "Nabil Bank Limited",
    "symbol": "NABIL",
    "securityName": "Nabil Bank Limited",
    "status": "A",
    "companyEmail": "company.affairs@nabilbank.com",
    "website": "www.nabilbank.com",
    "sectorName": "Commercial Banks",
    "regulatoryBody": "Nepal Rastra Bank",
    "instrumentType": "Equity"
  }
]
```

### `getSecurityList()`
- Type: `array`
- First item keys observed:
  - `id`, `symbol`, `securityName`, `name`, `activeStatus`
- Observed length: `~552`

Example (array with 1 item):
```json
[
  {
    "id": 9192,
    "symbol": "USHL",
    "securityName": "Upper Syange Hydropower Limited",
    "name": "(USHL) Upper Syange Hydropower Limited",
    "activeStatus": "A"
  }
]
```

### `getSectorScrips()`
- Type: `object`
- Shape: `{ [sectorName]: string[] }`

Example:
```json
{
  "Hydro Power": [
    "USHL"
  ]
}
```

### `getCompanyIDKeyMap(forceUpdate = false)`
- Type: `object`
- Shape: `{ [symbol]: companyId }`

Example:
```json
{
  "NABIL": 131
}
```

### `getSecurityIDKeyMap(forceUpdate = false)`
- Type: `object`
- Shape: `{ [symbol]: securityId }`

Example:
```json
{
  "USHL": 9192
}
```

---

## Symbol-based endpoints

### `getDailyScripPriceGraph(symbol)`
- Type: `array`
- First item keys observed:
  - `contractQuantity`, `contractRate`, `time`

Example (array with 1 item):
```json
[
  {
    "contractQuantity": null,
    "contractRate": 512.6,
    "time": 1775106060
  }
]
```

### `getCompanyHistoricalGraphData(symbol)`
- Type: `array`
- First item keys observed include:
  - `businessDate`, `openPrice`, `highPrice`, `lowPrice`, `previousDayClosePrice`, `fiftyTwoWeekHigh`,
  - `lastTradedPrice`, `totalTradedQuantity`, `closePrice`

Example (array with 1 item):
```json
[
  {
    "businessDate": "2025-04-03",
    "openPrice": 491,
    "highPrice": 494,
    "lowPrice": 486.1,
    "previousDayClosePrice": 485.26,
    "fiftyTwoWeekHigh": 700,
    "lastTradedPrice": 490,
    "totalTradedQuantity": 42041,
    "closePrice": 488.73
  }
]
```

### `getCompanyDetails(symbol)`
- Type: `object`
- Top-level keys observed:
  - `securityDailyTradeDto`, `security`, `stockListedShares`, `paidUpCapital`, `issuedCapital`,
    `marketCapitalization`, `publicShares`, `publicPercentage`, `promoterShares`, `promoterPercentage`,
    `updatedDate`, `securityId`
- `securityDailyTradeDto` keys observed:
  - `securityId`, `openPrice`, `highPrice`, `lowPrice`, `totalTradeQuantity`, `totalTrades`,
    `lastTradedPrice`, `previousClose`, `businessDate`, `closePrice`, `fiftyTwoWeekHigh`, `fiftyTwoWeekLow`,
    `lastUpdatedDateTime`

Example (subset):
```json
{
  "securityDailyTradeDto": {
    "securityId": "131",
    "openPrice": 512.6,
    "highPrice": 522,
    "lowPrice": 512,
    "totalTradeQuantity": 35628,
    "totalTrades": 323,
    "lastTradedPrice": 521,
    "previousClose": 523,
    "businessDate": "2026-04-02",
    "closePrice": 0,
    "fiftyTwoWeekHigh": 562,
    "fiftyTwoWeekLow": 471,
    "lastUpdatedDateTime": "2026-04-02T12:21:22.274756"
  },
  "securityId": 131,
  "security": {
    "id": 131,
    "symbol": "NABIL",
    "isin": "NPE025A00004",
    "permittedToTrade": "Y",
    "listingDate": "1985-11-24",
    "instrumentType": {
      "id": 1,
      "code": "EQ",
      "description": "Equity"
    }
  }
}
```

### `getCompanyPriceVolumeHistory(symbol, startDate = null, endDate = null)`
- Type: `array`
- Example (array with 1 item):
```json
[
  {
    "businessDate": "2026-04-01",
    "totalTrades": 628,
    "totalTradedQuantity": 70913,
    "totalTradedValue": 37157925.3,
    "highPrice": 531,
    "lowPrice": 520,
    "closePrice": 523
  }
]
```

### `getSymbolMarketDepth(symbol)`
- Type: `object`
- Keys: `totalBuyQty`, `marketDepth`, `totalSellQty`
- Inside `marketDepth` keys observed:
  - `buyMarketDepthList`, `sellMarketDepthList`
- First `buyMarketDepthList` item keys observed:
  - `stockId`, `orderBookOrderPrice`, `quantity`, `orderCount`, `isBuy`, `buy`, `sell`

Example (subset):
```json
{
  "totalBuyQty": 60053,
  "totalSellQty": 19074,
  "marketDepth": {
    "buyMarketDepthList": [
      {
        "stockId": 131,
        "orderBookOrderPrice": 521,
        "quantity": 79,
        "orderCount": 2,
        "isBuy": 1,
        "buy": true,
        "sell": false
      }
    ],
    "sellMarketDepthList": [
      {
        "stockId": 131,
        "orderBookOrderPrice": 522,
        "quantity": 1016,
        "orderCount": 6,
        "isBuy": 2,
        "buy": false,
        "sell": true
      }
    ]
  }
}
```

### `getCorporateActions(symbol)`
- Type: `array`
- First item keys observed:
  - `activeStatus`, `authorizationComments`, `submittedDate`, `filePath`, `documentId`, `ratioNum`, `ratioDen`,
    `cashDividend`, `fiscalYear`, `rightAmountPerShare`, `bonusPercentage`, `rightPercentage`, `sdId`

Example (array with 1 item):
```json
[
  {
    "activeStatus": "BONUS_APPROVED",
    "authorizationComments": null,
    "submittedDate": "2023-01-01T16:44:36.527",
    "filePath": "",
    "documentId": 1,
    "ratioNum": 185000,
    "ratioDen": 1000000,
    "cashDividend": null,
    "fiscalYear": "2079-2080",
    "rightAmountPerShare": null,
    "bonusPercentage": 18.5,
    "rightPercentage": null,
    "sdId": 539
  }
]
```

### `getDividends(symbol)`
- Type: `array`
- First item keys observed:
  - `id`, `activeStatus`, `modifiedBy`, `modifiedDate`, `applicationType`, `applicationStatus`,
    `companyNews`, `fiscalReport`, `applicationDocumentDetailsList`

Example (array with 1 item, subset):
```json
[
  {
    "id": 43312,
    "activeStatus": "A",
    "modifiedBy": "nabaraj_listing",
    "modifiedDate": "2025-12-07T09:20:48.573",
    "applicationType": 39,
    "applicationStatus": 3,
    "fiscalReport": null,
    "companyNews": {
      "id": 68898,
      "newsSource": "Letter",
      "newsType": "Dividend Declaration",
      "newsHeadline": "Declaration of Cash Dividend -Nabil Bank Limited [NABIL] ",
      "security": {
        "id": 131,
        "symbol": "NABIL",
        "isin": "NPE025A00004"
      }
    }
  }
]
```

---

## Floorsheet endpoints

### `getFloorSheet()`
- Type: `array`
- Implementation downloads all pages and returns `floorSheets`:
  - Observed page 0 `floorsheets.content` length: `500`
  - Returned total length observed earlier: `~39500`
- First item keys observed (page 0):
  - `contractId`, `stockSymbol`, `buyerMemberId`, `sellerMemberId`, `contractQuantity`, `contractRate`,
    `contractAmount`, `businessDate`, `tradeBookId`, `stockId`, `buyerBrokerName`, `sellerBrokerName`,
    `tradeTime`, `securityName`

Example (array with 1 item, first page):
```json
[
  {
    "contractId": 2026040204012515,
    "stockSymbol": "AKJCL",
    "buyerMemberId": null,
    "sellerMemberId": null,
    "contractQuantity": 6,
    "contractRate": 379,
    "contractAmount": 2274,
    "businessDate": "2026-04-02",
    "tradeBookId": 184654884,
    "stockId": 2788,
    "buyerBrokerName": null,
    "sellerBrokerName": null,
    "tradeTime": "2026-04-02T12:22:25.746796",
    "securityName": "Ankhu Khola Jalvidhyut Company Ltd"
  }
]
```

### `getFloorSheetOf(symbol, businessDate = today)`
- May fail with: `NepseNetworkError: Request failed with status 403`
- When it works: expected type is `array` of floor-sheet entries.

Example (array with 1 item; shape matches `getFloorSheet()` entries):
```json
[
  {
    "contractId": 2026040204012515,
    "stockSymbol": "AKJCL",
    "buyerMemberId": null,
    "sellerMemberId": null,
    "contractQuantity": 6,
    "contractRate": 379,
    "contractAmount": 2274,
    "businessDate": "2026-04-02",
    "tradeBookId": 184654884,
    "stockId": 2788,
    "buyerBrokerName": null,
    "sellerBrokerName": null,
    "tradeTime": "2026-04-02T12:22:25.746796",
    "securityName": "Ankhu Khola Jalvidhyut Company Ltd"
  }
]
```

