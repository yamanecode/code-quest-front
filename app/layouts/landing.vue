<template>
  <div class="min-h-screen">
    <a
      href="#conteudo"
      class="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-ink focus:px-4 focus:py-2 focus:text-bg"
      data-testid="skip-link"
    >Pular para o conteúdo</a>
    <LandingHeader />
    <main id="conteudo" tabindex="-1">
      <slot />
    </main>
    <footer class="mt-4 border-t-2 border-line-strong" data-testid="landing-footer">
      <div class="mx-auto grid max-w-6xl gap-1 px-4 py-6 text-sm text-muted sm:px-6">
        <p><strong class="text-ink">CodeQuest</strong> · Trabalho de Conclusão de Curso, Engenharia da Computação, UniFacens, 2026.</p>
        <p>
          Desenvolvido por André Yamane · Orientação: Dra. Andréia Damasio de Leles ·
          <NuxtLink to="/limitacoes" class="underline underline-offset-4 hover:text-ink" data-testid="footer-limitacoes">Limitações</NuxtLink>
        </p>
      </div>
    </footer>
  </div>
</template>
