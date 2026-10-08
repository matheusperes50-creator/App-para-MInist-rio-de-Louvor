import { Member, Song, Schedule, ExternalEvent, RehearsalNote, Role, SongStatus, LookStyle, AttendanceEvent } from './types';

export const DEFAULT_MEMBERS: Member[] = [
  { 
    id: 'Z9C3CC', 
    name: 'Matheus Peres', 
    roles: [Role.MINISTER, Role.VOCAL, Role.GUITAR, Role.KEYS], 
    isActive: true, 
    birthDate: '1996-05-14',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=faces' 
  },
  { 
    id: 'QL783O', 
    name: 'Lucas Silva', 
    roles: [Role.VOCAL, Role.GUITAR], 
    isActive: true, 
    birthDate: '1998-08-22',
    photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=faces' 
  },
  { 
    id: 'ZUSMHY', 
    name: 'Ana Paula Rocha', 
    roles: [Role.MINISTER, Role.VOCAL], 
    isActive: true, 
    birthDate: '1995-11-30',
    photoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=faces' 
  },
  { 
    id: '7FUW2H', 
    name: 'Gabriel Souza', 
    roles: [Role.KEYS, Role.VOCAL], 
    isActive: true, 
    birthDate: '2000-02-18',
    photoUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&h=150&fit=crop&crop=faces' 
  },
  { 
    id: '24BWIX', 
    name: 'Beatriz Santos', 
    roles: [Role.VOCAL], 
    isActive: true, 
    birthDate: '1997-09-05',
    photoUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=faces' 
  },
  { 
    id: 'GGOR98', 
    name: 'Guilherme Oliveira', 
    roles: [Role.BASS], 
    isActive: true, 
    birthDate: '1994-04-12',
    photoUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=faces' 
  },
  { 
    id: 'PKNF87', 
    name: 'Pedro Henrique (Batera)', 
    roles: [Role.DRUMS], 
    isActive: true, 
    birthDate: '1999-07-25',
    photoUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=faces' 
  },
  { 
    id: 'M9A1RT', 
    name: 'Mariana Costa', 
    roles: [Role.VOCAL], 
    isActive: true, 
    birthDate: '2001-03-10',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=faces' 
  },
  { 
    id: 'F4L2OP', 
    name: 'Felipe Ramos', 
    roles: [Role.GUITAR], 
    isActive: true, 
    birthDate: '1993-10-14' 
  },
  { 
    id: 'T8K3NX', 
    name: 'Thiago Martins', 
    roles: [Role.KEYS, Role.BASS], 
    isActive: true, 
    birthDate: '1996-12-03' 
  }
];

export const DEFAULT_SONGS: Song[] = [
  {
    id: 'SNG-BONDADE',
    title: 'Bondade de Deus',
    artist: 'Isaías Saad',
    key: 'G',
    bpm: 70,
    status: SongStatus.READY,
    youtubeUrl: 'https://www.youtube.com/watch?v=mZ9yZYo9Mmk'
  },
  {
    id: 'SNG-BENCAO',
    title: 'A Bênção',
    artist: 'Gabriel Guedes & Nívea Soares',
    key: 'Bb',
    bpm: 72,
    status: SongStatus.READY,
    youtubeUrl: 'https://www.youtube.com/watch?v=v8gaG2ed01I'
  },
  {
    id: 'SNG-OUSADO',
    title: 'Ousado Amor',
    artist: 'Isaías Saad',
    key: 'Gb',
    bpm: 68,
    status: SongStatus.READY,
    youtubeUrl: 'https://www.youtube.com/watch?v=wSKKEAnLTDw'
  },
  {
    id: 'SNG-LUGAR',
    title: 'Lugar Secreto',
    artist: 'Gabriela Rocha',
    key: 'E',
    bpm: 68,
    status: SongStatus.READY,
    youtubeUrl: 'https://www.youtube.com/watch?v=YnrN0o0lubM'
  },
  {
    id: 'SNG-RUJA',
    title: 'Ruja o Leão',
    artist: 'Talita Catanzaro',
    key: 'C',
    bpm: 128,
    status: SongStatus.READY,
    youtubeUrl: 'https://www.youtube.com/watch?v=jtm9HiYZ7UQ'
  },
  {
    id: 'SNG-CAMINHO',
    title: 'Caminho no Deserto',
    artist: 'Soraya Moraes',
    key: 'A',
    bpm: 68,
    status: SongStatus.READY,
    youtubeUrl: 'https://www.youtube.com/watch?v=xDR4vQtArMo'
  },
  {
    id: 'SNG-TODAVIA',
    title: 'Todavia Me Alegrarei',
    artist: 'Leandro Borges',
    key: 'F',
    bpm: 74,
    status: SongStatus.READY,
    youtubeUrl: 'https://www.youtube.com/watch?v=rNBedSCKwVc'
  },
  {
    id: 'SNG-ELE-VIVE',
    title: 'Porque Ele Vive',
    artist: 'Harpa Cristã / Tradicional',
    key: 'G',
    bpm: 80,
    status: SongStatus.READY,
    youtubeUrl: 'https://www.youtube.com/watch?v=tVx6KHWz0HU'
  },
  {
    id: 'SNG-REI-REIS',
    title: 'Rei dos Reis',
    artist: 'Hillsong Worship / Tradução',
    key: 'D',
    bpm: 68,
    status: SongStatus.REHEARSING,
    youtubeUrl: 'https://www.youtube.com/watch?v=oMneWx9IPts'
  },
  {
    id: 'SNG-DIGNO',
    title: 'Digno de Glória',
    artist: 'Asaph Borba',
    key: 'C',
    bpm: 72,
    status: SongStatus.READY,
    youtubeUrl: 'https://www.youtube.com/watch?v=pQju8cyof8k'
  }
];

