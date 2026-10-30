# 25. Supabase 읽기 쿼리체인 — .from/.select/.eq/.single + 같은 단어 두 뜻 + await 실행순서

> 한 줄: **`supabase.from().select().eq().single()`은 "주문서 작성"이고, `await` 해야 DB로 발사된다. `.select`=칸(세로), `.eq`=행(가로). `.eq('slug', slug)`는 같은 단어지만 앞 `'slug'`=컬럼 이름(따옴표) / 뒤 `slug`=받은 값(변수). `const { data, error } = await ...`는 오른쪽(체인)이 먼저 실행돼 결과가 왼쪽에 담긴다.**
> 함수문법·읽기흐름 [[11-function-syntax]] · 같은단어 두뜻(i.id===item.id) [[15-find-dot-notation]]

---

## 오늘 뜯은 코드 (useProduct의 queryFn)

```ts
queryFn: async () => {
  const { data, error } = await supabase
    .from('products')      // ① 어느 테이블
    .select('*')           // ② 어느 칸 (전체 열)
    .eq('slug', slug)      // ③ 어느 행 (조건)
    .single()              // ④ 한 행을 객체로
  if (error) throw error   // ⑤ 에러 거르기
  return data              // ⑥ 깨끗한 data 반환
}
```

---

## 1. ⭐ 쿼리체인 = "주문서 작성" (await 전엔 DB 안 감)

| 메서드 | 뜻 | 자르는 방향 |
| --- | --- | --- |
| `.from('products')` | 어느 **테이블** | — |
| `.select('*')` | 어느 **칸(컬럼)** 볼지 (`'*'`=전체 열) | **세로** |
| `.eq('slug', slug)` | 어느 **행(줄)** 고를지 (조건) | **가로** |
| `.single()` | 그 **한 행**을 객체로 (0개·2개+면 throw) | — |

- 체인은 **"주문서를 적는 것"**일 뿐. `await` 하는 순간 SQL로 번역돼 DB로 **발사**됨.
- **`.select`=칸(세로로 자르기) vs `.eq`=행(가로로 자르기)** — 이 구분이 핵심.
- `.single()` 때문에 리턴이 `Product[]`(배열)가 아니라 `Product`(객체 하나).

---

## 2. ⭐ `.eq('slug', slug)` — 같은 단어, 다른 뜻 (따옴표로 구분)

```ts
.eq('slug', slug)
     └─①─┘  └②┘
```

| | 뭐냐 | 따옴표 |
| --- | --- | --- |
| ① `'slug'` | **DB 컬럼(칸) 이름** — products의 slug 칸 | 있음 (고정 문자열) |
| ② `slug` | **이 함수가 받은 값** (예: 'beads-01') | 없음 (변수) |

- 뜻: **"slug **칸**이, 받은 slug **값**과 같은 행을 골라줘"** → 그 slug인 상품 1개.
- 값 넣어보면: URL `/products/beads-01` → `slug='beads-01'` → `.eq('slug', 'beads-01')`.
- 우연히 컬럼명·매개변수명이 둘 다 `slug`라 헷갈림. 컬럼명이 `product_slug`였으면 `.eq('product_slug', slug)`라 안 헷갈렸을 것.
- 🔗 `i.id === item.id`에서 같은 id 두 개 구분하던 것과 같은 결 [[15-find-dot-notation]]. `.eq('category', category)`도 동일(앞=컬럼명/뒤=받은 값).

---

## 3. ⭐ `const { data, error } = await supabase...` — 실행 순서 오른쪽→왼쪽

```ts
const { data, error } = await supabase.from()....single()
      └──────┬──────┘        └────────┬────────┘
         ② 결과 담김            ① 먼저 실행! (체인+await)
```

- **쓰는 순서**(눈): 왼→오 (`const {data,error}` 먼저 보임)
- **실행 순서**(동작): 오→왼 (체인이 먼저 돌아 응답 받고 → 왼쪽에 담김)
- `const {data,error}=`은 **"담을 그릇"** — 왼쪽에 먼저 쓰지만 **맨 나중에 채워짐**.
- 🔗 `const { data: product } = useProduct(slug)`와 같은 "오른쪽 먼저 실행" 패턴 [[11-function-syntax]] ⑫.

### 왜 const가 먼저? — 담아야 다음 줄에서 쓴다

```ts
const { data, error } = await supabase...  // ① 결과를 담고
if (error) throw error                      // ② 담은 error를 씀
return data                                 // ③ 담은 data를 씀
```

- `await`가 준 결과를 **담아둬야** 다음 줄(if·return)에서 쓸 수 있음. 안 담으면 증발.
- `const existing = find(...)` → if에서 쓰던 것과 같은 "담고 → 쓴다" 패턴.

---

## 4. ⭐ async / await = "기다림"

- `queryFn: async () => {}` — `async`는 함수 바로 앞 꼬리표. **`=` 안 붙음**(객체 키라 `queryFn:` 콜론).
- `await supabase...` = **"응답 올 때까지 기다렸다가 결과를 꺼내라".** DB 왕복이 시간 걸려서, 안 기다리면 빈 값이 옴.
- supabase = DB랑 통신하는 **통로(전화선)**. `createClient()`로 통로 깔고 → `await supabase.from()...`로 주문 보내고 응답 받기.

---

## 5. ⭐ Supabase 응답 `{ data, error }` — 날것(raw)

- `await supabase...`가 돌려주는 **날것 응답**. 한쪽이 값이면 다른 쪽은 null.
  - 성공 → data 있음 / error = null
  - 실패 → data = null / error 있음
- ⚠️ **Supabase는 자동 throw 안 함** → `if (error) throw error`를 **직접** 써야 함.
- 출구 2개: `return data`(성공) / `throw error`(실패).

---

## 한 줄 정리 모음

1. 쿼리체인 = 주문서 작성. `await` 해야 DB로 발사. `.select`=칸(세로)/`.eq`=행(가로)/`.single`=한 행 객체.
2. `.eq('slug', slug)`: 앞 `'slug'`=컬럼 이름(따옴표) / 뒤 `slug`=받은 값(변수). "그 칸이 그 값인 행".
3. `const {data,error}=await...`: 오른쪽(체인) 먼저 실행 → 왼쪽에 담김. 그릇은 먼저 쓰고 나중에 채워짐.
4. const 먼저 오는 이유 = 담아야 다음 줄(if·return)에서 씀.
5. `async`는 함수 앞 꼬리표(= 없음) / `await`=응답 기다림. supabase=DB 통로.
6. `{data,error}`=날것 응답(한쪽 값이면 다른 쪽 null). Supabase 자동 throw 안 해서 `if(error) throw` 직접.
