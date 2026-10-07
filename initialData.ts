import { Member, Song, Schedule, ExternalEvent, RehearsalNote, Role, SongStatus } from './types';

export const DEFAULT_MEMBERS: Member[] = [
  { id: 'Z9C3CC', name: 'Matheus Peres', roles: [Role.VOCAL, Role.GUITAR, Role.KEYS], isActive: true },
  { id: '7FUW2H', name: 'Amanda Silva', roles: [Role.VOCAL], isActive: true },
  { id: 'GGOR98', name: 'Gabriel Gomes', roles: [Role.VOCAL, Role.GUITAR, Role.BASS], isActive: true },
  { id: 'X17RHN', name: 'Lucas Oliveira', roles: [Role.VOCAL], isActive: true },
  { id: 'DKSUWB', name: 'Daniel Souza', roles: [Role.VOCAL], isActive: true },
  { id: 'QL783O', name: 'Raquel Lima', roles: [Role.VOCAL], isActive: true },
  { id: 'ZUSMHY', name: 'Juliana Santos', roles: [Role.VOCAL], isActive: true },
  { id: '6RXLI2', name: 'Rebecca Costa', roles: [Role.VOCAL], isActive: true },
  { id: '7PC6VT', name: 'Priscila Carvalho', roles: [Role.VOCAL], isActive: true },
  { id: '8ZRVW2', name: 'Beatriz Ramos', roles: [Role.VOCAL], isActive: true },
  { id: '24BWIX', name: 'Bruno Wagner', roles: [Role.KEYS], isActive: true },
  { id: '6310A5', name: 'Gustavo Alves', roles: [Role.BASS], isActive: true },
  { id: 'PKNF87', name: 'Pedro Henrique', roles: [Role.DRUMS], isActive: true },
  { id: 'MPSD03', name: 'Marcos Paulo', roles: [Role.DRUMS], isActive: true },
  { id: 'JLIN30', name: 'João Lucas', roles: [Role.DRUMS], isActive: true },
  { id: 'VDANAH', name: 'Vinícius Dias', roles: [Role.GUITAR], isActive: true }
];

