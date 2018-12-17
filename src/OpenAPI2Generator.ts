import { ApiSpec, MethodDefinition } from "./types";
import { convertUrlParametersToCurlyBraces } from "./utils/url";

export interface OpenAPI2Options {
  title: string;
  version: string;
  host: string;
  basePath: string;
  schemes: string[];
}

export class OpenAPI2Generator {
  constructor(private options: OpenAPI2Options) {}

  public generate({ routes, definitions }: ApiSpec) {
    const paths = routes.reduce(
      (paths, route) => {
        const url = convertUrlParametersToCurlyBraces(route.url);
        const methodMap = route.methods.reduce(
          (methods, method) => {
            methods[method.method] = this.generateMethod(method);
            return methods;
          },
          {} as any,
        );
        paths[url] = methodMap;
        return paths;
      },
      {} as any,
    );

    const apiSpec = {
      swagger: "2.0",
      info: {
        title: this.options.title,
        version: this.options.version,
      },
      host: this.options.host,
      basePath: this.options.basePath,
      schemes: this.options.schemes,
      paths,
      definitions: {} as any,
    };

    definitions.forEach((def, defKey) => {
      apiSpec.definitions[defKey] = def;
    });

    // return this.escapeRefNames(apiSpec);
    return apiSpec;
  }

  private generateMethod(method: MethodDefinition) {
    const methodSpec = {
      parameters: this.generateMethodParameters(method),
      responses: this.generateMethodResponses(method),
    };

    return methodSpec;
  }

  private generateMethodParameters(method: MethodDefinition) {
    const params: any[] = [];
    if (method.params && method.params.length > 0) {
      params.push(...method.params);
    }
    if (method.query && method.query.length > 0) {
      params.push(...method.query);
    }
    if (method.body && !method.body.not) {
      params.push(method.body);
    }

    return params.length > 0 ? params : undefined;
  }

  private generateMethodResponses(method: MethodDefinition) {
    return method.response && !method.response.not
      ? {
          "200": {
            description: "OK",
            schema: method.response,
          },
        }
      : {
          "200": {
            description: "OK",
          },
        };
  }

  // private escapeRefNames(spec: any) {
  //   const specJson = JSON.stringify(spec).replace(
  //     /(\"\$ref\":\s?\"#\/definitions\/)(.*?)(\")/g,
  //     (__, prefix, value, suffix) => {
  //       // encode $ref name to RFC3986
  //       return prefix + encodeURIComponent(value) + suffix;
  //     },
  //   );
  //   return JSON.parse(specJson);
  // }
}
