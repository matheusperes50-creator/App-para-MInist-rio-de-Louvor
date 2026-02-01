
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
  roles: Role[]; // Alterado para array
  isActive: boolean;
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  bpm?: number;
  key?: string;
}

export interface Schedule {
  id: string;
  date: string;
  serviceType: string;
  members: string[]; // Member IDs
  songs: string[];   // Song IDs
}

export type ViewType = 'dashboard' | 'members' | 'songs' | 'schedules';
