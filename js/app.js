// app.js — SPA本体（オンラインスクール型: コース → 章 → レッスン）
// ルート: #/dashboard, #/course/<id>, #/chapter/<id>, #/lesson/<id>, #/cert/<courseId>
// 章クリア = submitレッスンの「証拠合格 + ミニテスト合格」の両方（AND）。
// 進捗: localStorage（aca_progress_v2）。講師モード: URLに ?instructor=1。

import { BRAND } from './brand.js'
import { COURSES, findCourse, findChapter, findLesson, chapterSequence } from './curriculum.js'
import { verifyEvidence } from './verify.js'
import * as Quiz from './quiz.js'
import { requireLogin, logout } from './auth.js'

const STORAGE_KEY = 'aca_progress_v2'
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
function qsSuffix() {
  return isInstructor() ? '?instructor=1' : ''
}
// ハッシュ遷移（instructorクエリを維持）
function href(hash) {
  return window.location.pathname + qsSuffix() + '#' + hash
}

/* ----------------------------- 進捗ストア ----------------------------- */
function loadP() {
  let raw = null
  try { raw = localStorage.getItem(STORAGE_KEY) } catch (_) {}
  if (!raw) return { lessons: {}, chapters: {} }
  try {
    const p = JSON.parse(raw)
    return { lessons: p.lessons || {}, chapters: p.chapters || {} }
  } catch (_) { return { lessons: {}, chapters: {} } }
}
function saveP(p) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(p)) } catch (_) {}
}
function lessonDone(id) { return !!loadP().lessons[id] }
function markLessonDone(id) {
  const p = loadP()
  p.lessons[id] = { done: 1, date: todayStr() }
  saveP(p)
}
function chState(chapterId) {
  return loadP().chapters[chapterId] || {}
}
function setChState(chapterId, patch) {
  const p = loadP()
  p.chapters[chapterId] = Object.assign({}, p.chapters[chapterId] || {}, patch, { date: todayStr() })
  saveP(p)
}
function resetProgress() {
  try { localStorage.removeItem(STORAGE_KEY) } catch (_) {}
}

/* ----------------------------- 状態判定 ----------------------------- */
function chapterCleared(ch) {
  if (!ch.ready) return false
  const s = chState(ch.id)
  return !!(s.submitPassed && s.quizPassed)
}
// 章の状態: 'soon'（準備中・常時閲覧可）/ 'cleared' / 'open' / 'locked'
function chapterStatus(chapterId) {
  const seq = chapterSequence()
  const idx = seq.findIndex((x) => x.chapter.id === chapterId)
  if (idx < 0) return 'locked'
  const ch = seq[idx].chapter
  if (!ch.ready) return 'soon'
  if (chapterCleared(ch)) return 'cleared'
  if (isInstructor()) return 'open'
  // 直前の ready 章がクリア済みなら open
  for (let j = idx - 1; j >= 0; j--) {
    if (seq[j].chapter.ready) return chapterCleared(seq[j].chapter) ? 'open' : 'locked'
  }
  return 'open' // 最初のready章
}
function courseProgress(course) {
  const ready = course.chapters.filter((c) => c.ready)
  const cleared = ready.filter((c) => chapterCleared(c)).length
  return { cleared, total: ready.length }
}
function courseCompleted(course) {
  const pr = courseProgress(course)
  return pr.total > 0 && pr.cleared === pr.total
}
// 「次はこのレッスン」= 最初の未クリアかつopenな章の、最初の未完了レッスン
function nextUp() {
  const seq = chapterSequence()
  for (const { course, chapter } of seq) {
    if (!chapter.ready) continue
    if (chapterCleared(chapter)) continue
    if (chapterStatus(chapter.id) !== 'open') continue
    for (const l of chapter.lessons) {
      if (l.type === 'submit') {
        const s = chState(chapter.id)
        if (!(s.submitPassed && s.quizPassed)) return { course, chapter, lesson: l }
      } else if (!lessonDone(l.id)) {
        return { course, chapter, lesson: l }
      }
    }
  }
  return null
}
function typeLabel(t) {
  return t === 'lecture' ? '講義' : t === 'practice' ? '実習' : '関門'
}

