# 環境変数設定ガイド

このドキュメントは、タスク管理アプリの環境変数設定方法を説明します。

## 📋 基本的な設定

### `.env.local`ファイルの場所

プロジェクトのルートディレクトリ:
```
task-app/
├── .env.local          ← このファイルを編集
├── app/
├── package.json
└── ...
```

---

## 🔧 環境変数の設定例

以下の内容を`.env.local`ファイルにコピーして、値を自分のものに置き換えてください:

```env
# ============================================
# 必須: 基本設定
# ============================================

# Gemini API キー (Google AI Studio から取得)
GEMINI_API_KEY=AIzaSyCgEQi8E8RiW7BvI6thwtoyf...

# Notion インテグレーショントークン (最初のデータベース用)
NOTION_API_KEY=ntn_208...

# Notion データベースID (最初のデータベース)
NOTION_DATABASE_ID=13b4dbc3-b611-8068-af34-c9b64014279f

# ============================================
# オプション: 2つ目のデータベース
# ============================================

# 2つ目のデータベース用のインテグレーショントークン
# ※同じインテグレーションを使う場合は不要
NOTION_API_KEY_2=ntn_h94889205837K3BgpPZIwNigSqpLocYAb6NC20WkA1GfRt

# 2つ目のデータベースID
NOTION_DATABASE_ID_2=14723595-7007-80df-8015-fa258fb9d4e9

# ============================================
# オプション: データベース名のカスタマイズ
# ============================================

# UIに表示されるデータベース名
NOTION_DATABASE_NAME_1=タスクDB
NOTION_DATABASE_NAME_2=新しいDB

# ============================================
# オプション: 時間帯プロパティの設定
# ============================================

# 時間帯プロパティを持つデータベースのID
# ※このIDのデータベースでのみ「時間帯」と「獲得」が設定されます
NOTION_DATABASE_WITH_TIMESLOT=13b4dbc3-b611-8068-af34-c9b64014279f

# フロントエンド用(ブラウザで使用するため NEXT_PUBLIC_ が必要)
NEXT_PUBLIC_DATABASE_WITH_TIMESLOT=13b4dbc3-b611-8068-af34-c9b64014279f
```

---

## 📝 各環境変数の説明

### 必須の変数

