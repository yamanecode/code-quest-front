<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  CORES,
  HAT_LABEL,
  HAT_NOTE,
  MOTIVATION_LABEL,
  VIEW_SIZE,
  badgePoint,
  ringPoints,
  toPoints,
  wedgePoints,
  type Hat,
} from '~/utils/octalysis'

// The 8 core drives of Octalysis as an octagon: each wedge is filled according to how much
// CodeQuest uses the drive. Choosing a core (by button or by clicking the drawing) shows
// what it means and where it appears in the platform.
const selected = ref(2)
const core = computed(() => CORES.find((c) => c.number === selected.value)!)

const HAT_FILL: Record<Hat, string> = {
  white: 'var(--cq-hat-white)',
  black: 'var(--cq-hat-black)',
  neutral: 'var(--cq-hat-neutral)',
}

const GUIDE_RINGS = [0.2, 0.4, 0.6, 0.8]

// Corners of the outer octagon, for the spokes between wedges.
const corners = ringPoints(1)
</script>

<template>
  <div class="grid items-start gap-8 lg:grid-cols-[minmax(0,28rem)_minmax(0,1fr)] lg:gap-12" data-testid="octalysis">
    <div class="cq-sheet p-4">
      <svg
        :viewBox="`0 0 ${VIEW_SIZE} ${VIEW_SIZE}`"
        class="block h-auto w-full overflow-visible"
        role="img"
        aria-label="Octógono com os 8 impulsos do Octalysis, cada fatia preenchida conforme o uso no CodeQuest"
        data-testid="octalysis-svg"
      >
        <g
          v-for="item in CORES"
          :key="item.number"
          class="cursor-pointer"
          :data-testid="`octalysis-wedge-${item.number}`"
          @click="selected = item.number"
        >
          <polygon :points="toPoints(wedgePoints(item.number, 1))" fill="var(--cq-panel)" />
          <polygon
            :points="toPoints(wedgePoints(item.number, item.intensity / 5))"
            :fill="HAT_FILL[item.hat]"
            :opacity="item.number === selected ? 1 : 0.8"
          />
        </g>
        <polygon
          v-for="scale in GUIDE_RINGS"
          :key="scale"
          :points="toPoints(ringPoints(scale))"
          fill="none"
          stroke="var(--cq-line-strong)"
          stroke-width="1"
          opacity="0.25"
        />
        <line
          v-for="(corner, index) in corners"
          :key="index"
          :x1="VIEW_SIZE / 2"
          :y1="VIEW_SIZE / 2"
          :x2="corner[0]"
          :y2="corner[1]"
          stroke="var(--cq-line-strong)"
          stroke-width="1.5"
        />
        <polygon :points="toPoints(ringPoints(1))" fill="none" stroke="var(--cq-line-strong)" stroke-width="3" stroke-linejoin="round" />
        <polygon
          :points="toPoints(wedgePoints(selected, 1))"
          fill="none"
          stroke="var(--cq-ink)"
          stroke-width="5"
          stroke-linejoin="round"
        />
        <g
          v-for="item in CORES"
          :key="`n-${item.number}`"
          class="cursor-pointer"
          @click="selected = item.number"
        >
          <circle
            :cx="badgePoint(item.number)[0]"
            :cy="badgePoint(item.number)[1]"
            r="17"
            :fill="item.number === selected ? 'var(--cq-ink)' : 'var(--cq-panel)'"
            stroke="var(--cq-line-strong)"
            stroke-width="2"
          />
          <text
            :x="badgePoint(item.number)[0]"
            :y="badgePoint(item.number)[1] + 6"
            text-anchor="middle"
            font-size="18"
            font-weight="800"
            class="font-display"
            :fill="item.number === selected ? 'var(--cq-bg)' : 'var(--cq-ink)'"
          >{{ item.number }}</text>
        </g>
      </svg>
      <p class="mt-2 text-sm text-muted">Quanto mais cheia a fatia, mais o CodeQuest usa aquele impulso (escala de 1 a 5).</p>
      <ul class="mt-3 grid gap-1.5 text-sm" aria-label="Legenda dos chapéus">
        <li v-for="hat in (['white', 'black', 'neutral'] as const)" :key="hat" class="grid grid-cols-[1rem_minmax(0,1fr)] items-start gap-2">
          <i class="mt-1 inline-block h-4 w-4 border-2 border-line-strong" :style="{ background: HAT_FILL[hat] }" aria-hidden="true" />
          <span><b class="text-ink">{{ HAT_LABEL[hat] }}:</b> {{ HAT_NOTE[hat] }}</span>
        </li>
      </ul>
    </div>

    <div class="min-w-0">
      <ul class="mb-4 grid grid-flow-col grid-cols-2 grid-rows-4 gap-1.5" aria-label="Os 8 impulsos">
        <li v-for="item in CORES" :key="item.number">
          <button
            type="button"
            class="flex min-h-11 w-full items-center gap-2.5 border-2 px-2.5 py-1 text-left font-semibold leading-tight transition-colors"
            :class="item.number === selected
              ? 'border-ink bg-ink text-bg'
              : 'border-control bg-panel text-ink hover:bg-raised'"
            :aria-pressed="item.number === selected"
            :data-testid="`octalysis-core-${item.number}`"
            @click="selected = item.number"
          >
            <span
              class="cq-num grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 text-sm font-bold"
              :class="item.number === selected ? 'border-bg bg-badge text-on-badge' : 'border-line-strong bg-bg text-ink'"
              aria-hidden="true"
            >{{ item.number }}</span>
            <span>{{ item.short }}</span>
          </button>
        </li>
      </ul>

      <section class="cq-sheet grid gap-3 p-5" aria-live="polite" data-testid="octalysis-detail">
        <h3 class="flex items-center gap-3 font-display text-2xl font-bold">
          <span class="cq-num grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 border-line-strong bg-badge text-lg text-on-badge" aria-hidden="true">{{ core.number }}</span>
          <span><span class="sr-only">Impulso {{ core.number }}: </span>{{ core.name }}</span>
        </h3>
        <p class="flex flex-wrap gap-1.5">
          <span class="border-2 border-control bg-panel px-2 py-1 text-xs font-bold text-ink" data-testid="octalysis-hat">{{ HAT_LABEL[core.hat] }}</span>
          <span v-if="core.motivation" class="border-2 border-control bg-panel px-2 py-1 text-xs font-bold text-ink" data-testid="octalysis-motivation">{{ MOTIVATION_LABEL[core.motivation] }}</span>
        </p>
        <p class="text-lg leading-snug">{{ core.meaning }}</p>
        <p class="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-line pt-3 font-bold text-ink">
          <span>Uso no CodeQuest</span>
          <span class="inline-flex gap-1" aria-hidden="true">
            <i
              v-for="n in 5"
              :key="n"
              class="inline-block h-3 w-3 rounded-full border-2 border-line-strong"
              :class="n <= core.intensity ? 'bg-ink' : ''"
            />
          </span>
          <small class="font-normal text-muted" data-testid="octalysis-intensity">{{ core.intensity }} de 5</small>
        </p>
        <ul class="grid list-disc gap-1 pl-5" data-testid="octalysis-uses">
          <li v-for="use in core.uses" :key="use">{{ use }}</li>
        </ul>
      </section>
    </div>
  </div>
</template>