/* ----------------------------- 共通パーツ ----------------------------- */
function crumb(parts) {
  const items = [['dashboard', '道場']].concat(parts)
  return '<div class="breadcrumb">' + items.map(([hash, label], i) =>
    i === items.length - 1 ? esc(label) : '<a href="' + href(hash) + '">' + esc(label) + '</a>'
  ).join(' › ') + '</div>'
}
function ladderHtml() {
  const cols = BRAND.ladder.map((lv, i) => {
    const course = COURSES[i]
    const reached = course ? courseCompleted(course) : false
    return (
      '<div class="ladder-step' + (reached ? ' reached' : '') + '">' +
        '<div class="ladder-badge">' + esc(lv.level) + '</div>' +
        '<div class="ladder-name">' + esc(lv.name) + '</div>' +
        '<div class="ladder-note">' + esc(lv.note) + '</div>' +
      '</div>'
    )
  }).join('<div class="ladder-arrow" aria-hidden="true">›</div>')
  return (
    '<div class="ladder"><div class="ladder-track">' + cols + '</div>' +
    '<p class="ladder-goal">到達点（L4）＝ <strong>' + esc(BRAND.goalLabel) + '</strong></p></div>'
  )
}
function videoSlotHtml() {
  return '<div class="video-slot"><span class="vs-label">デモ動画</span> 準備中です。テキストと図解だけで最後まで進められます。</div>'
}
function tipsHtml(tips) {
  if (!tips) return ''
  return '<div class="part tips"><div class="part-label">つまずいたら</div><p>' + esc(tips) + '</p></div>'
}
function promptBoxHtml(prompt) {
  if (!prompt) return ''
  return (
    '<div class="prompt-box">' +
      '<div class="prompt-bar"><span>コピーして、自分のClaude Codeに貼ってください</span>' +
        '<button class="copy-btn" id="copyPrompt">コピー</button></div>' +
      '<pre class="prompt-pre" id="promptText">' + esc(prompt) + '</pre>' +
    '</div>'
  )
}

/* ----------------------------- ダッシュボード ----------------------------- */
function renderDashboard() {
  const next = nextUp()
  const nextCta = next
    ? '<a class="btn btn-gold btn-lg" href="' + href('/lesson/' + next.lesson.id) + '">' +
      '次はここから: ' + esc(next.chapter.title.split(' — ')[0]) + ' / ' + esc(next.lesson.title) + '</a>'
    : '<span class="cert-hint">公開中の関門はすべてクリアしています。続きの章の公開をお待ちください。</span>'

  const cards = COURSES.map((c) => {
    const pr = courseProgress(c)
    const done = courseCompleted(c)
    const pct = pr.total ? Math.round((pr.cleared / pr.total) * 100) : 0
    const readyCount = c.chapters.filter((x) => x.ready).length
    const soonCount = c.chapters.length - readyCount
    return (
      '<article class="course-card' + (done ? ' is-done' : '') + '">' +
        '<div class="cc-top"><span class="tag tag-level">' + esc(c.level) + '</span>' +
          (done ? '<span class="st-badge st-passed">修了</span>' : '') + '</div>' +
        '<h3 class="cc-title">' + esc(c.name) + '</h3>' +
        '<p class="cc-tagline">' + esc(c.tagline) + '</p>' +
        '<div class="cc-progress"><div class="cc-bar"><div class="cc-fill" style="width:' + pct + '%"></div></div>' +
          '<span class="cc-meta">' + pr.cleared + ' / ' + pr.total + ' 章クリア' +
          (soonCount ? '（+' + soonCount + '章 準備中）' : '') + '</span></div>' +
        '<div class="cc-actions">' +
          '<a class="btn btn-sm" href="' + href('/course/' + c.id) + '">章を見る</a>' +
          (done ? '<a class="btn btn-outline btn-sm" href="' + href('/cert/' + c.id) + '">' + esc(c.level) + ' 修了証</a>' : '') +
        '</div>' +
      '</article>'
    )
  }).join('')

  app.innerHTML =
    '<section class="view">' +
      '<div class="hero">' +
        '<p class="hero-kicker">' + esc(BRAND.siteNameEn) + '</p>' +
        '<h1 class="hero-title">' + esc(BRAND.tagline) + '</h1>' +
        '<p class="hero-sub">' + esc(BRAND.subTagline) + '</p>' +
        '<div class="hero-cta">' + nextCta +
          (isInstructor() ? ' <span class="inst-flag">講師モード（全章開放中）</span>' : '') + '</div>' +
      '</div>' +
      ladderHtml() +
      '<p class="section-label">コース一覧</p>' +
      '<div class="course-grid">' + cards + '</div>' +
    '</section>'
}

