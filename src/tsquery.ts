import { tsquery } from "@phenomnomnominal/tsquery";
import * as ts from "typescript";
import { MethodEndpoint } from "./types";

export function getApiEndpoints(tsConfigFile: string, apiTypeName: string): MethodEndpoint[] {
  console.log("Loading project...");
  const tsProject = tsquery.project(tsConfigFile);
  console.log("Project files found", tsProject.length);

  console.log(`Searching for API description type \`${apiTypeName}\`...`);
  const results =
    tsProject
      .map((sourceFile) =>
        tsquery(sourceFile, `InterfaceDeclaration > Identifier[name="${apiTypeName}"]`, { visitAllChildren: true }),
      )
      .find((result) => result.length > 0) || [];

  const apiDeclaration = results.length ? results[0].parent : undefined;
  if (apiDeclaration && ts.isInterfaceDeclaration(apiDeclaration)) {
    const apiDeclarationType = ts.SyntaxKind[apiDeclaration.kind];
    console.log(`Found API ${apiDeclarationType} type in \`${apiDeclaration.getSourceFile().fileName}\``);

    const endpoints = ([] as MethodEndpoint[]).concat(
      ...getProperties(apiDeclaration).map((prop) => {
        const url = prop.name;
        const methods = (prop.type && getProperties(prop.type).map((prop) => prop.name)) || [];

        return methods.map((method) => {
          return {
            url,
            method,
          } as MethodEndpoint;
        });
      }),
    );

    return endpoints;
  } else {
    console.log(`API declaration type \`${apiTypeName}\` not found!`);
    return [];
  }
}

function getProperties(node: ts.Node) {
  const members = ts.isInterfaceDeclaration(node) || ts.isTypeLiteralNode(node) ? node.members : undefined;

  return (
    (members &&
      members.filter<ts.PropertySignature>(ts.isPropertySignature).map((prop) => {
        const name = getTextOfPropertyName(prop.name);
        return {
          name,
          type: prop.type,
        };
      })) ||
    []
  );
}

function getTextOfPropertyName(name: ts.PropertyName) {
  if (ts.isIdentifier(name)) {
    return name.escapedText;
  } else if (isStringOrNumericLiteralLike(name)) {
    return ts.escapeLeadingUnderscores(name.text);
  } else if (ts.isComputedPropertyName(name)) {
    // TODO: get value of computed property name
    return isStringOrNumericLiteralLike(name.expression)
      ? ts.escapeLeadingUnderscores(name.expression.text)
      : ts.escapeLeadingUnderscores(name.expression.getText());
  } else {
    throw new Error("Unknown property name");
  }
}

function isStringOrNumericLiteralLike(node: ts.Node): node is ts.StringLiteralLike | ts.NumericLiteral {
  return ts.isStringLiteralLike(node) || ts.isNumericLiteral(node);
}
