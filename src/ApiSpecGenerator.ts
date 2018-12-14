import { createFormatter } from "ts-json-schema-generator/dist/factory/formatter";
import {
  Config,
  BaseType,
  Definition,
  DefinitionType,
  ObjectType,
  AliasType,
  UnionType,
  IntersectionType,
  TypeFormatter,
} from "ts-json-schema-generator";
import { RouteDefinition } from "./types";

export class ApiSpecGenerator {
  private typeFormatter: TypeFormatter;

  constructor() {
    const config: Config = {
      path: "",
      type: "",
      topRef: true,
      expose: "all",
      jsDoc: "extended",
      skipTypeCheck: true,
    };
    this.typeFormatter = createFormatter(config);
  }

  public generate(apiTypeInfo: BaseType) {
    if (!(apiTypeInfo instanceof DefinitionType)) {
      throw new Error(`Found unexpected type for ${apiTypeInfo.getId()}`);
    }

    let routes: RouteDefinition[] = [];
    const definitions = new Map<string, Definition>();
    const apiType = apiTypeInfo.getType();
    if (apiType instanceof ObjectType) {
      routes = apiType
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

                  const methodName = method.getName().toLowerCase();
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
                          ...this.typeFormatter.getDefinition(propType),
                          in: "path",
                          name: prop.getName(),
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
                          ...this.typeFormatter.getDefinition(propType),
                          in: "query",
                          name: prop.getName(),
                          required: prop.isRequired(),
                        };
                      });
                    }
                  }

                  if (bodyDefinition) {
                    const bodyType = bodyDefinition.getType();
                    body = this.typeFormatter.getDefinition(bodyType);

                    this.addToApiDefinitions(bodyType, definitions);
                  }

                  if (responseDefinition) {
                    const responseType = responseDefinition.getType();
                    response = this.typeFormatter.getDefinition(responseType);

                    this.addToApiDefinitions(responseType, definitions);
                  }

                  return {
                    method: methodName,
                    params,
                    query,
                    body,
                    response,
                  };
                }

                return;
              })
              .filter((method) => method != null);
          }

          if (methods && methods.length > 0) {
            return {
              url,
              methods,
            };
          }

          return;
        })
        .filter((route) => route != null) as RouteDefinition[];
    }

    return {
      routes,
      definitions,
    };
  }

  private addToApiDefinitions(type: BaseType, apiDefinitions: Map<string, Definition>) {
    // add to schema definitions
    while (type instanceof DefinitionType) {
      const id = type.getId();
      type = type.getType();

      apiDefinitions.set(id, this.typeFormatter.getDefinition(type));

      while (type instanceof AliasType) {
        type = type.getType();
      }
    }

    if (type instanceof ObjectType) {
      type.getProperties().forEach((prop) => {
        const propType = prop.getType();
        this.addToApiDefinitions(propType, apiDefinitions);
      });
    } else if (type instanceof IntersectionType || type instanceof UnionType) {
      type.getTypes().forEach((t) => this.addToApiDefinitions(t, apiDefinitions));
    }
  }
}
