---
title: Build a Shared Knowledge Base for AI Apps with MemOS
desc: Keep ownership and sharing in your app. Let MemOS parse documents and retrieve them so authorized users can ask questions against the same knowledge base.
---

The product handbook lives in a cloud drive, the onboarding guide in a group chat, the support policy on a colleague's laptop. New hires spend half of their first week asking where the latest version actually is.

Memmy recently shipped a knowledge-base feature to fix exactly this, built entirely on MemOS knowledge-base APIs: everyone can maintain a personal library, and any library can be shared with colleagues. Recipients query the same retrieval API and read the same content.

The interesting part is how it is implemented. MemOS offers no "share knowledge base" endpoint and no "list all knowledge bases" endpoint. Sharing is something Memmy does on its own, in the application layer. That trade-off is what this best practice is really about — so we built a locally runnable demo that walks through the entire split.

## The Split Matters More Than the APIs

A shared knowledge base looks like one feature. Underneath, it is two separate jobs:

| Who | What it owns | How |
| --- | --- | --- |
| MemOS | Document text, parsing, chunking, searchable memory snippets | `/create/knowledgebase`, `/add/knowledgebase-file`, `/search/memory`, and friends |
| Your app | Who owns each library, who it was shared with, whether the current user may see it | Two tables in your own database: ownership and shares |

In one sentence: MemOS answers "what do the documents say", while the app answers "is this person allowed to read them". At search time, the app computes the visible `knowledgebase_ids` for the current user and hands that list to `/search/memory`.

The payoff is a permission model you fully control — by team, by project, by expiry date, whatever your product needs — without waiting for MemOS to support a specific sharing semantic. The cost is equally plain: if your permission check is wrong, data leaks. That is why the demo treats "unauthorized users see nothing" as a first-class scenario.

## Three Roles in the Demo

```text
alice · product owner
Creates "Product Handbook", uploads the handbook and onboarding guide,
and shares the knowledge base with bob.

bob · customer success
Switches to his own account, finds the library under "Shared knowledge bases",
and can ask questions. He cannot upload, delete, or share it again.

cara · new teammate
Is not on the share list, so the library never appears in her sidebar at all.
```

Each role verifies one thing: alice covers the write path, bob covers read-only access, cara covers isolation.

## What Happens Behind One Answer

```text
User opens the knowledge-base page
  │
  ├─ App loads two lists for the current user_id: owned and shared-with-me
  │
  ├─ Owner uploads a document
  │   → /add/knowledgebase-file
  │   → poll /get/knowledgebase-file until status is completed
  │
  ├─ Owner enters the recipient's user ID
  │   → app writes a share record in its own database; MemOS is not touched
  │
  ├─ Recipient asks a question
  │   → app confirms access
  │   → one /search/memory call: user_id + knowledgebase_ids
  │   → the model answers from the retrieved snippets
  │
  └─ Optional: /add/message stores the turn as memory for the current user
```

Note the last step: knowledge-base content is one shared copy for authorized members, but user memory always stays scoped to `user_id`. bob can read the handbook alice maintains, yet never sees alice's personal preferences — and bob's preferences never leak back to alice either.

## Run the Demo First

