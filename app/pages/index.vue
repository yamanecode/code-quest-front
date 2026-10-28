<script setup lang="ts">
import { CHALLENGE_TYPES, type ChallengeType } from '~/types/challenge'
import { SKILLS } from '~/utils/skills'

// Public landing page (spec §9.1). Logged-in users can open it too; the header then offers a link home.
definePageMeta({ layout: 'landing' })
useHead({ title: 'CodeQuest · Pensamento computacional' })

const MARK: Record<ChallengeType, string> = {
  ordering: 'cq-mark-ordering',
  grouping: 'cq-mark-grouping',
  filtering: 'cq-mark-filtering',
  pattern: 'cq-mark-pattern',
}
const SWATCH: Record<ChallengeType, string> = {
  ordering: 'bg-ordering',
  grouping: 'bg-grouping',
  filtering: 'bg-filtering',
  pattern: 'bg-pattern',
}
const WHAT_YOU_DO: Record<ChallengeType, string> = {
  ordering: 'No desafio: colocar os passos na ordem certa.',
  grouping: 'No desafio: ligar cada tarefa à parte do problema a que pertence.',
  filtering: 'No desafio: marcar só as informações necessárias para responder.',
  pattern: 'No desafio: descobrir a regra e escolher o próximo elemento.',
}

const XP_ROWS = [
  { when: 'Acertou de primeira', xp: 10 },
  { when: 'Acertou depois de 1 ou 2 erros', xp: 5 },
  { when: 'Acertou depois de 3 erros ou mais', xp: 2 },
]

const HINT_LEVELS = [
  { when: '1º pedido', what: 'Mostra o objetivo e por onde começar.' },
  { when: '2º pedido', what: 'Aponta a parte do problema que mais importa.' },
  { when: '3º em diante', what: 'Resolve um problema parecido, passo a passo, para você aplicar o mesmo raciocínio.' },
]

const FOR_PROFESSORS = [
  { title: 'Turma com código', text: 'Cada turma recebe um código de 6 caracteres. O estudante entra com ele, sai quando quiser e pode participar de várias turmas ao mesmo tempo.' },
  { title: 'Um editor para cada tipo', text: 'O formulário de cada tipo de desafio avisa na hora quando alguma regra não foi cumprida.' },
  { title: 'Revisão e rascunho com IA', text: 'A revisão sugere melhorias de clareza e nunca altera o desafio. O rascunho gerado fica guardado como rascunho até o professor revisar e publicar.' },
]

const PROTECTIONS = [
  'A conta tem só nome de usuário e senha: sem e-mail, nome real ou foto.',
  'Não há chat, comentários nem notificações.',
  'O perfil público começa desligado e mostra apenas nível, título e insígnias.',
  'Errar não tira nada: não há vidas nem perda de XP.',
  'Tempo de uso e entrar todo dia não dão XP.',
]

const sectionTitle = 'font-display text-3xl font-extrabold leading-tight sm:text-4xl'
const sectionWidth = 'mx-auto max-w-6xl px-4 sm:px-6'
</script>

