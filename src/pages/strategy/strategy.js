// Connect to IndexedDB
var database = new Dexie("KC3");
database.version(1).stores({
	usership: "id,hq,level,exp,chp,hp,fp,ar,tp,ev,aa,ac,as,sp,ls,rn,lk,morale,fuel,ammo,star,ship_id",
	useritem: "id,hq,level,locked,slotitem_id",
	account: "++id,&hq,server,mid,name",
	build: "++id,hq,flag,rsc1,rsc2,rsc3,rsc4,result,time",
	lsc: "++id,hq,flag,rsc1,rsc2,rsc3,rsc4,result,time",
	sortie: "++id,hq,b1,b2,b3,b4,b5",
	battle: "++id,hq,ships,enemy,data,rating,drop",
	resource: "++id,hq,rsc1,rsc2,rsc3,rsc4,time",
});
database.open();

// Get latest master data
var master = false;
if(typeof localStorage["master"] != "undefined"){
	master = JSON.parse(localStorage["master"]);
}

// Collection of PageTab Wrapper Classes
var PageTabs = {
	"fleets": TabFleets,
	"quests": TabDummy,
	"expeds": TabDummy,
	
	"ships": TabShips,
	"items": TabItems,
	
	"sortie": TabDummy,
	"events": TabDummy,
	
	"crafts": TabDummy,
	"lscs": TabDummy,
	"drops": TabDummy,
	"rscs": TabResources,
	
	"expcalc": TabDummy,
	"airsup": TabDummy,
	
	"settings": TabDummy,
	"faq": TabDummy,
	"about": TabDummy,
};

// Tab currently being loaded
var tabRequesting = "";

// Page ready
$(document).on("ready", function(){

	KanColleData.init();
	
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