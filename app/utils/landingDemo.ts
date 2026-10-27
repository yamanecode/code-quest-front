// Demo challenges and hints of the landing page. They only run in the browser: nothing here
// calls the API, and the grading mirrors spec §4.3 and the XP rule of §5 for the demo only.

import type {
  Answer,
  ChallengeType,
  FilteringContent,
  GroupingContent,
  OrderingContent,
  PatternContent,
} from '~/types/challenge'

interface DemoBase {
  title: string
  statement: string
  hint: string // shown once, after the first wrong answer
  explanation: string
}

// Ids follow the student view of the API: renamed by the position shown (spec §4.2).
export type DemoChallenge = DemoBase &
  (
    | { type: 'ordering'; content: OrderingContent; solution: string[] }
    | { type: 'grouping'; content: GroupingContent; solution: Record<string, string> }
    | { type: 'filtering'; content: FilteringContent; solution: string[] }
    | { type: 'pattern'; content: PatternContent; solution: string }
  )

export const DEMO_CHALLENGES: readonly DemoChallenge[] = [
  {
    type: 'ordering',
    title: 'Trocar o pneu furado',
    statement:
      'O carro está parado em local seguro, com o pneu reserva ao lado. Coloque os passos na ordem em que precisam acontecer.',
    content: {
      items: [
        { id: 'a', text: 'Encaixar o pneu reserva' },
        { id: 'b', text: 'Levantar o carro com o macaco' },
        { id: 'c', text: 'Apertar os parafusos e baixar o carro' },
        { id: 'd', text: 'Afrouxar os parafusos da roda' },
        { id: 'e', text: 'Retirar a roda furada' },
      ],
    },
    solution: ['d', 'b', 'e', 'a', 'c'],
    hint: 'Pense em qual tarefa fica mais difícil quando a roda já está no ar. Em que momento ela deveria acontecer?',
    explanation:
      'Os parafusos são afrouxados com o carro ainda no chão, porque com a roda no ar ela giraria. Só depois o carro é levantado, e o resto segue a ordem natural.',
  },
  {
    type: 'grouping',
    title: 'Lançar uma loja virtual',
    statement:
      'Abrir uma loja na internet é um problema grande. Ele foi dividido em três partes. Escolha a parte a que cada tarefa pertence.',
    content: {
      groups: [
        { id: 'g1', text: 'Produtos' },
        { id: 'g2', text: 'Pagamento' },
        { id: 'g3', text: 'Entrega' },
      ],
      items: [
        { id: 'a', text: 'Calcular o frete por região' },
        { id: 'b', text: 'Fotografar e descrever cada produto' },
        { id: 'c', text: 'Configurar o parcelamento no cartão' },
        { id: 'd', text: 'Escolher a transportadora' },
        { id: 'e', text: 'Definir o preço de cada item' },
        { id: 'f', text: 'Escolher as formas de pagamento aceitas' },
      ],
    },
    solution: { a: 'g3', b: 'g1', c: 'g2', d: 'g3', e: 'g1', f: 'g2' },
    hint: 'Comece pelas tarefas mais fáceis de classificar. Qual delas só faz sentido em uma das partes?',
    explanation: 'Dividido em partes, o lançamento vira três problemas menores, que podem ser resolvidos separadamente.',
  },
  {
    type: 'filtering',
    title: 'Mapa do metrô',
    statement:
      'Uma cidade vai publicar um mapa simples do metrô para quem viaja pela primeira vez. Marque só o que o mapa precisa mostrar.',
    content: {
      question: 'O que o passageiro precisa ver para planejar a viagem?',
      items: [
        { id: 'a', text: 'A curva exata que o túnel faz entre duas estações' },
        { id: 'b', text: 'Quais estações ficam ligadas na mesma linha' },
        { id: 'c', text: 'O material com que cada túnel foi construído' },
        { id: 'd', text: 'O nome de cada estação' },
        { id: 'e', text: 'A profundidade de cada túnel' },
        { id: 'f', text: 'As estações onde é possível trocar de linha' },
      ],
    },
    solution: ['b', 'd', 'f'],
    hint: 'Pense no que o passageiro precisa decidir: onde entrar, onde trocar de linha e onde descer. O que ajuda nessa decisão?',
    explanation:
      'Para planejar o trajeto bastam as estações, como elas se ligam e onde trocar de linha. A forma real e a construção dos túneis são detalhes que o mapa pode ignorar.',
  },
  {
    type: 'pattern',
    title: 'Agenda de treinos',
    statement: 'Lia treina dia sim, dia não, e começou numa segunda-feira. Qual é o próximo dia de treino?',
    content: {
      sequence: ['Seg', 'Qua', 'Sex', 'Dom'],
      options: [
        { id: 'a', text: 'Segunda' },
        { id: 'b', text: 'Terça' },
        { id: 'c', text: 'Quarta' },
        { id: 'd', text: 'Sábado' },
      ],
    },
    solution: 'b',
    hint: 'Conte quantos dias há entre um treino e o seguinte. A regra continua igual depois do domingo?',
    explanation: 'A regra é treinar e folgar um dia. Depois do domingo vem a segunda, de folga, e então a terça.',
  },
]

export function demoChallenge(type: ChallengeType): DemoChallenge {
  return DEMO_CHALLENGES.find((c) => c.type === type)!
}

function sameList(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((value, index) => value === b[index])
}

function sameSet(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && new Set(a).size === a.length && a.every((value) => b.includes(value))
}

function sameAssignment(a: Record<string, string>, b: Record<string, string>): boolean {
  const keys = Object.keys(b)
  return Object.keys(a).length === keys.length && keys.every((key) => a[key] === b[key])
}

export function isDemoCorrect(challenge: DemoChallenge, answer: Answer): boolean {
  switch (challenge.type) {
    case 'ordering':
      return 'order' in answer && sameList(answer.order, challenge.solution)
    case 'grouping':
      return 'assignment' in answer && sameAssignment(answer.assignment, challenge.solution)
    case 'filtering':
      return 'selected' in answer && sameSet(answer.selected, challenge.solution)
    case 'pattern':
      return 'option' in answer && answer.option === challenge.solution
  }
}

// XP of the first correct answer by wrong answers before it (spec §5): 10, 5 for one or two, 2 after that.
export function demoXp(wrongBefore: number): number {
  if (wrongBefore === 0) return 10
  return wrongBefore <= 2 ? 5 : 2
}

// Canned hints for the hint-button demo, one for each level (spec §6.3). They are written by hand:
// the demo makes no call to the AI.
export const DEMO_HINTS: readonly string[] = [
  'Pense no que fica mais difícil de fazer com a roda já no ar. O que isso sugere sobre a ordem dos passos?',
  'Olhe para os parafusos da roda. Em que momento o carro está mais firme para afrouxá-los?',
  'Pense em abrir uma lata de tinta e pintar uma parede: você abre a lata antes de mexer a tinta, e mexe antes de pintar. Cada passo prepara o próximo. Aplique a mesma ideia à roda: o que prepara o quê?',
]

// The real wait comes from the server; the demo uses a short one so nobody waits long.
export const DEMO_COOLDOWN_SECONDS = 5
