export class NepseInvalidServerResponse extends Error {
  constructor(message = "Invalid server response from NEPSE.") {
    super(message);
    this.name = "NepseInvalidServerResponse";
  }
}

export class NepseInvalidClientRequest extends Error {
  constructor(message = "Invalid client request to NEPSE.") {
    super(message);
    this.name = "NepseInvalidClientRequest";
  }
}

export class NepseNetworkError extends Error {
  constructor(message = "Network error while calling NEPSE.") {
    super(message);
    this.name = "NepseNetworkError";
  }
}

export class NepseTokenExpired extends Error {
  constructor(message = "NEPSE access token expired.") {
    super(message);
    this.name = "NepseTokenExpired";
  }
}
