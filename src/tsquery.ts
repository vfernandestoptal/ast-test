import { tsquery } from "@phenomnomnominal/tsquery";
import * as ts from "typescript";
import { MethodEndpoint } from "./types";

export function getApiEndpoints(tsConfigFile: string, apiTypeName: string): MethodEndpoint[] {
  return new ApiEndpointsParser(tsConfigFile).getApiEndpoints(apiTypeName);
}

class ApiEndpointsParser {
  private tsProject: ts.SourceFile[];

  constructor(tsConfigFile: string) {
    console.log("Loading project...");
    this.tsProject = tsquery.project(tsConfigFile);
    console.log("Project files found", this.tsProject.length);
  }

  getApiEndpoints(apiTypeName: string): MethodEndpoint[] {
    console.log(`Searching for API description type \`${apiTypeName}\`...`);
    const apiDeclaration = this.getTypeDeclaration(apiTypeName);
    if (apiDeclaration && ts.isInterfaceDeclaration(apiDeclaration)) {
      const apiDeclarationType = ts.SyntaxKind[apiDeclaration.kind];
      console.log(`Found API ${apiDeclarationType} type in \`${apiDeclaration.getSourceFile().fileName}\``);

      const endpoints = ([] as MethodEndpoint[]).concat(
        ...this.getProperties(apiDeclaration).map((prop) => {
          const url = prop.name;
          const methods = (prop.type && this.getProperties(prop.type).map((prop) => prop.name)) || [];

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

  getTypeDeclaration(typeName: string) {
    const results =
      this.tsProject
        .map((sourceFile) => tsquery(sourceFile, `Identifier[name="${typeName}"]`))
        .find((result) => result.length > 0) || [];

    return results.length ? results[0].parent : undefined;
  }

  getProperties(node: ts.Node) {
    const members = ts.isInterfaceDeclaration(node) || ts.isTypeLiteralNode(node) ? node.members : undefined;
    return (
      (members &&
        members.filter<ts.PropertySignature>(ts.isPropertySignature).map((prop) => {
          const name = this.getTextOfPropertyName(prop.name);
          return {
            name,
            type: prop.type,
          };
        })) ||
      []
    );
  }

  getTextOfPropertyName(name: ts.PropertyName) {
    if (ts.isIdentifier(name)) {
      return name.escapedText;
    } else if (isStringOrNumericLiteralLike(name)) {
      return ts.escapeLeadingUnderscores(name.text);
    } else if (ts.isComputedPropertyName(name)) {
      // TODO: get value of computed property name
      if (isStringOrNumericLiteralLike(name.expression)) return ts.escapeLeadingUnderscores(name.expression.text);

      const typeDeclaration = this.getTypeDeclaration(name.expression.getText());
      if (typeDeclaration && ts.isVariableDeclaration(typeDeclaration) && typeDeclaration.initializer) {
        return unquote(typeDeclaration.initializer.getText());
      }
    }

    throw new Error("Unknown property name");
  }
}

function unquote(value: string): string {
  return value.replace(/(^["|'|`]|["|'|`]$)/g, "");
}

function isStringOrNumericLiteralLike(node: ts.Node): node is ts.StringLiteralLike | ts.NumericLiteral {
  return ts.isStringLiteralLike(node) || ts.isNumericLiteral(node);
}
