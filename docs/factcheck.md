# ファクトチェック台帳

教材に含まれる技術事実の裏取り記録。**チェックに通らない記述は公開しない**（このリポジトリの品質原則）。
最終更新: 2026-07-11

## 方式

| 対象 | 裏取り方法 |
|---|---|
| Claude Code の仕様（インストール・CLAUDE.md・コマンド/スキル・権限・hooks・MCP・プランモード・再開） | 公式ドキュメント照会エージェント（code.claude.com/docs）で全項目確認 |
| GitHub / GitHub Pages の手順・制約 | docs.github.com の現行ページと突き合わせ（+実サインアップページ確認） |
| gog CLI のセットアップ手順 | 社内正本 `client-starter-kit/01_setup-gog.md`（実顧客で再現済みの手順書）に一致させる |
| 実習プロンプトの動作 | 実機（Claude Code）で再現確認（章公開前に実施） |

## 検証済み事実（2026-07-11 確認）

### Claude Code（出典: code.claude.com/docs）
- インストール（macOS）: `curl -fsSL https://claude.ai/install.sh | bash` が推奨。起動は `claude`。（quickstart.md）→ 第0章
- CLAUDE.md はセッション開始時に自動で読み込まれる。配置場所はユーザー（~/.claude/CLAUDE.md）／プロジェクト（CLAUDE.md）等。（settings.md）→ 第2章
- カスタムスラッシュコマンドは現行ではスキル機構で実装され、ユーザーレベル・プロジェクトレベルの両方に置け、/<名前> で呼び出せる。（commands.md）→ 第7章では**ファイルパスを断言せず**「AI自身に作らせる」方式で教える
- 権限は settings.json の permissions に allow / ask / deny。ユーザー=~/.claude/settings.json、プロジェクト=.claude/settings.json。（settings.md）→ 第10章
- hooks は PreToolUse / Stop 等のイベントでシェルコマンド等を自動実行。（hooks.md）→ 第10章
- MCP = Model Context Protocol。外部ツール・データソースをAIに統合するオープン標準。追加は `claude mcp add`／`.mcp.json`／会話中の `/mcp`。（mcp.md）→ 第12章
- プランモード（実行せず計画のみ）は Shift+Tab で切替。（permission-modes.md）→ 上級章の素材
- 会話再開は `claude --continue` / `--resume`。（sessions.md）→ 補足素材

### GitHub / GitHub Pages（出典: docs.github.com・github.com/signup 実ページ）
- アカウント作成は github.com/signup。メール・パスワード・ユーザー名の3つ＋メール確認。無料（GitHub Free）で開始可 → 第8章
- リポジトリ = プロジェクトの全ファイル＋各ファイルの変更履歴を保存する場所（公式定義と一致）→ 第8章
- Public=誰でも閲覧可 / Private=自分と招待した人のみ → 第8章
- **GitHub Free では GitHub Pages は Public リポジトリのみ**（2ページで一致確認・2026-07現在有効）→ 第9章
- Pages有効化: Settings → Pages → Source「Deploy from a branch」→ ブランチ（main）/(root) → Save。URL形式 https://<ユーザー名>.github.io/<リポジトリ名>/ → 第9章
- **反映は「最大10分」かかることがある**（公式文言）。「数分」と書かない → 第9章
- コミット=変更のスナップショット（公式も写真の比喩）。push=**コミット済みの**変更をGitHubへ送る（未コミットの編集は送られない）→ 第8章
- 秘密情報を一度コミットしたら「削除」では消えない（履歴・フォーク・キャッシュに残りうる）。公式の第一手は**無効化・再発行（revoke/rotate）**。旧文言「pushしたらcompromisedとみなせ」は現行docsに無いため引用しない → 第9章
- 基地（業務メモ入り）のバックアップは Private、公開サイトは公開専用の別リポジトリで — 教材の安全設計 → 第8・9章

### gog CLI（出典: 社内正本 client-starter-kit/01_setup-gog.md）
- 手順: ①Homebrew確認（which brew）②brew install gog → gog --version ③gog auth add <メール>（ブラウザで許可）④gog auth alias set main <メール> ⑤動作確認 gog -a main calendar list --today / gog -a main gmail list --unread --limit 5 → 第4章の実習プロンプトはこの正本に一致
- ブリーフィングが動く前提: gog認証済み＋alias main＋CLAUDE.md に朝ブリーフィング定義（正本は --limit 5）→ 第4章
- 既知の落とし穴: M1/M2 MacでHomebrew導入後の brew shellenv 忘れ／認証でブラウザが開かない場合はURL手動貼り → 第4章 tips

## 執筆時の禁則
- 反映時間・制約・コマンドは上記の検証済み表現のみ使う
- 未検証の数値・手順は書かない（「未確認」を書くくらいなら載せない）
- UI文言は英語のまま併記（例: Settings → Pages）
- 仕様が変わりやすい箇所（コマンドの保存場所等）は「AI自身にやらせる」実習設計にして陳腐化を防ぐ

## 未実施（公開前に必須）
- [ ] 実機再現: 第0章 インストール〜起動（新規環境相当での通し確認）
- [ ] 実機再現: 第8-9章 リポジトリ作成〜Pages公開（手順どおりに1周）
- [ ] コース2・3の執筆内容のクロスチェック（本台帳との突き合わせ）
