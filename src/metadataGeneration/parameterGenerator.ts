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

import * as ts from "typescript";
// import { getDecoratorName, getDecoratorTextValue } from './../utils/decoratorUtils';
// import { getParameterValidators } from './../utils/validatorUtils';
import { GenerateMetadataError } from "./exceptions";
import { MetadataGenerator } from "./metadataGenerator";
// import { getInitializerValue, resolveType } from "./resolveType";
import * as Tsoa from "./tsoa";
import { resolveType } from "./resolveType";

export class ParameterGenerator {
  constructor(
    private readonly methodDefinition: ts.TypeNode,
    private readonly method: string,
    private readonly path: string,
  ) {}

  public Generate(): Tsoa.Parameter {
    if (ts.isTypeLiteralNode(this.methodDefinition)) {
      this.methodDefinition.members.filter(ts.isPropertySignature).map((prop) => {
        const propName = MetadataGenerator.current.getPropertySignatureKey(prop);
        switch (propName) {
          case "params":
            return this.getPathParameter(this.parameter);
            break;

          case "query":
            break;
        }
      });
    }

    // return this.getPathParameter(this.parameter);

    // const decoratorName = getDecoratorName(this.parameter, (identifier) =>
    //   this.supportParameterDecorator(identifier.text),
    // );

    // switch (decoratorName) {
    //   case "Request":
    //     return this.getRequestParameter(this.parameter);
    //   case "Body":
    //     return this.getBodyParameter(this.parameter);
    //   case "BodyProp":
    //     return this.getBodyPropParameter(this.parameter);
    //   case "Header":
    //     return this.getHeaderParameter(this.parameter);
    //   case "Query":
    //     return this.getQueryParameter(this.parameter);
    //   case "Path":
    //     return this.getPathParameter(this.parameter);
    //   default:
    //     return this.getPathParameter(this.parameter);
    // }
  }

  private getRequestParameter(parameter: ts.ParameterDeclaration): Tsoa.Parameter {
    const parameterName = (parameter.name as ts.Identifier).text;
    return {
      description: this.getParameterDescription(parameter),
      in: "request",
      name: parameterName,
      parameterName,
      required: !parameter.questionToken && !parameter.initializer,
      type: { dataType: "object" },
      validators: {}, // getParameterValidators(this.parameter, parameterName),
    };
  }

  private getBodyPropParameter(parameter: ts.ParameterDeclaration): Tsoa.Parameter {
    const parameterName = (parameter.name as ts.Identifier).text;
    const type = this.getValidatedType(parameter);

    if (!this.supportBodyMethod(this.method)) {
      throw new GenerateMetadataError(
        `@BodyProp('${parameterName}') Can't support in ${this.method.toUpperCase()} method.`,
      );
    }

    return {
      default: getInitializerValue(parameter.initializer, type),
      description: this.getParameterDescription(parameter),
      in: "body-prop",
      name: getDecoratorTextValue(this.parameter, (ident) => ident.text === "BodyProp") || parameterName,
      parameterName,
      required: !parameter.questionToken && !parameter.initializer,
      type,
      validators: getParameterValidators(this.parameter, parameterName),
    };
  }

  private getBodyParameter(parameter: ts.ParameterDeclaration): Tsoa.Parameter {
    const parameterName = (parameter.name as ts.Identifier).text;
    const type = this.getValidatedType(parameter);

    if (!this.supportBodyMethod(this.method)) {
      throw new GenerateMetadataError(
        `@Body('${parameterName}') Can't support in ${this.method.toUpperCase()} method.`,
      );
    }

    return {
      description: this.getParameterDescription(parameter),
      in: "body",
      name: parameterName,
      parameterName,
      required: !parameter.questionToken && !parameter.initializer,
      type,
      validators: getParameterValidators(this.parameter, parameterName),
    };
  }

