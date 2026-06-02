<template>
  <div class="app-shell">
    <AppSidebar />
    <div class="app-main">
      <header class="topbar">
        <div class="topbar-brand">
          <svg width="26" height="26" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <polygon points="11,2 21,2 30,11 30,21 21,30 11,30 2,21 2,11"
              fill="rgba(0,194,255,0.08)" stroke="#00C2FF" stroke-width="1.5" stroke-linejoin="round"/>
            <circle cx="16" cy="9"  r="2" fill="none" stroke="#00C2FF" stroke-width="1.1"/>
            <circle cx="23" cy="16" r="2" fill="none" stroke="#00C2FF" stroke-width="1.1"/>
            <circle cx="16" cy="23" r="2" fill="none" stroke="#00C2FF" stroke-width="1.1"/>
            <circle cx="9"  cy="16" r="2" fill="none" stroke="#00C2FF" stroke-width="1.1"/>
            <line x1="16" y1="11" x2="21" y2="14" stroke="#00C2FF" stroke-opacity="0.3" stroke-width="0.8"/>
            <line x1="21" y1="18" x2="18" y2="21" stroke="#00C2FF" stroke-opacity="0.3" stroke-width="0.8"/>
            <line x1="16" y1="21" x2="11" y2="18" stroke="#00C2FF" stroke-opacity="0.3" stroke-width="0.8"/>
            <line x1="11" y1="14" x2="14" y2="11" stroke="#00C2FF" stroke-opacity="0.3" stroke-width="0.8"/>
            <circle cx="16" cy="16" r="1.5" fill="#00C2FF" opacity="0.5"/>
          </svg>
          <span class="brand-name">CodeQuest</span>
        </div>
        <nav class="topbar-nav">
          <NuxtLink to="/ranking" class="nav-link">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
            Ranking
          </NuxtLink>
          <button @click="logout" class="nav-link nav-link--logout">Sair</button>
        </nav>
      </header>
      <main class="app-content">
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

<style scoped>
.app-shell { display: flex; height: 100dvh; background: var(--bg-base); overflow: hidden; }
.app-main { display: flex; flex-direction: column; flex: 1; min-width: 0; }
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1.5rem;
  height: 52px;
  flex-shrink: 0;
  border-bottom: 1px solid var(--border);
  background: var(--bg-base);
}
.topbar-brand { display: flex; align-items: center; gap: 0.625rem; }
.brand-name {
  font-family: var(--font-mono);
  font-weight: 700;
  font-size: 0.9375rem;
  letter-spacing: 0.04em;
  color: var(--text-primary);
}
.topbar-nav { display: flex; align-items: center; gap: 0.25rem; }
.nav-link {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  border-radius: 6px;
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--text-secondary);
  text-decoration: none;
  transition: color 0.15s, background 0.15s;
  background: none;
  border: none;
  cursor: pointer;
}
.nav-link:hover { color: var(--text-primary); background: rgba(255,255,255,0.05); }
.nav-link--logout:hover { color: #f87171; }
.app-content { flex: 1; overflow-y: auto; }
</style>