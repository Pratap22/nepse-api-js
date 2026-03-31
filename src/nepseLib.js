import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Agent } from "undici";
import { DummyIDManager } from "./dummyIdUtils.js";
import {
  NepseInvalidClientRequest,
  NepseInvalidServerResponse,
  NepseNetworkError,
  NepseTokenExpired
} from "./errors.js";
import { TokenManager } from "./tokenUtils.js";

function isoDate(d) {
  return d.toISOString().slice(0, 10);
}

function readJson(relativePathFromSrc) {
  const currentDir = path.dirname(fileURLToPath(import.meta.url));
  const fullPath = path.resolve(currentDir, relativePathFromSrc);
  const data = readFileSync(fullPath, "utf-8");
  return JSON.parse(data);
}

export class Nepse {
  constructor() {
    this.baseUrl = "https://www.nepalstock.com";
    this.floorSheetSize = 500;
    this.tlsVerify = true;
    this.companySymbolIdKeymap = null;
    this.securitySymbolIdKeymap = null;
    this.companyList = null;
    this.securityList = null;
    this.sectorScrips = null;
    this.tokenManager = new TokenManager(this);
    this.dummyIdManager = new DummyIDManager({
      marketStatusFunction: () => this.getMarketStatus(),
      dateFunction: () => new Date()
    });
    this.apiEndpoints = readJson("../nepse/data/API_ENDPOINTS.json");
    this.dummyData = readJson("../nepse/data/DUMMY_DATA.json");
    this.headers = readJson("../nepse/data/HEADERS.json");
    this.headers.Host = this.baseUrl.replace("https://", "");
    this.headers.Referer = this.baseUrl.replace("https://", "");
    this.insecureFetchDispatcher = new Agent({
      connect: {
        rejectUnauthorized: false
      }
    });
  }

  setTLSVerification(flag) {
    this.tlsVerify = Boolean(flag);
  }

  getFullUrl(apiUrl) {
    return `${this.baseUrl}${apiUrl}`;
  }

  getFetchOptions(requestOptions) {
    if (!this.tlsVerify) {
      return {
        ...requestOptions,
        dispatcher: this.insecureFetchDispatcher
      };
    }
    return requestOptions;
  }

  async getAuthorizationHeaders() {
    const accessToken = await this.tokenManager.getAccessToken();
    return {
      Authorization: `Salter ${accessToken}`,
      "Content-Type": "application/json",
      ...this.headers
    };
  }

  handleResponseStatus(statusCode) {
    if (statusCode >= 200 && statusCode < 300) {
      return;
    }
    if (statusCode === 400) {
      throw new NepseInvalidClientRequest();
    }
    if (statusCode === 401) {
      throw new NepseTokenExpired();
    }
    if (statusCode === 502) {
      throw new NepseInvalidServerResponse();
    }
    throw new NepseNetworkError(`Request failed with status ${statusCode}`);
  }

  async requestGETAPI(url, includeAuthorizationHeaders = true) {
    try {
      const response = await fetch(this.getFullUrl(url), this.getFetchOptions({
        method: "GET",
        headers: includeAuthorizationHeaders ? await this.getAuthorizationHeaders() : this.headers
      }));
      this.handleResponseStatus(response.status);
      return await response.json();
    } catch (error) {
      console.log("Error in requestGETAPI", error);
      if (error instanceof NepseTokenExpired) {
        await this.tokenManager.update();
        return this.requestGETAPI(url, includeAuthorizationHeaders);
      }
      if (
        error instanceof TypeError ||
        error.cause?.code === "ECONNRESET" ||
        error.cause?.code === "UND_ERR_SOCKET"
      ) {
        return this.requestGETAPI(url, includeAuthorizationHeaders);
      }
      throw error;
    }
  }

