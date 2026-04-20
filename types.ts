export enum Role {
  VOCAL = 'Vocal',
  GUITAR = 'Violão/Guitarra',
  BASS = 'Baixo',
  DRUMS = 'Bateria',
  KEYS = 'Teclado',
  OTHER = 'Outro'
}

export enum SongStatus {
  PENDING = 'Pendente',
  REHEARSING = 'Ensaiando',
  READY = 'Pronta'
}

export type UserRoleType = 'admin' | 'member' | 'guest';

export interface Member {
  id: string;
  name: string;
  roles: Role[];
  isActive: boolean;
  photoUrl?: string;
  birthDate?: string;
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  bpm?: number;
  key?: string;
  status: SongStatus;
  youtubeUrl?: string;
}

export interface ScheduleSong {
  id: string;
  key: string;
  confirmed?: boolean;
}

export interface ScheduleAssignment {
  role: string;
  memberId: string;
  confirmed?: boolean;
  present?: boolean; // Added for attendance tracking
}

export interface Schedule {
  id: string;
  date: string;
  serviceType: string;
  members: string[]; 
  assignments: ScheduleAssignment[];
  songs: ScheduleSong[];
  leaderIds: string[]; 
  vocalIds?: string[];
  confirmed?: boolean;
  attendanceMarked?: boolean; // New field
  observations?: string;
  postSermonSong?: ScheduleSong;
}

export interface ExternalEvent {
  id: string;
  title: string;
  date: string;
  time?: string;
  location: string;
  description?: string;
  status: 'pending' | 'confirmed' | 'declined';
  repertoire: string[];
  memberIds?: string[];
}

export interface LookStyle {
  id: string;
  title: string;
  colors: string[];
  description?: string;
  imageUrl?: string;
  date?: string;
}

export type ViewType = 'dashboard' | 'members' | 'songs' | 'schedules' | 'new-songs' | 'reports' | 'events' | 'style';