| 変数名 | 説明 | 取得方法 |
|--------|------|----------|
| `GEMINI_API_KEY` | Google Gemini APIキー | [Google AI Studio](https://makersuite.google.com/app/apikey) で取得 |
| `NOTION_API_KEY` | Notionインテグレーショントークン | Notion設定 → インテグレーション → 新規作成 |
| `NOTION_DATABASE_ID` | NotionデータベースのID | データベースURLから抽出 |

### オプションの変数

| 変数名 | 説明 | デフォルト値 |
|--------|------|-------------|
| `NOTION_API_KEY_2` | 2つ目のデータベース用トークン | `NOTION_API_KEY`と同じ |
| `NOTION_DATABASE_ID_2` | 2つ目のデータベースID | なし |
| `NOTION_DATABASE_NAME_1` | 1つ目のDB表示名 | "タスクDB" |
| `NOTION_DATABASE_NAME_2` | 2つ目のDB表示名 | "新しいDB" |
| `NOTION_DATABASE_WITH_TIMESLOT` | 時間帯を使うDBのID | `NOTION_DATABASE_ID` |
| `NEXT_PUBLIC_DATABASE_WITH_TIMESLOT` | 同上(フロントエンド用) | `NOTION_DATABASE_ID` |

---

## 🔍 データベースIDの取得方法

### 方法1: NotionのデータベースURLから取得

データベースのURLは以下の形式です:
```
https://www.notion.so/14723595700780df8015fa258fb9d4e9?v=...
                      ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
                      これがデータベースID
```

ハイフンを追加してフォーマット:
```
14723595-7007-80df-8015-fa258fb9d4e9
```

### 方法2: Notion APIで確認

```bash
curl https://api.notion.com/v1/databases/{database_id} \
  -H "Authorization: Bearer {your_token}" \
  -H "Notion-Version: 2022-06-28"
```

---

## 🚀 設定後の手順

### 1. ファイルを保存

`.env.local`を編集したら、必ず保存してください。

### 2. 開発サーバーを再起動

環境変数の変更を反映するには、サーバーの再起動が必要です:

```bash
# 現在のサーバーを停止 (Ctrl+C)
# その後、再起動
npm run dev
```

### 3. 動作確認

- ブラウザで `http://localhost:3000` を開く
- データベースドロップダウンに複数のデータベースが表示されることを確認
- 各データベースでタスクを作成してみる

---

## 🔐 セキュリティのベストプラクティス

### ✅ やるべきこと

1. **`.env.local`をGitにコミットしない**
   - `.gitignore`に含まれているか確認
   - APIキーが公開されないようにする

2. **環境変数の使い分け**
   - サーバーサイド専用: `NOTION_API_KEY`など
   - フロントエンドでも使用: `NEXT_PUBLIC_`で始まる変数のみ

3. **定期的にトークンを更新**
   - セキュリティのため、定期的にNotionトークンを再生成

### ❌ やってはいけないこと

1. **APIキーをコードに直接書かない**
   ```javascript
   // ❌ ダメな例
   const apiKey = "AIzaSyCgEQi8E8RiW7BvI6thwtoyf...";
   
   // ✅ 良い例
   const apiKey = process.env.GEMINI_API_KEY;
   ```

2. **`NEXT_PUBLIC_`でAPIキーを公開しない**
   ```env
   # ❌ ダメ - ブラウザから見える
   NEXT_PUBLIC_NOTION_API_KEY=ntn_xxx
   
   # ✅ 良い - サーバーサイドのみ
   NOTION_API_KEY=ntn_xxx
   ```

---

## 🆕 新しいデータベースの追加方法

### ステップ1: Notionでインテグレーションを接続

1. 新しいデータベースを開く
2. 右上の「...」→「接続」→ インテグレーションを選択
3. データベースIDをコピー

### ステップ2: 環境変数を追加

`.env.local`に追加:
```env
# 3つ目のデータベース
NOTION_DATABASE_ID_3=your-third-database-id
NOTION_DATABASE_NAME_3=3つ目のDB名
```

### ステップ3: コードを更新

`app/api/databases/route.ts`を編集:
```typescript
const databases = [
  {
    id: process.env.NOTION_DATABASE_ID,
    name: process.env.NOTION_DATABASE_NAME_1 || 'タスクDB'
  },
  {
    id: process.env.NOTION_DATABASE_ID_2,
    name: process.env.NOTION_DATABASE_NAME_2 || '新しいDB'
  },
  // 追加
  {
    id: process.env.NOTION_DATABASE_ID_3,
    name: process.env.NOTION_DATABASE_NAME_3 || '3つ目のDB'
  }
].filter(db => db.id);
```

### ステップ4: サーバー再起動

```bash
npm run dev
```

---

## 🐛 トラブルシューティング

### 問題: データベースが表示されない

**確認事項**:
1. `.env.local`にデータベースIDが正しく設定されているか
2. サーバーを再起動したか
3. データベースIDにタイポがないか
4. Notionでインテグレーションを接続したか

**解決方法**:
```bash
# 1. .env.localを確認
cat .env.local

# 2. サーバーを再起動
npm run dev

# 3. ブラウザのコンソールでエラーを確認
# F12 → Console タブ
```

### 問題: 時間帯が表示されない/表示される

**原因**: `NEXT_PUBLIC_DATABASE_WITH_TIMESLOT`の設定

**解決方法**:
```env
# 時間帯を使いたいデータベースのIDを設定
NEXT_PUBLIC_DATABASE_WITH_TIMESLOT=13b4dbc3-b611-8068-af34-c9b64014279f
```

### 問題: APIエラーが発生する

**確認事項**:
1. Notionトークンが有効か
2. データベースへのアクセス権限があるか
3. インテグレーションがデータベースに接続されているか

**解決方法**:
1. Notion設定でトークンを再生成
2. データベースにインテグレーションを再接続
3. `.env.local`のトークンを更新
4. サーバー再起動

---

## 📚 参考リンク

- [Notion API ドキュメント](https://developers.notion.com/)
- [Google AI Studio](https://makersuite.google.com/)
- [Next.js 環境変数ドキュメント](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)

---

## 📅 更新履歴

| 日付 | 変更内容 |
|------|----------|
| 2025-11-25 | 初版作成 - 複数データベース対応、時間帯プロパティの条件付き設定 |

---

## 💡 ヒント

- **開発環境と本番環境で異なる設定を使う**:
  - `.env.local` - ローカル開発用
  - `.env.production` - 本番環境用

- **チーム開発の場合**:
  - `.env.example`を作成してGitにコミット
  - 実際の値は含めず、変数名のみ記載
  - チームメンバーはこれをコピーして`.env.local`を作成

```env
# .env.example (Gitにコミット可能)
GEMINI_API_KEY=your-gemini-api-key-here
NOTION_API_KEY=your-notion-token-here
NOTION_DATABASE_ID=your-database-id-here
```