  private getHeaderParameter(parameter: ts.ParameterDeclaration): Tsoa.Parameter {
    const parameterName = (parameter.name as ts.Identifier).text;
    const type = this.getValidatedType(parameter, false);

    if (!this.supportPathDataType(type)) {
      throw new GenerateMetadataError(`@Header('${parameterName}') Can't support '${type.dataType}' type.`);
    }

    return {
      default: getInitializerValue(parameter.initializer, type),
      description: this.getParameterDescription(parameter),
      in: "header",
      name: getDecoratorTextValue(this.parameter, (ident) => ident.text === "Header") || parameterName,
      parameterName,
      required: !parameter.questionToken && !parameter.initializer,
      type,
      validators: getParameterValidators(this.parameter, parameterName),
    };
  }

  private getQueryParameter(parameter: ts.ParameterDeclaration): Tsoa.Parameter {
    const parameterName = (parameter.name as ts.Identifier).text;
    const type = this.getValidatedType(parameter, false);

    const commonProperties = {
      default: getInitializerValue(parameter.initializer, type),
      description: this.getParameterDescription(parameter),
      in: "query" as "query",
      name: getDecoratorTextValue(this.parameter, (ident) => ident.text === "Query") || parameterName,
      parameterName,
      required: !parameter.questionToken && !parameter.initializer,
      validators: getParameterValidators(this.parameter, parameterName),
    };

    if (type.dataType === "array") {
      const arrayType = type as Tsoa.ArrayType;
      if (!this.supportPathDataType(arrayType.elementType)) {
        throw new GenerateMetadataError(
          `@Query('${parameterName}') Can't support array '${arrayType.elementType.dataType}' type.`,
        );
      }
      return {
        ...commonProperties,
        collectionFormat: "multi",
        type: arrayType,
      } as Tsoa.ArrayParameter;
    }

    if (!this.supportPathDataType(type)) {
      throw new GenerateMetadataError(`@Query('${parameterName}') Can't support '${type.dataType}' type.`);
    }

    return {
      ...commonProperties,
      type,
    };
  }

  private getPathParameter(parameter: ts.ParameterDeclaration): Tsoa.Parameter {
    const parameterName = (parameter.name as ts.Identifier).text;
    const type = this.getValidatedType(parameter, false);
    const pathName = getDecoratorTextValue(this.parameter, (ident) => ident.text === "Path") || parameterName;

    if (!this.supportPathDataType(type)) {
      throw new GenerateMetadataError(`@Path('${parameterName}') Can't support '${type.dataType}' type.`);
    }
    if (!this.path.includes(`{${pathName}}`)) {
      throw new GenerateMetadataError(`@Path('${parameterName}') Can't match in URL: '${this.path}'.`);
    }

    return {
      default: getInitializerValue(parameter.initializer, type),
      description: this.getParameterDescription(parameter),
      in: "path",
      name: pathName,
      parameterName,
      required: true,
      type,
      validators: getParameterValidators(this.parameter, parameterName),
    };
  }

  private getParameterDescription(node: ts.ParameterDeclaration) {
    const symbol = MetadataGenerator.current.typeChecker.getSymbolAtLocation(node.name);
    if (!symbol) {
      return undefined;
    }

    const comments = symbol.getDocumentationComment(MetadataGenerator.current.typeChecker);
    if (comments.length) {
      return ts.displayPartsToString(comments);
    }

    return undefined;
  }

  private supportBodyMethod(method: string) {
    return ["post", "put", "patch"].some((m) => m === method.toLowerCase());
  }

  // private supportParameterDecorator(decoratorName: string) {
  //   return ["header", "query", "parem", "body", "bodyprop", "request"].some(
  //     (d) => d === decoratorName.toLocaleLowerCase(),
  //   );
  // }

  private supportPathDataType(parameterType: Tsoa.Type) {
    return [
      "string",
      "integer",
      "long",
      "float",
      "double",
      "date",
      "datetime",
      "buffer",
      "boolean",
      "enum",
      "any",
    ].find((t) => t === parameterType.dataType);
  }

  private getValidatedType(parameter: ts.ParameterDeclaration, extractEnum = true) {
    let typeNode = parameter.type;
    if (!typeNode) {
      const type = MetadataGenerator.current.typeChecker.getTypeAtLocation(parameter);
      typeNode = MetadataGenerator.current.typeChecker.typeToTypeNode(type) as ts.TypeNode;
    }
    return resolveType(typeNode, parameter, extractEnum);
  }
}
