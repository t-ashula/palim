# ADR-0051 Design log: Window extension と host services

## 現在の処理

`WindowRealmBinding` は palim が実装する interface と global を固定した手順で構築する。
利用者が選択した API 群を Window realm の生成時に追加する lifecycle は存在しない。

host の機能を必要とする処理は、それぞれの実装から host runtime を直接使用している。
extension が host 機能を要求し、その結果を page realm の値として扱うための共通層も存在しない。

## global property の直接設定では不足する理由

次の形で host の値を渡しても、Window realm の polyfill にはならない。

```ts
await open(url, {
  scripting: "enabled",
  window: { fetch },
});
```

`fetch` は host realm の function であり、page realm の function ではない。
戻り値も host の Promise と Response になる。
さらに Fetch API には `Request`、`Response`、`Headers`、body、および abort の処理が必要になる。

XMLHttpRequest も constructor を一つ追加するだけでは成立しない。
instance state、upload object、progress event、body conversion、および task scheduling を同じ Window の処理として構築する必要がある。

任意の host object を engine value に変換する共通処理を増やしても、API 間の identity、内部状態、Web IDL conversion、および event loop との接続は復元できない。

## 設計の二つの軸

```text
open()
  ├─ host services
  │    ├─ network I/O
  │    ├─ clock や entropy
  │    └─ その他の host 機能
  └─ Window realm
       └─ extensions
            ├─ API 群 A
            └─ API 群 B
```

一つ目は、polyfill を host value の集合ではなく、Window realm に API 群を構築する extension として扱うことである。

二つ目は、realm 内だけでは完結しない処理を host services に置き、extension が service ごとの中間表現を介して利用することである。

## 公開 API

`OpenOptions` は extension の配列を受け取る。

```ts
export interface OpenOptions {
  readonly scripting?: "enabled";
  readonly extensions?: readonly WindowExtension[];
}

export type WindowExtension = (context: WindowExtensionContext) => void;
```

利用者は API ごとの extension factory を明示的に呼び出す。

```ts
import { open } from "palim";
import { fetchPolyfill } from "@palim/polyfills/fetch";

await open(url, {
  scripting: "enabled",
  extensions: [fetchPolyfill()],
});
```

複数の extension も同じ形で指定する。

```ts
import { xhrPolyfill } from "@palim/polyfills/xhr";

await open(url, {
  scripting: "enabled",
  extensions: [fetchPolyfill(), xhrPolyfill()],
});
```

`extensions` が未指定または空の場合は追加の global を生成しない。
空でない `extensions` には scripting enabled を要求する。

## extension の実行

Window realm の標準 global を構築した後、HTML/XML の処理と page script の実行を始める前に、配列の順序で extension を実行する。

extension は同期的に realm を構築する。
host の非同期処理は、page script が extension の API を呼び出した後に開始する。

extension の実行に失敗した場合は、その Window で page script を実行しない。
必要な host service が存在しない場合も extension の実行時に失敗させる。

iframe の child Window には同じ extension の配列を渡す。
factory が返した extension は再利用するが、realm に公開する function、constructor、prototype、および object は child ごとに生成する。

extension の閉包には設定を保持できる。
realm に所属する状態は閉包で共有せず、各 `WindowExtensionContext` から生成する。

## `WindowExtensionContext`

extension は JavaScript engine の value や host の global object を直接受け取らない。
`WindowExtensionContext` は、対象 Window に API を構築するための操作を提供する。

```ts
export interface WindowExtensionContext {
  readonly realm: WindowRealmInstaller;
  readonly window: WindowEnvironment;
  readonly tasks: WindowTaskScheduler;
  readonly host: HostServices;
}
```

`WindowRealmInstaller` は対象 realm に所属する function、constructor、prototype、object、Promise、および exception を生成し、global property を定義する。
Web IDL conversion と interface branding もこの操作を通して設定する。

`WindowEnvironment` は Document の URL、origin、および Window の有効状態を提供する。
`WindowTaskScheduler` は host の完了通知を Window task と Promise job に接続する。

extension package は engine262 に依存しない。
engine adapter 固有の value は `WindowExtensionContext` の外へ公開しない。

## host services

host services は、page realm に所属できない機能を extension に提供する。
service は型付きの key で取得し、scripting 側で API 名ごとの分岐を持たない。

