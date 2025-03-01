# M1: プロジェクト初期化の指示

## 背景

Memoka（メモカ）プロジェクトのマイルストーンM1「プロジェクト初期化」を達成するための指示です。このマイルストーンでは、Electronを使用したTypeScriptベースのクロスプラットフォームアプリケーションの基本構造を確立し、開発環境を整備します。

## 目標

プロジェクトの基本構造を確立し、開発環境を整備する。具体的には以下の成果物を作成します：

1. Electronプロジェクトの初期設定
2. TypeScriptの設定と基本構造
3. 開発・ビルドパイプラインの構築
4. 基本的なアプリケーションシェル

## 技術スタック

- **フレームワーク**: Electron
- **言語**: TypeScript
- **UI**: React
- **状態管理**: Zustand
- **ビルドツール**: Vite
- **パッケージマネージャ**: npm
- **リンター/フォーマッター**: ESLint, Prettier
- **テスト**: Jest, Testing Library

## 手順

### 1. プロジェクトの初期化

1. electron-vite-reactテンプレートを使用してプロジェクトを初期化します。このテンプレートはElectron、Vite、React、TypeScriptの統合を提供します。

```bash
# プロジェクトディレクトリに移動
cd /home/jun/repo/my-new-notepad-project

# 既存のファイルをバックアップ（README.md, docs/, historyディレクトリは保持）
mkdir -p backup
cp -r README.md docs history backup/

# electron-vite-reactテンプレートを使用してプロジェクトを初期化
npm create electron-vite memoka

# 生成されたプロジェクトファイルを現在のディレクトリに移動
cp -r memoka/* .
cp -r memoka/.* . 2>/dev/null || true
rm -rf memoka

# バックアップからファイルを復元
cp -r backup/README.md .
cp -r backup/docs .
cp -r backup/history .
rm -rf backup
```

2. 必要な依存関係をインストールします。

```bash
# 基本的な依存関係をインストール
npm install

# 状態管理のためのZustandをインストール
npm install zustand

# UIコンポーネントライブラリをインストール
npm install @mui/material @emotion/react @emotion/styled

# アイコンライブラリをインストール
npm install @mui/icons-material

# 開発用ツールをインストール
npm install -D eslint-config-prettier prettier
```

### 2. プロジェクト構造の整備

1. 以下のディレクトリ構造を作成します：

```
/src
  /main          # Electronのメインプロセス
  /preload       # プリロードスクリプト
  /renderer      # レンダラープロセス（React）
    /components  # Reactコンポーネント
    /hooks       # カスタムフック
    /store       # Zustandストア
    /styles      # グローバルスタイル
    /types       # TypeScript型定義
    /utils       # ユーティリティ関数
```

2. 基本的なアプリケーションシェルを実装します。

- メインウィンドウの設定（サイズ、タイトル、アイコンなど）
- 基本的なメニュー構造
- 開発モードとプロダクションモードの設定
- アプリケーションのライフサイクル管理

### 3. TypeScriptの設定

1. `tsconfig.json`を適切に設定します：

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "useDefineForClassFields": true,
    "lib": ["DOM", "DOM.Iterable", "ESNext"],
    "allowJs": false,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "module": "ESNext",
    "moduleResolution": "Node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@main/*": ["src/main/*"],
      "@renderer/*": ["src/renderer/*"],
      "@components/*": ["src/renderer/components/*"],
      "@hooks/*": ["src/renderer/hooks/*"],
      "@store/*": ["src/renderer/store/*"],
      "@styles/*": ["src/renderer/styles/*"],
      "@types/*": ["src/renderer/types/*"],
      "@utils/*": ["src/renderer/utils/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

2. 型定義ファイルを作成します：

- `src/renderer/types/index.ts` - 共通の型定義
- `src/renderer/types/models.ts` - データモデルの型定義
- `src/renderer/types/store.ts` - ストアの型定義

### 4. Reactアプリケーションの基本構造

1. Reactコンポーネントの基本構造を実装します：

- `App.tsx` - メインアプリケーションコンポーネント
- `Layout.tsx` - アプリケーションのレイアウト
- `Sidebar.tsx` - サイドバーコンポーネント
- `Editor.tsx` - エディタコンポーネントのプレースホルダー
- `Header.tsx` - ヘッダーコンポーネント

2. Zustandを使用した基本的な状態管理を実装します：

- `src/renderer/store/index.ts` - ストアのエントリーポイント
- `src/renderer/store/appStore.ts` - アプリケーション状態の管理

### 5. 開発・ビルドパイプラインの構築

1. `package.json`のスクリプトセクションを設定します：

```json
"scripts": {
  "dev": "vite",
  "build": "tsc && vite build && electron-builder",
  "preview": "vite preview",
  "lint": "eslint src --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
  "lint:fix": "eslint src --ext ts,tsx --fix",
  "format": "prettier --write \"src/**/*.{ts,tsx,css,scss}\"",
  "test": "jest",
  "test:watch": "jest --watch"
}
```

2. ESLintとPrettierの設定を行います：

- `.eslintrc.js` - ESLintの設定
- `.prettierrc` - Prettierの設定

3. Electronビルダーの設定を行います：

- `electron-builder.yml` - ビルド設定

### 6. 基本的なテスト環境の構築

1. Jestの設定を行います：

- `jest.config.js` - Jestの設定

2. サンプルテストを作成します：

- `src/renderer/App.test.tsx` - Appコンポーネントのテスト

### 7. アプリケーションのメタデータ設定

1. アプリケーションのメタデータを設定します：

- アプリケーション名: Memoka
- アプリケーションID: com.memoka.app
- バージョン: 0.1.0
- 説明: 次世代ナレッジマネジメントツール
- 著者: Memoka Team

## 評価基準

実装が完了したら、以下の評価基準を満たしているか確認してください：

1. アプリケーションが起動し、基本的なウィンドウが表示される
2. TypeScriptのコンパイルとリンティングが機能する
3. 開発環境でのホットリロードが機能する
4. 基本的なReactコンポーネントが表示される
5. Zustandを使用した状態管理が機能する
6. ESLintとPrettierによるコード品質チェックが機能する
7. ビルドプロセスが正常に動作する

## 次のステップ

このマイルストーンが完了したら、次のマイルストーンM2「基本アーキテクチャ実装」に進みます。M2では以下を実装します：

1. SQLiteデータベースの統合
2. 基本的なファイル操作機能
3. アプリケーションの状態管理の拡張
4. コンポーネント間の通信システム
5. 基本的なUIフレームワークの統合

## 注意事項

- 依存関係のバージョンを固定し、互換性の問題を防ぎます
- コードには適切なコメントを追加し、特に@AI-CONTEXTアノテーションを使用して、AIが理解しやすいようにします
- コミットメッセージは明確で詳細なものにし、変更内容を適切に説明します
- 開発中に問題が発生した場合は、詳細なエラーメッセージとコンテキストを記録します
- **重要**: 作業内容と結果を必ず `history/YYYY/MM/連番_概要.md` 形式でhistoryディレクトリに記録してください。これは次の生成AIが文脈を理解するために不可欠です
- 次の生成AIへの指示を作成する際には、historyへの記録の重要性を必ず伝えてください。これにより、開発の連続性が保たれます

## 完了報告

タスクが完了したら、以下の情報を含む完了報告を作成し、`instructions/2025/03/002_basic-architecture.md`ファイルに次のマイルストーンの指示を記載してください：

1. 実装した機能の概要
2. 直面した課題と解決策
3. 次のマイルストーンに向けた提案
4. スクリーンショットまたはデモ（可能であれば）
