import * as ts from "typescript";
import { SubNodeParser, BaseType, AnyType } from "ts-json-schema-generator";

export class MapToAnyNodeParser implements SubNodeParser {
  private MappedTypes: Set<string>;

  constructor(typesToMap: string[]) {
    this.MappedTypes = new Set(typesToMap);
  }

  public supportsNode(node: ts.KeywordTypeNode): boolean {
    return (
      (ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node) || ts.isClassDeclaration(node)) &&
      node.name != null &&
      this.MappedTypes.has(node.name.text)
    );
  }
  public createType(): BaseType {
    return new AnyType();
  }
}