```ts
export interface HostServices {
  require<T>(key: HostServiceKey<T>): T;
}
```

service の入力、出力、取消、および失敗は、その service が定義する中間表現を使用する。
host の object を page realm の値として返さない。

### network service の例

network service は HTTP client の host object を返さず、次のような中間表現を使用する。

```ts
export interface HostNetwork {
  request(request: HostNetworkRequest): Promise<HostNetworkResponse>;
}

export interface HostNetworkRequest {
  readonly url: string;
  readonly method: string;
  readonly headers: readonly (readonly [string, string])[];
  readonly body: HostRequestBody | null;
  readonly cancellation: HostCancellation;
}

export interface HostNetworkResponse {
  readonly url: string;
  readonly status: number;
  readonly statusText: string;
  readonly headers: readonly (readonly [string, string])[];
  readonly body: HostResponseBody;
}
```

`HostRequestBody` と `HostResponseBody` は byte sequence または host 側の byte stream を表す。
これらは page の `ReadableStream`、`Blob`、`FormData`、`Request`、または `Response` ではない。

host network の Promise と失敗理由も page script へ返さない。
extension が完了結果を Window task と対象 realm の Promise、Response、event、または exception に変換する。

取消は page の `AbortSignal` object を host に渡すのではなく、`HostCancellation` へ接続する。
Window が無効になった場合は、その Window から開始した処理を取り消し、後続 callback を実行しない。

network 以外の service も同じ取得方法を使用するが、network の request/response 型は使用しない。
service ごとに host と extension の間で受け渡す情報を定義する。

## 既存の host 利用処理との関係

host services は extension のための共通層であり、既存の `ResourceLoader` と同じものではない。

既存処理が対応する host service を再利用することはできるが、その移行は各処理の設計で決める。
この ADR は `ResourceLoader` の置換や network client の統合を決定しない。

## polyfill package

`@palim/polyfills` は API ごとの subpath を持つ。
次は network を使用する extension の例である。

```text
@palim/polyfills/fetch
@palim/polyfills/xhr
```

各 subpath は `WindowExtension` を返す factory を export する。
Fetch extension は `fetch` だけでなく、Fetch API として必要な global 群と共有状態を同じ realm に構築する。
XHR extension も XMLHttpRequest に必要な constructor、object、および event 処理を同じ realm に構築する。

polyfill package は必要な host service の契約に依存するが、その service の provider には依存しない。
network を使用しない polyfill は host network の契約にも依存しない。

## package 間の依存

host service の契約は scripting と polyfill から参照できる独立した package に置く。
provider はその契約を実装し、palim full package が利用する provider を組み立てる。

```text
host service contract
  ├─ scripting extension context
  ├─ host 機能を使用する polyfill
  └─ 必要に応じて既存の host 利用処理

host service providers
  └─ palim full package が組み立てる
```

`@palim/core` は host service、polyfill、および provider に依存しない。

## WPT runner

WPT runner は package root の `open()` と公開された extension factory だけを使用する。

```ts
await open(testURL, {
  scripting: "enabled",
  extensions: [fetchPolyfill()],
});
```

WPT runner は engine adapter、realm object、または host services を直接操作しない。
test ごとに必要な extension を選択し、不要な API は Window に追加しない。

## 検証項目

- extension が最初の inline script より前に実行される
- extension が関連 global 群を同じ Window realm に生成する
- parent と child で constructor、prototype、object、および Promise の identity が異なる
- extension 未指定の Window に追加の global が存在しない
- extension の import と factory 呼び出しだけでは既存の Window が変化しない
- host の object、Promise、Error、および runtime 固有の状態を page script から直接観測できない
- 複数の extension が同じ host service を利用できる
- host service を使用しない extension は provider を要求しない
- Window の破棄後に host 処理の callback が page で実行されない
- WPT runner が package root の API だけを使用する

Web API の動作は checked-out WPT fixture を page realm から実行して確認する。
extension の実行確認と、各 Web API の仕様適合は別々に記録する。

## 参考資料

- [ADR-0051](../decisions/0051-window-polyfill-injection.md)
- [ADR-0046](../decisions/0046-multi-package-capability-boundaries.md)
- [ADR-0047](../decisions/0047-window-scripting-separation.md)
- [ADR-0049](../decisions/0049-page-realm-execution-contract.md)
- [ADR-0050](../decisions/0050-page-execution-host-exceptions.md)
