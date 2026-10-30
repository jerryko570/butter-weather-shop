# 34. fetch 구조(인자 2개·옵션 3개) + 에러 처리(res.ok·throw/return 약속) + `??` 기본값

> 한 줄: **fetch는 `fetch(①URL, ②옵션객체)` — 괄호 "안"에 인자 2개(쉼표로 구분). 옵션 3개는 택배로 이해: method(보낼까=POST)·headers(라벨: JSON이라고)·body(내용물: 객체를 JSON.stringify로 글자화). 응답은 2단계(res=봉투: res.ok·상태코드 / res.json()=알맹이). fetch는 404·500에도 에러를 안 던지니 `!res.ok`를 직접 체크 → 실패면 throw, 성공이면 return. React Query 약속: throw=실패(isError)/return=성공(onSuccess). `A ?? B`=A가 없으면(null/undefined) B(기본값 fallback).**
> mutate체인·createdPurchase [[31-entry-point-mutate-chain-createdpurchase]] · REST/JSON [[32-ui-code-mapping-read-vs-write-rest-api]] · 타입적용/Promise [[33-type-apply-generics-hook-kinds-promise]]

---

## 1. ⭐ fetch 구조 — 인자 2개 (괄호 안에 쉼표로)

```ts
const res = await fetch('/api/purchases', { method:'POST', headers, body })
//    └┬┘   └─┬─┘ └─┬─┘ └──────┬───────┘  └──────────┬──────────┘
//   담기  기다림 함수    ① URL(어디로)         ② 옵션(어떻게)
//                      └────────── fetch( ) 괄호 안 ──────────┘
```

- `fetch(인자1, 인자2)` — **괄호로 호출**, 안에 인자 2개(쉼표 구분). `fetch, {}`(괄호 밖) ❌.
- 쉼표는 fetch **뒤**가 아니라 **괄호 안**에서 "URL과 옵션 구분".
- 너가 본 2-인자 패턴들과 동일: `mutate(데이터,{옵션})`·`.eq('slug',slug)`·`.reduce(콜백,0)`.
- `await` = 비동기(네트워크)라 기다림 / `const res =` = 결과(봉투) 담기.

---

## 2. ⭐ 옵션 3개 — 📮 택배로 이해 (외우지 말고)

| 옵션 | 택배 | 묻는 것 |
| --- | --- | --- |
| `method: 'POST'` | 보낼까 가져올까 | "뭐 하려고?" → 보내기(POST). GET=가져오기 |
| `headers: {'Content-Type':'application/json'}` | 상자 라벨 | "뭐 들었어?" → JSON이라고 서버에 알림 |
| `body: JSON.stringify(input)` | 실제 내용물 | "진짜 뭘 보내?" → 데이터(객체→글자) |

- **외우지 말고 "택배 보내려면 ①방법 ②라벨 ③내용물"**이 당연히 필요하다고 이해. 암기가 아니라 자주 써서 손에 익는 영역(스니펫).
- `JSON.stringify` = 객체를 **문자열로** 펴기(네트워크엔 글자만). `Content-Type: application/json` = "이거 JSON이야" 안내문.

---

## 3. ⭐ 응답은 2단계 — res(봉투) vs res.json()(알맹이)

```ts
const res = await fetch(…)   // ① 봉투 도착 (상태코드·헤더·res.ok)
return res.json()            // ② 봉투 열어 알맹이(진짜 데이터) 꺼냄
```

- `res` 자체엔 데이터 없음 — `res.json()`으로 한 번 더 꺼내야 함(그래서 await 2번).
- 실패 블록의 `await res.json()`은 에러 메시지를 **지금 꺼내 써야** 해서 await 붙임. return 쪽은 async가 자동으로 Promise 감싸줘서 await 생략 가능.

---

## 4. ⭐⭐ 에러 처리 — res.ok + throw/return 약속

```ts
if (!res.ok) {                        // 실패하면
  const { error } = await res.json()  // 응답서 에러 메시지 꺼냄
  throw new Error(error ?? '주문실패') // 던짐
}
return res.json()                      // 성공하면 데이터 돌려줌
```

- **`res.ok`** = 상태코드 200~299면 `true`(성공). `!res.ok`=서버 거절(400·404·500).
- ⚠️ **fetch는 404·500에도 에러를 안 던짐** — 봉투는 도착했으니까. → **`!res.ok`를 직접 체크**해 던져야 함. (안 하면 실패 응답을 성공인 줄 알고 그냥 진행 → 버그)
- 📮 봉투 도착 → 도장(res.ok) 확인 → 없으면 반송사유(error) 꺼내 "실패!"(throw) / 있으면 내용물(Purchase) 돌려줌(return).

### ⭐ React Query와의 약속 — throw냐 return이냐로 성공/실패 알림

```
throw 했다  → "실패!" → isError=true, error에 담김 → 화면 에러
return 했다 → "성공!" → onSuccess 호출 (결제창·팝업)
```

- 성공 여부를 **플래그(true/false)로 알리는 게 아니라, "던지냐 돌려주냐"로** 알림.
- 그래서 이 함수엔 "성공했어요" 리턴이 없고 **성공=데이터 return / 실패=throw** 두 출구만.

---

## 5. ⭐ `??` — 없으면 오른쪽 (기본값 fallback)

```ts
error ?? '주문실패'
```

- `A ?? B` = **A가 없으면(null/undefined) B**. A가 있으면 A.
  - `error='재고 부족'`(있음) → '재고 부족'(왼쪽)
  - `error=undefined`(없음) → '주문실패'(오른쪽 기본값)
- ⚠️ "error면 오른쪽"이 아니라 **"error가 *없으면* 오른쪽"**(왼쪽 비면 떨어짐).
- 목적: 서버가 메시지 줬으면 구체적으로, 안 줬으면 기본 문구로 대비.
- 너가 본 `price_usd ?? 0`과 같은 `??`. (삼항 `?:`와 다름 — 자주 헷갈리는 짝)

---

## 한 줄 정리 모음

1. `fetch(①URL, ②옵션)` — 괄호 안 인자 2개(쉼표). mutate(데이터,옵션)과 같은 꼴.
2. 옵션 3개=택배: method(방법 POST)·headers(라벨 JSON)·body(내용물, stringify). 외우지 말고 이해/스니펫.
3. 응답 2단계: res(봉투·res.ok) / res.json()(알맹이). 데이터는 한 번 더 꺼내야.
4. fetch는 404·500에도 에러 안 던짐 → `!res.ok` 직접 체크. throw=실패/return=성공(React Query 약속).
5. `A ?? B`=A 없으면(null/undefined) B. "error면"이 아니라 "error 없으면" 오른쪽. 기본값 fallback.
