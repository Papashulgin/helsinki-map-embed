#!/usr/bin/env python3
"""Import a reviewed Finland GIS bundle. Requires the system GDAL Python bindings."""
import argparse
import hashlib
import json
from pathlib import Path
import re
import shutil
import xml.etree.ElementTree as ET
from osgeo import ogr, osr

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('bundle', type=Path)
parser.add_argument('--capabilities', type=Path, help='Optional cached GetCapabilities XML directory')
args = parser.parse_args()
root = Path(__file__).resolve().parent.parent
out = root / 'public-static/data/finland-map-data'
out.mkdir(parents=True, exist_ok=True)
catalog = json.loads((args.bundle / 'suomi_aineistohakemisto.json').read_text())
for name in ['suomi_perusaineistot_2026.gpkg', 'suomi_kartta-aineistot.qgz', 'suomi_wms_yhteydet.xml',
             'suomi_wfs_yhteydet.xml', 'suomi_aineistohakemisto.json', 'LUE_MINUT.md', 'tarkistukset.json']:
    shutil.copy2(args.bundle / name, out / name)
package = args.bundle.parent / 'suomi_kartta-aineistot.zip'
if package.exists():
    shutil.copy2(package, out / package.name)

def local_tag(element): return element.tag.rsplit('}', 1)[-1]
def text(element, name):
    return next(((x.text or '').strip() for x in element if local_tag(x) == name), '')

capability_crs = {}
if args.capabilities:
    for file in args.capabilities.glob('cap_*.xml'):
        tree = ET.fromstring(file.read_bytes())
        layer_info = {}
        def walk(element, inherited):
            codes = inherited | {(x.text or '').upper() for x in element if local_tag(x) in ['CRS', 'SRS']}
            if local_tag(element) == 'Layer' and text(element, 'Name'):
                layer_info[text(element, 'Name')] = sorted(codes)
            for child in element:
                if local_tag(child) in ['Capability', 'Layer']: walk(child, codes)
        walk(tree, set())
        capability_crs[file.name] = layer_info

def stable_id(prefix, value):
    return prefix + '-' + hashlib.sha256(value.encode()).hexdigest()[:20]

items = []
layer_titles = {
    'BU.Building':'Rakennusten pohjat · MML',
    'CP.CadastralParcel':'Kiinteistöpalstat · MML',
    'CP.CadastralBoundary':'Kiinteistörajat · MML',
    'GN.GeographicalNames':'Paikannimet · MML',
    'HY.PhysicalWaters.Waterbodies':'Vesialueet · MML',
    'HY.Network.WatercourseLink':'Uomaverkosto · Syke',
    'LC.LandCoverRaster.2024':'CORINE-maanpeite 2024 · 20 m',
    'maapera_200k_maalajit':'Maaperän maalajit · 1:200 000',
    'stand':'Metsävarakuviot', 'habitat':'Erityisen tärkeät elinympäristöt',
    'gridcell':'Metsävaratiedon hila', 'CHM_newest':'Latvusmalli, uusin',
    'forestusedeclaration':'Metsänkäyttöilmoitukset',
    'VHS2022_Pohjavesi':'Pohjavesialueet · VHS 2022',
    'avoindata:Ortoilmakuva':'Helsingin ortoilmakuva',
}
for service in catalog['services']:
    if service['type'] != 'WMS' or service['status'] != 'capabilities_verified': continue
    if service['provider'] in ['Espoo', 'Vantaa', 'Kauniainen', 'HSY', 'Ruokavirasto']:
        cache = 'cap_extra_' + service['provider'] + '.xml'
    else:
        from urllib.parse import urlsplit
        cache = 'cap_' + re.sub('[^a-zA-Z0-9]+', '_', service['provider'] + '_' + urlsplit(service['url']).path)[-180:] + '.xml'
    for layer in service['layers']:
        crs = capability_crs.get(cache, {}).get(layer['name'], layer.get('crs', []))
        web_crs = next((c for c in ['EPSG:3857', 'EPSG:900913'] if c in crs), '')
        restricted = '/rajoitettu/' in service['url']
        note = service.get('note', '')
        title = layer_titles.get(layer['name'], layer['title'] or layer['name'])
        legacy = service['provider'] == 'Digiroad / Fintraffic'
        featured = (layer['name'] in ['BU.Building', 'CP.CadastralParcel', 'LC.LandCoverRaster.2024',
            'VHS2022_Pohjavesi', 'maapera_200k_maalajit', 'PS.ProtectedSitesSpecialAreaOfConservation',
            'avoimet_rakennukset', 'pub_valid_ld_plan_ix_gs', 'stand', 'avoindata:Ortoilmakuva'])
        items.append(dict(id=stable_id('wms', service['url'] + '\0' + layer['name']), kind='wms',
            title=title, provider=service['provider'], description=layer.get('abstract', ''),
            sourceUrl=service['source_page'], serviceUrl=service['url'], layerName=layer['name'],
            crs=crs, webCrs=web_crs, mapAvailable=bool(web_crs) and not restricted,
            access=service['access'], note=note, legacy=legacy, restricted=restricted,
            licence='Tarkista aineistokohtaiset käyttöehdot lähdesivulta.',
            bbox=layer.get('bbox', []), featured=featured, sourceDate='',
            minScale=layer.get('min_scale', ''), maxScale=layer.get('max_scale', '')))

excluded = 0
for dataset in catalog['terralab_catalogue_hits']:
    if dataset.get('finland_status') == 'ei sovellu':
        excluded += 1
        continue
    items.append(dict(id=stable_id('dataset', dataset['id']), kind='dataset', title=dataset['name'],
        provider=dataset['provider'], description=dataset.get('use_for', ''), sourceUrl=dataset['page_url'],
        mapAvailable=False, access='TerraLab-luettelon aineisto' if dataset['hosted'] else 'Ulkoinen aineistolähde',
        note=dataset['finland_status'] + '. ' + dataset.get('finland_note', ''),
        licence=dataset['licence'], sourceDate=dataset.get('data_date', ''), featured=False,
        category=dataset['kind'], legacy=False, restricted=False))
