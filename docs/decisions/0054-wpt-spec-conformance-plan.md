# ADR-0054: WPT と仕様に基づく適合度計測と改善計画

## ステータス

accepted

## コンテキスト

palim の適合状況を継続的に把握し、未達項目を実装計画へ変換する必要がある。
固定した WPT revision の browser profile は page realm を含む実際の結果を計測でき、Living Standard は期待動作と修正の完了条件を定める。

ADR-0053 は仕様上の behavior を独自に列挙し、層別 status と manifest を別に管理する方法を定めた。
この方法は WPT report、仕様確認、および TODO と重複する管理対象を増やし、適合度の改善へ直接つながらない。

## 決定

- ADR-0053 を廃止し、層別計測、behavior manifest、stable ID、および独立した DOM 適合度 report は導入しない
- 適合度は ADR-0038 と ADR-0040 に従う WPT browser profile の report で計測する
- 固定した WPT revision と選択範囲を母数とし、実行進捗、URL の成功率、および subtest の結果を分けて記録する
- 現在の Living Standard への適合度には non-tentative の結果を使用し、tentative の結果は分離する
- Living Standard を期待動作、failure の解釈、修正方針、および完了条件の根拠とする
- WPT の non-pass は、製品の capability、runner または harness の問題、および仕様との不一致に分類する
- 製品の不足は WPT URL 単位ではなく、実装する capability または仕様 algorithm 単位で TODO に記録する
- 各 TODO には仕様 section、関係する WPT、前提となる capability、および完了条件を記録する
- 改善順序は、未実行 test を減らすための計測上の blocker、複数領域で共有する前提 capability、依存される仕様 algorithm、個別の不足の順に検討する
- 一項目ごとに対象 WPT の変更前結果を記録し、仕様に基づいて修正し、同じ WPT の変更後結果を確認する
- project test は仕様動作の回帰検出と WPT が扱わない条件の補完に使用し、WPT の適合度へ算入しない
- WPT が存在しない仕様項目は仕様参照と project test を持つ TODO として管理し、WPT の成功率には混ぜない
- full campaign は基準値の作成、対象範囲または WPT revision の更新、および改善の節目で再実行し、report と計画を更新する

計測結果は `reports/wpt/`、実装計画は `TODO.md`、一項目の調査記録は `tmp/todo/` で管理する。
別の manifest や status 系列は追加しない。

## 影響

- 適合度は既存の WPT report から継続的に比較できる
- 実装計画は WPT failure と仕様上の不足から製品 capability 単位で作成される
- WPT が周辺 capability で停止した場合も non-pass として残るが、対象 algorithm の不具合とは区別できる
- WPT の成功率だけでは WPT が扱わない仕様項目の実装状況を表せないため、それらは TODO と project test で補完する
- ADR-0053 を前提とする文書と TODO は整理が必要になる

## 代替案

### behavior manifest と層別 status を維持する

既存の WPT report、作業記録、および TODO と同じ情報を別形式で維持する負担が大きいため採用しない。

### WPT の成功率だけから修正内容を決める

WPT の実行条件や固定 revision の期待が現在の Living Standard と一致するとは限らず、仕様上の修正範囲と完了条件を決められないため採用しない。

### 仕様項目を独自に全列挙して適合率を算出する

列挙単位と母数の維持自体が大きな作業となり、外部 test suite と比較できない独自指標になるため採用しない。

## 参考資料

- [ADR-0002](./0002-compliance-measurement.md)
- [ADR-0038](./0038-wpt-progress-report.md)
- [ADR-0040](./0040-wpt-partitioned-campaign.md)
- [ADR-0044](./0044-remove-wpt-dom-shell-profile.md)
- [ADR-0053](./0053-layered-dom-conformance-measurement.md)
- [WPT 適合度改善の作業方針](../wpt-conformance-workflow.md)
- [WHATWG Living Standards](https://spec.whatwg.org/)
- [Web Platform Tests](https://web-platform-tests.org/)
