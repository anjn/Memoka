# npm run dev コマンドの修正

## 問題

`npm dev run` コマンドを実行するとエラーが発生していた。

## 原因

1. コマンド構文の誤り: 正しいコマンドは `npm run dev` であり、`npm dev run` ではない（パラメータの順序が間違っていた）。

2. 依存関係のバージョン問題: `vite-plugin-electron-renderer` パッケージにバージョンの互換性問題があった。

3. ネイティブモジュールの互換性: `better-sqlite3` モジュールが Electron が使用する Node.js バージョンとは異なるバージョン用にコンパイルされていた。

## 解決策

1. 正しいコマンド構文 `npm run dev` を使用する。

2. package.json 内の `vite-plugin-electron-renderer` のバージョンを 0.14.5 から 0.14.6 に更新した。

```json
"vite-plugin-electron-renderer": "^0.14.6"
```

3. `electron-rebuild` をインストールし、それを使用して Electron 用に `better-sqlite3` モジュールを再ビルドした。

```bash
npm install --save-dev electron-rebuild
npx electron-rebuild -f -w better-sqlite3
```

## 結果

アプリケーションが正常に起動するようになった。開発サーバーは以下のコマンドで起動できる：

```bash
npm run dev
```
