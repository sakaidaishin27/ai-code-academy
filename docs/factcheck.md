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
| GAS / clasp の仕様（第10〜12章） | github.com/google/clasp README ＋ developers.google.com/apps-script の現行ページと突き合わせ（一般エージェントで全項目確認） |

## 検証済み事実（2026-07-11 確認）

### Claude Code（出典: code.claude.com/docs）
- 【2026-07-14 前提変更】教材は**デスクトップアプリ（Claude Desktop・Mac）前提**。入手= claude.com/download（実在確認済・claude.ai/download から301）→ .dmg を Applications へ→起動→ブラウザで claude.ai アカウントにサインイン。**有料プラン必須**（desktop-quickstart.md）。CLIの curl インストールは上級者向けの別ルートとして教材には載せない → 第0章
- CLAUDE.md はセッション開始時に自動で読み込まれる。配置場所はユーザー（~/.claude/CLAUDE.md）／プロジェクト（CLAUDE.md）等。（settings.md）→ 第2章
- カスタムスラッシュコマンドは現行ではスキル機構で実装され、ユーザーレベル・プロジェクトレベルの両方に置け、/<名前> で呼び出せる。（commands.md）→ 第7章では**ファイルパスを断言せず**「AI自身に作らせる」方式で教える
- 権限は settings.json の permissions に allow / ask / deny。ユーザー=~/.claude/settings.json、プロジェクト=.claude/settings.json。（settings.md）→ 第13章
- hooks は PreToolUse / Stop 等のイベントでシェルコマンド等を自動実行。（hooks.md）→ 第13章
- MCP = Model Context Protocol。外部ツール・データソースをAIに統合するオープン標準。追加は `claude mcp add`／`.mcp.json`／会話中の `/mcp`。（mcp.md）→ 第15章
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

### Open-Meteo（出典: open-meteo.com トップページ・2026-07-11確認）
- 天気予報API。「no API key required」「No API key, no sign-up, no credit card」と明記。非商用は1日10,000コールまで無料 → 第14章の実習素材として採用可

### gog CLI（出典: 社内正本 client-starter-kit/01_setup-gog.md）
- 手順: ①Homebrew確認（which brew）②brew install gog → gog --version ③gog auth add <メール>（ブラウザで許可）④gog auth alias set main <メール> ⑤動作確認 gog -a main calendar list --today / gog -a main gmail list --unread --limit 5 → 第4章の実習プロンプトはこの正本に一致
- ブリーフィングが動く前提: gog認証済み＋alias main＋CLAUDE.md に朝ブリーフィング定義（正本は --limit 5）→ 第4章
- 既知の落とし穴: M1/M2 MacでHomebrew導入後の brew shellenv 忘れ／認証でブラウザが開かない場合はURL手動貼り → 第4章 tips

### Google Apps Script（GAS）+ clasp（出典: github.com/google/clasp README・developers.google.com/apps-script・2026-07-11確認）
GAS3章（第10〜12章）の技術事実。凡例: ✅=公式裏取り済み ／ ⚠️=表記ゆれ注意 ／ ❓=単一公式ソースで未確定（教材には断定で書かない）。

