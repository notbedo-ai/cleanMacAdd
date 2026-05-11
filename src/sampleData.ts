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
