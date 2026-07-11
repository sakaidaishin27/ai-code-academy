// app.js — SPA本体（能力ラダー×ビルド階梯・アンロック・証拠ペースト式ゲート・L1修了証）
// ES module。brand/core/applied/verify/auth を import。ビルドなし。
//
// ルート: #/dashboard, #/step/<id>, #/cert
// 進捗: localStorage（キー aca_progress）。合格したら次の関門がアンロック。
// 講師オーバーライド: URLに ?instructor=1 を付けると全関門を開ける（詰まり救済用）。

import { BRAND } from './brand.js'
import { CORE_TRACK } from './core.js'
import { APPLIED_TRACK } from './applied.js'
import { verifyEvidence } from './verify.js'
import { requireLogin, logout } from './auth.js'

const STORAGE_KEY = 'aca_progress'
const app = document.getElementById('app')

/* ----------------------------- ユーティリティ ----------------------------- */
function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}
function todayStr() {
  const d = new Date()
  const m = ('0' + (d.getMonth() + 1)).slice(-2)
  const day = ('0' + d.getDate()).slice(-2)
  return d.getFullYear() + '-' + m + '-' + day
}
function fmtDate(s) {
  if (!s) return ''
  const p = s.split('-')
  if (p.length !== 3) return s
  return p[0] + '年' + parseInt(p[1], 10) + '月' + parseInt(p[2], 10) + '日'
}
function isInstructor() {
  return new URLSearchParams(window.location.search).get('instructor') === '1'
}

/* ----------------------------- 学習パス構築 ----------------------------- */
// コアの順序に、応用トラックのヒーロー（ready）を insertAfter の直後に差し込む。
// 応用の残り（準備中）はダッシュボード下部の別セクションに出す（コアの関門は塞がない）。
function buildPath() {
  const path = []
  const appliedReady = APPLIED_TRACK.rungs.filter((r) => r.ready)
  const insertAfter = APPLIED_TRACK.insertAfter
  CORE_TRACK.rungs.forEach((r) => {
    path.push({ ...r, track: 'core' })
    if (r.id === insertAfter) {
      appliedReady.forEach((a) => path.push({ ...a, track: 'applied' }))
    }
  })
  return path
}
const PATH = buildPath()
const APPLIED_EXTRA = APPLIED_TRACK.rungs.filter((r) => !r.ready) // 準備中の応用（別枠表示）

function stepById(id) {
  return PATH.find((s) => s.id === id) ||
    APPLIED_EXTRA.map((r) => ({ ...r, track: 'applied' })).find((s) => s.id === id) || null
}

/* ----------------------------- 進捗ストア ----------------------------- */
function loadProgress() {
  let raw = null
  try { raw = localStorage.getItem(STORAGE_KEY) } catch (_) { raw = null }
  if (!raw) return {}
  try { const p = JSON.parse(raw); return (p && typeof p === 'object') ? p : {} } catch (_) { return {} }
}
function saveProgress(state) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)) } catch (_) {}
}
function isPassed(id) { return !!loadProgress()[id] }
function markPassed(id, evidence) {
  const state = loadProgress()
  state[id] = { status: 'passed', date: todayStr(), evidence: String(evidence || '').slice(0, 4000) }
  saveProgress(state)
}
function resetProgress() {
  try { localStorage.removeItem(STORAGE_KEY) } catch (_) {}
}

// ある ready ステップがアンロック済みか（直前の ready ステップが合格しているか）
function isUnlocked(index) {
  if (isInstructor()) return true
  // 直前の ready ステップを探す
  for (let j = index - 1; j >= 0; j--) {
    if (PATH[j].ready) return isPassed(PATH[j].id)
  }
  return true // 最初の ready ステップ
}
function statusOf(index) {
  const s = PATH[index]
  if (!s.ready) return 'soon'          // 準備中
  if (isPassed(s.id)) return 'passed'  // 合格
  return isUnlocked(index) ? 'open' : 'locked'
}

