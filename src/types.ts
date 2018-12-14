export interface ApiSpec {
  routes: RouteDefinition[];
  definitions: Map<string, Definition>;
}

export interface RouteDefinition {
  url: string;
  methods: MethodDefinition[];
}

export interface MethodDefinition {
  method: string;
  params?: Definition[];
  query?: Definition[];
  body?: Definition;
  response?: Definition;
}

// TODO: create own type to represent definition so it doens't depend on external lib
export declare type RawType = number | boolean | string | null;
export interface Definition {
    $ref?: string;
    description?: string;
    not?: Definition;
    allOf?: Definition[];
    oneOf?: Definition[];
    anyOf?: Definition[];
    title?: string;
    type?: string | string[];
    format?: string;
    items?: Definition | Definition[];
    minItems?: number;
    maxItems?: number;
    additionalItems?: Definition;
    enum?: Array<RawType | Definition>;
    default?: RawType | object;
    additionalProperties?: false | Definition;
    required?: string[];
    propertyOrder?: string[];
    properties?: DefinitionMap;
    defaultProperties?: string[];
    typeof?: "function";
}
export interface DefinitionMap {
    [name: string]: Definition;
}
