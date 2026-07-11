// applied.js — 応用トラック（顧客固有・差し替えレイヤー）
// この例は「はこねフローリスト（淡輪さん）＝花屋」向け。
// 別の顧客に展開するときは、このファイルだけ差し替える（共通コア core.js はそのまま）。
//
// 目玉（ヒーロー）＝ Rung1直後に差し込む「人件費ミニ体験」。
// 初週で最痛点（人件費が日報に乗っておらず"本当の利益"が見えない）が1つ解ける体験を先取りする。
// ※実データはリポジトリに置かない。ここでは完全にダミーのサンプルCSVを使う。
//   本番演習は本人の実データをローカル（file://隔離）で行う。

export const APPLIED_TRACK = {
  id: 'hakone',
  name: '花屋の実務トラック（応用・はこねフローリスト）',
  isShared: false,
  // このトラックは共通コアの「どの Rung の直後に差し込むか」を持つ
  insertAfter: 'rung1',
  rungs: [
    {
      id: 'applied-genri',
      level: 'L1→L2',
      order: 0,
      title: '本当の利益を出す（人件費ミニ体験）',
      goal: '売上から人件費まで引いた「本当の利益」を、AIに集計させて初めて1枚で見る',
      concept: {
        summary: '日報に人件費が乗っていないと、売れているのに利益が薄い日が見えない。勤怠データ（働いた時間）と日報（売上）をAIに突き合わせさせると、店舗ごと・日ごとの「人件費を引いた本当の利益」が出る。まずはダミーデータで手順を体験し、本番は自分の実データでやる。',
        analogy: '人件費統合 ＝ 売上の裏でかかっている「人のコスト」を並べて初めて分かる本当の儲け',
        readLink: { href: 'guide/index.html#knowledge', label: '環境設計ガイド 第4章（データを扱う考え方）' },
      },
      build: {
        intro: 'まずは同梱のダミーCSV2枚（売上日報・勤怠）で体験します。下のプロンプトを自分のClaude Codeに貼り、2つのサンプルCSVを渡してください。（本番は同じ手順を自分の実データでローカルで行います）',
        prompt: [
          '花屋の「本当の利益」を出したいです。渡す2つのCSVを使ってください。',
          '- 売上日報CSV（列: 日付, 店舗, 売上, 仕入原価）',
          '- 勤怠CSV（列: 日付, 店舗, スタッフ, 勤務時間, 時給）',
          '',
          'やってほしいこと:',
          '1. 勤怠CSVから、店舗ごと・日付ごとの人件費（勤務時間 × 時給の合計）を計算する',
          '2. 売上日報CSVに突き合わせ、店舗ごと・日付ごとに「本当の利益 = 売上 − 仕入原価 − 人件費」を出す',
          '3. 利益率が低い日・店舗が分かるように、表で分かりやすくまとめる',
          '',
          'サンプルCSVは assets/data/sample-uriage-nippou.csv と assets/data/sample-kintai.csv です。',
        ].join('\n'),
      },
      verify: {
        instruction: 'AIが出した集計結果（本当の利益の表など）を貼り付けてください。',
        checks: [
          { type: 'contains', value: '人件費', label: '人件費が計算されている' },
          { type: 'contains', value: '利益', label: '利益が出ている' },
          { type: 'keywordsAny', values: ['店舗', '本店', '日付', '合計'], min: 1, label: '店舗別／日別に集計されている' },
        ],
        passRule: { min: 2 },
      },
      homework: '本番の自分の1ヶ月分の日報と勤怠で同じことをやってみて、「利益が薄い日」を1つ見つける。',
      ready: true,
    },

    // ---- 以下は応用トラックの地図＋骨子（本格版はセッションで肉付け）----
    {
      id: 'applied-dashboard',
      level: 'L2',
      order: 1,
      title: '数字ダッシュボード（売上・人件費）',
      goal: '毎日ぱっと見られる売上・人件費・利益のダッシュボードを自分で作る',
      concept: {
        summary: '主力（生花＋胡蝶蘭）で売上の大半を占める構造を、日次でリアルタイムに把握できるようにする。（準備中）',
        analogy: 'ダッシュボード ＝ 経営の計器盤',
        readLink: { href: 'guide/index.html#commands', label: '環境設計ガイド 第5章' },
      },
      build: { intro: 'セッションで一緒に組み立てます（準備中）。', prompt: '' },
      verify: { instruction: '', checks: [], passRule: 'all' },
      homework: '',
      ready: false,
    },
    {
      id: 'applied-teian',
      level: 'L2',
      order: 2,
      title: '提案資料を高速で作る（ブライダル・植栽）',
      goal: 'ブライダルや植栽の提案資料を、AIで一気に下書きする型を作る',
      concept: {
        summary: '毎回ゼロから作っている提案資料を、テンプレ＋AIで下書きまで一気に持っていく。（準備中）',
        analogy: '提案資料の型 ＝ 毎回使える設計図',
        readLink: { href: 'guide/index.html#commands', label: '環境設計ガイド 第5章' },
      },
      build: { intro: 'セッションで一緒に組み立てます（準備中）。', prompt: '' },
      verify: { instruction: '', checks: [], passRule: 'all' },
      homework: '',
      ready: false,
    },
  ],
}
