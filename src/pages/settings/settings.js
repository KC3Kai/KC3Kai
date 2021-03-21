(function(){
	"use strict";
	
	// Document ready
	$(document).on("ready", function(){
		// Load previously stored configs
		ConfigManager.load();
		KC3Meta.init("/data/");
		KC3Translation.execute();
		
		// Add configurable settings
		$.ajax({
			dataType: 'json',
			url: "/data/settings.json",
			success: function(response){
				for(const sctr in response){
					// Hide "private/deprecated" section
					if(!!response[sctr].hide) continue;
					
					// Add linkable section header
					const sectionBox = $("#factory .section").clone().appendTo("#wrapper .settings");
					const anchorId = response[sctr].section.replace(/^Settings/, '').toLowerCase();
					sectionBox.attr("id", anchorId);
					$(".title a", sectionBox).text( KC3Meta.term( response[sctr].section ) )
						.attr("href", "#" + anchorId );
					// Navigator menu
					const menuItem = $("#factory .menu-item").clone().appendTo("#left .menu");
					$("a", menuItem).attr("href", "#" + anchorId);
					$("a span", menuItem).text(KC3Meta.term(response[sctr].section));
					// Learn more button
					if(response[sctr].help){
						$("a.more", sectionBox).attr("href", response[sctr].help );
					}else{
						$("a.more", sectionBox).hide();
					}
					
					// Add line through style like <del> tag if deprecated
					if(response[sctr].deprecated){
						$(".title a", sectionBox).css("text-decoration", "line-through");
					}
					
					// Add settings boxes under this section
					for(const cctr in response[sctr].contents){
						// Hide "private/deprecated" settings
						if(!response[sctr].contents[cctr].hide)
							new SettingsBox( response[sctr].contents[cctr] );
					}
				}
				// Init jquery-ui tooltips
				$(".settings").tooltip({
					content: function(){
						return ($(this).attr("title") || "")
							.replace(/\n/g, "<br/>")
							.replace(/\t/g, "&emsp;&emsp;");
					}
				});
				// Jump to specified section if necessary
				if(document.location.hash)
					document.location.replace(document.location.href);
			}
		});
		
	});
	
})();