  async requestPOSTAPI(url, payloadGenerator) {
    try {
      const response = await fetch(this.getFullUrl(url), this.getFetchOptions({
        method: "POST",
        headers: await this.getAuthorizationHeaders(),
        body: JSON.stringify({ id: await payloadGenerator() })
      }));
      this.handleResponseStatus(response.status);
      return await response.json();
    } catch (error) {
      if (error instanceof NepseTokenExpired) {
        await this.tokenManager.update();
        return this.requestPOSTAPI(url, payloadGenerator);
      }
      if (
        error instanceof TypeError ||
        error.cause?.code === "ECONNRESET" ||
        error.cause?.code === "UND_ERR_SOCKET"
      ) {
        return this.requestPOSTAPI(url, payloadGenerator);
      }
      throw error;
    }
  }

  async getPOSTPayloadIDForScrips() {
    const dummyId = await this.dummyIdManager.getDummyID();
    const day = new Date().getDate();
    return this.dummyData[dummyId] + dummyId + 2 * day;
  }

  async getPOSTPayloadID() {
    const e = await this.getPOSTPayloadIDForScrips();
    await this.tokenManager.update();
    const i = e % 10 < 5 ? 3 : 1;
    const day = new Date().getDate();
    return e + this.tokenManager.salts[i] * day - this.tokenManager.salts[i - 1];
  }

  async getPOSTPayloadIDForFloorSheet() {
    const e = await this.getPOSTPayloadIDForScrips();
    await this.tokenManager.update();
    const i = e % 10 < 4 ? 1 : 3;
    const day = new Date().getDate();
    return e + this.tokenManager.salts[i] * day - this.tokenManager.salts[i - 1];
  }

  async getMarketStatus() {
    return this.requestGETAPI(this.apiEndpoints.nepse_open_url);
  }

  async getPriceVolume() {
    return this.requestGETAPI(this.apiEndpoints.price_volume_url);
  }

  async getSummary() {
    return this.requestGETAPI(this.apiEndpoints.summary_url);
  }

  async getTopTenTradeScrips() {
    return this.requestGETAPI(this.apiEndpoints.top_ten_trade_url);
  }

  async getTopTenTransactionScrips() {
    return this.requestGETAPI(this.apiEndpoints.top_ten_transaction_url);
  }

  async getTopTenTurnoverScrips() {
    return this.requestGETAPI(this.apiEndpoints.top_ten_turnover_url);
  }

  async getSupplyDemand() {
    return this.requestGETAPI(this.apiEndpoints.supply_demand_url);
  }

  async getTopGainers() {
    return this.requestGETAPI(this.apiEndpoints.top_gainers_url);
  }

  async getTopLosers() {
    return this.requestGETAPI(this.apiEndpoints.top_losers_url);
  }

  async isNepseOpen() {
    return this.requestGETAPI(this.apiEndpoints.nepse_open_url);
  }

  async getNepseIndex() {
    return this.requestGETAPI(this.apiEndpoints.nepse_index_url);
  }

  async getNepseSubIndices() {
    return this.requestGETAPI(this.apiEndpoints.nepse_subindices_url);
  }

  async getLiveMarket() {
    return this.requestGETAPI(this.apiEndpoints["live-market"]);
  }

  async getPriceVolumeHistory(businessDate = null) {
    const url = `${this.apiEndpoints.todays_price}?&size=500&businessDate=${businessDate}`;
    return this.requestPOSTAPI(url, () => this.getPOSTPayloadIDForFloorSheet());
  }

  async getDailyNepseIndexGraph() {
    return this.requestPOSTAPI(this.apiEndpoints.nepse_index_daily_graph, () => this.getPOSTPayloadID());
  }

  async getDailySensitiveIndexGraph() {
    return this.requestPOSTAPI(this.apiEndpoints.sensitive_index_daily_graph, () => this.getPOSTPayloadID());
  }

  async getDailyFloatIndexGraph() {
    return this.requestPOSTAPI(this.apiEndpoints.float_index_daily_graph, () => this.getPOSTPayloadID());
  }

