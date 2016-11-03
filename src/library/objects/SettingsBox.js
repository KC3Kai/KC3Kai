/* SettingsBox.js
KC3改 Settings Box

To be dynamically used on the settings page
*/
(function(){
	"use strict";
	
	window.SettingsBox = function( info ){
		this.config = info.id;
		this.element = $("#factory .settingBox").clone().appendTo("#wrapper .settings");
		$(".title", this.element).text( KC3Meta.term( info.name ) );
		this.soundPreview = false;
		this.bound = $.extend({min:-Infinity,max:Infinity,length_min:0,length_max:Infinity,type:"String"},info.bound || {});
		this[info.type]( info.options );
		if(parseInt(info.chui) || 0 === 1)
			$(this.element).addClass("dangerous");
	};
	
	SettingsBox.prototype.check = function( options ){
		var self = this;
		$(".options", this.element).append(
			$("<input/>")
			.attr("type", "checkbox")
			.addClass("checkbox")
			.prop("checked", ConfigManager[ this.config ])
			.on("change", function(){
				// Dangerous Settings Change Attempt
				if(isDangerous($(this).parent().parent(),self.config,$(this).prop("checked"))) {
					$(this).prop("checked",ConfigManager[self.config]);
					return false;
				}
				
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
			.addClass("small_text")
			.val( ConfigManager[ this.config ] )
			.on("change", function(){
				// Dangerous Settings Change Attempt
				if(isDangerous($(this).parent().parent(),self.config,$(this).val())) {
					$(this).val(ConfigManager[self.config]);
					return false;
				}
				
				// Invalid Value Attempt
				var ERRCODE = isInvalid(self.bound,$(this).val());
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
					console.error(errstr);
					elementControl($(this).parent().siblings(".note"),'red',errstr);
					$(this).val(ConfigManager[self.config]);
					return false;
				}
				
				ConfigManager[ self.config ] = window[self.bound.type]($(this).val());
				ConfigManager.save();
				elementControl($(this).parent().siblings(".note"),'',KC3Meta.term("SettingsErrorNG"));
				
				// If changed volume, test play the alert sound
				if(self.config == "alert_volume"){
					if(self.soundPreview){
						self.soundPreview.pause();
					}
					switch(ConfigManager.alert_type){
						case 1: self.soundPreview = new Audio("../../../../assets/snd/pop.mp3"); break;
						case 2: self.soundPreview = new Audio(ConfigManager.alert_custom); break; 
						case 3: self.soundPreview = new Audio("../../../../assets/snd/ding.mp3"); break;
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
			.addClass("long_text")
			.val( ConfigManager[ this.config ] )
			.on("change", function(){
				// Dangerous Settings Change Attempt
				if(isDangerous($(this).parent().parent(),self.config,$(this).val())) {
					$(this).val(ConfigManager[self.config]);
					return false;
				}
				
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
			console.log(this,arguments);
			$("."+$(this).data("class")).removeClass("active");
			$(this).addClass("active");
			ConfigManager[ self.config ] = $(this).data("value");
			ConfigManager.save();
			elementControl($(this).parent().siblings(".note"),'',KC3Meta.term("SettingsErrorNG"));
			
			// If changed sound type, test play the alert sound
			if(self.config == "alert_type"){
				if(self.soundPreview){
					self.soundPreview.pause();
				}
				switch(ConfigManager.alert_type){
					case 1: self.soundPreview = new Audio("../../../../assets/snd/pop.mp3"); break;
					case 2: self.soundPreview = new Audio(ConfigManager.alert_custom); break; 
					case 3: self.soundPreview = new Audio("../../../../assets/snd/ding.mp3"); break;
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
				.addClass("json_text")
				.val( JSON.stringify(ConfigManager[ this.config ]) )
				.on("change", function(){
					var newValue = false;
					try {
						newValue = JSON.parse($(this).val());
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
				.addClass("huge_text")
				.val( ConfigManager[ this.config ] )
				.on("change", function(){
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
				.addClass("dropdown")
				.on("change", function(){
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
		return ele.stop(true, true).css('color',colorCSS).text(msg).show().fadeOut(2000);
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
		console.log(bound);
		switch(true) {
			case(bound.type === "Number" && (isNaN(Number(value)) || (value || null) === null)): return -1; // Number Expectation
			case(String(value).length > (Number(bound.length_max) || Infinity)): return  3;
			case(String(value).length < (Number(bound.length_min) ||        0)): return  1;
			case(value > (Number(bound.max) ||  Infinity)): return  7;
			case(value < (Number(bound.min) || -Infinity)): return  5;
			default: return 0;
		}
	}
	
})();