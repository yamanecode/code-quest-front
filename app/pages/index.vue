<template>
  <div class="landing">

    <!-- Navbar -->
    <header class="navbar">
      <div class="navbar-inner">
        <div class="navbar-brand">
          <svg class="brand-icon" width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
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
        <NuxtLink to="/auth" class="btn-nav">Entrar</NuxtLink>
      </div>
    </header>

    <!-- Hero -->
    <section class="hero">
      <div class="hero-bg" aria-hidden="true">
      
        <!-- Grid -->
        <svg class="hero-grid" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" x="0" y="0" width="48" height="48" patternUnits="userSpaceOnUse">
              <path d="M 48 0 L 0 0 0 48" fill="none" stroke-opacity="0.12" stroke="#00C2FF" stroke-width="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)"/>
        </svg>
      
        <!-- Aurora glows -->
        <div class="hero-glow hero-glow-1" />
        <div class="hero-glow hero-glow-2" />
        <div class="hero-glow hero-glow-3" />
        <div class="hero-glow hero-glow-4" />
      
        <!-- Fade to page bottom -->
        <div class="hero-fade" />
      
      </div>
    
      <div class="hero-inner">
        <p class="hero-kicker mono">Pensamento Computacional · IA · Gamificação</p>
        <h1 class="hero-title">
          Uma plataforma para desenvolver<br>
          <em>Pensamento Computacional</em><br>
          com suporte de IA e gamificação.
        </h1>
        <p class="hero-desc">
          Desafios em quatro competências do Pensamento Computacional, feedback pedagógico gerado por IA e um tutor socrático que guia sem revelar respostas, dentro de um sistema de motivação baseado no framework Octalysis.
        </p>
      </div>
    </section>

    <div class="divider" />

    <!-- Como funciona -->
    <section class="section" id="sobre">
      <div class="section-inner">
        <p class="section-label mono">Como funciona</p>
        <h2 class="section-title">Três pilares integrados</h2>

        <div class="pillars">

          <div class="pilar">
            <div class="pilar-num mono">01</div>
            <div class="pilar-content">
              <h3 class="pilar-title">Desafios de Pensamento Computacional</h3>
              <p class="pilar-body">
                Os desafios cobrem as quatro competências centrais do PC: decomposição, reconhecimento de padrões, abstração e pensamento algorítmico, com diferentes níveis de dificuldade.
              </p>
              <div class="pilar-tags">
                <span class="tag">Decomposição</span>
                <span class="tag">Reconhecimento de Padrões</span>
                <span class="tag">Abstração</span>
                <span class="tag">Algoritmos</span>
              </div>
            </div>
          </div>

          <div class="pilar-divider" />

          <div class="pilar">
            <div class="pilar-num mono">02</div>
            <div class="pilar-content">
              <h3 class="pilar-title">Inteligência Artificial em dois papéis</h3>
              <p class="pilar-body">
                Após cada submissão, um agente de IA gera uma explicação pedagógica contextualizada indo além do simples acerto ou erro. Durante a resolução, o estudante pode acionar o tutor socrático, que responde com perguntas que direcionam o raciocínio sem entregar a resposta.
              </p>
              <div class="pilar-tags">
                <span class="tag">Feedback pedagógico</span>
                <span class="tag">Tutor socrático</span>
                <span class="tag">Gemini 2.5 Flash</span>
              </div>
            </div>
          </div>

          <div class="pilar-divider" />

          <div class="pilar">
            <div class="pilar-num mono">03</div>
            <div class="pilar-content">
              <h3 class="pilar-title">Gamificação</h3>
              <p class="pilar-body">
                O sistema de motivação é implementado sobre o framework Octalysis: XP e níveis registram evolução, conquistas marcam marcos de aprendizado, o ranking cria referência coletiva e a sequência diária constrói hábito de estudo.
              </p>
              <div class="pilar-tags">
                <span class="tag">XP · Níveis</span>
                <span class="tag">Conquistas</span>
                <span class="tag">Ranking</span>
                <span class="tag">Sequência diária</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>

    <div class="divider" />

    <!-- Octalysis -->
    <section class="section section-alt" id="octalysis">
      <div class="section-inner">
        <p class="section-label mono">Base teórica da gamificação</p>
        <h2 class="section-title">Framework Octalysis</h2>
        <p class="section-sub">
          Proposto por Yu-Kai Chou, o Octalysis organiza toda motivação humana em oito núcleos fundamentais. Sistemas gamificados eficazes ativam múltiplos núcleos simultaneamente, criando engajamento sustentado. O CodeQuest foi desenhado em torno destes núcleos.
        </p>

        <div class="oct-layout">
          <div class="oct-svg-wrap">
            <!--
              Octagon geometry (viewBox 420x420, center 210,210):
              Vertices (R=160, starting -112.5deg so faces align with cardinal/diagonal directions):
                polygon: 149,62 271,62 358,149 358,271 271,358 149,358 62,271 62,149
              Label positions at face-center angles (r=118), clockwise from top:
                0 top        (-90deg): 210,92
                1 upper-right(-45deg): 293,127
                2 right       (0deg): 328,210
                3 lower-right (45deg): 293,293
                4 bottom      (90deg): 210,328
                5 lower-left (135deg): 127,293
                6 left       (180deg): 92,210
                7 upper-left (225deg): 127,127
            -->
            <svg viewBox="0 0 420 420" width="520" height="520" style="max-width:100%;overflow:visible" xmlns="http://www.w3.org/2000/svg">
              <!-- outer octagon -->
              <polygon points="149,62 271,62 358,149 358,271 271,358 149,358 62,271 62,149"
                fill="rgba(0,194,255,0.03)" stroke="rgba(0,194,255,0.2)" stroke-width="1.25"/>
              <!-- inner guide ring -->
              <polygon points="175,95 245,95 315,165 315,255 245,325 175,325 105,255 105,165"
                fill="none" stroke="rgba(0,194,255,0.06)" stroke-width="0.75"/>
              <!-- spokes from center to each label position -->
              <g stroke="rgba(0,194,255,0.1)" stroke-width="0.75">
                <line x1="210" y1="210" x2="210" y2="92"/>
                <line x1="210" y1="210" x2="293" y2="127"/>
                <line x1="210" y1="210" x2="328" y2="210"/>
                <line x1="210" y1="210" x2="293" y2="293"/>
                <line x1="210" y1="210" x2="210" y2="328"/>
                <line x1="210" y1="210" x2="127" y2="293"/>
                <line x1="210" y1="210" x2="92"  y2="210"/>
                <line x1="210" y1="210" x2="127" y2="127"/>
              </g>
              <!-- center dot -->
              <circle cx="210" cy="210" r="4" fill="#00C2FF" opacity="0.5"/>
              <!-- nodes: iterate drives, use computed positions -->
              <g v-for="(d, i) in drives" :key="'node'+i"
                @mouseenter="activeTooltip = i"
                @mouseleave="activeTooltip = null"
                @touchstart.prevent="activeTooltip = i"
                @touchend="scheduleHideTooltip"
                style="cursor:default">
                <circle
                  :cx="d.cx" :cy="d.cy" r="30"
                  :fill="d.active ? 'rgba(0,194,255,0.13)' : 'rgba(13,18,32,0.96)'"
                  :stroke="d.active ? '#00C2FF' : 'rgba(255,255,255,0.12)'"
                  :stroke-width="d.active ? '1.5' : '1'"
                />
                <!-- line 1 -->
                <text
                  :x="d.cx" :y="d.cy + (d.line2 ? -7 : 0)"
                  text-anchor="middle" dominant-baseline="middle"
                  font-family="'JetBrains Mono', monospace"
                  font-size="7.5"
                  :font-weight="d.active ? '700' : '400'"
                  :fill="d.active ? '#00C2FF' : '#6b7280'"
                >{{ d.line1 }}</text>
                <!-- line 2 (optional) -->
                <text v-if="d.line2"
                  :x="d.cx" :y="d.cy + 6"
                  text-anchor="middle" dominant-baseline="middle"
                  font-family="'JetBrains Mono', monospace"
                  font-size="7.5"
                  :font-weight="d.active ? '700' : '400'"
                  :fill="d.active ? '#00C2FF' : '#6b7280'"
                >{{ d.line2 }}</text>
              </g>
              <!-- tooltip -->
              <foreignObject
                v-if="activeTooltip !== null"
                :x="tipX"
                :y="tipY"
                :width="280"
                :height="90"
                style="pointer-events:none"
              >
                <div class="oct-tooltip">
                  {{ drives[activeTooltip]?.tip }}
                </div>
              </foreignObject>
            </svg>
          </div>

          <!-- legend -->
          <div class="oct-legend">
            <div v-for="(d, i) in drives" :key="'leg'+i" class="legend-row"
              @mouseenter="activeTooltip = i"
              @mouseleave="activeTooltip = null">
              <span class="legend-dot" :class="{ active: d.active }" />
              <span class="legend-name" :class="{ active: d.active }">{{ d.label }}</span>
              <span v-if="d.active" class="legend-badge mono">ativo</span>
            </div>
            <p class="legend-note">Passe o cursor sobre cada núcleo para ver uma descrição.</p>
          </div>
        </div>
      </div>
    </section>

    <div class="divider" />

    <!-- Tecnologias -->
    <section class="section" id="tecnologias">
      <div class="section-inner">
        <p class="section-label mono">Stack técnica</p>
        <h2 class="section-title">Tecnologias utilizadas</h2>
        <div class="stack-grid">
          <div class="stack-item">
            <span class="stack-layer mono">Backend</span>
            <div class="stack-chips">
              <span class="chip">Python</span>
              <span class="chip">FastAPI</span>
              <span class="chip">SQLAlchemy</span>
              <span class="chip">Alembic</span>
              <span class="chip">JWT · bcrypt</span>
            </div>
          </div>
          <div class="stack-item">
            <span class="stack-layer mono">Frontend</span>
            <div class="stack-chips">
              <span class="chip">Vue 3</span>
              <span class="chip">Nuxt 4</span>
              <span class="chip">TailwindCSS</span>
              <span class="chip">Pinia</span>
            </div>
          </div>
          <div class="stack-item">
            <span class="stack-layer mono">Banco de dados</span>
            <div class="stack-chips">
              <span class="chip">PostgreSQL</span>
              <span class="chip">pgvector</span>
              <span class="chip">Docker</span>
            </div>
          </div>
          <div class="stack-item">
            <span class="stack-layer mono">Inteligência artificial</span>
            <div class="stack-chips">
              <span class="chip chip-accent">Google Gemini</span>
              <span class="chip">API REST</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="footer">
      <div class="footer-inner">
        <div class="footer-brand">
          <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
            <polygon points="11,2 21,2 30,11 30,21 21,30 11,30 2,21 2,11"
              fill="rgba(0,194,255,0.08)" stroke="#00C2FF" stroke-width="1.5" stroke-linejoin="round"/>
            <circle cx="16" cy="9"  r="2" fill="none" stroke="#00C2FF" stroke-width="1.1"/>
            <circle cx="23" cy="16" r="2" fill="none" stroke="#00C2FF" stroke-width="1.1"/>
            <circle cx="16" cy="23" r="2" fill="none" stroke="#00C2FF" stroke-width="1.1"/>
            <circle cx="9"  cy="16" r="2" fill="none" stroke="#00C2FF" stroke-width="1.1"/>
            <circle cx="16" cy="16" r="1.5" fill="#00C2FF" opacity="0.5"/>
          </svg>
          <span class="footer-name mono">CodeQuest</span>
        </div>
        <div class="footer-credits">
          <p>Desenvolvido por <span class="author">André Yamane</span></p>
          <p class="advisor">Orientação: Dra. Andréia Damasio de Leles · UniFacens 2026</p>
        </div>
      </div>
    </footer>

  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
