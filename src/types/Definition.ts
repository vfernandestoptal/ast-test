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
