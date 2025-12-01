// Paste result table of following TsunDB query with updated the event id:
/*
select distinct fleet#>>'{voice,0}' as voiceids, fleet#>>'{voice,1}' as voiceorders, fleet->>'ship' as ships from friendlyfleet where map like '61-%'
*/
const rawtbl = `
[148,154,154,161,161]	[1,2,3,0,0]	[639,887,719,976,977]
[149,261,161,161]	[1,2,0,0]	[393,741,893,394]
[151,149,161]	[1,2,0]	[705,394,893]
[151,159]	[1,2]	[705,906]
[151,160]	[1,2]	[372,970]
[151,160,161]	[1,2,0]	[372,970,967]
[151,259]	[1,2]	[372,967]
[153,147,161]	[1,2,0]	[713,893,394]
[155,160,161,161]	[1,2,0,0]	[723,734,726,629]
[156,148,161,161]	[1,2,0,0]	[640,607,374,375]
[156,161]	[1,0]	[726,689]
[157,161]	[1,2]	[193,321]
[158,156,161,161]	[1,2,0,0]	[930,928,726,689]
[158,158,161]	[1,2,0]	[949,977,436]
[159,155,161,259]	[1,2,0,3]	[969,724,372,967]
[159,160,161]	[1,2,0]	[724,970,967]
[159,160,161]	[1,2,0]	[734,726,629]
[159,160,161]	[1,2,0]	[969,970,967]
[159,161]	[1,0]	[630,705]
[161,156,156,161,161]	[1,2,3,0,0]	[741,930,928,629,726]
[161,161]	[1,2]	[738,739]
[161,161,161]	[1,2,0]	[738,739,906]
[161,161,251,161]	[1,2,3,0]	[738,739,705,906]
[161,259]	[1,2]	[970,967]
[244,150,161,161]	[1,2,0,0]	[464,578,736,742]
[244,157,161,161]	[1,2,0,0]	[464,193,321,578]
[244,157,161,161,157]	[1,2,0,0,3]	[464,193,321,578,955]
[256,160]	[1,2]	[928,734]
[257,161]	[1,2]	[955,997]
[261,261]	[1,2]	[739,738]
[261,261,161]	[1,2,0]	[739,738,630]
[261,261,161]	[1,2,0]	[739,738,705]
`


const ffv = rawtbl.split(/\n/).filter(s => !!s.trim())
	.map(ln => ln.trim().split(/\t/).map(a => JSON.parse(a)))
console.info('FF voice parsed records:', ffv.length)
//console.debug(ffv)


const voiceByShipId = {}
ffv.forEach(r => {
	r[0].forEach((voiceId, i) => {
		const voiceRecord = voiceByShipId[voiceId] || []
		if(!voiceRecord.length) voiceByShipId[voiceId] = voiceRecord
		const speakOrder = r[1][i], shipId = r[2][i] || -1
		if(speakOrder > 0 && !voiceRecord.includes(shipId)) voiceRecord.push(shipId)
	})
})
const distinctShip = new Set()
Object.keys(voiceByShipId).forEach(s => {
	voiceByShipId[s] = voiceByShipId[s].sort()
	voiceByShipId[s].forEach(id => distinctShip.add(id))
})
//console.debug(distinctShip)
console.info('FF voice-ship stats:', Object.keys(voiceByShipId).length,
	'voices from', distinctShip.size, 'ships:')
console.info(JSON.stringify(voiceByShipId))


// Update id list respectively
const voicesLookfor = [161, 261]
const previousFound = [321,738,739,741,970,997]
voicesLookfor.forEach(v => {
	console.info(`voice-${v} ${voiceByShipId[v].length} ships:`, voiceByShipId[v].join(','))
	console.info(`voice-${v} new ships:`, voiceByShipId[v].filter(id => !previousFound.includes(id)).join(','))
})


// To get available voice id list (to determine if 3xx exists?):
/*
select distinct voiceid from (
  select distinct (fleet#>>'{voice,0}')::jsonb as voiceids from friendlyfleet where map like '61-%'
) as t, jsonb_array_elements(t.voiceids) as voiceid order by voiceid
*/