/* ----------------------------- ラダー可視化 ----------------------------- */
function reachedLevels() {
  // どのレベルまで「合格ステップ」が到達したか
  const passedLevels = PATH.filter((s) => s.ready && isPassed(s.id)).map((s) => s.level)
  return passedLevels
}
function ladderHtml() {
  // L1到達 = コアの rung0..rung3 が全て合格
  const l1Ids = ['rung0', 'rung1', 'rung2', 'rung3']
  const l1Done = l1Ids.every((id) => isPassed(id))
  const cols = BRAND.ladder.map((lv, i) => {
    let cls = 'ladder-step'
    if (lv.level === 'L1' && l1Done) cls += ' reached'
    // L1未達なら以降はこれから
    return (
      '<div class="' + cls + '">' +
        '<div class="ladder-badge">' + esc(lv.level) + '</div>' +
        '<div class="ladder-name">' + esc(lv.name) + '</div>' +
        '<div class="ladder-note">' + esc(lv.note) + '</div>' +
      '</div>'
    )
  }).join('<div class="ladder-arrow" aria-hidden="true">›</div>')
  return (
    '<div class="ladder">' +
      '<div class="ladder-track">' + cols + '</div>' +
      '<p class="ladder-goal">到達点（L4）＝ <strong>' + esc(BRAND.goalLabel) + '</strong></p>' +
    '</div>'
  )
}

/* ----------------------------- ダッシュボード ----------------------------- */
function progressStats() {
  const ready = PATH.filter((s) => s.ready)
  const done = ready.filter((s) => isPassed(s.id)).length
  return { done, total: ready.length }
}

function stepCard(s, index) {
  const st = statusOf(index)
  const levelTag = '<span class="tag tag-level">' + esc(s.level) + '</span>'
  const trackTag = s.track === 'applied'
    ? '<span class="tag tag-applied">応用</span>' : '<span class="tag tag-core">コア</span>'
  let statusBadge, action
  if (st === 'passed') {
    statusBadge = '<span class="st-badge st-passed">合格</span>'
    action = '<a class="btn btn-outline btn-sm" href="#/step/' + s.id + '">見直す</a>'
  } else if (st === 'open') {
    statusBadge = '<span class="st-badge st-open">挑戦できます</span>'
    action = '<a class="btn btn-sm" href="#/step/' + s.id + '">この関門に挑む</a>'
  } else if (st === 'soon') {
    statusBadge = '<span class="st-badge st-soon">準備中</span>'
    action = '<a class="btn btn-ghost btn-sm" href="#/step/' + s.id + '">中身を見る</a>'
  } else {
    statusBadge = '<span class="st-badge st-locked">未開放</span>'
    action = '<span class="lock-note">前の関門に合格すると開きます</span>'
  }
  const num = ('0' + (index + 1)).slice(-2)
  return (
    '<article class="step-card ' + st + '">' +
      '<div class="step-top">' +
        '<span class="step-no">STEP ' + num + '</span>' +
        '<span class="tags">' + levelTag + trackTag + '</span>' +
      '</div>' +
      '<h3 class="step-title">' + esc(s.title) + '</h3>' +
      '<p class="step-goal">' + esc(s.goal) + '</p>' +
      '<div class="step-foot">' + statusBadge + action + '</div>' +
    '</article>'
  )
}

function renderDashboard(session) {
  const stats = progressStats()
  const l1Done = ['rung0', 'rung1', 'rung2', 'rung3'].every((id) => isPassed(id))

  const coreCards = PATH.map((s, i) => stepCard(s, i)).join('')

  const extraCards = APPLIED_EXTRA.map((s) => (
    '<article class="step-card soon">' +
      '<div class="step-top"><span class="step-no">応用</span>' +
        '<span class="tags"><span class="tag tag-level">' + esc(s.level) + '</span>' +
        '<span class="tag tag-applied">花屋</span></span></div>' +
      '<h3 class="step-title">' + esc(s.title) + '</h3>' +
      '<p class="step-goal">' + esc(s.goal) + '</p>' +
      '<div class="step-foot"><span class="st-badge st-soon">準備中</span>' +
        '<a class="btn btn-ghost btn-sm" href="#/step/' + s.id + '">中身を見る</a></div>' +
    '</article>'
  )).join('')

  const certCta = l1Done
    ? '<a class="btn btn-gold" href="#/cert">L1 修了証を見る</a>'
    : '<span class="cert-hint">STEP 01〜04（L1）に合格すると、修了証が発行できます。</span>'

  app.innerHTML =
    '<section class="view">' +
      '<div class="hero">' +
        '<p class="hero-kicker">' + esc(BRAND.siteNameEn) + '</p>' +
        '<h1 class="hero-title">' + esc(BRAND.tagline) + '</h1>' +
        '<p class="hero-sub">' + esc(BRAND.subTagline) + '</p>' +
        '<div class="hero-stat">進捗 <strong>' + stats.done + '</strong> / ' + stats.total + ' 関門クリア' +
          (isInstructor() ? ' <span class="inst-flag">講師モード（全関門開放中）</span>' : '') + '</div>' +
      '</div>' +
      ladderHtml() +
      '<div class="section-head"><p class="section-label">あなたの道場（学習の道すじ）</p>' + certCta + '</div>' +
      '<div class="step-grid">' + coreCards + '</div>' +
      (extraCards ?
        '<p class="section-label mt">応用トラック（花屋の実務・順次公開）</p>' +
        '<div class="step-grid">' + extraCards + '</div>' : '') +
    '</section>'
}

