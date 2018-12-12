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
// import { getDecorators } from './../utils/decoratorUtils';
// import { getJSDocComment, getJSDocDescription, isExistJSDocTag } from './../utils/jsDocUtils';
import { GenerateMetadataError } from "./exceptions";
import { MetadataGenerator } from "./metadataGenerator";
// import { ParameterGenerator } from './parameterGenerator';
// import { getInitializerValue, resolveType } from './resolveType';
// import { getSecurities } from './security';
import * as Tsoa from "./tsoa";

export class MethodGenerator {
  private method: Tsoa.HTTPMethod;

  constructor(
    private readonly path: string,
    private readonly node: ts.PropertySignature,
    private readonly parentTags?: string[],
    private readonly parentSecurity?: Tsoa.Security[],
  ) {
    this.method = this.getMethod();
  }

  public IsValid() {
    return !!this.method;
  }

  public Generate(): Tsoa.Method {
    if (!this.IsValid()) {
      throw new GenerateMetadataError("This isn't a valid a controller method.");
    }

    // const nodeType = this.node.type;
    // if (!nodeType) {
    //   throw new GenerateMetadataError(`Could not get type for '${this.node.name.getText()}' node.`, this.node);
    // }
    // const type = resolveType(nodeType);
    const responses = this.getMethodResponses();
    // responses.push(this.getMethodSuccessResponse(type));

    return {
      // deprecated: isExistJSDocTag(this.node, (tag) => tag.tagName.text === "deprecated"),
      // description: getJSDocDescription(this.node),
      isHidden: this.getIsHidden(),
      method: this.method,
      name: "",
      operationId: this.getOperationId(),
      parameters: this.buildParameters(),
      path: this.path,
      responses,
      security: this.getSecurity(),
      // summary: getJSDocComment(this.node, "summary"),
      // tags: this.getTags(),
      // type,
    };
  }

  private buildParameters() {
    return [];

    // const parameters = this.node.parameters.map((p) => {
    //   try {
    //     return new ParameterGenerator(p, this.method, this.path).Generate();
    //   } catch (e) {
    //     const methodId = this.node.name as ts.Identifier;
    //     const controllerId = (this.node.parent as ts.ClassDeclaration).name as ts.Identifier;
    //     throw new GenerateMetadataError(`${e.message} \n in '${controllerId.text}.${methodId.text}'`);
    //   }
    // });

    // const bodyParameters = parameters.filter((p) => p.in === "body");
    // const bodyProps = parameters.filter((p) => p.in === "body-prop");

    // if (bodyParameters.length > 1) {
    //   throw new GenerateMetadataError(`Only one body parameter allowed in '${this.getCurrentLocation()}' method.`);
    // }
    // if (bodyParameters.length > 0 && bodyProps.length > 0) {
    //   throw new GenerateMetadataError(
    //     `Choose either during @Body or @BodyProp in '${this.getCurrentLocation()}' method.`,
    //   );
    // }
    // return parameters;
  }

  private getCurrentLocation() {
    return `${this.method} ${this.path}`;
    // const methodId = this.node.name as ts.Identifier;
    // const controllerId = (this.node.parent as ts.ClassDeclaration).name as ts.Identifier;
    // return `${controllerId.text}.${methodId.text}`;
  }

  private getMethod() {
    const methodName = MetadataGenerator.current.getPropertySignatureKey(this.node).toLowerCase();

    if (!Tsoa.isHTTPMethod(methodName)) {
      throw new GenerateMetadataError(`Invalid endpoint method found in ${this.node.name.getText()}`, this.node);
    }

    return methodName;
  }

  private getMethodResponses(): Tsoa.Response[] {
    return [];

    // const decorators = this.getDecoratorsByIdentifier(this.node, "Response");
    // if (!decorators || !decorators.length) {
    //   return [];
    // }

    // return decorators.map((decorator) => {
    //   const expression = decorator.parent as ts.CallExpression;

    //   let description = "";
    //   let name = "200";
    //   let examples;
    //   if (expression.arguments.length > 0 && (expression.arguments[0] as any).text) {
    //     name = (expression.arguments[0] as any).text;
    //   }
    //   if (expression.arguments.length > 1 && (expression.arguments[1] as any).text) {
    //     description = (expression.arguments[1] as any).text;
    //   }
    //   if (expression.arguments.length > 2 && (expression.arguments[2] as any)) {
    //     const argument = expression.arguments[2] as any;
    //     examples = this.getExamplesValue(argument);
    //   }

    //   return {
    //     description,
    //     examples,
    //     name,
    //     schema:
    //       expression.typeArguments && expression.typeArguments.length > 0
    //         ? resolveType(expression.typeArguments[0])
    //         : undefined,
    //   } as Tsoa.Response;
    // });
  }

