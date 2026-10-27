// The 8 core drives of Octalysis (Chou) as CodeQuest uses them, and the geometry of the octagon
// drawn on the landing page. Pure data and maths, no DOM. Core 1 sits on top and the numbers
// run clockwise.

export type Hat = 'white' | 'black' | 'neutral'
export type Motivation = 'intrinsic' | 'extrinsic'

export interface Core {
  number: number
  name: string
  short: string
  hat: Hat
  motivation: Motivation | null // cores 1 and 8 are not placed on either side
  meaning: string
  uses: string[]
  // How much CodeQuest relies on the drive, from 1 to 5. Confirm against the table of thesis chapter 2.2.
  intensity: 1 | 2 | 3 | 4 | 5
}

export const HAT_LABEL: Record<Hat, string> = {
  white: 'Chapéu branco',
  black: 'Chapéu preto',
  neutral: 'Neutro',
}

export const HAT_NOTE: Record<Hat, string> = {
  white: 'motiva pelo prazer de avançar e criar.',
  black: 'motiva pela urgência. Usado com moderação.',
  neutral: 'pode puxar para um lado ou para o outro, conforme o uso.',
}

export const MOTIVATION_LABEL: Record<Motivation, string> = {
  intrinsic: 'Motivação intrínseca',
  extrinsic: 'Motivação extrínseca',
}

export const CORES: readonly Core[] = [
  {
    number: 1, name: 'Significado épico e chamado', short: 'Significado', hat: 'white', motivation: null, intensity: 2,
    meaning: 'A sensação de fazer parte de algo maior do que você.',
    uses: [
      'A frase de propósito: treinar as quatro habilidades do pensamento computacional.',
      'A página de ajuda explica para que serve cada habilidade.',
    ],
  },
  {
    number: 2, name: 'Desenvolvimento e realização', short: 'Realização', hat: 'white', motivation: 'extrinsic', intensity: 5,
    meaning: 'A vontade de progredir, ficar melhor e mostrar o que conquistou.',
    uses: [
      'XP, nível e título, de Aprendiz a Mestre do pensamento.',
      'Insígnias de bronze, prata e ouro, sempre ao lado do XP e do nível.',
    ],
  },
  {
    number: 3, name: 'Empoderamento da criatividade e feedback', short: 'Criatividade', hat: 'white', motivation: 'intrinsic', intensity: 4,
    meaning: 'O prazer de testar caminhos e ver o resultado na hora.',
    uses: [
      'Missões sem ordem fixa: qualquer desafio pode ser aberto.',
      'Resposta corrigida na hora e tentativas ilimitadas.',
      'Dicas que guiam o raciocínio sem entregar a solução.',
    ],
  },
  {
    number: 4, name: 'Propriedade e posse', short: 'Posse', hat: 'neutral', motivation: 'extrinsic', intensity: 3,
    meaning: 'O apego ao que é seu e a vontade de completar uma coleção.',
    uses: [
      'Coleção de 30 insígnias, com as que faltam visíveis junto da condição para ganhar.',
      'Perfil com o progresso em cada habilidade.',
    ],
  },
  {
    number: 5, name: 'Influência social e pertencimento', short: 'Social', hat: 'neutral', motivation: 'intrinsic', intensity: 3,
    meaning: 'A motivação que vem dos outros: colaborar, comparar-se e ser reconhecido.',
    uses: [
      'Meta semanal da turma, alcançada em conjunto e sem chat.',
      'Ranking que mostra só a sua posição e as mais próximas.',
      'Perfil público opcional, desligado no início.',
    ],
  },
  {
    number: 6, name: 'Escassez e impaciência', short: 'Escassez', hat: 'black', motivation: 'extrinsic', intensity: 2,
    meaning: 'Querer algo porque é limitado ou só está disponível por um tempo.',
    uses: [
      'Um desafio diário escolhido para você.',
      'Rankings que recomeçam toda semana e todo mês.',
    ],
  },
  {
    number: 7, name: 'Imprevisibilidade e curiosidade', short: 'Curiosidade', hat: 'black', motivation: 'intrinsic', intensity: 2,
    meaning: 'A curiosidade pelo que ainda não se sabe.',
    uses: [
      'Insígnias secretas, reveladas só quando conquistadas.',
      'Mensagens de acerto e de erro que variam.',
    ],
  },
  {
    number: 8, name: 'Perda e prevenção', short: 'Perda', hat: 'black', motivation: null, intensity: 1,
    meaning: 'Agir para não perder algo que já se tem.',
    uses: [
      'Só a contagem de dias seguidos, que não dá XP.',
      'Sem vidas, sem perda de XP e sem ranking de todos os tempos.',
    ],
  },
]

export type Point = [number, number]

// The octagon is drawn in a square of VIEW_SIZE units, centred, with the flat side of each wedge
// facing outwards (APOTHEM is the distance from the centre to the middle of a side).
export const VIEW_SIZE = 480
export const CENTRE: Point = [VIEW_SIZE / 2, VIEW_SIZE / 2]
export const APOTHEM = 170
const CORNER_RADIUS = APOTHEM / Math.cos(Math.PI / 8)

function pointAt(radius: number, degrees: number): Point {
  const angle = (degrees * Math.PI) / 180
  return [CENTRE[0] + radius * Math.sin(angle), CENTRE[1] - radius * Math.cos(angle)]
}

function centreAngle(coreNumber: number): number {
  return (coreNumber - 1) * 45
}

// Triangle of one core: the centre and the two outer corners, pulled toward the centre by `scale` (0 to 1).
export function wedgePoints(coreNumber: number, scale: number): [Point, Point, Point] {
  const angle = centreAngle(coreNumber)
  return [CENTRE, pointAt(CORNER_RADIUS * scale, angle - 22.5), pointAt(CORNER_RADIUS * scale, angle + 22.5)]
}

// The 8 corners of the octagon at `scale` of its full size.
export function ringPoints(scale: number): Point[] {
  return Array.from({ length: 8 }, (_, k) => pointAt(CORNER_RADIUS * scale, k * 45 + 22.5))
}

// Where the numbered disc of a core sits, just outside the octagon.
export function badgePoint(coreNumber: number): Point {
  return pointAt(APOTHEM * 1.16, centreAngle(coreNumber))
}

// Value of an SVG `points` attribute.
export function toPoints(points: readonly Point[]): string {
  return points.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
}
