/**
 * Semi-auto update WCTF data with en kcwiki json data
 * nedb source: https://github.com/TeamFleet/WhoCallsTheFleet-DB/blob/master/db/ships.nedb
 *              https://github.com/TeamFleet/WhoCallsTheFleet-DB/blob/master/db/items.nedb
 * wiki source: https://github.com/kcwiki/kancolle-data/blob/master/wiki/ship.json
 *              https://github.com/kcwiki/kancolle-data/blob/master/wiki/equipment.json
 * poidb source: https://api.poi.moe/dump/ship-stat.json
 * @require node 8+, fs, https
 * @version 20251225
 */
const outputMissingNedb = false, outputDiffReport = true, updateWctfNedb = true
const wctfShipFile = '../src/data/WhoCallsTheFleet_ships.nedb'
const shipNedbFile = 'ships.nedb', gearNedbFile = 'items.nedb', nedbLinebreak = '\r\n'
const shipStatDiffFile = 'wiki-shipstats-diff.json', shipStatResolveFile = 'wiki-shipstat-solution.json'
const shipUrl = 'https://raw.githubusercontent.com/kcwiki/kancolle-data/refs/heads/master/wiki/ship.json'
const gearUrl = 'https://raw.githubusercontent.com/kcwiki/kancolle-data/refs/heads/master/wiki/equipment.json'
const masterUrl = 'https://raw.githubusercontent.com/kcwiki/kancolle-data/refs/heads/master/api/api_start2.json'
const poiStatUrl = 'https://api.poi.moe/dump/ship-stat.json'
const shipJsonFile = 'wiki-ship.json', gearJsonFile = 'wiki-equipment.json'
const masterJsonFile = 'wiki-start2.json', shipStatNedbFile = 'ship-stat.nedb'
const autoGenId = 'wikiconv'

// Dependencies and shortcut functions
const https = require('https')
const fs = require('fs')
const readFile = file => fs.readFileSync(file, 'utf8').toString()
const writeFile = (file, str) => fs.writeFileSync(file, str, 'utf8')
const fileExists = file => fs.existsSync(file)
const toJson = str => JSON.parse(str)
const toStr = json => JSON.stringify(json)
const objectLen = obj => Object.keys(obj).length
const toNedb = str => str.split(/\r?\n/)
	.filter(l => !!l && l.startsWith('{') && l.endsWith('}')).map(l => toJson(l))
const toLines = nedb => nedb.map(l => toStr(l)).join(nedbLinebreak)

console.info('Current working dir:', process.cwd())
//console.info('Current args:', toStr(process.argv))

const wikiShips = fileExists(shipJsonFile) && toJson(readFile(shipJsonFile))
const wikiGears = fileExists(gearJsonFile) && toJson(readFile(gearJsonFile))