export const DEFAULT_SONGS: Song[] = [
  { id: '9U33GC', title: 'Ousado Amor', artist: 'Isaías Saad', key: 'B', status: SongStatus.READY },
  { id: 'IEY0Z6', title: 'Bondade de Deus', artist: 'Isaías Saad', key: 'E', status: SongStatus.READY },
  { id: 'B14ALL', title: 'A Bênção', artist: 'Gabriel Guedes', key: 'C', status: SongStatus.READY },
  { id: 'DEA5Q0', title: 'Porque Ele Vive', artist: 'Harpa Cristã', key: 'E', status: SongStatus.READY },
  { id: 'K4H8QM', title: 'Vitorioso És', artist: 'Gabriel Guedes', key: 'A', status: SongStatus.READY },
  { id: 'X3HING', title: 'Lugar Secreto', artist: 'Gabriela Rocha', key: 'A', status: SongStatus.READY },
  { id: 'HMP9TK', title: 'Ruja o Leão', artist: 'Talita Catanzaro', key: 'G', status: SongStatus.READY },
  { id: 'L4J3CL', title: 'Vem Me Buscar', artist: 'Jefferson & Suellen', key: 'D', status: SongStatus.READY },
  { id: 'RJSGB6', title: 'A Casa É Sua', artist: 'Casa Worship', key: 'G', status: SongStatus.READY },
  { id: 'KZ8W4L', title: 'Alívio', artist: 'Jessé Aguiar', key: 'C', status: SongStatus.READY },
  { id: 'SEL47J', title: 'Grandes Coisas', artist: 'Fernandinho', key: 'B', status: SongStatus.READY },
  { id: 'SHWW6N', title: 'Que Se Abram Os Céus', artist: 'Nívea Soares', key: 'A', status: SongStatus.READY },
  { id: 'F4KACW', title: 'Rei do Meu Coração', artist: 'Be One', key: 'B', status: SongStatus.READY },
  { id: 'SGE3P0', title: 'É Tudo Sobre Você', artist: 'Morada', key: 'B', status: SongStatus.READY },
  { id: 'UOIKNZ', title: 'Todavia Me Alegrarei', artist: 'Leandro Borges', key: 'D', status: SongStatus.READY },
  { id: 'KAXQJY', title: 'Santo Espírito', artist: 'Laura Souguellis', key: 'A', status: SongStatus.READY },
  { id: '8QHR60', title: 'Tu És Bom', artist: 'Fred Arrais', key: 'A', status: SongStatus.READY },
  { id: 'SQRZT6', title: 'Atos 2', artist: 'Gabriela Rocha', key: 'D', status: SongStatus.READY },
  { id: '0D5QP0', title: 'Caminho no Deserto', artist: 'Soraya Moraes', key: 'C', status: SongStatus.READY },
  { id: 'FQJ5SE', title: 'Yahweh Se Manifestará', artist: 'Oasis Ministry', key: 'D', status: SongStatus.READY },
  { id: 'BCXRHQ', title: 'Jesus em Tua Presença', artist: 'Quatro Por Um', key: 'D', status: SongStatus.READY },
  { id: 'IK6N78', title: 'Quão Grande É o Meu Deus', artist: 'Soraya Moraes', key: 'G', status: SongStatus.READY },
  { id: 'KH9MOS', title: 'Eu Te Vejo Em Tudo', artist: 'Casa Worship', key: 'G', status: SongStatus.READY },
  { id: 'K8YBOJ', title: 'Me Atraiu', artist: 'Gabriela Rocha', key: 'C', status: SongStatus.READY },
  { id: 'J8R71U', title: 'Milagres', artist: 'Juliano Son', key: 'E', status: SongStatus.READY },
  { id: '3YNRCF', title: 'Graça Que Me Salva', artist: 'Ministério Amor e Graça', key: 'G', status: SongStatus.REHEARSING },
  { id: 'KM7JU9', title: 'Nosso Deus É Poderoso', artist: 'Comunidade da Graça', key: 'D', status: SongStatus.REHEARSING },
  { id: 'ILL3BB', title: 'Em Teus Braços', artist: 'Laura Souguellis', key: 'C', status: SongStatus.REHEARSING },
  { id: 'RFVZHL', title: 'Aclame ao Senhor', artist: 'Diante do Trono', key: 'A', status: SongStatus.REHEARSING }
];

