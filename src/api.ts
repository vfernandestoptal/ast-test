/**
 * @pattern ^[0-9a-fA-F]{24}$
 */
type MongoId = string;

interface Dict<T> {
  [s: string]: T;
}

interface AvatarObject {
  default: string;
  pstudent?: string;
  classes?: Dict<string>;
}

interface StudentObject {
  _id: MongoId;
  firstName: string;
  lastName: string;
  year?: number;
  avatars: AvatarObject;
  schoolId?: MongoId;
}

const BranchSessionStudentUrl = "/api/branchSession/:branchSessionIdentifier/student";
interface BranchSessionStudentParams {
  branchSessionIdentifier: string;
}
interface BranchSessionStudentQueryParams {
  phoneNumber?: string;
  aaaaa?: string;
}
type BranchSessionStudentResponse = StudentObject;

const a = 112233;

interface AbcEndpoint {
  POST: {
    params: BranchSessionStudentParams;
    body: TestUnion;
    response: string;
  };
}

type TestUnion = {
  a: string;
} & {
  b: Date;
};

export interface FullAPI {
  aaa: void;
  // endpoint 1
  [BranchSessionStudentUrl]: {
    // GET method
    GET: {
      params: BranchSessionStudentParams;
      query: BranchSessionStudentQueryParams;
      response: BranchSessionStudentResponse;
    };
  };
  // endpoint 2
  "/abc": AbcEndpoint;
  // endpoint 3
  123: {};
  [a]: {};
  ["ab"]: undefined;
  "/no-response": {
    POST: {
      response: void;
    };
  };
}
