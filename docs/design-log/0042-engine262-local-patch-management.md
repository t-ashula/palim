# ADR-0042 Design log: engine262 の固定 revision とローカルパッチ管理

## 記録範囲

ADR-0042 で決定したローカルパッチ管理について、現在の構成、既存パッチの導入理由、今回修正する ECMAScript Annex B の範囲、回帰条件、および upstream 追従時の確認事項を記録する。

## 現在の依存構成

engine262 は `conformance/conformance.json` の `engine262/engine262` fixture として commit SHA を固定している。
`tools/conformance/sync.sh` が fixture を取得した後、`tools/conformance/engine262/engine262/post-checkout.sh` を実行する。

post-checkout 処理は次を行う。

1. `tools/conformance/engine262/engine262/patches/` にあるパッチを取得した source へ適用する
2. engine262 が参照する Test262 submodule を取得する
3. engine262 の dependency を導入して package を build する
4. build 済み source を `vendor/engine262` へ配置する

palim の npm dependency は `file:vendor/engine262` を参照する。
`vendor/engine262` は生成物であり、ローカルパッチの変更先にはしない。

パッチが未適用の source に適用できず、適用済みの source としても確認できない場合、post-checkout 処理は失敗する。

## 既存パッチの導入経緯

commit `2fb5383` は、npm registry の engine262 package を直接参照する構成から、同じ upstream revision を取得してローカルパッチを適用する構成へ変更した。

この変更は、固定している WPT revision の `resources/testharness.js` が使用する次の pattern と一致する。

```js
/^\(\)\s*=>\s*(?:{(.*)}\s*|(.*))$/
```

既存の `annex-b-extended-pattern-character.patch` は、非 Unicode pattern で `]`、`{`、および `}` を `ExtendedPatternCharacter` として扱う変更を `RegExpParser` へ加えている。

パッチ前の parser は、atom 位置の `{` を syntax character として拒否し、group の後の `}` を disjunction の終端として扱う。
既存パッチの二つの変更は、この pattern に含まれる `{` と `}` を通常文字として処理する。

commit の前には wptrunner 接続と page script error の host への報告が実装されている。導入理由を直接記録した文書はないが、commit の時系列、patch の変更箇所、および `testharness.js` の pattern から、WPT 共通 harness の読み込みを可能にすることが既存パッチの目的だったと判断する。

## 現在のパッチに残る仕様差

既存パッチは `ExtendedPatternCharacter` を atom として受理するが、atom の後で `{` を見た `maybeParseQuantifier()` は無条件に `{` を消費し、decimal digits を要求する。

このため、次のように既存 atom の直後に量指定子ではない `{` が続く pattern を拒否する。

```js
/x{o}x/
/\${([^ }]*)}/g
```

ECMAScript Annex B.1.2 では、`u` と `v` のどちらもない pattern に代替 grammar を適用する。
量指定子として成立しない `{` と `}` は `ExtendedPatternCharacter` として扱われる。

一方、既存パッチは atom 位置の `{` を一律に通常文字として受理するため、`InvalidBracedQuantifier` として early error にすべき次の pattern も受理する。

```js
/{2}/
/{2,}/
/{2,3}/
```

今回の変更では、単に `{` の後が digit かを判定するだけではなく、Annex B.1.2 の production 順序に従い、`ExtendedAtom Quantifier`、`ExtendedAtom`、および `InvalidBracedQuantifier` を区別する必要がある。

## 変更対象

変更対象は engine262 の正規表現 pattern parser と、その regression test に限定する。
palim の engine adapter、page script loader、WPT resource、および fixture は変更しない。

ローカルパッチは取得した engine262 source へ適用できる diff として管理する。
現在の Annex B パッチを置き換える場合も、既存パッチが受理できるようにした pattern を回帰条件として残す。

今回の問題と独立した Annex B production や built-in の不足は、同じパッチへ追加しない。

## 回帰条件

### 非 Unicode pattern として受理する

- `/]/`
- `/{/`
- `/}/`
- `/^\(\)\s*=>\s*(?:{(.*)}\s*|(.*))$/`
- `/x{o}x/`
- `/\${([^ }]*)}/g`
- `/a{2}/`
- `/a{2,}/`
- `/a{2,3}/`

### SyntaxError とする

- `/{2}/`
- `/{2,}/`
- `/{2,3}/`
- `/a{2,1}/`
- `u` または `v` flag を付けた bare な `]`、`{`、`}`
- `u` または `v` flag を付けた `/x{o}x/`

量指定子の上下限、greedy と non-greedy、および pattern の compile 結果は、parse の成否だけでなく既存 Test262 case で確認する。

## 検証

engine262 側では、次を確認する。

- engine262 の project test へ今回の最小 regression case を追加する
- Test262 の `test/annexB/language/literals/regexp/extended-pattern-char.js` を実行する
- Test262 の `invalid-braced-quantifier-*` と `invalid-quantifier-out-of-order.js` を実行する
- `u` と `v` で extended pattern character を拒否する Test262 case を実行する
- engine262 の build を完了する

palim 側では、次を確認する。

- fixture 同期によって固定 revision へパッチを再適用し、`vendor/engine262` を生成できる
- WPT の `/html/syntax/parsing/html5lib_url.html` を個別実行し、`resources/template.js` の syntax error を越える
- `html5lib_write.html` と `html5lib_write_single.html` でも同じ syntax error を越える
- WPT 共通の `testharness.js` が既存の arrow function 検出 pattern で syntax error にならない
- project が規定する統合前検証を実行する

syntax error を越えた後に現れる HTML parser、`Document.write()`、または test harness の独立した failure は、今回の engine262 patch へ含めない。

## upstream 追従

engine262 upstream へ同等の修正を提出できる形で、仕様参照と regression test をパッチ内に保持する。

upstream revision を更新するときは、次を確認する。

1. upstream source に同等の grammar 処理が含まれる
2. upstream test に正と負の回帰 case が含まれる
3. ローカルパッチを外した fixture を build できる
4. この design log で指定した Test262 case が通る
5. 対象 WPT が同じ syntax error を再発しない

revision 更新と patch 除去は、palim の別の実装変更と混ぜない。

## 参考資料

- [ADR-0042](../decisions/0042-engine262-local-patch-management.md)
- [ADR-0026](../decisions/0026-javascript-engine-connection.md)
- [ADR-0033](../decisions/0033-wptrunner-product-integration.md)
- [engine262 fixture manifest](../../conformance/conformance.json)
- [engine262 patch application](../../tools/conformance/engine262/engine262/post-checkout.sh)
- [既存の Annex B patch](../../tools/conformance/engine262/engine262/patches/annex-b-extended-pattern-character.patch)
- [ECMAScript 2026: Annex B.1.2 Regular Expressions Patterns](https://tc39.es/ecma262/2026/multipage/additional-ecmascript-features-for-web-browsers.html#sec-regular-expressions-patterns)
- [Test262: extended pattern characters](https://github.com/tc39/test262/blob/main/test/annexB/language/literals/regexp/extended-pattern-char.js)
