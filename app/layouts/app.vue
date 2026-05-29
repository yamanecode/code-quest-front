<template>
  <div class="flex h-screen bg-gray-950 overflow-hidden">
    <AppSidebar />
    <div class="flex flex-col flex-1 min-w-0">
      <!-- Top bar -->
      <header class="border-b border-gray-800/60 px-6 py-3 flex items-center justify-between flex-shrink-0 bg-gray-950/80 backdrop-blur-sm">
        <div class="flex items-center gap-2">
          <div class="w-7 h-7 rounded-lg bg-indigo-500 flex items-center justify-center text-sm font-bold">⚡</div>
          <span class="font-bold text-lg tracking-tight text-white">CodeQuest</span>
        </div>
        <div class="flex items-center gap-4">
          <NuxtLink to="/ranking" class="text-gray-400 hover:text-white text-sm transition-colors flex items-center gap-1.5">
            🏆 <span>Ranking</span>
          </NuxtLink>
          <button @click="logout" class="text-gray-400 hover:text-white text-sm transition-colors">Sair</button>
        </div>
      </header>
      <!-- Page content -->
      <main class="flex-1 overflow-y-auto">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'
const auth = useAuthStore()
const router = useRouter()
function logout() { auth.logout(); router.push('/') }
</script>