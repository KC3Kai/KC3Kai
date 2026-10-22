/* SettingsBox.js
KC3改 Settings Box

To be dynamically used on the settings page
*/
(function(){
	"use strict";

	window.SettingsBox = function( info ){
		var self = this;
		this.config = info.id;
		this.element = $("#factory .settingBox").clone().appendTo("#wrapper .settings");
		$(".title", this.element).text( KC3Meta.term( info.name ) );
		if(info.options && info.options.tooltip){
			$(".title", this.element).attr("title", KC3Meta.term(info.options.tooltip));
		}
		this.bound = $.extend({
			min:-Infinity,
			max:Infinity,
			length_min:0,
			length_max:Infinity,
			type:"String"
		}, info.bound || {});
		this.disabled = info.disabled;
		this[info.type]( info.options );
		// If different with default, show reset button
		if( this.config != "language" &&
			JSON.stringify(ConfigManager[this.config])
			!== JSON.stringify(ConfigManager.defaults()[this.config]) ){
			$(".resetButton", this.element).show();
		}
		$(".resetButton", this.element).on("click", function(){
			console.log("Reset", self.config, "=", ConfigManager[self.config],
				"to default:", ConfigManager.defaults()[self.config]);
			ConfigManager.resetValueOf(self.config);
			elementControl($(this).siblings(".note"),'',KC3Meta.term("SettingsErrorNG"));
			// Refresh this option
			//window.location.reload();
			//$(this).hide();
			$(".options", self.element).empty();
			self[info.type]( info.options );
		});
		// A reset hotkey must steal the default key from another action
		if (info.type === "hotkey") {
			$(".resetButton", this.element).on("click", () => {
				ConfigManager.loadIfNecessary();
				stealHotkey(ConfigManager[self.config], self.config);
				ConfigManager.save();
				SettingsBox.refreshHotkeys();
			});
		}
		$(this.element)
			.toggleClass("deprecated", !!info.deprecated)
			.toggleClass("dangerous", !!info.chui);
	};

	SettingsBox.prototype.check = function( options ){
		var self = this;
		$(".options", this.element).append(
			$("<input/>")
			.attr("type", "checkbox")
			.attr("title", KC3Meta.term( (options || {}).tooltip ) )
			.addClass("checkbox")
			.prop("disabled", this.disabled)
			.prop("checked", ConfigManager[ this.config ])
			.on("change", function(){
				// Dangerous Settings Change Attempt
				if(isDangerous($(this).parent().parent(),self.config,$(this).prop("checked"))) {
					$(this).prop("checked",ConfigManager[self.config]);
					return false;
				}
				ConfigManager.loadIfNecessary();
				ConfigManager[ self.config ] = $(this).prop("checked");
				ConfigManager.save();
				elementControl($(this).parent().siblings(".note"),'',KC3Meta.term("SettingsErrorNG"));
			})
		);
	};

	SettingsBox.prototype.small_text = function( options ){
		var self = this;
		$(".options", this.element).append(
			$("<input/>")
			.attr("type", "text")
			.attr("title", KC3Meta.term( (options || {}).tooltip ) )
			.addClass("small_text")
			.prop("disabled", this.disabled)
			.val( ConfigManager[ this.config ] )
			.on("change", function(){
				// Dangerous Settings Change Attempt
				if(isDangerous($(this).parent().parent(),self.config,$(this).val())) {
					$(this).val(ConfigManager[self.config]);
					return false;
				}

				// Invalid Value Attempt
				var ERRCODE = isInvalid(self.bound, $(this).val());
				if(!!ERRCODE) {
					var errstr = KC3Meta.term("SettingsErrorOrder");
					if(ERRCODE === -1) {
						errstr = KC3Meta.term("SettingsErrorSuper");
					} else {
						errstr = errstr
							.replace("%TYP",KC3Meta.term("SettingsError" + ((ERRCODE & 4) == 4 ? "Value" : "Length")))
							.replace("%CMP",KC3Meta.term("SettingsError" + ((ERRCODE & 2) == 2 ? "Above" :  "Below")))
							.replace("%VAL",self.bound[((ERRCODE & 4) == 4 ? "" : "length_") + ((ERRCODE & 2) == 2 ? "max" : "min")]);
					}
					console.log("Validation failed:", $(this).val(), errstr, self.bound);
					elementControl($(this).parent().siblings(".note"), 'red', errstr);
					$(this).val(ConfigManager[self.config]);
					return false;
				}
				ConfigManager.loadIfNecessary();
				ConfigManager[ self.config ] = window[self.bound.type==="Integer"?"Number":self.bound.type]($(this).val());
				ConfigManager.save();
				elementControl($(this).parent().siblings(".note"),'',KC3Meta.term("SettingsErrorNG"));

				// If changed volume, test play the alert sound
				if (self.config == "alert_volume") {
					KC3Notification.playSound(ConfigManager.alert_type, ConfigManager.alert_custom);
				}
			})
		);
		$(".options", this.element).append( KC3Meta.term( options.label ) );
	};


	SettingsBox.prototype.long_text = function( options ){
		var self = this;
		$(".options", this.element).append(
			$("<input/>")
			.attr("type", "text")
			.attr("placeholder", KC3Meta.term( (options || {}).placeholder ) )
			.attr("title", KC3Meta.term( (options || {}).tooltip ) )
			.addClass("long_text")
			.prop("disabled", this.disabled)
			.val( ConfigManager[ this.config ] )
			.on("change", function(){
				// Dangerous Settings Change Attempt
				if(isDangerous($(this).parent().parent(),self.config,$(this).val())) {
					$(this).val(ConfigManager[self.config]);
					return false;
				}
				// Invalid Value Attempt
				if(options && $(this).val() && (options.invalidregexp || options.validregexp)) {
					var ng = options.invalidregexp && new RegExp(options.invalidregexp).exec($(this).val());
					var gd = options.validregexp && new RegExp(options.validregexp).exec($(this).val());
					if(ng !== null || gd === null) {
						console.log("Validation failed, N:/{1}/ G:/{2}/ I:`{0}`".format(
							$(this).val(), options.invalidregexp, options.validregexp), ng);
						elementControl($(this).parent().siblings(".note"), 'red', KC3Meta.term("SettingsErrorSuper"));
						$(this).val(ConfigManager[self.config]);
						return false;
					}
				}
				ConfigManager.loadIfNecessary();
				ConfigManager[ self.config ] = $(this).val();
				ConfigManager.save();
				elementControl($(this).parent().siblings(".note"),'',KC3Meta.term("SettingsErrorNG"));
			})
		);
		$(".options", this.element).append( options.label );
	};

	SettingsBox.prototype.radio = function( options ){
		var self = this;
		var choiceClass = "choices_" + this.config;
		for(var ctr in options.choices){
			$(".options", this.element).append(
				$("#factory .radioBox")
				.clone()
				.addClass( choiceClass )
				.addClass( (options.choices[ctr][0]==ConfigManager[ self.config ])?"active":"" )
				.data("class", choiceClass )
				.data("value", options.choices[ctr][0] )
				.html( KC3Meta.term( options.choices[ctr][1] ) )
			);
		}

		$("."+choiceClass, this.element).on("click", function(){
			//console.debug(this, arguments);
			$("."+$(this).data("class")).removeClass("active");
			$(this).addClass("active");
			ConfigManager.loadIfNecessary();
			ConfigManager[ self.config ] = $(this).data("value");
			ConfigManager.save();
			elementControl($(this).parent().siblings(".note"),'',KC3Meta.term("SettingsErrorNG"));

			// If changed sound type, test play the alert sound
			const baseKey = "alert_type",
				configKeys = self.config.split(baseKey);
			if (configKeys[0] === "") {
				KC3Notification.playSound(ConfigManager[baseKey + configKeys[1]], ConfigManager["alert_custom" + configKeys[1]]);
			}

			// Refresh page when a language option is clicked
			if(self.config == "language"){
				window.location.reload();
			}
		});
	};

	SettingsBox.prototype.json = function( options ){
		var self = this;
		$(".options", this.element).append(
			$("<textarea/>")
				.attr("title", KC3Meta.term( (options || {}).tooltip ) )
				.addClass("json_text")
				.prop("disabled", this.disabled)
				.val( JSON.stringify(ConfigManager[ this.config ]) )
				.on("change", function(){
					var newValue = false;
					try {
						newValue = JSON.parse($(this).val());
						ConfigManager.loadIfNecessary();
						ConfigManager[ self.config ] = newValue;
						ConfigManager.save();
						elementControl($(this).parent().siblings(".note"), '', KC3Meta.term("SettingsErrorNG"));
					} catch (e) {
						elementControl($(this).parent().siblings(".note"), 'red', KC3Meta.term("SettingsErrorSuper"));
					}
				})
		);
	};

	SettingsBox.prototype.textarea = function( options ){
		var self = this;
		$(".options", this.element).append(
			$("<textarea/>")
				.attr("title", KC3Meta.term( (options || {}).tooltip ) )
				.attr("maxlength", 64000)
				.addClass("huge_text")
				.prop("disabled", this.disabled)
				.val( ConfigManager[ this.config ] )
				.on("change", function(){
					ConfigManager.loadIfNecessary();
					ConfigManager[ self.config ] = $(this).val();
					ConfigManager.save();
					elementControl($(this).parent().siblings(".note"), '', KC3Meta.term("SettingsErrorNG"));
				})
		);
	};

	SettingsBox.prototype.dropdown = function( options ){
		var self = this;
		var choiceClass = "choices_" + this.config;

		$(".options", this.element).append(
			$("<select/>")
				.attr("title", KC3Meta.term( (options || {}).tooltip ) )
				.addClass("dropdown")
				.prop("disabled", this.disabled)
				.on("change", function(){
					ConfigManager.loadIfNecessary();
					if(typeof (options || {}).casting == "string"){
						ConfigManager[ self.config ] = window[options.casting]( $(this).val() );
					} else {
						ConfigManager[ self.config ] = $(this).val();
					}
					ConfigManager.save();
					elementControl($(this).parent().siblings(".note"), '', KC3Meta.term("SettingsErrorNG"));
				})
		);

		for(var ctr in options.choices){
			$(".options select", this.element).append(
				$("<option/>")
				.attr("value", options.choices[ctr][0] )
				.prop("selected", options.choices[ctr][0] == ConfigManager[ self.config ])
				.text( KC3Meta.term( options.choices[ctr][1] ) )
				.prop("disabled", typeof options.choices[ctr][2] != "undefined")
			);
		}
	};

	SettingsBox.prototype.hotkey = function() {
		const input = $("<input/>")
			.attr("type", "text")
			.attr("readonly", "readonly")
			.prop("disabled", this.disabled)
			.addClass("hotkey")
			.attr("data-config", this.config);
		$(".options", this.element).append(input);
		refreshHotkey(input);
		input.on("click", () => startHotkeyCapture(input));
	};

	/**
	 * Show the current binding of one input.
	 * @param {jQuery} input - hotkey input
	 */
	const refreshHotkey = (input) => {
		if (input.hasClass("recording")) return;
		const binding = ConfigManager[input.attr("data-config")];
		input.val(ConfigManager.hotkeyLabel(binding))
			.attr("placeholder", binding ? "" : KC3Meta.term("SettingsHotkeyUnassigned"));
	};

	/**
	 * Refresh all hotkey inputs and their reset buttons.
	 */
	SettingsBox.refreshHotkeys = () => {
		$(".settingBox .options .hotkey").each((_index, element) => {
			const input = $(element);
			if (input.hasClass("recording")) return;
			refreshHotkey(input);
			const config = input.attr("data-config");
			input.closest(".settingBox").find(".resetButton").toggle(
				JSON.stringify(ConfigManager[config])
				!== JSON.stringify(ConfigManager.defaults()[config])
			);
		});
	};

	/**
	 * Listen for one key and save it as the binding of this input.
	 * @param {jQuery} input - hotkey input
	 */
	const startHotkeyCapture = (input) => {
		if (input.prop("disabled") || input.hasClass("recording")) return;
		const config = input.attr("data-config");
		const note = input.closest(".settingBox").find(".note");
		input.addClass("recording")
			.val("")
			.attr("placeholder", KC3Meta.term("SettingsHotkeyPressKey"));
		$(document).on("keydown.hotkeyCapture", (ev) => {
			ev.stopPropagation();
			ev.preventDefault();
			if (ConfigManager.eventCode(ev) === "Escape") {
				stopHotkeyCapture(input);
				return;
			}
			const binding = ConfigManager.hotkeyFromEvent(ev);
			if (!binding) return;
			if (isReservedHotkey(binding)) {
				elementControl(note, "red", KC3Meta.term("SettingsHotkeyReserved"));
				return;
			}
			stopHotkeyCapture(input);
			ConfigManager.loadIfNecessary();
			stealHotkey(binding, config);
			ConfigManager[config] = binding;
			ConfigManager.save();
			SettingsBox.refreshHotkeys();
			elementControl(note, "", KC3Meta.term("SettingsErrorNG"));
		});
		input.one("blur", () => {
			stopHotkeyCapture(input);
		});
	};

	/**
	 * Stop the key listener and show the saved binding again.
	 * @param {jQuery} input - hotkey input
	 */
	const stopHotkeyCapture = (input) => {
		$(document).off("keydown.hotkeyCapture");
		input.removeClass("recording");
		refreshHotkey(input);
	};

	/**
	 * Compare two bindings by key code and all modifiers.
	 * @param {?Object} a - first binding
	 * @param {?Object} b - second binding
	 * @returns {boolean} true if both bindings are equal
	 */
	const sameHotkey = (a, b) => {
		return !!a && !!b
			&& a.code === b.code
			&& Boolean(a.mod) === Boolean(b.mod)
			&& Boolean(a.alt) === Boolean(b.alt)
			&& Boolean(a.shift) === Boolean(b.shift);
	};

	/**
	 * Clear every other action that uses this binding.
	 * @param {Object} binding - new binding
	 * @param {string} exceptConfig - config key to keep
	 */
	const stealHotkey = (binding, exceptConfig) => {
		ConfigManager.hotkeyConfigs().forEach((key) => {
			if (key !== exceptConfig && sameHotkey(ConfigManager[key], binding)) {
				ConfigManager[key] = null;
			}
		});
	};

	/**
	 * Check if the browser or the panel reserves a binding.
	 * @param {Object} binding - binding to check
	 * @returns {boolean} true if the binding is reserved
	 */
	const isReservedHotkey = (binding) => {
		const code = binding.code;
		if (code === "Tab" || code === "F5" || code === "F11" || code === "F12") return true;
		if (binding.mod && (code === "KeyW" || code === "KeyT" || code === "KeyN")) return true;
		if (binding.mod && code === "KeyQ" && ConfigManager.isMacPlatform()) return true;
		if (binding.alt && code === "F4") return true;
		return false;
	};

	function elementControl(ele,colorCSS,msg) {
		return ele.stop(true, true).css('color',colorCSS).text(msg).show().fadeOut(colorCSS ? 5000 : 2000);
	}

	function isDangerous(element,key,current) {
		var
			isDG = $(element).hasClass("dangerous"),
			isEqPrev = ConfigManager[key] === current,
			isEqDef  = ConfigManager.defaults()[key] === current;
		if(isDG&&!isEqPrev&&!isEqDef)
			return !confirm(KC3Meta.term("SettingsChuuiWarningDangerousFeature")); // cancelling the prompt
		else
			return false;
	}
	function isInvalid(bound,value) {
		// 00000
		// lsb-0 : is error
		// lsb-1 : greater if set, lesser if not
		// lsb-2 : value check if set, length check if not
		// having all bit is set means invalid value
		// otherwise, having all bit is unset means valid value
		//console.debug(bound);
		var isNumber = function(str){
			return !(isNaN(str) || str === "" || str === null || str === false);
		};
		var isInteger = function(str){
			return isNumber(str) && Number.isFinite(Number(str)) && Math.floor(Number(str)) === Number(str);
		};
		switch(true) {
			case(bound.type === "Number" && !isNumber(value)): return -1; // Number Expectation
			case(bound.type === "Integer" && !isInteger(value)): return -1;
			case(String(value).length > (Number(bound.length_max) || Infinity)): return  3;
			case(String(value).length < (Number(bound.length_min) ||        0)): return  1;
			case(value > (isInteger(bound.max) ? Number(bound.max) :  Infinity)): return  7;
			case(value < (isInteger(bound.min) ? Number(bound.min) : -Infinity)): return  5;
			default: return 0;
		}
	}

})();
