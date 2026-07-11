// quiz.js — ミニテスト採点・形成的評価ロジック（hoshigane-academy から移植・汎用化）
// 合格基準: 問題数に応じて可変（既定 = 全問数 - 1 以上。3問なら2問以上で合格）。
// 不合格時は間違えた問題ごとに backTo（差し戻し先）を返す。
// ES module。app.js から import して使う。

'use strict'

/** 合格ライン（正解数）を返す。quizLen=3 → 2、5 → 4。最低1。 */
export function passThreshold(quizLen) {
  return Math.max(1, quizLen - 1)
}

/**
 * 採点する。
 * @param {Array} quiz    [{q, choices, answerIndex, explanation, backTo}]
 * @param {Array} answers ユーザーの回答（各問の選択index。未回答は null）
 */
export function grade(quiz, answers) {
  const total = quiz.length
  const results = quiz.map((item, i) => {
    const picked = (answers && answers[i] != null) ? answers[i] : null
    const isCorrect = picked === item.answerIndex
    return {
      index: i,
      question: item.q,
      choices: item.choices,
      picked,
      answerIndex: item.answerIndex,
      isCorrect,
      explanation: item.explanation,
      backTo: item.backTo,
    }
  })
  const correctCount = results.filter((r) => r.isCorrect).length
  const percent = total ? Math.round((correctCount / total) * 100) : 0
  const threshold = passThreshold(total)
  const passed = correctCount >= threshold
  const wrong = results.filter((r) => !r.isCorrect)
  return { total, correctCount, percent, passed, threshold, results, wrong }
}

/** 全問回答済みか */
export function allAnswered(quiz, answers) {
  if (!answers) return false
  for (let i = 0; i < quiz.length; i++) {
    if (answers[i] == null) return false
  }
  return true
}

/** 回答済み数 */
export function answeredCount(answers) {
  if (!answers) return 0
  return answers.filter((a) => a != null).length
}
