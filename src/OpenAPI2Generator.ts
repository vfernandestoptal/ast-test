import { ApiSpec } from "./types";
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
            methods[method.method] = {};
            if (method.params || method.query) {
              methods[method.method].parameters = [...(method.params || []), ...(method.query || [])];
            }
            if (method.response) {
              methods[method.method].responses = {
                "200": {
                  description: "",
                  schema: method.response,
                },
              };
            }
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
    return apiSpec;
  }
}
