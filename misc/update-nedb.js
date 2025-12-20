/**
 * Semi-auto update WCTF data with en kcwiki json data
 * nedb source: https://github.com/TeamFleet/WhoCallsTheFleet-DB/blob/master/db/ships.nedb
 *              https://github.com/TeamFleet/WhoCallsTheFleet-DB/blob/master/db/items.nedb
 * wiki source: https://github.com/kcwiki/kancolle-data/blob/master/wiki/ship.json
 *              https://github.com/kcwiki/kancolle-data/blob/master/wiki/equipment.json
 * @require node 8+, fs, https
 * @version 20251220
 */
const wctfShipFile = '../src/data/WhoCallsTheFleet_ships.nedb'
const shipNedbFile = 'ships.nedb', gearNedbFile = 'items.nedb', nedbLinefeed = '\r\n'
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
						'bytes, elements:', objectLen(json))
				} catch(e) {
					console.error(file, 'parse error', e)
				}
			}).on('error', (e) => {
				console.error(file, 'download error', e)
			});
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

if (!fileExists(wctfShipFile)) {
	console.error('Original', shipNedbFile, 'not found at', wctfShipFile)
	return
}
const shipnedb = readFile(wctfShipFile)
	.split(/\r?\n/)
	.filter(l => !!l)
	.map(l => toJson(l))
console.info(shipNedbFile, 'records:', shipnedb.length - 3) // 3 collab ships

const missingShips = {}
Object.keys(wikiShips).forEach(s => {
	const ship = wikiShips[s]
	const dbr = shipnedb.find(r => r.id === ship._api_id && r._id !== autoGenId)
	if (!dbr) missingShips[ship._api_id] = ship
})
console.info('Missing ships',
	objectLen(missingShips).toString() + ':', toStr(Object.keys(missingShips))
)

const gearwiki2nedb = (g) => {
	// can't differeniate wiki falsy value for 'unknown' and 'unequipped'
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
		fire: s._firepower || 0,
		fire_max: s._firepower_max || 0,
		torpedo: s._torpedo || 0,
		torpedo_max: s._torpedo_max || 0,
		aa: s._aa || 0,
		aa_max: s._aa_max || 0,
		asw: s._asw || 0,
		asw_max: s._asw_max || 0,
		hp: s._hp || 0,
		hp_max: s._hp_max || 0,
		armor: s._armor || 0,
		armor_max: s._armor_max || 0,
		evasion: s._evasion || 0,
		evasion_max: s._evasion_max || 0,
		carry: s._equipment.map(e => e.size || 0).reduce((c, a) => c + a, 0),
		speed: s._speed || 0,
		range: s._range || 0,
		los: s._los || 0,
		los_max: s._los_max || 0,
		luck: s._luck || 0,
		luck_max: s._luck_max || 0
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

const missingShipsDb = []
Object.keys(missingShips).forEach(id => {
	const s = missingShips[id]
	const db = shipwiki2nedb(s)
	missingShipsDb.push(toStr(db))
})
const outputStr = missingShipsDb.join(nedbLinefeed)
writeFile(shipNedbFile, outputStr)
console.info(shipNedbFile, 'output:', outputStr.length)

