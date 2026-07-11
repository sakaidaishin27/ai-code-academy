// config.example.js — 認証設定のひな形
// これをコピーして js/config.js を作る（config.js は .gitignore 済み＝コミットされない）。
//
// 2つのモードがある:
//   1) 'supabase' … 本番。メール＋パスワードのサーバ認証（Supabase）。
//   2) 'demo'     … MVP/検証用。合言葉（共有パスワード）1つで入れる簡易ゲート。
//                   ※デモは「入口にパスワードを要求する」体験の確認用。本番は必ず supabase にする。
//
// シークレットの扱い:
//   - Supabase の Publishable(anon) Key は「公開してよい」キー（RLSで保護）。ここに置いてよい。
//   - Secret/Service Role Key は絶対にここに書かない（フロントに置かない）。

export const AUTH_CONFIG = {
  mode: 'demo', // 'demo' | 'supabase'

  // --- demo モード（合言葉ゲート）---
  demo: {
    // 入口の合言葉。学習者にはこれを渡す。本番移行時は supabase に切り替える。
    passphrase: 'CHANGE_ME',
    // 表示用の受講者名（demoモードでの表示。supabaseモードではアカウント名を使う）
    learnerName: '受講生',
  },

  // --- supabase モード（本番）---
  supabase: {
    url: 'https://YOUR-PROJECT.supabase.co',
    // Publishable(anon) key。公開OK。Secret key は置かない。
    publishableKey: 'sb_publishable_XXXXXXXXXXXXXXXXXXXX',
  },
}
