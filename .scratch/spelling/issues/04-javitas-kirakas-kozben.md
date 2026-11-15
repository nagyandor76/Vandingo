---
status: ready-for-agent
blocked_by: [3]
---

# 04: Javítás kirakás közben: ⌫ és a lerakott betű visszavétele

Forrás: [spec](../spec.md), „A válasz kirakása”.

**What to build:** A Participant javíthat kirakás közben. A ⌫ gomb visszaadja az utoljára lerakott betűt. A válaszsorban egy lerakott betűre koppintva az az egy betű visszakerül a gombok közé, a helye üres marad, és a következő gomb az első üres helyet tölti ki. Kiértékelt Blockban egyik művelet sem hat.

**Blocked by:** 03

**Status:** ready-for-agent

- [ ] ⌫: az utoljára lerakott betű visszakerül, a gombja újra használható
- [ ] Lerakott betűre koppintás: az a betű visszakerül, a helye üres marad
- [ ] A következő lerakás az első üres helyet tölti ki
- [ ] Kiértékelt Blockban a ⌫ és a visszavétel nem hat
- [ ] Tesztek a Practice modulon