  // private getMethodSuccessResponse(type: Tsoa.Type): Tsoa.Response {
  //   const decorators = this.getDecoratorsByIdentifier(this.node, "SuccessResponse");
  //   if (!decorators || !decorators.length) {
  //     return {
  //       description: type.dataType === "void" ? "No content" : "Ok",
  //       examples: this.getMethodSuccessExamples(),
  //       name: type.dataType === "void" ? "204" : "200",
  //       schema: type,
  //     };
  //   }
  //   if (decorators.length > 1) {
  //     throw new GenerateMetadataError(
  //       `Only one SuccessResponse decorator allowed in '${this.getCurrentLocation}' method.`,
  //     );
  //   }

  //   const decorator = decorators[0];
  //   const expression = decorator.parent as ts.CallExpression;

  //   let description = "";
  //   let name = "200";
  //   const examples = this.getMethodSuccessExamples();

  //   if (expression.arguments.length > 0 && (expression.arguments[0] as any).text) {
  //     name = (expression.arguments[0] as any).text;
  //   }
  //   if (expression.arguments.length > 1 && (expression.arguments[1] as any).text) {
  //     description = (expression.arguments[1] as any).text;
  //   }

  //   return {
  //     description,
  //     examples,
  //     name,
  //     schema: type,
  //   };
  // }

  private getMethodSuccessExamples() {
    return undefined;

    // const exampleDecorators = this.getDecoratorsByIdentifier(this.node, "Example");
    // if (!exampleDecorators || !exampleDecorators.length) {
    //   return undefined;
    // }
    // if (exampleDecorators.length > 1) {
    //   throw new GenerateMetadataError(`Only one Example decorator allowed in '${this.getCurrentLocation}' method.`);
    // }

    // const decorator = exampleDecorators[0];
    // const expression = decorator.parent as ts.CallExpression;
    // const argument = expression.arguments[0] as any;

    // return this.getExamplesValue(argument);
  }

  private getExamplesValue(argument: any) {
    const example: any = {};
    // argument.properties.forEach((p: any) => {
    //   example[p.name.text] = getInitializerValue(p.initializer);
    // });
    return example;
  }

  private getOperationId() {
    return "";
    // const opDecorators = this.getDecoratorsByIdentifier(this.node, "OperationId");
    // if (!opDecorators || !opDecorators.length) {
    //   return undefined;
    // }
    // if (opDecorators.length > 1) {
    //   throw new GenerateMetadataError(`Only one OperationId decorator allowed in '${this.getCurrentLocation}' method.`);
    // }

    // const decorator = opDecorators[0];
    // const expression = decorator.parent as ts.CallExpression;
    // const ops = expression.arguments.map((a: any) => a.text as string);
    // return ops[0];
  }

  // private getTags() {
  //   const tagsDecorators = this.getDecoratorsByIdentifier(this.node, "Tags");
  //   if (!tagsDecorators || !tagsDecorators.length) {
  //     return this.parentTags;
  //   }
  //   if (tagsDecorators.length > 1) {
  //     throw new GenerateMetadataError(`Only one Tags decorator allowed in '${this.getCurrentLocation}' method.`);
  //   }

  //   const decorator = tagsDecorators[0];
  //   const expression = decorator.parent as ts.CallExpression;
  //   const tags = expression.arguments.map((a: any) => a.text as string);
  //   if (this.parentTags) {
  //     tags.push(...this.parentTags);
  //   }
  //   return tags;
  // }

  private getIsHidden() {
    return false;

    // const hiddenDecorators = this.getDecoratorsByIdentifier(this.node, "Hidden");
    // if (!hiddenDecorators || !hiddenDecorators.length) {
    //   return false;
    // }
    // if (hiddenDecorators.length > 1) {
    //   throw new GenerateMetadataError(`Only one Hidden decorator allowed in '${this.getCurrentLocation}' method.`);
    // }

    // return true;
  }

  private getSecurity(): Tsoa.Security[] {
    return [];

    // const securityDecorators = this.getDecoratorsByIdentifier(this.node, "Security");
    // if (!securityDecorators || !securityDecorators.length) {
    //   return this.parentSecurity || [];
    // }

    // return getSecurities(securityDecorators);
  }

  // private getDecoratorsByIdentifier(node: ts.Node, id: string) {
  //   return getDecorators(node, (identifier) => identifier.text === id);
  // }
}
