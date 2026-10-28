<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { useAuthStore } from '~/stores/auth'
import type { ChallengeType } from '~/types/challenge'
import { LEVEL_BANDS } from '~/utils/levels'

definePageMeta({ layout: 'app', compactStats: true })
useHead({ title: 'Como funciona · CodeQuest' })

// Students see only the game rules; professors also see how to manage content.
const auth = useAuthStore()

const isProfessor = computed(() => auth.role === 'professor')

// Professors get two tabs so their guide is one click away; they open on it.
type HelpTab = 'game' | 'professor'
const TABS: { value: HelpTab; label: string }[] = [
  { value: 'professor', label: 'Para professores' },
  { value: 'game', label: 'Para alunos' },
]
const tab = ref<HelpTab>('professor')
const tabButtons = ref<HTMLButtonElement[]>([])
const showGame = computed(() => !isProfessor.value || tab.value === 'game')

// Arrow keys, Home and End move between the tabs (WAI-ARIA tabs pattern).
async function onTabKey(event: KeyboardEvent, index: number) {
  const last = TABS.length - 1
  const target = {
    ArrowRight: index === last ? 0 : index + 1,
    ArrowLeft: index === 0 ? last : index - 1,
    Home: 0,
    End: last,
  }[event.key]
  if (target === undefined) return
  event.preventDefault()
  tab.value = TABS[target]!.value
  await nextTick()
  tabButtons.value[target]?.focus()
}

const SKILL_ORDER: ChallengeType[] = ['ordering', 'grouping', 'filtering', 'pattern']

const XP_RULES = [
  { when: 'De primeira', xp: 10 },
  { when: 'Depois de 1 ou 2 erros', xp: 5 },
  { when: 'Depois de 3 erros ou mais', xp: 2 },
]

function levelRange(from: number, to: number | null) {
  if (to === null) return `${from} ou mais`
  return from === to ? `${from}` : `${from} a ${to}`
}
</script>

