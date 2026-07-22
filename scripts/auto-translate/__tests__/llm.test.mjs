import test from 'node:test'
import assert from 'node:assert/strict'

import {
  callLLM,
  callLLMComplete,
  translateDocument,
  translateStrings,
} from '../auto-translate.mjs'

/** Build a fake fetch that records requests and returns scripted responses. */
function fakeFetch(handler) {
  const calls = []
  const fn = async (url, init) => {
    const body = JSON.parse(init.body)
    calls.push({ url, init, body })
    const res = handler(body, calls.length - 1)
    return {
      ok: res.ok !== false,
      status: res.status ?? 200,
      statusText: res.statusText ?? 'OK',
      async json() { return res.json },
      async text() { return res.text ?? '' },
    }
  }
  fn.calls = calls
  return fn
}

/** Shape a normal chat/completions success payload. */
function completion(content, finishReason = 'stop') {
  return { json: { choices: [{ message: { content }, finish_reason: finishReason }] } }
}

function withFetch(fake, fn) {
  const orig = globalThis.fetch
  globalThis.fetch = fake
  return Promise.resolve()
    .then(fn)
    .finally(() => { globalThis.fetch = orig })
}

test('callLLM: sends model/messages and returns content + finishReason', async () => {
  const fake = fakeFetch(() => completion('hello', 'stop'))
  await withFetch(fake, async () => {
    const out = await callLLM('sys', 'user', 1234)
    assert.equal(out.content, 'hello')
    assert.equal(out.finishReason, 'stop')

    const { url, body } = fake.calls[0]
    assert.match(url, /\/chat\/completions$/)
    assert.equal(body.max_tokens, 1234)
    assert.equal(body.messages[0].role, 'system')
    assert.equal(body.messages[0].content, 'sys')
    assert.equal(body.messages[1].content, 'user')
  })
})

test('callLLM: throws with status + body on non-ok response', async () => {
  const fake = fakeFetch(() => ({ ok: false, status: 429, statusText: 'Too Many Requests', text: 'rate limited' }))
  await withFetch(fake, async () => {
    await assert.rejects(() => callLLM('s', 'u'), /API Error: 429 Too Many Requests rate limited/)
  })
})

test('callLLMComplete: retries with doubled max_tokens on truncation, then succeeds', async () => {
  const fake = fakeFetch((body, i) =>
    i === 0 ? completion('partial', 'length') : completion('complete', 'stop'),
  )
  await withFetch(fake, async () => {
    const out = await callLLMComplete('sys', 'user')
    assert.equal(out, 'complete')
    assert.equal(fake.calls.length, 2)
    // second attempt must request a larger budget than the first
    assert.ok(fake.calls[1].body.max_tokens > fake.calls[0].body.max_tokens)
  })
})

test('callLLMComplete: throws when finish_reason is neither stop nor length', async () => {
  const fake = fakeFetch(() => completion('', 'content_filter'))
  await withFetch(fake, async () => {
    await assert.rejects(() => callLLMComplete('s', 'u', 'doc'), /finish_reason=content_filter/)
  })
})

test('translateDocument: strips code fences and guarantees a trailing newline', async () => {
  const fake = fakeFetch(() => completion('```mdx\n# Title\n\nBody\n```', 'stop'))
  await withFetch(fake, async () => {
    const out = await translateDocument('# 标题', 'en')
    assert.equal(out, '# Title\n\nBody\n')
  })
})

test('translateStrings: returns [] for empty input without calling the API', async () => {
  const fake = fakeFetch(() => completion('[]'))
  await withFetch(fake, async () => {
    const out = await translateStrings([], 'en')
    assert.deepEqual(out, [])
    assert.equal(fake.calls.length, 0)
  })
})

test('translateStrings: parses a same-length JSON array', async () => {
  const fake = fakeFetch(() => completion(JSON.stringify(['A', 'B'])))
  await withFetch(fake, async () => {
    const out = await translateStrings(['甲', '乙'], 'en')
    assert.deepEqual(out, ['A', 'B'])
  })
})

test('translateStrings: throws on mismatched array length', async () => {
  const fake = fakeFetch(() => completion(JSON.stringify(['only-one'])))
  await withFetch(fake, async () => {
    await assert.rejects(() => translateStrings(['甲', '乙'], 'en'), /mismatched array length/)
  })
})