- **GAS＝Googleのサーバー側で動くスクリプト**。PCを閉じても動く（Excelマクロとの違い）。教材は「日本語で仕様→AIが書く→claspで届ける」方式で、学習者はGAS言語を書かない → 第10章 ✅
- **clasp v3 でコマンド名が変わった**: 旧v2 `clasp create`/`clasp clone` → 新v3 **`clasp create-script`/`clasp clone-script`**。公式ガイド(developers.google.com)は旧名のままなので初心者が確実にハマる。教材はv3表記を正とし、注意書きを入れる ⚠️→ 第10章
- **clasp v3 は Node ≥ 22 必須**（READMEに明記）。教材で `node -v` を先に確認させる ✅→ 第10章
- **push の前提＝Apps Script API のON**: `script.google.com/home/usersettings` のトグルをONにしないと、login/cloneはできてもpushだけ失敗する（READMEに明記・定番のハマり）✅→ 第10章
- **コンテナバインド作成**: `clasp create-script --parentId <スプレッドシートID>` で、そのシートに紐づくスクリプトをローカルから作る。`.clasp.json` は create-script/clone-script が自動生成（手で書かない）✅→ 第10章
- **シンプルトリガー onEdit の制約**: onEdit(e) は認可の要るサービス（MailApp/GmailApp/UrlFetchApp等）を呼べない。シート内の計算・書き込み・色付けは可。→ B章（金額計算・在庫減算・色付け）はシート操作のみで完結させる。`e.value`/`e.oldValue` は単一セル編集時のみ入る ✅→ 第10章
- **インストーラブル/時間主導トリガー**: `ScriptApp.newTrigger('fn').timeBased().everyDays(1).atHour(7).create()`。**atHour(7)＝7:00ちょうどでなく「7時台（7〜8時）のどこか」**をGoogleが選ぶ。インストーラブルはMailApp等の認可要サービスを呼べる（シンプルトリガーとの決定的違い）✅→ 第11章
- **暴走の止め方**: `ScriptApp.getProjectTriggers()`＋`ScriptApp.deleteTrigger(t)`、またはApps Scriptエディタの「トリガー」画面から手動削除 ✅→ 第11章
- **MailApp**: `MailApp.sendEmail(to, subject, body)`。**無料gmail.comアカウントの送信上限＝1日100通（受信者数ベース）**、Workspace=1,500通/日。`MailApp.getRemainingDailyQuota()` で残量確認。検証用に `GmailApp.createDraft(...)`（送信せず下書き）✅→ 第11章
- **請求書PDF生成（初心者向け最短・確実）**: スプレッドシートはDrive上のファイル → `DriveApp.getFileById(id).getAs('application/pdf')` でPDF Blob化 → `folder.createFile(blob)` で保存。フォルダは `getFoldersByName` は同名複数を返し得るので、初心者には ID直指定（`getFolderById`）が安全。範囲指定PDF（export URL パラメータ）は❓＝教材では扱わない → 第12章 ✅
- **CalendarApp**: `CalendarApp.getDefaultCalendar().createEvent(title, startTime, endTime)`。**startTime/endTime は文字列でなく Date オブジェクト**（初心者のつまずき所）✅→ 第12章
- **認可ダイアログ**: MailApp/DriveApp/CalendarApp を使う関数は初回実行時に承認が必要。自作スクリプトで「このアプリは確認されていません」が出るのは正常（詳細→続行）❓（画面文言は変わり得る）→ 第11・12章
- **未確認（教材に断定で書かない）**: clasp最新版の正確なバージョン番号／`.clasp.json` の parentId フィールド有無／範囲指定PDFのexport URL仕様／appsscript.json マニフェスト・Advanced Services の詳細。教材化する場合は developers.google.com/apps-script/manifest を別途裏取り

### デスクトップアプリ（出典: code.claude.com/docs desktop.md・desktop-quickstart.md・2026-07-14確認）
- **デスクトップはCLIと同一エンジン・同一設定**（"Desktop runs the same underlying engine as the CLI"）。CLAUDE.md／settings.json／hooks／スキル／MCP設定を共有 → 教材の全実習（指示書・記憶・権限・/dash・GAS・MCP）はアプリでそのまま成立
- **新しい会話＝「+ New session」ボタン／Cmd+N**（公式・desktop.md）。過去の会話はサイドバーから復帰。セッション同士のコンテキストは分離 → 全編の「新しい会話」の正式手段（第2章で教える）
- **許可UIはGUIボタン**（差分の Accept/Reject・操作の Allow once／Always allow／Deny）→「矢印キーで選ぶ」系の説明は使わない
- **/clear・/mcp のデスクトップでの動作は公式明記なし** → 教材では教えない（新しいセッションボタン／「AIに接続状態を確認してもらう」で代替）。/permissions・/config 等の対話パネル型コマンドはデスクトップ非対応（公式明記）
- **settings.json（permissions・hooks）はファイル変更を監視し、実行中のセッションに再起動なしで反映**（settings.md）→ 第13章 避難訓練は会話を開き直さずそのまま実施できる
- CLAUDE.md と auto memory は「**every conversation の開始時に読み込まれる**」（memory.md）→ 第2章 初対面テストの根拠（新しいセッション＝新しい会話）。札が付かない場合のフォールバック（基地を選び直して新セッション）を「詰まったら」に用意
- **教材の設計方針（2026-07-12確立・07-14デスクトップ前提へ更新）**: 学習者の操作は「アプリのボタン・ブラウザ・日本語」だけ。ターミナルは登場させない（統合ターミナルも教えない・l0-3の脚注で存在に触れるのみ）。シェルコマンドの実行は全てAI＝プロンプト内の生コマンドは主語（あなた=AIが実行）を明示する

