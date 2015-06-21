/* SettingsBox.js
KC3改 Settings Box

To be dynamically used on the settings page
*/
(function(){
	"use strict";
	
	window.SettingsBox = function( info ){
		this.config = info.id;
		this.element = $("#factory .settingBox").clone().appendTo("#wrapper .settings");
		$(".category", this.element).text( info.category );
		$(".title", this.element).text( info.name );
		this[info.type]( info.options );
	}
	
	SettingsBox.prototype.check = function( options ){
		var self = this;
		$(".options", this.element).append(
			$("<input/>")
			.attr("type", "checkbox")
			.addClass("checkbox")
			.prop("checked", ConfigManager[ this.config ])
			.on("change", function(){
				ConfigManager[ self.config ] = $(this).prop("checked");
				ConfigManager.save();
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
				ConfigManager[ self.config ] = $(this).val();
				ConfigManager.save();
			})
		);
		$(".options", this.element).append( options.label );
	};
	
	
	SettingsBox.prototype.long_text = function( options ){
		var self = this;
		$(".options", this.element).append(
			$("<input/>")
			.attr("type", "text")
			.attr("placeholder", options.placeholder)
			.addClass("long_text")
			.val( ConfigManager[ this.config ] )
			.on("change", function(){
				ConfigManager[ self.config ] = $(this).val();
				ConfigManager.save();
			})
		);
		$(".options", this.element).append( options.label );
	};
	
	SettingsBox.prototype.radio = function( options ){
		var self = this;
		var currentRadio, choiceId;
		for(var ctr in options.choices){
			currentRadio = $("#factory .radioBox").clone();
			choiceId = "choice_"+this.config+"_"+options.choices[ctr][0];
			
			$(currentRadio).attr("for", choiceId);
			
			$("input", currentRadio).attr("id", choiceId);
			$("input", currentRadio).attr("name", "choices_"+this.config);
			$("input", currentRadio).attr("value", options.choices[ctr][0]);
			
			$("span", currentRadio).text( options.choices[ctr][1] );
			
			$(".options", this.element).append(currentRadio);
		}
	};
	
})();