/* ----------------------------- コース（章一覧） ----------------------------- */
function renderCourse(courseId) {
  const c = findCourse(courseId)
  if (!c) return renderNotFound()
  const pr = courseProgress(c)

  const rows = c.chapters.map((ch) => {
    const st = chapterStatus(ch.id)
    const lessonsCount = ch.lessons.length
    const doneLessons = ch.lessons.filter((l) =>
      l.type === 'submit' ? chapterCleared(ch) : lessonDone(l.id)).length
    let badge, action
    if (st === 'cleared') {
      badge = '<span class="st-badge st-passed">クリア</span>'
      action = '<a class="btn btn-outline btn-sm" href="' + href('/chapter/' + ch.id) + '">見直す</a>'
    } else if (st === 'open') {
      badge = '<span class="st-badge st-open">挑戦できます</span>'
      action = '<a class="btn btn-sm" href="' + href('/chapter/' + ch.id) + '">この章へ</a>'
    } else if (st === 'soon') {
      badge = '<span class="st-badge st-soon">準備中</span>'
      action = '<a class="btn btn-ghost btn-sm" href="' + href('/chapter/' + ch.id) + '">地図を見る</a>'
    } else {
      badge = '<span class="st-badge st-locked">未開放</span>'
      action = '<span class="lock-note">前の章をクリアすると開きます</span>'
    }
    return (
      '<div class="chapter-row ' + st + '">' +
        '<div class="chr-no">第' + ch.no + '章</div>' +
        '<div class="chr-main"><div class="chr-title">' + esc(ch.title) + '</div>' +
          '<div class="chr-goal">' + esc(ch.goal) + '</div>' +
          '<div class="chr-meta">' + lessonsCount + 'レッスン' + (st !== 'soon' ? '・完了 ' + doneLessons + '/' + lessonsCount : '') + '</div></div>' +
        '<div class="chr-side">' + badge + action + '</div>' +
      '</div>'
    )
  }).join('')

  app.innerHTML =
    '<section class="view">' +
      crumb([['/course/' + c.id, 'コース' + c.id.slice(1) + '〔' + c.level + '〕']]) +
      '<div class="course-head">' +
        '<span class="tag tag-level">' + esc(c.level) + '</span>' +
        '<h1 class="page-title">' + esc(c.name) + '</h1>' +
      '</div>' +
      '<p class="page-sub">' + esc(c.tagline) + '（' + esc(c.weeks) + '）　進捗: ' + pr.cleared + ' / ' + pr.total + ' 章</p>' +
      (courseCompleted(c) ? '<p><a class="btn btn-gold" href="' + href('/cert/' + c.id) + '">' + esc(c.cert.title) + ' を見る</a></p>' : '') +
      '<div class="chapter-list">' + rows + '</div>' +
      '<div class="btn-row"><a class="btn btn-ghost" href="' + href('/dashboard') + '">道場に戻る</a></div>' +
    '</section>'
}

