# 37. 코드 네비게이션 — 타입/심볼 추적 (Cmd+Click · Shift+F12 · 텍스트검색 vs 심볼참조)

> 한 줄: **낯선 코드 추적 2대 스킬 = `Cmd+Click`(정의로 점프, Go to Definition) + `Shift+F12`(누가 쓰나, Find All References). "이 타입 누가 쓰나"는 텍스트 검색(Cmd+Shift+F, 593개 노이즈=substring·노트까지) 말고 `Shift+F12`(13개, 진짜 심볼만). References 패널의 파일별 숫자=사용 횟수, 제일 많은 파일=그 타입의 "핵심 처리 장소"(Purchase→service.ts가 5=DB 저장·조회·상태변경). 타입 정의 → Shift+F12로 지도 → 흐름 순으로 그 파일들 읽기.**
> 입구 찾는 법·주입주체 추적 [[31-entry-point-mutate-chain-createdpurchase]] · 낯선 코드 파는 법 [[30-reading-unfamiliar-code-route-service-type-design]] · 읽기vs쓰기·훅분류 [[32-ui-code-mapping-read-vs-write-rest-api]]

---

## 1. ⭐⭐ 2대 스킬 — Cmd+Click + Shift+F12

| 스킬 | 단축키 | 뭐냐 | 언제 |
| --- | --- | --- | --- |
| **Go to Definition** | `Cmd+Click`(심볼/import에) | "이거 **어디서 정의**됐지?" → 원본으로 점프 | "이거 뭐지?" 할 때 |
| **Find All References** | `Shift+F12`(심볼에 커서) | "이거 **누가 쓰나**?" → 쓰는 곳 다 | "흐름 추적" 할 때 |

- `Cmd+Click` = 타입·함수·변수 아무거나 → 정의로 날아감. (import 경로 Cmd+Click = 그 파일로)
- `Shift+F12` = 심볼에 커서 두고 → References 패널에 "쓰는 곳" 전부.
- 돌아오기: `Ctrl+-`(뒤로). Shift+F12 안 되면 **우클릭 → "Find All References"**.
- → **이 2개면 낯선 코드 어디든 추적 가능.** "이거 뭐지?"=Cmd+Click / "누가 쓰나?"=Shift+F12.

---

## 2. ⭐⭐ 텍스트 검색 vs 심볼 참조 (593개 vs 13개)

| | `Cmd+Shift+F` (텍스트) | `Shift+F12` (심볼 참조) |
| --- | --- | --- |
| 찾는 것 | **글자**가 같은 거 전부 | **진짜 그 심볼**만 |
| "Purchase" 결과 | **593개**(usePurchase·postPurchase substring + docs/study 노트까지) | **13개**(진짜 Purchase 타입) |
| 노이즈 | 많음 | 깔끔 |
| 용도 | 대충 훑기 | **"누가 이 타입/심볼 쓰나" (정확)** |

- **"누가 이 타입 쓰나" = Shift+F12가 정답.** 텍스트 검색은 substring·노트까지 다 잡아 노이즈 폭발.

### 텍스트 검색을 꼭 써야 하면 — 좁히기
- `Aa ab .*` 중 **`ab`(Match Whole Word)** → usePurchase·postPurchase 제외.
- `...` → **"files to exclude"에 `docs/study`** → 노트 수백 개 제외.
- (터미널 grep도 같은 원리: `grep ... | grep -iE "import|: Purchase|<Purchase"`로 필터)

---

## 3. ⭐ References 패널 읽는 법

```
References (13)
├─ usePayment.ts      (2)   결제 (payWithPortOne)
├─ usePurchase.ts     (2)   주문 훅 (Promise<Purchase>)
├─ useAdminOrders.ts  (2)   어드민 조회 (Purchase[])
├─ purchase.service.ts(5)   ← 제일 많음 = 핵심 처리 장소!
└─ purchase.ts        (2)   정의 파일 자신
```

- **파일 옆 숫자 = 그 파일에서 쓴 횟수.**
- **제일 많이 쓴 파일 = 그 타입의 "핵심 처리 장소".** Purchase→`purchase.service.ts (5)` = createPurchase·getPurchaseByPaymentId·markPurchasePaid… **DB 저장·조회·상태변경이 다 여기** → 다음에 볼 곳.
- 이 패널 = **"읽을 파일 지도"**. 흐름 순으로: 생성(usePurchase→service) → 확장(usePayment·admin).

---

## 4. ⭐ 낯선 코드 추적 흐름 (타입부터)

```
① 타입 정의 보기 (Cmd+Click로 점프)
② Shift+F12 → "누가 쓰나" 지도 (References 패널)
③ 숫자 큰 파일 = 핵심 처리 장소 파악
④ 그 지도를 "흐름 순"으로 읽기 (입구→서버→DB)
```
- 파일 열기: import의 심볼/경로 **Cmd+Click**, 또는 **Cmd+P → 파일명**.
- 데이터 중심 기능(결제)은 note 30/32 순서(DB→타입→흐름)와 결합.

---

## 한 줄 정리 모음

1. 2대 스킬: Cmd+Click(정의로 점프, "이거 뭐지") + Shift+F12(누가 쓰나, "흐름 추적"). 돌아오기 Ctrl+-.
2. "누가 이 타입 쓰나"=Shift+F12(13개 정확) / Cmd+Shift+F 텍스트는 593개 노이즈(substring·노트).
3. 텍스트 검색 좁히기: Whole Word(ab) + docs/study exclude.
4. References 숫자=사용 횟수, 제일 많은 파일=핵심 처리 장소(Purchase→service.ts 5=DB 로직).
5. 추적 흐름: 타입 Cmd+Click → Shift+F12 지도 → 숫자 큰 핵심 파악 → 흐름 순 읽기.
