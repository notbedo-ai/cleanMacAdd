---
문서명: cleanMac 요구사항 명세서
목적: Cisco IOS 스위치의 포트 현황을 엑셀로 정리하는 작업을 자동화하는 웹 앱의 요구사항 정의
작성일: 2026-05-11
작성자: 네트워크 인프라 관리자
버전: 0.2
대상 시스템: Cisco IOS 기반 Catalyst 스위치
---

# cleanMac 요구사항 명세서

<i class="fa-solid fa-server"></i> **cleanMac** — *Cisco LAN Equipment & Address Normalizer for MAC*
Cisco 스위치 명령 출력 두 개를 붙여넣으면, Excel에 그대로 붙여넣을 수 있는 표 형식으로 정리해 주는 웹 앱.

---

## 1. 개요 (Overview)

### 1.1 배경
네트워크 인프라 운영 현장에서는 스위치의 **포트별 현황과 연결된 단말의 MAC 정보**를 Excel로 정리해 관리한다.
현재는 운영자가 직접 다음 두 명령을 실행한 뒤 결과를 눈으로 따라가며 Excel 셀에 옮겨 적는다.

- `show interfaces status` (이하 `sh int status`)
- `show mac address-table` (이하 `sh mac add`)

이 수동 작업은 다음과 같은 문제가 있다.
- 포트 수가 많을수록 시간이 오래 걸리고, 옮겨 적는 과정에서 오타·누락이 발생한다.
- 한 포트에 여러 MAC이 잡히는 경우(예: 다운스트림 스위치·VoIP+PC·트렁크), 별도 행을 만들어 일일이 채워야 한다.
- 정리 결과의 품질이 운영자 개인 숙련도에 따라 달라진다.

### 1.2 목적
운영자가 두 명령의 **텍스트 출력**을 웹 페이지에 붙여넣으면, 정해진 컬럼 형식으로 자동 정리되어 **Excel에 그대로 붙여넣을 수 있는 표**를 제공한다.

### 1.3 범위 (Scope)

**포함 (In Scope)**
- Cisco IOS(Catalyst) 표준 출력 파싱
- 두 명령의 결과를 Port 기준으로 결합
- 다중 MAC → 다중 행 분할 출력
- 웹 미리보기 및 TSV 클립보드 복사

**제외 (Out of Scope, 향후 검토)**
- NX-OS / IOS-XE 등 다른 OS 출력 형식
- 다중 장비 일괄 처리
- 기존 Excel 양식(셀 병합·서식)에 자동 채우기
- 파일 업로드 / 스위치에 SSH 직접 접속

---

## 2. 사용자 및 사용 환경 (Users & Environment)

### 2.1 사용자
- 네트워크 인프라 운영자 (1인 또는 소규모 팀)
- Cisco 스위치 CLI 사용에 익숙하나, 별도 스크립팅 환경 구축은 부담스러운 수준

### 2.2 사용 환경
- 사내 PC 브라우저 (Chrome / Edge 최신 버전)
- **외부망 접속이 제한될 수 있는 환경** → 입력 데이터는 외부로 전송하지 않고 브라우저 내에서만 처리
- 사내망에서 단일 페이지로 호스팅하거나, 로컬 파일(`index.html`)로도 동작 가능한 구조 권장

---

## 3. 사용 시나리오 (User Flow)

```mermaid
flowchart LR
    A[운영자] -->|콘솔/SSH| B[Cisco 스위치]
    B -->|sh int status 출력| C[텍스트 복사]
    B -->|sh mac add 출력| C
    C --> D[cleanMac 웹 UI<br/>두 영역에 붙여넣기]
    D -->|변환 클릭| E[파싱 & 결합]
    E --> F[결과 테이블 미리보기]
    F -->|복사 버튼| G[클립보드 - TSV]
    G --> H[Excel 시트<br/>붙여넣기]
```

---

## 4. 기능 요구사항 (Functional Requirements)

| ID | 기능명 | 내용 | 우선순위 |
|----|--------|------|---------|
| F-01 | `sh int status` 입력 | 화면 상단에 다중 줄 텍스트 입력 영역 제공. 운영자가 명령 출력을 복사·붙여넣기. | <i class="fa-solid fa-star"></i> 필수 |
| F-02 | `sh mac add` 입력 | 동일한 형태의 두 번째 텍스트 입력 영역 제공. | <i class="fa-solid fa-star"></i> 필수 |
| F-03 | 파싱 및 결합 | 두 입력을 파싱하여 Port 기준으로 결합. 다중 MAC은 행 분할, MAC 없음은 빈 셀로 채움. | <i class="fa-solid fa-star"></i> 필수 |
| F-04 | 결과 미리보기 | 결합된 결과를 7개 컬럼의 표로 화면에 표시. 총 행 수·포트 수·MAC 수 통계 표시. | <i class="fa-solid fa-star"></i> 필수 |
| F-05 | TSV 클립보드 복사 | "복사" 버튼 클릭 시 결과를 **TSV (탭 구분, 헤더 없음, 데이터 행만)** 로 클립보드에 복사. | <i class="fa-solid fa-star"></i> 필수 |
| F-06 | 입력 초기화 | "초기화" 버튼으로 두 입력 영역과 결과 테이블을 모두 비움. | 권장 |
| F-07 | 파싱 오류 안내 | 입력이 비어 있거나 형식이 다를 경우, 어느 입력의 몇 번째 줄이 문제인지 안내. | 권장 |