/* ----------------------------- 章（レッスン一覧） ----------------------------- */
function renderChapter(chapterId) {
  const found = findChapter(chapterId)
  if (!found) return renderNotFound()
  const { course, chapter } = found
  const st = chapterStatus(chapterId)

  if (st === 'locked') {
    app.innerHTML =
      '<section class="view">' + crumb([['/course/' + course.id, course.level], ['/chapter/' + chapterId, '第' + chapter.no + '章']]) +
      '<div class="notice">この章はまだ開いていません。前の章の関門をクリアすると開きます。</div>' +
      '<div class="btn-row"><a class="btn" href="' + href('/course/' + course.id) + '">コースに戻る</a></div></section>'
    return
  }

  const rows = chapter.lessons.map((l, i) => {
    const done = l.type === 'submit' ? chapterCleared(chapter) : lessonDone(l.id)
    return (
      '<a class="lesson-row' + (done ? ' done' : '') + '" href="' + href('/lesson/' + l.id) + '">' +
        '<span class="lr-idx">' + (i + 1) + '</span>' +
        '<span class="lr-type t-' + l.type + '">' + typeLabel(l.type) + '</span>' +
        '<span class="lr-title">' + esc(l.title) + '</span>' +
        '<span class="lr-right">' + (l.minutes ? l.minutes + '分' : '') +
          (done ? '<span class="lr-done">済</span>' : '') + '</span>' +
      '</a>'
    )
  }).join('')

  // 続きから
  let firstIncomplete = null
  for (const l of chapter.lessons) {
    const done = l.type === 'submit' ? chapterCleared(chapter) : lessonDone(l.id)
    if (!done) { firstIncomplete = l; break }
  }

  app.innerHTML =
    '<section class="view">' +
      crumb([['/course/' + course.id, course.level], ['/chapter/' + chapterId, '第' + chapter.no + '章']]) +
      '<div class="step-head"><span class="tag tag-level">第' + chapter.no + '章</span>' +
        '<h1 class="page-title">' + esc(chapter.title) + '</h1></div>' +
      '<p class="page-sub">' + esc(chapter.goal) + '</p>' +
      (st === 'soon' ? '<div class="soon-box">この章は準備中です。地図（概要）だけ先に読めます。</div>' : '') +
      (st === 'cleared' ? '<div class="vr-pass">この章の関門はクリア済みです。</div>' : '') +
      (firstIncomplete && st !== 'soon'
        ? '<p><a class="btn btn-gold" href="' + href('/lesson/' + firstIncomplete.id) + '">続きから: ' + esc(firstIncomplete.title) + '</a></p>' : '') +
      '<div class="lesson-list">' + rows + '</div>' +
      '<div class="btn-row"><a class="btn btn-ghost" href="' + href('/course/' + course.id) + '">コースに戻る</a></div>' +
    '</section>'
}

/* ----------------------------- レッスン ----------------------------- */
function lessonNav(course, chapter, index) {
  const prev = chapter.lessons[index - 1] || null
  const next = chapter.lessons[index + 1] || null
  const prevBtn = prev
    ? '<a class="btn btn-ghost btn-sm" href="' + href('/lesson/' + prev.id) + '">← 前へ</a>'
    : '<a class="btn btn-ghost btn-sm" href="' + href('/chapter/' + chapter.id) + '">章の一覧</a>'
  const nextBtn = next
    ? '<a class="btn btn-sm" href="' + href('/lesson/' + next.id) + '">次へ →</a>'
    : '<a class="btn btn-sm" href="' + href('/chapter/' + chapter.id) + '">章の一覧へ</a>'
  return '<div class="nav-row">' + prevBtn +
    '<a class="btn btn-ghost btn-sm" href="' + href('/chapter/' + chapter.id) + '">この章のレッスン一覧</a>' +
    nextBtn + '</div>'
}

