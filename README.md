# Suisai Filler - イラスト色付けAIアプリケーション

## 概要

Suisai Fillerは、線画イラストをAIで自動着色するWebアプリケーションです。Dify APIを使用して、ユーザーが指定した色設定に基づいてイラストを美しく着色します。

## 機能

- 🎨 イラストファイルのアップロード（JPG, PNG, GIF, WEBP, SVG対応）
- 🖌️ 髪の毛、肌、服の色を個別に設定
- ✨ AIによる自動着色処理
- 💾 結果の保存・共有機能
- 🌙 ダークテーマ対応

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

プロジェクトルートに`.env.local`ファイルを作成し、以下の内容を設定してください：

```env
# Dify API設定
NEXT_PUBLIC_DIFY_API_URL=https://dify.aibase.buzz/v1
NEXT_PUBLIC_DIFY_API_KEY=your_dify_api_key_here

# ワークフローID（必須）
NEXT_PUBLIC_DIFY_WORKFLOW_ID=your_actual_workflow_id_here
```

**重要**: 
- `NEXT_PUBLIC_DIFY_API_URL`は、フロントエンドからアクセス可能なDify APIのエンドポイント
- `NEXT_PUBLIC_DIFY_API_KEY`は、Dify APIの認証キー（`app-`または`sk-`で始まる）
- `NEXT_PUBLIC_DIFY_WORKFLOW_ID`は、実行したいワークフローのID（必須）
- 環境変数ファイルは`.gitignore`に含まれており、Gitにコミットされません

### 3. Difyワークフローの設定

1. [Dify](https://dify.ai/)にログイン
2. ワークスペースでワークフローを作成または選択
3. ワークフローの設定で以下を確認：
   - **入力パラメータ**: `prompt`, `hairColor`, `skinColor`, `clothesColor`を設定
   - **ワークフローID**: URLから取得（例: `https://dify.ai/workflow/abc123` → `abc123`）
4. APIキーを作成（ワークフロー実行権限が必要）

### 4. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで `http://localhost:3000` にアクセスしてください。

## 使用方法

1. **イラストのアップロード**: 線画イラストファイルをドラッグ&ドロップまたは選択
2. **色の設定**: 右パネルで髪の毛、肌、服の色を指定
3. **AI着色**: 「AI着色」ボタンをクリックして処理開始
4. **結果の確認**: 生成された着色済みイラストを確認
5. **保存・共有**: 結果をダウンロードまたは共有

## トラブルシューティング

### よくある問題

#### 1. "Dify APIキーが設定されていません" エラー
- `.env.local`ファイルが正しく作成されているか確認
- `DIFY_API_KEY`の値が正しく設定されているか確認
- サーバーを再起動して環境変数を読み込み直す

#### 2. "APIキーが無効です" エラー
- Difyで作成したAPIキーが正しいか確認
- APIキーが有効期限切れになっていないか確認

#### 3. "APIエンドポイントが見つかりません" エラー
- `NEXT_PUBLIC_DIFY_API_URL`の値が正しいか確認
- Difyインスタンスが正しく動作しているか確認

#### 4. 画像が表示されない
- ブラウザのコンソールでエラーメッセージを確認
- ファイル形式がサポートされているか確認（JPG, PNG, GIF, WEBP, SVG）

### デバッグ方法

1. ブラウザの開発者ツールを開く（F12）
2. コンソールタブでエラーメッセージを確認
3. ネットワークタブでAPIリクエストの詳細を確認

## 技術スタック

- **フロントエンド**: Next.js 14, React 18, TypeScript
- **スタイリング**: Tailwind CSS, Radix UI
- **AI連携**: Dify API
- **HTTP通信**: Axios

## ファイル構造

```
Suisai Filler/
├── app/                    # Next.js App Router
│   ├── page.tsx           # メインページ
│   ├── layout.tsx         # レイアウト
│   └── globals.css        # グローバルスタイル
├── components/             # Reactコンポーネント
│   ├── file-upload.tsx    # ファイルアップロード
│   ├── properties-panel.tsx # プロパティパネル
│   └── ui/                # UIコンポーネント
├── lib/                    # ユーティリティ
│   ├── dify-api.ts        # Dify APIクライアント
│   └── utils.ts           # ヘルパー関数
└── public/                 # 静的ファイル
```

## Dify API連携

このアプリケーションは、Dify APIを使用してAI着色処理を行います。

### APIエンドポイント

- **チャット補完**: `/chat-messages` - AIとの対話による色設定の最適化
- **画像生成**: `/text-to-image` - テキストプロンプトからの画像生成（将来の実装）
- **ワークフロー実行**: `/workflows/{id}/runs` - 特定のワークフローの実行

### 認証

Bearer Token認証を使用します。APIキーは環境変数`DIFY_API_KEY`で設定してください。

### エラーハンドリング

アプリケーションは以下のエラーを適切に処理します：
- 401: 認証エラー（APIキーが無効）
- 404: エンドポイントが見つからない
- 5xx: サーバーエラー

## 開発

### ビルド

```bash
npm run build
```

### リント

```bash
npm run lint
```

## ライセンス

このプロジェクトはMITライセンスの下で公開されています。

## 貢献

プルリクエストやイシューの報告を歓迎します。 