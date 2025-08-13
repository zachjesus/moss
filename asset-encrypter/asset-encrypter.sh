#!/bin/sh 

inotifywait -m -e close_write "$WATCH_DIR" --format '%f' |
while read filename; do
  if echo "$filename" | grep -qE '\.(epub|pdf)$'; then
    base="${filename%.*}"
    asset_name="${base%-*}"
    identifier="${base##*-}"
    ext="${filename##*.}"

    echo "Encrypting $filename (asset: $asset_name, id: $identifier)..."
    lcpencrypt \
      -input "$WATCH_DIR/$filename" \
      -storage "$ENCRYPTED_DIR" \
      -url "file:///$ENCRYPTED_DIR" \
      -filename "${asset_name}_${identifier}.lcp.${ext}" \
      -contentid "$identifier" \
      -lcpsv "$LCP_SERVER_URL" \
      -v2 \
      -verbose

    echo "Encrypted $filename to $ENCRYPTED_DIR/${asset_name}_${identifier}.lcp.${ext} and notified LCP server"
  fi
done