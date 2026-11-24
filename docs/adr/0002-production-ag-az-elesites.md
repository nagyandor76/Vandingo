# Élesre a `production` ág megy ki, a `main` a gyűjtőág

A feature-ök a lehető leghamarabb bekerülnek a `main`-be, hogy több fejlesztést egy körben lehessen kipróbálni. Emiatt a `main` nem lehet egyben az éles ág is. A Railway ezért a `production` ágból élesít. A kiadás egy külön lépés: a kipróbált `main` állapotát fast-forwarddal át kell vinni a `production`-re, és push.

## Considered Options

- **A `main` az éles ág, a feature-ök a saját águkon várnak, amíg kipróbáltuk őket:** így minden feature-t külön kellene kipróbálni, és sok, régóta élő ág lenne. Elvetve.
- **Release ág kiadásonként (`release/x`):** egy családi alkalmazásnál, egy fejlesztővel, verziószámok nélkül fölösleges teher. Elvetve.

## Consequences

- A `production` ágra csak fast-forward kerülhet a `main`-ről. Rá közvetlenül nem commitolunk, és nem force-pusholunk.
- A `main`-be olvasztás nem élesít. Amit a `main`-ről élesre engedünk, azt előtte helyben (`npm start`) próbáljuk ki.
