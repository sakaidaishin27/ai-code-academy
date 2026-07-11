// verify.js — 証拠ペースト式バリデータ（quiz.js の置き換え）
//
// 思想: 「読んだ・見た」ではなく「実機で作って動かした証拠」を貼らせ、構造チェックで合否を出す。
//   - 判定は緩め（存在＋最低本数）に留める。厳密な正誤判定はしない（真のゲートは週1セッションの目視）。
//   - 静的サイトはユーザーのファイルシステムに触れないため、学習者が自分のClaude Codeで出した
//     出力（cat の結果 / フォルダツリー / /briefing の出力 など）を貼る前提。
//   - チューニングは各Rungの verify.checks（データ側）で行う。ロジックはここに集約。
//
// 公開API: verifyEvidence(spec, text) -> { passed, results, passedCount, total }
//
// checks の型:
//   { type:'contains',     value:'CLAUDE.md',            label:'...' , ci?:true }   部分一致（ci=大文字小文字無視・既定true）
//   { type:'regex',        pattern:'^##\\s',  flags:'m',  label:'...' }             正規表現に一致
//   { type:'minLines',     min:3,                          label:'...' }             空行を除く行数が min 以上
//   { type:'minChars',     min:40,                         label:'...' }             文字数が min 以上
//   { type:'headings',     min:2,                          label:'...' }             Markdown 見出し(##...)が min 個以上
//   { type:'keywordsAny',  values:['カレンダー','メール','TODO'], min:2, label:'...' } いずれか min 個以上を含む

'use strict'

function normalize(text) {
  return String(text == null ? '' : text)
}

function countNonEmptyLines(text) {
  return normalize(text).split(/\r?\n/).filter((l) => l.trim() !== '').length
}

function countHeadings(text) {
  const m = normalize(text).match(/^\s{0,3}#{1,6}\s+\S/gm)
  return m ? m.length : 0
}

function runCheck(check, text) {
  const t = normalize(text)
  switch (check.type) {
    case 'contains': {
      const ci = check.ci !== false
      const hay = ci ? t.toLowerCase() : t
      const needle = ci ? String(check.value).toLowerCase() : String(check.value)
      return hay.includes(needle)
    }
    case 'regex': {
      try {
        const re = new RegExp(check.pattern, check.flags || '')
        return re.test(t)
      } catch (_) { return false }
    }
    case 'minLines':
      return countNonEmptyLines(t) >= (check.min || 1)
    case 'minChars':
      return t.replace(/\s/g, '').length >= (check.min || 1)
    case 'headings':
      return countHeadings(t) >= (check.min || 1)
    case 'keywordsAny': {
      const ci = check.ci !== false
      const hay = ci ? t.toLowerCase() : t
      const vals = (check.values || [])
      const hit = vals.filter((v) => hay.includes(ci ? String(v).toLowerCase() : String(v))).length
      return hit >= (check.min || 1)
    }
    default:
      return false
  }
}

/**
 * @param {Object} spec  rung.verify = { instruction, checks:[...], passRule }
 *                       passRule: 'all'（既定）| { min: N }（N個以上の合格で可）
 * @param {String} text  学習者が貼った証跡テキスト
 */
export function verifyEvidence(spec, text) {
  const checks = (spec && spec.checks) || []
  const results = checks.map((c) => ({ label: c.label, ok: runCheck(c, text) }))
  const passedCount = results.filter((r) => r.ok).length
  const total = results.length

  let passed
  const rule = spec && spec.passRule
  if (rule && typeof rule === 'object' && typeof rule.min === 'number') {
    passed = passedCount >= rule.min
  } else {
    passed = total > 0 ? passedCount === total : false
  }
  // 空貼り付けは常に不合格
  if (normalize(text).trim() === '') passed = false

  return { passed, results, passedCount, total }
}
