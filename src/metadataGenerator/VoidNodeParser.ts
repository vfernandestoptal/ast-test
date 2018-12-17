import * as ts from "typescript";
import { SubNodeParser, BaseType, UndefinedType } from "ts-json-schema-generator";

export class VoidTypeNodeParser implements SubNodeParser {
  public supportsNode(node: ts.KeywordTypeNode): boolean {
    return node.kind === ts.SyntaxKind.VoidKeyword;
  }
  public createType(): BaseType {
    return new UndefinedType();
  }
}
