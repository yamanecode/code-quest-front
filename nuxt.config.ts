// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  ssr: false,
  srcDir: 'app/',
  css: ['assets/main.css'],
  // Components are used by their file name (HelpTip, not GameHelpTip).
  components: [{ path: '~/components', pathPrefix: false }],
  compatibilityDate: '2025-07-15',
  app: {
    head: {
      // Screen readers pick the voice and pronunciation from the page language.
      htmlAttrs: { lang: 'pt-BR' },
      // Sets the theme before the app loads, so the page never flashes in the wrong theme.
      // Same rule as stores/settings.ts: a saved choice wins, else the device setting.
      script: [
        {
          innerHTML:
            "try{var t=localStorage.getItem('cq-theme');if(t!=='light'&&t!=='dark'){t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}document.documentElement.dataset.theme=t}catch(e){document.documentElement.dataset.theme='light'}",
        },
      ],
    },
  },
  devtools: { enabled: true },
  fonts: {
    families: [
      { name: 'Atkinson Hyperlegible', provider: 'google', weights: [400, 700] },
      { name: 'Bricolage Grotesque', provider: 'google', weights: [600, 700, 800] },
    ],
  },
  modules: ['@pinia/nuxt', '@nuxtjs/tailwindcss', '@nuxt/fonts', '@nuxt/eslint'],
  typescript: {
    // Type-check the internal tests with the app (they use its aliases and auto-imports).
    tsConfig: { include: ['../tests/unit/**/*'] },
  },
  runtimeConfig: {
    public: {
      // Overridden at runtime by NUXT_PUBLIC_API_BASE.
      apiBase: 'http://localhost:8000',
    },
  },
})
