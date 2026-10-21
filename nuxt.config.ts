// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  ssr: false,
  srcDir: 'app/',
  css: ['assets/main.css'],
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  fonts: {
    families: [
      { name: 'Inter', provider: 'google' },
      { name: 'JetBrains Mono', provider: 'google' },
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