/* ----------------------------- ステップ（Rung）画面 ----------------------------- */
function renderStep(id, session) {
  const idx = PATH.findIndex((s) => s.id === id)
  const s = idx >= 0 ? PATH[idx] : stepById(id)
  if (!s) return renderNotFound()

  // 未開放を直接開いた場合
  if (idx >= 0 && statusOf(idx) === 'locked') {
    app.innerHTML =
      '<section class="view">' +
        crumb(s.title) +
        '<div class="notice">この関門はまだ開いていません。前の関門に合格すると挑戦できます。</div>' +
        '<div class="btn-row"><a class="btn" href="#/dashboard">道場に戻る</a></div>' +
      '</section>'
    return
  }

  // 準備中
  if (!s.ready) {
    app.innerHTML =
      '<section class="view">' +
        crumb(s.title) +
        '<h1 class="page-title">' + esc(s.title) + '</h1>' +
        '<p class="page-sub">' + esc(s.goal) + '</p>' +
        conceptCard(s) +
        '<div class="soon-box">この関門の実習は準備中です。セッションで一緒に組み立てていきます。' +
          '上の「概念」と、リンク先のガイドだけ先に読んでおくと理解が早まります。</div>' +
        '<div class="btn-row"><a class="btn btn-ghost" href="#/dashboard">道場に戻る</a></div>' +
      '</section>'
    bindReadLinks()
    return
  }

  const passed = isPassed(s.id)
  const buildPrompt = s.build && s.build.prompt ? s.build.prompt : ''

  app.innerHTML =
    '<section class="view">' +
      crumb(s.title) +
      '<div class="step-head">' +
        '<span class="tag tag-level">' + esc(s.level) + '</span>' +
        '<h1 class="page-title">' + esc(s.title) + '</h1>' +
      '</div>' +
      '<p class="page-sub">' + esc(s.goal) + '</p>' +

      // 1. 概念カード
      conceptCard(s) +

      // 2. ビルドタスク
      '<div class="part">' +
        '<div class="part-label"><span class="part-no">2</span> やってみる（自分のClaude Codeで手を動かす）</div>' +
        '<p class="part-intro">' + esc(s.build.intro) + '</p>' +
        (buildPrompt ?
          '<div class="prompt-box">' +
            '<div class="prompt-bar"><span>コピーして、自分のClaude Codeに貼ってください</span>' +
              '<button class="copy-btn" id="copyPrompt">コピー</button></div>' +
            '<pre class="prompt-pre" id="promptText">' + esc(buildPrompt) + '</pre>' +
          '</div>' : '') +
      '</div>' +

      // 3. 検証ペースト（証拠ゲート）
      '<div class="part">' +
        '<div class="part-label"><span class="part-no">3</span> 証拠を貼って関門を開ける</div>' +
        '<p class="part-intro">' + esc(s.verify.instruction) + '</p>' +
        '<textarea class="evidence" id="evidence" placeholder="ここに、自分のClaude Codeで出た結果を貼り付けます">' +
          (passed ? esc((loadProgress()[s.id] || {}).evidence || '') : '') + '</textarea>' +
        '<div class="verify-bar">' +
          '<button class="btn btn-green" id="verifyBtn">証拠を判定する</button>' +
          (isInstructor() ? '<button class="btn btn-outline btn-sm" id="overrideBtn">講師: この関門を開ける</button>' : '') +
        '</div>' +
        '<div id="verifyResult" class="verify-result">' + (passed ? passedBanner() : '') + '</div>' +
      '</div>' +

      // 4. 宿題
      (s.homework ?
        '<div class="part homework">' +
          '<div class="part-label"><span class="part-no">4</span> 次までの宿題</div>' +
          '<p>' + esc(s.homework) + '</p>' +
        '</div>' : '') +

      navRow(idx) +
    '</section>'

  bindReadLinks()
  bindCopy(buildPrompt)
  bindVerify(s, idx)
}

