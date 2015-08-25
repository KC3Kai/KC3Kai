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
				$(this).parent().siblings(".note").stop(true, true).show().fadeOut(2000);
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
				
				ConfigManager[ self.config ] = $(this).val();
				ConfigManager.save();
				$(this).parent().siblings(".note").stop(true, true).show().fadeOut(2000);
				
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
				$(this).parent().siblings(".note").stop(true, true).show().fadeOut(2000);
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
			$(this).parent().siblings(".note").stop(true, true).show().fadeOut(2000);
			
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
	
})();