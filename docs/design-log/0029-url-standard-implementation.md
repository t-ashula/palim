# ADR-0029 Design log: URL Standard の実装境界と適合テスト

## 記録範囲

URL Standard が規定するデータ、algorithm、入力、および結果はこの文書に転記しない。palim で採用しない構成、palim 固有の接続、および完了条件だけを記録する。

## 実装境界

- `node:url` と `globalThis.URL` を実装または代替として使用しない
- host native URL object を内部表現または module 間の値として使用しない
- URL 実装を runtime ごとに差し替える設定を設けない
- URL 実装を DOM、Window、JavaScript engine、および host realm に依存させない
- 実装固有の object を consumer へ公開しない

module と file の分割は、仕様の章構成を転記せず、palim 内の依存方向と test 単位に基づいて決める。

## Consumer migration

1. ADR-0028 で追加した `Document`、Window environment settings、classic script、および origin の URL 処理を移行する
2. hyperlink member の URL 処理を同じ実装へ移行する
3. `node:url` import、host `URL` 型、および URL 処理のために追加した build 設定を削除する

## Conformance test

WHATWG および WPT が提供・指定する URL test suite を使用する。data fixture、testharness test、および wrapper の採否を先に限定せず、upstream が定める形式と判定方法に従う。

外部 test suite の revision は ADR-0002 の方針に従って `conformance/conformance.json` で管理する。case を黙って除外せず、実行対象外にする場合は test 名、case ID、および理由を記録する。

## Project test

upstream の URL test suite では扱わない palim 固有の接続だけを project test で確認する。

- ADR-0028 と hyperlink member が同じ URL 実装を使用する
- consumer へ host native URL object が漏れない
- parser-only と Window の import graph が `node:url` を読み込まない
- consumer 移行後も既存の公開挙動と ADR-0028 の完了条件を維持する

不具合の regression test を追加する場合も、期待値は URL Standard と upstream test suite に基づく。

## 完了条件

- WHATWG および WPT が提供・指定する URL test suite を実行し、対象外 case がある場合は case ID と理由が結果へ記録される
- URL test suite に対する適合結果を既存の conformance reporting で確認できる
- ADR-0028 と hyperlink member の URL 処理が移行され、既存の完了条件と公開挙動を維持する
- URL 処理を目的とする `node:url`、`globalThis.URL`、host `URL` 型、および build 設定が実装コードに残らない
- parser-only と Window の import boundary test が host URL module の非読込を確認する
- project の format、lint、typecheck、test、および build が成功する

## 参考資料

- [ADR-0029](../decisions/0029-url-standard-implementation.md)
- [ADR-0002 Design log](./0002-compliance-measurement.md)
- [ADR-0028 Design log](./0028-window-classic-script-execution.md)
- [WHATWG URL Standard](https://url.spec.whatwg.org/)
- [WHATWG URL repository](https://github.com/whatwg/url)
- [WPT URL tests](https://github.com/web-platform-tests/wpt/tree/master/url)
