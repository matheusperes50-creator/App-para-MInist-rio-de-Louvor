export enum Role {
  VOCAL = 'Vocal',
  GUITAR = 'Violão/Guitarra',
  BASS = 'Baixo',
  DRUMS = 'Bateria',
  KEYS = 'Teclado',
  OTHER = 'Outro'
}

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
  songs: string[];
  leaderId: string;
  vocalIds?: string[]; // Novos campos para organização sugerida
}

export type ViewType = 'dashboard' | 'members' | 'songs' | 'schedules';
