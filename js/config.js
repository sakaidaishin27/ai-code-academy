// config.js — ローカル/検証用の実設定（.gitignore 済み・コミットされない）
// MVP段階は demo モード（合言葉ゲート）。本番は mode:'supabase' に切り替える。
// このファイルはリポジトリに含めない。config.example.js を正本のひな形とする。

export const AUTH_CONFIG = {
  mode: 'demo',
  demo: {
    passphrase: 'dojo2026',
    learnerName: '受講生',
  },
  supabase: {
    url: 'https://YOUR-PROJECT.supabase.co',
    publishableKey: 'sb_publishable_XXXXXXXXXXXXXXXXXXXX',
  },
}
