// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  srcDir: 'app/',
  css: ['assets/main.css'],
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  fonts: {
  families: [
    { name: 'Inter', provider: 'google' },
    { name: 'JetBrains Mono', provider: 'google' },
  ]
},
  modules: ['@pinia/nuxt', '@nuxtjs/tailwindcss', '@nuxt/fonts'],
  runtimeConfig: {
    public: {
      apiBase: 'http://localhost:8000'
    }
  }
})