The complete project is the [shared-knowledge-base Demo](https://github.com/shinetata/MemOS-KnowledgeBase-Practice).

You need a MemOS API key and an OpenAI-compatible model endpoint:

```bash
git clone https://github.com/shinetata/MemOS-KnowledgeBase-Practice.git
cd MemOS-KnowledgeBase-Practice
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Fill in `.env`:

```bash
MEMOS_API_KEY=YOUR_MEMOS_API_KEY
MEMOS_BASE_URL=https://memos.memtensor.cn/api/openmem/v1
OPENAI_API_KEY=YOUR_OPENAI_API_KEY
OPENAI_BASE_URL=YOUR_OPENAI_BASE_URL
OPENAI_MODEL=YOUR_MODEL_NAME
```

```bash
python app.py
```

Open [http://127.0.0.1:8765](http://127.0.0.1:8765). The demo ships three users — `alice`, `bob`, `cara` — switchable from the avatar in the top-left rail. Sharing works by entering the recipient's user ID (like `bob`); the current user's ID is shown in the sidebar.

Suggested walkthrough: create a library as `alice` → upload the sample documents → wait until they show as available → share with `bob` → switch to `bob` and ask a question → switch to `cara` and confirm she sees nothing. `cara` can still ask questions without any library: the reply will state that no knowledge-base content was referenced, which contrasts directly with bob's cited answers.

## Four Decisions Worth Studying

Once it runs, the pages matter less than four decision points. The whole demo fits in three files — `memos_client.py`, `store.py`, `app.py` — and every snippet below maps directly onto them.

### Decision 1: Outsource Document Parsing Entirely

The ID returned by knowledge-base creation goes straight into the app's own storage, attached to the current user. From then on, that ID is the anchor of the permission tables:

```python
kb_id = memos.create_knowledgebase(name, description)
store.create_kb(kb_id, owner_id, name, description)
```

Uploads are encoded as Data URIs and handed to `/add/knowledgebase-file`; parsing, chunking, and indexing all happen on the MemOS side:

```python
encoded = base64.b64encode(content).decode("ascii")
memos.post("/add/knowledgebase-file", {
    "knowledgebase_id": kb_id,
    "file": [{
        "type": "document",
        "name": filename,
        "content": f"data:{mime};base64,{encoded}",
    }],
})
```

Fresh uploads usually come back as `running`, so the page polls `/get/knowledgebase-file` until `completed` or `failed`. One trap worth knowing: asking questions before parsing finishes means retrieval cannot recall that document. The demo keeps polling while files are still processing rather than leaving users to guess.

### Decision 2: A Share Is Just a Row in Your Database

Sharing does not call MemOS — worth repeating. After the owner enters the recipient's ID, the app runs two checks, writes one row, and is done:

```python
def share_kb(self, owner_id, kb_id, member_id):
    if not self.can_manage(owner_id, kb_id):
        raise PermissionError("only the owner can share")
    if not self.get_user(member_id):
        raise KeyError("unknown user id")
    self.insert_share(kb_id, member_id)
```

The demo matches recipients by a stable user ID. An application can also resolve a phone number or email to an account first, as Memmy does, then store the corresponding user ID. When a recipient opens the page, the app reads from its two tables:

```python
owned = store.list_owned(user_id)
shared = store.list_shared(user_id)
```

Role decides permission: owners can upload, delete, and share; recipients can only browse files and ask questions.

### Decision 3: knowledgebase_ids Is the Only Exit for Permissions

Before any answer is generated, the app validates access, then passes the ID to search:

```python
kb = require_view(user_id, kb_id)
retrieved = memos.search_memory(
    query=query,
    user_id=user_id,
    knowledgebase_ids=[kb["kb_id"]],
    conversation_id=conversation_id,
)
```

The public API searches no knowledge base by default; only explicitly passed IDs enter the recall. In other words, `knowledgebase_ids` is not a display-layer filter but the final gate of your permission logic: an unauthorized ID must never appear in that list. The demo asks against the currently open library, so it passes a single ID; if your product needs "ask across everything I can see", pass all IDs the user can access.

### Decision 4: One Recall, Two Kinds of Memory

A single `/search/memory` call returns both knowledge-base snippets and the current user's facts and preferences:

```python
context_data = {
    "query": query,
    "user_id": user_id,
    "conversation_id": conversation_id,
    "knowledgebase_ids": [kb_id],
    "include_memory_view": ["detail_factual", "preference"],
    "memory_limit_number": 9,
    "relativity": 0.45,
}
```

Weight the two deliberately in your prompt: policies, processes, and quotas come from the knowledge base; personal preferences may shape tone but must never override the written rules. When the knowledge base has no evidence, the assistant should say so instead of inventing a rule the handbook never wrote.

Afterwards, the turn can be written back under the current `user_id` via `/add/message`. The next time bob asks something, MemOS brings bob's own preferences along — the most concrete expression of "shared content, isolated memory".

## Acceptance Checklist

After integration, walk all three roles; all three statements must hold:

1. `alice` creates a library, uploads documents, waits for "available", and shares with `bob` — the write path works.
2. `bob` sees the library under shared libraries and can ask questions, but the UI offers no upload or delete entry; direct write API calls are also rejected by the server's ownership check.
3. `cara`'s sidebar shows nothing, and even a guessed knowledge-base ID sent straight to the API is rejected by the app layer. `cara` may still ask general questions, but the retrieval scope contains no knowledge base and the answer carries no citations.

The third item is the one most often missed: isolation is not achieved by the frontend not rendering something, but by the server recomputing the visible scope before every retrieval.

## Where the Code Lives

- Repository: [MemOS-KnowledgeBase-Practice](https://github.com/shinetata/MemOS-KnowledgeBase-Practice)

Page layout, left to right: a slim navigation rail, the library list (personal / shared), the file panel of the selected library, and a large Q&A area that asks against the current library. The core retrieval logic is condensed into this one method in `memos_client.py`:

```python
def search_memory(self, query, user_id, knowledgebase_ids, conversation_id):
    return self._post("/search/memory", {
        "query": query,
        "user_id": user_id,
        "conversation_id": conversation_id,
        "knowledgebase_ids": knowledgebase_ids,
        "include_memory_view": ["detail_factual", "preference"],
        "memory_limit_number": 9,
        "relativity": 0.45,
    })
```

Knowledge-base content is shared with authorized members; user memory stays per person. Once your app computes the visible scope correctly, MemOS takes care of the rest.
