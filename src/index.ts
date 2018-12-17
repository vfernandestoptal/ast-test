import * as fs from "fs";
import * as path from "path";
import { TypeMetadataGenerator } from "./metadataGenerator/TypeMetadataGenerator";
import { OpenAPI2Generator } from "./OpenAPI2Generator";
import { ApiSpecGenerator } from "./ApiSpecGenerator";

try {
  generateSpecFile({
    apiTypeName: "FullAPI",
    // tsConfigFile: path.join(process.cwd(), "tsconfig.json"),
    tsConfigFile: path.join(process.cwd(), "..", "api", "tsconfig.json"),
    outputFile: "api.swagger.json",
  });
} catch (err) {
  console.log("\n\nERROR:");
  console.log("------");
  console.log(err.message);
  console.log("\n--------------------------------------------------------");
  console.log(err);
}

interface SpecGenerationOptions {
  apiTypeName: string;
  tsConfigFile: string;
  outputFile: string;
}
function generateSpecFile(options: SpecGenerationOptions) {
  console.log(`Loading config file from ${options.tsConfigFile}`);

  // get info from API interface type
  console.log("Processing Type information...");
  const apiTypeInfo = new TypeMetadataGenerator(options.tsConfigFile).generate(options.apiTypeName);
  
  // generate API structure information
  console.log(`Gathering API details from type ${options.apiTypeName}...`);
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
  fs.writeFileSync(options.outputFile, specJson);
  // console.log(specJson);
  
  console.log(`API spec file written to ${path.resolve(options.outputFile)}`);  
}
