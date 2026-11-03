// Varied answer feedback (spec §9.2): one message picked at random per answer.

export const CORRECT_MESSAGES: readonly string[] = [
  'Mandou bem! Raciocínio certeiro.',
  'Isso mesmo! Você resolveu.',
  'Resposta certa! Continue assim.',
  'Excelente! Você encontrou a solução.',
  'Perfeito! Seu pensamento está afiado.',
  'Acertou! Esse foi bem pensado.',
]

export const WRONG_MESSAGES: readonly string[] = [
  'Ainda não. Que tal olhar de novo com calma?',
  'Quase! Revise sua resposta e tente outra vez.',
  'Não foi dessa vez, mas errar faz parte de aprender.',
  'Hmm, algo não encaixou. Tente de novo.',
  'Ainda não está certo. Você consegue!',
  'Resposta incorreta. Repense um passo de cada vez.',
]

export function pickMessage(messages: readonly string[], random: () => number = Math.random): string {
  const index = Math.min(Math.floor(random() * messages.length), messages.length - 1)
  return messages[index]!
}

// Headline of the result dialog, by the XP of the first solve (10 / 5 / 2, spec §5).
export function resultHeadline(xpEarned: number): string {
  if (xpEarned >= 10) return 'Primeira tentativa!'
  if (xpEarned >= 5) return 'Muito bem!'
  if (xpEarned > 0) return 'Conseguiu!'
  return 'Resposta certa!'
}