  async getDailySensitiveFloatIndexGraph() {
    return this.requestPOSTAPI(this.apiEndpoints.sensitive_float_index_daily_graph, () => this.getPOSTPayloadID());
  }

  async getDailyBankSubindexGraph() {
    return this.requestPOSTAPI(this.apiEndpoints.banking_sub_index_graph, () => this.getPOSTPayloadID());
  }

  async getDailyDevelopmentBankSubindexGraph() {
    return this.requestPOSTAPI(this.apiEndpoints.development_bank_sub_index_graph, () => this.getPOSTPayloadID());
  }

  async getDailyFinanceSubindexGraph() {
    return this.requestPOSTAPI(this.apiEndpoints.finance_sub_index_graph, () => this.getPOSTPayloadID());
  }

  async getDailyHotelTourismSubindexGraph() {
    return this.requestPOSTAPI(this.apiEndpoints.hotel_tourism_sub_index_graph, () => this.getPOSTPayloadID());
  }

  async getDailyHydroSubindexGraph() {
    return this.requestPOSTAPI(this.apiEndpoints.hydro_sub_index_graph, () => this.getPOSTPayloadID());
  }

  async getDailyInvestmentSubindexGraph() {
    return this.requestPOSTAPI(this.apiEndpoints.investment_sub_index_graph, () => this.getPOSTPayloadID());
  }

  async getDailyLifeInsuranceSubindexGraph() {
    return this.requestPOSTAPI(this.apiEndpoints.life_insurance_sub_index_graph, () => this.getPOSTPayloadID());
  }

  async getDailyManufacturingSubindexGraph() {
    return this.requestPOSTAPI(this.apiEndpoints.manufacturing_sub_index_graph, () => this.getPOSTPayloadID());
  }

  async getDailyMicrofinanceSubindexGraph() {
    return this.requestPOSTAPI(this.apiEndpoints.microfinance_sub_index_graph, () => this.getPOSTPayloadID());
  }

  async getDailyMutualfundSubindexGraph() {
    return this.requestPOSTAPI(this.apiEndpoints.mutual_fund_sub_index_graph, () => this.getPOSTPayloadID());
  }

  async getDailyNonLifeInsuranceSubindexGraph() {
    return this.requestPOSTAPI(this.apiEndpoints.non_life_insurance_sub_index_graph, () => this.getPOSTPayloadID());
  }

  async getDailyOthersSubindexGraph() {
    return this.requestPOSTAPI(this.apiEndpoints.others_sub_index_graph, () => this.getPOSTPayloadID());
  }

  async getDailyTradingSubindexGraph() {
    return this.requestPOSTAPI(this.apiEndpoints.trading_sub_index_graph, () => this.getPOSTPayloadID());
  }

  async getCompanyList() {
    console.log("Getting company list");
    this.companyList = await this.requestGETAPI(this.apiEndpoints.company_list_url);
    return [...this.companyList];
  }

  async getSecurityList() {
    this.securityList = await this.requestGETAPI(this.apiEndpoints.security_list_url);
    return [...this.securityList];
  }

  async getSectorScrips() {
    if (!this.sectorScrips) {
      const companyInfoDict = Object.fromEntries((await this.getCompanyList()).map((c) => [c.symbol, c]));
      const sectorScrips = {};
      for (const securityInfo of await this.getSecurityList()) {
        const symbol = securityInfo.symbol;
        if (companyInfoDict[symbol]) {
          const sectorName = companyInfoDict[symbol].sectorName;
          if (!sectorScrips[sectorName]) sectorScrips[sectorName] = [];
          sectorScrips[sectorName].push(symbol);
        } else {
          if (!sectorScrips["Promoter Share"]) sectorScrips["Promoter Share"] = [];
          sectorScrips["Promoter Share"].push(symbol);
        }
      }
      this.sectorScrips = sectorScrips;
    }
    return { ...this.sectorScrips };
  }