function renderLesson(lessonId) {
  const found = findLesson(lessonId)
  if (!found) return renderNotFound()
  const { course, chapter, lesson, index } = found
  const st = chapterStatus(chapter.id)
  if (st === 'locked') {
    app.innerHTML = '<section class="view">' +
      crumb([['/course/' + course.id, course.level], ['/chapter/' + chapter.id, '第' + chapter.no + '章']]) +
      '<div class="notice">この章はまだ開いていません。</div>' +
      '<div class="btn-row"><a class="btn" href="' + href('/course/' + course.id) + '">コースに戻る</a></div></section>'
    return
  }

  const head =
    crumb([['/course/' + course.id, course.level], ['/chapter/' + chapter.id, '第' + chapter.no + '章'], ['/lesson/' + lesson.id, lesson.title]]) +
    '<div class="step-head"><span class="lr-type t-' + lesson.type + '">' + typeLabel(lesson.type) + '</span>' +
      '<h1 class="page-title">' + esc(lesson.title) + '</h1></div>' +
    '<p class="page-sub">' + (lesson.minutes ? '目安 ' + lesson.minutes + '分 — ' : '') + esc(chapter.title) + '</p>'

  if (lesson.type === 'submit') return renderSubmitLesson(head, course, chapter, lesson, index)

  const done = lessonDone(lesson.id)
  app.innerHTML =
    '<section class="view">' + head +
      '<div class="lesson-body">' + (lesson.body || '') + '</div>' +
      (lesson.videoSlot ? videoSlotHtml() : '') +
      (lesson.type === 'practice' ? '<div class="part"><div class="part-label"><span class="part-no">実</span> 自分のClaude Codeでやってみる</div>' + promptBoxHtml(lesson.prompt) + '</div>' : '') +
      tipsHtml(lesson.tips) +
      '<div class="done-bar">' +
        (done ? '<span class="st-badge st-passed">完了済み</span>'
              : '<button class="btn btn-green" id="doneBtn">' + (lesson.type === 'practice' ? '実行した — 完了にする' : '読んだ — 完了にする') + '</button>') +
      '</div>' +
      lessonNav(course, chapter, index) +
    '</section>'

  bindCopy(lesson.prompt || '')
  const btn = document.getElementById('doneBtn')
  if (btn) btn.addEventListener('click', () => {
    markLessonDone(lesson.id)
    const next = chapter.lessons[index + 1]
    // ハッシュのみ変更（?instructor= は保持される）。hashchange で router が走る
    location.hash = next ? '#/lesson/' + next.id : '#/chapter/' + chapter.id
  })
}

