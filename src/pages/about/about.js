(function(){
	"use strict";
	_gaq.push(['_trackPageview']);
	
	var myVersion = chrome.runtime.getManifest().version;
	
	// Document ready
	$(document).on("ready", function(){
		// Show installed version
		$(".verNum").text(myVersion);
		
		// Load previously stored configs
		ConfigManager.load();
		KC3Meta.init("../../data/");
		KC3Translation.execute();
		
		// Load and show developer list
		$.getJSON("../../data/developers.json", function(response){
			var sectionBox, sectionName, devTypeCode, devCtr, devCatBox, devName;
			
			console.log("response", response);
			
			for(sectionName in response){
				sectionBox = $("#factory .section").clone().appendTo("#wrapper .contributors");
				$(".title", sectionBox).text( KC3Meta.term( sectionName ) );
				
				switch (sectionName) {
					case "AboutInvdividuals":
						for (devTypeCode in response.AboutInvdividuals) {
							devCatBox = addDeveloperCategory(devTypeCode, $(".list", sectionBox));
							for (devCtr in response.AboutInvdividuals[devTypeCode]) {
								addDeveloper(
									response.AboutInvdividuals[devTypeCode][devCtr],
									devCatBox
								);
							}
						}
						$(".list", sectionBox).append($("<div/>").addClass("clear"));
						break;
					case "AboutPartners":
						for (devCtr in response.AboutPartners) {
							addPartner( response.AboutPartners[devCtr], $(".list", sectionBox) );
						}
						$(".list", sectionBox).append($("<div/>").addClass("clear"));
						break;
					case "AboutOtherCredits":
						for (devName in response.AboutOtherCredits) {
							addOther( response.AboutOtherCredits[devName], $(".list", sectionBox) );
						}
						$(".list", sectionBox).append($("<div/>").addClass("clear"));
						break;
					case "AboutDonators":
						for (devCtr in response.AboutDonators) {
							addDonator( response.AboutDonators[devCtr], $(".list", sectionBox) );
						}
						$(".list", sectionBox).append($("<div/>").addClass("clear"));
						break;
					default: break;
				}
			}
		});
		
		// Load license file
		$.get("https://raw.githubusercontent.com/KC3Kai/KC3Kai/master/LICENSE", function(response){
			$(".license_box").html("").append($("<pre>").text(response));
		});
	});
	
	// Add a section of individual contributors
	function addDeveloperCategory(title, targetBox){
		var devcatBox = $("#factory .devCategory").clone();
		$(".devcatTitle", devcatBox).text( KC3Meta.term(title) );
		targetBox.append(devcatBox);
		return $(".devcatList", devcatBox);
	}
	
	// Show one of the developers
	function addDeveloper( info, targetBox ){
		var devBox = $("#factory .devBox").clone();
		
		$(".devAvatar img", devBox).attr("src", info.avatar);
		$(".devName", devBox).text( info.name );
		if(typeof info.desc == "object"){
			var myRoles = [];
			$.each(info.desc, function(i,desc){
				myRoles.push( KC3Meta.term( desc ) );
			});
			$(".devDesc", devBox).append( myRoles.join(",") );
		}else{
			$(".devDesc", devBox).text( KC3Meta.term( info.desc ) );
		}
		
		var linkBox;
		for(var code in info.links){
			linkBox = $("#factory .devLink").clone();
			$("a", linkBox).attr("href", info.links[code] );
			$("img", linkBox).attr("src", "../../assets/img/social/"+code+".png");
			$(".devLinks", devBox).append(linkBox);
		}
		
		if (info.active) {
			targetBox.append(devBox);
		} else {
			devBox.addClass("inactive");
			$("#fameBox").append(devBox);
		}
	}
	
	// Show a partner box
	function addPartner(data, targetBox){
		var partnerBox = $("#factory .partnerBox").clone();
		if (data.image.indexOf("http") > -1) {
			$(".partnerAvatar img", partnerBox).attr("src", data.image);
		} else {
			$(".partnerAvatar img", partnerBox).attr("src", "../../assets/img/partners/"+data.image);
		}
		
		$(".partnerName", partnerBox).text(KC3Meta.term(data.name));
		$(".partnerDesc", partnerBox).text(KC3Meta.term(data.desc));
		
		var partnerLinkBox;
		for (var linkCtr in data.links) {
			partnerLinkBox =  $("#factory .partnerLink").clone();
			$("a", partnerLinkBox).attr("href", data.links[linkCtr]);
			$(".partnerLinks", partnerBox).append(partnerLinkBox);
		}
		// $(".partnerLinks", partnerBox).text();
		targetBox.append(partnerBox);
	}
	
	// Show an item in other credits
	function addOther(data, targetBox){
		var otherBox = $("#factory .otherBox").clone();
		$(".otherName", otherBox).text(data.name);
		
		var appendToBox;
		if (typeof data.link != "undefined") {
			$(".otherDesc", otherBox).html("");
			appendToBox = $("<a>").attr("target", "_blank").attr("href", data.link);
			$(".otherDesc", otherBox).append(appendToBox);
		} else {
			appendToBox = $(".otherDesc", otherBox);
		}
		
		var descCtr;
		for (descCtr in data.desc) {
			appendToBox.append( KC3Meta.term(data.desc[descCtr])+" " );
		}
		
		targetBox.append(otherBox);
	}
	
	// Show a donator box
	function addDonator(data, targetBox){
		var donatorBox = $("#factory .donatorBox").clone();
		$(".donatorName", donatorBox).text(data[0]);
		$(".donatorAmount", donatorBox).text(data[1]);
		targetBox.append(donatorBox);
	}
	
})();