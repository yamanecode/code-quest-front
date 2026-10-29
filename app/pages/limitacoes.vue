<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'

// Public limitations page (spec §9.1), open to visitors and to logged-in users. The list is
// open: more items can be added as the thesis review goes on.
definePageMeta({ layout: 'landing' })
useHead({ title: 'Limitações · CodeQuest' })

const auth = useAuthStore()
auth.restore()

const LIMITATIONS = [
  {
    id: 'comercial',
    title: 'Não é um produto comercial',
    text: 'A plataforma foi construída para demonstrar e estudar as ideias do Trabalho de Conclusão de Curso. Ela não é oferecida ao público em geral e não tem suporte, contrato de serviço nem garantia de continuidade.',
  },
  {
    id: 'provedor-ia',
    title: 'A IA exige um provedor, e ele é pago',
    text: 'As dicas, as revisões e os rascunhos dependem de um provedor de IA, que precisa ser escolhido e configurado. Para um uso sério, com muitos estudantes, esse serviço tem custo. Sem ele, a plataforma continua funcionando, mas apenas com dicas de reserva fixas, iguais para todos.',
  },
  {
    id: 'avaliacao',
    title: 'Sem avaliação com estudantes',
    text: 'O projeto não inclui testes com usuários, pesquisas de opinião nem coleta de dados de uso. Não há resultados sobre o quanto a plataforma ajuda a aprender.',
  },
  {
    id: 'dicas',
    title: 'As dicas podem sugerir a resposta',
    text: 'Toda dica é conferida antes de aparecer, e é descartada se contiver a solução. Essa conferência só reconhece uma dica que traz a resposta escrita. Uma dica que apenas aponta para ela passa sem ser detectada.',
  },
  {
    id: 'qualidade-ia',
    title: 'A qualidade da IA não foi medida',
    text: 'O trabalho não avalia o quanto as dicas, as revisões e os rascunhos gerados pela IA são bons ou corretos. O professor precisa revisar tudo antes de publicar.',
  },
  {
    id: 'responsaveis',
    title: 'Sem ferramentas de supervisão dos responsáveis',
    text: 'A plataforma limita os dados coletados e não envia notificações, mas não oferece recursos para pais ou responsáveis acompanharem o uso.',
  },
  {
    id: 'recuperacao',
    title: 'Recuperação de conta só pelo código',
    text: 'Como não há e-mail, o estudante que esquece a senha depende do código de recuperação. Sem a senha e sem o código, só quem administra a plataforma consegue ajudar. Professores não têm código.',
  },
  {
    id: 'nomes',
    title: 'Nomes de usuário em uso podem ser descobertos',
    text: 'Ao criar a conta, a plataforma avisa quando um nome já está em uso. Isso revela que o nome existe, mas nada além dele.',
  },
  {
    id: 'seguranca',
    title: 'Segurança de uma implantação pública não foi avaliada',
    text: 'A sessão fica guardada no navegador e as senhas trafegam no corpo das requisições, o que exige HTTPS fora de um computador local. Não houve auditoria de segurança nem teste de invasão.',
  },
]
</script>

<template>
  <div class="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
    <div class="grid max-w-3xl gap-6">
      <div>
        <h1 class="font-display text-4xl font-extrabold leading-tight sm:text-5xl">Limitações do <span class="cq-mark cq-mark-in">projeto</span></h1>
        <p class="mt-5 text-xl leading-relaxed text-muted">O CodeQuest é um projeto acadêmico e não foi pensado como produto comercial. Estas são as limitações que o trabalho declara.</p>
      </div>

      <dl class="border-t-2 border-line-strong" data-testid="limitations-list">
        <div
          v-for="item in LIMITATIONS"
          :key="item.id"
          class="grid gap-1 border-b border-line py-4 md:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] md:gap-8"
          :data-testid="`limitation-${item.id}`"
        >
          <dt class="font-display text-xl font-bold leading-tight text-ink">{{ item.title }}</dt>
          <dd class="max-w-prose">{{ item.text }}</dd>
        </div>
      </dl>

      <p class="bg-raised px-5 py-4">Tem uma dúvida sobre o projeto? Fale com o autor ou com a orientadora, indicados no rodapé.</p>

      <p>
        <NuxtLink
          :to="auth.isLoggedIn ? auth.home : '/'"
          class="cq-btn-outline inline-flex items-center"
          data-testid="limitations-back"
        >← Voltar ao início</NuxtLink>
      </p>
    </div>
  </div>
</template>