---

## 5. 비기능 요구사항 (Non-Functional Requirements)

| 분류 | 요구사항 |
|------|---------|
| <i class="fa-solid fa-shield-halved"></i> 보안 | 입력 데이터(스위치 출력)는 **외부 네트워크로 전송하지 않는다**. 클라이언트(브라우저) 내에서만 처리. |
| <i class="fa-solid fa-bolt"></i> 성능 | 일반적인 48포트 스위치(≤ 수백 MAC) 기준 변환은 1초 이내. |
| <i class="fa-solid fa-eye"></i> 사용성 | 단일 페이지, 입력→결과까지 스크롤 최소. 주요 동작 버튼은 3개 이내(변환, 복사, 초기화). |
| <i class="fa-solid fa-puzzle-piece"></i> 호환성 | Cisco IOS(Catalyst) 표준 출력 포맷. 인터페이스 약식 표기(Gi, Fa, Te, Twe 등)와 정식 표기(GigabitEthernet 등) 모두 인식. |
| <i class="fa-solid fa-globe"></i> 접근성 | 한국어 UI. 운영자가 한눈에 파악 가능한 라벨·에러 메시지. |
| <i class="fa-solid fa-circle-check"></i> 신뢰성 | 정상·비정상 입력 모두 패닉 없이 처리. 잘못된 줄은 건너뛰고 통계에 반영. |

---

## 6. 입출력 명세 (I/O Specification)

### 6.1 입력 1: `sh int status`

**예시 출력**

```
Switch#show interfaces status

Port      Name               Status       Vlan       Duplex  Speed Type
Gi1/0/1   Server-Web-01      connected    10         a-full  a-1000 10/100/1000BaseTX
Gi1/0/2                      notconnect   1          auto    auto   10/100/1000BaseTX
Gi1/0/3   Uplink-Core        connected    trunk      a-full  a-1000 10/100/1000BaseTX
Gi1/0/4                      disabled     1          auto    auto   10/100/1000BaseTX
Gi1/0/5   IP-Phone+PC        connected    20         a-full  a-1000 10/100/1000BaseTX
```

**추출 컬럼 매핑**

| sh int status 컬럼 | 결과 테이블 컬럼 | 비고 |
|---|---|---|
| Port | Port | 그대로 사용 |
| Name | — | 본 버전에서는 미사용 (향후 확장 후보) |
| Status | Status | connected / notconnect / disabled / err-disabled 등 |
| Vlan | Vlan | 숫자 또는 `trunk` / `routed` |
| Duplex | Duplex | a-full / full / half / auto |
| Speed | Speed | a-1000 / 1000 / 100 / auto |
| Type | Type | 미디어 타입 (10/100/1000BaseTX 등) |

### 6.2 입력 2: `sh mac add`

**예시 출력**

```
Switch#show mac address-table
          Mac Address Table
-------------------------------------------

Vlan    Mac Address       Type        Ports
----    -----------       --------    -----
 All    0100.0ccc.cccc    STATIC      CPU
  10    aabb.cc00.0100    DYNAMIC     Gi1/0/1
  20    aabb.cc00.0200    DYNAMIC     Gi1/0/5
  20    aabb.cc00.0201    DYNAMIC     Gi1/0/5
  20    aabb.cc00.0202    DYNAMIC     Gi1/0/5
   1    aabb.cc00.0300    DYNAMIC     Gi1/0/3
  10    aabb.cc00.0301    DYNAMIC     Gi1/0/3
Total Mac Addresses for this criterion: 6
```

**추출 컬럼 매핑**

| sh mac add 컬럼 | 사용 방식 |
|---|---|
| Vlan | 본 버전에서는 결과 컬럼으로 노출하지 않음 (참고용으로만 내부 보관) |
| Mac Address | 결과 테이블의 **MAC** 컬럼 |
| Type | 본 버전에서는 미사용. `STATIC`/`CPU`/`Drop` 등은 일반적으로 결과에서 제외 권장 (7.6 참조) |
| Ports | Port 기준 결합 키 |

### 6.3 결과 테이블 스키마

총 7개 컬럼.

