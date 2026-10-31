# ADR-0011: HTML byte input と encoding detection

## ステータス

accepted

## コンテキスト

palim の HTML parser は JavaScript の文字列を入力として tokenization と tree construction を実行する。

HTML resource は file や network response から byte sequence として取得される場合がある。
HTML Standard の input byte stream は、tokenization に渡す code point stream を生成するための encoding 決定手順を規定している。
Encoding Standard は encoding label、BOM、および decoder を規定している。

byte input の前処理結果には、後段の HTML parser が使用する文字列と、生成する `Document` の encoding metadata に使用する encoding が必要である。

## 決定

- HTML byte input の前処理 API として `decodeHTMLBytes(input, options)` を追加する
- `input` は `Uint8Array` とする
- `options` は transport layer から得た encoding label と fallback encoding label を受け取る
- 戻り値は復号済み文字列と、復号に使用した encoding を含む
- `meta` prescan の探索範囲は先頭 1024 bytes とする
- fallback encoding の既定値は UTF-8 とする
- encoding label の解決と byte sequence の復号には実行環境の `TextDecoder` を使用する
- fallback encoding label を解決できなかった場合は `TypeError` を送出する

## 影響

- byte sequence から HTML parser の入力文字列を生成できる
- encoding 決定と復号を tokenization および tree construction から分離できる
- 復号結果と encoding metadata を同じ結果から後段へ渡せる
- UTF-8 以外の Encoding Standard の文字エンコーディングを実行環境の decoder で扱える
- encoding declaration の探索範囲が先頭 1024 bytes に固定される

## 参考資料

- [ADR-0005](./0005-dom-parser.md)
- [WHATWG HTML: The input byte stream](https://html.spec.whatwg.org/multipage/parsing.html#the-input-byte-stream)
- [WHATWG Encoding](https://encoding.spec.whatwg.org/)
