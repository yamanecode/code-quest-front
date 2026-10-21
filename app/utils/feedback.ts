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
