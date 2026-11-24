#!/usr/bin/env python3
"""Refresh the public ALFIX German webshop price snapshot from its own sitemap."""
from __future__ import annotations
import concurrent.futures
import datetime as dt
import gzip
import html
import json
import re
import time
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public-static/data/mms-archive/alfix/catalogs'
SITEMAP = 'https://www.alfix-systems.com/web/sitemap/shop-1/sitemap-1.xml.gz'
USER_AGENT = 'Mozilla/5.0 (compatible; H3D-MMS-catalog/1.0; +local manufacturer price catalog)'
NS = {'sm': 'http://www.sitemaps.org/schemas/sitemap/0.9'}

def download(url: str) -> bytes:
    req = urllib.request.Request(url, headers={'User-Agent': USER_AGENT, 'Accept': 'text/html,application/xhtml+xml'})
    with urllib.request.urlopen(req, timeout=25) as response:
        return response.read()

def attr_meta(source: str, key: str) -> str | None:
    pattern = re.compile(r'<meta\b(?=[^>]*(?:name|property|itemprop)=["\']' + re.escape(key) + r'["\'])[^>]*>', re.I)
    found = pattern.search(source)
    if not found:
        return None
    content = re.search(r'\bcontent=["\']([^"\']*)["\']', found.group(0), re.I)
    return html.unescape(content.group(1)) if content else None

def one_page(url: str) -> dict:
    time.sleep(0.18)  # small per-worker delay to be gentle to the public store
    raw = None
    last_error = None
    for attempt in range(3):
        try:
            raw = download(url)
            break
        except Exception as exc:
            last_error = exc
            if attempt < 2: time.sleep(2.0 * (attempt + 1))
    if raw is None: raise last_error
    source = raw.decode('utf-8', 'replace')
    title = attr_meta(source, 'og:title') or attr_meta(source, 'name') or ''
    sku = attr_meta(source, 'sku') or attr_meta(source, 'product:retailer_item_id') or ''
    if not sku:
        hit = re.search(r'sOrdernumber=([A-Za-z0-9_-]+)', source)
        if hit: sku = hit.group(1)
    price = attr_meta(source, 'price')
    if price is None:
        price = attr_meta(source, 'product:price')
    currency = attr_meta(source, 'priceCurrency') or 'EUR'
    vat = attr_meta(source, 'valueAddedTaxIncluded')
    record = {'name': title, 'articleNumber': sku, 'price': None, 'currency': currency,
              'priceType': 'net' if vat == 'false' else ('gross' if vat == 'true' else 'not stated'),
              'vatIncluded': False if vat == 'false' else (True if vat == 'true' else None),
              'sourceUrl': url}
    if price:
        try: record['price'] = round(float(price.replace(',', '.')), 2)
        except ValueError: pass
    # Text is a safe fallback for product pages where the shop omits schema markup.
    if record['price'] is None:
        body = re.sub(r'<[^>]+>', ' ', source)
        body = html.unescape(body).replace('\xa0', ' ')
        hit = re.search(r'([0-9][0-9.]*,[0-9]{2})\s*€.{0,100}?(?:zzgl\.?\s*MwSt|inkl\.?\s*MwSt)', body, re.I | re.S)
        if hit:
            record['price'] = float(hit.group(1).replace('.', '').replace(',', '.'))
            record['priceType'] = 'net' if re.search(r'zzgl\.?\s*MwSt', hit.group(0), re.I) else 'gross'
            record['vatIncluded'] = record['priceType'] == 'gross'
    record['lastCheckedAt'] = dt.datetime.now(dt.timezone.utc).isoformat(timespec='seconds')
    record['_httpBytes'] = len(raw)
    return record

def main() -> None:
    sitemap = gzip.decompress(download(SITEMAP))
    root = ET.fromstring(sitemap)
    urls = sorted({node.find('sm:loc', NS).text for node in root.findall('sm:url', NS)
                   if node.find('sm:loc', NS) is not None and node.find('sm:loc', NS).text
                   and '/de/shop/' in node.find('sm:loc', NS).text and node.find('sm:loc', NS).text.endswith('.html')})
    output_json = OUT / 'alfix-online-prices.json'
    prior = json.loads(output_json.read_text(encoding='utf-8')) if output_json.exists() else {}
    results = list(prior.get('records', []))
    cached = {item.get('sourceUrl') for item in results}
    retry_urls = {item.get('url') for item in prior.get('errors', [])}
    pending = [url for url in urls if url not in cached or url in retry_urls]
    results = [item for item in results if item.get('sourceUrl') not in retry_urls]
    errors = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
        futures = {pool.submit(one_page, url): url for url in pending}
        for future in concurrent.futures.as_completed(futures):
            url = futures[future]
            try: results.append(future.result())
            except Exception as exc: errors.append({'url': url, 'error': str(exc)})
    results.sort(key=lambda item: (item['name'].casefold(), item['articleNumber']))
    for item in results: item.pop('_httpBytes', None)
    dated = dt.datetime.now(dt.timezone.utc).isoformat(timespec='seconds')
    data = {'manufacturer': 'ALFIX GmbH', 'currency': 'EUR', 'source': SITEMAP,
            'sourceIndex': 'https://www.alfix-systems.com/de/shop/', 'checkedAt': dated,
            'scope': 'Shop sitemap product detail pages; only public listed item prices are included.',
            'coverage': {'sitemapProductPages': len(urls), 'fetchedPages': len(results),
                         'priceListedProducts': sum(item['price'] is not None for item in results),
                         'pagesWithoutPublicPrice': sum(item['price'] is None for item in results),
                         'fetchErrors': len(errors)},
            'records': [item for item in results if item['price'] is not None],
            'errors': errors}
    OUT.mkdir(parents=True, exist_ok=True)
    output_json.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    # UTF-8 CSV with stable columns and semicolon delimiter for Finnish/European office software.
    import csv
    with (OUT / 'alfix-online-prices.csv').open('w', encoding='utf-8-sig', newline='') as stream:
        writer = csv.DictWriter(stream, fieldnames=['name','articleNumber','price','currency','priceType','vatIncluded','sourceUrl','lastCheckedAt'], delimiter=';')
        writer.writeheader(); writer.writerows(data['records'])
    print(json.dumps({'coverage': data['coverage'], 'errors': errors[:5], 'sample': data['records'][:3]}, ensure_ascii=False, indent=2))
if __name__ == '__main__': main()
