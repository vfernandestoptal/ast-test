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

// import * as mm from 'minimatch';
import * as ts from "typescript";
import { ControllerGenerator } from "./controllerGenerator";
import * as Tsoa from "./tsoa";
import { GenerateMetadataError } from "./exceptions";

export class MetadataGenerator {
  public static current: MetadataGenerator;
  public readonly nodes = new Array<ts.Node>();
  public readonly typeChecker: ts.TypeChecker;
  private readonly program: ts.Program;
  private referenceTypeMap: Tsoa.ReferenceTypeMap = {};
  private circularDependencyResolvers = new Array<(referenceTypes: Tsoa.ReferenceTypeMap) => void>();
  private apiTypeName: string;

  public IsExportedNode(node: ts.Node) {
    return true;
  }

  constructor(
    apiTypeName: string,
    entryFile: string,
    compilerOptions?: ts.CompilerOptions,
    private readonly ignorePaths?: string[],
  ) {
    this.apiTypeName = apiTypeName;
    this.program = ts.createProgram([entryFile], compilerOptions || {});
    this.typeChecker = this.program.getTypeChecker();
    MetadataGenerator.current = this;
  }

  public Generate(): Tsoa.Metadata {
    this.program.getSourceFiles().forEach((sf) => {
      // if (this.ignorePaths && this.ignorePaths.length) {
      //   for (const path of this.ignorePaths) {
      //     if (mm(sf.fileName, path)) {
      //       return;
      //     }
      //   }
      // }

      ts.forEachChild(sf, (node) => {
        this.nodes.push(node);
      });
    });

    const controllers = this.buildControllers();

    this.circularDependencyResolvers.forEach((c) => c(this.referenceTypeMap));

    return {
      controllers,
      referenceTypeMap: this.referenceTypeMap,
    };
  }

  public TypeChecker() {
    return this.typeChecker;
  }

  public AddReferenceType(referenceType: Tsoa.ReferenceType) {
    if (!referenceType.refName) {
      return;
    }
    this.referenceTypeMap[referenceType.refName] = referenceType;
  }

  public GetReferenceType(refName: string) {
    return this.referenceTypeMap[refName];
  }

  public OnFinish(callback: (referenceTypes: Tsoa.ReferenceTypeMap) => void) {
    this.circularDependencyResolvers.push(callback);
  }

  private buildControllers() {
    const apiDeclaration = this.nodes
      .filter(ts.isInterfaceDeclaration)
      .find((declaration) => declaration.name.text === this.apiTypeName);

    return apiDeclaration
      ? apiDeclaration.members
          .filter(ts.isPropertySignature)
          .map((endpoint) => new ControllerGenerator(endpoint))
          .filter((generator) => generator.IsValid())
          .map((generator) => generator.Generate())
          .filter(this.controllerHasMethods)
      : [];
  }

  private controllerHasMethods(controller: Tsoa.Controller) {
    return controller.methods.length > 0;
  }

  public getPropertySignatureKey(node: ts.PropertySignature) {
    const nameNode = node.name;
    const nameSymbol = MetadataGenerator.current.typeChecker.getSymbolAtLocation(nameNode);

    if (!nameSymbol) {
      throw new GenerateMetadataError(`Could not get name symbol for '${nameNode.getText()}' node.`);
    }

    return nameSymbol.escapedName.toString();
  }
}
