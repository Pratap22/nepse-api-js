import { Nepse } from "./src/index.js";

const nepse = new Nepse();
nepse.setTLSVerification(false);

function getMethodSignature(methodName, methodFn) {
  const src = methodFn.toString();
  const params = src.slice(src.indexOf("("), src.indexOf(")") + 1);
  const asyncPrefix = src.trimStart().startsWith("async") ? "async " : "";
  return `${asyncPrefix}${methodName}${params}`;
}

const signatures = Object.getOwnPropertyNames(Nepse.prototype)
  .filter((name) => name !== "constructor" && typeof Nepse.prototype[name] === "function")
  .map((name) => getMethodSignature(name, Nepse.prototype[name]));

console.log("Nepse method signatures:");
for (const [index, signature] of signatures.entries()) {
  console.log(`${index + 1}. ${signature}`);
}

const abc = await nepse.getDailyScripPriceGraph("NIFRA");
console.log("Daily scrip price graph:", abc);