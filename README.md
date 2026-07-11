# AI業務OS道場（ai-code-academy）

Claude Code をこれから学ぶ人のための、会員制の学習サイト。
「読む・見る」だけでは進まず、**自分の手で組み上げ、動いた証拠を貼ると次の関門が開く**（証拠ペースト式ビルドゲート）のが核心。

- 共通コア（全学習者に共通）＝ Claude Code の能力ラダー L1→L4 を作りながら登る階梯（`js/core.js`）
- 応用トラック（顧客固有・差し替え）＝ 例: 花屋の実務（`js/applied.js`）
- 最初の受講生（パイロット）＝ 淡輪さん。彼の花屋業務は応用トラックの実例。

設計の全体像は `~/.claude/plans/shiny-launching-cascade.md`（承認済みプラン）を参照。

## 構成

```
index.html          学習ダッシュボード（要ログイン）
login.html          ログイン（demo=合言葉 / supabase=メール＋パスワード）
css/style.css       スタイル（和モダン・プロダクト級）
js/
  brand.js          サイト名・キャッチ・ラダー定義（1箇所で差し替え）
  config.example.js 認証設定のひな形（コピーして config.js を作る）
  config.js         実設定（.gitignore 済み・コミットしない）
  auth.js           認証レイヤー（demo / Supabase 両対応）
  verify.js         証拠ペースト式バリデータ（quiz.js の置き換え）
  core.js           共通コアトラック（Rung0-3 実装済 / Rung4-9 は骨子）
  applied.js        応用トラック（花屋。人件費ミニ体験が目玉）
  app.js            SPA本体（ラダー可視化・アンロック・関門画面・修了証）
guide/index.html    概念教材「環境設計ガイド 全8章」（各Rungから深リンク）
assets/data/        ダミーCSV（人件費ミニ体験用・完全に架空の数字）
deploy.sh           Cloudflare Pages（個人アカウント）へ安全デプロイ
```

## ローカルで動かす

ES モジュールを使うため `file://` では動かない。簡易HTTPサーバで開く。

```bash
cd "ai-code-academy"
python3 -m http.server 8123
# ブラウザで http://localhost:8123/login.html
```

demo モードの合言葉は `js/config.js` の `demo.passphrase`（初期値 `dojo2026`）。

## 本番（会員制）への切り替え

1. **新規** Supabase プロジェクトを作成（N1のプロジェクトに絶対混ぜない）。メール＋パスワード認証を有効化。
2. `js/config.js` を `mode:'supabase'` にし、`supabase.url` と `publishableKey`（anon/公開OKキー）を設定。
   - Secret/Service Role キーはフロントに置かない。
3. 受講生アカウントを Supabase で発行。
4. デプロイ:
   ```bash
   CLOUDFLARE_ACCOUNT_ID=74747d4d... ./deploy.sh
   ```
   - `deploy.sh` は個人アカウント（74747d4d…）以外を弾く。N1誤爆ガード。
   - `~/.cf_token` を使用（トークンはコマンドラインに出さない）。

## 進捗保存について

- 現状（MVP）: 進捗は各端末の `localStorage`（`aca_progress`）。
- v1: Supabase に進捗を保存し、講師が複数受講生の到達度を一望できるダッシュボードを追加予定。

## 講師オーバーライド

`?instructor=1` を URL に付けると全関門が開く（詰まった受講生の救済用）。関門詳細に「講師: この関門を開ける」ボタンも出る。

## 注意

- 絵文字は使わない（全コンテンツ共通）。
- 本人の実データ（実際の日報CSV等）はこのリポジトリに置かない。同梱は架空のダミーのみ。実データ演習はローカルで。
