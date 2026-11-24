#!/usr/bin/env python3
"""Fetch public ALFIX brochures and assembly/use manuals into the local MMS archive."""
from __future__ import annotations
import concurrent.futures, hashlib, json, re, urllib.request
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
BASE=ROOT/'public-static/data/mms-archive/alfix/catalogs'
DOCS=[
('ALFIX-FASSADE.pdf','brochure','https://www.alfix-systems.com/wp/wp-content/uploads/2019/06/ALFIX-FASSADE.pdf','https://www.alfix-systems.com/de/downloads/prospekte/'),
('UNIFIX-FASSADE.pdf','brochure','https://www.alfix-systems.com/wp/wp-content/uploads/2019/06/UNIFIX-FASSADE.pdf','https://www.alfix-systems.com/de/downloads/prospekte/'),
('ALFIX-MODUL-MULTI.pdf','brochure','https://www.alfix-systems.com/wp/wp-content/uploads/2021/01/ALFIX-MODUL-MULTI.pdf','https://www.alfix-systems.com/de/downloads/prospekte/'),
('ALFIX-MODUL-METRIC.pdf','brochure','https://www.alfix-systems.com/wp/wp-content/uploads/2021/01/ALFIX-MODUL-METRIC.pdf','https://www.alfix-systems.com/de/downloads/prospekte/'),
('ALFIX-WETTERSCHUTZDACH-VARIO.pdf','brochure','https://www.alfix-systems.com/wp/wp-content/uploads/2019/06/ALFIX-WETTERSCHUTZDACH-VARIO.pdf','https://www.alfix-systems.com/de/downloads/prospekte/'),
('DE_ALFIX-FAHRGERUESTE_2022.pdf','brochure','https://www.alfix-systems.com/wp/wp-content/uploads/2022/01/DE_ALFIX-FAHRGERUESTE_2022.pdf','https://www.alfix-systems.com/de/downloads/prospekte/'),
('ALFIX-GERUESTZUBEHOER.pdf','brochure','https://www.alfix-systems.com/wp/wp-content/uploads/2019/06/ALFIX-GERUESTZUBEHOER.pdf','https://www.alfix-systems.com/de/downloads/prospekte/'),
('DE_ALFIX-TREPPENTUERME.pdf','brochure','https://www.alfix-systems.com/wp/wp-content/uploads/2022/01/DE_ALFIX-TREPPENTUERME.pdf','https://www.alfix-systems.com/de/downloads/prospekte/'),
('DE_DG-FIX.pdf','brochure','https://www.alfix-systems.com/wp/wp-content/uploads/2021/02/DE_DG-FIX.pdf','https://www.alfix-systems.com/de/downloads/prospekte/'),
('DE_ALFIX_Kennzeichnung-Freigabe_Pruefprotokoll.pdf','inspection-form','https://www.alfix-systems.com/wp/wp-content/uploads/2021/05/DE_ALFIX_Kennzeichnung-Freigabe_Pruefprotokoll.pdf','https://www.alfix-systems.com/de/downloads/prospekte/'),
('AuV-ALFIX-FASSADE.pdf','assembly-and-use-manual','https://www.alfix-systems.com/wp/wp-content/uploads/2023/06/AuV-ALFIX-FASSADE.pdf','https://www.alfix-systems.com/de/downloads/anleitungen/'),
('AuV-ALFIX-ABSTURZSCHUTZ.pdf','assembly-and-use-manual','https://www.alfix-systems.com/wp/wp-content/uploads/2023/06/AuV-ALFIX-ABSTURZSCHUTZ.pdf','https://www.alfix-systems.com/de/downloads/anleitungen/'),
('AuV-UNIFIX-70.pdf','assembly-and-use-manual','https://www.alfix-systems.com/wp/wp-content/uploads/2017/10/AuV-UNIFIX-70.pdf','https://www.alfix-systems.com/de/downloads/anleitungen/'),
('AuV-UNIFIX-TRBS-GELAENDER.pdf','assembly-and-use-manual','https://www.alfix-systems.com/wp/wp-content/uploads/2021/01/AuV-UNIFIX-TRBS-GELAENDER.pdf','https://www.alfix-systems.com/de/downloads/anleitungen/'),
('AuV-ALFIX-MODUL-MULTI.pdf','assembly-and-use-manual','https://www.alfix-systems.com/wp/wp-content/uploads/2021/08/AuV-ALFIX-MODUL-MULTI.pdf','https://www.alfix-systems.com/de/downloads/anleitungen/'),
('AuV-ALBLITZ-MODUL.pdf','assembly-and-use-manual','https://www.alfix-systems.com/wp/wp-content/uploads/2024/04/AuV-ALBLITZ-MODUL.pdf','https://www.alfix-systems.com/de/downloads/anleitungen/'),
('AuV-ALFIX-WETTERSCHUTZDACH-VARIO.pdf','assembly-and-use-manual','https://www.alfix-systems.com/wp/wp-content/uploads/2017/10/AuV-ALFIX-WETTERSCHUTZDACH-VARIO.pdf','https://www.alfix-systems.com/de/downloads/anleitungen/'),
('AuV-ALFIX-FAHRGERUEST-ALUFIX-5000.pdf','assembly-and-use-manual','https://www.alfix-systems.com/wp/wp-content/uploads/2017/10/AuV-ALFIX-FAHRGERUEST-ALUFIX-5000.pdf','https://www.alfix-systems.com/de/downloads/anleitungen/'),
('AuV-ALFIX-FAHRGERUEST-ALUFIX-5100.pdf','assembly-and-use-manual','https://www.alfix-systems.com/wp/wp-content/uploads/2022/03/AuV-ALFIX-FAHRGERUEST-ALUFIX-5100.pdf','https://www.alfix-systems.com/de/downloads/anleitungen/'),
('AuV-ALFIX-FAHRGERUEST-ALUFIX-5280.pdf','assembly-and-use-manual','https://www.alfix-systems.com/wp/wp-content/uploads/2022/04/AuV-ALFIX-FAHRGERUEST-ALUFIX-5280.pdf','https://www.alfix-systems.com/de/downloads/anleitungen/'),
('AuV-ALFIX-FAHRGERUEST-ALUFIX-6000.pdf','assembly-and-use-manual','https://www.alfix-systems.com/wp/wp-content/uploads/2018/02/AuV-ALFIX-FAHRGERUEST-ALUFIX-6000.pdf','https://www.alfix-systems.com/de/downloads/anleitungen/'),
('AuV-ALFIX-FAHRGERUEST-ALUFIX-6100-6200.pdf','assembly-and-use-manual','https://www.alfix-systems.com/wp/wp-content/uploads/2022/04/AuV-ALFIX-FAHRGERUEST-ALUFIX-6100-6200.pdf','https://www.alfix-systems.com/de/downloads/anleitungen/'),
('AuV-FREISTEHENDES-ALFIX-GERUEST.pdf','assembly-and-use-manual','https://www.alfix-systems.com/wp/wp-content/uploads/2024/03/AuV-FREISTEHENDES-ALFIX-GERUEST.pdf','https://www.alfix-systems.com/de/downloads/anleitungen/'),
('AuV-FREISTEHENDES-UNIFIX-GERUEST.pdf','assembly-and-use-manual','https://www.alfix-systems.com/wp/wp-content/uploads/2024/03/AuV-FREISTEHENDES-UNIFIX-GERUEST.pdf','https://www.alfix-systems.com/de/downloads/anleitungen/'),
('AuV-ALFIX-DS-KONSOLRAHMEN.pdf','assembly-and-use-manual','https://www.alfix-systems.com/wp/wp-content/uploads/2019/03/AuV-ALFIX-DS-KONSOLRAHMEN.pdf','https://www.alfix-systems.com/de/downloads/anleitungen/'),
('AuV-UNIFIX-DS-KONSOLRAHMEN.pdf','assembly-and-use-manual','https://www.alfix-systems.com/wp/wp-content/uploads/2019/03/AuV-UNIFIX-DS-KONSOLRAHMEN.pdf','https://www.alfix-systems.com/de/downloads/anleitungen/'),
('AuV-KAMINGERUEST.pdf','assembly-and-use-manual','https://www.alfix-systems.com/wp/wp-content/uploads/2021/01/AuV-KAMINGERUEST.pdf','https://www.alfix-systems.com/de/downloads/anleitungen/'),
('AuV-FLACHDACHSEITENSCHUTZ-MOBIL.pdf','assembly-and-use-manual','https://www.alfix-systems.com/wp/wp-content/uploads/2017/10/AuV-FLACHDACHSEITENSCHUTZ-MOBIL.pdf','https://www.alfix-systems.com/de/downloads/anleitungen/'),
('AuV-ALFIX-FLACHDACHABSTURZSICHERUNG.pdf','assembly-and-use-manual','https://www.alfix-systems.com/wp/wp-content/uploads/2017/10/AuV-ALFIX-FLACHDACHABSTURZSICHERUNG.pdf','https://www.alfix-systems.com/de/downloads/anleitungen/'),
('AuV-ALFIX-WDVS.pdf','assembly-and-use-manual','https://www.alfix-systems.com/wp/wp-content/uploads/2017/10/AuV-ALFIX-WDVS.pdf','https://www.alfix-systems.com/de/downloads/anleitungen/'),
]
UA='Mozilla/5.0 (compatible; H3D-MMS-document-archive/1.0)'
def fetch(doc):
    name, kind, url, page=doc
    path=BASE/name
    if path.exists() and path.stat().st_size > 1000 and path.read_bytes().startswith(b'%PDF-'):
        data=path.read_bytes()
        return {'file':name,'documentType':kind,'sourceUrl':url,'sourcePageUrl':page,'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()}
    req=urllib.request.Request(url,headers={'User-Agent':UA})
    with urllib.request.urlopen(req,timeout=180) as r: data=r.read(); content=r.headers.get('Content-Type','')
    if not data.startswith(b'%PDF-'): raise ValueError(f'Not a PDF: {content}')
    path=BASE/name; path.write_bytes(data)
    return {'file':name,'documentType':kind,'sourceUrl':url,'sourcePageUrl':page,'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()}
def main():
    BASE.mkdir(parents=True,exist_ok=True)
    results=[]; errors=[]
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
        future_map={pool.submit(fetch,doc):doc for doc in DOCS}
        for f in concurrent.futures.as_completed(future_map):
            doc=future_map[f]
            try: results.append(f.result())
            except Exception as exc: errors.append({'file':doc[0],'url':doc[2],'error':str(exc)})
    results.sort(key=lambda x:x['file'].casefold())
    manifest={'archiveTitle':'ALFIX official German manuals and catalogues','createdAt':'2026-10-28','manufacturer':'ALFIX GmbH','sourcePages':sorted({x[3] for x in DOCS}),'documents':results,'errors':errors,'note':'Copies are retained for local MMS reference. Source dates vary; verify the latest manufacturer revision before use. They do not constitute project-specific design approval.'}
    (BASE/'documents-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({'downloaded':len(results),'errors':errors,'totalBytes':sum(x['bytes'] for x in results)},ensure_ascii=False))
if __name__=='__main__':main()