| # | 컬럼명 | 출처 | 비고 |
|---|--------|------|------|
| 1 | Port    | sh int status | 정규화된 짧은 표기 사용 (예: `Gi1/0/1`) |
| 2 | Status  | sh int status | |
| 3 | Vlan    | sh int status | |
| 4 | Duplex  | sh int status | |
| 5 | Speed   | sh int status | |
| 6 | Type    | sh int status | |
| 7 | MAC     | sh mac add    | 한 포트에 여러 MAC이면 행 분할 |

### 6.4 변환 예시 (Before → After)

**입력 1·2를 위 6.1·6.2 예시로 가정**할 때, 결과 테이블은 다음과 같다.

| Port | Status | Vlan | Duplex | Speed | Type | MAC |
|------|--------|------|--------|-------|------|-----|
| Gi1/0/1 | connected | 10 | a-full | a-1000 | 10/100/1000BaseTX | aabb.cc00.0100 |
| Gi1/0/2 | notconnect | 1 | auto | auto | 10/100/1000BaseTX | |
| Gi1/0/3 | connected | trunk | a-full | a-1000 | 10/100/1000BaseTX | aabb.cc00.0300 |
|         |           |       |        |        |                    | aabb.cc00.0301 |
| Gi1/0/4 | disabled | 1 | auto | auto | 10/100/1000BaseTX | |
| Gi1/0/5 | connected | 20 | a-full | a-1000 | 10/100/1000BaseTX | aabb.cc00.0200 |
|         |           |    |        |        |                    | aabb.cc00.0201 |
|         |           |    |        |        |                    | aabb.cc00.0202 |

> <i class="fa-solid fa-circle-info"></i> **참고:** 한 포트에 여러 MAC이 잡힐 경우, **첫 행에만 Port~Type(1~6번) 컬럼을 채우고, 이후 추가 행은 MAC 컬럼만 채우고 나머지는 빈칸**으로 둔다. 기존 운영 관행에 맞춘 형식.

### 6.5 클립보드 복사 형식 (TSV)

- 구분자: **탭 (`\t`)**
- 줄 구분: **`\n`** (또는 `\r\n` — OS 기본)
- **헤더 없음, 데이터 행만**
- 빈 값(MAC 없음 등)은 **빈 문자열**로 출력 (셀이 그대로 비어 보임)

위 예시의 클립보드 내용 (탭은 `→`로 표시):

```
Gi1/0/1→connected→10→a-full→a-1000→10/100/1000BaseTX→aabb.cc00.0100
Gi1/0/2→notconnect→1→auto→auto→10/100/1000BaseTX→
Gi1/0/3→connected→trunk→a-full→a-1000→10/100/1000BaseTX→aabb.cc00.0300
→→→→→→aabb.cc00.0301
Gi1/0/4→disabled→1→auto→auto→10/100/1000BaseTX→
Gi1/0/5→connected→20→a-full→a-1000→10/100/1000BaseTX→aabb.cc00.0200
→→→→→→aabb.cc00.0201
→→→→→→aabb.cc00.0202
```

> <i class="fa-solid fa-circle-info"></i> 추가 행은 앞 6개 컬럼이 빈 문자열이며 탭만 연속으로 들어간다. Excel에 붙여넣으면 빈 셀로 표시된다.

---

## 7. 처리 규칙 (Processing Rules)

### 7.1 포트 식별자 정규화
- 두 명령에서 사용되는 인터페이스 표기를 **짧은 형태(short name)** 로 통일하여 결합 키로 사용한다.
- 매핑 예시:
  - `GigabitEthernet1/0/1` ↔ `Gi1/0/1`
  - `FastEthernet0/1` ↔ `Fa0/1`
  - `TenGigabitEthernet1/0/1` ↔ `Te1/0/1`
  - `TwentyFiveGigE1/0/1` ↔ `Twe1/0/1`
- 출력 테이블의 Port 컬럼에는 **짧은 표기**를 사용한다.

### 7.2 결합 처리 (Join)
- Port 기준 LEFT JOIN: **`sh int status`의 포트 목록을 기준**으로 한다.
- `sh mac add`에만 존재하고 `sh int status`에는 없는 포트는 결과에서 제외(예: `CPU`, `Drop`, `Po1`(Port-channel) 등은 본 버전에서 무시).

### 7.3 다중 MAC → 행 분할
- 한 포트에 N개의 MAC이 있으면 **N개의 행**을 만든다.
- **첫 행에만** Port~Type 6개 컬럼을 채우고, **두 번째 이후 행은 MAC 컬럼만 채우고 앞 6개 컬럼은 빈 문자열**로 둔다 (기존 운영 관행).
- 결과적으로 같은 포트의 MAC 행들은 시각적으로 그룹지어 보인다 (6.4 예시 참조).

