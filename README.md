# cleanMac

Cisco IOS 스위치의 **포트 현황과 학습된 MAC 주소**를 Excel에 바로 붙여넣을 수 있는 표 형태로 정리해 주는 단일 페이지 웹 앱.

`sh int status`와 `sh mac address-table` 출력 두 개를 붙여넣으면, 다음 7개 컬럼으로 정리된 표를 만들어 클립보드(TSV)로 복사한다.

```
Port | Status | Vlan | Duplex | Speed | Type | MAC
```

같은 포트에 여러 MAC이 잡힐 경우, **첫 행에만 포트 정보를 채우고 이후 행은 MAC 컬럼만 채워** 기존 운영 관행에 맞춘 형태로 출력한다.

> 자세한 요구사항은 [docs/requirements.md](docs/requirements.md) 참조.

---

## 빠른 시작

### 사전 요구사항
- Node.js 20+ (권장: 최신 LTS)
- npm 10+

### 의존성 설치

```bash
npm install
```

### 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:5173](http://localhost:5173) 접속.

### 프로덕션 빌드

```bash
npm run build
```

`dist/` 폴더에 정적 파일이 생성됨. 사내 웹 서버에 그대로 올리거나 `dist/index.html`을 브라우저로 열어도 동작한다 (`vite.config.ts`에서 `base: './'` 설정).

### 타입 검사

```bash
npm run typecheck
```

### 파서 동작 확인

```bash
npx tsx scripts/smoke-test.ts
```

샘플 입력으로 파싱·결합·TSV 출력을 점검한다.

---

## 사용 방법

1. Cisco 스위치 콘솔에서 다음 명령을 실행하고 출력을 복사.
   ```
   show interfaces status
   show mac address-table
   ```
2. 웹 페이지의 두 입력 영역에 각각 붙여넣기.
3. **[변환]** 버튼 클릭 → 결과 표가 화면 하단에 표시됨.
4. **[클립보드 복사]** 버튼 클릭 → Excel 시트로 이동하여 `Ctrl+V` 붙여넣기.

상단의 **[예시 입력]** 버튼을 누르면 샘플 데이터를 자동으로 채워 동작을 확인할 수 있다.

---

## 처리 규칙 요약

| 상황 | 처리 방식 |
|------|----------|
| 한 포트에 MAC 1개 | 1행 (정상) |
| 한 포트에 MAC N개 | N행 — 첫 행만 Port~Type 채움, 이후 행은 MAC만 |
| MAC 없는 포트 (notconnect / disabled) | 포함, MAC 컬럼은 빈칸 |
| 시스템 MAC (`CPU`, `Drop`) | 제외 |
| `sh int status`에 없는 포트의 MAC | 제외 (경고 메시지 표시) |
| 포트 표기 정규화 | `GigabitEthernet1/0/1` → `Gi1/0/1` 등 short name 사용 |

---

## 디렉터리 구조

```
cleanMac/
├── docs/                       기획·요구사항 문서
│   └── requirements.md
├── src/
│   ├── parsers/                Cisco 출력 파싱 로직
│   │   ├── portName.ts          포트 이름 정규화
│   │   ├── interfaceStatus.ts   sh int status 파서 (컬럼 위치 기반)
│   │   ├── macAddressTable.ts   sh mac add 파서 (정규식 기반)
│   │   ├── combine.ts           결합 + TSV 변환
│   │   └── types.ts
│   ├── sampleData.ts            예시 입력 데이터
│   ├── App.tsx                  메인 UI
│   ├── main.tsx
│   └── index.css
├── scripts/
│   └── smoke-test.ts            파서 회귀 테스트
├── index.html
├── package.json
└── vite.config.ts
```

---

## 보안

- 입력한 스위치 출력은 **외부 네트워크로 전송되지 않으며**, 브라우저 안에서만 처리된다.
- 백엔드 서버가 없으므로 정적 호스팅 또는 로컬 파일 실행이 가능하다.

---

## 트러블슈팅

| 증상 | 원인 및 조치 |
|------|-------------|
| 결과 표가 비어 있음 | `sh int status` 입력에 `Port / Status / Vlan / Duplex / Speed / Type` 헤더 줄이 포함되어 있는지 확인 |
| MAC이 매칭되지 않음 | `sh mac add` 출력에 `Vlan / Mac Address / Type / Ports` 헤더가 있는지 확인 |
| "포트가 제외되었습니다" 경고 | `sh int status`에는 없고 `sh mac add`에만 존재하는 포트(Port-channel, 다른 스위치 등). 정상 동작이며 결과에서만 제외됨 |
| 클립보드 복사 실패 | 브라우저 보안 정책. 결과 영역에서 직접 드래그하여 복사 |

---

## 라이선스 / 도구

- React 18 + TypeScript + Vite 6
- Tailwind CSS 3
- 아이콘: [Lucide](https://lucide.dev) (`lucide-react`)