<template>
  <article class="max-w-2xl">
    <h1 class="font-display text-4xl font-extrabold">Como funciona</h1>

    <div
      v-if="isProfessor"
      role="tablist"
      aria-label="Seções da ajuda"
      class="mt-6 flex w-fit flex-wrap border-2 border-line-strong"
      data-testid="help-tabs"
    >
      <button
        v-for="(item, index) in TABS"
        :id="`help-tab-${item.value}`"
        :key="item.value"
        ref="tabButtons"
        type="button"
        role="tab"
        :aria-selected="tab === item.value ? 'true' : 'false'"
        :aria-controls="`help-panel-${item.value}`"
        :tabindex="tab === item.value ? 0 : -1"
        class="h-11 px-5 font-semibold transition-colors"
        :class="tab === item.value ? 'bg-ink text-bg' : 'text-muted hover:text-ink'"
        :data-testid="`help-tab-${item.value}`"
        @click="tab = item.value"
        @keydown="onTabKey($event, index)"
      >{{ item.label }}</button>
    </div>

    <div
      v-show="showGame"
      id="help-panel-game"
      :role="isProfessor ? 'tabpanel' : undefined"
      :aria-labelledby="isProfessor ? 'help-tab-game' : undefined"
      data-testid="help-game"
    >
    <p class="mt-3 text-lg leading-relaxed text-muted" :class="{ 'mt-6': isProfessor }">
      No CodeQuest você treina pensamento computacional com desafios de lógica, sem escrever código.
      Você resolve os desafios na ordem que quiser e pode tentar quantas vezes precisar.
    </p>

    <section class="mt-12" aria-labelledby="h-skills" data-testid="help-skills">
      <h2 id="h-skills" class="font-display text-2xl font-bold">As 4 habilidades</h2>
      <p class="mt-2 leading-relaxed text-muted">Cada tipo de desafio treina uma habilidade, e ela aparece em todo desafio.</p>
      <ul class="mt-5 grid gap-2 sm:grid-cols-2">
        <li v-for="type in SKILL_ORDER" :key="type">
          <SkillBlock :type="type" description class="h-full min-h-[8rem]" />
        </li>
      </ul>
    </section>

    <section class="mt-12" aria-labelledby="h-xp">
      <h2 id="h-xp" class="font-display text-2xl font-bold">XP</h2>
      <p class="mt-2 leading-relaxed">
        Você ganha XP só na primeira vez que acerta cada desafio. O valor depende de quantas vezes você errou antes.
        Errar nunca tira XP. Dicas, sequência de dias, desafio diário e meta da turma não dão XP.
      </p>
      <table class="mt-4 w-full max-w-md text-left">
        <caption class="sr-only">XP por desafio resolvido</caption>
        <thead class="text-sm text-muted">
          <tr><th scope="col" class="py-2 font-semibold">Quando você acerta</th><th scope="col" class="py-2 text-right font-semibold">XP</th></tr>
        </thead>
        <tbody>
          <tr v-for="rule in XP_RULES" :key="rule.xp" class="border-t border-line">
            <td class="py-2">{{ rule.when }}</td>
            <td class="cq-num py-2 text-right text-xl font-bold">{{ rule.xp }}</td>
          </tr>
        </tbody>
      </table>
    </section>

    <section class="mt-12" aria-labelledby="h-levels">
      <h2 id="h-levels" class="font-display text-2xl font-bold">Níveis e títulos</h2>
      <p class="mt-2 leading-relaxed">A cada 50 XP você sobe um nível, e o nível dá o seu título.</p>
      <table class="mt-4 w-full max-w-md text-left">
        <caption class="sr-only">Título de cada faixa de nível</caption>
        <thead class="text-sm text-muted">
          <tr><th scope="col" class="py-2 font-semibold">Níveis</th><th scope="col" class="py-2 font-semibold">Título</th></tr>
        </thead>
        <tbody>
          <tr v-for="band in LEVEL_BANDS" :key="band.from" class="border-t border-line">
            <td class="cq-num py-2 text-lg">{{ levelRange(band.from, band.to) }}</td>
            <td class="py-2 font-semibold">{{ band.title }}</td>
          </tr>
        </tbody>
      </table>
    </section>

    <section class="mt-12" aria-labelledby="h-badges">
      <h2 id="h-badges" class="font-display text-2xl font-bold">Insígnias</h2>
      <p class="mt-2 leading-relaxed">
        Insígnias marcam conquistas, como resolver desafios de uma habilidade, subir de nível ou manter a sequência de dias.
        Elas têm três graus: bronze, prata e ouro. As que você ainda não ganhou aparecem apagadas, com a condição para ganhar;
        algumas são secretas e só se revelam quando você as conquista. Insígnias não dão XP.
      </p>
    </section>

    <section class="mt-12" aria-labelledby="h-ranking">
      <h2 id="h-ranking" class="font-display text-2xl font-bold">Ranking</h2>
      <p class="mt-2 leading-relaxed">
        O ranking soma o XP da semana (desde segunda-feira) ou do mês (desde o dia 1). Há um ranking geral e um para cada turma.
        Você vê a sua posição e até dois estudantes acima e dois abaixo. Seu nome só vira link para o seu perfil se você ativar
        “Mostrar meu perfil para outros estudantes” no Perfil.
      </p>
    </section>

    <section class="mt-12" aria-labelledby="h-goal">
      <h2 id="h-goal" class="font-display text-2xl font-bold">Meta da turma</h2>
      <p class="mt-2 leading-relaxed">
        Toda semana cada turma tem uma meta: um número de primeiras soluções que os estudantes fazem juntos nos desafios da turma.
        Quando a turma chega à meta, quem ajudou ganha uma insígnia. A meta recomeça na segunda-feira e não dá XP.
      </p>
    </section>

    <section class="mt-12" aria-labelledby="h-streak">
      <h2 id="h-streak" class="font-display text-2xl font-bold">Sequência de dias</h2>
      <p class="mt-2 leading-relaxed">
        Conta os dias seguidos em que você resolveu pelo menos um desafio. Se passar um dia inteiro sem resolver, ela volta a zero.
        A sequência não dá XP.
      </p>
    </section>

    <section class="mt-12" aria-labelledby="h-daily">
      <h2 id="h-daily" class="font-display text-2xl font-bold">Desafio diário</h2>
      <p class="mt-2 leading-relaxed">
        Todo dia você recebe um desafio que ainda não resolveu. Ele é o mesmo durante o dia todo e não dá XP extra.
      </p>
    </section>

    <section class="mt-12" aria-labelledby="h-hints">
      <h2 id="h-hints" class="font-display text-2xl font-bold">Dicas</h2>
      <p class="mt-2 leading-relaxed">
        Travou? Use o botão Dica. São até 5 dicas por desafio, com uma pequena espera entre uma e outra, e cada nova dica ajuda
        um pouco mais. A dica guia o seu raciocínio, mas nunca entrega a resposta. Depois do primeiro erro em um desafio você
        também recebe uma dica automática, que não conta no limite.
      </p>
    </section>

    </div>

    <section
      v-if="isProfessor"
      v-show="tab === 'professor'"
      id="help-panel-professor"
      role="tabpanel"
      aria-labelledby="help-tab-professor"
      class="mt-6"
      data-testid="help-professor"
    >
      <h2 id="h-prof" class="font-display text-2xl font-bold">Para professores</h2>
      <ul class="mt-4 grid list-disc gap-3 pl-5 leading-relaxed marker:text-muted">
        <li>Crie turmas e passe o código de entrada para os estudantes.</li>
        <li>Monte missões com desafios dos quatro tipos. O editor confere as regras de cada tipo enquanto você preenche.</li>
        <li>Use <strong>Revisar com IA</strong> para receber sugestões sobre um desafio; nada é alterado sem você.</li>
        <li>Use <strong>Gerar rascunho com IA</strong> para começar um desafio a partir de um tema. O rascunho só chega aos estudantes depois que você publicar.</li>
        <li>Depois que um desafio recebe respostas, só os textos podem mudar. Use <strong>Duplicar</strong> para alterar a estrutura.</li>
        <li>Para tirar alguém da turma, use <strong>Remover</strong> na tabela de progresso. Quem entrou por engano pode voltar com o mesmo código: primeiro remova, depois use <strong>Gerar novo código</strong>.</li>
        <li>Defina a meta semanal da turma ou deixe que ela seja calculada automaticamente.</li>
      </ul>
    </section>
  </article>
</template>
