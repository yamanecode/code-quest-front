// Mirror of the template rules (spec §4.1), only for live feedback while the professor types.
// The backend validates every save and publish and stays the authority.

import type { FormState } from './challengeForm'

function count(label: string, total: number, min: number, max: number): string | null {
  return total < min || total > max ? `${label}: use de ${min} a ${max} (agora há ${total}).` : null
}

function textProblems(label: string, raw: string[], max: number): string[] {
  const texts = raw.map((text) => text.trim())
  const problems: string[] = []
  if (texts.some((text) => text.length < 1 || text.length > max)) {
    problems.push(`${label}: cada texto precisa ter de 1 a ${max} caracteres.`)
  }
  const filled = texts.filter((text) => text.length > 0)
  if (new Set(filled).size !== filled.length) problems.push(`${label}: os textos não podem se repetir.`)
  return problems
}

export function validateForm(form: FormState): string[] {
  const errors: string[] = []
  const add = (...messages: (string | null)[]) => {
    for (const message of messages) if (message) errors.push(message)
  }

  const title = form.title.trim()
  const statement = form.statement.trim()
  if (title.length < 1 || title.length > 80) add('O título precisa ter de 1 a 80 caracteres.')
  if (statement.length < 20 || statement.length > 600) add('O enunciado precisa ter de 20 a 600 caracteres.')
  if (form.explanation.trim().length > 400) add('A explicação pode ter no máximo 400 caracteres.')

  switch (form.type) {
    case 'ordering':
      add(count('Passos', form.items.length, 3, 8), ...textProblems('Passos', form.items.map((i) => i.text), 120))
      break
    case 'grouping': {
      add(
        count('Etapas', form.groups.length, 2, 4),
        count('Tarefas', form.items.length, 4, 10),
        ...textProblems('Etapas', form.groups.map((g) => g.text), 120),
        ...textProblems('Tarefas', form.items.map((i) => i.text), 120),
      )
      const groupIds = form.groups.map((group) => group.id)
      const assigned = form.items.map((item) => form.assignment[item.id] ?? '')
      if (assigned.some((group) => !groupIds.includes(group))) add('Escolha a etapa de todas as tarefas.')
      else if (groupIds.some((id) => !assigned.includes(id))) add('Toda etapa precisa ter pelo menos uma tarefa.')
      break
    }
    case 'filtering': {
      const question = form.question.trim()
      if (question.length < 10 || question.length > 200) add('A pergunta precisa ter de 10 a 200 caracteres.')
      add(count('Informações', form.items.length, 4, 10), ...textProblems('Informações', form.items.map((i) => i.text), 120))
      const relevant = form.items.filter((item) => form.relevant.includes(item.id)).length
      if (relevant < 1) add('Marque pelo menos uma informação relevante.')
      else if (relevant === form.items.length) add('Deixe pelo menos uma informação irrelevante.')
      break
    }
    case 'pattern': {
      add(count('Sequência', form.sequence.length, 3, 8), count('Opções', form.options.length, 4, 5))
      if (form.sequence.some((term) => term.trim().length < 1 || term.trim().length > 40)) {
        add('Sequência: cada termo precisa ter de 1 a 40 caracteres.')
      }
      add(...textProblems('Opções', form.options.map((o) => o.text), 40))
      if (!form.options.some((option) => option.id === form.correct)) add('Marque a opção correta.')
      break
    }
  }
  return errors
}
