(function(){
	"use strict";

	KC3StrategyTabs.iconmaker = new KC3StrategyTab("iconmaker");

	KC3StrategyTabs.iconmaker.definition = {
		tabSelf: KC3StrategyTabs.iconmaker,

		/* INIT: mandatory
		Prepares initial static data needed.
		---------------------------------*/
		init: function() {
		},

		/* RELOAD: optional
		Loads latest player or game data if needed.
		---------------------------------*/
		reload: function() {
		},

		/* EXECUTE: mandatory
		Places data onto the interface from scratch.
		---------------------------------*/
		execute: function() {
			const iconSize = 70;
			const croppieOptions = {
				boundary: { width: iconSize * 4, height: iconSize * 4 },
				viewport: { width: iconSize, height: iconSize, type: "circle" },
				showZoomer: false,
			};
			const bgColors = ["#0070cc", "#8e0000"];
			let shipId = 0, isDamaged = false, seasonalIdx = 0;
			let imgUrl = "", isAbyssal = false;
			let croppie = $(".crop_container").croppie(croppieOptions),
				pointX = 0, pointY = 0,
				scale = 0.75,
				isLoading = false;
			const bindNewImage = (imgUrl, addExistedRef = true) => {
				isLoading = true;
				$(".loading").show();
				$(".img_url").removeClass("error");
				croppie.croppie("destroy");
				croppie = $(".crop_container").croppie(croppieOptions);
				croppie.croppie("bind", {
					url: imgUrl,
					zoom: scale,
					points: [pointX, pointY, pointX + iconSize / scale, pointY + iconSize / scale],
				}).then(img => {
					$(".cr-image").css("background", bgColors[1 & isAbyssal]);
					$(".loading").hide();
					isLoading = false;
					if(addExistedRef) {
						$(".cropped").append("&nbsp;").append(
							$("<img/>").addClass("existed_icon")
								.attr("src", `/assets/img/${isAbyssal ? "abyss" : "ships"}/${shipId}${isDamaged ? "_d" : ""}.png`)
						);
					}
				}).catch(e => {
					$(".loading").hide();
					isLoading = false;
					$(".img_url").addClass("error");
					console.debug("Image loading failed", e);
					if(addExistedRef && isAbyssal) {
						$(".cropped").append("&nbsp;").append(
							$("<img/>").addClass("existed_icon")
								.attr("src", `/assets/img/abyss/${shipId}$.png`)
						);
					}
				});
			};
			$(".loading").hide();
			$(".ship_id").on("blur", e => {
				if(isLoading) {
					$(".ship_id").val(shipId);
					$(".damaged").prop("checked", isDamaged);
					$(".seasonal").val(seasonalIdx || "");
					return;
				}
				const newShipId = Number($(".ship_id").val());
				const damaged = !!$(".damaged").prop("checked");
				const newSeasonal = Number($(".seasonal").val()) || 0;
				const isNewImage = shipId !== newShipId || damaged !== isDamaged || newSeasonal !== seasonalIdx;
				if(!newShipId || !isNewImage) return;
				shipId = newShipId;
				isDamaged = damaged;
				seasonalIdx = newSeasonal;
				const dbShip = WhoCallsTheFleetDb.db[`s${shipId}`];
				const illustId = seasonalIdx > 0 ? ((dbShip || {}).illust_extra || [])[seasonalIdx - 1] : shipId;
				const imgNo = 8 + (1 & isDamaged);
				const baseUrl = [
					"http://fleet.diablohu.com/!/pics-ships/",
					"http://fleet.diablohu.com/!/pics-ships-extra/"
				][1 & (seasonalIdx > 0)];
				imgUrl = `${baseUrl}${illustId}/${imgNo}.png`;
				$(".img_url").val(imgUrl);
				pointX = 0;
				pointY = 0;
				scale = 0.75;
				bindNewImage(imgUrl, isNewImage);
			});
			$(".damaged").on("change", e => {
				$(".ship_id").blur();
			});
			$(".seasonal").on("change", e => {
				$(".ship_id").blur();
			});
			$(".abyssal").on("change", e => {
				isAbyssal = !!$(".abyssal").prop("checked");
			});
			$(".img_url").on("blur", e => {
				if(isLoading) {
					$(".img_url").val(imgUrl);
					return;
				}
				const newUrl = $(".img_url").val();
				if(newUrl && newUrl !== imgUrl) {
					imgUrl = newUrl;
					bindNewImage(imgUrl, false);
				}
			});
			$(".crop_container").on("update.croppie", (e, data) => {
				$(".crop_info").text(JSON.stringify(data));
				[pointX, pointY] = data.points.map(v => Number(v));
				scale = data.zoom;
				$(".left").val(pointX);
				$(".top").val(pointY);
				$(".zoom").val(scale * 100);
			});
			$(".crop_info").text("{}");
			$(".point.left").on("blur", e => {
				const newLeft = Number($(".point.left").val()) || 0;
				if(newLeft !== pointX) {
					pointX = newLeft;
					bindNewImage(imgUrl, false);
				}
			}).val(pointX);
			$(".point.top").on("blur", e => {
				const newTop = Number($(".point.top").val()) || 0;
				if(newTop !== pointY) {
					pointY = newTop;
					bindNewImage(imgUrl, false);
				}
			}).val(pointY);
			$(".zoom").on("blur", e => {
				const newScale = (Number($(".zoom").val()) || 100) / 100;
				if(newScale !== scale) {
					scale = newScale;
					croppie.croppie("setZoom", scale);
				}
			}).val(scale * 100);
			$(".get_result").on("click", e => {
				croppie.croppie("result", {
					type: "canvas",
					format: "png",
					size: "viewport",
					circle: true,
					backgroundColor: bgColors[1 & isAbyssal],
				}).then(resp => {
					const imgElm = $('<img/>').addClass("cropped_icon")
						.attr("src", resp)
						.attr("alt", `${shipId}${isDamaged ? "_d" : ""}.png`);
					$(".cropped").append(imgElm);
				});
			});
			$(".cropped").on("click", ".cropped_icon", e => {
				$(e.target).remove();
			});
		},

		/* UPDATE: optional
		Partially update elements of the interface,
			possibly without clearing all contents first.
		Be careful! Do not only update new data,
			but also handle the old states (do cleanup).
		Return `false` if updating all needed,
			EXECUTE will be invoked instead.
		---------------------------------*/
		update: function(pageParams) {
			// Use `pageParams` for latest page hash values,
			// KC3StrategyTabs.pageParams keeps the old values for states tracking

			// Returning `true` means updating has been handled.
			return false;
		}
	};
})();
