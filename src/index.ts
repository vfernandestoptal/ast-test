import * as fs from "fs";
import * as path from "path";
import { TypeMetadataGenerator } from "./TypeMetadataGenerator";
import { OpenAPI2Generator } from "./OpenAPI2Generator";
import { ApiSpecGenerator } from "./ApiSpecGenerator";

const apiTypeName = "FullAPI";
const tsConfigFile = path.join(process.cwd(), "tsconfig.json");
const outputFile = "api.swagger.json";

console.log(`Loading config file from ${tsConfigFile}`);

// get info from API interface type
console.log("Processing Type information...");
const apiTypeInfo = new TypeMetadataGenerator(tsConfigFile).generate(apiTypeName);

// generate API structure information
console.log(`Gathering API details from type ${apiTypeName}...`);
const apiSpec = new ApiSpecGenerator().generate(apiTypeInfo);

// generate api spec in swagger format
const apiSpecOptions = {
  title: "ClassDojo API",
  version: "v1",
  host: "api.classdojo.com",
  basePath: "/",
  schemes: ["https"],
};
console.log(`Generating API spec for ${apiSpecOptions.title}...`);
const openApiSpec = new OpenAPI2Generator(apiSpecOptions).generate(apiSpec);

// format api spec as JSON string
const specJson = JSON.stringify(openApiSpec, null, 2);
fs.writeFileSync(outputFile, specJson);
// console.log(specJson);

console.log(`API spec file written to ${path.resolve(outputFile)}`);