/* ----------------------------- 関門（submit）レッスン ----------------------------- */
function renderSubmitLesson(head, course, chapter, lesson, index) {
  const s = chState(chapter.id)
  const cleared = chapterCleared(chapter)

  const clearedBanner = () => {
    const nextCh = nextChapterOf(chapter.id)
    const certReady = courseCompleted(course)
    return '<div class="vr-pass">第' + chapter.no + '章クリア。おつかれさまでした。</div>' +
      '<div class="btn-row">' +
        (certReady ? '<a class="btn btn-gold" href="' + href('/cert/' + course.id) + '">' + esc(course.cert.title) + ' を受け取る</a>' : '') +
        (nextCh ? '<a class="btn" href="' + href('/chapter/' + nextCh.id) + '">次の章へ: ' + esc(nextCh.title) + '</a>' : '') +
        '<a class="btn btn-ghost" href="' + href('/dashboard') + '">道場に戻る</a>' +
      '</div>'
  }

  app.innerHTML =
    '<section class="view">' + head +
      '<div class="lesson-body">' + (lesson.body || '') + '</div>' +

      '<div class="part"><div class="part-label"><span class="part-no">1</span> 実機の証拠を貼る</div>' +
        '<p class="part-intro">' + esc((lesson.verify && lesson.verify.instruction) || '') + '</p>' +
        '<textarea class="evidence" id="evidence" placeholder="ここに、自分のClaude Codeで出た結果を貼り付けます">' + esc(s.evidence || '') + '</textarea>' +
        '<div class="verify-bar"><button class="btn btn-green" id="verifyBtn">証拠を判定する</button>' +
          (s.submitPassed ? '<span class="st-badge st-passed">証拠 合格済み</span>' : '') +
          (isInstructor() ? '<button class="btn btn-outline btn-sm" id="overrideBtn">講師: この章を開通させる</button>' : '') +
        '</div>' +
        '<div id="verifyResult" class="verify-result"></div>' +
      '</div>' +

      '<div class="part"><div class="part-label"><span class="part-no">2</span> ミニテスト（理解の確認）</div>' +
        '<div id="quizArea">' + (s.quizPassed ? '<div class="vr-pass">ミニテスト 合格済み</div>' : '') + '</div>' +
      '</div>' +

      '<div id="clearArea">' + (cleared ? clearedBanner() : '') + '</div>' +
      tipsHtml(lesson.tips) +
      lessonNav(course, chapter, index) +
    '</section>'

  // 証拠判定
  const vBtn = document.getElementById('verifyBtn')
  const out = document.getElementById('verifyResult')
  const ta = document.getElementById('evidence')
  vBtn.addEventListener('click', () => {
    const res = verifyEvidence(lesson.verify, ta.value)
    const rows = res.results.map((r) =>
      '<li class="' + (r.ok ? 'ok' : 'ng') + '"><span class="ck-mark">' + (r.ok ? '合格' : '未達') + '</span>' + esc(r.label) + '</li>').join('')
    if (res.passed) {
      setChState(chapter.id, { submitPassed: true, evidence: String(ta.value).slice(0, 4000) })
      out.innerHTML = '<ul class="ck-list">' + rows + '</ul><div class="vr-pass">証拠は合格です。下のミニテストに進んでください。</div>'
      refreshClear()
    } else {
      out.innerHTML = '<ul class="ck-list">' + rows + '</ul>' +
        '<div class="vr-fail">まだ足りない項目があります（' + res.passedCount + ' / ' + res.total + '）。' +
        '実習レッスンに戻って、実機の結果を貼り直してください。</div>'
    }
    out.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  })

  // ミニテスト
  if (!s.quizPassed && lesson.quiz && lesson.quiz.length) {
    renderQuizForm(chapter, lesson)
  }

  // 講師オーバーライド
  const ov = document.getElementById('overrideBtn')
  if (ov) ov.addEventListener('click', () => {
    setChState(chapter.id, { submitPassed: true, quizPassed: true })
    const qa = document.getElementById('quizArea')
    if (qa) qa.innerHTML = '<div class="vr-pass">ミニテスト 合格済み（講師開通）</div>'
    refreshClear(true)
  })

  function refreshClear(force) {
    if (chapterCleared(chapter) || force) {
      const area = document.getElementById('clearArea')
      if (area) area.innerHTML = clearedBanner()
      // quizArea は触らない（合格直後の解説レビューを残す）
      area.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }

  function renderQuizForm(chapterRef, lessonRef) {
    const quiz = lessonRef.quiz
    let answers = new Array(quiz.length).fill(null)
    const qa = document.getElementById('quizArea')

    function formHtml() {
      const qs = quiz.map((item, qi) => {
        const choices = item.choices.map((ch2, ci) =>
          '<label class="choice' + (answers[qi] === ci ? ' selected' : '') + '" data-q="' + qi + '" data-c="' + ci + '">' +
            '<input type="radio" name="q' + qi + '"' + (answers[qi] === ci ? ' checked' : '') + '>' +
            '<span class="choice-text">' + esc(ch2) + '</span></label>').join('')
        return '<div class="q-block"><div class="q-head"><span class="q-num">' + (qi + 1) + '</span>' +
          '<span class="q-text">' + esc(item.q) + '</span></div><div class="choices">' + choices + '</div></div>'
      }).join('')
      return qs + '<div class="grade-bar"><span class="answer-progress" id="ansProg"></span>' +
        '<button class="btn btn-green" id="gradeBtn">採点する</button></div>'
    }

    function bind() {
      qa.querySelectorAll('.choice').forEach((label) => {
        label.addEventListener('click', () => {
          const qi = parseInt(label.getAttribute('data-q'), 10)
          const ci = parseInt(label.getAttribute('data-c'), 10)
          answers[qi] = ci
          const block = label.closest('.q-block')
          block.querySelectorAll('.choice').forEach((l) => l.classList.toggle('selected', l === label))
          const input = label.querySelector('input'); if (input) input.checked = true
          updateProg()
        })
      })
      const gb = document.getElementById('gradeBtn')
      gb.addEventListener('click', () => {
        if (!Quiz.allAnswered(quiz, answers)) {
          const ap = document.getElementById('ansProg')
          ap.textContent = '未回答の設問があります（' + Quiz.answeredCount(answers) + ' / ' + quiz.length + ' 問回答済み）'
          ap.style.color = 'var(--brick)'
          return
        }
        const r = Quiz.grade(quiz, answers)
        showResult(r)
      })
      updateProg()
    }
    function updateProg() {
      const ap = document.getElementById('ansProg')
      if (ap) { ap.textContent = '回答済み ' + Quiz.answeredCount(answers) + ' / ' + quiz.length + ' 問'; ap.style.color = 'var(--sub)' }
    }

    function showResult(r) {
      const review = r.results.map((res) => {
        const item = quiz[res.index]
        const choices = item.choices.map((ch2, ci) => {
          let cls = 'choice locked', flag = ''
          if (ci === res.answerIndex) { cls += ' correct'; flag = '<span class="choice-flag ok">正解</span>' }
          if (ci === res.picked && ci !== res.answerIndex) { cls += ' wrong'; flag = '<span class="choice-flag ng">あなたの回答</span>' }
          return '<div class="' + cls + '"><span class="choice-text">' + esc(ch2) + '</span>' + flag + '</div>'
        }).join('')
        return '<div class="q-block"><div class="q-head"><span class="q-num"' + (res.isCorrect ? '' : ' style="background:var(--brick);"') + '>' + (res.index + 1) + '</span>' +
          '<span class="q-text">' + esc(item.q) + '</span></div><div class="choices">' + choices + '</div>' +
          '<div class="explanation ' + (res.isCorrect ? 'is-correct' : 'is-wrong') + '"><span class="exp-label">【' + (res.isCorrect ? '正解' : '不正解') + '】解説</span>' +
          esc(res.explanation) + (res.isCorrect ? '' : '<br><em>復習: ' + esc(res.backTo || '') + '</em>') + '</div></div>'
      }).join('')

      if (r.passed) {
        setChState(chapterRef.id, { quizPassed: true })
        qa.innerHTML = '<div class="vr-pass">ミニテスト合格（' + r.correctCount + ' / ' + r.total + ' 問正解）</div>' + review
        refreshClear()
      } else {
        qa.innerHTML =
          '<div class="vr-fail">あと' + (r.threshold - r.correctCount) + '問で合格です（' + r.correctCount + ' / ' + r.total + ' 問正解・合格ライン ' + r.threshold + ' 問）。解説を読んで、もう一度挑戦してください。</div>' +
          review +
          '<div class="btn-row"><button class="btn btn-outline" id="retryQuiz">もう一度挑戦する</button></div>'
        const rq = document.getElementById('retryQuiz')
        if (rq) rq.addEventListener('click', () => { answers = new Array(quiz.length).fill(null); qa.innerHTML = formHtml(); bind(); qa.scrollIntoView({ behavior: 'smooth', block: 'nearest' }) })
      }
      qa.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }

    qa.innerHTML = formHtml()
    bind()
  }
}

function nextChapterOf(chapterId) {
  const seq = chapterSequence()
  const idx = seq.findIndex((x) => x.chapter.id === chapterId)
  for (let j = idx + 1; j < seq.length; j++) {
    if (seq[j].chapter.ready) return seq[j].chapter
  }
  return null
}

/* ----------------------------- 修了証 ----------------------------- */
function renderCert(courseId) {
  const c = findCourse(courseId)
  if (!c) return renderNotFound()
  if (!courseCompleted(c)) {
    app.innerHTML = '<section class="view">' + crumb([['/cert/' + c.id, '修了証']]) +
      '<div class="notice">' + esc(c.name) + ' の全章（公開中）をクリアすると、修了証を発行できます。</div>' +
      '<div class="btn-row"><a class="btn" href="' + href('/course/' + c.id) + '">コースに戻る</a></div></section>'
    return
  }
  const name = (SESSION && SESSION.name) || '受講生'
  const dates = c.chapters.filter((x) => x.ready).map((x) => chState(x.id).date).filter(Boolean).sort()
  const date = fmtDate(dates[dates.length - 1] || todayStr())
  app.innerHTML =
    '<section class="view">' + crumb([['/cert/' + c.id, '修了証']]) +
      '<div class="cert-stage"><div class="certificate">' +
        '<div class="cert-kicker">CERTIFICATE OF COMPLETION</div>' +
        '<div class="cert-title">' + esc(c.cert.title) + '</div>' +
        '<div class="cert-rule"></div>' +
        '<p class="cert-lead">下記の者は</p>' +
        '<div class="cert-name">' + esc(name) + '</div>' +
        '<p class="cert-body">' + esc(BRAND.siteName) + ' コース「' + esc(c.name) + '」の全課程を、<br>実際に手を動かして修了したことを証します。</p>' +
        '<div class="cert-meta"><div>修了日<span class="cm-val">' + date + '</span></div>' +
          '<div>到達レベル<span class="cm-val">' + esc(c.level) + '</span></div></div>' +
        '<div class="cert-footer"><div class="cert-org">' +
          '<div class="cert-org-name">' + esc(BRAND.siteName) + '</div>' +
          '<div class="cert-org-sub">' + esc(BRAND.siteNameEn) + '</div></div>' +
          '<div class="cert-seal"><span class="seal-mark">' + esc(BRAND.mark) + '</span><span class="seal-text">認 定</span></div>' +
        '</div>' +
      '</div></div>' +
      '<div class="btn-row" style="justify-content:center;"><a class="btn" href="' + href('/dashboard') + '">道場に戻る</a></div>' +
    '</section>'
}

function renderNotFound() {
  app.innerHTML = '<section class="view"><div class="notice">お探しのページが見つかりませんでした。</div>' +
    '<div class="btn-row"><a class="btn" href="' + href('/dashboard') + '">道場に戻る</a></div></section>'
}

/* ----------------------------- コピー ----------------------------- */
function bindCopy(text) {
  const btn = document.getElementById('copyPrompt')
  if (!btn) return
  btn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(text)
      btn.textContent = 'コピーしました'
    } catch (_) {
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

/* ----------------------------- ルーター ----------------------------- */
let SESSION = null
function router() {
  const hash = (location.hash || '').replace(/^#/, '')
  if (!hash || hash === '/') { location.hash = '#/dashboard'; return }
  const parts = hash.replace(/^\//, '').split('/')
  const route = parts[0], arg = parts[1]
  switch (route) {
    case 'dashboard': renderDashboard(); break
    case 'course': renderCourse(arg); break
    case 'chapter': renderChapter(arg); break
    case 'lesson': renderLesson(arg); break
    case 'cert': renderCert(arg); break
    default: renderNotFound()
  }
  window.scrollTo(0, 0)
}

/* ----------------------------- ヘッダー・起動 ----------------------------- */
function bindHeader(session) {
  const nameEl = document.getElementById('learnerName')
  if (nameEl) nameEl.textContent = session.name || '受講生'
  const logoutLink = document.getElementById('logoutLink')
  if (logoutLink) logoutLink.addEventListener('click', (e) => { e.preventDefault(); logout() })
  const resetLink = document.getElementById('resetLink')
  if (resetLink) resetLink.addEventListener('click', (e) => {
    e.preventDefault()
    if (window.confirm('学習の進捗（完了・合格の記録）をすべて消して、最初からにします。よろしいですか？')) {
      resetProgress()
      location.hash = '#/dashboard'
      router()
    }
  })
}

async function boot() {
  const session = await requireLogin()
  if (!session) return
  SESSION = session
  bindHeader(session)
  window.addEventListener('hashchange', router)
  router()
}
boot()
