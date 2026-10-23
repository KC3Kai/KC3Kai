QUnit.module("ConfigManagerHotkeys", {
	beforeEach: () => {
		localStorage.removeItem(ConfigManager.keyName());
		ConfigManager.load();
	},
	afterEach: () => {
		localStorage.removeItem(ConfigManager.keyName());
	}
});

QUnit.test("hotkeyFromEvent reads code and modifiers", (assert) => {
	assert.deepEqual(
		ConfigManager.hotkeyFromEvent({
			code: "KeyQ", ctrlKey: false, metaKey: false, altKey: false, shiftKey: false
		}),
		{ code: "KeyQ", mod: false, alt: false, shift: false }
	);
	assert.deepEqual(
		ConfigManager.hotkeyFromEvent({
			code: "F8", ctrlKey: true, metaKey: false, altKey: false, shiftKey: true
		}),
		{ code: "F8", mod: true, alt: false, shift: true }
	);
});

QUnit.test("hotkeyFromEvent ignores modifier-only keys and empty code", (assert) => {
	["ControlLeft", "ShiftRight", "AltLeft", "MetaRight"].forEach((code) => {
		assert.strictEqual(
			ConfigManager.hotkeyFromEvent({
				code: code, ctrlKey: true, metaKey: false, altKey: false, shiftKey: false
			}),
			null
		);
	});
	assert.strictEqual(ConfigManager.hotkeyFromEvent({ code: "", ctrlKey: false }), null);
	assert.strictEqual(ConfigManager.hotkeyFromEvent(null), null);
});

QUnit.test("hotkeyMatches compares code and modifiers", (assert) => {
	const binding = { code: "F8", mod: false, alt: false, shift: true };
	assert.strictEqual(ConfigManager.hotkeyMatches(binding, {
		code: "F8", ctrlKey: false, metaKey: false, altKey: false, shiftKey: true
	}), true);
	assert.strictEqual(ConfigManager.hotkeyMatches(binding, {
		code: "F8", ctrlKey: false, metaKey: false, altKey: false, shiftKey: false
	}), false);
	assert.strictEqual(ConfigManager.hotkeyMatches(binding, {
		code: "F9", ctrlKey: false, metaKey: false, altKey: false, shiftKey: true
	}), false);
	assert.strictEqual(ConfigManager.hotkeyMatches(null, {
		code: "F8", ctrlKey: false, metaKey: false, altKey: false, shiftKey: true
	}), false);
});

QUnit.test("hotkeyMatches treats Ctrl and Meta as one primary modifier", (assert) => {
	const binding = { code: "KeyS", mod: true, alt: false, shift: false };
	assert.strictEqual(ConfigManager.hotkeyMatches(binding, {
		code: "KeyS", ctrlKey: true, metaKey: false, altKey: false, shiftKey: false
	}), true);
	assert.strictEqual(ConfigManager.hotkeyMatches(binding, {
		code: "KeyS", ctrlKey: false, metaKey: true, altKey: false, shiftKey: false
	}), true);
	assert.strictEqual(ConfigManager.hotkeyMatches(binding, {
		code: "KeyS", ctrlKey: false, metaKey: false, altKey: false, shiftKey: false
	}), false);
});

QUnit.test("eventCode reads native and jQuery-wrapped events", (assert) => {
	const jQueryStyle = {
		originalEvent: { code: "Digit1" },
		ctrlKey: true, altKey: false, shiftKey: false, metaKey: false
	};
	assert.deepEqual(
		ConfigManager.hotkeyFromEvent(jQueryStyle),
		{ code: "Digit1", mod: true, alt: false, shift: false }
	);
	const binding = { code: "Digit1", mod: true, alt: false, shift: false };
	assert.strictEqual(ConfigManager.hotkeyMatches(binding, jQueryStyle), true);
	assert.strictEqual(ConfigManager.hotkeyMatches(binding, {
		originalEvent: { code: "Digit1" },
		ctrlKey: false, altKey: false, shiftKey: false, metaKey: false
	}), false);
	assert.strictEqual(ConfigManager.eventCode(null), "");
	assert.strictEqual(ConfigManager.eventCode({}), "");
	assert.strictEqual(ConfigManager.eventCode({ originalEvent: {} }), "");
});

