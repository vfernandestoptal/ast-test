import * as ts from "typescript";
import {
  SubNodeParser,
  BaseType,
  ObjectType,
  ObjectProperty,
  Context,
  StringType,
  AnnotatedType,
  BooleanType,
  NumberType,
  AnyType,
} from "ts-json-schema-generator";

export class AugmentedClassNodeParser implements SubNodeParser {
  public constructor() // private typeChecker: ts.TypeChecker,
  // private childNodeParser: NodeParser,
  {}
  public supportsNode(node: ts.KeywordTypeNode): boolean {
    return ts.isInterfaceDeclaration(node) && node.name.text === "AugmentedClass";
  }
  public createType(node: ts.InterfaceDeclaration, context: Context): BaseType {
    return new ObjectType("interface-AugmentedClass", [], this.getProperties(node, context), false);
  }

  private getProperties(_node: ts.InterfaceDeclaration, _context: Context): ObjectProperty[] {
    return [
      new MongoIdProperty("_id"),
      new ObjectProperty("inactive", new BooleanType(), true),
      new MongoIdProperty("teacher"),
      new MongoIdProperty("verifiedSchoolId", false),
      new ObjectProperty("parentCount", new NumberType(), false),
      new ObjectProperty("householdInvitedCount", new NumberType(), false),
      new ObjectProperty("householdConnectedCount", new NumberType(), false),
      new ObjectProperty("studentCount", new NumberType(), false),
      new ObjectProperty("unreadMessageCount", new NumberType(), false),
      new ObjectProperty("unreadStoryPostCount", new NumberType(), false),
      new ObjectProperty("unreadNotificationCount", new NumberType(), false),
      new ObjectProperty("authToken", new NumberType(), false),
      new ObjectProperty("classCode", new StringType(), false),
      new ObjectProperty("name", new StringType(), true),
      new ObjectProperty("icon", new StringType(), true),
      new ObjectProperty("year", new StringType(), true),
      new ObjectProperty("subject", new StringType(), true),
      new ObjectProperty("pdCode", new StringType(), false),
      new ObjectProperty("archived", new BooleanType(), false),
      new ObjectProperty("demo", new BooleanType(), false),
      new ObjectProperty(
        "goal",
        new ObjectType(
          "obj-AugmentedClass-goal",
          [],
          [
            new ObjectProperty("target", new NumberType(), true),
            new ObjectProperty("progress", new NumberType(), true),
            new DateProperty("date"),
          ],
          false,
        ),
        false,
      ),
      new DateProperty("lastAccess", false),
      new PlainObjectProperty("progress", false),
      new ObjectProperty("prefs", new AnyType(), false),
      new ObjectProperty("collaborators", new AnyType(), false),
    ];
  }
}

class MongoIdProperty extends ObjectProperty {
  constructor(name: string, required = true) {
    super(name, new AnnotatedType(new StringType(), {}, required), required);
  }
}

class DateProperty extends ObjectProperty {
  constructor(name: string, required = true) {
    super(name, new AnnotatedType(new StringType(), {}, required), required);
  }
}

class PlainObjectProperty extends ObjectProperty {
  constructor(name: string, required = true) {
    super(name, new ObjectType(`obj-${name}`, [], [], true), required);
  }
}

// interface AugmentedClass extends Omit<ClassModel.ClassObjectWithCollaborators, "prefs"> {
//   prefs?: ClassSettings.ClassSettingsObject;
//   collaborators: Collaborator[];
// }
