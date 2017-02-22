QUnit.module("Quest", function(){ localStorage.clear(); });

QUnit.test("Objects > Quest > Counter Auto Adjustment", function( assert ) {
	// having a large start quest id so their never coincide
	// with the real ones
	let questCount = 10000;

	function fromPercent(x) {
		if (x === 0.8)
			return 2;
		if (x === 0.5)
			return 1;
		if (x === 0)
			return 0;
		throw "invalid input";
	}

	function mkQuest(status,progress,tracking) {
		const id = questCount;
		++questCount;

		const q = new KC3Quest();
		q.id = id;
		q.status = status;
		q.progress = progress;
		q.tracking = tracking;
		return q;
	}

	function mkOngoingQuest(progress,tracking) {
		return mkQuest(2,progress,tracking);
	}

	function mkOngoingSingleCounterQuest(progress,cur,max) {
		return mkQuest(2,progress,[[cur,max]]);
	}

	function eqTrackingData(x,y) {
		// nothing dangerous to just stringify and compare for tracking data
		// so we just do that.
		return JSON.stringify(x) === JSON.stringify(y);
	}

	function testQuestAdjust(quest, expectedTracking, msg) {
		// in case same array is used for quest object creation
		let expected = $.extend(true,[], expectedTracking);
		quest.autoAdjustCounter();
		assert.ok( eqTrackingData(quest.tracking, expected),
				   msg);
	}

	function testSingleCounterQuestAdjust(quest, expectedCur, expectedMax, msg) {
		testQuestAdjust(quest,[[expectedCur,expectedMax]],msg);
	}

	testQuestAdjust(
		mkOngoingQuest(fromPercent(0.8), [ [0,1], [0,24], [0,6] ]),
		[ [0,1], [0,24], [0,6] ],
		"no adjustment for multi-counter");

	testSingleCounterQuestAdjust(
		mkOngoingSingleCounterQuest(fromPercent(0.8),2,3),
		2,3, "no adjustment for 2/3");

	testSingleCounterQuestAdjust(
		mkOngoingSingleCounterQuest(fromPercent(0),2,3),
		0,3, "correction for overshotting 1");

	testSingleCounterQuestAdjust(
		mkOngoingSingleCounterQuest(fromPercent(0.5),40,50),
		25,50, "correction for overshotting 2");

	testSingleCounterQuestAdjust(
		mkOngoingSingleCounterQuest(fromPercent(0),40,50),
		0,50, "correction for overshotting 3");

	testSingleCounterQuestAdjust(
		mkOngoingSingleCounterQuest(fromPercent(0.5),10,50),
		25,50, "correction for falling behind counter 1");

	testSingleCounterQuestAdjust(
		mkOngoingSingleCounterQuest(fromPercent(0.8),50,50),
		40,50, "prevent completion 1");

	testSingleCounterQuestAdjust(
		mkOngoingSingleCounterQuest(fromPercent(0.8),5,5),
		4,5, "prevent completion 2");

	testSingleCounterQuestAdjust(
		mkOngoingSingleCounterQuest(fromPercent(0.8),3,3),
		2,3, "prevent completion 3");

	for (let i=0; i<50; ++i) {
		let percent =
			  i < 25 ? 0
			: i < 40 ? 0.5
			: 0.8;
		testSingleCounterQuestAdjust(
			mkOngoingSingleCounterQuest(fromPercent(percent),i,50),
			i,50, "no adjustment for correct counter: " + i + "/50");
	}


	testQuestAdjust(
		mkQuest(3,0,[ [10,20], [40,40], [48,60 ] ]),
		[ [20,20], [40,40], [60,60 ] ],
		"multi counter quest adjustment upon completion");
});
