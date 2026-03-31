import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

class TokenParser {
  constructor() {
    this.instancePromise = null;
  }

  async getInstance() {
    if (!this.instancePromise) {
      const currentDir = path.dirname(fileURLToPath(import.meta.url));
      const wasmPath = path.resolve(currentDir, "../nepse/data/css.wasm");
      this.instancePromise = readFile(wasmPath).then((bytes) => WebAssembly.instantiate(bytes));
    }
    const { instance } = await this.instancePromise;
    return instance;
  }

  async parseTokenResponse(tokenResponse) {
    const instance = await this.getInstance();
    const ex = instance.exports;

    const n = ex.cdx(tokenResponse.salt1, tokenResponse.salt2, tokenResponse.salt3, tokenResponse.salt4, tokenResponse.salt5);
    const l = ex.rdx(tokenResponse.salt1, tokenResponse.salt2, tokenResponse.salt4, tokenResponse.salt3, tokenResponse.salt5);
    const o = ex.bdx(tokenResponse.salt1, tokenResponse.salt2, tokenResponse.salt4, tokenResponse.salt3, tokenResponse.salt5);
    const p = ex.ndx(tokenResponse.salt1, tokenResponse.salt2, tokenResponse.salt4, tokenResponse.salt3, tokenResponse.salt5);
    const q = ex.mdx(tokenResponse.salt1, tokenResponse.salt2, tokenResponse.salt4, tokenResponse.salt3, tokenResponse.salt5);

    const a = ex.cdx(tokenResponse.salt2, tokenResponse.salt1, tokenResponse.salt3, tokenResponse.salt5, tokenResponse.salt4);
    const b = ex.rdx(tokenResponse.salt2, tokenResponse.salt1, tokenResponse.salt3, tokenResponse.salt4, tokenResponse.salt5);
    const c = ex.bdx(tokenResponse.salt2, tokenResponse.salt1, tokenResponse.salt4, tokenResponse.salt3, tokenResponse.salt5);
    const d = ex.ndx(tokenResponse.salt2, tokenResponse.salt1, tokenResponse.salt4, tokenResponse.salt3, tokenResponse.salt5);
    const e = ex.mdx(tokenResponse.salt2, tokenResponse.salt1, tokenResponse.salt4, tokenResponse.salt3, tokenResponse.salt5);

    const accessToken = tokenResponse.accessToken;
    const refreshToken = tokenResponse.refreshToken;

    const parsedAccessToken =
      accessToken.slice(0, n) +
      accessToken.slice(n + 1, l) +
      accessToken.slice(l + 1, o) +
      accessToken.slice(o + 1, p) +
      accessToken.slice(p + 1, q) +
      accessToken.slice(q + 1);

    const parsedRefreshToken =
      refreshToken.slice(0, a) +
      refreshToken.slice(a + 1, b) +
      refreshToken.slice(b + 1, c) +
      refreshToken.slice(c + 1, d) +
      refreshToken.slice(d + 1, e) +
      refreshToken.slice(e + 1);

    return [parsedAccessToken, parsedRefreshToken];
  }
}

export class TokenManager {
  constructor(nepse) {
    this.nepse = nepse;
    this.MAX_UPDATE_PERIOD = 45;
    this.tokenUrl = "/api/authenticate/prove";
    this.refreshUrl = "/api/authenticate/refresh-token";
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenTimestamp = null;
    this.salts = null;
    this.tokenParser = new TokenParser();
    this.updatePromise = null;
  }

  isTokenValid() {
    if (!this.tokenTimestamp) {
      return false;
    }
    return Math.floor(Date.now() / 1000) - this.tokenTimestamp < this.MAX_UPDATE_PERIOD;
  }

  async getAccessToken() {
    if (!this.isTokenValid()) {
      await this.update();
    }
    return this.accessToken;
  }

  async getRefreshToken() {
    if (!this.isTokenValid()) {
      await this.update();
    }
    return this.refreshToken;
  }

  async update() {
    if (!this.updatePromise) {
      this.updatePromise = this.setToken().finally(() => {
        this.updatePromise = null;
      });
    }
    await this.updatePromise;
  }

  async setToken() {
    const tokenResponse = await this.nepse.requestGETAPI(this.tokenUrl, false);
    const [accessToken, refreshToken] = await this.tokenParser.parseTokenResponse(tokenResponse);
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.tokenTimestamp = Math.floor(tokenResponse.serverTime / 1000);
    this.salts = [
      Number(tokenResponse.salt1),
      Number(tokenResponse.salt2),
      Number(tokenResponse.salt3),
      Number(tokenResponse.salt4),
      Number(tokenResponse.salt5)
    ];
  }
}
