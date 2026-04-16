---
title: ユーザー管理
desc: "**MOS**は、マルチユーザー・マルチセッションの記憶操作をサポートするための包括的なユーザー管理機能を提供します。本文書では、MOSのユーザー管理方法を詳しく紹介します。"
---

## ユーザー役割

MOSは4種類の異なる権限レベルのユーザー役割をサポートします:

| 役割 | 説明 | 権限 |
|------|-------------|-------------|
| `ROOT` | システム管理者 | すべてのキューブとユーザーにアクセスでき、削除できません |
| `ADMIN` | 管理者ユーザー | ユーザーとキューブを管理でき、すべてのキューブにアクセスできます |
| `USER` | 一般ユーザー | 自分のキューブを作成して管理でき、共有キューブにアクセスできます |
| `GUEST` | 制限ユーザー | 共有キューブにのみアクセスでき、キューブを作成できません |

## ユーザー管理方法

### 1. `create_user`

MOSシステムで新しいユーザーを作成します

**パラメーター:**
- `user_id` (str): ユーザーの一意識別子
- `role` (UserRole, optional): ユーザー役割。デフォルトは `UserRole.USER`
- `user_name` (str, optional): 表示用のユーザー名。提供されない場合は `user_id` を使用します

**戻り値:**
- `str`: 作成されたユーザーID

**例:**
```python
import uuid
from memos.mem_user.user_manager import UserRole

# 標準ユーザーを作成
user_id = str(uuid.uuid4())
memory.create_user(user_id=user_id, role=UserRole.USER, user_name="John Doe")

# 管理者ユーザーを作成
admin_id = str(uuid.uuid4())
memory.create_user(user_id=admin_id, role=UserRole.ADMIN, user_name="Admin User")

# ゲストユーザーを作成
guest_id = str(uuid.uuid4())
memory.create_user(user_id=guest_id, role=UserRole.GUEST, user_name="Guest User")
```

**注意:**
- 同じ`user_name`を持つユーザーがすでに存在する場合、このメソッドは既存ユーザーのIDを返します
- 初期化プロセス中にシステムは自動的にrootユーザーを作成します
- ユーザーIDはシステム全体で一意でなければなりません

### 2. `list_users`

システム内のすべてのアクティブユーザーの情報を取得します

**パラメーター:**
- なし

**戻り値:**
- `list`: ユーザー情報を含む辞書のリスト:
  - `user_id` (str): 一意のユーザー識別子
  - `user_name` (str): 表示用ユーザー名
  - `role` (str): ユーザー役割 (rootユーザー、管理者、一般ユーザー、ゲスト)
  - `created_at` (str): ユーザー作成のISO形式タイムスタンプ
  - `is_active` (bool): ユーザーアカウントがアクティブかどうか

**例:**
```python
# すべてのユーザー一覧
users = memory.list_users()
for user in users:
    print(f"User: {user['user_name']} (ID: {user['user_id']})")
    print(f"Role: {user['role']}")
    print(f"Active: {user['is_active']}")
    print(f"Created: {user['created_at']}")
    print("---")
```

**出力例:**
```
User: root (ID: root)
Role: root
Active: True
Created: 2024-01-15T10:30:00
---
User: John Doe (ID: 550e8400-e29b-41d4-a716-446655440000)
Role: user
Active: True
Created: 2024-01-15T11:00:00
---
```

### 3. `create_cube_for_user`

新しい記憶キューブを作成し、指定したユーザーをその所有者に設定します

**パラメーター:**
- `cube_name` (str): キューブ名
- `owner_id` (str): キューブ所有者のユーザーID
- `cube_path` (str, optional): キューブのローカルファイルパスまたはリモートリポジトリURL
- `cube_id` (str, optional): カスタムキューブ識別子。提供されない場合は生成されたUUIDを使用します

**戻り値:**
- `str`: 作成されたキューブID

**例:**
```python
import uuid

# 最初にユーザーを作成
user_id = str(uuid.uuid4())
memory.create_user(user_id=user_id, user_name="Alice")

# ユーザー用のキューブを作成
cube_id = memory.create_cube_for_user(
    cube_name="Alice's Personal Memory",
    owner_id=user_id,
    cube_path="/path/to/alice/memory",
    cube_id="alice_personal_cube"
)

print(f"Created cube: {cube_id}")
```

**注意:**
- 所有者は作成されたすべてのキューブに自動的にアクセスできます
- キューブ所有者は他のユーザーと共有できます
- `cube_path` が提供された場合、それはローカルディレクトリパスまたはリモートリポジトリURLにできます
- カスタム`cube_id`はシステム全体で一意でなければなりません

### 4. `get_user_info`

現在のユーザーおよびそのアクセス可能なキューブに関する詳細情報を取得します

**パラメーター:**
- なし

**戻り値:**
- `dict`: ユーザー情報とアクセス可能なキューブを含む辞書:
  - `user_id` (str): 現在のユーザーID
  - `user_name` (str): 現在のユーザー名
  - `role` (str): 現在のユーザー役割
  - `created_at` (str): ユーザー作成のISO形式タイムスタンプ
  - `accessible_cubes` (list): 各アクセス可能キューブの辞書リスト:
    - `cube_id` (str): キューブ識別子
    - `cube_name` (str): キューブ名
    - `cube_path` (str): キューブのファイルパスまたはリポジトリURL
    - `owner_id` (str): キューブ所有者ID
    - `is_loaded` (bool): キューブが現在メモリにロードされているかどうか

