# AI Academy（ai-code-academy）

Claude Code をこれから学ぶ人のための、オンラインスクール型の学習サイト。
**「読む・見る」だけでは進めない。自分のPCで実際に手を動かし、動いた証拠を貼って関門を開ける**——のが核心（証拠ペースト式ビルドゲート）。

- 対象: 全くの初心者（GitHubを聞いたことがない人にも分かるように書く）
- 卒業時の状態: **GitHubとは何か・APIとは何か・MCPとは何かを理解し、実際に繋いだことがある**
- 図解ファースト（全レッスンにSVG図解／ターミナル再現モック等。動画は前提にしない・後から差せるスロットのみ）
- 品質原則: **間違った情報は載せない**。技術事実は `docs/factcheck.md` の裏取りに通ったものだけ書く

## カリキュラム（4コース・17章）

| コース | 章 | 到達 |
|---|---|---|
| c1〔L1 入門〕AIが毎日の相棒になる | 第0章 オリエン＋インストール / 第1章 基地 / 第2章 CLAUDE.md / 第3章 KNOWLEDGE.md / 第4章 Googleと繋ぐ(gog) | 朝の一言で秘書が動く |
| c2〔L2 実践〕仕事を任せて成果物を出す | 第5章 CSV / 第6章 リサーチ→HTML / 第7章 コマンド部品化 / 第8章 GitHubデビュー / 第9章 Pagesで公開 | 成果物を作り世界に公開できる |
| c3〔L3 中級→上級〕業務フロー全体を設計 | 第10章 権限とHooks / 第11章 API / 第12章 MCP / 第13章 第二の脳 | 仕組みを設計できる |
| c4〔L4 上級〕設計し教える側へ（骨子） | 第14章 上級者の姿勢 / 第15章 卒業制作 / 第16章 人に教える | 免許皆伝 |

各章 = 講義（図解つき）→ 実習（コピペプロンプトで自分のClaude Codeを動かす）→ **関門**（実機の証拠ペースト判定 ＋ ミニテスト3問。**両方合格で次章が開く**）。コース修了ごとに修了証（L1〜L4）。

## 構成

```
index.html / login.html   画面（要ログイン。demo=合言葉 / supabase=メール+パスワード）
css/style.css             スタイル（図解部品 .figure/.term-mock/.steps-fig/.compare/.callout 含む）
js/
  app.js                  SPA本体（#/dashboard, /course/:id, /chapter/:id, /lesson/:id, /cert/:courseId）
  curriculum.js           カリキュラム入口（検索ヘルパー）
  curriculum/c1..c4.js    コース別コンテンツ（講義HTML・実習プロンプト・verify・quiz）
  verify.js               証拠ペースト式バリデータ
  quiz.js                 ミニテスト採点（合格 = 問題数-1 以上）
  auth.js / config.*.js   認証（config.js は gitignore・コミットしない）
  brand.js                サイト名・ラダー定義
docs/factcheck.md         ファクトチェック台帳（裏取りに通らない記述は公開しない）
assets/data/              実習用ダミーCSV（架空の数字のみ）
deploy.sh                 Cloudflare Pages（個人アカウント）安全デプロイ
```

## ローカルで動かす

ES モジュールのため `file://` では動かない。

```bash
python3 -m http.server 8123
# http://localhost:8123/login.html （demo合言葉は js/config.js）
```

- 講師モード: URL に `?instructor=1` — 全章開放＋関門ページに開通ボタン
- 進捗は localStorage（`aca_progress_v2`）。ヘッダーの「進捗リセット」で初期化

## コンテンツを書く・直すときのルール

1. 触るのは `js/curriculum/c*.js` だけ（エンジンにコンテンツを書かない）
2. 技術事実は先に `docs/factcheck.md` で裏取り。通らない記述は書かない
3. 文体・構造は c1.js がテンプレート（絵文字禁止・たとえ話・教え方5原則）
4. 書いたら `node --check js/curriculum/c*.js` と実機（ブラウザ）確認
5. 仕様が変わりやすい箇所は「AI自身にやらせる」実習設計にして陳腐化を防ぐ

## 本番公開（未実施）

- 認証を supabase モードへ（新規Supabaseプロジェクト。**N1のプロジェクトに混ぜない**）
- `CLOUDFLARE_ACCOUNT_ID=74747d4d... ./deploy.sh`（個人アカウント以外は弾くガード付き）
