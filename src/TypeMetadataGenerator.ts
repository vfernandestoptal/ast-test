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
  private typeChecker: ts.TypeChecker;
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
    this.typeChecker = this.program.getTypeChecker();
    this.nodeParser = createParser(this.program, config);
  }

  public generate(fullName: string) {
    const allTypes = this.parseAllTypes();
    const rootNode = this.findRootNode(fullName, allTypes);
    const rootType = this.nodeParser.createType(rootNode, new Context());
    return rootType;
  }

  private findRootNode(fullName: string, allTypes: Map<string, ts.Node>): ts.Node {
    const rootNode = allTypes.get(fullName);

    if (!rootNode) {
      throw new NoRootTypeError(fullName);
    }

    this.setComputedPropertyNames(rootNode);

    return rootNode;
  }

  private setComputedPropertyNames(node: ts.Node) {
    if (ts.isPropertySignature(node)) {
      const nameNode = node.name;

      if (ts.isComputedPropertyName(nameNode)) {
        const nameSymbol = this.typeChecker.getSymbolAtLocation(nameNode);
        if (!nameSymbol) {
          throw new Error(`Could not get name symbol for '${nameNode.getText()}' node.`);
        }

        // not sure if there are other undesirable side-effects, but it seems
        // to work for setting the correct property name we need
        (node as any).symbol = nameSymbol;
      }
    } 

    ts.forEachChild(node, (subnode) => this.setComputedPropertyNames(subnode));
  }

  private parseAllTypes() {
    const allTypes = new Map<string, ts.Node>();
    const typeChecker = this.program.getTypeChecker();
    this.program.getSourceFiles().forEach((sourceFile) => this.inspectNode(sourceFile, typeChecker, allTypes));
    return allTypes;
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
