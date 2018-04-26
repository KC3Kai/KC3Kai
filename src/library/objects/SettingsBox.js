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
		this.soundPreview = false;
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
		if(parseInt(info.chui) || 0 === 1){
			$(this.element).addClass("dangerous");
		}
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
				if(self.config == "alert_volume"){
					if(self.soundPreview){
						self.soundPreview.pause();
					}
					switch(ConfigManager.alert_type){
						case 1: self.soundPreview = new Audio("/assets/snd/pop.mp3"); break;
						case 2: self.soundPreview = new Audio(ConfigManager.alert_custom); break;
						case 3: self.soundPreview = new Audio("/assets/snd/ding.mp3"); break;
						case 4: self.soundPreview = new Audio("/assets/snd/dong.mp3"); break;
						case 5: self.soundPreview = new Audio("/assets/snd/bell.mp3"); break;
						default: self.soundPreview = false; break;
					}
					if(self.soundPreview){
						self.soundPreview.volume = ConfigManager.alert_volume / 100;
						self.soundPreview.play();
					}
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
			.attr("placeholder", KC3Meta.term( options.placeholder ) )
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
			if(configKeys[0] === ""){
				if(self.soundPreview){
					self.soundPreview.pause();
				}
				switch(ConfigManager[baseKey + configKeys[1]]){
					case 1: self.soundPreview = new Audio("/assets/snd/pop.mp3"); break;
					case 2: self.soundPreview = new Audio(ConfigManager["alert_custom" + configKeys[1]]); break;
					case 3: self.soundPreview = new Audio("/assets/snd/ding.mp3"); break;
					case 4: self.soundPreview = new Audio("/assets/snd/dong.mp3"); break;
					case 5: self.soundPreview = new Audio("/assets/snd/bell.mp3"); break;
					default: self.soundPreview = false; break;
				}
				if(self.soundPreview){
					self.soundPreview.volume = ConfigManager.alert_volume / 100;
					self.soundPreview.play();
				}
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
					ConfigManager[ self.config ] = $(this).val();
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
