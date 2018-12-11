import * as tsquery from "./tsquery";

const apiTypeName = "API";
const tsConfigFile = "tsconfig.json";

const endpoints = tsquery.getApiEndpoints(tsConfigFile, apiTypeName);
console.log("Endpoints:");
endpoints.forEach((endpoint) => console.log(`  + ${endpoint.method} ${endpoint.url}`));