definePageMeta({ layout: false })

const activeTooltip = ref<number | null>(null)
let tooltipTimer: ReturnType<typeof setTimeout> | null = null

function scheduleHideTooltip() {
  if (tooltipTimer) clearTimeout(tooltipTimer)
  tooltipTimer = setTimeout(() => { activeTooltip.value = null }, 1600)
}

const drives = [
  // face positions (r=118 from center 210,210):
  // top      (-90°): 210, 92
  // upper-L (-135°): 127, 127
  // left    (-180°):  92, 210
  // lower-L  (135°): 127, 293
  // bottom    (90°): 210, 328
  // lower-R   (45°): 293, 293
  // right      (0°): 328, 210
  // upper-R  (-45°): 293, 127

  // 1 = top
  {
    label: 'Significado Épico e Propósito',
    line1: 'Significado',
    line2: 'Épico',
    tip: 'Sentir que faz parte de algo maior que si mesmo.',
    cx: 210,
    cy: 92,
    active: false
  },

  // 2 = upper-left
  {
    label: 'Desenvolvimento e Realização',
    line1: 'Desenvolvimento',
    line2: 'e Realização',
    tip: 'Progredir, dominar habilidades e superar desafios.',
    cx: 127,
    cy: 127,
    active: true
  },

  // 3 = left
  {
    label: 'Posse e Propriedade',
    line1: 'Posse e',
    line2: 'Propriedade',
    tip: 'Sentir que algo é seu e querer desenvolvê-lo.',
    cx: 92,
    cy: 210,
    active: false
  },

  // 4 = lower-left
  {
    label: 'Escassez e Impaciência',
    line1: 'Escassez e',
    line2: 'Impaciência',
    tip: 'Querer algo porque é raro, limitado ou ainda não está disponível.',
    cx: 127,
    cy: 293,
    active: false
  },

  // 5 = bottom
  {
    label: 'Aversão à Perda',
    line1: 'Aversão',
    line2: 'à Perda',
    tip: 'Agir para evitar perder algo conquistado ou sofrer consequências negativas.',
    cx: 210,
    cy: 328,
    active: true
  },

  // 6 = lower-right
  {
    label: 'Influência Social',
    line1: 'Influência',
    line2: 'Social',
    tip: 'Motivação gerada por interação, colaboração, reconhecimento e comparação com outras pessoas.',
    cx: 328,
    cy: 210,
    active: false
  },

  // 7 = right
  {
    label: 'Imprevisibilidade e Curiosidade',
    line1: 'Imprevisibilidade',
    line2: 'e Curiosidade',
    tip: 'Desejo de descobrir o que acontecerá em seguida.',
    cx: 293,
    cy: 293,
    active: false
  },

  // 8 = upper-right
  {
    label: 'Criatividade e Feedback',
    line1: 'Criatividade',
    line2: 'e Feedback',
    tip: 'Resolver problemas usando criatividade e aprender com o retorno recebido.',
    cx: 293,
    cy: 127,
    active: true
  },
]

