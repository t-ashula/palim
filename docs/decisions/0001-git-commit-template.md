# ADR-0001: git commit テンプレートの採用

## ステータス

accepted

## コンテキスト

- コミットメッセージの書き手によるばらつきを抑え、レビュー時の読みやすさと履歴の追跡性を担保したい
- テンプレートをリポジトリに置き、運用ルールとして明文化したい

## 決定

- コミットメッセージのフォーマットとして `.commit-template.txt` を採用する
- 基本の書式はテンプレート記載のとおり `:emoji: Subject` を件名とし、本文は空行を挟んで必要に応じて記述する
- `:emoji:` は GitHub の絵文字ショートコード（例: `:tada:`）を用い、Unicode の絵文字そのもの（例: `🎉`）は使用しない
- 開発者はローカルで `git config commit.template .commit-template.txt` を設定し、コミット時にテンプレートが自動展開されるようにする
- GitHub 上での PR マージ等の UI 由来のコミットについては例外とし、テンプレート適用や絵文字を必須としない

## 影響

- コミットメッセージの書式が統一され、履歴の可読性・検索性が向上する
- 開発者はローカル設定を追加する必要がある

## 参考資料

- [`.commit-template.txt`](../../.commit-template.txt)
- [How to Write a Git Commit Message](http://chris.beams.io/posts/git-commit/)
