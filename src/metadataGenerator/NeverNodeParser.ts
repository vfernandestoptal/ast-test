import * as ts from "typescript";
import { SubNodeParser, BaseType, UndefinedType } from "ts-json-schema-generator";

export class NeverTypeNodeParser implements SubNodeParser {
  public supportsNode(node: ts.KeywordTypeNode): boolean {
    return node.kind === ts.SyntaxKind.NeverKeyword;
  }
  public createType(): BaseType {
    return new UndefinedType();
  }
}