for source in catalog['large_downloads_and_sources']:
    items.append(dict(id=stable_id('download', source['url'] + source['title']), kind='download',
        title=source['title'], provider=source['provider'], description=source['note'], sourceUrl=source['url'],
        mapAvailable=False, access='Lataus tai lähdepalvelu', note='Ei ladattu paikalliseksi aineistokopioksi.',
        licence='Aineistokohtaiset ehdot lähdepalvelussa.', sourceDate='', featured=False, legacy=False, restricted=False))

# Browser-ready copies are explicitly derived from the generalised statistical boundaries.
ogr.UseExceptions()
source = ogr.Open(str(out / 'suomi_perusaineistot_2026.gpkg'))
target_crs = osr.SpatialReference(); target_crs.ImportFromEPSG(4326)
target_crs.SetAxisMappingStrategy(osr.OAMS_TRADITIONAL_GIS_ORDER)
local_titles = dict(kunnat_2026='Kunnat 2026', maakunnat_2026='Maakunnat 2026',
    seutukunnat_2026='Seutukunnat 2026', suuralueet_2026='Suuralueet 2026',
    hyvinvointialueet_2026='Hyvinvointialueiden tilastojako 2026',
    elinvoimakeskukset_2026='Elinvoimakeskukset 2026', vaalipiirit_2026='Vaalipiirit 2026',
    paavo_postinumeroalueet_2026='Paavo: postinumeroalueet ja tilastot 2026')
for local in catalog['offline_layers']:
    name = local['layer']; local_url = ''
    if name in ['kunnat_2026', 'maakunnat_2026']:
        layer = source.GetLayerByName(name)
        source_crs = layer.GetSpatialRef().Clone()
        source_crs.SetAxisMappingStrategy(osr.OAMS_TRADITIONAL_GIS_ORDER)
        transform = osr.CoordinateTransformation(source_crs, target_crs)
        features = []
        for feature in layer:
            geometry = feature.GetGeometryRef().Clone(); geometry.Transform(transform)
            features.append(dict(type='Feature', geometry=json.loads(geometry.ExportToJson(['COORDINATE_PRECISION=6'])),
                properties={key:feature.GetField(key) for key in ['nimi','vuosi','kunta','maakunta'] if feature.GetFieldIndex(key) >= 0}))
        payload = dict(type='FeatureCollection', name=local_titles[name],
            source='Tilastokeskus 2026, CC BY 4.0', features=features)
        (out / 'layers').mkdir(exist_ok=True)
        (out / 'layers' / (name + '.geojson')).write_text(json.dumps(payload, ensure_ascii=False, separators=(',', ':')))
        local_url = '/data/finland-map-data/layers/' + name + '.geojson'
    items.append(dict(id='local-' + name, kind='local', title=local_titles[name], provider='Tilastokeskus',
        description=f"{local['expected']} kohdetta. " + ('Postinumeroalueiden vuoden 2026 julkaisu; tilastojen viitevuodet vaihtelevat. Suojatut arvot -1.' if name.startswith('paavo') else 'Yleistetty tilastollinen aluejako, mittakaava 1:1 000 000.'),
        sourceUrl='https://stat.fi/fi/palvelut/tilastodatapalvelut/paikkatietoaineistot',
        downloadUrl='/api/map-data/downloads/geopackage', geojsonUrl=local_url,
        mapAvailable=bool(local_url), access='Paikallinen aineisto', licence='Tilastokeskus 2026 · CC BY 4.0',
        note='Ei kiinteistöraja-aineisto.', sourceDate='2026', featured=bool(local_url),
        legacy=False, restricted=False))
source = None
downloads = []
for key, filename, label in [
 ('package','suomi_kartta-aineistot.zip','Koko QGIS-paketti'),('geopackage','suomi_perusaineistot_2026.gpkg','GeoPackage · 8 paikallista tasoa'),
 ('qgis','suomi_kartta-aineistot.qgz','QGIS-projekti'),('wms','suomi_wms_yhteydet.xml','QGISin WMS-yhteydet'),
 ('wfs','suomi_wfs_yhteydet.xml','QGISin WFS-yhteydet'),('notes','LUE_MINUT.md','Aineistojen käyttöohje ja lähteet'),
 ('json','suomi_aineistohakemisto.json','Alkuperäinen aineistohakemisto · JSON')]:
    if (out / filename).exists():downloads.append(dict(id=key,filename=filename,label=label,bytes=(out/filename).stat().st_size,url='/api/map-data/downloads/'+key))
manifest = dict(snapshotDate='2026-10-30', items=items, downloads=downloads,
    provenance='TerraLab-luettelohaku ja julkaisijoiden GetCapabilities-tarkistukset 30.10.2026.',
    summary={**catalog['summary'], 'nativeCatalogueItems':len(items), 'mapAvailable':sum(x['mapAvailable'] for x in items),
             'excludedNonFinnishHits':excluded},
    notice='Karttatasoviittaukset sisältävät vuosiversioita ja päällekkäisiä julkaisuja. WMS on verkosta haettava karttakuva. Paikallinen GeoPackage sisältää tilastolliset aluejaot ja Paavon; suuret koko maan aineistot haetaan erikseen lähdepalveluista.')
(out / 'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,separators=(',', ':')))
print(json.dumps({'items':len(items),'webMapAvailable':manifest['summary']['mapAvailable'],'excluded':excluded,'downloads':len(downloads)},ensure_ascii=False))
