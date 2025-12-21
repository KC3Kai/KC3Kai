/**
 * Semi-auto update WCTF data with en kcwiki json data
 * nedb source: https://github.com/TeamFleet/WhoCallsTheFleet-DB/blob/master/db/ships.nedb
 *              https://github.com/TeamFleet/WhoCallsTheFleet-DB/blob/master/db/items.nedb
 * wiki source: https://github.com/kcwiki/kancolle-data/blob/master/wiki/ship.json
 *              https://github.com/kcwiki/kancolle-data/blob/master/wiki/equipment.json
 * @require node 8+, fs, https
 * @version 20251221
 */
const wctfShipFile = '../src/data/WhoCallsTheFleet_ships.nedb'
const shipNedbFile = 'ships.nedb', gearNedbFile = 'items.nedb', nedbLinebreak = '\r\n'
const shipUrl = 'https://raw.githubusercontent.com/kcwiki/kancolle-data/refs/heads/master/wiki/ship.json'
const gearUrl = 'https://raw.githubusercontent.com/kcwiki/kancolle-data/refs/heads/master/wiki/equipment.json'
const shipJsonFile = 'ship.json', gearJsonFile = 'equipment.json'
const autoGenId = 'wikiconv'
var wikiShips, wikiGears;

// Dependencies and shortcut functions
const https = require('https')
const fs = require('fs')
const readFile = file => fs.readFileSync(file, 'utf8').toString()
const writeFile = (file, str) => fs.writeFileSync(file, str, 'utf8')
const fileExists = file => fs.existsSync(file)
const toJson = str => JSON.parse(str)
const toStr = json => JSON.stringify(json)
const objectLen = obj => Object.keys(obj).length

console.info('Current working dir:', process.cwd())
//console.info('Current args:', toStr(process.argv))

wikiShips = fileExists(shipJsonFile) && toJson(readFile(shipJsonFile))
wikiGears = fileExists(gearJsonFile) && toJson(readFile(gearJsonFile))

const downloadWikiData = (dship, dequip) => {
	const doHttpsFetch = (url, file) => {
		console.info('Downloading', file, '...')
		https.get(url, (resp) => {
			console.info(file, 'status code:', resp.statusCode)
			if (resp.statusCode < 200 || resp.statusCode >= 400) return
			resp.setEncoding('utf8')
			const body = [];
			resp.on('data', (chunk) => { body.push(chunk) })
			resp.on('end', () => {
				try {
					const str = body.join('')
					const json = toJson(str)
					writeFile(file, str)
					body.length = 0
					console.info(file, 'downloaded:', str.length,
						'chars, elements:', objectLen(json))
				} catch(e) {
					console.error(file, 'parse', e)
				}
			})
		}).on('error', (e) => {
			console.error(file, 'download', e)
		})
	}
	if (dship) doHttpsFetch(shipUrl, shipJsonFile)
	if (dequip) doHttpsFetch(gearUrl, gearJsonFile)
	return false
}

if ((process.argv[2] || '').toLowerCase() === '-d') {
	console.info('Forced to download wiki data, run again afterthen')
	return downloadWikiData(true, true)
}
if (!wikiShips || !wikiGears) {
	console.info('Wiki data not ready, run again after downloaded')
	return downloadWikiData(!wikiShips, !wikiGears)
}

console.info(shipJsonFile, 'elements:', objectLen(wikiShips))
console.info(gearJsonFile, 'elements:', objectLen(wikiGears))

const wikiShipsById = {}
Object.keys(wikiShips).forEach(name => {
	const s = wikiShips[name]
	wikiShipsById[s._api_id] = s
})

if (!fileExists(wctfShipFile)) {
	console.error('Original', shipNedbFile, 'not found at', wctfShipFile)
	return
}
const shipNedb = readFile(wctfShipFile)
	.split(/\r?\n/)
	.filter(l => !!l)
	.map(l => toJson(l))
console.info(shipNedbFile, 'records:', shipNedb.length - 3) // 3 collab ships

