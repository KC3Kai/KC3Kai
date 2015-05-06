// Initialize KC3 Application
var app = new KC3();

// Collection of PageTab Wrapper Classes
var PageTabs = {
	"home": TabHome,
	
	"fleets": TabFleets,
	// "quests": TabQuests,
	
	"ships": TabShips,
	// "items": TabItems,
	// "showcase": TabShowcase,
	
	"sortie": TabSortie,
	"e_spring2015": TabE_spring2015,
	
	// "devmt": TabDevmt,
	"crafts": TabCrafts,
	"lscs": TabLscs,
	"rscs": TabResources,
	"consumes": TabConsumes
	
	// "expcalc": TabExpcalc,
	// "mods": TabMods,
};

// Tab currently being loaded
var tabRequesting = "";

// Page ready
$(document).on("ready", function(){
	// General libraries
	app.Config.init();
	app.Meta.init("../../data/");
	app.Assets.init("../../data/");
	app.Master.init();
	app.Logging.init();
	app.Player.init();
	app.Resources.init();
	app.Docks.init();
	
	// Test if local player available
	app.Player.load();
	if(app.Player.id == 0){
		$(".navs .nav").hide();
		return false;
	}
	$(".noplayernotice").hide();
	
	// Navigation Link onClicks
	$(".nav.nav-link").on("click", function(){
		if($(this).hasClass("disabled")){ return false; }
		
		if(tabRequesting!=""){ return false; }
		tabRequesting = $(this).data("id");
		
		$(".tabs-content").html("");
		$(".nav.nav-link").removeClass("active");
		$(this).addClass("active");
		window.location = "#"+tabRequesting;
		
		$.ajax({
			url: "html/"+tabRequesting+".html",
			success: function(response){
				$(".tabs-content").html(response);
				PageTabs[ tabRequesting ].init();
				PageTabs[ tabRequesting ].show();
				tabRequesting = "";
			},
			error: function(){
				tabRequesting = "";
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
	
});