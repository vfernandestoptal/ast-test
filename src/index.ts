import * as path from "path";
import * as tsquery from "./tsquery";
import * as simpleast from "./tssimpleast";

const apiTypeName = "API";
const tsConfigFile = path.join(process.cwd(), "tsconfig.json");

console.log("Getting info with tsquery...");
let endpoints = tsquery.getApiEndpoints(tsConfigFile, apiTypeName);
console.log("Endpoints:");
endpoints.forEach((endpoint) => console.log(`  + ${endpoint.method} ${endpoint.url}`));

console.log("Getting info with ts-simple-ast...");
endpoints = simpleast.getApiEndpoints(tsConfigFile, apiTypeName);
console.log("Endpoints:");
endpoints.forEach((endpoint) => console.log(`  + ${endpoint.method} ${endpoint.url}`));