export const DEFAULT_SCHEDULES: Schedule[] = [
  {
    id: 'J8VEBE',
    date: '2026-03-08',
    serviceType: 'Domingo',
    members: ['Z9C3CC', 'QL783O', 'ZUSMHY', '7FUW2H', '24BWIX', 'GGOR98', 'PKNF87'],
    leaderIds: ['Z9C3CC'],
    vocalIds: ['QL783O', 'ZUSMHY', '24BWIX'],
    assignments: [
      { role: 'Vocal Líder', memberId: 'Z9C3CC', confirmed: true, present: true },
      { role: 'Vocal', memberId: 'QL783O', confirmed: true, present: true },
      { role: 'Vocal', memberId: 'ZUSMHY', confirmed: true, present: true },
      { role: 'Vocal', memberId: '24BWIX', confirmed: true, present: true },
      { role: 'Teclado', memberId: '7FUW2H', confirmed: true, present: true },
      { role: 'Baixo', memberId: 'GGOR98', confirmed: true, present: true },
      { role: 'Bateria', memberId: 'PKNF87', confirmed: true, present: true },
      { role: 'Violão', memberId: 'QL783O', confirmed: true, present: true }
    ],
    songs: [
      { id: 'SNG-BONDADE', key: 'G', confirmed: true },
      { id: 'SNG-BENCAO', key: 'Bb', confirmed: true },
      { id: 'SNG-OUSADO', key: 'Gb', confirmed: true },
      { id: 'SNG-LUGAR', key: 'E', confirmed: true }
    ],
    postSermonSong: { id: 'SNG-ELE-VIVE', key: 'G', confirmed: true },
    confirmed: true,
    attendanceMarked: true,
    observations: 'Chegar às 08:15 para afinação e oração da equipe.'
  },
  {
    id: 'SCH-20260315',
    date: '2026-03-15',
    serviceType: 'Domingo',
    members: ['QL783O', 'ZUSMHY', '7FUW2H', 'GGOR98', 'PKNF87', 'F4L2OP'],
    leaderIds: ['QL783O'],
    vocalIds: ['ZUSMHY', 'M9A1RT'],
    assignments: [
      { role: 'Vocal Líder', memberId: 'QL783O', confirmed: true, present: false },
      { role: 'Vocal', memberId: 'ZUSMHY', confirmed: true, present: false },
      { role: 'Vocal', memberId: 'M9A1RT', confirmed: false, present: false },
      { role: 'Teclado', memberId: '7FUW2H', confirmed: true, present: false },
      { role: 'Violão/Guitarra', memberId: 'F4L2OP', confirmed: true, present: false },
      { role: 'Baixo', memberId: 'GGOR98', confirmed: true, present: false },
      { role: 'Bateria', memberId: 'PKNF87', confirmed: true, present: false }
    ],
    songs: [
      { id: 'SNG-RUJA', key: 'C', confirmed: true },
      { id: 'SNG-TODAVIA', key: 'F', confirmed: true },
      { id: 'SNG-CAMINHO', key: 'A', confirmed: true },
      { id: 'SNG-DIGNO', key: 'C', confirmed: true }
    ],
    postSermonSong: { id: 'SNG-BENCAO', key: 'Bb', confirmed: true },
    confirmed: false,
    attendanceMarked: false,
    observations: 'Ensaio geral na quinta-feira anterior às 19:30.'
  },
  {
    id: 'SCH-20260322',
    date: '2026-03-22',
    serviceType: 'Domingo',
    members: ['Z9C3CC', '24BWIX', 'M9A1RT', 'T8K3NX', 'PKNF87'],
    leaderIds: ['Z9C3CC'],
    vocalIds: ['24BWIX', 'M9A1RT'],
    assignments: [
      { role: 'Vocal Líder', memberId: 'Z9C3CC', confirmed: true, present: false },
      { role: 'Vocal', memberId: '24BWIX', confirmed: true, present: false },
      { role: 'Vocal', memberId: 'M9A1RT', confirmed: true, present: false },
      { role: 'Teclado', memberId: 'T8K3NX', confirmed: true, present: false },
      { role: 'Violão/Guitarra', memberId: 'Z9C3CC', confirmed: true, present: false },
      { role: 'Bateria', memberId: 'PKNF87', confirmed: true, present: false }
    ],
    songs: [
      { id: 'SNG-BONDADE', key: 'G', confirmed: true },
      { id: 'SNG-LUGAR', key: 'E', confirmed: true },
      { id: 'SNG-OUSADO', key: 'Gb', confirmed: true }
    ],
    confirmed: false,
    attendanceMarked: false,
    observations: 'Culto da Família. Traje: Tons terrosos.'
  }
];

