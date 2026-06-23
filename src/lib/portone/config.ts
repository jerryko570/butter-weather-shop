/**
 PortOne(포트원) 결제창을 띄울 때 필요한 공개 설정값을 한곳에 모아두는 파일.
 - Store ID / Channel Key는 admin.portone.io 콘솔 -> 결제 연동에서 복사해 .env.local에 넣는다.
 - 이 두 값은 브라우저(결제창)에서 사용하므로 공개돼도 안전한 값이다. (그래서 NEXT_PUBLIC_)
 - 진짜 비밀키(API Secret)는 여기 두지 않는다. 그건 서버(payment.service.ts)에서만 쓴다.

 [왜 따로 빼두나]
 - 나중에 PortOne이 아닌 다른 PG로 갈아끼울 때, 설정을 한 군데서만 바꾸면 되도록.
*/

// process.env에서 콘솔 키를 꺼내온다. 아직 .env.local에 안 넣었으면 undefined가 들어온다.
export const PORTONE_STORE_ID = process.env.NEXT_PUBLIC_PORTONE_STORE_ID ?? ''
export const PORTONE_CHANNEL_KEY =
  process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY ?? ''

// 키가 아직 안 들어왔는지 확인하는 도우미 (개발 중 "왜 결제창이 안 뜨지?" 디버깅용)
export const isPortOneConfigured = Boolean(
  PORTONE_STORE_ID && PORTONE_CHANNEL_KEY
)