export const DEFAULT_SCHEDULES: Schedule[] = [
  {
    id: 'J8VEBE',
    date: '2026-03-08',
    serviceType: 'Domingo',
    members: ['Z9C3CC', 'QL783O', 'ZUSMHY', '7FUW2H', '24BWIX', 'GGOR98', 'PKNF87'],
    assignments: [
      { role: 'Vocal Líder', memberId: 'Z9C3CC', confirmed: false, present: true },
      { role: 'Vocal', memberId: 'QL783O', confirmed: false, present: true },
      { role: 'Vocal', memberId: 'ZUSMHY', confirmed: false, present: true },
      { role: 'Vocal', memberId: '7FUW2H', confirmed: false, present: true },
      { role: 'Teclado', memberId: '24BWIX', confirmed: false, present: true },
      { role: 'Violão', memberId: 'Z9C3CC', confirmed: false, present: true },
      { role: 'Baixo', memberId: 'GGOR98', confirmed: false, present: false },
      { role: 'Bateria', memberId: 'PKNF87', confirmed: false, present: true }
    ],
    songs: [
      { id: '9U33GC', key: 'B', confirmed: true },
      { id: 'IEY0Z6', key: 'E', confirmed: true },
      { id: 'B14ALL', key: 'C', confirmed: true },
      { id: 'DEA5Q0', key: 'E', confirmed: false },
      { id: 'K4H8QM', key: 'A', confirmed: true }
    ],
    leaderIds: ['Z9C3CC'],
    vocalIds: ['QL783O', 'ZUSMHY', '7FUW2H'],
    confirmed: false,
    attendanceMarked: true
  },
  {
    id: '67LBUZ',
    date: '2026-03-01',
    serviceType: 'Domingo',
    members: ['7FUW2H', 'X17RHN', '6RXLI2', 'DKSUWB', '24BWIX', 'Z9C3CC', 'GGOR98', 'MPSD03'],
    assignments: [
      { role: 'Vocal Líder', memberId: '7FUW2H', confirmed: true },
      { role: 'Vocal', memberId: 'X17RHN', confirmed: true },
      { role: 'Vocal', memberId: '6RXLI2', confirmed: true },
      { role: 'Vocal', memberId: 'DKSUWB', confirmed: true },
      { role: 'Teclado', memberId: '24BWIX', confirmed: true },
      { role: 'Violão', memberId: 'Z9C3CC', confirmed: true },
      { role: 'Baixo', memberId: 'GGOR98', confirmed: false },
      { role: 'Bateria', memberId: 'MPSD03', confirmed: true }
    ],
    songs: [
      { id: 'X3HING', key: 'A', confirmed: true },
      { id: 'HMP9TK', key: 'G', confirmed: true },
      { id: 'K4H8QM', key: 'A', confirmed: true },
      { id: 'L4J3CL', key: 'D', confirmed: true }
    ],
    leaderIds: ['7FUW2H'],
    vocalIds: ['X17RHN', '6RXLI2', 'DKSUWB'],
    confirmed: true
  },
  {
    id: 'DSPQPV',
    date: '2026-02-22',
    serviceType: 'Domingo',
    members: ['GGOR98', 'X17RHN', 'QL783O', '8ZRVW2', '24BWIX', '6310A5', 'PKNF87'],
    assignments: [
      { role: 'Vocal Líder', memberId: 'GGOR98', present: true },
      { role: 'Vocal', memberId: 'X17RHN', present: true },
      { role: 'Vocal', memberId: 'QL783O', present: true },
      { role: 'Vocal', memberId: '8ZRVW2', present: true },
      { role: 'Teclado', memberId: '24BWIX', present: true },
      { role: 'Violão', memberId: 'GGOR98', present: true },
      { role: 'Baixo', memberId: '6310A5', present: true },
      { role: 'Bateria', memberId: 'PKNF87', present: true }
    ],
    songs: [
      { id: 'RJSGB6', key: 'G', confirmed: true },
      { id: 'KZ8W4L', key: 'C', confirmed: true },
      { id: 'SEL47J', key: 'B', confirmed: true }
    ],
    leaderIds: ['GGOR98'],
    vocalIds: ['X17RHN', 'QL783O', '8ZRVW2'],
    attendanceMarked: true
  },
  {
    id: 'V88TTI',
    date: '2026-02-15',
    serviceType: 'Domingo (Noite)',
    members: ['DKSUWB', 'GGOR98', '6RXLI2', '7PC6VT', '8ZRVW2', '24BWIX', 'JLIN30'],
    assignments: [
      { role: 'Vocal Líder', memberId: 'DKSUWB', present: true },
      { role: 'Vocal Líder', memberId: 'GGOR98', present: true },
      { role: 'Vocal', memberId: '6RXLI2' },
      { role: 'Vocal', memberId: '7PC6VT', present: false },
      { role: 'Vocal', memberId: '8ZRVW2', present: false },
      { role: 'Teclado', memberId: '24BWIX', present: true },
      { role: 'Violão', memberId: 'GGOR98', present: true },
      { role: 'Bateria', memberId: 'JLIN30' }
    ],
    songs: [],
    leaderIds: ['DKSUWB', 'GGOR98'],
    vocalIds: ['6RXLI2', '7PC6VT', '8ZRVW2'],
    attendanceMarked: true
  },
  {
    id: 'H0K3IY',
    date: '2026-02-08',
    serviceType: 'Domingo (Noite)',
    members: ['X17RHN', 'DKSUWB', 'QL783O', 'ZUSMHY', '24BWIX', 'Z9C3CC', '6310A5', 'MPSD03'],
    assignments: [
      { role: 'Vocal Líder', memberId: 'X17RHN', present: true },
      { role: 'Vocal', memberId: 'DKSUWB', present: true },
      { role: 'Vocal', memberId: 'QL783O', present: true },
      { role: 'Vocal', memberId: 'ZUSMHY', present: true },
      { role: 'Teclado', memberId: '24BWIX', present: true },
      { role: 'Violão', memberId: 'Z9C3CC', present: true },
      { role: 'Baixo', memberId: '6310A5', present: true },
      { role: 'Bateria', memberId: 'MPSD03', present: true }
    ],
    songs: [
      { id: 'SHWW6N', key: 'A', confirmed: true },
      { id: 'F4KACW', key: 'B', confirmed: true },
      { id: 'SGE3P0', key: 'B', confirmed: true },
      { id: 'UOIKNZ', key: 'D', confirmed: true }
    ],
    leaderIds: ['X17RHN'],
    vocalIds: ['DKSUWB', 'QL783O', 'ZUSMHY'],
    attendanceMarked: true
  },
  {
    id: 'EERDP3',
    date: '2026-02-01',
    serviceType: 'Domingo (Noite)',
    members: ['Z9C3CC', '7FUW2H', '7PC6VT', '8ZRVW2', 'GGOR98', 'PKNF87'],
    assignments: [
      { role: 'Vocal Líder', memberId: 'Z9C3CC', present: true },
      { role: 'Vocal Líder', memberId: '7FUW2H', present: true },
      { role: 'Vocal', memberId: '7PC6VT', present: true },
      { role: 'Vocal', memberId: '8ZRVW2', present: true },
      { role: 'Teclado', memberId: 'Z9C3CC', present: true },
      { role: 'Baixo', memberId: 'GGOR98', present: true },
      { role: 'Bateria', memberId: 'PKNF87', present: true }
    ],
    songs: [
      { id: 'UOIKNZ', key: 'E', confirmed: true },
      { id: 'KAXQJY', key: 'A', confirmed: true },
      { id: '8QHR60', key: 'A', confirmed: true },
      { id: 'SQRZT6', key: 'D', confirmed: true }
    ],
    leaderIds: ['Z9C3CC', '7FUW2H'],
    vocalIds: ['7PC6VT', '8ZRVW2'],
    attendanceMarked: true
  },
  {
    id: '358QP4',
    date: '2026-01-25',
    serviceType: 'Domingo (Noite)',
    members: ['GGOR98', 'QL783O', '6RXLI2', 'X17RHN', '6310A5', 'PKNF87'],
    assignments: [
      { role: 'Vocal Líder', memberId: 'GGOR98', present: true },
      { role: 'Vocal', memberId: 'QL783O', present: true },
      { role: 'Vocal', memberId: '6RXLI2', present: true },
      { role: 'Vocal', memberId: 'X17RHN', present: true },
      { role: 'Violão', memberId: 'GGOR98', present: true },
      { role: 'Baixo', memberId: '6310A5', present: true },
      { role: 'Bateria', memberId: 'PKNF87', present: true }
    ],
    songs: [
      { id: '0D5QP0', key: 'C', confirmed: true },
      { id: '9U33GC', key: 'B', confirmed: true }
    ],
    leaderIds: ['GGOR98'],
    vocalIds: ['QL783O', '6RXLI2', 'X17RHN'],
    attendanceMarked: true
  },
  {
    id: 'IOML32',
    date: '2026-01-18',
    serviceType: 'Domingo (Noite)',
    members: ['7FUW2H', 'DKSUWB', '6RXLI2', 'QL783O', '24BWIX', 'Z9C3CC', '6310A5', 'MPSD03'],
    assignments: [
      { role: 'Vocal Líder', memberId: '7FUW2H', present: true },
      { role: 'Vocal', memberId: 'DKSUWB', present: true },
      { role: 'Vocal', memberId: '6RXLI2', present: true },
      { role: 'Vocal', memberId: 'QL783O', present: true },
      { role: 'Teclado', memberId: '24BWIX', present: true },
      { role: 'Violão', memberId: 'Z9C3CC', present: true },
      { role: 'Baixo', memberId: '6310A5', present: true },
      { role: 'Bateria', memberId: 'MPSD03', present: true }
    ],
    songs: [
      { id: 'FQJ5SE', key: 'D', confirmed: true },
      { id: 'KAXQJY', key: 'A', confirmed: true },
      { id: 'IEY0Z6', key: 'E', confirmed: true },
      { id: 'BCXRHQ', key: 'D', confirmed: true }
    ],
    leaderIds: ['7FUW2H'],
    vocalIds: ['DKSUWB', '6RXLI2', 'QL783O'],
    confirmed: false,
    attendanceMarked: true
  },
  {
    id: '30RGTJ',
    date: '2026-01-11',
    serviceType: 'Domingo (Noite)',
    members: ['Z9C3CC', 'QL783O', 'X17RHN', '7PC6VT', '24BWIX', 'GGOR98'],
    assignments: [
      { role: 'Vocal Líder', memberId: 'Z9C3CC', present: true },
      { role: 'Vocal', memberId: 'QL783O', confirmed: false, present: true },
      { role: 'Vocal', memberId: 'X17RHN', confirmed: false, present: true },
      { role: 'Vocal', memberId: '7PC6VT', confirmed: false, present: true },
      { role: 'Teclado', memberId: '24BWIX', present: true },
      { role: 'Violão', memberId: 'Z9C3CC', present: true },
      { role: 'Baixo', memberId: 'GGOR98', present: true }
    ],
    songs: [
      { id: 'IK6N78', key: 'G', confirmed: true },
      { id: 'KH9MOS', key: 'G', confirmed: true },
      { id: 'K8YBOJ', key: 'C', confirmed: true }
    ],
    leaderIds: ['Z9C3CC'],
    vocalIds: ['QL783O', 'X17RHN', '7PC6VT'],
    confirmed: false,
    attendanceMarked: true
  }
];