const tipW = 200
const tipH = 26
const svgSize = 420

const tipX = computed(() => {
  if (activeTooltip.value === null) return 0
  const d = drives[activeTooltip.value]
  if (!d) return 0
  const x = d.cx - tipW / 2
  return Math.max(2, Math.min(x, svgSize - tipW - 2))
})

const tipY = computed(() => {
  if (activeTooltip.value === null) return 0
  const d = drives[activeTooltip.value]
  if (!d) return 0
  // place above if in lower half, below if in upper half
  return d.cy > 210 ? d.cy - 28 - tipH : d.cy + 28
})
</script>

<style scoped>
.landing {
  min-height: 100dvh;
  background: var(--bg-base);
  color: var(--text-primary);
  font-family: var(--font-sans);
}

/* ── NAVBAR ── */
.navbar {
  position: sticky;
  top: 0;
  z-index: 50;
  border-bottom: 1px solid var(--border);
  background: rgba(8, 12, 20, 0.88);
  backdrop-filter: blur(14px);
}
.navbar-inner {
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 1.75rem;
  height: 58px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.navbar-brand { display: flex; align-items: center; gap: 0.625rem; }
.brand-icon { flex-shrink: 0; display: block; }
.brand-name {
  font-family: var(--font-mono);
  font-weight: 700;
  font-size: 0.9375rem;
  letter-spacing: 0.04em;
  color: var(--text-primary);
}
.btn-nav {
  font-family: var(--font-mono);
  font-size: 0.875rem;
  font-weight: 600;
  padding: 0.4rem 1.1rem;
  border-radius: 7px;
  background: var(--amber);
  color: #1a0f00;
  text-decoration: none;
  transition: opacity 0.15s;
  border: none;
}
.btn-nav:hover { opacity: 0.85; }

/* ── HERO ── */
.hero {
  position: relative;
  overflow: hidden;
  padding: 6rem 1.75rem 5rem;
}

.hero-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}

