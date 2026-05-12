export const SAMPLE_INT_STATUS = `Switch#show interfaces status

Port      Name               Status       Vlan       Duplex  Speed Type
Gi1/0/1   Server-Web-01      connected    10         a-full  a-1000 10/100/1000BaseTX
Gi1/0/2                      notconnect   1          auto    auto   10/100/1000BaseTX
Gi1/0/3   Uplink-Core        connected    trunk      a-full  a-1000 10/100/1000BaseTX
Gi1/0/4                      disabled     1          auto    auto   10/100/1000BaseTX
Gi1/0/5   IP-Phone+PC        connected    20         a-full  a-1000 10/100/1000BaseTX
Gi1/0/6                      notconnect   1          auto    auto   10/100/1000BaseTX`;

export const SAMPLE_MAC_TABLE = `Switch#show mac address-table
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
Total Mac Addresses for this criterion: 6`;

// F-08: MAC↔IP mapping sample — intentionally uses all five accepted MAC
// representations to exercise normalizeMac. Pairs with SAMPLE_MAC_TABLE.
export const SAMPLE_MAC_IP = `aabb.cc00.0100\t10.10.10.11
aabb.cc00.0200\t10.10.20.21
AA-BB-CC-00-02-01\t10.10.20.22
AABB:CC00:0202\t10.10.20.23
aabb cc00 0300\t10.10.30.31
aabb.cc00.0301\t10.10.30.32`;

// U-01 / B-01 부록 §12 회귀 케이스: 실제 운영에서 수집된 통합 붙여넣기 입력.
// 호스트명에 `/`, `[`, `]`, `_` 가 포함되고 명령어가 축약형(`sh int status`,
// `sh mac ad dyna`) + 출력 필터 파이프(`| ex ...`)와 함께 입력된다. Speed
// 컬럼은 `a-100`, `a-1000`, `auto` 3종을 모두 포함하여 B-01 회귀를 검증한다.
export const SAMPLE_COMBINED_C2960 = `HU_FA_Seat3_B/5_C2960[24]_1#sh int status

Port      Name               Status       Vlan       Duplex  Speed Type
Fa0/1                        connected    63         a-full  a-100 10/100BaseTX
Fa0/2                        connected    63         a-full  a-100 10/100BaseTX
Fa0/3                        connected    63         a-full  a-100 10/100BaseTX
Fa0/4                        connected    63         a-full  a-100 10/100BaseTX
Fa0/5                        connected    63         a-full  a-100 10/100BaseTX
Fa0/6                        connected    63         a-full  a-100 10/100BaseTX
Fa0/7                        connected    63         a-full  a-100 10/100BaseTX
Fa0/8                        notconnect   63           auto   auto 10/100BaseTX
Fa0/9                        connected    63         a-full  a-100 10/100BaseTX
Fa0/10                       connected    63         a-full  a-100 10/100BaseTX
Fa0/11                       notconnect   63           auto   auto 10/100BaseTX
Fa0/12                       connected    63         a-full  a-100 10/100BaseTX
Fa0/13                       connected    63         a-full  a-100 10/100BaseTX
Fa0/14                       connected    63         a-full  a-100 10/100BaseTX
Fa0/15                       connected    63         a-full  a-100 10/100BaseTX
Fa0/16                       connected    63         a-full  a-100 10/100BaseTX
Fa0/17                       connected    63         a-full  a-100 10/100BaseTX
Fa0/18                       connected    63         a-full  a-100 10/100BaseTX
Fa0/19                       connected    63         a-full  a-100 10/100BaseTX
Fa0/20                       connected    63         a-full  a-100 10/100BaseTX
Fa0/21                       connected    63         a-full  a-100 10/100BaseTX
Fa0/22                       notconnect   63           auto   auto 10/100BaseTX
Fa0/23                       connected    63         a-full  a-100 10/100BaseTX
Fa0/24                       notconnect   63           auto   auto 10/100BaseTX
Gi0/1                        connected    63         a-full a-1000 1000BaseLX SFP
Gi0/2                        connected    63         a-full a-1000 1000BaseLX SFP
HU_FA_Seat3_B/5_C2960[24]_1#sh mac ad dyna | ex 1/1/1|1/1/3|Gi0/1|1/0/49
          Mac Address Table
-------------------------------------------

Vlan    Mac Address       Type        Ports
----    -----------       --------    -----
  63    000b.abd6.16c0    DYNAMIC     Fa0/20
  63    0018.7dc5.044c    DYNAMIC     Fa0/15
  63    0026.9242.8b37    DYNAMIC     Fa0/3
  63    38e0.8e97.a64e    DYNAMIC     Fa0/1
  63    c400.ad5d.3519    DYNAMIC     Fa0/16
  63    c400.ad5d.3546    DYNAMIC     Fa0/13
  63    c400.ad5d.35d5    DYNAMIC     Fa0/17
  63    c400.ad5d.3642    DYNAMIC     Fa0/18
  63    c400.ad5d.3682    DYNAMIC     Fa0/12
  63    c400.ad5d.3684    DYNAMIC     Fa0/2
  63    c400.ad5d.368b    DYNAMIC     Fa0/9
  63    c400.ad5d.36cc    DYNAMIC     Fa0/10
  63    c400.ad5d.37ea    DYNAMIC     Fa0/7
  63    c400.ad5d.37f7    DYNAMIC     Fa0/4
  63    c400.ad5d.3856    DYNAMIC     Fa0/6
  63    c400.ad5d.3871    DYNAMIC     Fa0/23
  63    c400.ad5d.38d3    DYNAMIC     Fa0/19
  63    c400.ad5d.38e8    DYNAMIC     Fa0/14
  63    cc82.7f64.a10e    DYNAMIC     Fa0/5
  63    cc82.7fac.b955    DYNAMIC     Fa0/21
Total Mac Addresses for this criterion: 192
HU_FA_Seat3_B/5_C2960[24]_1#`;
