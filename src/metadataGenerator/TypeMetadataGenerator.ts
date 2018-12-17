import * as ts from "typescript";
import { Context, NoRootTypeError, localSymbolAtNode, symbolAtNode } from "ts-json-schema-generator";
import { createProgram } from "ts-json-schema-generator/dist/factory/program";
import { createParser, CustomTypeNodeParserConfig } from "./CustomTypeMetadataParser";
import { VoidTypeNodeParser } from "./VoidNodeParser";
import { NeverTypeNodeParser } from "./NeverNodeParser";
import { MapToAnyNodeParser } from "./MapToAnyNodeParser";
// import { AugmentedClassNodeParser } from "./AugmentedClassNodeParser";

export class TypeMetadataGenerator {
  private program: ts.Program;
  private typeChecker: ts.TypeChecker;
  private config: CustomTypeNodeParserConfig;

  constructor(tsConfigPath: string) {
    this.config = {
      path: tsConfigPath,
      type: "",
      topRef: true,
      expose: "all",
      jsDoc: "extended",
      skipTypeCheck: true,
      customParsers: [
        new VoidTypeNodeParser(),
        new NeverTypeNodeParser(),
        // new AugmentedClassNodeParser(),
        new MapToAnyNodeParser([
        //   "RenderedChannelParticipant",
        //   "ClassObjectWithCollaborators",
          "Request",
        //   "Readable",
        //   "Stream",
        //   "SqlIdBin",
        //   "RenderedComment",
        //   "DynamicConfigObject",
        //   "EditionUserDataObject",
        //   "RenderedHomeAward",
        //   "IdeasLessonPostPayload",
        //   "RenderedAward",
        //   "RenderedSessionToken",
        //   "RenderedStudentUser",
        //   "RenderedStudent",
        //   "RenderedStudentDetail",
        //   "RenderedStudentForClass",
        //   "RenderedSchoolClasses",
        //   "SchoolStudentBatchPostResponseType",
        //   "MomentSectionRendered",
        ]),
      ],
    };

    this.program = createProgram(this.config);
    this.typeChecker = this.program.getTypeChecker();
  }

  public generate(fullName: string) {
    const allTypes = this.parseAllTypes();
    const rootNode = this.findRootNode(fullName, allTypes);

    const nodeParser = createParser(this.program, this.config);
    const rootType = nodeParser.createType(rootNode, new Context());
    return rootType;
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
      // work-arounds for ts-json-schema-generator parsing limitations
      this.applyNodeCustomChanges(node);

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

  private findRootNode(fullName: string, allTypes: Map<string, ts.Node>): ts.Node {
    const rootNode = allTypes.get(fullName);
    if (!rootNode) {
      throw new NoRootTypeError(fullName);
    }
    return rootNode;
  }

  private applyNodeCustomChanges(node: ts.Node) {
    if (this.shouldIgnoreNodeSourceFile(node)) return;

    this.setComputedPropertyName(node);

    ts.forEachChild(node, (subnode) => this.applyNodeCustomChanges(subnode));
  }

  private shouldIgnoreNodeSourceFile(node: ts.Node) {
    const filename = node.getSourceFile().fileName;
    return filename.indexOf("node_modules") !== -1;
  }

  private setComputedPropertyName(node: ts.Node) {
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
  }
}
