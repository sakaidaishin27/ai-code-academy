// skipcheck.js — 環境診断による飛び級（すでに出来ている人向け）
//
// 思想: 「もう出来ている」の自己申告では飛ばさない。このアカデミーの流儀どおり、証拠を出させる。
//   ただし証拠の作り方が違う——学習者のAIに【実際の環境を調べさせ】、その診断結果を貼らせる。
//   判定は既存の verify.js をそのまま再利用する（checks の型は同じ）。
//
// 飛ばせるのは「環境として存在が確かめられる章」だけ。
//   例: CLAUDE.md がある / gogが繋がっている / MCPが繋がっている → 診断で証明できる
//   例: CSVから気づきを出す / GASの自動化を動かす / 卒業制作を公開する → 環境からは証明できない＝飛ばせない
// この線引きが、修了証の意味を守る。

// 学習者が自分のClaude Codeに貼る「診断プロンプト」。
// 注意（重要）: 本文の項目名の直後に「:（コロン）」を置かないこと。
//   判定regexは「項目名 + コロン + あり」に一致させるため、プロンプト自体を貼られても誤合格しない設計。
export const DIAG_PROMPT = [
  '私は「AI Academy」というオンライン学習サイトの【環境診断】をしています。すでに出来ている項目を飛び級するための診断です。',
  '',
  '私のPCとアカウントの状態を実際に調べて、下の9項目それぞれを「あり」か「なし」で判定してください。',
  '',
  '大事なルール:',
  '- 推測で答えないこと。実際にファイル・フォルダ・設定・接続を確認してから判定してください',
  '- 見つからないものは正直に「なし」にしてください（「なし」があっても何も問題ありません）',
  '- 確認に必要なコマンドは、あなたが実行してください（私は許可を押すだけです）',
  '',
  '調べる9項目:',
  '1. 基地フォルダ — 私がClaude Codeでいつも使っている仕事用フォルダ（CLAUDE.md や KNOWLEDGE.md、output/ などが入っている場所）があるか。名前は何でもよい',
  '2. CLAUDE.md — 基地に CLAUDE.md があり、中身が書かれているか（空ファイルでないか）',
  '3. KNOWLEDGE.md — 基地に KNOWLEDGE.md があり、中身が書かれているか',
  '4. Google接続 — gog などで Googleカレンダー / Gmail を読める状態か（実際に接続を確認して）',
  '5. カスタムコマンド — 自分で作ったスラッシュコマンド（スキル）が1つ以上あるか',
  '6. GitHub接続 — GitHub と接続済みで、リポジトリを作れる状態か（認証状態を確認して）',
  '7. 権限設定 — settings.json の permissions に allow / ask / deny のルールが書かれているか',
  '8. MCP接続 — MCP で外部サービス（Notion・Slack・Drive など）が1つ以上つながっているか',
  '9. 第二の脳 — 知識をためる wiki や sources のフォルダ（第二の脳）があるか',
  '',
  '出力の形式:',
  '1行目に 【AI Academy 環境診断】 と書いてください。',
  'そのあと9行で、上の1〜9の項目名をそのまま使い、項目名のうしろに半角コロンを付けて「あり」か「なし」だけを書いてください（その行に補足は書かない）。',
  'そのあとに、判定の根拠を項目ごとに1行ずつ、簡単に説明してください。',
  '',
  '最後に、「なし」だった項目について、それが何のためのものかを一言ずつ教えてください。',
].join('\n')

// 1項目 = 1章。checks は verify.js の型をそのまま使う。
// regex は「行頭（番号があってもよい）＋項目名＋コロン＋あり」に限定＝プロンプトの説明文には一致しない。
// 行頭の装飾（番号・箇条書きのハイフン/中黒・太字の**）を許容する。
// AIは「**CLAUDE.md**: あり」「- CLAUDE.md: あり」「1. CLAUDE.md: あり」など様々な形で返すため。
// ただし「項目名 + コロン + あり」の並びは必須＝診断プロンプト本文（項目名の後にコロンを置いていない）には一致しない。
function hit(name) {
  return '^\\s*(?:[-*・]\\s*)?(?:\\d+[.)]\\s*)?\\**\\s*' + name + '\\s*\\**\\s*[:：]\\s*\\**\\s*あり'
}

export const SKIP_ITEMS = [
  {
    chapterId: 'ch0',
    what: 'Claude Code が動いている',
    verify: {
      checks: [
        { type: 'contains', value: '【AI Academy 環境診断】', label: '診断を実行した（Claude Codeが動いている）' },
        // 「項目名: あり／なし」の判定行が実在すること。
        // これが無いと、診断プロンプトそのものを貼っただけで通ってしまう（誤合格ガード）
        { type: 'regex', pattern: '[:：]\\s*(?:あり|なし)', flags: 'm', label: '判定行（あり／なし）が出力されている' },
        { type: 'minChars', min: 60, label: '診断結果に中身がある' },
      ],
      passRule: 'all',
    },
  },
  {
    chapterId: 'ch1',
    what: '基地フォルダがある',
    verify: { checks: [{ type: 'regex', pattern: hit('基地フォルダ'), flags: 'm', label: '基地フォルダ: あり' }], passRule: 'all' },
  },
  {
    chapterId: 'ch2',
    what: 'CLAUDE.md（指示書）がある',
    verify: { checks: [{ type: 'regex', pattern: hit('CLAUDE\\.md'), flags: 'im', label: 'CLAUDE.md: あり' }], passRule: 'all' },
  },
  {
    chapterId: 'ch3',
    what: 'KNOWLEDGE.md（記憶ノート）がある',
    verify: { checks: [{ type: 'regex', pattern: hit('KNOWLEDGE\\.md'), flags: 'im', label: 'KNOWLEDGE.md: あり' }], passRule: 'all' },
  },
  {
    chapterId: 'ch4',
    what: 'Googleと繋がっている',
    verify: { checks: [{ type: 'regex', pattern: hit('Google接続'), flags: 'im', label: 'Google接続: あり' }], passRule: 'all' },
  },
  {
    chapterId: 'ch7',
    what: 'カスタムコマンドを持っている',
    verify: { checks: [{ type: 'regex', pattern: hit('カスタムコマンド'), flags: 'm', label: 'カスタムコマンド: あり' }], passRule: 'all' },
  },
  {
    chapterId: 'ch8',
    what: 'GitHubと繋がっている',
    verify: { checks: [{ type: 'regex', pattern: hit('GitHub接続'), flags: 'im', label: 'GitHub接続: あり' }], passRule: 'all' },
  },
  {
    chapterId: 'ch10',
    what: '権限（守り）を設定している',
    verify: { checks: [{ type: 'regex', pattern: hit('権限設定'), flags: 'm', label: '権限設定: あり' }], passRule: 'all' },
  },
  {
    chapterId: 'ch12',
    what: 'MCPでサービスを繋いでいる',
    verify: { checks: [{ type: 'regex', pattern: hit('MCP接続'), flags: 'im', label: 'MCP接続: あり' }], passRule: 'all' },
  },
  {
    chapterId: 'ch13',
    what: '第二の脳を持っている',
    verify: { checks: [{ type: 'regex', pattern: hit('第二の脳'), flags: 'm', label: '第二の脳: あり' }], passRule: 'all' },
  },
]

// 診断で飛ばせない章の説明（画面で正直に伝える）
export const NOT_SKIPPABLE_NOTE =
  'CSVの分析・リサーチレポート・Webサイトの公開・GASの自動化・APIを叩く・卒業制作は、' +
  '「環境があるか」では証明できません（実際にやって初めて身につくものだからです）。これらは飛ばせません。'
