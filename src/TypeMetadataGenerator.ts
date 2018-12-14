import * as ts from "typescript";
import {
  Config,
  NodeParser,
  Context,
  NoRootTypeError,
  localSymbolAtNode,
  symbolAtNode,
} from "ts-json-schema-generator";
import { createProgram } from "ts-json-schema-generator/dist/factory/program";
import { createParser } from "ts-json-schema-generator/dist/factory/parser";

export class TypeMetadataGenerator {
  private program: ts.Program;
  private nodeParser: NodeParser;

  constructor(tsConfigPath: string) {
    const config: Config = {
      path: tsConfigPath,
      type: "",
      topRef: true,
      expose: "all",
      jsDoc: "extended",
      skipTypeCheck: true,
    };
  
    this.program = createProgram(config);
    this.nodeParser = createParser(this.program, config);
  }

  public generate(fullName: string) {
    const allTypes = this.parseAllTypes();
    const rootNode = this.findRootNode(fullName, allTypes);
    const rootType = this.nodeParser.createType(rootNode, new Context());
    return rootType;
  }

  private parseAllTypes() {
    const allTypes = new Map<string, ts.Node>();
    const typeChecker = this.program.getTypeChecker();
    this.program.getSourceFiles().forEach((sourceFile) => this.inspectNode(sourceFile, typeChecker, allTypes));
    return allTypes;
  }

  private findRootNode(fullName: string, allTypes: Map<string, ts.Node>): ts.Node {
    if (!allTypes.has(fullName)) {
      throw new NoRootTypeError(fullName);
    }

    return allTypes.get(fullName)!;
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
}
