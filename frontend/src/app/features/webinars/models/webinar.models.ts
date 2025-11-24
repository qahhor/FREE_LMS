export interface Webinar {
  id: number;
  title: string;
  description: string | null;
  scheduledAt: Date;
  duration: number; // minutes
  instructor: {
    id: number;
    firstName: string;
    lastName: string;
    avatar: string | null;
  };
  provider: 'zoom' | 'jitsi' | 'custom';
  meetingId: string | null;
  password: string | null;
  maxParticipants: number | null;
  status: WebinarStatus;
  recording: {
    available: boolean;
    url: string | null;
    duration: number | null;
  } | null;
  participants: WebinarParticipant[];
  createdAt: Date;
}

export enum WebinarStatus {
  SCHEDULED = 'scheduled',
  LIVE = 'live',
  ENDED = 'ended',
  CANCELLED = 'cancelled'
}

export interface WebinarParticipant {
  id: number;
  user: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    avatar: string | null;
  };
  joinedAt: Date | null;
  leftAt: Date | null;
  duration: number | null; // seconds
  status: ParticipantStatus;
}

export enum ParticipantStatus {
  REGISTERED = 'registered',
  JOINED = 'joined',
  LEFT = 'left',
  ABSENT = 'absent'
}

export interface CreateWebinarRequest {
  title: string;
  description?: string;
  scheduledAt: Date;
  duration: number;
  provider: 'zoom' | 'jitsi' | 'custom';
  maxParticipants?: number;
}

export interface UpdateWebinarRequest {
  title?: string;
  description?: string;
  scheduledAt?: Date;
  duration?: number;
  maxParticipants?: number;
}

export interface JoinWebinarResponse {
  joinUrl: string;
  password: string | null;
  provider: 'zoom' | 'jitsi' | 'custom';
}

export interface WebinarStats {
  totalWebinars: number;
  upcomingWebinars: number;
  completedWebinars: number;
  totalParticipants: number;
  averageAttendance: number;
  totalRecordings: number;
}

export interface WebinarCalendarEvent {
  id: number;
  title: string;
  start: Date;
  end: Date;
  status: WebinarStatus;
  instructor: string;
  participants: number;
}
