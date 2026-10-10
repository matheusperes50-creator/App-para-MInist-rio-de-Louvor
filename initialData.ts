import { Member, Song, Schedule, ExternalEvent, RehearsalNote, Role, SongStatus, LookStyle, AttendanceEvent } from "./types";

export const DEFAULT_MEMBERS: Member[] = [
  {
    "id": "Z9C3CC",
    "name": "Matheus",
    "roles": [
      "Vocal",
      "Violão/Guitarra",
      "Teclado"
    ],
    "isActive": true,
    "birthDate": "1992-01-02",
    "photoUrl": "data:image/jpeg;base64,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"
  },
  {
    "id": "24BWIX",
    "name": "Abner",
    "roles": [
      "Teclado",
      "Violão/Guitarra"
    ],
    "isActive": true
  },
  {
    "id": "GGOR98",
    "name": "Elias",
    "roles": [
      "Vocal",
      "Violão/Guitarra",
      "Baixo"
    ],
    "isActive": true
  },
  {
    "id": "MPSD03",
    "name": "André",
    "roles": [
      "Bateria"
    ],
    "isActive": true
  },
  {
    "id": "PKNF87",
    "name": "Fabio Negao",
    "roles": [
      "Bateria"
    ],
    "isActive": true
  },
  {
    "id": "6310A5",
    "name": "Toni",
    "roles": [
      "Violão/Guitarra",
      "Baixo"
    ],
    "isActive": true
  },
  {
    "id": "ZUSMHY",
    "name": "Daiana",
    "roles": [
      "Vocal"
    ],
    "isActive": true
  },
  {
    "id": "7FUW2H",
    "name": "Patricia",
    "roles": [
      "Vocal"
    ],
    "isActive": true
  },
  {
    "id": "QL783O",
    "name": "Stefany",
    "roles": [
      "Vocal"
    ],
    "isActive": true
  },
  {
    "id": "DKSUWB",
    "name": "Cléo",
    "roles": [
      "Vocal"
    ],
    "isActive": true
  },
  {
    "id": "7PC6VT",
    "name": "Eliane",
    "roles": [
      "Vocal"
    ],
    "isActive": true
  },
  {
    "id": "X17RHN",
    "name": "Gabriel",
    "roles": [
      "Vocal"
    ],
    "isActive": true
  },
  {
    "id": "6RXLI2",
    "name": "Joana",
    "roles": [
      "Vocal"
    ],
    "isActive": true
  },
  {
    "id": "8ZRVW2",
    "name": "Pablo",
    "roles": [
      "Vocal"
    ],
    "isActive": true
  },
  {
    "id": "JLIN30",
    "name": "Rafaela",
    "roles": [
      "Bateria"
    ],
    "isActive": true
  },
  {
    "id": "VDANAH",
    "name": "Suiane",
    "roles": [
      "Vocal"
    ],
    "isActive": true
  },
  {
    "id": "CP6IPB",
    "name": "Fabinho (Convidado)",
    "roles": [
      "Violão/Guitarra"
    ],
    "isActive": true
  },
  {
    "id": "AKLL6T",
    "name": "Edgar (Convidado)",
    "roles": [
      "Baixo"
    ],
    "isActive": true
  },
  {
    "id": "0Y1ZXP",
    "name": "Thiago Sudré (Convidado)",
    "roles": [
      "Baixo"
    ],
    "isActive": true
  }
] as unknown as Member[];

export const DEFAULT_SONGS: Song[] = [
  {
    "id": "RFVZHL",
    "title": "Há Poder",
    "artist": "fhop music",
    "key": "",
    "status": "Pendente",
    "youtubeUrl": "https://www.youtube.com/watch?v=4WmlJFsxDv4&list=RD4WmlJFsxDv4&start_radio=1"
  },
  {
    "id": "KM7JU9",
    "title": "Canção de Simeão",
    "artist": "DROPS",
    "key": "",
    "status": "Pendente",
    "youtubeUrl": "https://www.youtube.com/watch?v=rVJxohBP59c&list=RDrVJxohBP59c&start_radio=1"
  },
  {
    "id": "ILL3BB",
    "title": "Te Esperamos | Salvaon",
    "artist": "Manual",
    "key": "",
    "status": "Pendente",
    "youtubeUrl": "https://www.youtube.com/watch?v=nN34u0XraZ8&list=RDnN34u0XraZ8&start_radio=1"
  },
  {
    "id": "O2GL7A",
    "title": "Pedro",
    "artist": "Salvaon",
    "key": "",
    "status": "Pendente",
    "youtubeUrl": "https://www.youtube.com/watch?v=rLXSgAOXexY&list=RDrVJxohBP59c&index=2"
  },
  {
    "id": "3YNRCF",
    "title": "A fé - Na Graça",
    "artist": "Na Graça",
    "key": "E",
    "status": "Pronta",
    "youtubeUrl": "https://www.youtube.com/watch?v=g89eBxkG-Aw&list=RDg89eBxkG-Aw&start_radio=1"
  },
  {
    "id": "0D5QP0",
    "title": "Gratidão",
    "artist": "Manual",
    "key": "A OU D",
    "status": "Pronta"
  },
  {
    "id": "9U33GC",
    "title": "Tudo é perda",
    "artist": "Manual",
    "key": "",
    "status": "Pronta"
  },
  {
    "id": "UOIKNZ",
    "title": "Quem é esse",
    "artist": "Manual",
    "key": "C",
    "status": "Pronta"
  },
  {
    "id": "FQJ5SE",
    "title": "Senhor e Rei",
    "artist": "Manual",
    "key": "E",
    "status": "Pronta"
  },
  {
    "id": "KAXQJY",
    "title": "Grato sou",
    "artist": "Manual",
    "key": "A",
    "status": "Pronta"
  },
  {
    "id": "IEY0Z6",
    "title": "Novo dia",
    "artist": "Manual",
    "key": "G",
    "status": "Pronta"
  },
  {
    "id": "BCXRHQ",
    "title": "Primeira essencia",
    "artist": "Manual",
    "key": "",
    "status": "Pronta"
  },
  {
    "id": "IK6N78",
    "title": "Renova-me + Distante de ti senhor",
    "artist": "Manual",
    "key": "A",
    "status": "Pronta"
  },
  {
    "id": "KH9MOS",
    "title": "Vida ao Sepulcros",
    "artist": "Manual",
    "key": "E",
    "status": "Pronta"
  },
  {
    "id": "K8YBOJ",
    "title": "Gratidao",
    "artist": "Manual",
    "key": "A",
    "status": "Pronta"
  },
  {
    "id": "8QHR60",
    "title": "O cheiro das Aguas",
    "artist": "Manual",
    "key": "A",
    "status": "Pronta"
  },
  {
    "id": "SQRZT6",
    "title": "Maranata",
    "artist": "Manual",
    "key": "D",
    "status": "Pronta"
  },
  {
    "id": "7PTLQD",
    "title": "Meu mestre",
    "artist": "Manual",
    "key": "",
    "status": "Pronta"
  },
  {
    "id": "SHWW6N",
    "title": "Meu alvo é Cristo",
    "artist": "Manual",
    "key": "",
    "status": "Pronta"
  },
  {
    "id": "F4KACW",
    "title": "Gratidão + novo dia",
    "artist": "Manual",
    "key": "",
    "status": "Pronta"
  },
  {
    "id": "SGE3P0",
    "title": "Teu santo nome (todo ser que vive)",
    "artist": "Manual",
    "key": "",
    "status": "Pronta"
  },
  {
    "id": "RJSGB6",
    "title": "Tu és",
    "artist": "Manual",
    "key": "D",
    "status": "Pronta"
  },
  {
    "id": "KZ8W4L",
    "title": "Adorador por excelência",
    "artist": "Manual",
    "key": "G",
    "status": "Pronta"
  },
  {
    "id": "SEL47J",
    "title": "Jesus em tua presença",
    "artist": "Manual",
    "key": "E",
    "status": "Pronta"
  },
  {
    "id": "1AG3LR",
    "title": "Segura na mão de Deus",
    "artist": "Manual",
    "key": "C",
    "status": "Pronta"
  },
  {
    "id": "X3HING",
    "title": "Vitorioso és",
    "artist": "Manual",
    "key": "G",
    "status": "Pronta"
  },
  {
    "id": "HMP9TK",
    "title": "Jeová Jireh",
    "artist": "Manual",
    "key": "G",
    "status": "Pronta"
  },
  {
    "id": "K4H8QM",
    "title": "Tema missões",
    "artist": "Manual",
    "key": "A",
    "status": "Pronta"
  },
  {
    "id": "L4J3CL",
    "title": "Prosto-me diante da cruz",
    "artist": "Manual",
    "key": "D",
    "status": "Pronta"
  },
  {
    "id": "B14ALL",
    "title": "A ele (tu és Deus)",
    "artist": "Manual",
    "key": "C",
    "status": "Pronta"
  },
  {
    "id": "DEA5Q0",
    "title": "Senhor tu és bom",
    "artist": "Manual",
    "key": "E",
    "status": "Pronta"
  },
  {
    "id": "2TQZZ5",
    "title": "Teu Amor não Falha",
    "artist": "Manual",
    "key": "G",
    "status": "Pronta"
  },
  {
    "id": "D2PY5Q",
    "title": "Sobre as Águas",
    "artist": "Manual",
    "key": "",
    "status": "Pronta"
  },
  {
    "id": "K96TBB",
    "title": "Boa parte",
    "artist": "Manual",
    "key": "A",
    "status": "Pronta"
  },
  {
    "id": "FJ5RN7",
    "title": "Santo pra sempre",
    "artist": "Manual",
    "key": "C",
    "status": "Pronta"
  },
  {
    "id": "3UP7RU",
    "title": "Maravilhosa Graça",
    "artist": "Manual",
    "key": "A",
    "status": "Pronta"
  },
  {
    "id": "EHGMV3",
    "title": "Toda terra",
    "artist": "Manual",
    "key": "C",
    "status": "Pronta"
  },
  {
    "id": "X70FKQ",
    "title": "Santo pra sempre + Toda terra",
    "artist": "Manual",
    "key": "C",
    "status": "Pronta"
  },
  {
    "id": "66CVIF",
    "title": "Estamos de pé",
    "artist": "Manual",
    "key": "A",
    "status": "Pronta"
  },
  {
    "id": "DC2BUG",
    "title": "Pela Cruz (quebrantado)",
    "artist": "Manual",
    "key": "C",
    "status": "Pronta"
  },
  {
    "id": "CJHTY6",
    "title": "Galileu",
    "artist": "Manual",
    "key": "C",
    "status": "Pronta"
  },
  {
    "id": "EP03CF",
    "title": "Deixou os céus",
    "artist": "Manual",
    "key": "A",
    "status": "Pronta"
  },
  {
    "id": "2AGFHL",
    "title": "A morte venceste",
    "artist": "Manual",
    "key": "A",
    "status": "Pronta"
  },
  {
    "id": "RNKUFM",
    "title": "A terra estremeceu",
    "artist": "Manual",
    "key": "A",
    "status": "Pronta"
  },
  {
    "id": "DEA0E3",
    "title": "Foi na cruz",
    "artist": "Manual",
    "key": "A",
    "status": "Pronta"
  },
  {
    "id": "0EIXEW",
    "title": "Eu sou livre",
    "artist": "Manual",
    "key": "A",
    "status": "Pronta"
  },
  {
    "id": "JE0OWN",
    "title": "Quebrantado (eu olho para cruz)",
    "artist": "Manual",
    "key": "C",
    "status": "Pronta"
  },
  {
    "id": "0QJL8Y",
    "title": "Ao único",
    "artist": "Manual",
    "key": "A",
    "status": "Pronta"
  },
  {
    "id": "INGYZC",
    "title": "Que Ruja o leão",
    "artist": "Manual",
    "key": "E",
    "status": "Pronta"
  },
  {
    "id": "J8R71U",
    "title": "Amo o senhor",
    "artist": "Manual",
    "key": "D",
    "bpm": 0,
    "status": "Pronta",
    "youtubeUrl": "https://youtu.be/w0BiE3DCPGw?si=1eecPmCe0EdMvy5i"
  },
  {
    "id": "1FJXFH",
    "title": "O pardal encontrou casa (teus altares)",
    "artist": "Manual",
    "key": "A",
    "status": "Pronta"
  },
  {
    "id": "DFDQW9",
    "title": "Clamo jesus",
    "artist": "Manual",
    "key": "E",
    "status": "Pronta"
  },
  {
    "id": "9CV084",
    "title": "Não mais escravos",
    "artist": "Manual",
    "key": "C",
    "status": "Pronta"
  },
  {
    "id": "GGADVO",
    "title": "Sublime",
    "artist": "Manual",
    "key": "A",
    "status": "Pronta"
  },
  {
    "id": "R303YU",
    "title": "Eu e minha casa (tema família 2026)",
    "artist": "Manual",
    "key": "",
    "status": "Pronta"
  },
  {
    "id": "F6V56E",
    "title": "Digno é o senhor",
    "artist": "Manual",
    "key": "G",
    "status": "Pronta"
  },
  {
    "id": "X60X1R",
    "title": "Vou te alegrar",
    "artist": "Manual",
    "key": "",
    "status": "Pronta"
  },
  {
    "id": "00FGE4",
    "title": "Declare pelas ruas medley",
    "artist": "Manual",
    "key": "A",
    "status": "Pronta"
  },
  {
    "id": "P3J3GB",
    "title": "A benção",
    "artist": "Manual",
    "key": "A",
    "status": "Pronta"
  },
  {
    "id": "GMQ8N8",
    "title": "Declare pelas as ruas",
    "artist": "Manual",
    "key": "A",
    "status": "Pronta"
  },
  {
    "id": "EEJIFP",
    "title": "Tu és santo",
    "artist": "Manual",
    "key": "G",
    "status": "Pronta"
  },
  {
    "id": "F2W5NX",
    "title": "Oferta agradável a ti",
    "artist": "Manual",
    "key": "",
    "status": "Pronta"
  },
  {
    "id": "TSUNIJ",
    "title": "Escudo",
    "artist": "Manual",
    "key": "",
    "status": "Pronta"
  },
  {
    "id": "X6EDMY",
    "title": "Deus está aqui (Gabriela Rocha)",
    "artist": "Manual",
    "key": "",
    "status": "Pronta"
  },
  {
    "id": "JBSOK8",
    "title": "Poderoso Deus (Gabriela Rocha)",
    "artist": "Manual",
    "key": "",
    "status": "Pronta"
  },
  {
    "id": "TS9AL2",
    "title": "Em teus braços",
    "artist": "Manual",
    "key": "",
    "status": "Pronta"
  },
  {
    "id": "419NZ6",
    "title": "Atos 2",
    "artist": "Manual",
    "key": "",
    "status": "Pendente"
  },
  {
    "id": "ABKFFR",
    "title": "Ah Jesus",
    "artist": "Manual",
    "key": "",
    "status": "Pendente"
  },
  {
    "id": "Y8UUI1",
    "title": "Nunca pare de Lutar",
    "artist": "Manual",
    "key": "",
    "status": "Pendente"
  },
  {
    "id": "JSN0YX",
    "title": "Brasil - Diante do Trono",
    "artist": "Manual",
    "key": "",
    "status": "Pendente"
  },
  {
    "id": "S4OASX",
    "title": "Só tu és Santo",
    "artist": "Manual",
    "key": "A",
    "status": "Pendente"
  }
] as unknown as Song[];

