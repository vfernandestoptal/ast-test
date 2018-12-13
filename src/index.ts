import * as path from "path";
import * as tsquery from "./tsquery";
import * as simpleast from "./tssimpleast";

const apiTypeName = "API";
const tsConfigFile = path.join(process.cwd(), "tsconfig.json");
const entryFile = path.join(process.cwd(), "src", "api.ts");

// console.log("Getting info with tsquery...");
// let endpoints = tsquery.getApiEndpoints(tsConfigFile, apiTypeName);
// console.log("Endpoints:");
// endpoints.forEach((endpoint) => console.log(`  + ${endpoint.method} ${endpoint.url}`));

// console.log("Getting info with ts-simple-ast...");
// endpoints = simpleast.getApiEndpoints(tsConfigFile, apiTypeName);
// console.log("Endpoints:");
// endpoints.forEach((endpoint) => console.log(`  + ${endpoint.method} ${endpoint.url}`));

// import * as gen from "./metadataGeneration/metadataGenerator";

// const apiSpec = new gen.MetadataGenerator(apiTypeName, entryFile).Generate();
// console.log(JSON.stringify(apiSpec, null, 2));

import { createProgram } from "ts-json-schema-generator/dist/factory/program";
import { createParser } from "ts-json-schema-generator/dist/factory/parser";
import { createFormatter } from "ts-json-schema-generator/dist/factory/formatter";
import {
  Config,
  NodeParser,
  TypeFormatter,
  Context,
  BaseType,
  Definition,
  StringMap,
  DefinitionType,
  NoRootTypeError,
  localSymbolAtNode,
  symbolAtNode,
  ObjectType,
  ReferenceType,
  AliasType,
  UnionType,
  IntersectionType,
  AnnotatedType,
} from "ts-json-schema-generator";
import * as ts from "typescript";
import { flatten } from "./utils/flatten";

class Generator {
  private allTypes: Map<string, ts.Node>;
  private program: ts.Program;
  private nodeParser: NodeParser;

  constructor(config: Config) {
    this.allTypes = new Map<string, ts.Node>();
    this.program = createProgram(config);
    this.nodeParser = createParser(this.program, config);

    // const generator = new SchemaGenerator(program, parser, formatter);
    // console.log(JSON.stringify(generator.createSchema(config.type), null, 2));
  }

  public generate(fullName: string) {
    const rootNode = this.findRootNode(fullName);
    const rootType = this.nodeParser.createType(rootNode, new Context());

    // return {
    //   $schema: "http://json-schema.org/draft-06/schema#",
    //   definitions: this.getRootChildDefinitions(rootType),
    //   ...this.getRootTypeDefinition(rootType),
    // };
    return rootType;
  }

  private findRootNode(fullName: string): ts.Node {
    const typeChecker = this.program.getTypeChecker();

    if (this.allTypes.size === 0) {
      this.program.getSourceFiles().forEach((sourceFile) => this.inspectNode(sourceFile, typeChecker, this.allTypes));
    }

    if (!this.allTypes.has(fullName)) {
      throw new NoRootTypeError(fullName);
    }

    return this.allTypes.get(fullName)!;
  }
  private inspectNode(node: ts.Node, typeChecker: ts.TypeChecker, allTypes: Map<string, ts.Node>): void {
    if (
      node.kind === ts.SyntaxKind.InterfaceDeclaration ||
      node.kind === ts.SyntaxKind.EnumDeclaration ||
      node.kind === ts.SyntaxKind.TypeAliasDeclaration
    ) {
      if (!this.isExportType(node)) {
        return;
      } else if (this.isGenericType(node as ts.TypeAliasDeclaration)) {
        return;
      }

      allTypes.set(this.getFullName(node, typeChecker), node);
    } else {
      ts.forEachChild(node, (subnode) => this.inspectNode(subnode, typeChecker, allTypes));
    }
  }

  private isExportType(node: ts.Node): boolean {
    const localSymbol = localSymbolAtNode(node);
    return localSymbol ? "exportSymbol" in localSymbol : false;
  }
  private isGenericType(node: ts.TypeAliasDeclaration): boolean {
    return !!(node.typeParameters && node.typeParameters.length > 0);
  }
  private getFullName(node: ts.Node, typeChecker: ts.TypeChecker): string {
    const symbol = symbolAtNode(node)!;
    return typeChecker.getFullyQualifiedName(symbol).replace(/".*"\./, "");
  }

