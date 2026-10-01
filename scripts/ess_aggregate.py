#!/usr/bin/env python3
"""
ESS → data/countries.js

Kiszámolja az EU-tagállamok centrírozott (MRAT-korrigált) Schwartz-értékátlagait
egy ESS-adatfájlból, és felülírja a webapp országadatait.

Használat:
    pip install pandas pyreadstat
    python scripts/ess_aggregate.py ESS11.sav
    python scripts/ess_aggregate.py ESS10.dta --weight anweight
    python scripts/ess_aggregate.py ess.csv --all-countries   # nem csak EU27

Lépések (Schwartz ajánlása szerint):
  1. 1–6 skála megfordítása, hogy a nagyobb szám = fontosabb (7 - x)
  2. egyéni MRAT: a 21 tétel átlaga (legfeljebb 5 hiányzó tétel engedett)
  3. tíz értékpontszám = tételek átlaga - MRAT
  4. ország szerinti súlyozott átlag (alapból anweight, ha nincs: pspwght*pweight, ha az sincs: súlyozatlan)
"""
import argparse, json, os, sys
import warnings
import numpy as np
warnings.filterwarnings("ignore", category=RuntimeWarning)
import pandas as pd

ITEMS = ['ipcrtiv','imprich','ipeqopt','ipshabt','impsafe','impdiff','ipfrule','ipudrst','ipmodst','ipgdtim',
         'impfree','iphlppl','ipsuces','ipstrgv','ipadvnt','ipbhprp','iprspot','iplylfr','impenv','imptrad','impfun']
VALUE_ITEMS = {'SD':[1,11],'ST':[6,15],'HE':[10,21],'AC':[4,13],'PO':[2,17],
               'SE':[5,14],'CO':[7,16],'TR':[9,20],'BE':[12,18],'UN':[3,8,19]}
ORDER = ['SD','ST','HE','AC','PO','SE','CO','TR','BE','UN']
EU27 = {'AT':'Ausztria','BE':'Belgium','BG':'Bulgária','HR':'Horvátország','CY':'Ciprus','CZ':'Csehország',
        'DK':'Dánia','EE':'Észtország','FI':'Finnország','FR':'Franciaország','DE':'Németország','GR':'Görögország',
        'HU':'Magyarország','IE':'Írország','IT':'Olaszország','LV':'Lettország','LT':'Litvánia','LU':'Luxemburg',
        'MT':'Málta','NL':'Hollandia','PL':'Lengyelország','PT':'Portugália','RO':'Románia','SK':'Szlovákia',
        'SI':'Szlovénia','ES':'Spanyolország','SE':'Svédország'}


def load(path):
    ext = os.path.splitext(path)[1].lower()
    if ext == '.sav':
        import pyreadstat
        df, _ = pyreadstat.read_sav(path, apply_value_formats=False)
    elif ext == '.dta':
        df = pd.read_stata(path, convert_categoricals=False)
    else:
        df = pd.read_csv(path, low_memory=False)
    df.columns = [c.lower() for c in df.columns]
    return df


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('file')
    ap.add_argument('--weight', default=None, help='súlyváltozó (alap: anweight → pspwght*pweight → nincs)')
    ap.add_argument('--all-countries', action='store_true')
    ap.add_argument('--out', default=os.path.join(os.path.dirname(__file__), '..', 'data', 'countries.js'))
    ap.add_argument('--label', default=None, help='forrás leírása, pl. "ESS 11. hullám (2023–24)"')
    a = ap.parse_args()

    df = load(a.file)
    # ESS11-ben a tételnevek 'a' végződésűek lehetnek (pl. ipcrtiva)
    cols = {}
    for it in ITEMS:
        if it in df.columns: cols[it] = it
        elif it + 'a' in df.columns: cols[it] = it + 'a'
        else: sys.exit(f'Hiányzó tétel: {it}')
    X = df[[cols[i] for i in ITEMS]].apply(pd.to_numeric, errors="coerce").to_numpy(dtype=float, copy=True)
    X[(X < 1) | (X > 6)] = np.nan          # 7/8/9 = nem válaszolt stb.
    X = 7 - X

    ok = np.isnan(X).sum(1) <= 5
    mrat = np.nanmean(np.where(ok[:, None], X, np.nan), axis=1)
    V = np.column_stack([np.nanmean(X[:, [k - 1 for k in VALUE_ITEMS[v]]], axis=1) - mrat for v in ORDER])
    ok &= ~np.isnan(V).any(1)

    if a.weight:
        w = pd.to_numeric(df[a.weight], errors='coerce').to_numpy(float); wl = a.weight
    elif 'anweight' in df.columns:
        w = pd.to_numeric(df['anweight'], errors='coerce').to_numpy(float); wl = 'anweight'
    elif {'pspwght', 'pweight'} <= set(df.columns):
        w = (pd.to_numeric(df['pspwght'], errors='coerce') * pd.to_numeric(df['pweight'], errors='coerce')).to_numpy(float); wl = 'pspwght*pweight'
    else:
        w = np.ones(len(df)); wl = 'súlyozatlan'
    ok &= ~np.isnan(w)

    cntry = df['cntry'].astype(str).str.upper().to_numpy()
    out = []
    for c in sorted(set(cntry[ok])):
        if not a.all_countries and c not in EU27: continue
        m = ok & (cntry == c)
        if m.sum() < 100: continue
        means = np.average(V[m], axis=0, weights=w[m])
        out.append({'code': c, 'name': EU27.get(c, c), 'n': int(m.sum()), 'v': [round(float(x), 4) for x in means]})
    out.sort(key=lambda d: d['name'])
    if len(out) < 3: sys.exit('Túl kevés ország.')

    data = {
        'meta': {
            'source': a.label or f'European Social Survey ({os.path.basename(a.file)}), 21 tételes Human Values Scale',
            'method': 'Egyéni szinten centrírozott (MRAT-korrigált) értékpontszámok országos súlyozott átlaga',
            'sample': f'Teljes minta, súly: {wl}; legfeljebb 5 hiányzó tétel.',
            'demo': False,
            'missing_eu': [c for c in EU27 if c not in {d["code"] for d in out}],
        },
        'values': ORDER,
        'countries': out,
    }
    with open(a.out, 'w', encoding='utf-8') as f:
        f.write('// Generálta: scripts/ess_aggregate.py. Kézzel ne szerkeszd.\nwindow.COUNTRY_DATA = ')
        f.write(json.dumps(data, ensure_ascii=False, indent=1))
        f.write(';\n')
    print(f'{len(out)} ország kiírva → {a.out}  (súly: {wl})')
    if data['meta']['missing_eu'] and not a.all_countries:
        print('Hiányzó EU-országok ebben a hullámban:', ', '.join(data['meta']['missing_eu']))


if __name__ == '__main__':
    main()