const gearwiki2nedb = (g) => {
	// can't differentiate wiki falsy value for 'unknown' and 'unequipped'
	// and WCTF uses either `null` or `""` for unequipped...
	// so here we use "" for unequipped, null for exceptions
	if (g.equipment === false) return ''
	if (!g.equipment) return null
	const e = wikiGears[g.equipment]
	if (!e) return null
	if (g.stars > 0) return { id: e._id, star: g.stars }
	return e._id
}
const lookupshipremodels = (s) => {
	const remodels = {}
	const normalizeName = remodel => remodel.replace(/\//g, ' ').trim()
	if (s._remodel_from) {
		const prevName = normalizeName(s._remodel_from)
		const prevShip = wikiShips[prevName]
		if (prevShip) remodels.prev = prevShip._api_id
	}
	if (s._remodel_to) {
		const nextName = normalizeName(s._remodel_to)
		const nextShip = wikiShips[nextName]
		if (nextShip) {
			remodels.next = nextShip._api_id
			remodels.next_lvl = s._remodel_to_level || nextShip._remodel_level
		}
		if (remodels.next === remodels.prev) {
			remodels.prev_loop = true
			remodels.next_loop = true
		}
	}
	return remodels
}
const wikiv2db = (v) => (
	// wiki null = unknown, -1 in db; wiki false = n/a, falsy 0
	v === null ? -1 : v || 0
)
const shipwiki2nedb = (s) => ({
	id: s._api_id,
	no: s._true_id || s._id,
	name: {
		ja_jp: s._japanese_name,
		ja_kana: s._reading,
		ja_romaji: s._full_name,
		zh_cn: s._japanese_name
	},
	stat: {
		fire: wikiv2db(s._firepower),
		fire_max: wikiv2db(s._firepower_max),
		torpedo: wikiv2db(s._torpedo),
		torpedo_max: wikiv2db(s._torpedo_max),
		aa: wikiv2db(s._aa),
		aa_max: wikiv2db(s._aa_max),
		asw: wikiv2db(s._asw),
		asw_max: wikiv2db(s._asw_max),
		hp: wikiv2db(s._hp),
		hp_max: wikiv2db(s._hp_max),
		armor: wikiv2db(s._armor),
		armor_max: wikiv2db(s._armor_max),
		evasion: wikiv2db(s._evasion),
		evasion_max: wikiv2db(s._evasion_max),
		carry: s._equipment.map(e => e.size || 0).reduce((c, a) => c + a, 0),
		speed: wikiv2db(s._speed),
		range: wikiv2db(s._range),
		los: wikiv2db(s._los),
		los_max: wikiv2db(s._los_max),
		luck: wikiv2db(s._luck),
		luck_max: wikiv2db(s._luck_max)
	},
	consum: {
		fuel: s._fuel,
		ammo: s._ammo
	},
	slot: s._equipment.map(e => e.size),
	equip: s._equipment.map(e => gearwiki2nedb(e)), // name and stars to id numbers
	rels: {},
	type: s._type,
	'class': s._class, // mismatch, wctf uses id numbers of its own
	class_no: s._class_number,
	series: null,
	base_lvl: null,
	links: [],
	time_created: Date.now(),
	_id: autoGenId,
	buildtime: s._build_time,
	rare: s._rarity,
	remodel_cost: [],
	scrap: [s._scrap_fuel || 0, s._scrap_ammo || 0, s._scrap_steel || 0, s._scrap_baux || 0],
	modernization: [s._firepower_mod || 0, s._torpedo_mod || 0, s._aa_mod || 0, s._armor_mod || 0],
	time_modified: Date.now(),
	additional_item_types: null,
	remodel: lookupshipremodels(s), // `prev` used, but `_remodel_from` is name-based
	illust_extra: null,
	illust_version: null
})

const missingShips = {}
Object.keys(wikiShips).forEach(s => {
	const ship = wikiShips[s]
	const dbr = shipNedb.find(r => r.id === ship._api_id && r._id !== autoGenId)
	if (!dbr) missingShips[ship._api_id] = ship
})
console.info('Missing ships',
	objectLen(missingShips).toString() + ':', toStr(Object.keys(missingShips))
)

const outputShipsLines = []
Object.keys(missingShips).forEach(id => {
	const s = missingShips[id]
	const db = shipwiki2nedb(s)
	outputShipsLines.push(toStr(db))
})

// Check old records for missing/diff ship stats
const diff = { missingStats: [], mismatchStats: {} }
shipNedb.forEach(db => {
	if (db._id === autoGenId) return
	const wiki = wikiShipsById[db.id], conv = wiki && shipwiki2nedb(wiki)
	if (!wiki || !conv) return
	if (Object.keys(db.stat).some(k => db.stat[k] === -1 || db.stat[k] === null))
		diff.missingStats.push(db)
	else if (Object.keys(db.stat).some(k => db.stat[k] !== conv.stat[k])) {
		const diffKeys = Object.keys(db.stat).filter(k => db.stat[k] !== conv.stat[k])
		const diffStats = {}
		diffKeys.forEach(k => { diffStats[k] = conv.stat[k] })
		diff.mismatchStats[db.id] = { db: db.stat, wiki: diffStats }
	}
})
if (diff.missingStats.length > 0)
	console.info('Missing stats ships', diff.missingStats.length, toStr(diff.missingStats.map(s => s.id)))
if (objectLen(diff.mismatchStats) > 0) {
	console.info('Mismatch stats ships', objectLen(diff.mismatchStats) + ':', toStr(Object.keys(diff.mismatchStats)))
	//writeFile('diff.json', toStr(diff.mismatchStats))
}

if (outputShipsLines.length === 0) return

const outputStr = outputShipsLines.join(nedbLinebreak)
writeFile(shipNedbFile, outputStr)
console.info(shipNedbFile, 'output:', outputStr.length, 'chars')

// Directly updates WCTF DB in src
const cnt = { updated: 0, added: 0 }
outputShipsLines.forEach((str, i) => {
	const s = toJson(str)
	const found = shipNedb.findIndex(r => r.id === s.id && s._id === autoGenId)
	if (found) {
		// don't change timestamp for better git diff?
		s.time_created = shipNedb[found].time_created
		s.time_modified = shipNedb[found].time_modified
		shipNedb[found] = s
		cnt.updated += 1
	} else {
		shipNedb.push(s)
		cnt.added += 1
	}
})
writeFile(wctfShipFile, shipNedb.map(r => toStr(r)).join(nedbLinebreak))
console.info(wctfShipFile, 'lines', cnt.updated, 'updated,', cnt.added, 'added')