export const DEFAULT_EVENTS: ExternalEvent[] = [
  {
    id: 'H2EMJ3',
    title: 'Pib Nova Marilia',
    date: '2026-10-03',
    time: '19:30',
    location: 'Nova Marília ',
    description: '',
    status: 'confirmed',
    repertoire: ['UOIKNZ', 'IEY0Z6', 'J8R71U'],
    memberIds: ['24BWIX', 'PKNF87', '7FUW2H', 'DKSUWB', 'X17RHN', '8ZRVW2', 'VDANAH']
  },
  {
    id: 'M9C3SA',
    title: 'Vigília Mês Adolescentes',
    date: '2026-08-07',
    time: '22:00',
    location: 'PIBJE',
    description: '',
    status: 'confirmed',
    repertoire: ['KH9MOS', 'K8YBOJ', 'SHWW6N', 'SEL47J', '2TQZZ5', 'EHGMV3', '66CVIF', 'CJHTY6'],
    memberIds: []
  },
  {
    id: 'Q5ED11',
    title: 'Assembleia da associação Batista Fluminense ',
    date: '2026-04-09',
    time: '19:30',
    location: 'PIB Surui ',
    description: '',
    status: 'confirmed',
    repertoire: [],
    memberIds: []
  }
];

export const DEFAULT_NOTES: RehearsalNote[] = [
  {
    id: 'note-1784840106568',
    title: 'Músicas para ensaiarmos',
    category: 'rehearsal',
    content: '',
    songIds: ['3YNRCF', 'KM7JU9', 'ILL3BB', 'RFVZHL'],
    items: [],
    pinned: true,
    createdAt: '2026-07-23'
  }
];