  async getCompanyIDKeyMap(forceUpdate = false) {
    if (!this.companySymbolIdKeymap || forceUpdate) {
      const companyList = await this.getCompanyList();
      this.companySymbolIdKeymap = Object.fromEntries(companyList.map((company) => [company.symbol, company.id]));
    }
    return this.companySymbolIdKeymap;
  }

  async getSecurityIDKeyMap(forceUpdate = false) {
    if (!this.securitySymbolIdKeymap || forceUpdate) {
      const securityList = await this.getSecurityList();
      this.securitySymbolIdKeymap = Object.fromEntries(securityList.map((security) => [security.symbol, security.id]));
    }
    return this.securitySymbolIdKeymap;
  }

  async getCompanyPriceVolumeHistory(symbol, startDate = null, endDate = null) {
    const normalizedSymbol = symbol.toUpperCase();
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(end.getTime() - 365 * 24 * 60 * 60 * 1000);
    const companyId = (await this.getSecurityIDKeyMap())[normalizedSymbol];
    const url = `${this.apiEndpoints.company_price_volume_history}${companyId}?&size=500&startDate=${isoDate(start)}&endDate=${isoDate(end)}`;
    const response = await this.requestGETAPI(url);
    return response.content ?? response;
  }

  async getDailyScripPriceGraph(symbol) {
    const normalizedSymbol = symbol.toUpperCase();
    const companyId = (await this.getSecurityIDKeyMap())[normalizedSymbol];
    return this.requestPOSTAPI(`${this.apiEndpoints.company_daily_graph}${companyId}`, () => this.getPOSTPayloadIDForScrips());
  }

  async getCompanyDetails(symbol) {
    const normalizedSymbol = symbol.toUpperCase();
    const companyId = (await this.getSecurityIDKeyMap())[normalizedSymbol];
    return this.requestPOSTAPI(`${this.apiEndpoints.company_details}${companyId}`, () => this.getPOSTPayloadIDForScrips());
  }

  async getFloorSheet() {
    const url = `${this.apiEndpoints.floor_sheet}?&size=${this.floorSheetSize}&sort=contractId,desc`;
    const sheet = await this.requestPOSTAPI(url, () => this.getPOSTPayloadIDForFloorSheet());
    const floorSheets = sheet.floorsheets.content;
    const maxPage = sheet.floorsheets.totalPages;
    for (let page = 1; page < maxPage; page += 1) {
      const pageSheet = await this.requestPOSTAPI(`${url}&page=${page}`, () => this.getPOSTPayloadIDForFloorSheet());
      floorSheets.push(...pageSheet.floorsheets.content);
    }
    return floorSheets;
  }

  async getFloorSheetOf(symbol, businessDate = null) {
    const normalizedSymbol = symbol.toUpperCase();
    const companyId = (await this.getSecurityIDKeyMap())[normalizedSymbol];
    const business = businessDate ? isoDate(new Date(businessDate)) : isoDate(new Date());
    const url = `${this.apiEndpoints.company_floorsheet}${companyId}?&businessDate=${business}&size=${this.floorSheetSize}&sort=contractid,desc`;
    const sheet = await this.requestPOSTAPI(url, () => this.getPOSTPayloadIDForFloorSheet());
    if (!sheet) {
      return [];
    }
    const floorSheets = [...sheet.floorsheets.content];
    for (let page = 1; page < sheet.floorsheets.totalPages; page += 1) {
      const nextSheet = await this.requestPOSTAPI(`${url}&page=${page}`, () => this.getPOSTPayloadIDForFloorSheet());
      floorSheets.push(...nextSheet.floorsheets.content);
    }
    return floorSheets;
  }

  async getSymbolMarketDepth(symbol) {
    const normalizedSymbol = symbol.toUpperCase();
    const companyIdMap = await this.getSecurityIDKeyMap();
    const url = `${this.apiEndpoints["market-depth"]}${companyIdMap[normalizedSymbol]}/`;
    return this.requestGETAPI(url);
  }
}