export const DEFAULT_SCHEDULES: Schedule[] = [
  {
    "id": "sch-1788486106856-7",
    "date": "2026-09-27",
    "serviceType": "Domingo (Noite)",
    "members": [
      "Z9C3CC",
      "8ZRVW2",
      "X17RHN",
      "7FUW2H",
      "24BWIX",
      "MPSD03"
    ],
    "assignments": [
      {
        "role": "Vocal Líder",
        "memberId": "Z9C3CC",
        "confirmed": false
      },
      {
        "role": "Vocal",
        "memberId": "8ZRVW2",
        "confirmed": false
      },
      {
        "role": "Vocal",
        "memberId": "X17RHN",
        "confirmed": false
      },
      {
        "role": "Vocal",
        "memberId": "7FUW2H",
        "confirmed": false
      },
      {
        "role": "Teclado",
        "memberId": "24BWIX",
        "confirmed": false
      },
      {
        "role": "Violão",
        "memberId": "Z9C3CC",
        "confirmed": false
      },
      {
        "role": "Bateria",
        "memberId": "MPSD03",
        "confirmed": false
      }
    ],
    "songs": [
      {
        "id": "S4OASX",
        "key": "A",
        "confirmed": false
      }
    ],
    "leaderIds": [
      "Z9C3CC"
    ],
    "vocalIds": [
      "8ZRVW2",
      "X17RHN",
      "7FUW2H"
    ],
    "confirmed": false,
    "observations": "",
    "attendanceMarked": false
  },
  {
    "id": "sch-1788486106856-5",
    "date": "2026-09-20",
    "serviceType": "Domingo (Noite)",
    "members": [
      "VDANAH",
      "QL783O",
      "7PC6VT",
      "DKSUWB",
      "Z9C3CC",
      "24BWIX",
      "MPSD03"
    ],
    "assignments": [
      {
        "role": "Vocal Líder",
        "memberId": "VDANAH",
        "confirmed": false
      },
      {
        "role": "Vocal",
        "memberId": "QL783O",
        "confirmed": false
      },
      {
        "role": "Vocal",
        "memberId": "7PC6VT",
        "confirmed": false
      },
      {
        "role": "Vocal",
        "memberId": "DKSUWB",
        "confirmed": false
      },
      {
        "role": "Teclado",
        "memberId": "Z9C3CC",
        "confirmed": false
      },
      {
        "role": "Baixo",
        "memberId": "24BWIX",
        "confirmed": false
      },
      {
        "role": "Bateria",
        "memberId": "MPSD03",
        "confirmed": false
      }
    ],
    "songs": [
      {
        "id": "KH9MOS",
        "key": "E",
        "confirmed": false
      },
      {
        "id": "UOIKNZ",
        "key": "C",
        "confirmed": false
      },
      {
        "id": "JSN0YX",
        "key": "",
        "confirmed": false
      }
    ],
    "leaderIds": [
      "VDANAH"
    ],
    "vocalIds": [
      "QL783O",
      "7PC6VT",
      "DKSUWB"
    ],
    "confirmed": false,
    "observations": "",
    "attendanceMarked": false
  },
  {
    "id": "sch-1788486106856-3",
    "date": "2026-09-13",
    "serviceType": "Domingo (Noite)",
    "members": [
      "7FUW2H",
      "X17RHN",
      "DKSUWB",
      "8ZRVW2",
      "Z9C3CC",
      "24BWIX",
      "MPSD03"
    ],
    "assignments": [
      {
        "role": "Vocal Líder",
        "memberId": "7FUW2H",
        "confirmed": false,
        "present": true
      },
      {
        "role": "Vocal Líder",
        "memberId": "X17RHN",
        "confirmed": false,
        "present": true
      },
      {
        "role": "Vocal",
        "memberId": "DKSUWB",
        "confirmed": false,
        "present": true
      },
      {
        "role": "Vocal",
        "memberId": "8ZRVW2",
        "confirmed": false,
        "present": true
      },
      {
        "role": "Teclado",
        "memberId": "Z9C3CC",
        "confirmed": false,
        "present": true
      },
      {
        "role": "Baixo",
        "memberId": "24BWIX",
        "confirmed": false,
        "present": true
      },
      {
        "role": "Bateria",
        "memberId": "MPSD03",
        "confirmed": false,
        "present": true
      }
    ],
    "songs": [
      {
        "id": "D2PY5Q",
        "key": "",
        "confirmed": false
      },
      {
        "id": "B14ALL",
        "key": "C",
        "confirmed": false
      }
    ],
    "leaderIds": [
      "7FUW2H",
      "X17RHN"
    ],
    "vocalIds": [
      "DKSUWB",
      "8ZRVW2"
    ],
    "confirmed": true,
    "observations": "",
    "attendanceMarked": true
  },
  {
    "id": "sch-1788486106856-1",
    "date": "2026-09-06",
    "serviceType": "Domingo (Noite)",
    "members": [
      "7FUW2H",
      "VDANAH",
      "QL783O",
      "8ZRVW2",
      "Z9C3CC",
      "GGOR98",
      "24BWIX",
      "MPSD03"
    ],
    "assignments": [
      {
        "role": "Vocal Líder",
        "memberId": "7FUW2H",
        "confirmed": false,
        "present": true
      },
      {
        "role": "Vocal Líder",
        "memberId": "VDANAH",
        "confirmed": false,
        "present": true
      },
      {
        "role": "Vocal",
        "memberId": "QL783O",
        "confirmed": false,
        "present": true
      },
      {
        "role": "Vocal",
        "memberId": "8ZRVW2",
        "confirmed": false,
        "present": true
      },
      {
        "role": "Teclado",
        "memberId": "Z9C3CC",
        "confirmed": false,
        "present": true
      },
      {
        "role": "Violão",
        "memberId": "GGOR98",
        "confirmed": false,
        "present": true
      },
      {
        "role": "Baixo",
        "memberId": "24BWIX",
        "confirmed": false,
        "present": true
      },
      {
        "role": "Bateria",
        "memberId": "MPSD03",
        "confirmed": false,
        "present": true
      }
    ],
    "songs": [
      {
        "id": "B14ALL",
        "key": "C",
        "confirmed": false
      },
      {
        "id": "DEA5Q0",
        "key": "E",
        "confirmed": false
      }
    ],
    "leaderIds": [
      "7FUW2H",
      "VDANAH"
    ],
    "vocalIds": [
      "QL783O",
      "8ZRVW2"
    ],
    "confirmed": true,
    "observations": "",
    "attendanceMarked": true
  },
  {
    "id": "sch-1785526509915-8",
    "date": "2026-08-30",
    "serviceType": "Domingo/semana",
    "members": [
      "Z9C3CC",
      "7PC6VT",
      "QL783O",
      "VDANAH",
      "24BWIX",
      "MPSD03"
    ],
    "assignments": [
      {
        "role": "Vocal Líder",
        "memberId": "Z9C3CC",
        "confirmed": false
      },
      {
        "role": "Vocal",
        "memberId": "7PC6VT",
        "confirmed": false
      },
      {
        "role": "Vocal",
        "memberId": "QL783O",
        "confirmed": false
      },
      {
        "role": "Vocal",
        "memberId": "VDANAH",
        "confirmed": false
      },
      {
        "role": "Teclado",
        "memberId": "24BWIX",
        "confirmed": false
      },
      {
        "role": "Violão",
        "memberId": "Z9C3CC",
        "confirmed": false
      },
      {
        "role": "Bateria",
        "memberId": "MPSD03",
        "confirmed": false
      }
    ],
    "songs": [],
    "leaderIds": [
      "Z9C3CC"
    ],
    "vocalIds": [
      "7PC6VT",
      "QL783O",
      "VDANAH"
    ],
    "confirmed": false,
    "observations": "",
    "attendanceMarked": false
  },
  {
    "id": "sch-1785526509915-6",
    "date": "2026-08-23",
    "serviceType": "Domingo/semana",
    "members": [
      "VDANAH",
      "7PC6VT",
      "QL783O",
      "DKSUWB",
      "Z9C3CC",
      "GGOR98",
      "24BWIX",
      "MPSD03"
    ],
    "assignments": [
      {
        "role": "Vocal Líder",
        "memberId": "VDANAH",
        "confirmed": false
      },
      {
        "role": "Vocal",
        "memberId": "7PC6VT",
        "confirmed": false
      },
      {
        "role": "Vocal",
        "memberId": "QL783O",
        "confirmed": false
      },
      {
        "role": "Vocal",
        "memberId": "DKSUWB",
        "confirmed": false
      },
      {
        "role": "Teclado",
        "memberId": "Z9C3CC",
        "confirmed": false
      },
      {
        "role": "Violão",
        "memberId": "GGOR98",
        "confirmed": false
      },
      {
        "role": "Baixo",
        "memberId": "24BWIX",
        "confirmed": false
      },
      {
        "role": "Bateria",
        "memberId": "MPSD03",
        "confirmed": false
      }
    ],
    "songs": [
      {
        "id": "419NZ6",
        "key": "G",
        "confirmed": false
      },
      {
        "id": "K96TBB",
        "key": "E",
        "confirmed": false
      },
      {
        "id": "ABKFFR",
        "key": "G",
        "confirmed": false
      },
      {
        "id": "Y8UUI1",
        "key": "A",
        "confirmed": false
      }
    ],
    "leaderIds": [
      "VDANAH"
    ],
    "vocalIds": [
      "7PC6VT",
      "QL783O",
      "DKSUWB"
    ],
    "confirmed": false,
    "observations": "",
    "attendanceMarked": false
  },
  {
    "id": "sch-1785526509915-4",
    "date": "2026-08-16",
    "serviceType": "Domingo/semana",
    "members": [
      "X17RHN",
      "7FUW2H",
      "DKSUWB",
      "Z9C3CC",
      "24BWIX",
      "MPSD03"
    ],
    "assignments": [
      {
        "role": "Vocal Líder",
        "memberId": "X17RHN",
        "confirmed": false
      },
      {
        "role": "Vocal",
        "memberId": "7FUW2H",
        "confirmed": false
      },
      {
        "role": "Vocal",
        "memberId": "DKSUWB",
        "confirmed": false
      },
      {
        "role": "Teclado",
        "memberId": "Z9C3CC",
        "confirmed": false
      },
      {
        "role": "Baixo",
        "memberId": "24BWIX",
        "confirmed": false
      },
      {
        "role": "Bateria",
        "memberId": "MPSD03",
        "confirmed": false
      }
    ],
    "songs": [],
    "leaderIds": [
      "X17RHN"
    ],
    "vocalIds": [
      "7FUW2H",
      "DKSUWB"
    ],
    "confirmed": false,
    "observations": "",
    "attendanceMarked": false
  },
  {
    "id": "sch-1785526509915-2",
    "date": "2026-08-09",
    "serviceType": "Domingo/semana",
    "members": [
      "7FUW2H",
      "7PC6VT",
      "X17RHN",
      "DKSUWB",
      "GGOR98",
      "Z9C3CC",
      "24BWIX",
      "PKNF87"
    ],
    "assignments": [
      {
        "role": "Vocal Líder",
        "memberId": "7FUW2H",
        "confirmed": false
      },
      {
        "role": "Vocal",
        "memberId": "7PC6VT",
        "confirmed": false
      },
      {
        "role": "Vocal",
        "memberId": "X17RHN",
        "confirmed": false
      },
      {
        "role": "Vocal",
        "memberId": "DKSUWB",
        "confirmed": false
      },
      {
        "role": "Teclado",
        "memberId": "GGOR98",
        "confirmed": false
      },
      {
        "role": "Violão",
        "memberId": "Z9C3CC",
        "confirmed": false
      },
      {
        "role": "Baixo",
        "memberId": "24BWIX",
        "confirmed": false
      },
      {
        "role": "Bateria",
        "memberId": "PKNF87",
        "confirmed": false
      }
    ],
    "songs": [],
    "leaderIds": [
      "7FUW2H"
    ],
    "vocalIds": [
      "7PC6VT",
      "X17RHN",
      "DKSUWB"
    ],
    "confirmed": false,
    "observations": "",
    "attendanceMarked": false
  },
  {
    "id": "sch-1785526509915-0",
    "date": "2026-08-02",
    "serviceType": "Domingo/semana",
    "members": [
      "Z9C3CC",
      "7FUW2H",
      "QL783O",
      "24BWIX",
      "MPSD03"
    ],
    "assignments": [
      {
        "role": "Vocal Líder",
        "memberId": "Z9C3CC",
        "confirmed": false
      },
      {
        "role": "Vocal",
        "memberId": "7FUW2H",
        "confirmed": false
      },
      {
        "role": "Vocal",
        "memberId": "QL783O",
        "confirmed": false
      },
      {
        "role": "Teclado",
        "memberId": "24BWIX",
        "confirmed": false
      },
      {
        "role": "Violão",
        "memberId": "Z9C3CC",
        "confirmed": false
      },
      {
        "role": "Bateria",
        "memberId": "MPSD03",
        "confirmed": false
      }
    ],
    "songs": [],
    "leaderIds": [
      "Z9C3CC"
    ],
    "vocalIds": [
      "7FUW2H",
      "QL783O"
    ],
    "confirmed": false,
    "observations": "",
    "attendanceMarked": false
  },
  {
    "id": "sch-1783195602014-7",
    "date": "2026-07-26",
    "serviceType": "Domingo/semana",
    "members": [
      "7FUW2H",
      "VDANAH",
      "DKSUWB",
      "QL783O",
      "24BWIX",
      "Z9C3CC",
      "PKNF87"
    ],
    "assignments": [
      {
        "role": "Vocal Líder",
        "memberId": "7FUW2H",
        "confirmed": false
      },
      {
        "role": "Vocal",
        "memberId": "VDANAH",
        "confirmed": false
      },
      {
        "role": "Vocal",
        "memberId": "DKSUWB",
        "confirmed": false
      },
      {
        "role": "Vocal",
        "memberId": "QL783O",
        "confirmed": false
      },
      {
        "role": "Teclado",
        "memberId": "24BWIX",
        "confirmed": false
      },
      {
        "role": "Violão",
        "memberId": "Z9C3CC",
        "confirmed": false
      },
      {
        "role": "Bateria",
        "memberId": "PKNF87",
        "confirmed": false
      }
    ],
    "songs": [],
    "leaderIds": [
      "7FUW2H"
    ],
    "vocalIds": [
      "VDANAH",
      "DKSUWB",
      "QL783O"
    ],
    "confirmed": false,
    "observations": "",
    "attendanceMarked": false
  },
  {
    "id": "sch-1783195602014-3",
    "date": "2026-07-12",
    "serviceType": "Domingo/semana",
    "members": [
      "7FUW2H",
      "VDANAH",
      "DKSUWB",
      "Z9C3CC",
      "24BWIX",
      "0Y1ZXP",
      "PKNF87"
    ],
    "assignments": [
      {
        "role": "Vocal Líder",
        "memberId": "7FUW2H",
        "confirmed": false
      },
      {
        "role": "Vocal",
        "memberId": "VDANAH",
        "confirmed": false
      },
      {
        "role": "Vocal",
        "memberId": "DKSUWB",
        "confirmed": false
      },
      {
        "role": "Teclado",
        "memberId": "Z9C3CC",
        "confirmed": false
      },
      {
        "role": "Violão",
        "memberId": "24BWIX",
        "confirmed": false
      },
      {
        "role": "Baixo",
        "memberId": "0Y1ZXP",
        "confirmed": false
      },
      {
        "role": "Bateria",
        "memberId": "PKNF87",
        "confirmed": false
      }
    ],
    "songs": [
      {
        "id": "TS9AL2",
        "key": "",
        "confirmed": false
      }
    ],
    "leaderIds": [
      "7FUW2H"
    ],
    "vocalIds": [
      "VDANAH",
      "DKSUWB"
    ],
    "confirmed": false,
    "observations": "",
    "attendanceMarked": false
  },
  {
    "id": "sch-1783195602014-1",
    "date": "2026-07-05",
    "serviceType": "Domingo/semana",
    "members": [
      "Z9C3CC",
      "7FUW2H",
      "QL783O",
      "X17RHN",
      "24BWIX",
      "MPSD03"
    ],
    "assignments": [
      {
        "role": "Vocal Líder",
        "memberId": "Z9C3CC",
        "confirmed": false
      },
      {
        "role": "Vocal",
        "memberId": "7FUW2H",
        "confirmed": false
      },
      {
        "role": "Vocal",
        "memberId": "QL783O",
        "confirmed": false
      },
      {
        "role": "Vocal",
        "memberId": "X17RHN",
        "confirmed": false
      },
      {
        "role": "Teclado",
        "memberId": "24BWIX",
        "confirmed": false
      },
      {
        "role": "Violão",
        "memberId": "Z9C3CC",
        "confirmed": false
      },
      {
        "role": "Bateria",
        "memberId": "MPSD03",
        "confirmed": false
      }
    ],
    "songs": [
      {
        "id": "9U33GC",
        "key": "B",
        "confirmed": false
      },
      {
        "id": "BCXRHQ",
        "key": "E",
        "confirmed": false
      },
      {
        "id": "X60X1R",
        "key": "E",
        "confirmed": false
      }
    ],
    "leaderIds": [
      "Z9C3CC"
    ],
    "vocalIds": [
      "7FUW2H",
      "QL783O",
      "X17RHN"
    ],
    "confirmed": false,
    "observations": "",
    "attendanceMarked": false
  },
  {
    "id": "sch-1780614915157-7",
    "date": "2026-06-28",
    "serviceType": "Domingo/semana",
    "members": [
      "VDANAH",
      "X17RHN",
      "QL783O",
      "7PC6VT",
      "24BWIX",
      "Z9C3CC",
      "6310A5",
      "PKNF87"
    ],
    "assignments": [
      {
        "role": "Vocal Líder",
        "memberId": "VDANAH",
        "confirmed": false
      },
      {
        "role": "Vocal",
        "memberId": "X17RHN",
        "confirmed": false
      },
      {
        "role": "Vocal",
        "memberId": "QL783O",
        "confirmed": false
      },
      {
        "role": "Vocal",
        "memberId": "7PC6VT",
        "confirmed": false
      },
      {
        "role": "Teclado",
        "memberId": "24BWIX",
        "confirmed": false
      },
      {
        "role": "Violão",
        "memberId": "Z9C3CC",
        "confirmed": false
      },
      {
        "role": "Baixo",
        "memberId": "6310A5",
        "confirmed": false
      },
      {
        "role": "Bateria",
        "memberId": "PKNF87",
        "confirmed": false
      }
    ],
    "songs": [
      {
        "id": "X6EDMY",
        "key": "",
        "confirmed": false
      },
      {
        "id": "FJ5RN7",
        "key": "G",
        "confirmed": false
      },
      {
        "id": "JBSOK8",
        "key": "",
        "confirmed": false
      }
    ],
    "leaderIds": [
      "VDANAH"
    ],
    "vocalIds": [
      "X17RHN",
      "QL783O",
      "7PC6VT"
    ],
    "confirmed": false,
    "observations": "",
    "attendanceMarked": false
  },
  {
    "id": "sch-1780614915157-5",
    "date": "2026-06-21",
    "serviceType": "Domingo (Noite)",
    "members": [
      "ZUSMHY",
      "DKSUWB",
      "8ZRVW2",
      "7FUW2H",
      "Z9C3CC",
      "24BWIX",
      "MPSD03"
    ],
    "assignments": [
      {
        "role": "Vocal Líder",
        "memberId": "ZUSMHY",
        "confirmed": false
      },
      {
        "role": "Vocal",
        "memberId": "DKSUWB",
        "confirmed": false
      },
      {
        "role": "Vocal",
        "memberId": "8ZRVW2",
        "confirmed": false
      },
      {
        "role": "Vocal",
        "memberId": "7FUW2H",
        "confirmed": false
      },
      {
        "role": "Teclado",
        "memberId": "Z9C3CC",
        "confirmed": false
      },
      {
        "role": "Violão",
        "memberId": "24BWIX",
        "confirmed": false
      },
      {
        "role": "Bateria",
        "memberId": "MPSD03",
        "confirmed": false
      }
    ],
    "songs": [
      {
        "id": "F6V56E",
        "key": "G",
        "confirmed": false
      },
      {
        "id": "X3HING",
        "key": "G",
        "confirmed": false
      },
      {
        "id": "F2W5NX",
        "key": "",
        "confirmed": false
      },
      {
        "id": "TSUNIJ",
        "key": "",
        "confirmed": false
      }
    ],
    "leaderIds": [
      "ZUSMHY"
    ],
    "vocalIds": [
      "DKSUWB",
      "8ZRVW2",
      "7FUW2H"
    ],
    "confirmed": false,
    "observations": "",
    "attendanceMarked": false
  },
  {
    "id": "sch-1780614915157-3",
    "date": "2026-06-14",
    "serviceType": "Domingo (Noite)",
    "members": [
      "X17RHN",
      "7FUW2H",
      "QL783O",
      "VDANAH",
      "24BWIX",
      "Z9C3CC",
      "PKNF87"
    ],
    "assignments": [
      {
        "role": "Vocal Líder",
        "memberId": "X17RHN",
        "confirmed": false
      },
      {
        "role": "Vocal",
        "memberId": "7FUW2H",
        "confirmed": false
      },
      {
        "role": "Vocal",
        "memberId": "QL783O",
        "confirmed": false
      },
      {
        "role": "Vocal",
        "memberId": "VDANAH",
        "confirmed": false
      },
      {
        "role": "Teclado",
        "memberId": "24BWIX",
        "confirmed": false
      },
      {
        "role": "Violão",
        "memberId": "Z9C3CC",
        "confirmed": false
      },
      {
        "role": "Bateria",
        "memberId": "PKNF87",
        "confirmed": false
      }
    ],
    "songs": [],
    "leaderIds": [
      "X17RHN"
    ],
    "vocalIds": [
      "7FUW2H",
      "QL783O",
      "VDANAH"
    ],
    "confirmed": false,
    "observations": "",
    "attendanceMarked": false
  },
  {
    "id": "sch-1780614915157-1",
    "date": "2026-06-07",
    "serviceType": "Domingo (Noite)",
    "members": [
      "7FUW2H",
      "7PC6VT",
      "6RXLI2",
      "8ZRVW2",
      "DKSUWB",
      "24BWIX",
      "Z9C3CC",
      "PKNF87"
    ],
    "assignments": [
      {
        "role": "Vocal Líder",
        "memberId": "7FUW2H",
        "confirmed": false
      },
      {
        "role": "Vocal",
        "memberId": "7PC6VT",
        "confirmed": false
      },
      {
        "role": "Vocal",
        "memberId": "6RXLI2",
        "confirmed": false
      },
      {
        "role": "Vocal",
        "memberId": "8ZRVW2",
        "confirmed": false
      },
      {
        "role": "Vocal",
        "memberId": "DKSUWB",
        "confirmed": false
      },
      {
        "role": "Teclado",
        "memberId": "24BWIX",
        "confirmed": false
      },
      {
        "role": "Violão",
        "memberId": "Z9C3CC",
        "confirmed": false
      },
      {
        "role": "Bateria",
        "memberId": "PKNF87",
        "confirmed": false
      }
    ],
    "songs": [],
    "leaderIds": [
      "7FUW2H"
    ],
    "vocalIds": [
      "7PC6VT",
      "6RXLI2",
      "8ZRVW2",
      "DKSUWB"
    ],
    "confirmed": false,
    "observations": "",
    "attendanceMarked": false
  },
  {
    "id": "CM5YO6",
    "date": "2026-05-31",
    "serviceType": "Domingo/semana",
    "members": [
      "Z9C3CC",
      "7FUW2H",
      "8ZRVW2",
      "VDANAH",
      "7PC6VT",
      "24BWIX",
      "MPSD03"
    ],
    "assignments": [
      {
        "role": "Vocal Líder",
        "memberId": "Z9C3CC",
        "confirmed": false,
        "present": true
      },
      {
        "role": "Vocal",
        "memberId": "7FUW2H",
        "confirmed": false,
        "present": true
      },
      {
        "role": "Vocal",
        "memberId": "8ZRVW2",
        "confirmed": false,
        "present": true
      },
      {
        "role": "Vocal",
        "memberId": "VDANAH",
        "confirmed": false,
        "present": true
      },
      {
        "role": "Vocal",
        "memberId": "7PC6VT",
        "confirmed": false,
        "present": true
      },
      {
        "role": "Teclado",
        "memberId": "24BWIX",
        "confirmed": false,
        "present": true
      },
      {
        "role": "Violão",
        "memberId": "Z9C3CC",
        "confirmed": false,
        "present": true
      },
      {
        "role": "Bateria",
        "memberId": "MPSD03",
        "confirmed": false,
        "present": true
      }
    ],
    "songs": [
      {
        "id": "R303YU",
        "key": "D",
        "confirmed": true
      },
      {
        "id": "K8YBOJ",
        "key": "A",
        "confirmed": true
      },
      {
        "id": "GMQ8N8",
        "key": "A",
        "confirmed": true
      },
      {
        "id": "P3J3GB",
        "key": "A",
        "confirmed": true
      },
      {
        "id": "3UP7RU",
        "key": "A",
        "confirmed": false
      },
      {
        "id": "EHGMV3",
        "key": "A",
        "confirmed": false
      }
    ],
    "leaderIds": [
      "Z9C3CC"
    ],
    "vocalIds": [
      "7FUW2H",
      "8ZRVW2",
      "VDANAH",
      "7PC6VT"
    ],
    "confirmed": true,
    "observations": "",
    "attendanceMarked": true
  },
  {
    "id": "TZXVCN",
    "date": "2026-05-24",
    "serviceType": "Domingo/semana",
    "members": [
      "GGOR98",
      "VDANAH",
      "6RXLI2",
      "8ZRVW2",
      "DKSUWB",
      "24BWIX",
      "Z9C3CC",
      "PKNF87"
    ],
    "assignments": [
      {
        "role": "Vocal Líder",
        "memberId": "GGOR98",
        "confirmed": false,
        "present": true
      },
      {
        "role": "Vocal",
        "memberId": "VDANAH",
        "confirmed": false,
        "present": true
      },
      {
        "role": "Vocal",
        "memberId": "6RXLI2",
        "confirmed": false,
        "present": true
      },
      {
        "role": "Vocal",
        "memberId": "8ZRVW2",
        "confirmed": false,
        "present": true
      },
      {
        "role": "Vocal",
        "memberId": "DKSUWB",
        "confirmed": false,
        "present": true
      },
      {
        "role": "Teclado",
        "memberId": "24BWIX",
        "confirmed": false,
        "present": true
      },
      {
        "role": "Violão",
        "memberId": "GGOR98",
        "confirmed": false,
        "present": true
      },
      {
        "role": "Baixo",
        "memberId": "Z9C3CC",
        "confirmed": false,
        "present": true
      },
      {
        "role": "Bateria",
        "memberId": "PKNF87",
        "confirmed": false,
        "present": true
      }
    ],
    "songs": [
      {
        "id": "R303YU",
        "key": "D",
        "confirmed": false
      },
      {
        "id": "EEJIFP",
        "key": "G",
        "confirmed": false
      }
    ],
    "leaderIds": [
      "GGOR98"
    ],
    "vocalIds": [
      "VDANAH",
      "6RXLI2",
      "8ZRVW2",
      "DKSUWB"
    ],
    "confirmed": true,
    "observations": "",
    "attendanceMarked": true
  },
  {
    "id": "7HXTM9",
    "date": "2026-05-17",
    "serviceType": "Domingo/semana",
    "members": [
      "X17RHN",
      "8ZRVW2",
      "DKSUWB",
      "QL783O",
      "7PC6VT",
      "Z9C3CC",
      "24BWIX",
      "MPSD03"
    ],
    "assignments": [
      {
        "role": "Vocal Líder",
        "memberId": "X17RHN",
        "confirmed": false,
        "present": true
      },
      {
        "role": "Vocal",
        "memberId": "8ZRVW2",
        "confirmed": false,
        "present": true
      },
      {
        "role": "Vocal",
        "memberId": "DKSUWB",
        "confirmed": false
      },
      {
        "role": "Vocal",
        "memberId": "QL783O",
        "confirmed": false,
        "present": true
      },
      {
        "role": "Vocal",
        "memberId": "7PC6VT",
        "confirmed": false
      },
      {
        "role": "Teclado",
        "memberId": "Z9C3CC",
        "confirmed": false,
        "present": true
      },
      {
        "role": "Violão",
        "memberId": "24BWIX",
        "confirmed": false
      },
      {
        "role": "Bateria",
        "memberId": "MPSD03",
        "confirmed": false,
        "present": true
      }
    ],
    "songs": [
      {
        "id": "EHGMV3",
        "key": "C",
        "confirmed": true
      },
      {
        "id": "FJ5RN7",
        "key": "C",
        "confirmed": true
      },
      {
        "id": "X60X1R",
        "key": "",
        "confirmed": true
      },
      {
        "id": "B14ALL",
        "key": "C",
        "confirmed": true
      },
      {
        "id": "R303YU",
        "key": "E",
        "confirmed": true
      }
    ],
    "leaderIds": [
      "X17RHN"
    ],
    "vocalIds": [
      "8ZRVW2",
      "DKSUWB",
      "QL783O",
      "7PC6VT"
    ],
    "confirmed": false,
    "observations": "",
    "attendanceMarked": true
  },
  {
    "id": "DO8JWV",
    "date": "2026-05-10",
    "serviceType": "Domingo/semana",
    "members": [
      "7FUW2H",
      "DKSUWB",
      "7PC6VT",
      "X17RHN",
      "VDANAH",
      "24BWIX",
      "Z9C3CC",
      "PKNF87"
    ],
    "assignments": [
      {
        "role": "Vocal Líder",
        "memberId": "7FUW2H",
        "confirmed": false,
        "present": true
      },
      {
        "role": "Vocal",
        "memberId": "DKSUWB",
        "confirmed": false,
        "present": true
      },
      {
        "role": "Vocal",
        "memberId": "7PC6VT",
        "confirmed": false,
        "present": true
      },
      {
        "role": "Vocal",
        "memberId": "X17RHN",
        "confirmed": false,
        "present": true
      },
      {
        "role": "Vocal",
        "memberId": "VDANAH",
        "confirmed": false,
        "present": true
      },
      {
        "role": "Teclado",
        "memberId": "24BWIX",
        "confirmed": false,
        "present": true
      },
      {
        "role": "Violão",
        "memberId": "Z9C3CC",
        "confirmed": false,
        "present": true
      },
      {
        "role": "Bateria",
        "memberId": "PKNF87",
        "confirmed": false,
        "present": true
      }
    ],
    "songs": [
      {
        "id": "R303YU",
        "key": "",
        "confirmed": true
      },
      {
        "id": "FQJ5SE",
        "key": "E",
        "confirmed": true
      },
      {
        "id": "UOIKNZ",
        "key": "E",
        "confirmed": true
      },
      {
        "id": "JE0OWN",
        "key": "G",
        "confirmed": true
      },
      {
        "id": "F6V56E",
        "key": "G",
        "confirmed": true
      }
    ],
    "leaderIds": [
      "7FUW2H"
    ],
    "vocalIds": [
      "DKSUWB",
      "7PC6VT",
      "X17RHN",
      "VDANAH"
    ],
    "confirmed": true,
    "observations": "Escala corrigida.\nColoquei André mas ele não estaria.\nnegão tocou",
    "attendanceMarked": true
  },
  {
    "id": "7QLCER",
    "date": "2026-05-03",
    "serviceType": "Domingo/semana",
    "members": [
      "Z9C3CC",
      "ZUSMHY",
      "6RXLI2",
      "QL783O",
      "7FUW2H",
      "24BWIX",
      "PKNF87"
    ],
    "assignments": [
      {
        "role": "Vocal Líder",
        "memberId": "Z9C3CC",
        "confirmed": false,
        "present": true
      },
      {
        "role": "Vocal",
        "memberId": "ZUSMHY",
        "confirmed": false,
        "present": true
      },
      {
        "role": "Vocal",
        "memberId": "6RXLI2",
        "confirmed": false,
        "present": true
      },
      {
        "role": "Vocal",
        "memberId": "QL783O",
        "confirmed": false,
        "present": true
      },
      {
        "role": "Vocal",
        "memberId": "7FUW2H",
        "confirmed": false,
        "present": true
      },
      {
        "role": "Teclado",
        "memberId": "24BWIX",
        "confirmed": false,
        "present": true
      },
      {
        "role": "Violão",
        "memberId": "Z9C3CC",
        "confirmed": false,
        "present": true
      },
      {
        "role": "Bateria",
        "memberId": "PKNF87",
        "confirmed": false,
        "present": true
      }
    ],
    "songs": [
      {
        "id": "GGADVO",
        "key": "A",
        "confirmed": true
      },
      {
        "id": "EHGMV3",
        "key": "A",
        "confirmed": true
      },
      {
        "id": "KH9MOS",
        "key": "E",
        "confirmed": true
      },
      {
        "id": "R303YU",
        "key": "",
        "confirmed": true
      }
    ],
    "leaderIds": [
      "Z9C3CC"
    ],
    "vocalIds": [
      "ZUSMHY",
      "6RXLI2",
      "QL783O",
      "7FUW2H"
    ],
    "confirmed": true,
    "observations": "",
    "attendanceMarked": true
  },
  {
    "id": "7LZSI2",
    "date": "2026-04-26",
    "serviceType": "Domingo/semana",
    "members": [
      "GGOR98",
      "8ZRVW2",
      "DKSUWB",
      "VDANAH",
      "24BWIX",
      "Z9C3CC",
      "MPSD03"
    ],
    "assignments": [
      {
        "role": "Vocal Líder",
        "memberId": "GGOR98",
        "confirmed": false
      },
      {
        "role": "Vocal",
        "memberId": "8ZRVW2",
        "confirmed": false
      },
      {
        "role": "Vocal",
        "memberId": "DKSUWB",
        "confirmed": false
      },
      {
        "role": "Vocal",
        "memberId": "VDANAH",
        "confirmed": false
      },
      {
        "role": "Teclado",
        "memberId": "24BWIX",
        "confirmed": false
      },
      {
        "role": "Violão",
        "memberId": "GGOR98",
        "confirmed": false
      },
      {
        "role": "Baixo",
        "memberId": "Z9C3CC",
        "confirmed": false
      },
      {
        "role": "Bateria",
        "memberId": "MPSD03",
        "confirmed": false
      }
    ],
    "songs": [],
    "leaderIds": [
      "GGOR98"
    ],
    "vocalIds": [
      "8ZRVW2",
      "DKSUWB",
      "VDANAH"
    ],
    "confirmed": true,
    "observations": "",
    "attendanceMarked": false
  },
  {
    "id": "65848X",
    "date": "2026-04-19",
    "serviceType": "Domingo/semana",
    "members": [
      "7FUW2H",
      "VDANAH",
      "8ZRVW2",
      "Z9C3CC",
      "24BWIX",
      "JLIN30"
    ],
    "assignments": [
      {
        "role": "Vocal Líder",
        "memberId": "7FUW2H",
        "confirmed": false,
        "present": true
      },
      {
        "role": "Vocal",
        "memberId": "VDANAH",
        "confirmed": false,
        "present": true
      },
      {
        "role": "Vocal",
        "memberId": "8ZRVW2",
        "confirmed": false,
        "present": true
      },
      {
        "role": "Vocal",
        "memberId": "Z9C3CC",
        "confirmed": false,
        "present": true
      },
      {
        "role": "Teclado",
        "memberId": "24BWIX",
        "confirmed": false,
        "present": true
      },
      {
        "role": "Violão",
        "memberId": "Z9C3CC",
        "confirmed": false,
        "present": true
      },
      {
        "role": "Bateria",
        "memberId": "JLIN30",
        "confirmed": false,
        "present": true
      }
    ],
    "songs": [
      {
        "id": "J8R71U",
        "key": "D",
        "confirmed": true
      },
      {
        "id": "1FJXFH",
        "key": "E",
        "confirmed": true
      },
      {
        "id": "DFDQW9",
        "key": "E",
        "confirmed": true
      },
      {
        "id": "9U33GC",
        "key": "C",
        "confirmed": true
      }
    ],
    "leaderIds": [
      "7FUW2H"
    ],
    "vocalIds": [
      "VDANAH",
      "8ZRVW2",
      "Z9C3CC"
    ],
    "confirmed": true,
    "observations": "Escala atualizada.\nJoana não pode ir.",
    "attendanceMarked": true
  },
  {
    "id": "9QNPFH",
    "date": "2026-04-12",
    "serviceType": "Domingo/semana",
    "members": [
      "X17RHN",
      "QL783O",
      "7FUW2H",
      "6RXLI2",
      "DKSUWB",
      "24BWIX",
      "Z9C3CC",
      "PKNF87"
    ],
    "assignments": [
      {
        "role": "Vocal Líder",
        "memberId": "X17RHN",
        "confirmed": false,
        "present": true
      },
      {
        "role": "Vocal",
        "memberId": "QL783O",
        "confirmed": false,
        "present": true
      },
      {
        "role": "Vocal",
        "memberId": "7FUW2H",
        "confirmed": false,
        "present": true
      },
      {
        "role": "Vocal",
        "memberId": "6RXLI2",
        "confirmed": false,
        "present": true
      },
      {
        "role": "Vocal",
        "memberId": "DKSUWB",
        "confirmed": false,
        "present": true
      },
      {
        "role": "Teclado",
        "memberId": "24BWIX",
        "confirmed": false,
        "present": true
      },
      {
        "role": "Violão",
        "memberId": "Z9C3CC",
        "confirmed": false,
        "present": true
      },
      {
        "role": "Bateria",
        "memberId": "PKNF87",
        "confirmed": false,
        "present": true
      }
    ],
    "songs": [
      {
        "id": "BCXRHQ",
        "key": "E",
        "confirmed": true
      },
      {
        "id": "KAXQJY",
        "key": "B",
        "confirmed": true
      },
      {
        "id": "INGYZC",
        "key": "E",
        "confirmed": true
      }
    ],
    "leaderIds": [
      "X17RHN"
    ],
    "vocalIds": [
      "QL783O",
      "7FUW2H",
      "6RXLI2",
      "DKSUWB"
    ],
    "confirmed": true,
    "observations": "Por falta de baixo Matheus tocou viola e Abner teclado.\nCléo e Gabriel estavam pra liderar o louvor porém somente Gabriel conduziu.\nEscala foi atualizada ",
    "attendanceMarked": true
  },
  {
    "id": "CA2HML",
    "date": "2026-04-09",
    "serviceType": "Evento Especial",
    "members": [
      "Z9C3CC",
      "7FUW2H",
      "X17RHN",
      "DKSUWB",
      "QL783O",
      "VDANAH",
      "8ZRVW2",
      "24BWIX",
      "CP6IPB",
      "AKLL6T",
      "PKNF87"
    ],
    "assignments": [
      {
        "role": "Vocal Líder",
        "memberId": "Z9C3CC",
        "confirmed": false,
        "present": true
      },
      {
        "role": "Vocal Líder",
        "memberId": "7FUW2H",
        "confirmed": false,
        "present": true
      },
      {
        "role": "Vocal",
        "memberId": "X17RHN",
        "confirmed": false,
        "present": true
      },
      {
        "role": "Vocal",
        "memberId": "DKSUWB",
        "confirmed": false,
        "present": true
      },
      {
        "role": "Vocal",
        "memberId": "QL783O",
        "confirmed": false,
        "present": true
      },
      {
        "role": "Vocal",
        "memberId": "VDANAH",
        "confirmed": false,
        "present": true
      },
      {
        "role": "Vocal",
        "memberId": "8ZRVW2",
        "confirmed": false,
        "present": true
      },
      {
        "role": "Teclado",
        "memberId": "24BWIX",
        "confirmed": false,
        "present": true
      },
      {
        "role": "Violão",
        "memberId": "Z9C3CC",
        "confirmed": false,
        "present": true
      },
      {
        "role": "Guitarra",
        "memberId": "CP6IPB",
        "confirmed": false,
        "present": true
      },
      {
        "role": "Baixo",
        "memberId": "AKLL6T",
        "confirmed": false,
        "present": true
      },
      {
        "role": "Bateria",
        "memberId": "PKNF87",
        "confirmed": false,
        "present": true
      }
    ],
    "songs": [
      {
        "id": "X70FKQ",
        "key": "C",
        "confirmed": true
      },
      {
        "id": "UOIKNZ",
        "key": "C",
        "confirmed": true
      },
      {
        "id": "66CVIF",
        "key": "A",
        "confirmed": true
      },
      {
        "id": "0D5QP0",
        "key": "A",
        "confirmed": true
      },
      {
        "id": "0QJL8Y",
        "key": "A",
        "confirmed": false
      }
    ],
    "leaderIds": [
      "Z9C3CC",
      "7FUW2H"
    ],
    "vocalIds": [
      "X17RHN",
      "DKSUWB",
      "QL783O",
      "VDANAH",
      "8ZRVW2"
    ],
    "confirmed": true,
    "observations": "Culto de abertura da Assembleia da Associação Batista Fluminense",
    "attendanceMarked": true
  },
  {
    "id": "LSQ35O",
    "date": "2026-04-05",
    "serviceType": "Domingo/semana",
    "members": [
      "Z9C3CC",
      "8ZRVW2",
      "VDANAH",
      "DKSUWB",
      "24BWIX",
      "GGOR98",
      "MPSD03"
    ],
    "assignments": [
      {
        "role": "Vocal Líder",
        "memberId": "Z9C3CC",
        "confirmed": false,
        "present": true
      },
      {
        "role": "Vocal",
        "memberId": "8ZRVW2",
        "confirmed": false,
        "present": true
      },
      {
        "role": "Vocal",
        "memberId": "VDANAH",
        "confirmed": false,
        "present": true
      },
      {
        "role": "Vocal",
        "memberId": "DKSUWB",
        "confirmed": false,
        "present": true
      },
      {
        "role": "Teclado",
        "memberId": "24BWIX",
        "confirmed": false,
        "present": true
      },
      {
        "role": "Violão",
        "memberId": "Z9C3CC",
        "confirmed": false,
        "present": true
      },
      {
        "role": "Baixo",
        "memberId": "GGOR98",
        "confirmed": false,
        "present": true
      },
      {
        "role": "Bateria",
        "memberId": "MPSD03",
        "confirmed": false,
        "present": true
      }
    ],
    "songs": [
      {
        "id": "EP03CF",
        "key": "A",
        "confirmed": true
      },
      {
        "id": "EHGMV3",
        "key": "A",
        "confirmed": true
      },
      {
        "id": "2AGFHL",
        "key": "A",
        "confirmed": true
      },
      {
        "id": "RNKUFM",
        "key": "A",
        "confirmed": true
      },
      {
        "id": "DEA0E3",
        "key": "A",
        "confirmed": true
      },
      {
        "id": "0EIXEW",
        "key": "A",
        "confirmed": true
      },
      {
        "id": "JE0OWN",
        "key": "C",
        "confirmed": true
      },
      {
        "id": "RJSGB6",
        "key": "D",
        "confirmed": false
      }
    ],
    "leaderIds": [
      "Z9C3CC"
    ],
    "vocalIds": [
      "8ZRVW2",
      "VDANAH",
      "DKSUWB"
    ],
    "confirmed": true,
    "observations": "Durante o louvor a caixa do baixo apresentou problema.\nda música 1 à 6 foi um Medley",
    "attendanceMarked": true
  },
  {
    "id": "SM3MOE",
    "date": "2026-03-29",
    "serviceType": "Domingo",
    "members": [
      "GGOR98",
      "DKSUWB",
      "VDANAH",
      "8ZRVW2",
      "24BWIX",
      "Z9C3CC",
      "MPSD03"
    ],
    "assignments": [
      {
        "role": "Vocal Líder",
        "memberId": "GGOR98",
        "confirmed": false,
        "present": true
      },
      {
        "role": "Vocal",
        "memberId": "DKSUWB",
        "confirmed": false,
        "present": true
      },
      {
        "role": "Vocal",
        "memberId": "VDANAH",
        "confirmed": false,
        "present": true
      },
      {
        "role": "Vocal",
        "memberId": "8ZRVW2",
        "confirmed": false,
        "present": true
      },
      {
        "role": "Teclado",
        "memberId": "24BWIX",
        "confirmed": false,
        "present": true
      },
      {
        "role": "Violão",
        "memberId": "GGOR98",
        "confirmed": false,
        "present": true
      },
      {
        "role": "Baixo",
        "memberId": "Z9C3CC",
        "confirmed": false,
        "present": true
      },
      {
        "role": "Bateria",
        "memberId": "MPSD03",
        "confirmed": false,
        "present": true
      }
    ],
    "songs": [
      {
        "id": "K96TBB",
        "key": "A",
        "confirmed": true
      },
      {
        "id": "UOIKNZ",
        "key": "G",
        "confirmed": true
      },
      {
        "id": "K4H8QM",
        "key": "A",
        "confirmed": true
      }
    ],
    "leaderIds": [
      "GGOR98"
    ],
    "vocalIds": [
      "DKSUWB",
      "VDANAH",
      "8ZRVW2"
    ],
    "confirmed": true,
    "observations": "Negão tocou bateria a pedido de André ",
    "attendanceMarked": true
  },
  {
    "id": "F90CBV",
    "date": "2026-03-22",
    "serviceType": "Domingo",
    "members": [
      "ZUSMHY",
      "7PC6VT",
      "6RXLI2",
      "7FUW2H",
      "24BWIX",
      "Z9C3CC",
      "GGOR98",
      "PKNF87"
    ],
    "assignments": [
      {
        "role": "Vocal Líder",
        "memberId": "ZUSMHY",
        "confirmed": false,
        "present": true
      },
      {
        "role": "Vocal",
        "memberId": "7PC6VT",
        "confirmed": false,
        "present": true
      },
      {
        "role": "Vocal",
        "memberId": "6RXLI2",
        "confirmed": false,
        "present": true
      },
      {
        "role": "Vocal",
        "memberId": "7FUW2H",
        "confirmed": false,
        "present": true
      },
      {
        "role": "Teclado",
        "memberId": "24BWIX",
        "confirmed": false,
        "present": true
      },
      {
        "role": "Violão",
        "memberId": "Z9C3CC",
        "confirmed": false,
        "present": true
      },
      {
        "role": "Baixo",
        "memberId": "GGOR98",
        "confirmed": false,
        "present": false
      },
      {
        "role": "Bateria",
        "memberId": "PKNF87",
        "confirmed": false,
        "present": true
      }
    ],
    "songs": [
      {
        "id": "FQJ5SE",
        "key": "E",
        "confirmed": true
      },
      {
        "id": "K4H8QM",
        "key": "A",
        "confirmed": true
      }
    ],
    "leaderIds": [
      "ZUSMHY"
    ],
    "vocalIds": [
      "7PC6VT",
      "6RXLI2",
      "7FUW2H"
    ],
    "confirmed": true,
    "observations": "",
    "attendanceMarked": true
  },
  {
    "id": "DZMUZR",
    "date": "2026-03-15",
    "serviceType": "Domingo",
    "members": [
      "X17RHN",
      "GGOR98",
      "8ZRVW2",
      "DKSUWB",
      "QL783O",
      "24BWIX",
      "MPSD03"
    ],
    "assignments": [
      {
        "role": "Vocal Líder",
        "memberId": "X17RHN",
        "confirmed": false,
        "present": true
      },
      {
        "role": "Vocal Líder",
        "memberId": "GGOR98",
        "confirmed": false,
        "present": true
      },
      {
        "role": "Vocal",
        "memberId": "8ZRVW2",
        "confirmed": false,
        "present": true
      },
      {
        "role": "Vocal",
        "memberId": "DKSUWB",
        "confirmed": false,
        "present": true
      },
      {
        "role": "Vocal",
        "memberId": "QL783O",
        "confirmed": false,
        "present": true
      },
      {
        "role": "Teclado",
        "memberId": "24BWIX",
        "confirmed": false,
        "present": true
      },
      {
        "role": "Violão",
        "memberId": "GGOR98",
        "confirmed": false,
        "present": true
      },
      {
        "role": "Bateria",
        "memberId": "MPSD03",
        "confirmed": false,
        "present": true
      }
    ],
    "songs": [
      {
        "id": "K4H8QM",
        "key": "A",
        "confirmed": true
      },
      {
        "id": "2TQZZ5",
        "key": "G",
        "confirmed": true
      },
      {
        "id": "D2PY5Q",
        "key": "",
        "confirmed": true
      }
    ],
    "leaderIds": [
      "X17RHN",
      "GGOR98"
    ],
    "vocalIds": [
      "8ZRVW2",
      "DKSUWB",
      "QL783O"
    ],
    "confirmed": false,
    "observations": "",
    "attendanceMarked": true
  },
  {
    "id": "J8VEBE",
    "date": "2026-03-08",
    "serviceType": "Domingo",
    "members": [
      "Z9C3CC",
      "QL783O",
      "ZUSMHY",
      "7FUW2H",
      "24BWIX",
      "GGOR98",
      "PKNF87"
    ],
    "assignments": [
      {
        "role": "Vocal Líder",
        "memberId": "Z9C3CC",
        "confirmed": false,
        "present": true
      },
      {
        "role": "Vocal",
        "memberId": "QL783O",
        "confirmed": false,
        "present": true
      },
      {
        "role": "Vocal",
        "memberId": "ZUSMHY",
        "confirmed": false,
        "present": true
      },
      {
        "role": "Vocal",
        "memberId": "7FUW2H",
        "confirmed": false,
        "present": true
      },
      {
        "role": "Teclado",
        "memberId": "24BWIX",
        "confirmed": false,
        "present": true
      },
      {
        "role": "Violão",
        "memberId": "Z9C3CC",
        "confirmed": false,
        "present": true
      },
      {
        "role": "Baixo",
        "memberId": "GGOR98",
        "confirmed": false,
        "present": false
      },
      {
        "role": "Bateria",
        "memberId": "PKNF87",
        "confirmed": false,
        "present": true
      }
    ],
    "songs": [
      {
        "id": "9U33GC",
        "key": "B",
        "confirmed": true
      },
      {
        "id": "IEY0Z6",
        "key": "E",
        "confirmed": true
      },
      {
        "id": "B14ALL",
        "key": "C",
        "confirmed": true
      },
      {
        "id": "DEA5Q0",
        "key": "E",
        "confirmed": false
      },
      {
        "id": "K4H8QM",
        "key": "A",
        "confirmed": true
      }
    ],
    "leaderIds": [
      "Z9C3CC"
    ],
    "vocalIds": [
      "QL783O",
      "ZUSMHY",
      "7FUW2H"
    ],
    "confirmed": false,
    "observations": "",
    "attendanceMarked": true
  },
  {
    "id": "67LBUZ",
    "date": "2026-03-01",
    "serviceType": "Domingo",
    "members": [
      "7FUW2H",
      "X17RHN",
      "6RXLI2",
      "DKSUWB",
      "24BWIX",
      "Z9C3CC",
      "GGOR98",
      "MPSD03"
    ],
    "assignments": [
      {
        "role": "Vocal Líder",
        "memberId": "7FUW2H",
        "confirmed": true
      },
      {
        "role": "Vocal",
        "memberId": "X17RHN",
        "confirmed": true
      },
      {
        "role": "Vocal",
        "memberId": "6RXLI2",
        "confirmed": true
      },
      {
        "role": "Vocal",
        "memberId": "DKSUWB",
        "confirmed": true
      },
      {
        "role": "Teclado",
        "memberId": "24BWIX",
        "confirmed": true
      },
      {
        "role": "Violão",
        "memberId": "Z9C3CC",
        "confirmed": true
      },
      {
        "role": "Baixo",
        "memberId": "GGOR98",
        "confirmed": false
      },
      {
        "role": "Bateria",
        "memberId": "MPSD03",
        "confirmed": true
      }
    ],
    "songs": [
      {
        "id": "X3HING",
        "key": "A",
        "confirmed": true
      },
      {
        "id": "HMP9TK",
        "key": "G",
        "confirmed": true
      },
      {
        "id": "K4H8QM",
        "key": "A",
        "confirmed": true
      },
      {
        "id": "L4J3CL",
        "key": "D",
        "confirmed": true
      }
    ],
    "leaderIds": [
      "7FUW2H"
    ],
    "vocalIds": [
      "X17RHN",
      "6RXLI2",
      "DKSUWB"
    ],
    "confirmed": true,
    "observations": "",
    "attendanceMarked": false
  },
  {
    "id": "DSPQPV",
    "date": "2026-02-22",
    "serviceType": "Domingo",
    "members": [
      "GGOR98",
      "X17RHN",
      "QL783O",
      "8ZRVW2",
      "24BWIX",
      "6310A5",
      "PKNF87"
    ],
    "assignments": [
      {
        "role": "Vocal Líder",
        "memberId": "GGOR98",
        "present": true
      },
      {
        "role": "Vocal",
        "memberId": "X17RHN",
        "present": true
      },
      {
        "role": "Vocal",
        "memberId": "QL783O",
        "present": true
      },
      {
        "role": "Vocal",
        "memberId": "8ZRVW2",
        "present": true
      },
      {
        "role": "Teclado",
        "memberId": "24BWIX",
        "present": true
      },
      {
        "role": "Violão",
        "memberId": "GGOR98",
        "present": true
      },
      {
        "role": "Baixo",
        "memberId": "6310A5",
        "present": true
      },
      {
        "role": "Bateria",
        "memberId": "PKNF87",
        "present": true
      }
    ],
    "songs": [
      {
        "id": "RJSGB6",
        "key": "",
        "confirmed": true
      },
      {
        "id": "KZ8W4L",
        "key": "",
        "confirmed": true
      },
      {
        "id": "SEL47J",
        "key": "",
        "confirmed": true
      }
    ],
    "leaderIds": [
      "GGOR98"
    ],
    "vocalIds": [
      "X17RHN",
      "QL783O",
      "8ZRVW2"
    ],
    "confirmed": false,
    "observations": "",
    "attendanceMarked": true
  },
  {
    "id": "V88TTI",
    "date": "2026-02-15",
    "serviceType": "Domingo (Noite)",
    "members": [
      "DKSUWB",
      "GGOR98",
      "6RXLI2",
      "7PC6VT",
      "8ZRVW2",
      "24BWIX",
      "JLIN30"
    ],
    "assignments": [
      {
        "role": "Vocal Líder",
        "memberId": "DKSUWB",
        "present": true
      },
      {
        "role": "Vocal Líder",
        "memberId": "GGOR98",
        "present": true
      },
      {
        "role": "Vocal",
        "memberId": "6RXLI2"
      },
      {
        "role": "Vocal",
        "memberId": "7PC6VT",
        "present": false
      },
      {
        "role": "Vocal",
        "memberId": "8ZRVW2",
        "present": false
      },
      {
        "role": "Teclado",
        "memberId": "24BWIX",
        "present": true
      },
      {
        "role": "Violão",
        "memberId": "GGOR98",
        "present": true
      },
      {
        "role": "Bateria",
        "memberId": "JLIN30"
      }
    ],
    "songs": [],
    "leaderIds": [
      "DKSUWB",
      "GGOR98"
    ],
    "vocalIds": [
      "6RXLI2",
      "7PC6VT",
      "8ZRVW2"
    ],
    "confirmed": false,
    "observations": "",
    "attendanceMarked": true
  },
  {
    "id": "H0K3IY",
    "date": "2026-02-08",
    "serviceType": "Domingo (Noite)",
    "members": [
      "X17RHN",
      "DKSUWB",
      "QL783O",
      "ZUSMHY",
      "24BWIX",
      "Z9C3CC",
      "6310A5",
      "MPSD03"
    ],
    "assignments": [
      {
        "role": "Vocal Líder",
        "memberId": "X17RHN",
        "present": true
      },
      {
        "role": "Vocal",
        "memberId": "DKSUWB",
        "present": true
      },
      {
        "role": "Vocal",
        "memberId": "QL783O",
        "present": true
      },
      {
        "role": "Vocal",
        "memberId": "ZUSMHY",
        "present": true
      },
      {
        "role": "Teclado",
        "memberId": "24BWIX",
        "present": true
      },
      {
        "role": "Violão",
        "memberId": "Z9C3CC",
        "present": true
      },
      {
        "role": "Baixo",
        "memberId": "6310A5",
        "present": true
      },
      {
        "role": "Bateria",
        "memberId": "MPSD03",
        "present": true
      }
    ],
    "songs": [
      {
        "id": "SHWW6N",
        "key": "A",
        "confirmed": true
      },
      {
        "id": "F4KACW",
        "key": "B",
        "confirmed": true
      },
      {
        "id": "SGE3P0",
        "key": "B",
        "confirmed": true
      },
      {
        "id": "UOIKNZ",
        "key": "D",
        "confirmed": true
      }
    ],
    "leaderIds": [
      "X17RHN"
    ],
    "vocalIds": [
      "DKSUWB",
      "QL783O",
      "ZUSMHY"
    ],
    "confirmed": false,
    "observations": "",
    "attendanceMarked": true
  },
  {
    "id": "EERDP3",
    "date": "2026-02-01",
    "serviceType": "Domingo (Noite)",
    "members": [
      "Z9C3CC",
      "7FUW2H",
      "7PC6VT",
      "8ZRVW2",
      "GGOR98",
      "PKNF87"
    ],
    "assignments": [
      {
        "role": "Vocal Líder",
        "memberId": "Z9C3CC",
        "present": true
      },
      {
        "role": "Vocal Líder",
        "memberId": "7FUW2H",
        "present": true
      },
      {
        "role": "Vocal",
        "memberId": "7PC6VT",
        "present": true
      },
      {
        "role": "Vocal",
        "memberId": "8ZRVW2",
        "present": true
      },
      {
        "role": "Teclado",
        "memberId": "Z9C3CC",
        "present": true
      },
      {
        "role": "Baixo",
        "memberId": "GGOR98",
        "present": true
      },
      {
        "role": "Bateria",
        "memberId": "PKNF87",
        "present": true
      }
    ],
    "songs": [
      {
        "id": "UOIKNZ",
        "key": "E",
        "confirmed": true
      },
      {
        "id": "KAXQJY",
        "key": "A",
        "confirmed": true
      },
      {
        "id": "8QHR60",
        "key": "A",
        "confirmed": true
      },
      {
        "id": "SQRZT6",
        "key": "D",
        "confirmed": true
      }
    ],
    "leaderIds": [
      "Z9C3CC",
      "7FUW2H"
    ],
    "vocalIds": [
      "7PC6VT",
      "8ZRVW2"
    ],
    "confirmed": false,
    "observations": "",
    "attendanceMarked": true
  },
  {
    "id": "358QP4",
    "date": "2026-01-25",
    "serviceType": "Domingo (Noite)",
    "members": [
      "GGOR98",
      "QL783O",
      "6RXLI2",
      "X17RHN",
      "GGOR98",
      "6310A5",
      "PKNF87"
    ],
    "assignments": [
      {
        "role": "Vocal Líder",
        "memberId": "GGOR98",
        "present": true
      },
      {
        "role": "Vocal",
        "memberId": "QL783O",
        "present": true
      },
      {
        "role": "Vocal",
        "memberId": "6RXLI2",
        "present": true
      },
      {
        "role": "Vocal",
        "memberId": "X17RHN",
        "present": true
      },
      {
        "role": "Violão",
        "memberId": "GGOR98",
        "present": true
      },
      {
        "role": "Baixo",
        "memberId": "6310A5",
        "present": true
      },
      {
        "role": "Bateria",
        "memberId": "PKNF87",
        "present": true
      }
    ],
    "songs": [
      {
        "id": "0D5QP0",
        "key": "",
        "confirmed": true
      },
      {
        "id": "9U33GC",
        "key": "",
        "confirmed": true
      }
    ],
    "leaderIds": [
      "GGOR98"
    ],
    "vocalIds": [
      "QL783O",
      "6RXLI2",
      "X17RHN"
    ],
    "confirmed": false,
    "observations": "",
    "attendanceMarked": true
  },
  {
    "id": "IOML32",
    "date": "2026-01-18",
    "serviceType": "Domingo (Noite)",
    "members": [
      "7FUW2H",
      "DKSUWB",
      "6RXLI2",
      "QL783O",
      "24BWIX",
      "Z9C3CC",
      "6310A5",
      "MPSD03"
    ],
    "assignments": [
      {
        "role": "Vocal Líder",
        "memberId": "7FUW2H",
        "present": true
      },
      {
        "role": "Vocal",
        "memberId": "DKSUWB",
        "present": true
      },
      {
        "role": "Vocal",
        "memberId": "6RXLI2",
        "present": true
      },
      {
        "role": "Vocal",
        "memberId": "QL783O",
        "present": true
      },
      {
        "role": "Teclado",
        "memberId": "24BWIX",
        "present": true
      },
      {
        "role": "Violão",
        "memberId": "Z9C3CC",
        "present": true
      },
      {
        "role": "Baixo",
        "memberId": "6310A5",
        "present": true
      },
      {
        "role": "Bateria",
        "memberId": "MPSD03",
        "present": true
      }
    ],
    "songs": [
      {
        "id": "FQJ5SE",
        "key": "",
        "confirmed": true
      },
      {
        "id": "KAXQJY",
        "key": "",
        "confirmed": true
      },
      {
        "id": "IEY0Z6",
        "key": "",
        "confirmed": true
      },
      {
        "id": "BCXRHQ",
        "key": "",
        "confirmed": true
      }
    ],
    "leaderIds": [
      "7FUW2H"
    ],
    "vocalIds": [
      "DKSUWB",
      "6RXLI2",
      "QL783O"
    ],
    "confirmed": false,
    "observations": "",
    "attendanceMarked": true
  },
  {
    "id": "30RGTJ",
    "date": "2026-01-11",
    "serviceType": "Domingo (Noite)",
    "members": [
      "Z9C3CC",
      "QL783O",
      "X17RHN",
      "7PC6VT",
      "24BWIX",
      "Z9C3CC",
      "GGOR98"
    ],
    "assignments": [
      {
        "role": "Vocal Líder",
        "memberId": "Z9C3CC",
        "present": true
      },
      {
        "role": "Vocal",
        "memberId": "QL783O",
        "confirmed": false,
        "present": true
      },
      {
        "role": "Vocal",
        "memberId": "X17RHN",
        "confirmed": false,
        "present": true
      },
      {
        "role": "Vocal",
        "memberId": "7PC6VT",
        "confirmed": false,
        "present": true
      },
      {
        "role": "Teclado",
        "memberId": "24BWIX",
        "present": true
      },
      {
        "role": "Violão",
        "memberId": "Z9C3CC",
        "present": true
      },
      {
        "role": "Baixo",
        "memberId": "GGOR98",
        "present": true
      }
    ],
    "songs": [
      {
        "id": "IK6N78",
        "key": "",
        "confirmed": true
      },
      {
        "id": "KH9MOS",
        "key": "",
        "confirmed": true
      },
      {
        "id": "K8YBOJ",
        "key": "",
        "confirmed": true
      }
    ],
    "leaderIds": [
      "Z9C3CC"
    ],
    "vocalIds": [
      "QL783O",
      "X17RHN",
      "7PC6VT"
    ],
    "confirmed": false,
    "observations": "",
    "attendanceMarked": true
  }
];

