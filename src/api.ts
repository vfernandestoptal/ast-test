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
}
type BranchSessionStudentResponse = StudentObject;

export interface API {
  [BranchSessionStudentUrl]: {
    GET: {
      params: BranchSessionStudentParams;
      query: BranchSessionStudentQueryParams;
      response: BranchSessionStudentResponse;
    };
  };
  "/abc": {
    POST: {};
  };
  123: {};
}
