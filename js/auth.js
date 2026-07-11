// auth.js — 認証レイヤー（demo 合言葉ゲート / Supabase パスワード認証 の両対応）
//
// 設計:
//   - config.js の AUTH_CONFIG.mode で切り替える（'demo' | 'supabase'）。
//   - demo: 合言葉1つで入れる簡易ゲート（MVP/検証用）。セッションは sessionStorage に持つ。
//   - supabase: メール＋パスワードのサーバ認証。v3 の supabase-client パターンを踏襲し、
//               Supabaseモジュールは「supabaseモードのときだけ」動的importする（demoではネット不要）。
//
// 公開API:
//   getSession()               -> { authed:bool, name:string } | { authed:false }
//   requireLogin()             -> 未ログインなら login.html へリダイレクト。ログイン済みなら user情報を返す
//   login(idOrEmail, password) -> { ok:bool, error?:string }
//   logout()                   -> ログアウトして login.html へ
//   redirectIfAuthed()         -> login.html 用。ログイン済みなら index へ

import { AUTH_CONFIG } from './config.js'

const DEMO_SESSION_KEY = 'aca_demo_session'

/* ---------- サイトのベースURL解決（GitHub Pages / サブパス / ローカル対応） ---------- */
export const SITE_BASE_URL = (() => {
  const { protocol, host, pathname } = window.location
  // login.html / index.html を含むパスからサイトルートを推定
  const dir = pathname.replace(/[^/]*$/, '') // 末尾ファイル名を除いたディレクトリ
  return `${protocol}//${host}${dir}`
})()

export function siteUrl(rel) {
  return SITE_BASE_URL + String(rel).replace(/^\//, '')
}

/* ---------- ?next= のオープンリダイレクト対策（v3 safeNext を踏襲） ---------- */
export function safeNext(raw) {
  const fallback = siteUrl('index.html')
  if (!raw || typeof raw !== 'string') return fallback
  try {
    if (raw.startsWith('/') && !raw.startsWith('//')) {
      return new URL(raw, window.location.origin).href
    }
    const u = new URL(raw, window.location.origin)
    if (u.origin === window.location.origin) return u.href
  } catch (_) { /* 不正なURLは fallback */ }
  return fallback
}

/* ============================ demo モード ============================ */
function demoGetSession() {
  let raw = null
  try { raw = sessionStorage.getItem(DEMO_SESSION_KEY) } catch (_) { raw = null }
  if (raw === 'ok') {
    return { authed: true, name: AUTH_CONFIG.demo.learnerName || '受講生' }
  }
  return { authed: false }
}
function demoLogin(_id, password) {
  const expected = String(AUTH_CONFIG.demo.passphrase || '')
  if (expected && expected !== 'CHANGE_ME' && String(password) === expected) {
    try { sessionStorage.setItem(DEMO_SESSION_KEY, 'ok') } catch (_) {}
    return { ok: true }
  }
  return { ok: false, error: '合言葉が違います。' }
}
function demoLogout() {
  try { sessionStorage.removeItem(DEMO_SESSION_KEY) } catch (_) {}
}

/* ============================ supabase モード ============================ */
let _sbPromise = null
async function getSupabase() {
  if (_sbPromise) return _sbPromise
  _sbPromise = (async () => {
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2')
    const { url, publishableKey } = AUTH_CONFIG.supabase
    return createClient(url, publishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
      },
    })
  })()
  return _sbPromise
}

async function sbGetSession() {
  try {
    const sb = await getSupabase()
    const { data } = await sb.auth.getSession()
    const s = data?.session
    if (s && !s.user?.is_anonymous) {
      const name = s.user?.user_metadata?.display_name || s.user?.email || '受講生'
      return { authed: true, name }
    }
  } catch (e) {
    console.warn('[auth] Supabase セッション取得に失敗:', e?.message)
  }
  return { authed: false }
}
async function sbLogin(email, password) {
  try {
    const sb = await getSupabase()
    const { error } = await sb.auth.signInWithPassword({ email, password })
    if (error) return { ok: false, error: 'メールアドレスかパスワードが違います。' }
    return { ok: true }
  } catch (e) {
    return { ok: false, error: '接続に失敗しました。時間をおいて再度お試しください。' }
  }
}
async function sbLogout() {
  try { const sb = await getSupabase(); await sb.auth.signOut() } catch (_) {}
}

/* ============================ 公開API ============================ */
const isSupabase = () => AUTH_CONFIG.mode === 'supabase'

export async function getSession() {
  return isSupabase() ? sbGetSession() : demoGetSession()
}

export async function login(idOrEmail, password) {
  return isSupabase() ? sbLogin(idOrEmail, password) : demoLogin(idOrEmail, password)
}

export async function logout() {
  if (isSupabase()) await sbLogout(); else demoLogout()
  window.location.replace(siteUrl('login.html'))
}

/** ページ先頭で呼ぶ。未ログインなら login.html?next=... へ飛ばす。 */
export async function requireLogin() {
  const s = await getSession()
  if (!s.authed) {
    const current = window.location.pathname + window.location.search + window.location.hash
    window.location.replace(siteUrl('login.html?next=' + encodeURIComponent(current)))
    return null
  }
  return s
}

/** login.html 用。すでにログイン済みなら next（or index）へ。 */
export async function redirectIfAuthed() {
  const s = await getSession()
  if (s.authed) {
    const next = new URLSearchParams(window.location.search).get('next')
    window.location.replace(safeNext(next))
  }
}
