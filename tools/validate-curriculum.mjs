// tools/validate-curriculum.mjs
// カリキュラムデータの構造検証。番号振り直しやID衝突を機械的に検出する。
// 実行: node tools/validate-curriculum.mjs
// （このリポジトリはビルド無しの静的サイト。curriculum は純データなので Node ESM で直接 import できる）

import { COURSES } from '../js/curriculum.js'

const EXPECTED_CHAPTERS = 20
const KNOWN_CHECK_TYPES = new Set(['contains', 'regex', 'minLines', 'minChars', 'headings', 'keywordsAny'])
const LESSON_TYPES = new Set(['lecture', 'practice', 'submit'])

const errors = []
const warn = []
const chapterIds = new Map() // id -> where
const lessonIds = new Map()
const nos = []

let chapterCount = 0

for (const course of COURSES) {
  if (!course.id || !course.level || !course.name) errors.push(`course 欠損フィールド: ${JSON.stringify(course.id)}`)
  if (!course.cert || !course.cert.title) errors.push(`course ${course.id}: cert.title 欠損`)
  if (!Array.isArray(course.chapters)) { errors.push(`course ${course.id}: chapters が配列でない`); continue }

  for (const ch of course.chapters) {
    chapterCount++
    const where = `${course.id}/${ch.id}`
    if (!ch.id) errors.push(`${where}: 章id 欠損`)
    if (chapterIds.has(ch.id)) errors.push(`章id 重複: ${ch.id}（${chapterIds.get(ch.id)} と ${where}）`)
    else chapterIds.set(ch.id, where)

    if (typeof ch.no !== 'number') errors.push(`${where}: no が数値でない (${ch.no})`)
    else nos.push({ no: ch.no, where })
    if (!ch.title) errors.push(`${where}: title 欠損`)
    if (!ch.goal) warn.push(`${where}: goal 欠損（推奨）`)
    if (typeof ch.ready !== 'boolean') errors.push(`${where}: ready が真偽値でない`)
    if (!Array.isArray(ch.lessons) || ch.lessons.length === 0) { errors.push(`${where}: lessons が空`); continue }

    let hasSubmit = false
    for (const l of ch.lessons) {
      const lw = `${where}/${l.id}`
      if (!l.id) errors.push(`${lw}: レッスンid 欠損`)
      if (lessonIds.has(l.id)) errors.push(`レッスンid 重複: ${l.id}（${lessonIds.get(l.id)} と ${lw}）`)
      else lessonIds.set(l.id, lw)

      if (!LESSON_TYPES.has(l.type)) errors.push(`${lw}: 不明な type "${l.type}"`)
      if (!l.title) errors.push(`${lw}: title 欠損`)

      if (l.type === 'lecture' && !l.body) errors.push(`${lw}: lecture に body が無い`)
      if (l.type === 'practice' && !l.prompt) errors.push(`${lw}: practice に prompt が無い`)

      if (l.type === 'submit') {
        hasSubmit = true
        // verify
        if (!l.verify || !Array.isArray(l.verify.checks) || l.verify.checks.length === 0) {
          errors.push(`${lw}: submit の verify.checks が無い/空`)
        } else {
          for (const c of l.verify.checks) {
            if (!KNOWN_CHECK_TYPES.has(c.type)) errors.push(`${lw}: 未知の check type "${c.type}"`)
          }
          const pr = l.verify.passRule
          if (pr && pr.min != null && pr.min > l.verify.checks.length) {
            errors.push(`${lw}: passRule.min(${pr.min}) が checks数(${l.verify.checks.length})を超えている`)
          }
        }
        // quiz
        if (!Array.isArray(l.quiz) || l.quiz.length === 0) {
          errors.push(`${lw}: submit の quiz が無い/空`)
        } else {
          l.quiz.forEach((q, i) => {
            if (!q.q) errors.push(`${lw} quiz[${i}]: 設問文 q 欠損`)
            if (!Array.isArray(q.choices) || q.choices.length < 2) errors.push(`${lw} quiz[${i}]: choices が2未満`)
            if (typeof q.answerIndex !== 'number' || q.answerIndex < 0 || (q.choices && q.answerIndex >= q.choices.length)) {
              errors.push(`${lw} quiz[${i}]: answerIndex(${q.answerIndex}) が範囲外`)
            }
            if (!q.explanation) warn.push(`${lw} quiz[${i}]: explanation 欠損（推奨）`)
          })
        }
      }
    }
    if (ch.ready && !hasSubmit) errors.push(`${where}: ready:true なのに submit（関門）が無い`)
  }
}

// 章数
if (chapterCount !== EXPECTED_CHAPTERS) errors.push(`章数が ${chapterCount}（期待 ${EXPECTED_CHAPTERS}）`)

// no: が 0..N-1 の連番（コース横断で昇順・重複/欠番なし）
const sorted = nos.map((x) => x.no).sort((a, b) => a - b)
for (let i = 0; i < sorted.length; i++) {
  if (sorted[i] !== i) { errors.push(`no の連番が崩れている: 位置${i} に ${sorted[i]}（0..${sorted.length - 1} の連番であるべき）`); break }
}

// 出力
console.log(`章数: ${chapterCount} / レッスン数: ${lessonIds.size} / 章id: ${chapterIds.size}`)
if (warn.length) { console.log(`\n警告 (${warn.length}):`); warn.forEach((w) => console.log('  - ' + w)) }
if (errors.length) {
  console.log(`\nエラー (${errors.length}):`)
  errors.forEach((e) => console.log('  x ' + e))
  console.log('\nFAIL')
  process.exit(1)
}
console.log('\nPASS: 構造チェック全項目クリア')
