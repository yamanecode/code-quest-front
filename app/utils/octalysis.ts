// The 8 core drives of Octalysis (Chou) as CodeQuest uses them, and the geometry of the octagon
// drawn on the landing page. Pure data and maths, no DOM. The cores are placed as in the official
// Octalysis diagram: 1 on top, 2 and 3 above, 4 and 5 on the sides, 6 and 7 below, 8 at the bottom.

export type Hat = 'white' | 'black' | 'neutral'
export type Motivation = 'intrinsic' | 'extrinsic'

// One element of the platform and the Chou technique it applies (spec §5, Octalysis column).
// A core CodeQuest leaves out has one use with no technique, saying why.
export interface CoreUse {
  text: string
  technique: string | null
}

export interface Core {
  number: number
  name: string
  short: string
  hat: Hat
  motivation: Motivation | null // cores 1 and 8 are not placed on either side
  meaning: string
  uses: CoreUse[]
}

// How many elements of the platform apply the drive: the uses that name a technique (0 when the
// only entry says why the core is not used). The octagon draws this count on a scale from 0 to
// SCALE_MAX.
export function elementCount(core: Core): number {
  return core.uses.filter((use) => use.technique !== null).length
}

export const HAT_LABEL: Record<Hat, string> = {
  white: 'Chapéu branco',
  black: 'Chapéu preto',
  neutral: 'Neutro',
}

export const MOTIVATION_LABEL: Record<Motivation, string> = {
  intrinsic: 'Motivação intrínseca',
  extrinsic: 'Motivação extrínseca',
}

export const MOTIVATION_NOTE: Record<Motivation, string> = {
  intrinsic: 'A pessoa age porque a própria atividade é interessante ou prazerosa, sem esperar nada em troca.',
  extrinsic: 'A pessoa age para ganhar algo de fora da atividade, como pontos, uma coleção ou um prazo a cumprir.',
}

// Groups of cores the landing page explains with a card (hover, focus or click on the tag).
export type TermKey = Hat | 'left' | 'right'

export const TERM_LABEL: Record<TermKey, string> = {
  white: 'Chapéu branco',
  black: 'Chapéu preto',
  neutral: 'Neutro',
  left: 'Cérebro esquerdo',
  right: 'Cérebro direito',
}

export const TERM_NOTE: Record<TermKey, string> = {
  white: 'Impulsos 1, 2 e 3. Motivam pelo prazer de avançar, criar e dar sentido ao que se faz, e deixam a pessoa com sensação de controle.',
  black: 'Impulsos 6, 7 e 8. Motivam pela urgência, pela curiosidade que incomoda ou pelo medo de perder. Funcionam, mas podem causar ansiedade: o CodeQuest usa o 6 e o 7 de forma pontual e não usa o 8.',
  neutral: 'Impulsos 4 e 5. Podem agir como chapéu branco ou preto, conforme o uso: colecionar por prazer motiva, colecionar por medo de perder pressiona.',
  left: 'Impulsos 2, 4 e 6, ligados à lógica, à posse e a metas. São motivadores extrínsecos: a pessoa age para ganhar algo.',
  right: 'Impulsos 3, 5 e 7, ligados à criatividade, ao convívio e à curiosidade. São motivadores intrínsecos: a própria atividade já recompensa.',
}