### L4（第17〜19章）の技術事実
- L4は新規の技術主張を最小にした設計（敵対的レビュー・実測主義は姿勢論、卒業制作はHTML1枚の自作サイト）。第19章の公開手順・制約（Free=Public限定／Settings → Pages → Deploy from a branch／URL形式／反映最大10分／秘密はrevoke・rotate）は、上記「GitHub / GitHub Pages」節の裏取り済み事実をそのまま再利用 → 第19章
- 卒業制作は index.html 1ファイル完結（外部読み込みなし）とし、ローカル確認は「ファイルをダブルクリックでブラウザで開く」で成立する構成に限定 → 第18章

### デモ動画の方針（2026-07-12 決定）
- videoSlot（デモ動画プレースホルダ）は全レッスンから廃止。動画が担う「やって見せる」は、本文の「詰まったら（症状→対処）」callout と tips で肩代わりする

## 執筆時の禁則
- 反映時間・制約・コマンドは上記の検証済み表現のみ使う
- 未検証の数値・手順は書かない（「未確認」を書くくらいなら載せない）
- UI文言は英語のまま併記（例: Settings → Pages）
- 仕様が変わりやすい箇所（コマンドの保存場所等）は「AI自身にやらせる」実習設計にして陳腐化を防ぐ

## 未実施（公開前に必須）
- [ ] 実機再現: 第0章 インストール〜起動（新規環境相当での通し確認）
- [ ] 実機再現: 第8-9章 リポジトリ作成〜Pages公開（手順どおりに1周）
- [ ] 実機再現: 第10-12章 GAS（clasp create-script→push→onEdit即時反応→時間トリガー→日報集計関数の実行）。**メール送信はしない**（mainアカウントは送信deny＝GmailApp.createDraft/Loggerで本文検証、教材上は学習者が自分宛てMailApp.sendEmail）。カレンダーはテストイベント作成→即削除。検証後テスト資産（スプシ・GASプロジェクト・トリガー・下書き・イベント）を全削除
- [ ] 実機再現: 追加実習9本（2026-07-12挿入・各章の関門直前）— 第1章 名前の魔法／第2章 初対面テスト（札の追記→新しいセッション→自動読込→札の表示。デスクトップアプリで通し確認）／第3章 追記地獄実験／第5章 宝探し（仕込みが画面・コード・残存ファイルに漏れないこと、kotae.txt封印の通し確認）／第6章 社長ダッシュボード（HTML/CSSのみのグラフ描画の再現性）／第7章 /dash 再演／第13章 避難訓練（ask確認の実表示・「許可しない」選択・deny拒否の実挙動）／第14章 秘書の進化（5都市一括→CLAUDE.md追記→ブリーフィング再実行。Open-Meteoの current_weather=true URL形式の裏取りも）／第15章 両手の仕事（実MCPサーバーでの読み取り・読み取り専用接続時の代替経路）。検証後、テスト資産（練習フォルダ・練習CSV・ダミーファイル・コマンド）を削除
- [ ] コース2・3の執筆内容のクロスチェック（本台帳との突き合わせ）
