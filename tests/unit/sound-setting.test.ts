import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useSettingsStore } from '~/stores/settings'

// A new store reads localStorage again, as after a page reload.
function freshStore() {
  setActivePinia(createPinia())
  return useSettingsStore()
}

beforeEach(() => {
  localStorage.clear()
})

describe('sound setting', () => {
  it('T-FE-SOUND-01 sound is off on a first visit', () => {
    expect(freshStore().muted).toBe(true)
  })

  it('T-FE-SOUND-02 turning the sound on is remembered; any other saved value means muted', () => {
    freshStore().setMuted(false)
    expect(localStorage.getItem('cq-muted')).toBe('false')
    expect(freshStore().muted).toBe(false)

    freshStore().setMuted(true)
    expect(localStorage.getItem('cq-muted')).toBe('true')
    expect(freshStore().muted).toBe(true)

    localStorage.setItem('cq-muted', 'unexpected')
    expect(freshStore().muted).toBe(true)
  })
})
