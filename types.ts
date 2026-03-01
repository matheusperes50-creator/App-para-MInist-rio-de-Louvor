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
}

export interface ScheduleAssignment {
  role: string;
  memberId: string;
}

export interface Schedule {
  id: string;
  date: string;
  serviceType: string;
  members: string[]; 
  assignments: ScheduleAssignment[];
  songs: (string | ScheduleSong)[];
  leaderIds: string[]; 
  vocalIds?: string[];
}

export type ViewType = 'dashboard' | 'members' | 'songs' | 'schedules' | 'new-songs';