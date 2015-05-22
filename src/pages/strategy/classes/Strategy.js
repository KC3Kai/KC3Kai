KC3.prototype.Strategy  = {
	
	// Collection of PageTab Wrapper Classes
	tabs: {
		"home": TabHome,
		"fleets": TabFleets,
		"quests": TabQuests,
		"ships": TabShips,
		"items": TabItems,
		"sortie": TabSortie,
		"exops": TabExops,
		"e_spring2015": TabE_spring2015,
		"devmt": TabDevmt,
		"crafts": TabCrafts,
		"lscs": TabLscs,
		"rscs": TabResources,
		"consumes": TabConsumes
	},
	
	// Tab currently being loaded
	openingTab: "",
	
	// Page ready
	ready: function(){
		var self = this;
		
		// Navigation Link onClicks
		$(".nav.nav-link").on("click", function(){
			// If already in the process of opening another tab
			if(self.openingTab != ""){ return false; }
			
			// Set "opening this tab" flag
			self.openingTab = $(this).data("id");
			
			// Empty page contents
			$(".tabs-content .tab-html").hide();
			$(".tabs-content .tab-html").html("");
			$(".tabs-content .tab-message").hide();
			
			// Highlight selected tab
			$(".nav.nav-link").removeClass("active");
			$(this).addClass("active");
			
			// Add page hash
			window.location = "#"+self.openingTab;
			
			// Request the contents of selected tab and execute
			$.ajax({
				url: "html/"+self.openingTab+".html",
				success: function(response){
					// Show tab HTML
					$(".tabs-content .tab-html").html(response);
					$(".tabs-content .tab-html").show();
					
					// Execute tab scripts
					self.tabs[ self.openingTab ].init();
					self.tabs[ self.openingTab ].show();
					
					// Reset "opening this tab" flag
					self.openingTab = "";
				},
				error: function(){
					// Reset "opening this tab" flag
					self.openingTab = "";
				}
			});
		});
		
		// If there is a hash tag on URL, set it as initial selected
		if(window.location.hash != ""){
			$(".nav.nav-link").removeClass("active");
			$(".nav.nav-link[data-id="+window.location.hash.substring(1)+"]").addClass("active");
		}
		
		// Load initially selected
		$(".nav.nav-link.active").click();
		
	},
	
	// When any tab gets data error, show message
	showError :function(message){
		$(".tabs-content .tab-message").text(message);
		$(".tabs-content .tab-message").show();
		$(".tabs-content .tab-html").hide();
		$(".tabs-content .tab-html").html("");
	}
	
};