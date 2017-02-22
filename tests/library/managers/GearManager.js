QUnit.module("Gear Manager", function(){ localStorage.clear(); });

QUnit.test("Managers > Gear > Feeding new data", function( assert ) {
	var x = $.extend(true, {}, KC3GearManager);
	x.set(api_get_member_require_info.api_data.api_slot_item);
	
	testData(assert, x);
});

QUnit.test("Managers > Gear > Saving", function( assert ) {
	var x = $.extend(true, {}, KC3GearManager);
	x.set(api_get_member_require_info.api_data.api_slot_item);
	
	x.save();
	assert.ok( localStorage.gears, "Checking if saved on localStorage" );
});

QUnit.test("Managers > Gear > Loading", function( assert ) {
	ConfigManager.load();
	var x = $.extend(true, {}, KC3GearManager);
	x.load();
	
	testData(assert, x);
});

function testData(assert, x){
	assert.ok(x.get(2), "Get existing item does not fail");
	assert.ok(x.get(999999), "Get non-existent item does not fail");
	
	assert.strictEqual( x.get(2).itemId, 2, "Gear must have correct item ID" );
	assert.strictEqual( x.get(2564).stars, 6, "Gear must have correct improvement level" );
	assert.strictEqual( x.get(2).lock, 1, "Gear must have correct locking" );
	assert.strictEqual( x.get(2).masterId, 42, "Gear must have correct master ID" );
	assert.strictEqual( x.get(2668).ace, 7, "Planes must have proficiency" );
	
	assert.strictEqual(x.count(), 755, "Count should be correct");
	
	assert.strictEqual(x.countByMasterId(3), 22, "Counting by Master ID should be correct");
	
	x.remove(2);
	assert.strictEqual(x.get(2).itemId, 0, "Gear removed, must have no item ID" );
	assert.strictEqual(x.get(2).masterId, 0, "Gear removed, must have no master ID" );
	
	x.clear();
	assert.equal(JSON.stringify(x.list), "{}", "Clear must remove all items");
}