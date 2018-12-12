// tslint:disable max-line-length
// Based on https://github.com/lukeautry/tsoa
//
// The MIT License (MIT)
// Copyright (c) 2016 Luke Autry
//
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
// tslint:enable max-line-length

export interface Metadata {
  controllers: Controller[];
  referenceTypeMap: ReferenceTypeMap;
}

export interface Controller {
  location: string;
  methods: Method[];
  name: string;
  path: string;
}

const HTTPMethods = {
  get: "",
  post: "",
  put: "",
  delete: "",
  options: "",
  head: "",
  patch: "",
};
export type HTTPMethod = keyof typeof HTTPMethods;
export function isHTTPMethod(methodName: string): methodName is HTTPMethod {
  return HTTPMethods.hasOwnProperty(methodName);
}

export interface Method {
  deprecated?: boolean;
  description?: string;
  method: HTTPMethod;
  name: string;
  parameters: Parameter[];
  path: string;
  // type: Type;
  tags?: string[];
  responses: Response[];
  security: Security[];
  summary?: string;
  isHidden: boolean;
  operationId?: string;
}

export interface Parameter {
  parameterName: string;
  description?: string;
  in: "query" | "header" | "path" | "formData" | "body" | "body-prop" | "request";
  name: string;
  required?: boolean;
  type: Type;
  default?: any;
  validators: Validators;
}

export interface ArrayParameter extends Parameter {
  type: ArrayType;
  collectionFormat?: "csv" | "multi" | "pipes" | "ssv" | "tsv";
}

export interface Validators {
  [key: string]: { value?: any; errorMsg?: string };
}

export interface Security {
  [key: string]: string[];
}

export interface Response {
  description: string;
  name: string;
  schema?: Type;
  examples?: any;
}

export interface Property {
  default?: any;
  description?: string;
  format?: string;
  name: string;
  type: Type;
  required: boolean;
  validators: Validators;
}

export interface Type {
  dataType:
    | "string"
    | "double"
    | "float"
    | "integer"
    | "long"
    | "enum"
    | "array"
    | "datetime"
    | "date"
    | "buffer"
    | "void"
    | "object"
    | "any"
    | "refEnum"
    | "refObject";
}

export interface EnumerateType extends Type {
  dataType: "enum";
  enums: string[];
}

export interface ArrayType extends Type {
  dataType: "array";
  elementType: Type;
}

export interface ReferenceType extends Type {
  description?: string;
  dataType: "refObject" | "refEnum";
  refName: string;
  properties?: Property[];
  additionalProperties?: Type;
  enums?: string[];
  example?: any;
}

export interface ReferenceTypeMap {
  [refName: string]: ReferenceType;
}
