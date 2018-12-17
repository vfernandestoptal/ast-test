import { Request } from "request";

/**
 * @pattern ^[0-9a-fA-F]{24}$
 */
type MongoId = string;

interface Dict<T> {
  [s: string]: T;
}

type EntityType = "teacher" | "parent" | "pstudent" | "student" | "studentUser" | "other";

interface UserObject {
  _id: MongoId;
  type?: EntityType;
  entities: Dict<MongoId>;
  email?: string;
  phoneNumber?: string;
  username?: string;
  autoCreated?: boolean;
  emailVerified: boolean;
  bouncedEmailAddress: boolean;
  locale?: string;
  deleted: boolean;
}

const AckBranchSessionUrl = "/api/ackBranchSession";
interface AckBranchSessionPostPayload {
  branchSessionId: string;
  [key: string]: any;
}

const AssignmentCollectionUrl = "/api/portfolioAssignment";
const AssignmentMemberUrl = "/api/portfolioAssignment/:assignmentId";
interface AssignmentCollectionQueryParams {
  classId?: MongoId;
  completed?: boolean;
}
interface AssignmentCollectionGetResponse {
  _items: AssignmentObject[];
}
interface AssignmentCreatePayload {
  name: string;
  description?: string;
  workFormat: WorkFormat;
  classId: MongoId;
  folderId?: MongoId;
  studentIds?: MongoId[];
}
type AssignmentCreateResponse = AssignmentObject;

interface AssignmentMemberParams {
  assignmentId: MongoId;
}
type AssignmentMemberGetResponse = AssignmentObject;
type AssignmentDeleteResponse = void;

interface AssignmentObject {
  _id: MongoId;
  classId: MongoId;
  folderId?: MongoId;
  assignerId: MongoId;
  createdAt: Date;
  activity: SimpleActivity;
  students: AssignmentStudentObject[];
  complete: boolean;
}

interface AssignmentStudentObject {
  state: AssignmentState;
  _id: MongoId;
  postId?: MongoId;
  firstName: string;
  lastName: string;
  avatar: string;
}

interface SimpleActivity {
  _id: MongoId;
  name: string;
  description: string;
  workFormat: WorkFormat;
}

type WorkFormat = "text" | "drawing" | "photo" | "video";

type AssignmentState = "assigned" | "submitted" | "approved";

interface StudentResponse {
  _id: MongoId;
  firstName: string;
  lastName: string;
  loginCode?: string;
  currentAttendance: string;
  positivePoints: number;
  negativePoints: number;
  currentPoints: number;
  classes: Class[];
  parentConnections: Array<ParentConnectionInfo | ParentInviteInfo>;
  blockedParentConnections: BlockedParentConnectionInfo[];
  defaultAvatar?: string;
  avatar: string;
  parentCode?: string;
  studentCode?: string;
  schoolId: string;
  hasStudentUser: boolean;
  studentUser?: StudentUser;
}

interface Class {
  _id: MongoId;
  name: string;
  icon: string;
  year: string;
  pointsSharing: string;
  archived: boolean;
  inactive: boolean;
  avatar: string;
  teacher: Teacher;
}

interface Teacher {
  _id: MongoId;
  title: string;
  firstName: string;
  lastName: string;
}

interface StudentUser {
  username?: string;
  lastLogin?: string;
  _id: MongoId;
  autoCreated?: boolean;
}

type ParentConnectionInfo = Pick<ParentObject, "_id" | "emailAddress" | "firstName" | "lastName" | "lastLogin"> &
  Partial<Pick<ParentObject, "avatarURL">> & {
    status: "connected";
    email: string;
  };

type BlockedParentConnectionInfo = Pick<ParentObject, "_id" | "emailAddress" | "firstName" | "lastName"> & {
  status: "revoked";
};

interface ParentObject {
  _id: MongoId;
  userId: MongoId;
  firstName: string;
  lastName: string;
  locale: string;
  timezone: string;
  emailAddress: string;
  lastLogin: Date;
  countryCode: string;
  avatarURL?: string;
  phoneNumber: string;
  phoneNumberVerified: boolean;
}

type ParentInviteInfo = Pick<InviteObject, "emailAddress" | "phoneNumber"> & {
  invitationId: MongoId; // typeof ParentInvite._id
  status: "pending";
  email?: string; // deprecated, use emailAddress
};

interface InviteObject {
  _id: SecureId | MongoId;
  studentId: MongoId;
  teacherId: MongoId;
  parentCode: string;
  status: InviteStatus;
  emailAddress?: string;
  phoneNumber?: string;
  autoRedeemParent?: Pick<ParentObject, "_id" | "firstName" | "lastName">;
  originalEmailAddress?: string;
}

type InviteStatus = "pending" | "accepted" | "revoked";

/**
 * @pattern ^[a-f0-9]{24}:[a-f0-9]{40}$
 */
type SecureId = string;

/**
 * @maxLength 50
 */
type PersonFirstOrLastName = string;

interface ClassStudentPOSTPayload {
  firstName: PersonFirstOrLastName;
  lastName: PersonFirstOrLastName;
  avatarNumber?: number;
  avatarUrl?: string;
  avatar?: string;
  showLeftEarly?: string;
  age?: number;
  currentPoints?: number;
  latestTeacherGuessDbId?: number;
  negativePoints?: number;
  parentConnections?: any[];
  points?: number;
  positivePoints?: number;
  team?: number;
}

interface ClassStudentPUTPayload extends ClassStudentPOSTPayload {
  _id: string;
}

interface API {
  [AckBranchSessionUrl]: {
    POST: {
      body: AckBranchSessionPostPayload;
      response: void;
    };
  };
  [AssignmentCollectionUrl]: {
    GET: {
      query: AssignmentCollectionQueryParams;
      response: AssignmentCollectionGetResponse;
    };
    POST: {
      body: AssignmentCreatePayload;
      response: AssignmentCreateResponse;
    };
  };
  [AssignmentMemberUrl]: {
    GET: {
      params: AssignmentMemberParams;
      response: AssignmentMemberGetResponse;
    };
    DELETE: {
      params: AssignmentMemberParams;
      response: AssignmentDeleteResponse;
    };
  };
  "/api/dojoClass/:classId/students/:id": {
    GET: {
      params: {
        classId: MongoId;
        id: MongoId;
      };
      query: {
        withCodes?: string;
        showLeftEarly?: "true";
      };
      response: StudentResponse;
    };
    PUT: {
      params: {
        classId: MongoId;
        id: MongoId;
      };
      query: {
        showLeftEarly?: "true";
      };
      response: StudentResponse;
      body: ClassStudentPUTPayload;
    };
    DELETE: {
      params: {
        classId: MongoId;
        id: MongoId;
      };
      query: {};
      response: void;
    };
  };
}

interface TestAPI {
  "/api/sessionContents": {
    GET: {
      response: UserObject | {};
    };
  };
  "/api/emailVerificationParams": {
    GET: {
      response: {
        userId: string;
        email: string;
        hash: string;
      };
    };
  };
  "/api/typeError": {
    GET: {
      response: never;
    };
  };
  "/api/mediaIntegration/*": {
    GET: {
      response: Request;
    };
    PUT: {
      response: void;
    };
  };
}

export type FullAPI = API & TestAPI;