.hero-grid {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.hero-glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  animation: aurora 8s ease-in-out infinite alternate;
}

.hero-glow-1 {
  width: 650px;
  height: 500px;
  top: -150px;
  left: -80px;
  background: radial-gradient(ellipse, rgba(0, 220, 255, 0.45) 0%, rgba(0, 80, 255, 0.2) 50%, transparent 70%);
  animation-delay: 0s;
  animation-duration: 28s;
}

.hero-glow-2 {
  width: 600px;
  height: 400px;
  top: -100px;
  right: -60px;
  background: radial-gradient(ellipse, rgba(180, 0, 255, 0.35) 0%, rgba(100, 0, 200, 0.15) 50%, transparent 70%);
  animation-delay: -3s;
  animation-duration: 26s;
}

.hero-glow-3 {
  width: 400px;
  height: 350px;
  bottom: -80px;
  left: 20%;
  background: radial-gradient(ellipse, rgba(245, 158, 11, 0.25) 0%, rgba(220, 80, 0, 0.1) 50%, transparent 80%);
  animation-delay: -6s;
  animation-duration: 18s;
}

.hero-glow-4 {
  width: 400px;
  height: 500px;
  top: 20%;
  left: 40%;
  background: radial-gradient(ellipse, rgba(0, 255, 160, 0.15) 0%, transparent 80%);
  animation-delay: -9s;
  animation-duration: 26s;
}
.hero-fade {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 120px;
  background: linear-gradient(to bottom, transparent, var(--bg-base));
}