const downloadWikiData = (dship, dequip, dmaster, dstat) => {
	const doHttpsFetch = (url, file, format = 'json') => {
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
					const json = format === 'nedb' ? toNedb(str) : toJson(str)
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
	if (dmaster) doHttpsFetch(masterUrl, masterJsonFile)
	if (dstat) doHttpsFetch(poiStatUrl, shipStatNedbFile, 'nedb')
	return false
}

const firstArg = (process.argv[2] || '').toLowerCase()
if (firstArg.startsWith('-d')) {
	const poistat = firstArg.startsWith('-ds')
	console.info(`Forced to download wiki data,${poistat ? ' and poi-db data,' : ''} run again afterthen`)
	return downloadWikiData(true, true, true, poistat)
}
if (!wikiShips || !wikiGears) {
	console.info('Wiki data not ready, run again after downloaded')
	return downloadWikiData(!wikiShips, !wikiGears)
}

console.info(shipJsonFile, 'elements:', objectLen(wikiShips))
console.info(gearJsonFile, 'elements:', objectLen(wikiGears))

const master = fileExists(masterJsonFile) && toJson(readFile(masterJsonFile))
const masterShipsById = {}
if (master) {
	master.api_mst_ship.forEach(s => {
		masterShipsById[s.api_id] = s
	})
	console.info(masterJsonFile, 'ship elements:', master.api_mst_ship.length)
}

const wikiShipsById = {}
Object.keys(wikiShips).forEach(name => {
	const s = wikiShips[name]
	wikiShipsById[s._api_id] = s
})

if (!fileExists(wctfShipFile)) {
	console.error('Original', shipNedbFile, 'not found at', wctfShipFile)
	return
}
const shipNedb = toNedb(readFile(wctfShipFile))
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
const missingShipIds = Object.keys(missingShips).map(id => Number(id))
console.info('Missing ships', missingShipIds.length.toString() + ':', toStr(missingShipIds)
)
const outputShipsNedb = []
Object.keys(missingShips).forEach(id => {
	const s = missingShips[id]
	const db = shipwiki2nedb(s)
	outputShipsNedb.push(db)
})


// Try to solve unknown lv1 values of los/asw/eva from db data, if any
const shipStatDb = fileExists(shipStatNedbFile) && toNedb(readFile(shipStatNedbFile))
if (shipStatDb) {
	const shipIdsToSolve = missingShipIds
	//const shipIdsToSolve = [988, 996, 1002]
	console.info(shipStatNedbFile, 'records:', shipStatDb.length)
	const outputSolutions = {}
	shipIdsToSolve.forEach(shipId => {
		const shipStats = shipStatDb.filter(s => s.id === shipId && s.count > 0)
		const estimateStat = (mi, ma, lv) => mi + Math.floor((ma-mi)*lv/99.0)
		const estimateStatMin = (cu, ma, lv) => lv == 1 ? cu :
			lv < 99 ? Math.ceil(cu/((99-lv)/99.0) - ma*lv/(99-lv)) :
			lv > 99 ? Math.floor(cu/((99-lv)/99.0) - ma*lv/(99-lv)) : NaN
		const est = shipStats.map(s => ({
			lv: s.lv,
			los: s.los, los_max: s.los_max,
			asw: s.asw, asw_max: s.asw_max,
			eva: s.evasion, eva_max: s.evasion_max,
			los_min: estimateStatMin(s.los, s.los_max, s.lv),
			asw_min: estimateStatMin(s.asw, s.asw_max, s.lv),
			eva_min: estimateStatMin(s.evasion, s.evasion_max, s.lv)
		})).sort((a, b) => (a.lv - b.lv))
		const maxs = { los: [], asw: [], eva: [] }
		est.forEach(e => {
			!maxs.los.includes(e.los_max) && maxs.los.push(e.los_max)
			!maxs.asw.includes(e.asw_max) && maxs.asw.push(e.asw_max)
			!maxs.eva.includes(e.eva_max) && maxs.eva.push(e.eva_max)
		})
		const ests = { los: [], asw: [], eva: [] }
		est.forEach(e => {
			!ests.los.includes(e.los_min) && ests.los.push(e.los_min)
			!ests.asw.includes(e.asw_min) && ests.asw.push(e.asw_min)
			!ests.eva.includes(e.eva_min) && ests.eva.push(e.eva_min)
		})
		const mins = {
			los: ests.los.filter(v => !est.find(e => estimateStat(v, e.los_max, e.lv) !== e.los)),
			asw: ests.asw.filter(v => !est.find(e => estimateStat(v, e.asw_max, e.lv) !== e.asw)),
			eva: ests.eva.filter(v => !est.find(e => estimateStat(v, e.eva_max, e.lv) !== e.eva))
		}
		outputSolutions[shipId] = {
			samples: est.length,
			min: mins,
			max: maxs,
			possibilities: ests
		}
		//console.info(shipId, 'samples:', est.length, 'solution:', mins, 'possible:', ests)
	})
	if (objectLen(outputSolutions)) {
		const outputStr = toStr(outputSolutions)
		writeFile(shipStatResolveFile, outputStr)
		console.info(shipStatResolveFile, 'output:', outputStr.length, 'chars')
	}
}
const shipStatSolutions = fileExists(shipStatResolveFile) && toJson(readFile(shipStatResolveFile))
const shipStatReport = {}
if (shipStatSolutions) {
	console.info(shipStatResolveFile, 'ships:', objectLen(shipStatSolutions))
	Object.keys(shipStatSolutions).forEach(id => {
		const s = shipStatSolutions[id]
		shipStatReport[id] = {
			id: Number(id),
			stat: {
				los: Math.max(...s.min.los),
				los_max: Math.max(...s.max.los),
				asw: Math.max(...s.min.asw),
				asw_max: Math.max(...s.max.asw),
				evasion: Math.max(...s.min.eva),
				evasion_max: Math.max(...s.max.eva)
			}
		}
	})
}


const shipmst2nedb = (m) => ({
	id: m.api_id,
	no: m.api_sortno,
	name: {
		ja_jp: m.api_name,
		ja_kana: m.api_yomi
	},
	stat: {
		fire: m.api_houg[0],
		fire_max: m.api_houg[1],
		torpedo: m.api_raig[0],
		torpedo_max: m.api_raig[1],
		aa: m.api_tyku[0],
		aa_max: m.api_tyku[1],
		asw: (m.api_tais || [])[0],
		hp: m.api_taik[0],
		hp_max: m.api_taik[1],
		armor: m.api_souk[0],
		armor_max: m.api_souk[1],
		speed: m.api_soku,
		range: m.api_leng,
		luck: m.api_luck[0],
		luck_max: m.api_luck[1]
	},
	slot: m.api_maxeq
})
// Check old records for missing/diff ship stats, comparing with both master and wiki data
// Check new records for diffs comparing with estimated los/asw/eva values if any
const diff = { missingStats: [], mismatchStats: {} }
shipNedb.forEach(db => {
	const statKeys = Object.keys(db.stat)
	const mstShip = masterShipsById[db.id] || false
	const addStatsDiff = (tar, name) => {
		const diffKeys = statKeys.filter(k => db.stat[k] !== tar.stat[k])
		const diffStats = {}
		diffKeys.forEach(k => { diffStats[k] = tar.stat[k] })
		diff.mismatchStats[db.id] = diff.mismatchStats[db.id] || { name: mstShip.api_name, db: db.stat }
		diff.mismatchStats[db.id][name] = diffStats
	}
	if (db._id === autoGenId) {
		const est = shipStatReport[db.id]
		if (est) {
			if (statKeys.some(k => est.stat[k] !== undefined && db.stat[k] !== est.stat[k])) {
				addStatsDiff(est, 'est')
			}
		}
	} else {
		const wiki = wikiShipsById[db.id], conv = wiki && shipwiki2nedb(wiki)
		if (conv) {
			if (statKeys.some(k => db.stat[k] === -1 || db.stat[k] === null))
				diff.missingStats.push(db)
			else if (statKeys.some(k => db.stat[k] !== conv.stat[k])) {
				addStatsDiff(conv, 'wiki')
			}
		}
		const mst = mstShip && shipmst2nedb(mstShip)
		if (mst) {
			if (statKeys.some(k => mst.stat[k] !== undefined && db.stat[k] !== mst.stat[k])) {
				addStatsDiff(mst, 'mst')
			}
		}
	}
})
if (diff.missingStats.length > 0)
	console.info('Missing stats ships',
		diff.missingStats.length, toStr(diff.missingStats.map(s => s.id)))
if (objectLen(diff.mismatchStats) > 0) {
	console.info('Mismatch stats ships',
		objectLen(diff.mismatchStats) + ':', toStr(Object.keys(diff.mismatchStats)))
	if (outputDiffReport) writeFile(shipStatDiffFile, toStr(diff.mismatchStats))
}

if (outputShipsNedb.length === 0) return

if (outputMissingNedb) {
	const outputStr = toLines(outputShipsNedb)
	writeFile(shipNedbFile, outputStr)
	console.info(shipNedbFile, 'output:', outputStr.length, 'chars')
}

// Directly updates WCTF DB in src
if (updateWctfNedb) {
	const cnt = { updated: 0, added: 0 }
	outputShipsNedb.forEach((s, i) => {
		const found = shipNedb.findIndex(r => r.id === s.id && s._id === autoGenId)
		if (found > -1) {
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
	writeFile(wctfShipFile, toLines(shipNedb))
	console.info(wctfShipFile, 'lines', cnt.updated, 'updated,', cnt.added, 'added')
}
