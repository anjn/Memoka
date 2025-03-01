# エディタ実装指示の修正

## 背景

前の生成AIが誤った技術スタックを選択したため、`instructions/2025/03/003_editor-implementation.md`の修正を行いました。

## 修正内容

### 技術スタックの修正

技術選定ドキュメント（`docs/technology.md`）によると、リッチテキストエディタとしてSlate.jsではなく、TipTap（ProseMirrorベース）を使用することになっていました。そのため、以下の修正を行いました：

1. 技術スタックセクションを更新：
   - **リッチテキストエディタ**: Slate.js → TipTap（ProseMirror ベース）
   - **マークダウン変換**: remark → markdown-it

2. 実装コード例をすべてTipTapのAPIを使用するように変更：
   - Slate.jsのJSONベースのデータモデルからTipTapのHTMLベースのモデルに変更
   - ツールバーの実装をTipTapのコマンドに対応するよう修正
   - マークダウン変換ユーティリティをHTMLとの相互変換に対応するよう更新
   - コードブロックとシンタックスハイライトの実装をTipTap向けに調整

### 他のドキュメントとの整合性確認

開発マイルストーンドキュメント（`docs/development-milestones.md`）を確認し、M3マイルストーンでは「TipTapエディタの統合」と明記されていることを確認しました。また、M1およびM2のマイルストーン指示（`instructions/2025/03/001_project-initialization.md`および`instructions/2025/03/002_basic-architecture.md`）も技術選定ドキュメントと一致していることを確認しました。

## 結論

エディタ実装指示を修正し、プロジェクト全体で一貫した技術スタックを使用できるようになりました。これにより、今後の開発段階での混乱を避け、より一貫性のある実装が可能になります。

次のマイルストーンの指示ファイルは `instructions/2025/03/004_search-tag-implementation.md` です。