function conceptCard(s) {
  const link = s.concept.readLink
  return (
    '<div class="part concept">' +
      '<div class="part-label"><span class="part-no">1</span> まず理解する（読む）</div>' +
      '<p class="concept-summary">' + esc(s.concept.summary) + '</p>' +
      '<div class="analogy">たとえ話：<strong>' + esc(s.concept.analogy) + '</strong></div>' +
      (link ? '<a class="read-link" href="' + esc(link.href) + '" target="_blank" rel="noopener">' +
        esc(link.label) + ' を読む（別タブ）</a>' : '') +
    '</div>'
  )
}
function passedBanner() {
  return '<div class="vr-pass">合格。この関門は開きました。次の関門に進めます。</div>'
}
function crumb(title) {
  return '<div class="breadcrumb"><a href="#/dashboard">道場</a> › ' + esc(title) + '</div>'
}
function navRow(idx) {
  let prevId = null, nextId = null
  for (let j = idx - 1; j >= 0; j--) { if (PATH[j].ready) { prevId = PATH[j].id; break } }
  for (let j = idx + 1; j < PATH.length; j++) { if (PATH[j].ready) { nextId = PATH[j].id; break } }
  const prev = prevId ? '<a class="btn btn-ghost btn-sm" href="#/step/' + prevId + '">← 前の関門</a>' : '<span></span>'
  const dash = '<a class="btn btn-ghost btn-sm" href="#/dashboard">道場に戻る</a>'
  let next = '<span></span>'
  if (nextId) {
    const nextIdx = PATH.findIndex((s) => s.id === nextId)
    const open = statusOf(nextIdx) !== 'locked'
    next = open
      ? '<a class="btn btn-sm" href="#/step/' + nextId + '">次の関門 →</a>'
      : '<span class="lock-note">次は合格後に開きます</span>'
  }
  return '<div class="nav-row">' + prev + dash + next + '</div>'
}

function bindReadLinks() { /* target=_blank のみ。将来フック用に予約 */ }

function bindCopy(text) {
  const btn = document.getElementById('copyPrompt')
  if (!btn) return
  btn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(text)
      btn.textContent = 'コピーしました'
    } catch (_) {
      // フォールバック: テキスト選択
      const pre = document.getElementById('promptText')
      if (pre) {
        const range = document.createRange()
        range.selectNodeContents(pre)
        const sel = window.getSelection()
        sel.removeAllRanges(); sel.addRange(range)
        try { document.execCommand('copy'); btn.textContent = 'コピーしました' } catch (e) { btn.textContent = '手動で選択してコピー' }
      }
    }
    setTimeout(() => { btn.textContent = 'コピー' }, 2000)
  })
}

function bindVerify(s, idx) {
  const btn = document.getElementById('verifyBtn')
  const out = document.getElementById('verifyResult')
  const ta = document.getElementById('evidence')
  if (btn && out && ta) {
    btn.addEventListener('click', () => {
      const res = verifyEvidence(s.verify, ta.value)
      const rows = res.results.map((r) =>
        '<li class="' + (r.ok ? 'ok' : 'ng') + '"><span class="ck-mark">' + (r.ok ? '合格' : '未達') + '</span>' +
        esc(r.label) + '</li>').join('')
      if (res.passed) {
        markPassed(s.id, ta.value)
        out.innerHTML =
          '<ul class="ck-list">' + rows + '</ul>' + passedBanner() +
          navRow(idx)
      } else {
        const link = s.concept.readLink
        out.innerHTML =
          '<ul class="ck-list">' + rows + '</ul>' +
          '<div class="vr-fail">まだ足りない項目があります（' + res.passedCount + ' / ' + res.total + '）。' +
            'もう一度「1. 理解する」を読み直し、手を動かした結果を貼り直してください。' +
            (link ? ' <a href="' + esc(link.href) + '" target="_blank" rel="noopener">該当ガイドを開く</a>' : '') +
          '</div>'
      }
      out.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    })
  }
  const ov = document.getElementById('overrideBtn')
  if (ov) {
    ov.addEventListener('click', () => {
      markPassed(s.id, ta ? ta.value : '(講師オーバーライド)')
      if (out) { out.innerHTML = passedBanner() + navRow(idx) }
    })
  }
}

