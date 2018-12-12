import { Project, TypeGuards, PropertySignature } from "ts-simple-ast";
import { MethodEndpoint } from "./types";
import { unquote } from "./utils/unquote";
import { flatten } from "./utils/flatten";

export function getApiEndpoints(tsConfigFilePath: string, apiTypeName: string): MethodEndpoint[] {
  console.log("Loading project...");
  const tsProject = new Project({
    tsConfigFilePath,
  });
  const sourceFiles = tsProject.getSourceFiles();
  console.log("Project files found", sourceFiles.length);

  console.log(`Searching for API description type \`${apiTypeName}\`...`);
  const apiDeclaration = sourceFiles
    .map((file) => file.getInterface(apiTypeName))
    .find((declaration) => declaration != null);

  if (apiDeclaration) {
    console.log(
      `Found API ${apiDeclaration.getKindName()} type in \`${apiDeclaration.getSourceFile().getFilePath()}\``,
    );

    const endpoints = apiDeclaration.getProperties().map((prop) => {
      const url = getPropertyName(prop);
      const methods = prop
        .getType()
        .getProperties()
        .map((method) => {
          return {
            url,
            method: method.getName(),
          };
        });

      return methods;
    });

    return flatten(endpoints);
  } else {
    console.log(`API declaration type \`${apiTypeName}\` not found!`);
    return [];
  }
}

function getPropertyName(prop: PropertySignature): string {
  let name;
  const nameNode = prop.getNameNode();
  if (TypeGuards.isComputedPropertyName(nameNode)) {
    const propNameType = nameNode.getExpression().getType();
    if (propNameType.isLiteral()) {
      name = propNameType.getText();
    }
  } else {
    name = nameNode.getText();
  }

  if (name) {
    return unquote(name);
  } else {
    throw new Error("Could not determine property name for " + prop.getName());
  }
}
