import { Definition } from "./Definition";
import { RouteDefinition } from "./RouteDefinition";

export interface ApiSpec {
  routes: RouteDefinition[];
  definitions: Map<string, Definition>;
}
