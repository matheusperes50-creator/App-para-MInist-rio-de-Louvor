export enum Role {
  VOCAL = 'Vocal',
  GUITAR = 'Violão/Guitarra',
  BASS = 'Baixo',
  DRUMS = 'Bateria',
  KEYS = 'Teclado',
  OTHER = 'Outro'
}

export type UserRoleType = 'admin' | 'member' | 'guest';

export interface Member {
  id: string;
  name: string;
  roles: Role[];
  isActive: boolean;
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  bpm?: number;
  key?: string;
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
  leaderIds: string[]; // Mudado de leaderId para leaderIds (array)
  vocalIds?: string[];
}

export type ViewType = 'dashboard' | 'members' | 'songs' | 'schedules' | 'chat';