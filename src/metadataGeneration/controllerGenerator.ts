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
import { GenerateMetadataError } from "./exceptions";
// import { MethodGenerator } from './methodGenerator';
// import { getSecurities } from './security';
import * as Tsoa from "./tsoa";
import { MetadataGenerator } from "./metadataGenerator";
import { MethodGenerator } from "./methodGenerator";

export class ControllerGenerator {
  private readonly path: string;
  private readonly name?: string;
  // private readonly tags?: string[];
  // private readonly security?: Tsoa.Security[];

  constructor(private readonly node: ts.PropertySignature) {
    this.path = this.getPath();
    this.name = this.getName();
    // this.tags = this.getTags();
    // this.security = this.getSecurity();
  }

  public IsValid() {
    const hasValidPath = !!this.path;
    const hasValidName = !!this.name || this.name === "";
    return hasValidPath && hasValidName;
  }

  public Generate(): Tsoa.Controller {
    // TODO: remove?
    if (!this.node.parent) {
      throw new GenerateMetadataError("Controller node doesn't have a valid parent source file.");
    }

    // TODO: figure out how to get a name?
    // if (!this.node.name) {
    //   throw new GenerateMetadataError("Controller node doesn't have a valid name.");
    // }

    const sourceFile = this.node.parent.getSourceFile();

    return {
      location: sourceFile.fileName,
      methods: this.buildMethods(),
      name: this.name || "",
      path: this.path,
    };
  }

  private buildMethods() {
    const nodeType = this.node.type;
    if (!nodeType) {
      throw new GenerateMetadataError(`Could not get type for '${this.node.name.getText()}' node.`, this.node);

      // const typeChecker = MetadataGenerator.current.typeChecker;
      // const signature = typeChecker.getSignatureFromDeclaration(this.node);
      // const implicitType = typeChecker.getReturnTypeOfSignature(signature!);
      // nodeType = typeChecker.typeToTypeNode(implicitType) as ts.TypeNode;
    }

    if (ts.isTypeLiteralNode(nodeType)) {
      return nodeType
        .members
        .filter(ts.isPropertySignature)
        .map(method => new MethodGenerator(this.path, method))
        .filter((generator) => generator.IsValid())
        .map((generator) => generator.Generate());
    }

    // TODO: handle type references
    // if (ts.isTypeReferenceNode(nodeType)) {
    //   nodeType.
    //   const typeSymbol = MetadataGenerator.current.typeChecker.getSymbolAtLocation(nodeType);
    //   MetadataGenerator.current.typeChecker.gettypeno
    // }

    return [];
    // return this.node.members
    //   .filter((m) => m.kind === ts.SyntaxKind.MethodDeclaration)
    //   .map((m: ts.MethodDeclaration) => new MethodGenerator(m, this.tags, this.security))
  }

  private getName() {
    // TODO: figure out how to get a name?
    // this.node.name.text,
    return this.path;
  }

  private getPath() {
    return MetadataGenerator.current.getPropertySignatureKey(this.node);
  }

  // private getTags() {
  //   const decorators = getDecorators(this.node, (identifier) => identifier.text === "Tags");
  //   if (!decorators || !decorators.length) {
  //     return;
  //   }
  //   if (decorators.length > 1) {
  //     throw new GenerateMetadataError(`Only one Tags decorator allowed in '${this.node.name!.text}' class.`);
  //   }

  //   const decorator = decorators[0];
  //   const expression = decorator.parent as ts.CallExpression;

  //   return expression.arguments.map((a: any) => a.text as string);
  // }

  // private getSecurity(): Tsoa.Security[] {
  //   const securityDecorators = getDecorators(this.node, (identifier) => identifier.text === "Security");
  //   if (!securityDecorators || !securityDecorators.length) {
  //     return [];
  //   }

  //   return getSecurities(securityDecorators);
  // }
}
