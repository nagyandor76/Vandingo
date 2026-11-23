---
status: done
blocked_by: []
---

# 01: A szerkesztőben „Többválasztásos” a típus neve

Forrás: [spec](../spec.md), „Szerkesztő”, „Backend-ellenőrzés”, „Quiz-összesítők”.

**What to build:** A `multiple-choice` típus a szerkesztőben eddig „Feleletválasztós” néven szerepelt; a spec szerint a neve „Többválasztásos”. A mentés, a szerveroldali ellenőrzés (`src/Vandingo.Api/Quizzes/QuizRules.cs`, `ChoicesAndAnswers`) és a Quiz-összesítők már kezelik a típust, és API-tesztjeik is vannak (`tests/Vandingo.Api.Tests/QuizApiTests.cs`) — ezeket csak ellenőrizni kell a spec szabályai ellen (legalább 2 nem üres opció, legalább egy helyes válasz, minden `answer`-elem az `options`-ben; mindegyik elutasítás a saját mezőjén). A beillesztés (`web/src/editor/clipboard.ts`) a régi „Feleletválasztós” feliratot is fogadja, hogy a korábban kimásolt táblázatok továbbra is beilleszthetők legyenek.

**Blocked by:** None (can start immediately)

**Status:** done

- [x] A típusválasztóban és a kimásolt táblázatban „Többválasztásos”
- [x] A beillesztés a „Többválasztásos” és a régi „Feleletválasztós” feliratot is `multiple-choice`-ként olvassa
- [x] A meglévő API-tesztek lefedik: érvényes Quiz mentődik; üres `answer`, `options`-ben nem szereplő `answer`, 2-nél kevesebb `options` elutasítva a saját mezőjén; az összesítők számolják a `multiple-choice`-t (ami hiányzik, pótolva)
- [x] Szerkesztő-tesztek (`web/src/editor/clipboard.test.ts`) az új felirattal

## Comments

**2026-11-23:** Kész (b081f6b). A típusnév „Többválasztásos”, a beillesztés a régi „Feleletválasztós” feliratot is elfogadja. A szerveroldali ellenőrzés és az API-tesztek már megvoltak; pótolva a csak szóközös opció elutasítása.
