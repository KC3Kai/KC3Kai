// Paste result table of following TsunDB query with updated the event id:
/*
select distinct fleet#>>'{voice,0}' as voiceids, fleet#>>'{voice,1}' as voiceorders, fleet->>'ship' as ships from friendlyfleet where map like '62-%'
*/
const rawtbl = `
[144, 144, 162]	[1, 2, 0]	[397, 545, 629]
[144, 162, 162]	[1, 0, 2]	[545, 726, 737]
[148, 162, 162, 155, 162]	[1, 0, 2, 3, 0]	[639, 374, 375, 564, 648]
[151, 159, 162, 162]	[1, 2, 0, 0]	[705, 906, 893, 394]
[151, 159, 162]	[1, 2, 0]	[705, 906, 893]
[155, 155]	[1, 2]	[648, 564]
[156, 162, 162]	[1, 2, 0]	[640, 375, 374]
[156, 162]	[1, 2]	[726, 737]
[158, 160, 162, 249]	[1, 2, 0, 3]	[541, 119, 235, 706]
[159, 159, 251, 162, 162]	[1, 2, 3, 0, 0]	[364, 733, 705, 893, 394]
[160, 160, 154, 162, 162]	[1, 2, 3, 0, 0]	[553, 554, 314, 716, 708]
[160, 160, 162, 162]	[1, 2, 0, 0]	[553, 554, 716, 708]
[160, 160, 162]	[1, 2, 0]	[543, 695, 983]
[160, 162, 162]	[1, 2, 0]	[119, 746, 706]
[160, 162]	[1, 0]	[543, 983]
[162, 148, 162]	[1, 2, 0]	[1070, 607, 399]
[162, 154, 154, 162]	[1, 2, 3, 0]	[1070, 719, 887, 607]
[162, 158, 162]	[1, 2, 0]	[1046, 407, 419]
[162, 162]	[1, 0]	[1046, 578]
[162, 162]	[1, 0]	[1046, 736]
[162, 162]	[1, 0]	[1046, 746]
[162, 162]	[1, 0]	[235, 656]
[248, 155, 162]	[1, 2, 0]	[697, 659, 628]
[248, 162, 158, 162]	[1, 2, 3, 0]	[697, 937, 726, 737]
[254, 154, 162]	[1, 2, 0]	[314, 407, 235]
[256, 158, 162]	[1, 2, 0]	[928, 726, 737]
[256, 160]	[1, 2]	[928, 734]
[258, 162]	[1, 0]	[407, 419]
[259, 147]	[1, 2]	[906, 893]
[260, 162, 160, 162]	[1, 2, 3, 0]	[954, 314, 235, 656]
[260, 262, 162]	[1, 2, 0]	[954, 1046, 578]
[262, 148, 162, 162]	[1, 2, 3, 0]	[937, 697, 737, 726]
[262, 158]	[1, 2]	[737, 726]
[262, 162]	[1, 0]	[746, 706]
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
	voiceByShipId[s] = voiceByShipId[s].sort((a, b) => a - b)
	voiceByShipId[s].forEach(id => distinctShip.add(id))
})
//console.debug(distinctShip)
console.info('FF voice-ship stats:', Object.keys(voiceByShipId).length,
	'voices from', distinctShip.size, 'ships:')
console.info(JSON.stringify(voiceByShipId))


// Update id list respectively
const voicesLookfor = [162, 262]
const previousFound = [235, 314, 375, 737, 746, 937, 1046, 1070]
voicesLookfor.forEach(v => {
	console.info(`voice-${v} ${voiceByShipId[v].length} ships:`, voiceByShipId[v].join(','))
	console.info(`voice-${v} new ships:`, voiceByShipId[v].filter(id => !previousFound.includes(id)).join(','))
})


// To get available voice id list (to determine if 3xx exists?):
/*
select distinct voiceid from (
  select distinct (fleet#>>'{voice,0}')::jsonb as voiceids from friendlyfleet where map like '62-%'
) as t, jsonb_array_elements(t.voiceids) as voiceid order by voiceid
*/
