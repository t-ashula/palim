# ADR-0045: WPT 対象範囲の拡張

## ステータス

accepted

## コンテキスト

ADR-0033 は、palim が対象とする機能領域を WPT の実行対象とし、その領域では実装状況を理由に test を事前除外しない方針を定めている。
現在の WPT 対象範囲は、直近の適合対応で非 HTML 要素 object を追加する前に定められたものであり、現在の page realm の公開範囲と一致していない。

機能追加に合わせて WPT browser profile の対象範囲へ反映する必要がある。

## 決定

- 対応する WPT の機能領域が現在の対象範囲に含まれていなければ対象へ追加する
- 対象範囲は固定した WPT revision の manifest にある機能領域を単位とする
- 追加した機能領域では、未実装機能や関連 capability の不足を理由に test を事前除外しない
- WPT source、fixture、assertion、および期待値を palim の実装状況に合わせて変更しない

## 影響

- page realm に公開している object の未実装部分と関連 capability の不足が WPT の結果へ現れる
- WPT の対象 URL、実行時間、timeout、および継続レポートの母数が増える
- failure の調査では、対象 object の挙動と実行に必要な関連 capability を区別する必要がある
- WPT の結果は page realm を含む統合結果であり、domain object 単独の適合度としては扱えない
- 今後 page realm の公開範囲を変更するときは、WPT の対象範囲も確認する必要がある

## 代替案

### 現在の対象範囲を維持する

追加した object の実装状況が継続的な適合度計測から外れたままになるため採用しない。

### 実行可能な個別 test を追加する

実装状況に応じて母数を縮小でき、未実装範囲が計測結果から消えるため採用しない。

### project test を適合度計測に使用する

実装と同じ仕様解釈を共有し得るため、回帰検出に限定する。

## 参考資料

- [ADR-0002](./0002-compliance-measurement.md)
- [ADR-0033](./0033-wptrunner-product-integration.md)
- [ADR-0040](./0040-wpt-partitioned-campaign.md)
- [ADR-0044](./0044-remove-wpt-dom-shell-profile.md)
