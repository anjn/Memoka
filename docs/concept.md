# コンセプト

## アプリの概要

このアプリはNotionとObsidianの良いところを取り込み、次の用途でユーザーが日常的に使用するものである。

### メモ帳

日常の記録や、情報の整理、日記などを書くのに適しています。

### パーソナルナレッジベース

蓄積した情報にすぐにアクセスできるように、充実した検索機能、ツリー表示、データベース表示をサポートします。

### タスク管理

ノートをタスクとしてタグ付けすることで、タスク管理ができます。

## アプリの特徴

### オープンソース

### WYSIWYG

- このアプリはNotionと同様の編集体験を提供する。
    - ユーザーはMarkdownを意識する必要はない
    - マウス操作による直感的な要素の選択や編集ができる
- ノートの保存形式はMarkdownまたはその拡張とする。
- WYSIWYGにより編集するモードと、生のMarkdownを編集するモードを備える。

### 階層のないノート

- すべてのノートはストレージ上ではフラットである。
    - ファイル数の上限が問題とならないように作成された日付でディレクトリは分けてノートが保存される。
- ノート間の親子関係はMarkdownのメタデータ（プロパティ）として定義される
- 親子関係によるツリー表示や、検索によってノートが参照される
- ディレクトリ構造がない分、検索やツリー、データベースの機能が充実している
- ノートを書き始めるときにどこに保存するか考えなくてよい

### エディタとしての機能

- VS Codeのようなタブ、分割表示をサポート
- アウトライン表示
- ノートの最後に表示した位置やカーソルを記憶する

### アプリとしての機能

- オフラインでもローカルのストレージで完結して編集できる
- プラグインをサポート
    - あぷりの機能の多くがプラグインとして実装されることが好ましい
- テーマをサポート

### サーバー

- 複数端末で同期編集を可能とするサーバーを提供
    - ユーザーはこれを使わなくても良いが、これを使うと同期、バックアップ、インターネット公開ができるようになる

### サポートOS

以下のOSでネイティブアプリとして動作する

- Linux
- Windows
- Android