export const DEFAULT_STYLES: LookStyle[] = [];

export const DEFAULT_NOTES: RehearsalNote[] = [
  {
    "id": "note-1784840106568",
    "title": "Músicas para ensaiarmos",
    "category": "rehearsal",
    "content": "",
    "songIds": [
      "3YNRCF",
      "KM7JU9",
      "ILL3BB",
      "RFVZHL"
    ],
    "items": [],
    "pinned": true,
    "createdAt": "2026-07-23"
  }
];

export const DEFAULT_EVENTS: ExternalEvent[] = [
  {
    "id": "H2EMJ3",
    "title": "Pib Nova Marilia",
    "date": "2026-10-03",
    "time": "19:30",
    "location": "Nova Marília ",
    "description": "",
    "status": "confirmed",
    "repertoire": [
      "UOIKNZ",
      "IEY0Z6",
      "J8R71U"
    ],
    "memberIds": [
      "24BWIX",
      "PKNF87",
      "7FUW2H",
      "DKSUWB",
      "X17RHN",
      "8ZRVW2",
      "VDANAH"
    ]
  },
  {
    "id": "M9C3SA",
    "title": "Vigília Mês Adolescentes",
    "date": "2026-08-07",
    "time": "22:00",
    "location": "PIBJE",
    "description": "",
    "status": "confirmed",
    "repertoire": [
      "KH9MOS",
      "K8YBOJ",
      "SHWW6N",
      "SEL47J",
      "2TQZZ5",
      "EHGMV3",
      "66CVIF",
      "CJHTY6"
    ],
    "memberIds": []
  },
  {
    "id": "Q5ED11",
    "title": "Assembleia da associação Batista Fluminense ",
    "date": "2026-04-09",
    "time": "19:30",
    "location": "PIB Surui ",
    "description": "",
    "status": "confirmed",
    "repertoire": [],
    "memberIds": []
  }
];

export const DEFAULT_ANNOUNCEMENTS = "";

export const DEFAULT_ATTENDANCE_EVENTS: AttendanceEvent[] = [];