<template>
  <div>
    <!-- Hero: the quote that states the idea, and a challenge to try right away -->
    <section :class="[sectionWidth, 'grid items-start gap-10 py-10 sm:py-14 lg:grid-cols-2 lg:gap-16']" aria-labelledby="hero-title">
      <div>
        <h1 id="hero-title" class="font-display text-3xl font-extrabold leading-[1.12] sm:text-4xl lg:text-5xl" data-testid="hero-quote">
          “Pensamento computacional é uma habilidade fundamental <span class="cq-mark cq-mark-in">para todos</span>, não apenas para cientistas da computação.”
        </h1>
        <p class="mt-3 text-sm text-label" data-testid="hero-source">
          Jeannette M. Wing, “Computational thinking”, Communications of the ACM, 2006. Tradução nossa.
        </p>
        <p class="mt-6 max-w-xl text-xl leading-relaxed text-muted">
          O CodeQuest é uma plataforma de desafios de lógica, sem programação, que une gamificação e um tutor de inteligência artificial. O tutor guia o raciocínio do estudante com dicas, mas nunca entrega a resposta.
        </p>
        <div class="mt-7 flex flex-wrap gap-x-4 gap-y-3">
          <NuxtLink
            to="/cadastro"
            class="inline-flex min-h-11 items-center bg-go px-6 py-3 font-display text-lg font-bold text-on-go transition-colors hover:bg-go-hover cq-go-shadow"
            data-testid="hero-signup"
          >Criar conta de estudante</NuxtLink>
          <NuxtLink to="/entrar" class="cq-btn-outline inline-flex items-center" data-testid="hero-login">Já tenho conta</NuxtLink>
        </div>
        <p class="mt-5 text-sm text-muted">Projeto de pesquisa do Trabalho de Conclusão de Curso em Engenharia da Computação, Facens.</p>
        <p class="mt-1 text-sm text-muted">Para criar a conta, basta um nome de usuário e uma senha. Não use seu nome real.</p>
      </div>

      <div class="relative min-w-0">
        <p class="cq-postit absolute -top-4 right-4 z-10 px-3 py-2 font-display text-sm font-bold">Experimente: um desafio de cada habilidade</p>
        <DemoChallenge />
      </div>
    </section>

    <!-- The project -->
    <section id="projeto" :class="[sectionWidth, 'py-12 sm:py-16']" aria-labelledby="projeto-title">
      <h2 id="projeto-title" :class="[sectionTitle, 'max-w-3xl']">Um problema de ensino e uma proposta para enfrentá-lo</h2>
      <div class="mt-8 grid gap-8 md:grid-cols-2 md:gap-16">
        <div>
          <h3 class="font-display text-2xl font-bold">O problema</h3>
          <p class="mt-2 max-w-prose leading-relaxed">Ensinar pensamento computacional ainda esbarra no pouco engajamento dos estudantes, na falta de recursos de apoio e na necessidade de abordagens mais interativas.</p>
        </div>
        <div>
          <h3 class="font-display text-2xl font-bold">A proposta</h3>
          <p class="mt-2 max-w-prose leading-relaxed">Combinar desafios estruturados, gamificação baseada em um modelo teórico e um tutor de IA que dá dicas guiadas sem revelar a resposta. O professor cria e publica os desafios; o estudante pratica no seu ritmo.</p>
        </div>
      </div>
      <p class="mt-8 max-w-prose bg-raised px-5 py-4" data-testid="landing-limits">
        O CodeQuest é um projeto acadêmico e não foi pensado como produto comercial. Ele tem limitações, descritas na
        <NuxtLink to="/limitacoes" class="font-bold text-ink underline underline-offset-4" data-testid="landing-limits-link">página de Limitações</NuxtLink>.
      </p>
    </section>

    <!-- The four skills, one ruled row each -->
    <section id="habilidades" :class="[sectionWidth, 'py-12 sm:py-16']" aria-labelledby="habilidades-title">
      <h2 id="habilidades-title" :class="[sectionTitle, 'max-w-3xl']">Quatro habilidades, um tipo de desafio para cada uma</h2>
      <p class="mt-3 max-w-prose text-lg text-muted">A habilidade está na estrutura do problema, não no assunto. Um desafio de ordenar passos pode falar de cozinha, de futebol ou da escola.</p>
      <ul class="mt-8 border-t-2 border-line-strong" aria-label="As 4 habilidades">
        <li
          v-for="type in CHALLENGE_TYPES"
          :key="type"
          class="grid gap-2 border-b border-line py-5 md:grid-cols-[minmax(0,18rem)_minmax(0,1fr)] md:gap-8"
          :data-testid="`landing-skill-${type}`"
        >
          <h3 class="flex items-baseline gap-2.5 font-display text-2xl font-bold">
            <i class="inline-block h-3.5 w-3.5 shrink-0 translate-y-px border-2 border-line-strong" :class="SWATCH[type]" aria-hidden="true" />
            <span class="cq-mark px-0.5 text-on-color" :class="MARK[type]">{{ SKILLS[type].label }}</span>
          </h3>
          <div>
            <p>{{ SKILLS[type].description }}</p>
            <p class="mt-1 font-bold text-ink">{{ WHAT_YOU_DO[type] }}</p>
          </div>
        </li>
      </ul>
    </section>

    <!-- A session in three steps, and the XP rule -->
    <section id="como-funciona" :class="[sectionWidth, 'py-12 sm:py-16']" aria-labelledby="como-title">
      <h2 id="como-title" :class="sectionTitle">Como uma sessão de estudo funciona</h2>
      <div class="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:items-start">
        <ol class="grid gap-6">
          <li class="grid grid-cols-[3rem_minmax(0,1fr)] gap-4">
            <span class="cq-num grid h-12 w-12 place-items-center border-2 border-line-strong bg-panel text-2xl font-extrabold text-ink" aria-hidden="true">1</span>
            <div>
              <h3 class="font-display text-xl font-bold">Escolha uma missão</h3>
              <p class="mt-1 max-w-prose">Uma missão é um conjunto de desafios sobre um mesmo tema. A Trilha CodeQuest reúne as missões que já vêm na plataforma, abertas a todos os estudantes. Se o seu professor criou uma turma, entre com o código de 6 caracteres para ver as missões dela. Dentro de uma missão, os desafios podem ser feitos em qualquer ordem.</p>
            </div>
          </li>
          <li class="grid grid-cols-[3rem_minmax(0,1fr)] gap-4">
            <span class="cq-num grid h-12 w-12 place-items-center border-2 border-line-strong bg-panel text-2xl font-extrabold text-ink" aria-hidden="true">2</span>
            <div>
              <h3 class="font-display text-xl font-bold">Resolva o desafio e ganhe XP</h3>
              <p class="mt-1 max-w-prose">Você pode tentar quantas vezes quiser. O XP é dado uma vez por desafio, no primeiro acerto, e fica um pouco menor se houve erros antes dele. XP nunca diminui.</p>
            </div>
          </li>
          <li class="grid grid-cols-[3rem_minmax(0,1fr)] gap-4">
            <span class="cq-num grid h-12 w-12 place-items-center border-2 border-line-strong bg-panel text-2xl font-extrabold text-ink" aria-hidden="true">3</span>
            <div>
              <h3 class="font-display text-xl font-bold">Peça uma dica se travar</h3>
              <p class="mt-1 max-w-prose">Aperte Dica e o tutor faz uma pergunta que ajuda a pensar. Cada novo pedido traz uma dica um pouco mais detalhada, com uma pequena espera entre um pedido e outro para dar tempo de tentar de novo. Nenhuma dica mostra a resposta.</p>
            </div>
          </li>
        </ol>
        <div class="cq-sheet grid gap-3 p-5" data-testid="landing-xp">
          <h3 class="font-display text-xl font-bold">Quanto XP vale um desafio</h3>
          <table class="w-full border-collapse">
            <caption class="pb-2 text-left text-sm text-muted">Dado só no primeiro acerto</caption>
            <tbody>
              <tr v-for="row in XP_ROWS" :key="row.xp" class="border-b border-line">
                <th scope="row" class="py-2 text-left font-normal text-soft">{{ row.when }}</th>
                <td class="cq-num whitespace-nowrap py-2 pl-4 text-right text-xl font-extrabold text-ink">{{ row.xp }} XP</td>
              </tr>
            </tbody>
          </table>
          <p class="text-sm text-muted">A cada 50 XP você sobe um nível e, de tempos em tempos, ganha um novo título. Dicas e dias seguidos de estudo não dão XP, e o desafio diário vale o mesmo que os outros.</p>
        </div>
      </div>
    </section>

    <!-- Octalysis -->
    <section id="octalysis" class="border-y-2 border-line-strong bg-raised py-12 sm:py-16" aria-labelledby="octalysis-title">
      <div :class="sectionWidth">
        <h2 id="octalysis-title" :class="[sectionTitle, 'max-w-3xl']">Cada recurso do jogo responde a um dos <span class="cq-mark">8 impulsos</span> do Octalysis</h2>
        <p class="mb-8 mt-3 max-w-prose text-lg text-muted">O Octalysis, modelo criado por Yu-kai Chou, organiza em oito impulsos o que leva as pessoas a continuarem uma atividade. No CodeQuest ele serve de critério: cada elemento do jogo precisa responder a um impulso, e o que pressiona demais, como vidas ou punição por erro, fica de fora. Escolha um impulso para ver como ele aparece na plataforma.</p>
        <OctalysisMap />
      </div>
    </section>

    <!-- AI tutor -->
    <section id="dicas" :class="[sectionWidth, 'grid items-start gap-10 py-12 sm:py-16 lg:grid-cols-2 lg:gap-14']" aria-labelledby="dicas-title">
      <div>
        <h2 id="dicas-title" :class="sectionTitle">Um tutor que pergunta em vez de responder</h2>
        <p class="mt-4 max-w-prose text-muted">O estudante não escreve para a IA: ele só aperta o botão Dica. Antes de aparecer, cada dica passa por uma verificação. Se ela revelar a solução, é descartada e substituída por uma dica de reserva.</p>
        <ul class="mt-5 grid gap-3" aria-label="Níveis das dicas">
          <li v-for="level in HINT_LEVELS" :key="level.when" class="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-3">
            <b class="font-display text-ink">{{ level.when }}</b>
            <span>{{ level.what }}</span>
          </li>
        </ul>
        <p class="mt-5 max-w-prose text-muted">Depois do primeiro erro em um desafio, uma dica aparece sozinha.</p>
        <p class="mt-3 max-w-prose text-muted" data-testid="landing-provider-note">As dicas dependem de um provedor de IA externo, que precisa ser escolhido e, para uso contínuo, pago. Sem a IA, a plataforma continua funcionando com dicas de reserva fixas.</p>
      </div>
      <HintDemo />
    </section>

    <!-- Professors -->
    <section id="professores" :class="[sectionWidth, 'py-12 sm:py-16']" aria-labelledby="prof-title">
      <h2 id="prof-title" :class="[sectionTitle, 'max-w-3xl']">Para o professor: criar, revisar e acompanhar</h2>
      <p class="mt-3 max-w-prose text-lg text-muted">O professor monta turmas, missões e desafios dos quatro tipos. A IA ajuda a revisar e a escrever rascunhos, mas só o professor publica.</p>
      <dl class="mt-8 border-t-2 border-line-strong">
        <div
          v-for="item in FOR_PROFESSORS"
          :key="item.title"
          class="grid gap-1 border-b border-line py-4 md:grid-cols-[minmax(0,18rem)_minmax(0,1fr)] md:gap-8"
        >
          <dt class="font-display text-xl font-bold text-ink">{{ item.title }}</dt>
          <dd class="max-w-prose">{{ item.text }}</dd>
        </div>
        <div class="grid gap-1 border-b border-line py-4 md:grid-cols-[minmax(0,18rem)_minmax(0,1fr)] md:gap-8">
          <dt class="font-display text-xl font-bold text-ink">Progresso da turma</dt>
          <dd class="max-w-prose">
            XP, desafios resolvidos e dicas usadas por estudante, o ranking completo e uma meta semanal que a turma cumpre junta, sem chat.
            <span class="mt-3 block max-w-sm">
              <ProgressBar
                :value="62"
                :max="100"
                tone="progress"
                :milestones="[25, 50, 75]"
                label="Exemplo de meta semanal da turma"
                value-text="62% concluída"
              />
            </span>
            <span class="mt-1 block text-sm text-muted">Exemplo de meta semanal, com marcas em 25, 50 e 75%.</span>
          </dd>
        </div>
      </dl>
    </section>

    <!-- Protections -->
    <section :class="[sectionWidth, 'grid gap-5 py-12 sm:py-16 md:grid-cols-[minmax(0,18rem)_minmax(0,1fr)] md:gap-16']" aria-labelledby="protecao-title">
      <h2 id="protecao-title" class="font-display text-2xl font-extrabold sm:text-3xl">Projetado para proteger o estudante</h2>
      <ul class="grid gap-3" data-testid="landing-protections">
        <li v-for="item in PROTECTIONS" :key="item" class="grid grid-cols-[1.5rem_minmax(0,1fr)] gap-2">
          <span class="font-extrabold text-success" aria-hidden="true">✓</span>
          <span>{{ item }}</span>
        </li>
      </ul>
    </section>

    <!-- Closing call to action -->
    <section :class="[sectionWidth, 'pb-12 sm:pb-16']" aria-labelledby="final-title">
      <div class="cq-sheet grid justify-items-start gap-4 p-6 sm:p-10">
        <h2 id="final-title" :class="sectionTitle">Comece pelo primeiro desafio</h2>
        <p class="max-w-prose text-muted">Crie a conta e abra a Trilha CodeQuest. O primeiro desafio é fácil de propósito, para você conhecer o jogo.</p>
        <div class="flex flex-wrap gap-x-4 gap-y-3">
          <NuxtLink
            to="/cadastro"
            class="inline-flex min-h-11 items-center bg-go px-6 py-3 font-display text-lg font-bold text-on-go transition-colors hover:bg-go-hover cq-go-shadow"
            data-testid="final-signup"
          >Criar conta de estudante</NuxtLink>
          <NuxtLink to="/entrar" class="cq-btn-outline inline-flex items-center" data-testid="final-login">Entrar</NuxtLink>
        </div>
      </div>
    </section>
  </div>
</template>
