// brand.js — サイトのブランド設定（1箇所で変える）
// 新しい展開のたびに、このファイルの文言だけ差し替えれば見た目が変わる。
// ここには学習コンテンツは書かない（それは js/curriculum/）。

export const BRAND = {
  siteName: 'AI Academy',
  siteNameEn: 'AI ACADEMY',
  mark: 'A', // ヘッダーの一文字マーク

  // キャッチ（トップに出る一行）
  tagline: '読むだけ・見るだけでは、1ミリも進まない。',
  subTagline: '自分の手で組み上げ、動いた証拠を貼って、次へ進む。実践型のAI学習アカデミー。',

  // 到達点の定義（能力ラダーの最上段に出す）
  goalLabel: '設計できる・人に教えられる',

  // 能力ラダー（L1-L4）の表示定義
  ladder: [
    { level: 'L1', name: '毎日AIを使える',        note: '朝の一言で秘書が動く状態' },
    { level: 'L2', name: '業務の一部を任せられる', note: '成果物を作り、世界に公開できる' },
    { level: 'L3', name: '業務フロー全体を設計',   note: 'API・MCP・第二の脳' },
    { level: 'L4', name: '設計でき、人に教えられる', note: '導入設計と外部教育' },
  ],

  footerNote: 'Claude Code をこれから学ぶ人のためのオンラインアカデミー。各レッスンは「実際に手を動かして作る」ことで進みます。',
}