### 7.4 MAC 없는 포트
- `sh mac add`에 매칭 MAC이 없는 포트(`notconnect`, `disabled`, 그 외 dynamic MAC 없음)는 **포함**한다.
- MAC 컬럼은 **빈 문자열**.

### 7.5 VLAN 컬럼의 출처
- 결과 테이블의 Vlan은 **`sh int status` 기준** (운영자가 의도한 access/trunk 구성).
- `sh mac add`의 Vlan은 MAC이 학습된 실제 VLAN으로, **트렁크 포트에서는 여러 VLAN이 나올 수 있으나 본 버전에서는 노출하지 않는다.**
- 향후 v0.2에서 "MAC별 Vlan" 컬럼 추가를 검토 가능.

### 7.6 시스템/특수 MAC 처리
- `Type`이 `STATIC`이면서 Ports가 `CPU` / `Drop` 인 항목은 제외한다.
- `Type`이 `STATIC`이면서 Ports가 일반 인터페이스인 항목은 **포함**한다 (예: 정적으로 등록된 단말).

### 7.7 비정상 입력 처리
- 두 입력 중 하나라도 비어 있으면 변환 버튼은 안내 메시지를 표시한다.
- 헤더 줄이 인식되지 않으면 "형식이 일치하는지 확인하세요" 메시지를 표시한다.
- 개별 줄 파싱 실패는 건너뛰고, 결과 영역에 "스킵된 줄: N건" 통계를 표시한다.

---

## 8. UI 기본 구성 (UI Outline)

```mermaid
flowchart TB
    subgraph UI[cleanMac 단일 페이지]
        H[헤더 - 도구 이름 / 간단 사용 설명]
        IN1["① sh int status 입력 영역<br/>(textarea)"]
        IN2["② sh mac add 입력 영역<br/>(textarea)"]
        BTN[["변환  /  복사  /  초기화"]]
        STAT[통계 영역 - 포트 N개, MAC M개, 행 R개]
        TBL[결과 테이블 미리보기]
        H --> IN1 --> IN2 --> BTN --> STAT --> TBL
    end
```

- 헤더 아이콘: `<i data-lucide="server"></i>` 등 Lucide 권장 (CLAUDE.md 3-2 절)
- 결과 테이블은 가로 스크롤 허용, 행은 sticky 헤더로 운영자가 스크롤하며 확인 가능

---

## 9. 기술 스택 (제안 — 별도 합의 필요)

| 영역 | 제안 |
|------|------|
| 프레임워크 | React + TypeScript + Vite |
| 스타일 | Tailwind CSS |
| 아이콘 | Lucide (`lucide-react`) |
| 백엔드 | **없음** — 클라이언트 단독 동작 |
| 배포 | 정적 산출물(`dist/`)을 사내 웹 서버에 배치하거나 `index.html`을 로컬에서 열어 사용 |
| 테스트 | Vitest (파싱 함수 단위 테스트 중심) |

> <i class="fa-solid fa-triangle-exclamation"></i> 백엔드를 두지 않는 이유는 입력 데이터(스위치 출력)가 사외로 유출되지 않도록 하기 위함이다.

---

## 10. 향후 확장 (Future Scope)

- MAC별 학습 Vlan 컬럼 추가 옵션
- Cisco NX-OS / IOS-XE 출력 포맷 지원
- `sh int description` 결과 추가 입력 → Name(설명) 컬럼 자동 채움
- 다중 장비 일괄 처리 (장비별 시트 자동 생성)

---

## 11. 용어 정의 (Glossary)

| 용어 | 설명 |
|------|------|
| Access 포트 | 단일 VLAN에 속하는 일반 단말 연결용 포트 |
| Trunk 포트 | 여러 VLAN의 프레임을 태깅하여 전달하는 포트 (주로 스위치 간 연결) |
| Dynamic MAC | 스위치가 학습한 MAC 주소 |
| Static MAC | 운영자가 수동으로 등록했거나 시스템이 생성한 MAC 주소 |
| TSV | Tab-Separated Values. Excel 붙여넣기 시 자동으로 셀이 나뉘는 텍스트 포맷 |
| notconnect | 케이블이 연결되지 않거나 링크가 형성되지 않은 상태 |
| err-disabled | 보안·루프 등의 사유로 자동 비활성화된 상태 |

---

## 12. 변경 이력 (Revision History)

| 버전 | 일자 | 작성자 | 내용 |
|------|------|--------|------|
| 0.1 | 2026-05-11 | 네트워크 인프라 관리자 | 초안 작성 |
| 0.2 | 2026-05-11 | 네트워크 인프라 관리자 | 다중 MAC 행 분할 규칙 확정 — 추가 행은 MAC 컬럼만 채우고 앞 6개 컬럼은 빈칸 |
