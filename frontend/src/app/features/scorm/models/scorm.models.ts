export interface ScormPackage {
  id: number;
  title: string;
  description: string | null;
  version: '1.2' | '2004';
  packagePath: string;
  manifestPath: string;
  launchUrl: string;
  thumbnail: string | null;
  metadata: ScormMetadata;
  duration: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ScormMetadata {
  identifier: string;
  version: string;
  schema: string;
  schemaVersion: string;
  organizations: ScormOrganization[];
  resources: ScormResource[];
}

export interface ScormOrganization {
  identifier: string;
  title: string;
  items: ScormItem[];
}

export interface ScormItem {
  identifier: string;
  identifierref: string | null;
  title: string;
  isvisible: boolean;
  parameters: string | null;
  children: ScormItem[];
}

export interface ScormResource {
  identifier: string;
  type: string;
  href: string;
  files: string[];
}

export interface ScormTracking {
  id: number;
  packageId: number;
  userId: number;
  sessionId: string;
  lessonLocation: string | null;
  lessonStatus: ScormLessonStatus;
  scoreRaw: number | null;
  scoreMin: number | null;
  scoreMax: number | null;
  totalTime: string | null;
  sessionTime: string | null;
  completionStatus: ScormCompletionStatus | null;
  suspendData: string | null;
  launchData: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export enum ScormLessonStatus {
  PASSED = 'passed',
  COMPLETED = 'completed',
  FAILED = 'failed',
  INCOMPLETE = 'incomplete',
  BROWSED = 'browsed',
  NOT_ATTEMPTED = 'not attempted'
}

export enum ScormCompletionStatus {
  COMPLETED = 'completed',
  INCOMPLETE = 'incomplete',
  NOT_ATTEMPTED = 'not attempted',
  UNKNOWN = 'unknown'
}

export interface ScormUploadRequest {
  file: File;
  title: string;
  description?: string;
}

export interface ScormLaunchData {
  launchUrl: string;
  sessionId: string;
  tracking: ScormTracking | null;
}

export interface ScormProgress {
  packageId: number;
  packageTitle: string;
  lessonStatus: ScormLessonStatus;
  completionStatus: ScormCompletionStatus | null;
  scoreRaw: number | null;
  scoreMax: number | null;
  totalTime: string | null;
  lastAccessed: Date;
  progress: number; // percentage 0-100
}
