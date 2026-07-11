#!/bin/bash
# deploy.sh — AI業務OS道場 を Cloudflare Pages（個人アカウント）へ安全デプロイ
#
# 【重要・不可逆事故ガード】
#   このスクリプトは N1（エヌイチ）のアカウントを絶対に指さない。
#   個人アカウント（74747d4d…）のみ。project-name も専用。
#   N1 の予習教材.v3/deploy.sh を in-place 編集して流用してはいけない（誤爆の元）。
#
# 方式（v3 の安全デプロイを踏襲）:
#   1. 公開してよいファイルだけを一時ディレクトリへ rsync で抽出
#   2. 内部ファイル（*.md / *.sh / .git 等）が混入していないか最終チェック（あれば中断）
#   3. wrangler pages deploy で個人アカウントへデプロイ
#
# 前提: js/config.js が存在すること（Supabase URL/anon key もしくは demo 合言葉）。
#       トークンは ~/.cf_token（コマンドラインにトークンを出さない）。

set -euo pipefail

# ---- 個人アカウント固定（ここは絶対に N1 の値にしない）----
PERSONAL_ACCOUNT_ID="74747d4d"   # 個人アカウントの先頭。フルIDは環境変数/実行時に補完
PROJECT_NAME="ai-code-academy"

SRC_DIR="$(cd "$(dirname "$0")" && pwd)"
STAGE="$(mktemp -d)"
trap 'rm -rf "$STAGE"' EXIT

echo "[deploy] source: $SRC_DIR"
echo "[deploy] project: $PROJECT_NAME (personal account $PERSONAL_ACCOUNT_ID…)"

# ---- 前提チェック ----
if [ ! -f "$SRC_DIR/js/config.js" ]; then
  echo "[deploy] 中断: js/config.js がありません。config.example.js をコピーして作成してください。" >&2
  exit 1
fi

# ---- 公開対象だけをステージへ抽出（ホワイトリスト）----
rsync -a \
  --include='index.html' \
  --include='login.html' \
  --include='css/***' \
  --include='js/***' \
  --include='guide/***' \
  --include='assets/***' \
  --exclude='*' \
  "$SRC_DIR/" "$STAGE/"

# 念のため内部ファイルを物理除外
find "$STAGE" -type f \( -name '*.md' -o -name '*.sh' -o -name '*.sql' -o -name '.gitignore' \) -delete
rm -rf "$STAGE/.git" 2>/dev/null || true
# 実データの混入防止（同梱はダミーのみのはずだが二重に守る）
find "$STAGE/assets" -type f -name 'real-*' -delete 2>/dev/null || true

# ---- 混入チェック（1つでも見つかれば中断）----
LEAK="$(find "$STAGE" -type f \( -name '*.md' -o -name '*.sh' -o -name '*.sql' \) -print)"
if [ -n "$LEAK" ]; then
  echo "[deploy] 中断: 内部ファイルがステージに混入しています:" >&2
  echo "$LEAK" >&2
  exit 1
fi

echo "[deploy] staged files:"
find "$STAGE" -type f | sed "s|$STAGE/|  |"

# ---- デプロイ ----
if [ ! -f "$HOME/.cf_token" ]; then
  echo "[deploy] 中断: ~/.cf_token がありません。" >&2
  exit 1
fi
export CLOUDFLARE_API_TOKEN="$(cat "$HOME/.cf_token")"
# フルの個人アカウントIDは実行時に環境変数で渡す（先頭一致を検証）
: "${CLOUDFLARE_ACCOUNT_ID:?個人アカウントのフルIDを CLOUDFLARE_ACCOUNT_ID に設定してください（74747d4d…）}"
case "$CLOUDFLARE_ACCOUNT_ID" in
  ${PERSONAL_ACCOUNT_ID}*) : ;;  # OK
  *) echo "[deploy] 中断: CLOUDFLARE_ACCOUNT_ID が個人アカウント($PERSONAL_ACCOUNT_ID…)で始まっていません。N1混入の恐れ。" >&2; exit 1 ;;
esac

npx wrangler@latest pages deploy "$STAGE" --project-name "$PROJECT_NAME"
echo "[deploy] done."
