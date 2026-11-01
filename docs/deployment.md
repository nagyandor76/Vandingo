# Telepítés Railway-re

Az alkalmazás egyetlen Railway-szolgáltatásként fut, amit a Railway a repó gyökerében lévő `Dockerfile`-ból épít meg. A Dockerfile lefordítja a React felületet, publikálja az ASP.NET Core alkalmazást, és a `/data` könyvtárat használja adatkönyvtárként. Élesben a `/data` egy Railway Volume, ezért a Quizek, a Subject-beállítások és a Resultok újraindítás és újratelepítés után is megmaradnak (ADR 0001).

Első induláskor, amíg a `/data/Quizzes` üres, a repó `Quizzes/` mappája oda másolódik. Ez később soha nem írja felül a szerkesztett Quizeket.

## Első telepítés

1. A változtatások legyenek fent a GitHubon (`nagyandor76/Vandingo`, `main` ág).
2. [railway.com](https://railway.com) → **New Project** → **Deploy from GitHub repo** → válaszd a `Vandingo` repót. A Railway megtalálja a `Dockerfile`-t, és abból épít.
3. A szolgáltatáson: jobb klikk (vagy `⌘K`) → **Add Volume** → mount path: `/data`.
4. A szolgáltatás **Settings → Networking → Generate Domain**: ez adja a nyilvános URL-t (`…up.railway.app`).
5. Várd meg, amíg a deploy zöld lesz, és nyisd meg az URL-t telefonról.

Környezeti változót nem kell beállítani:
- A port a Railway által adott `PORT`-ból jön.
- Az adatkönyvtár a Dockerfile-ban `/data`-ra van állítva.
- Az alkalmazás rootként fut, mert a Railway a Volume-ot root tulajdonban csatolja. Ezért a `RAILWAY_RUN_UID=0` beállítása sem kell.

## Ellenőrzés

1. Végezz el egy gyakorlást, hogy keletkezzen Result.
2. A szolgáltatás **Deployments** fülén: az utolsó deploy → **Redeploy**.
3. A Result és a (szerkesztett) Quizek maradjanak meg.

## Frissítés

Minden push a `main` ágra automatikusan új deployt indít. Az adatok a Volume-on vannak, ezt a deploy nem érinti.

## Árak és korlátok

Ellenőrizve: 2026-11-01. Forrás: [railway.com/pricing](https://railway.com/pricing), [docs.railway.com/pricing/plans](https://docs.railway.com/pricing/plans), [docs.railway.com/volumes/reference](https://docs.railway.com/volumes/reference).

- **Trial:** egyszeri 5 USD kredit 30 napra, bankkártya nélkül. Volume legfeljebb 0,5 GB.
- **Hobby:** 5 USD/hó. Ebben benne van 5 USD erőforrás-használat (CPU, memória, kimenő forgalom), a felette lévő használatot külön számlázzák. A fel nem használt keret nem gyűlik. Volume alapból 5 GB, átméretezhető. Projektenként legfeljebb 10 Volume.
- **Volume-tárhely:** 0,15 USD/GB/hó.

A Vandingo adatai JSON-fájlok, így néhány MB-nál nem lesznek nagyobbak. Egy kis forgalmú ASP.NET Core alkalmazásnak várhatóan elég a Hobby csomagban foglalt keret.