QUnit.test("hotkeyLabel orders modifiers and shortens codes", (assert) => {
	const primary = ConfigManager.isMacPlatform() ? "Cmd" : "Ctrl";
	assert.strictEqual(
		ConfigManager.hotkeyLabel({ code: "F8", mod: true, alt: true, shift: true }),
		primary + " + Alt + Shift + F8"
	);
	assert.strictEqual(
		ConfigManager.hotkeyLabel({ code: "KeyQ", mod: false, alt: false, shift: false }),
		"Q"
	);
	assert.strictEqual(
		ConfigManager.hotkeyLabel({ code: "Digit1", mod: false, alt: false, shift: false }),
		"1"
	);
	assert.strictEqual(
		ConfigManager.hotkeyLabel({ code: "Space", mod: false, alt: false, shift: false }),
		"Space"
	);
	assert.strictEqual(
		ConfigManager.hotkeyLabel({ code: "Escape", mod: false, alt: false, shift: false }),
		"Esc"
	);
	assert.strictEqual(ConfigManager.hotkeyLabel(null), "");
});

QUnit.test("hotkeyTitle adds the label when a key is bound", (assert) => {
	assert.strictEqual(
		ConfigManager.hotkeyTitle("Mute", { code: "F8", mod: false, alt: false, shift: false }),
		"Mute (F8)"
	);
	assert.strictEqual(ConfigManager.hotkeyTitle("Mute", null), "Mute");
	assert.strictEqual(
		ConfigManager.hotkeyTitle("Mute", { code: "", mod: false, alt: false, shift: false }),
		"Mute"
	);
});

QUnit.test("defaults contain the 15 hotkeys", (assert) => {
	const expected = {
		hotkey_fleet_1:         { code: "Digit1", mod: false, alt: false, shift: false },
		hotkey_fleet_2:         { code: "Digit2", mod: false, alt: false, shift: false },
		hotkey_fleet_3:         { code: "Digit3", mod: false, alt: false, shift: false },
		hotkey_fleet_4:         { code: "Digit4", mod: false, alt: false, shift: false },
		hotkey_fleet_combined:  { code: "Digit5", mod: false, alt: false, shift: false },
		hotkey_lbas:            { code: "Digit6", mod: false, alt: false, shift: false },
		hotkey_activity_basic:  { code: "KeyQ", mod: false, alt: false, shift: false },
		hotkey_activity_battle: { code: "KeyW", mod: false, alt: false, shift: false },
		hotkey_activity_quest:  { code: "KeyE", mod: false, alt: false, shift: false },
		hotkey_activity_exped:  { code: "KeyR", mod: false, alt: false, shift: false },
		hotkey_reload_iframe:   { code: "F6", mod: false, alt: false, shift: false },
		hotkey_mute:            { code: "F8", mod: false, alt: false, shift: false },
		hotkey_alert:           { code: "F8", mod: false, alt: false, shift: true },
		hotkey_screenshot:      { code: "F9", mod: false, alt: false, shift: false },
		hotkey_clear_overlays:  { code: "F10", mod: false, alt: false, shift: false },
	};
	const defaults = ConfigManager.defaults();
	Object.keys(expected).forEach((key) => {
		assert.deepEqual(defaults[key], expected[key], key);
	});
	assert.deepEqual(ConfigManager.hotkeyConfigs().sort(), Object.keys(expected).sort());
});

QUnit.test("load keeps saved bindings and adds missing defaults", (assert) => {
	const saved = ConfigManager.defaults();
	saved.hotkey_mute = { code: "KeyM", mod: true, alt: false, shift: false };
	delete saved.hotkey_screenshot;
	localStorage[ConfigManager.keyName()] = JSON.stringify(saved);
	ConfigManager.load();
	assert.deepEqual(ConfigManager.hotkey_mute, { code: "KeyM", mod: true, alt: false, shift: false });
	assert.deepEqual(ConfigManager.hotkey_screenshot, { code: "F9", mod: false, alt: false, shift: false });
});

QUnit.test("alt modifier converts and matches", (assert) => {
	assert.deepEqual(
		ConfigManager.hotkeyFromEvent({
			code: "KeyA", ctrlKey: false, altKey: true, shiftKey: false, metaKey: false
		}),
		{ code: "KeyA", mod: false, alt: true, shift: false }
	);
	const binding = { code: "KeyA", mod: false, alt: true, shift: false };
	assert.strictEqual(ConfigManager.hotkeyMatches(binding, {
		code: "KeyA", altKey: true
	}), true);
	assert.strictEqual(ConfigManager.hotkeyMatches(binding, {
		code: "KeyA", altKey: false
	}), false);
});

QUnit.test("load keeps an unassigned null binding", (assert) => {
	const saved = ConfigManager.defaults();
	saved.hotkey_mute = null;
	localStorage[ConfigManager.keyName()] = JSON.stringify(saved);
	ConfigManager.load();
	assert.strictEqual(ConfigManager.hotkey_mute, null);
});
