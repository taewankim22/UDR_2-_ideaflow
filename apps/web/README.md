# IdeaFlow Web Skeleton

프론트 화면 담당자가 레이아웃과 스타일 수정에 집중할 수 있도록, 화면 표현과 앱 상태/API 호출을 분리했습니다.

## 수정 우선순위

1. 화면 레이아웃과 Tailwind 클래스 수정: `features/*/*View.tsx`
2. 공통 레이아웃 수정: `components/layout/*`
3. 반복 UI 수정: `components/common/*`
4. 라벨, 카테고리, 카드 배경, 화이트보드 노드 스타일 수정: `lib/uiConfig.ts`
5. 화이트보드 노드 생성/정규화 수정: `lib/whiteboard.ts`

## 상태와 API 경계

- 앱 상태, 화면 전환, API 호출은 `hooks/useIdeaFlowController.ts`가 담당합니다.
- API 클라이언트 인터페이스는 `lib/client.ts`에 고정되어 있습니다.
- 실제 API 구현은 `lib/httpClient.ts`, 브라우저 mock 구현은 `lib/mockClient.ts`에 있습니다.
- 공통 타입 계약은 루트 `shared/types.ts`를 기준으로만 수정합니다.

## 화면별 파일

- 로그인: `features/auth/LoginScreen.tsx`
- 메인 피드: `features/feed/FeedView.tsx`
- 아이디어 작성: `features/compose/ComposeView.tsx`
- 화이트보드: `features/whiteboard/WhiteboardView.tsx`
- AI 평가: `features/ai/AIView.tsx`
- 프로필: `features/profile/ProfileView.tsx`

## API 전환

`.env.local`의 `NEXT_PUBLIC_API_MODE`로 전환합니다.

```env
NEXT_PUBLIC_API_MODE="api"
NEXT_PUBLIC_API_BASE_URL="http://localhost:4000/api"
```

mock 화면만 보고 싶으면 `NEXT_PUBLIC_API_MODE`를 `mock`으로 바꾸면 됩니다.

## 검증 명령

```bash
npm run typecheck
npm run build
```