**例:**
```python
# 現在のユーザー情報を取得
user_info = memory.get_user_info()

print(f"Current User: {user_info['user_name']} ({user_info['user_id']})")
print(f"Role: {user_info['role']}")
print(f"Created: {user_info['created_at']}")
print("\nAccessible Cubes:")
for cube in user_info['accessible_cubes']:
    print(f"- {cube['cube_name']} (ID: {cube['cube_id']})")
    print(f"  Owner: {cube['owner_id']}")
    print(f"  Loaded: {cube['is_loaded']}")
    print(f"  Path: {cube['cube_path']}")
```

**出力例:**
```
Current User: Alice (550e8400-e29b-41d4-a716-446655440000)
Role: user
Created: 2024-01-15T11:00:00

Accessible Cubes:
- Alice's Personal Memory (ID: alice_personal_cube)
  Owner: 550e8400-e29b-41d4-a716-446655440000
  Loaded: True
  Path: /path/to/alice/memory
- Shared Project Memory (ID: project_cube)
  Owner: bob_user_id
  Loaded: False
  Path: /path/to/project/memory
```

### 5. `share_cube_with_user`

他のユーザーと記憶キューブを共有し、キューブ内容へのアクセス権限を付与します

**パラメーター:**
- `cube_id` (str): 共有するキューブID
- `target_user_id` (str): キューブを共有する対象ユーザーのID

**戻り値:**
- `bool`: 共有された場合は`True`を返し、そうでない場合は`False`を返します

**例:**
```python
# 他のユーザーとキューブを共有
success = memory.share_cube_with_user(
    cube_id="alice_personal_cube",
    target_user_id="bob_user_id"
)

if success:
    print("Cube shared successfully")
else:
    print("Failed to share cube")
```

**注意:**
- 現在のユーザーは、共有中のキューブにアクセスする権限を持っていなければなりません
- 対象ユーザーは存在し、かつアクティブでなければなりません
- キューブを共有すると、対象ユーザーにそのキューブへの読み書きアクセス権限が付与されます
- キューブ所有者は常に自分のキューブを共有します
- キューブアクセス権限を持つユーザーは、他のユーザーとキューブを共有できます（適切な権限を持っている場合）

## 完全なユーザー管理ワークフロー

以下は、ユーザー管理操作を示す完全な例です:

```python
import uuid
from memos.configs.mem_os import MOSConfig
from memos.mem_os.main import MOS
from memos.mem_user.user_manager import UserRole

# MOSを初期化
mos_config = MOSConfig.from_json_file("examples/data/config/simple_memos_config.json")
memory = MOS(mos_config)

# 1. ユーザーを作成
alice_id = str(uuid.uuid4())
bob_id = str(uuid.uuid4())

memory.create_user(user_id=alice_id, user_name="Alice", role=UserRole.USER)
memory.create_user(user_id=bob_id, user_name="Bob", role=UserRole.USER)

# 2. すべてのユーザー一覧
print("All users:")
users = memory.list_users()
for user in users:
    print(f"- {user['user_name']} ({user['role']})")

# 3. ユーザーのためにキューブを作成
alice_cube_id = memory.create_cube_for_user(
    cube_name="Alice's Personal Memory",
    owner_id=alice_id,
    cube_path="/path/to/alice/memory"
)

bob_cube_id = memory.create_cube_for_user(
    cube_name="Bob's Work Memory",
    owner_id=bob_id,
    cube_path="/path/to/bob/work"
)

# 4. 他のユーザーとキューブを共有
memory.share_cube_with_user(alice_cube_id, bob_id)
memory.share_cube_with_user(bob_cube_id, alice_id)

# 5. ユーザー情報を取得
alice_info = memory.get_user_info()
print(f"\nAlice's accessible cubes: {len(alice_info['accessible_cubes'])}")

# 6. キューブにメモリを追加
memory.add(
    messages=[
        {"role": "user", "content": "I like playing football."},
        {"role": "assistant", "content": "That's great! Football is a wonderful sport."}
    ],
    user_id=alice_id,
    mem_cube_id=alice_cube_id
)

# 7. メモリを検索
retrieved = memory.search(
    query="What does Alice like?",
    user_id=alice_id
)
print(f"Retrieved memories: {retrieved['text_mem']}")
```

## Error Handling

ユーザー管理メソッドには包括的なエラー処理が含まれます:

- **ユーザー検証**: メソッドは操作の前にユーザーが存在し、アクティブ状態にあることを検証します
- **キューブアクセス検証**: 操作の前にユーザーがキューブに対して適切なアクセス権を持っていることを保証します
- **重複防止**: 重複するユーザー名とキューブIDを適切に処理します
- **権限チェック**: 機密性の高い操作に対するユーザーロールと権限を検証します

## Database Persistence

ユーザー管理データはSQLiteデータベースに永続化されます:
- **場所**: デフォルトは `~/.memos/memos_users.db`
- **テーブル**: `users`, `cubes`, `user_cube_association`
- **関係**: ユーザーとキューブの間は多対多の関係です
- **ソフト削除**: ユーザーとキューブは永続的に削除されるのではなく、ソフト削除されます（非アクティブとしてマークされます）

## Security Considerations

- **ロールベースのアクセス制御**: 異なるユーザーロールは異なる権限を持ちます
- **キューブ所有権**: キューブ所有者は自分のキューブを完全に制御できます
- **アクセス検証**: すべての操作は実行前にユーザーアクセス権を検証します
- **ルートユーザー保護**: ルートユーザーは削除不可であり、システムへの完全なアクセス権を持ちます