@keyframes aurora {
  0% {
    transform: translate(0px, 0px) scale(0.9);
  }

  25% {
    transform: translate(120px, -80px) scale(1.25);
  }

  50% {
    transform: translate(-100px, 60px) scale(0.85);
  }

  75% {
    transform: translate(80px, 100px) scale(1.35);
  }

  100% {
    transform: translate(-60px, -40px) scale(1.1);
  }
}

.hero-inner {
  max-width: 1100px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.hero-kicker {
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  color: var(--cyan);
  text-transform: uppercase;
}

.hero-title {
  font-size: clamp(1.75rem, 3vw, 2.5rem);
  font-weight: 700;
  line-height: 1.22;
  letter-spacing: -0.01em;
  color: var(--text-primary);
  max-width: 680px;
}

.hero-title em {
  font-style: normal;
  color: var(--cyan);
}

.hero-desc {
  font-size: 1rem;
  color: var(--text-secondary);
  line-height: 1.75;
  max-width: 600px;
  font-weight: 400;
}

/* ── DIVIDER ── */
.divider {
  height: 1px;
  background: var(--border);
}

/* ── SECTIONS ── */
.section { padding: 5rem 1.75rem; }
.section-alt { background: var(--bg-surface); }
.section-inner { max-width: 1100px; margin: 0 auto; }

.section-label {
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  color: var(--cyan);
  text-transform: uppercase;
  margin-bottom: 0.5rem;
  display: block;
}
.section-title {
  font-size: clamp(1.375rem, 2.5vw, 1.875rem);
  font-weight: 700;
  letter-spacing: -0.015em;
  color: var(--text-primary);
  margin-bottom: 1rem;
  line-height: 1.2;
}
.section-sub {
  font-size: 0.9375rem;
  color: var(--text-secondary);
  line-height: 1.75;
  max-width: 680px;
  margin-bottom: 0;
}

/* ── PILLARS ── */
.pillars {
  margin-top: 3rem;
  display: flex;
  flex-direction: column;
}
.pilar {
  display: grid;
  grid-template-columns: 3rem 1fr;
  gap: 1.5rem;
  padding: 2rem 0;
}
.pilar-divider {
  height: 1px;
  background: var(--border);
}
.pilar-num {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-muted);
  letter-spacing: 0.1em;
  padding-top: 0.25rem;
}
.pilar-content { display: flex; flex-direction: column; gap: 0.875rem; }
.pilar-title {
  font-size: 1.0625rem;
  font-weight: 600;
  color: var(--text-primary);
  letter-spacing: -0.01em;
  line-height: 1.3;
}
.pilar-body {
  font-size: 0.9375rem;
  color: var(--text-secondary);
  line-height: 1.75;
  max-width: 640px;
}
.pilar-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
}
.tag {
  font-size: 0.6875rem;
  font-weight: 500;
  padding: 3px 8px;
  border-radius: 4px;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  color: var(--text-muted);
  font-family: var(--font-mono);
  letter-spacing: 0.03em;
}

