#!/usr/bin/env python3

import json
import shutil
import os
from urllib.request import urlopen,HTTPError
from zipfile import ZipFile
from io import BytesIO

URL_CHROMIUM = 'https://www.googleapis.com/download/storage/v1/b/chromium-browser-snapshots/o/Win_x64%2F1230501%2Fchrome-win.zip?generation=1701250567654085&alt=media'

if not os.path.exists('chrome-win'):
	input('Requires ~450MB disk space. Press ENTER to continue, or close the window to quit.')
	print('Downloading Chromium...')
	with ZipFile(BytesIO(urlopen(URL_CHROMIUM).read())) as zr:
		zr.extractall('.')
	os.remove('chrome-win/interactive_ui_tests.exe')

print('Checking for updates...')
if not os.path.exists('KC3Kai'):
	os.mkdir('KC3Kai')
if not os.path.exists('KC3Kai/src'):
	os.mkdir('KC3Kai/src')
versionNow = json.load(open('KC3Kai/src/manifest.json',encoding='utf8'))['version'] if os.path.exists('KC3Kai/src/manifest.json') else None
releases = json.load(urlopen('https://api.github.com/repos/KC3Kai/KC3Kai/releases'))
releaseLatest = releases[0]
assetLatest = None
if versionNow != releaseLatest['name'] and 'assets' in releaseLatest:
	for asset in releaseLatest['assets']:
		if asset['name'] == 'kc3kai-' + releaseLatest['name'] + '.zip':
			assetLatest = asset
			break

if assetLatest:
	print('Updating to ' + str(releaseLatest['name']))
	shutil.rmtree('KC3Kai/src')
	os.mkdir('KC3Kai/src')
	with ZipFile(BytesIO(urlopen(assetLatest['browser_download_url']).read())) as zr:
		zr.extractall('KC3Kai/src')
	print('done')
