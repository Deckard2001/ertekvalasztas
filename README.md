# Schwartz-értéktérkép órai használatra

**Élő oldal:** [hallgatói kérdőív](https://deckard2001.github.io/ertekvalasztas/) · [kivetítő nézet](https://deckard2001.github.io/ertekvalasztas/tanar.html)

A hallgatók QR-kódról kitöltik a 21 tételes Schwartz-értékskálát (ESS Human Values Scale). Ezután megjelennek az EU-országok értéktérképén, és egy kivetített közös nézeten az egész csoport is látszik.

## Fájlok

| Fájl | Mire való |
|---|---|
| `index.html` | Hallgatói kérdőív és saját eredmény (mobilra) |
| `tanar.html` | Kivetítő nézet: QR-kód, a csoport pontjai, csoportátlag, CSV-export |
| `assets/config.js` | **Egyetlen beállítófájl** (háttér URL, alap csoportkód, kiemelt ország) |
| `data/countries.js` | Az országok centrírozott értékátlagai, ezt generálja a script |
| `scripts/ess_aggregate.py` | ESS-fájlból előállítja a `data/countries.js`-t |
| `apps_script/Code.gs` | Opcionális háttér a csoportos módhoz (Google Táblázat) |

## Módszer röviden

1. **Pontozás.** A válaszok 1–6-os ESS-skálán érkeznek (1 = nagyon hasonlít rám), ezeket megfordítjuk: `7 − x`.
2. **Centrírozás (MRAT).** Minden válaszadó 10 értékpontszámából kivonjuk a saját 21 válaszának átlagát. Így a válaszstílus kiesik, és a relatív prioritások maradnak.
3. **Országok.** Az ESS-válaszadók ugyanígy számolt pontszámainak súlyozott országos átlagai adják az országpontokat.
4. **Tér.** Klasszikus (Torgerson-féle) MDS készül az országok 10 dimenziós profiljainak euklideszi távolságaiból. Ez itt egyenértékű az országprofilok PCA-jával.
   - A tengelyek előjelét úgy rögzítjük, hogy jobbra az önmeghaladás, felfelé a nyitottság legyen.
   - A színes vonalak az egyes értékek súlyai: azt mutatják, merre nő az adott érték.
5. **Hallgatók beillesztése.** Gower-féle out-of-sample eljárással kerülnek a térbe, ami itt pontosan a tengelyekre vetítést jelenti. Az országtérkép tehát nem mozdul el a hallgatói adatoktól.
6. **Legközelebbi országok.** Mind a 10 érték alapján, euklideszi távolsággal számoljuk, nem csak a 2D térképen.
7. **A térkép kerete.** Az egyének szórása jóval nagyobb, mint az országátlagoké. A nagyon távoli pontokat a térkép a keret szélére teszi, üres karikával. A csoportátlag viszont általában jól összevethető az országokkal.

## 1. Feltöltés GitHub Pagesre

1. Hozz létre egy új repót, és töltsd fel a mappa teljes tartalmát.
2. Lépj ide: Settings → Pages → Source: *Deploy from a branch*, majd válaszd ezt: `main` / `root`.
3. Pár perc múlva elérhető lesz az oldal:
   - hallgatói oldal: `https://<felhasznalo>.github.io/<repo>/`
   - kivetítő: `https://<felhasznalo>.github.io/<repo>/tanar.html`

Ennyivel már működik **egyéni módban**: mindenki a saját telefonján látja magát a térképen.

## 2. Csoportos mód (közös térkép), kb. 5 perc

1. Hozz létre egy üres Google Táblázatot, és nyisd meg: Bővítmények → Apps Script.
2. Másold be az `apps_script/Code.gs` tartalmát, és mentsd el.
3. Telepítés:
   - Válaszd ezt: Telepítés → Új telepítés → típus: **Webalkalmazás**.
   - Futtatás mint: *Én*. Hozzáférés: **Bárki**.
   - Engedélyezd a hozzáférést.
4. Másold ki a kapott `…/exec` URL-t, és írd be az `assets/config.js` fájlba:
   ```js
   APPS_SCRIPT_URL: 'https://script.google.com/macros/s/XXXX/exec',
   ```
5. Commitold a változást. Ettől kezdve a `tanar.html`:
   - QR-kódot mutat a csoportkóddal együtt;
   - ötmásodpercenként frissül;
   - kirajzolja az összes hallgatót és a csoportátlagot.

Hasznos tudnivalók:

- **Új csoport, új kód.** Az *Új csoport* gomb új kódot generál, így minden óra külön marad. A kód kézzel is átírható.
- **Mit tárol a háttér.** Csak a csoportkódot, egy véletlen eszközazonosítót és a 21 választ. Nevet és IP-címet nem.
- **Újrakitöltés.** Ugyanarról az eszközről a legutolsó kitöltés számít.
- **Ha módosítod a `Code.gs`-t.** Új verziót kell telepítened: Telepítések kezelése → Szerkesztés → Új verzió.

## 3. Országadatok

**A `data/countries.js` a teljes, súlyozott ESS-mintából készült** (`anweight`): az ESS 11. hulláma (2023–24), Csehország az ESS 10. hullámából (2020–22), mert a 11.-ben nem szerepel. 23 EU-ország, országonként 665–2775 válaszadó. Dánia, Luxemburg, Málta és Románia egyik hullámban sem szerepel. Az első két MDS-tengely az országok közti eltérés kb. 79%-át írja le (57% + 22%).

Újraszámoláshoz töltsd le az ESS-adatfájlt (europeansocialsurvey.org), majd futtasd:

```bash
pip install pandas pyreadstat
python scripts/ess_aggregate.py ESS11e04_2.sav --label "ESS 11. hullám (2023–24)"
```

A script működése:

- **Fájlformátumok:** `.sav`, `.dta` és `.csv` fájlt is elfogad.
- **Tételnevek:** felismeri az ESS 11 `a` végződésű tételneveit is (pl. `ipcrtiva`); összefűzött, több hullámos fájlban a két változatot soronként összefésüli.
- **Súlyozás:** alapból `anweight`-tel súlyoz.
- **Hiányzó adat:** kizárja azokat, akiknek 5-nél több tétele hiányzik.
- **Kimenet:** felülírja a `data/countries.js`-t, és a demó jelzés is eltűnik.

Más hullámmal is működik (pl. ESS 10 vagy 9). Több hullámot összefűzve több EU-ország kerülhet be. A `--all-countries` kapcsolóval a nem EU-s országok is bekerülnek.

## Kérdésszövegek

A 21 portré magyar szövege az `assets/schwartz.js` elején, az `ITEMS` tömbben található, nemsemleges megfogalmazásban. Ha a hivatalos ESS-fordítást szeretnéd használni, ott cseréld le.

## Helyi kipróbálás

```bash
python -m http.server 8000
# majd: http://localhost:8000/  és  http://localhost:8000/tanar.html
```