/* ── OCTALYSIS ── */
.oct-layout {
  margin-top: 2.5rem;
  display: grid;
  grid-template-columns: 520px 1fr;
  gap: 4rem;
  align-items: center;
}

.oct-svg-wrap {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.oct-svg-wrap svg {
  width: 520px;
  height: 520px;
}
.oct-legend {
  display: flex;
  flex-direction: column;
  gap: 0;
}
.legend-row {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--border);
  cursor: default;
}
.legend-row:last-of-type { border-bottom: none; }
.legend-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  border: 1px solid var(--text-muted);
  flex-shrink: 0;
}
.legend-dot.active {
  background: var(--cyan);
  border-color: var(--cyan);
}
.legend-name {
  font-size: 0.875rem;
  color: var(--text-muted);
  flex: 1;
}
.legend-name.active { color: var(--text-primary); font-weight: 600; }
.legend-badge {
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--cyan);
  background: var(--cyan-dim);
  border: 1px solid rgba(0, 194, 255, 0.2);
  padding: 2px 6px;
  border-radius: 3px;
}
.legend-note {
  margin-top: 1rem;
  font-size: 0.75rem;
  color: var(--text-muted);
  font-style: italic;
}

/* ── STACK ── */
.stack-grid {
  margin-top: 2.5rem;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  border: 1px solid var(--border);
  border-radius: 12px;
  overflow: hidden;
}
.stack-item {
  padding: 1.75rem;
  border-right: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
}
.stack-item:nth-child(2n) { border-right: none; }
.stack-item:nth-child(3),
.stack-item:nth-child(4) { border-bottom: none; }
.stack-layer {
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--text-muted);
  display: block;
}
.stack-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
}
.chip {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  font-weight: 400;
  padding: 4px 10px;
  border-radius: 5px;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  color: var(--text-secondary);
}
.chip-accent {
  background: var(--cyan-dim);
  border-color: rgba(0, 194, 255, 0.2);
  color: var(--cyan);
}

/* ── FOOTER ── */
.footer {
  border-top: 1px solid var(--border);
  padding: 1.5rem 1.75rem;
  background: var(--bg-surface);
}
.footer-inner {
  max-width: 1100px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}
.footer-brand { display: flex; align-items: center; gap: 0.5rem; }
.footer-name {
  font-size: 0.8125rem;
  font-weight: 700;
  color: var(--text-secondary);
  font-family: var(--font-mono);
}
.footer-credits { text-align: right; }
.footer-credits p { font-size: 0.8125rem; color: var(--text-muted); margin: 0; }
.footer-credits .author { color: var(--text-secondary); font-weight: 500; }
.footer-credits .advisor { font-size: 0.75rem; margin-top: 2px; }

/* ── RESPONSIVE ── */
@media (max-width: 960px) {
  .oct-layout { grid-template-columns: 1fr; gap: 2.5rem; }
  .oct-svg-wrap svg { max-width: 420px; height: auto; }
}
@media (max-width: 700px) {
  .stack-grid { grid-template-columns: 1fr; }
  .stack-item { border-right: none !important; }
  .stack-item:nth-child(3) { border-bottom: 1px solid var(--border) !important; }
  .stack-item:last-child { border-bottom: none !important; }
}
@media (max-width: 600px) {
  .hero { padding: 4rem 1.25rem 3.5rem; }
  .section { padding: 3.5rem 1.25rem; }
  .navbar-inner { padding: 0 1.25rem; }
  .footer { padding: 1.25rem; }
  .footer-inner { flex-direction: column; align-items: flex-start; }
  .footer-credits { text-align: left; }
  .pilar { grid-template-columns: 2.5rem 1fr; gap: 1rem; }
}

.oct-tooltip {
  background: #0D1220;
  border: 1px solid rgba(255,255,255,0.13);
  border-radius: 5px;
  padding: 8px 10px;
  color: #94a3b8;
  font-size: 12px;
  line-height: 1.4;
  white-space: normal;
  overflow-wrap: break-word;
}
</style>