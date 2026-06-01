<!-- app/pages/index.vue -->
<template>
  <div class="min-h-screen bg-gray-950 text-white overflow-hidden">
    <!-- Navbar -->
    <header class="border-b border-gray-800/60 backdrop-blur-sm">
      <div class="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center text-2xl">
            ⚡
          </div>

          <div>
            <h1 class="font-bold text-xl tracking-tight">CodeQuest</h1>
            <p class="text-xs text-gray-500">
              Pensamento Computacional com IA
            </p>
          </div>
        </div>

        <NuxtLink
          to="/auth"
          class="bg-indigo-600 hover:bg-indigo-500 transition-colors px-5 py-2 rounded-lg text-sm font-medium"
        >
          Entrar
        </NuxtLink>
      </div>
    </header>

    <!-- Hero -->
    <section class="relative">
      <div
        class="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-amber-500/10 pointer-events-none"
      />

      <div class="max-w-6xl mx-auto px-6 py-24 relative">
        <div class="max-w-3xl">
          <h1 class="text-5xl font-bold leading-tight mb-6">
            Aprenda
            <span class="text-indigo-400">
              Pensamento Computacional
            </span>
            com desafios gamificados e suporte de IA
          </h1>

          <p class="text-lg text-gray-400 leading-relaxed max-w-2xl">
            O CodeQuest utiliza desafios interativos, progressão gamificada e
            um tutor baseado em inteligência artificial para auxiliar estudantes
            no desenvolvimento de habilidades como decomposição,
            reconhecimento de padrões, abstração e pensamento algorítmico.
          </p>
        </div>
      </div>
    </section>

    <!-- Problema / Solução -->
    <section id="sobre" class="border-t border-gray-800/60">
      <div class="max-w-6xl mx-auto px-6 py-20">
        <div class="grid md:grid-cols-2 gap-10">
          <div class="bg-gray-900 border border-gray-800 rounded-2xl p-8">
            <h2 class="text-2xl font-bold mb-4">
              O problema
            </h2>

            <p class="text-gray-400 leading-relaxed text-sm">
              O ensino de Pensamento Computacional ainda enfrenta dificuldades
              relacionadas ao engajamento dos estudantes, falta de recursos de
              apoio e necessidade de abordagens mais interativas no processo de
              aprendizagem.
            </p>
          </div>

          <div class="bg-gray-900 border border-gray-800 rounded-2xl p-8">
            <h2 class="text-2xl font-bold mb-4">
              A proposta
            </h2>

            <p class="text-gray-400 leading-relaxed text-sm">
              O CodeQuest combina gamificação com um agente de IA tutor para
              fornecer desafios estruturados, feedback pedagógico e dicas
              guiadas sem revelar respostas diretamente.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Features -->
    <section class="border-t border-gray-800/60 bg-gray-950/60">
      <div class="max-w-6xl mx-auto px-6 py-20">
        <div class="text-center mb-14">
          <h2 class="text-3xl font-bold mb-3">
            Principais recursos
          </h2>

          <p class="text-gray-500">
            Estrutura baseada nos objetivos do projeto acadêmico
          </p>
        </div>

        <div class="grid md:grid-cols-3 gap-6">
          <div class="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <h3 class="font-semibold mb-3">
              Gamificação
            </h3>

            <p class="text-sm text-gray-400 leading-relaxed">
              Sistema de XP, níveis, conquistas e desafios diários para
              incentivar continuidade e progresso.
            </p>
          </div>

          <div class="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <h3 class="font-semibold mb-3">
              Tutor com IA
            </h3>

            <p class="text-sm text-gray-400 leading-relaxed">
              Dicas guiadas inspiradas em abordagem socrática para estimular o
              raciocínio do estudante.
            </p>
          </div>

          <div class="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <h3 class="font-semibold mb-3">
              Desafios interativos
            </h3>

            <p class="text-sm text-gray-400 leading-relaxed">
              Exercícios focados em decomposição, padrões, abstração e
              algoritmos.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Stack -->
    <section class="border-t border-gray-800/60">
      <div class="max-w-5xl mx-auto px-6 py-16 text-center">
        <h2 class="text-2xl font-bold mb-8">
          Tecnologias utilizadas
        </h2>

        <div class="flex flex-wrap justify-center gap-4">
          <div
            class="bg-gray-900 border border-gray-800 rounded-xl px-5 py-3 text-sm text-gray-300"
          >
            Python + FastAPI
          </div>

          <div
            class="bg-gray-900 border border-gray-800 rounded-xl px-5 py-3 text-sm text-gray-300"
          >
            Vue 3 + Nuxt
          </div>

          <div
            class="bg-gray-900 border border-gray-800 rounded-xl px-5 py-3 text-sm text-gray-300"
          >
            Google Gemini
          </div>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="border-t border-gray-800/60">
      <div class="max-w-6xl mx-auto px-6 py-8 text-center">
        <p class="text-sm text-gray-500">
          Desenvolvido por André Yamane
        </p>

        <p class="text-xs text-gray-600 mt-1">
          Orientação: Dra. Andréia Damasio de Leles
        </p>
      </div>
    </footer>
  </div>
</template>