/* ----------------------------- 修了証（L1） ----------------------------- */
function renderCert(session) {
  const l1Ids = ['rung0', 'rung1', 'rung2', 'rung3']
  const done = l1Ids.every((id) => isPassed(id))
  if (!done) {
    app.innerHTML =
      '<section class="view">' + crumb('修了証') +
        '<div class="notice">L1（STEP 01〜04）にすべて合格すると、修了証を発行できます。</div>' +
        '<div class="btn-row"><a class="btn" href="#/dashboard">道場に戻る</a></div>' +
      '</section>'
    return
  }
  const name = (session && session.name) || '受講生'
  const dates = l1Ids.map((id) => (loadProgress()[id] || {}).date).filter(Boolean).sort()
  const date = fmtDate(dates[dates.length - 1] || todayStr())
  app.innerHTML =
    '<section class="view">' + crumb('修了証') +
      '<div class="cert-stage"><div class="certificate">' +
        '<div class="cert-kicker">CERTIFICATE OF COMPLETION</div>' +
        '<div class="cert-title">L1 修了証</div>' +
        '<div class="cert-rule"></div>' +
        '<p class="cert-lead">下記の者は</p>' +
        '<div class="cert-name">' + esc(name) + '</div>' +
        '<p class="cert-body">' + esc(BRAND.siteName) + ' の L1 課程<br>' +
          '「毎日AIを使える」までの4つの関門を、実際に手を動かして通過したことを証します。</p>' +
        '<div class="cert-meta"><div>修了日<span class="cm-val">' + date + '</span></div></div>' +
        '<div class="cert-footer"><div class="cert-org">' +
          '<div class="cert-org-name">' + esc(BRAND.siteName) + '</div>' +
          '<div class="cert-org-sub">' + esc(BRAND.siteNameEn) + '</div></div>' +
          '<div class="cert-seal"><span class="seal-mark">' + esc(BRAND.mark) + '</span><span class="seal-text">認 定</span></div>' +
        '</div>' +
      '</div></div>' +
      '<div class="btn-row" style="justify-content:center;"><a class="btn" href="#/dashboard">道場に戻る</a></div>' +
    '</section>'
}

function renderNotFound() {
  app.innerHTML =
    '<section class="view"><div class="notice">お探しのページが見つかりませんでした。</div>' +
    '<div class="btn-row"><a class="btn" href="#/dashboard">道場に戻る</a></div></section>'
}

/* ----------------------------- ルーター ----------------------------- */
let SESSION = null
function router() {
  const hash = (location.hash || '').replace(/^#/, '')
  if (!hash || hash === '/') { location.hash = '#/dashboard'; return }
  const parts = hash.replace(/^\//, '').split('/')
  const route = parts[0], arg = parts[1]
  switch (route) {
    case 'dashboard': renderDashboard(SESSION); break
    case 'step': renderStep(arg, SESSION); break
    case 'cert': renderCert(SESSION); break
    default: renderNotFound()
  }
  window.scrollTo(0, 0)
}

/* ----------------------------- ヘッダー配線 ----------------------------- */
function bindHeader(session) {
  const nameEl = document.getElementById('learnerName')
  if (nameEl) nameEl.textContent = session.name || '受講生'
  const logoutLink = document.getElementById('logoutLink')
  if (logoutLink) logoutLink.addEventListener('click', (e) => { e.preventDefault(); logout() })
  const resetLink = document.getElementById('resetLink')
  if (resetLink) resetLink.addEventListener('click', (e) => {
    e.preventDefault()
    if (window.confirm('学習の進捗（合格記録）をすべて消して、最初からにします。よろしいですか？')) {
      resetProgress()
      location.hash = '#/dashboard'
      router()
    }
  })
}

/* ----------------------------- 起動 ----------------------------- */
async function boot() {
  const session = await requireLogin()
  if (!session) return // login.html へリダイレクト済み
  SESSION = session
  bindHeader(session)
  window.addEventListener('hashchange', router)
  router()
}
boot()