export const DEFAULT_STYLES: LookStyle[] = [
  {
    id: 'STY-DOM-PASTEL',
    title: 'Domingo Manhã - Tons Claros & Pastel',
    colors: ['#F8FAFC', '#E2E8F0', '#CBD5E1', '#94A3B8'],
    description: 'Camisas ou camisetas em tons suaves (branco, off-white, bege, cinza claro). Calça jeans ou sarja escura.',
    date: 'Todos os domingos de manhã'
  },
  {
    id: 'STY-DOM-TERRA',
    title: 'Domingo Noite - Tons Terrosos e Elegantes',
    colors: ['#78350F', '#B45309', '#D97706', '#1E293B'],
    description: 'Marrom, terracota, mostarda suave, caramelo e azul marinho. Visual alinhado e harmônico.',
    date: 'Culto da Noite'
  },
  {
    id: 'STY-JOVENS-BLACK',
    title: 'Culto de Jovens - Black & Jeans',
    colors: ['#0F172A', '#1E293B', '#334155', '#475569'],
    description: 'Preto, chumbo ou jeans escuro. Estilo contemporâneo e sóbrio.',
    date: 'Sábados / Cultos Especiais'
  }
];

export const DEFAULT_NOTES: RehearsalNote[] = [
  {
    id: 'NOTE-ENSAIO-GERAL',
    title: 'Pauta do Ensaio Semanal - Próximo Domingo',
    category: 'rehearsal',
    content: 'Foco na transição entre "Bondade de Deus" e "A Bênção". Ajustar dinâmica da bateria no refrão 2.',
    songIds: ['SNG-BONDADE', 'SNG-BENCAO', 'SNG-OUSADO'],
    items: [
      { id: 'item-1', text: 'Chegar 15 minutos antes para afinação dos instrumentos', done: true },
      { id: 'item-2', text: 'Passar as vozes da música nova (harmonias e divisões)', done: true },
      { id: 'item-3', text: 'Definir dinâmicas de parada e crescendo com a bateria', done: false },
      { id: 'item-4', text: 'Oração final da equipe', done: false }
    ],
    pinned: true,
    createdAt: '2026-03-05'
  },
  {
    id: 'NOTE-REPERTORIO-PASCOA',
    title: 'Seleção para o Culto Especial',
    category: 'songs_list',
    content: 'Músicas selecionadas para o especial de celebração da igreja.',
    songIds: ['SNG-ELE-VIVE', 'SNG-REI-REIS', 'SNG-DIGNO'],
    items: [
      { id: 'item-5', text: 'Imprimir ou compartilhar partituras e cifras para teclado', done: false },
      { id: 'item-6', text: 'Gravar áudio do arranjo das vozes para estudo em casa', done: false }
    ],
    pinned: false,
    createdAt: '2026-03-06'
  }
];

