function toDate(dateTimeStr) {
  return new Date(dateTimeStr);
}

export class DummyIDManager {
  constructor({ marketStatusFunction = null, dateFunction = () => new Date() } = {}) {
    this.data = null;
    this.dummyId = null;
    this.dateStamp = null;
    this.setDateFunction(dateFunction);
    this.setMarketStatusFunction(marketStatusFunction);
    this.updatePromise = null;
  }

  setDateFunction(func) {
    this.dateFunction = func;
  }

  setMarketStatusFunction(func) {
    this.marketStatusFunction = func;
    this.data = null;
  }

  async populateData(force = false) {
    const today = this.dateFunction();

    if (!this.marketStatusFunction) {
      throw new Error("marketStatusFunction is not set.");
    }

    if (this.data === null || force) {
      if (!this.updatePromise) {
        this.updatePromise = (async () => {
          this.data = await this.marketStatusFunction();
          this.dummyId = this.data.id;
          this.dateStamp = today;
        })().finally(() => {
          this.updatePromise = null;
        });
      }
      await this.updatePromise;
      return;
    }

    const isNewDay = this.dateStamp && this.dateStamp.toDateString() !== today.toDateString();
    if (isNewDay) {
      if (!this.updatePromise) {
        this.updatePromise = (async () => {
          const newData = await this.marketStatusFunction();
          const nepseAsOf = toDate(newData.asOf);
          this.data = newData;
          this.dummyId = newData.id;
          this.dateStamp = nepseAsOf.toDateString() === today.toDateString() ? nepseAsOf : today;
        })().finally(() => {
          this.updatePromise = null;
        });
      }
      await this.updatePromise;
    }
  }

  async getDummyID() {
    await this.populateData();
    return this.dummyId;
  }
}
