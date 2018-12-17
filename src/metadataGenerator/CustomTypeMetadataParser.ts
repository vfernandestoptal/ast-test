import * as ts from "typescript";
import {
  AnnotatedNodeParser,
  AnyTypeNodeParser,
  ArrayNodeParser,
  BasicAnnotationsReader,
  BooleanLiteralNodeParser,
  BooleanTypeNodeParser,
  CallExpressionParser,
  ChainNodeParser,
  CircularReferenceNodeParser,
  Config,
  EnumNodeParser,
  ExposeNodeParser,
  ExpressionWithTypeArgumentsNodeParser,
  ExtendedAnnotationsReader,
  InterfaceNodeParser,
  IntersectionNodeParser,
  LiteralNodeParser,
  NodeParser,
  NullLiteralNodeParser,
  NumberLiteralNodeParser,
  NumberTypeNodeParser,
  ParenthesizedNodeParser,
  StringLiteralNodeParser,
  StringTypeNodeParser,
  SubNodeParser,
  TopRefNodeParser,
  TupleNodeParser,
  TypeAliasNodeParser,
  TypeLiteralNodeParser,
  TypeReferenceNodeParser,
  UndefinedTypeNodeParser,
  UnionNodeParser,
} from "ts-json-schema-generator";
import { ObjectTypeNodeParser } from "ts-json-schema-generator/dist/src/NodeParser/ObjectTypeNodeParser";
import { IndexedAccessTypeNodeParser } from "ts-json-schema-generator/dist/src/NodeParser/IndexedAccessTypeNodeParser";
import { TypeofNodeParser } from "ts-json-schema-generator/dist/src/NodeParser/TypeofNodeParser";
import { MappedTypeNodeParser } from "ts-json-schema-generator/dist/src/NodeParser/MappedTypeNodeParser";
import { TypeOperatorNodeParser } from "ts-json-schema-generator/dist/src/NodeParser/TypeOperatorNodeParser";
import { OptionalTypeNodeParser } from "ts-json-schema-generator/dist/src/NodeParser/OptionalTypeNodeParser";
import { RestTypeNodeParser } from "ts-json-schema-generator/dist/src/NodeParser/RestTypeNodeParser";

export interface CustomTypeNodeParserConfig extends Config {
  customParsers?: SubNodeParser[];
}
export function createParser(program: ts.Program, config: CustomTypeNodeParserConfig): NodeParser {
  const typeChecker = program.getTypeChecker();
  const chainNodeParser = new ChainNodeParser(typeChecker, []);

  function withExpose(nodeParser: SubNodeParser): SubNodeParser {
    return new ExposeNodeParser(typeChecker, nodeParser, config.expose);
  }
  function withTopRef(__: NodeParser): NodeParser {
    return new TopRefNodeParser(chainNodeParser, config.type, config.topRef);
  }
  function withJsDoc(nodeParser: SubNodeParser): SubNodeParser {
    if (config.jsDoc === "extended") {
      return new AnnotatedNodeParser(nodeParser, new ExtendedAnnotationsReader(typeChecker));
    } else if (config.jsDoc === "basic") {
      return new AnnotatedNodeParser(nodeParser, new BasicAnnotationsReader());
    } else {
      return nodeParser;
    }
  }
  function withCircular(nodeParser: SubNodeParser): SubNodeParser {
    return new CircularReferenceNodeParser(nodeParser);
  }

  if (config.customParsers) {
    config.customParsers.forEach((customParser) => chainNodeParser.addNodeParser(customParser));
  }

  chainNodeParser
    .addNodeParser(new StringTypeNodeParser())
    .addNodeParser(new NumberTypeNodeParser())
    .addNodeParser(new BooleanTypeNodeParser())
    .addNodeParser(new AnyTypeNodeParser())
    .addNodeParser(new UndefinedTypeNodeParser())
    .addNodeParser(new ObjectTypeNodeParser())

    .addNodeParser(new StringLiteralNodeParser())
    .addNodeParser(new NumberLiteralNodeParser())
    .addNodeParser(new BooleanLiteralNodeParser())
    .addNodeParser(new NullLiteralNodeParser())

    .addNodeParser(new LiteralNodeParser(chainNodeParser))
    .addNodeParser(new ParenthesizedNodeParser(chainNodeParser))

    .addNodeParser(new TypeReferenceNodeParser(typeChecker, chainNodeParser))
    .addNodeParser(new ExpressionWithTypeArgumentsNodeParser(typeChecker, chainNodeParser))

    .addNodeParser(new IndexedAccessTypeNodeParser(chainNodeParser))
    .addNodeParser(new TypeofNodeParser(typeChecker, chainNodeParser))
    .addNodeParser(new MappedTypeNodeParser(chainNodeParser))
    .addNodeParser(new TypeOperatorNodeParser(chainNodeParser))

    .addNodeParser(new UnionNodeParser(typeChecker, chainNodeParser))
    .addNodeParser(new IntersectionNodeParser(typeChecker, chainNodeParser))
    .addNodeParser(new TupleNodeParser(typeChecker, chainNodeParser))
    .addNodeParser(new OptionalTypeNodeParser(chainNodeParser))
    .addNodeParser(new RestTypeNodeParser(chainNodeParser))

    .addNodeParser(new CallExpressionParser(typeChecker, chainNodeParser))

    .addNodeParser(withCircular(withExpose(withJsDoc(new TypeAliasNodeParser(typeChecker, chainNodeParser)))))
    .addNodeParser(withExpose(withJsDoc(new EnumNodeParser(typeChecker))))
    .addNodeParser(
      withCircular(withExpose(withJsDoc(new InterfaceNodeParser(typeChecker, withJsDoc(chainNodeParser))))),
    )
    .addNodeParser(withCircular(withExpose(withJsDoc(new TypeLiteralNodeParser(withJsDoc(chainNodeParser))))))

    .addNodeParser(new ArrayNodeParser(chainNodeParser));

  return withTopRef(chainNodeParser);
}
