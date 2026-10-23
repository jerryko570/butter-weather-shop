# 27. set vs get — 쓰기(바꾸기) vs 읽기(꺼내보기)

> 한 줄: **`set`은 store를 바꿀 때(쓰기) 쓰고 콜백을 받는다(기존 상태 보고 새 상태를 "계산"). `get`은 지금 상태를 꺼내 볼 때(읽기) 쓰고 콜백 없이 `get()`으로 부른다. getItem 같은 "읽기" 액션은 `get().items.find(...)`. set에 값을 return하면 store 전체가 그 값으로 뭉개지므로, 읽기엔 절대 set을 쓰면 안 된다.**
> set=쓰는 손 [[16-set-closure-write]] · 값 흐름/저장소 [[26-updatequantity-value-flow-subscribe]]

---

## 둘 다 persist 콜백이 쥐어준다

```ts
persist((set, get) => ({ ... }))
         └┬┘  └┬┘
        쓰기   읽기
```

- `set` = store를 **바꿀 때** (addItem·removeItem·updateQuantity — 전부 items를 바꿈)
- `get` = 지금 store 상태를 **읽을 때** (getItem — 안 바꾸고 현재 items를 꺼내 봄)

---

## 1. ⭐ 부르는 법이 다르다 — set은 콜백, get은 그냥 `get()`

```ts
set((state) => ({ ... }))   // 콜백 받음
get()                        // 아무것도 안 받음
```

| | 받는 것 | 결과 | 언제 |
| --- | --- | --- | --- |
| `set` | 콜백 `(state) => ({})` | store를 바꿈 | **바꿀 때(쓰기)** |
| `get` | **없음** `get()` | 지금 store를 돌려줌 | **읽을 때(읽기)** |

### 왜 set만 콜백을 받나

- `set` = "기존 상태 보고 **새 상태를 계산해** 바꿔줘" → 그 계산을 담을 **콜백**이 필요. set이 콜백의 `(state)` 빈칸에 지금 상태를 채워줌.
- `get` = "그냥 **지금 상태 꺼내** 줘" → 계산할 게 없으니 콜백도 없음. 부르면 store가 바로 툭 나옴.

---

## 2. ⭐ `get()`의 결과 자체가 상태 (state 대신 get())

```ts
get()        // = 지금 store 전체   (set 콜백의 state에 해당)
get().items  // = 지금 items 배열
```

```ts
state.items.find((i) => i.id === id)   // set 콜백 안: state가 상태
get().items.find((i) => i.id === id)   // get 쓸 때: get()이 상태
```

- `set` 콜백 안에선 `state.items`, `get`으로 읽을 땐 `get().items`. **find 로직은 똑같고, 상태를 어디서 꺼내느냐만 다름.**

---

## 3. ⭐ 읽기(getItem)에 set을 쓰면 안 되는 이유

```ts
// ❌ 잘못
getItem: (id) =>
  set((state) => { return state.items.find((i) => i.id === id) })

// ✅ 맞음
getItem: (id) => get().items.find((i) => i.id === id),
```

- set은 콜백의 **return값을 "이걸로 store를 갈아끼워"**라고 받아들임 → `return 찾은객체 하나` 하면 **store 전체가 그 객체 하나로 뭉개짐**(items 배열 사라짐). 읽으려다 store를 부수는 셈.
- getItem은 **아무것도 안 바꾸고 결과만 돌려주면 됨** → 쓰기(set) 아니라 읽기(get).

---

## 4. ⭐ 호출하면

```ts
getItem("사과id")
// 있으면: { id:"사과id", name:"사과", quantity:2, ... } 객체
// 없으면: undefined
```

- find라서 "한 객체 or undefined" (0개면 undefined).

---

## 비유: 창고

- `set` = 창고에 **물건 넣기/바꾸기** (손 댐 → store 바뀜)
- `get` = 창고 안을 **들여다보기** (손 안 댐 → 그냥 봄)

getItem은 "사과 있나 볼게" 하고 들여다보기만 → `get`.

---

## 한 줄 정리 모음

1. `set`=쓰기(바꾸기)·콜백 받음 / `get`=읽기(꺼내보기)·`get()`으로 그냥 부름(콜백 없음).
2. set만 콜백 받는 이유 = 기존 상태 보고 새 상태를 "계산"해야 하니까. get은 계산 없이 지금 상태만 줌.
3. `get()`의 결과가 곧 상태 → `state.items`(set 콜백) ↔ `get().items`(get). find 로직은 동일.
4. 읽기(getItem)에 set 쓰면 return값이 store를 통째로 갈아끼워 뭉개짐 → 반드시 `get().items.find(...)`.
5. 비유: set=창고에 손대기 / get=창고 들여다보기.