  // private getRootTypeDefinition(rootType: BaseType): Definition {
  //   return this.typeFormatter.getDefinition(rootType);
  // }
  // private getRootChildDefinitions(rootType: BaseType): StringMap<Definition> {
  //   return this.typeFormatter
  //     .getChildren(rootType)
  //     .filter((child) => child instanceof DefinitionType)
  //     .reduce(
  //       (result: StringMap<Definition>, child: DefinitionType) => ({
  //         ...result,
  //         [child.getId()]: this.typeFormatter.getDefinition(child.getType()),
  //       }),
  //       {},
  //     );
  // }
}

function printSeparator() {
  console.log("\n---------------------------\n");
}

const config: Config = {
  path: tsConfigFile,
  type: apiTypeName,
  topRef: true,
  expose: "all",
  jsDoc: "extended",
  skipTypeCheck: true,
};

const typeFormatter = createFormatter(config);
const apiSpec = new Generator(config).generate(config.type);
const apiDefinitions = new Map<string, Definition>();

if (apiSpec instanceof DefinitionType) {
  const apiType = apiSpec.getType();
  if (apiType instanceof ObjectType) {
    const routes = apiType
      .getProperties()
      .map((route) => {
        const url = route.getName();

        let routeType = route.getType();
        if (routeType instanceof DefinitionType) {
          routeType = routeType.getType();
        }

        let methods;
        if (routeType instanceof ObjectType) {
          methods = routeType
            .getProperties()
            .map((method) => {
              let methodType = method.getType();
              if (methodType instanceof DefinitionType) {
                methodType = methodType.getType();
              }

              if (methodType instanceof ObjectType) {
                const methodDefinition = methodType.getProperties();

                const name = method.getName();
                const paramsDefinition = methodDefinition.find((def) => def.getName() === "params");
                const queryDefinition = methodDefinition.find((def) => def.getName() === "query");
                const bodyDefinition = methodDefinition.find((def) => def.getName() === "body");
                const responseDefinition = methodDefinition.find((def) => def.getName() === "response");

                let params;
                let query;
                let body;
                let response;
                if (paramsDefinition) {
                  let paramsType = paramsDefinition.getType();
                  if (paramsType instanceof DefinitionType) {
                    paramsType = paramsType.getType();
                  }

                  if (paramsType instanceof ObjectType) {
                    params = paramsType.getProperties().map((prop) => {
                      const propType = prop.getType();
                      return {
                        name: prop.getName(),
                        ...typeFormatter.getDefinition(propType),
                        required: prop.isRequired(),
                      };
                    });
                  }
                }

                if (queryDefinition) {
                  let queryType = queryDefinition.getType();
                  if (queryType instanceof DefinitionType) {
                    queryType = queryType.getType();
                  }

                  if (queryType instanceof ObjectType) {
                    query = queryType.getProperties().map((prop) => {
                      const propType = prop.getType();
                      return {
                        name: prop.getName(),
                        ...typeFormatter.getDefinition(propType),
                        required: prop.isRequired(),
                      };
                    });
                  }
                }

                if (bodyDefinition) {
                  const bodyType = bodyDefinition.getType();
                  body = typeFormatter.getDefinition(bodyType);

                  addToApiDefinitions(bodyType);
                }

                if (responseDefinition) {
                  const responseType = responseDefinition.getType();
                  response = typeFormatter.getDefinition(responseType);

                  addToApiDefinitions(responseType);
                }

                return {
                  name,
                  params,
                  query,
                  body,
                  response,
                };
              }

              return;
            })
            .filter((method) => !!method);
        }

        if (methods) {
          return methods.map((method) => ({
            url,
            ...method,
          }));
        }

        return;
      })
      .filter((route) => !!route && route.length > 0);

    printSeparator();
    console.log("Routes", JSON.stringify(flatten(routes as any[]), null, 2));
    printSeparator();
    console.log("Definitions:");
    apiDefinitions.forEach((def, name) => console.log(name, JSON.stringify(def, null, 2)));
    printSeparator();
  }
}

function addToApiDefinitions(type: BaseType) {
  // add to schema definitions
  while (type instanceof DefinitionType) {
    const id = type.getId();
    type = type.getType();

    apiDefinitions.set(id, typeFormatter.getDefinition(type));

    while (type instanceof AliasType) {
      type = type.getType();
    }
  }

  if (type instanceof ObjectType) {
    type.getProperties().forEach(prop => {
      const propType = prop.getType();
      addToApiDefinitions(propType);
    });
  } else if (type instanceof IntersectionType || type instanceof UnionType) {
    type.getTypes().forEach(t => addToApiDefinitions(t));
  }
}