import { MethodDefinition } from "./MethodDefinition";

export interface RouteDefinition {
  url: string;
  methods: MethodDefinition[];
}
