import * as fs from "fs";
import * as path from "path";
import { Config } from "ts-json-schema-generator";
import { TypeMetadataGenerator } from "./TypeMetadataGenerator";
import { OpenAPI2Generator } from "./OpenAPI2Generator";
import { ApiSpecGenerator } from "./ApiSpecGenerator";

const apiTypeName = "API";
const tsConfigFile = path.join(process.cwd(), "tsconfig.json");

// get info from API interface type 
const apiTypeInfo = new TypeMetadataGenerator(tsConfigFile).generate(apiTypeName);

// generate API structure information
const apiSpec = new ApiSpecGenerator().generate(apiTypeInfo);

// generate api spec in swagger format 
const apiSpecOptions = {
  title: "ClassDojo API",
  version: "v1",
  host: "api.classdojo.com",
  basePath: "/",
  schemes: ["https"],
};
const openApiSpec = new OpenAPI2Generator(apiSpecOptions).generate(apiSpec);

// format api spec as JSON string
const specJson = JSON.stringify(openApiSpec, null, 2);
fs.writeFileSync("api.swagger.json", specJson);
console.log(specJson);