export const CORES: readonly Core[] = [
  {
    number: 1, name: 'Significado épico e chamado', short: 'Significado', hat: 'white', motivation: null,
    meaning: 'A sensação de fazer parte de algo maior do que você.',
    uses: [
      { text: 'Não usado: o CodeQuest não tem história, missão épica nem "chamado". A página inicial só diz para que servem as quatro habilidades.', technique: null },
    ],
  },
  {
    number: 2, name: 'Desenvolvimento e realização', short: 'Realização', hat: 'white', motivation: 'extrinsic',
    meaning: 'A vontade de progredir, ficar melhor e mostrar o que conquistou.',
    uses: [
      { text: 'XP no primeiro acerto, nível a cada 30 XP e título por faixa, de Iniciante a Mestre.', technique: 'Status Points' },
      { text: 'Insígnias de bronze, prata e ouro, sempre ao lado do XP e do nível.', technique: 'Achievement Symbols' },
      { text: 'Barras de progresso do nível, das missões e da meta da turma.', technique: 'Progress Bar' },
      { text: 'Botão Dica e cartão Continuar, que apontam o próximo passo e reforçam a sensação de competência.', technique: 'Glowing Choice' },
    ],
  },
  {
    number: 3, name: 'Empoderamento da criatividade e feedback', short: 'Criatividade', hat: 'white', motivation: 'intrinsic',
    meaning: 'O prazer de testar caminhos e ver o resultado na hora.',
    uses: [
      { text: 'Missões sem ordem fixa: qualquer desafio pode ser aberto.', technique: 'Plant Picker (Meaningful Choices)' },
      { text: 'Resposta corrigida na hora, com tentativas ilimitadas.', technique: 'Instant Feedback' },
    ],
  },
  {
    number: 4, name: 'Propriedade e posse', short: 'Posse', hat: 'neutral', motivation: 'extrinsic',
    meaning: 'O apego ao que é seu e a vontade de completar uma coleção.',
    uses: [
      { text: 'Coleção de 26 insígnias em famílias: uma por habilidade, nível, missões e acertos de primeira.', technique: 'Collection Sets' },
      { text: 'Perfil com o progresso em cada habilidade.', technique: 'Monitor Attachment' },
    ],
  },
  {
    number: 5, name: 'Influência social e pertencimento', short: 'Social', hat: 'neutral', motivation: 'intrinsic',
    meaning: 'A motivação que vem dos outros: colaborar, comparar-se e ser reconhecido.',
    uses: [
      { text: 'Ranking semanal e mensal que mostra só a sua posição e as mais próximas.', technique: 'Leaderboard' },
      { text: 'Meta semanal da turma, alcançada em conjunto e sem chat.', technique: 'Group Quests' },
      { text: 'Perfil público opcional, desligado no início, com nível, título e insígnias.', technique: 'Trophy Shelves' },
    ],
  },
  {
    number: 6, name: 'Escassez e impaciência', short: 'Escassez', hat: 'black', motivation: 'extrinsic',
    meaning: 'Querer algo que ainda não se pode ter.',
    uses: [
      { text: 'As insígnias que faltam ficam visíveis no perfil, com a condição para ganhar; as de ouro avisam que pedem desafios de turma.', technique: 'Dangling' },
    ],
  },
  {
    number: 7, name: 'Imprevisibilidade e curiosidade', short: 'Curiosidade', hat: 'black', motivation: 'intrinsic',
    meaning: 'A curiosidade pelo que ainda não se sabe.',
    uses: [
      { text: 'Três insígnias secretas, reveladas só quando conquistadas.', technique: 'Easter Eggs' },
      { text: 'Botão Dica e cartão Continuar, que conduzem o estudante na direção certa quando ele não sabe por onde seguir.', technique: 'Glowing Choice' },
    ],
  },
  {
    number: 8, name: 'Perda e prevenção', short: 'Perda', hat: 'black', motivation: null,
    meaning: 'Agir para não perder algo que já se tem.',
    uses: [
      { text: 'Não usado. Sem vidas, sem perda de XP, sem contagem de dias seguidos e sem ranking de todos os tempos: errar ou passar uns dias fora não tira nada do estudante.', technique: null },
    ],
  },
]

// Top of the octagon's scale: the largest number of elements any core has, so the fullest core
// reaches the outer edge.
export const SCALE_MAX = Math.max(...CORES.map(elementCount))

export type Point = [number, number]

// The octagon is drawn in a square of VIEW_SIZE units, centred, with a corner pointing up as in the
// official diagram. Each core owns the corner at its angle and the two half-sides next to it.
export const VIEW_SIZE = 480
export const CENTRE: Point = [VIEW_SIZE / 2, VIEW_SIZE / 2]
const RADIUS = 185 // centre to corner
const APOTHEM = RADIUS * Math.cos(Math.PI / 8) // centre to the middle of a side

// Angle of each core, clockwise from the top, in the order of the official diagram.
const CORE_ANGLE: Record<number, number> = { 1: 0, 3: 45, 5: 90, 7: 135, 8: 180, 6: 225, 4: 270, 2: 315 }

function pointAt(radius: number, degrees: number): Point {
  const angle = (degrees * Math.PI) / 180
  return [CENTRE[0] + radius * Math.sin(angle), CENTRE[1] - radius * Math.cos(angle)]
}

// Quadrilateral of one core: the centre, the middle of the side before its corner, the corner and
// the middle of the side after it, all pulled toward the centre by `scale` (0 to 1).
export function wedgePoints(coreNumber: number, scale: number): [Point, Point, Point, Point] {
  const angle = CORE_ANGLE[coreNumber]!
  return [
    CENTRE,
    pointAt(APOTHEM * scale, angle - 22.5),
    pointAt(RADIUS * scale, angle),
    pointAt(APOTHEM * scale, angle + 22.5),
  ]
}

// The 8 corners of the octagon at `scale` of its full size.
export function ringPoints(scale: number): Point[] {
  return Array.from({ length: 8 }, (_, k) => pointAt(RADIUS * scale, k * 45))
}

// Where the dividing lines between cores end: the middle of each side.
export function spokePoints(): Point[] {
  return Array.from({ length: 8 }, (_, k) => pointAt(APOTHEM, k * 45 + 22.5))
}

// Where the numbered disc of a core sits, just outside its corner.
export function badgePoint(coreNumber: number): Point {
  return pointAt(RADIUS * 1.14, CORE_ANGLE[coreNumber]!)
}

// Cores that belong to a term: a hat, or a side of the brain (extrinsic = left, intrinsic = right).
export function coresOfTerm(term: TermKey): number[] {
  return CORES.filter((c) =>
    term === 'left' ? c.motivation === 'extrinsic'
      : term === 'right' ? c.motivation === 'intrinsic'
        : c.hat === term,
  ).map((c) => c.number)
}

// Value of an SVG `points` attribute.
export function toPoints(points: readonly Point[]): string {
  return points.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
}
