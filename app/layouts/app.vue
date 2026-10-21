<template>
  <div class="min-h-screen">
    <a
      href="#conteudo"
      class="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-ink focus:px-4 focus:py-2 focus:text-on-color"
      data-testid="skip-link"
    >Pular para o conteúdo</a>
    <AppHeader />
    <main id="conteudo" tabindex="-1" class="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <slot />
    </main>
  </div>
</template>
