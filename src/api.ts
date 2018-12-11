/**
 * @pattern ^[0-9a-fA-F]{24}$
 */
type MongoId = string;

interface Dict<T> {
  [s: string]: T;
}

export interface AvatarObject {
  default: string;
  pstudent?: string;
  classes?: Dict<string>;
}

export interface PStudentUserObject {
  _id: MongoId;
  uid: MongoId;
  username?: string;
  age?: number;
  access?: Date;
  emailAddress?: string;
  autoCreated?: boolean;
  parent?: PStudentParent;
}

export interface PStudentParent {
  email?: string;
  consented?: boolean;
}

export interface StudentObject {
  _id: MongoId;
  pastClasses: MongoId[];
  firstName: string;
  lastName: string;
  year?: number;
  demo?: boolean;
  avatars: AvatarObject;
  birthDay?: number;
  birthMonth?: number;
  schoolId?: MongoId;
  graduatedAt?: Date;
  pStudent?: PStudentUserObject;
  classes: MongoId[];
}

export const BranchSessionStudentUrl =
  "/api/branchSession/:branchSessionIdentifier/student";
export interface BranchSessionStudentParams {
  branchSessionIdentifier: string;
}
export interface BranchSessionStudentQueryParams {
  phoneNumber?: string;
}
export type BranchSessionStudentResponse = StudentObject;

export interface API {
  [BranchSessionStudentUrl]: {
    GET: {
      params: BranchSessionStudentParams;
      query: BranchSessionStudentQueryParams;
      response: BranchSessionStudentResponse;
    };
  };
}
