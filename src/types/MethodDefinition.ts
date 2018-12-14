import { Definition } from "./Definition";

export interface MethodDefinition {
  method: string;
  params?: Definition[];
  query?: Definition[];
  body?: Definition;
  response?: Definition;
}