export const DEFAULT_EVENTS: ExternalEvent[] = [
  {
    id: 'EVT-VIGILIA',
    title: 'Vigília de Adoração e Oração',
    date: '2026-03-27',
    time: '22:00',
    location: 'Templo Principal PIBJE',
    description: 'Noite de clamor e adoração contínua com a juventude e famílias.',
    status: 'confirmed',
    repertoire: ['Bondade de Deus', 'Lugar Secreto', 'Todavia Me Alegrarei'],
    memberIds: ['Z9C3CC', 'QL783O', '7FUW2H', 'GGOR98', 'PKNF87']
  }
];

export const DEFAULT_ANNOUNCEMENTS = `### 📢 Avisos do Ministério de Louvor PIBJE

1. **Ensaios Gerais**: Quintas-feiras às 19h45 no templo principal. Por favor, cheguem no horário para passagem de som!
2. **Confirmação de Escalas**: Confirmem sua presença na aba de Escalas com pelo menos 48h de antecedência.
3. **Músicas Novas**: Músicas em ensaio estão disponíveis com links do YouTube na aba Repertório.`;

export const DEFAULT_ATTENDANCE_EVENTS: AttendanceEvent[] = [
  {
    id: 'ATT-DOM-22',
    date: '2026-03-22',
    title: 'Culto de Domingo - Noite',
    time: '19:00',
    description: 'Culto de celebração da noite no templo principal.',
    deadline: '2026-03-20',
    confirmations: [
      { memberId: 'Z9C3CC', status: 'confirmed', confirmedAt: '2026-03-16 10:30' },
      { memberId: '983Q7L', status: 'confirmed', confirmedAt: '2026-03-16 11:15' },
      { memberId: 'QL783O', status: 'confirmed', confirmedAt: '2026-03-16 12:00' },
      { memberId: '7FUW2H', status: 'confirmed', confirmedAt: '2026-03-16 14:20' },
      { memberId: 'GGOR98', status: 'confirmed', confirmedAt: '2026-03-16 15:00' },
      { memberId: 'PKNF87', status: 'confirmed', confirmedAt: '2026-03-16 16:30' },
      { memberId: 'TECL01', status: 'confirmed', confirmedAt: '2026-03-16 17:10' },
      { memberId: 'GUIT01', status: 'confirmed', confirmedAt: '2026-03-16 18:00' },
      { memberId: 'BASS01', status: 'confirmed', confirmedAt: '2026-03-16 19:00' },
      { memberId: 'DRUM01', status: 'confirmed', confirmedAt: '2026-03-16 19:40' }
    ]
  },
  {
    id: 'ATT-DOM-29',
    date: '2026-03-29',
    title: 'Culto de Domingo - Manhã',
    time: '09:00',
    description: 'Culto da manhã com Ceia do Senhor.',
    deadline: '2026-03-27',
    confirmations: [
      { memberId: '983Q7L', status: 'confirmed', confirmedAt: '2026-03-17 09:10' },
      { memberId: 'QL783O', status: 'confirmed', confirmedAt: '2026-03-17 10:00' },
      { memberId: '7FUW2H', status: 'confirmed', confirmedAt: '2026-03-17 10:45' },
      { memberId: 'PKNF87', status: 'confirmed', confirmedAt: '2026-03-17 11:20' },
      { memberId: 'TECL01', status: 'confirmed', confirmedAt: '2026-03-17 14:00' },
      { memberId: 'GUIT01', status: 'confirmed', confirmedAt: '2026-03-17 15:30' },
      { memberId: 'DRUM01', status: 'confirmed', confirmedAt: '2026-03-17 16:00' },
      { memberId: 'Z9C3CC', status: 'declined', note: 'Viagem de trabalho' }
    ]
  },
  {
    id: 'ATT-PASCOA-05',
    date: '2026-04-05',
    title: 'Culto Especial de Páscoa - Noite',
    time: '19:00',
    description: 'Cantata e celebração da ressurreição.',
    deadline: '2026-04-02',
    confirmations: [
      { memberId: 'Z9C3CC', status: 'confirmed' },
      { memberId: '983Q7L', status: 'confirmed' },
      { memberId: 'QL783O', status: 'confirmed' },
      { memberId: '7FUW2H', status: 'confirmed' },
      { memberId: 'GGOR98', status: 'confirmed' },
      { memberId: 'PKNF87', status: 'confirmed' },
      { memberId: 'TECL01', status: 'confirmed' },
      { memberId: 'GUIT01', status: 'confirmed' },
      { memberId: 'BASS01', status: 'confirmed' },
      { memberId: 'DRUM01', status: 'confirmed' }
    ]
  }
];
