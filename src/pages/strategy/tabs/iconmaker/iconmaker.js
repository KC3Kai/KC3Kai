(function(){
	"use strict";

	KC3StrategyTabs.iconmaker = new KC3StrategyTab("iconmaker");

	KC3StrategyTabs.iconmaker.definition = {
		tabSelf: KC3StrategyTabs.iconmaker,

		/* INIT: mandatory
		Prepares initial static data needed.
		---------------------------------*/
		init: function() {
			this.iconSize = 70;
			this.croppieOptions = {
				boundary: { width: this.iconSize * 4, height: this.iconSize * 4 },
				viewport: { width: this.iconSize, height: this.iconSize, type: "circle" },
				showZoomer: false,
			};
			this.bgColors = ["#0070cc", "#8e0000"];
			this.shipId = 0;
			this.isDamaged = false;
			this.seasonalIdx = 0;
			this.imgUrl = "";
			this.isAbyssal = false;
			this.pointX = 0;
			this.pointY = 0;
			this.scale = 0.75;
			this.isLoading = false;
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
			// parameters intentionally not to be remembered
			this.imgUrl = "";
			this.isLoading = false;
			
			const updateParams = () => {
				$(".ship_id").val(this.shipId || "");
				$(".damaged").prop("checked", this.isDamaged);
				$(".abyssal").prop("checked", this.isAbyssal);
				$(".seasonal").val(this.seasonalIdx || "");
				$(".img_url").val(this.imgUrl);
			};
			updateParams();
			// event handlers binding
			this.croppie = $(".crop_container").croppie(this.croppieOptions);
			$(".ship_id").on("blur", e => {
				if(this.isLoading) {
					updateParams();
					return;
				}
				const newShipId = Number($(".ship_id").val());
				const damaged = !!$(".damaged").prop("checked");
				const newSeasonal = Number($(".seasonal").val()) || 0;
				const isNewImage = newShipId !== this.shipId
					|| damaged !== this.isDamaged
					|| newSeasonal !== this.seasonalIdx;
				if(!newShipId || !isNewImage) return;
				this.shipId = newShipId;
				this.isDamaged = damaged;
				this.seasonalIdx = newSeasonal;
				const dbShip = WhoCallsTheFleetDb.db[`s${this.shipId}`];
				const illustId = this.seasonalIdx > 0 ? ((dbShip || {}).illust_extra || [])[this.seasonalIdx - 1] : this.shipId;
				const imgNo = 8 + (1 & this.isDamaged);
				const baseUrl = [
					"http://fleet.diablohu.com/!/pics-ships/",
					"http://fleet.diablohu.com/!/pics-ships-extra/"
				][1 & (this.seasonalIdx > 0)];
				this.imgUrl = `${baseUrl}${illustId}/${imgNo}.png`;
				this.bindNewImage(isNewImage);
			});
			$(".damaged").on("change", e => {
				$(".ship_id").blur();
			});
			$(".seasonal").on("change", e => {
				$(".ship_id").blur();
			});
			$(".abyssal").on("change", e => {
				this.isAbyssal = !!$(".abyssal").prop("checked");
			});
			$(".img_url").on("blur", e => {
				if(this.isLoading) {
					$(".img_url").val(this.imgUrl);
					return;
				}
				const newUrl = $(".img_url").val();
				if(newUrl && newUrl !== this.imgUrl) {
					this.imgUrl = newUrl;
					this.bindNewImage(false);
				}
			});
			$(".crop_container").on("update.croppie", (e, data) => {
				$(".crop_info").text(JSON.stringify(data));
				[this.pointX, this.pointY] = data.points.map(v => Number(v));
				this.scale = data.zoom;
				$(".left").val(this.pointX);
				$(".top").val(this.pointY);
				// keep 3 decimals for zoom percent value
				$(".zoom").val(Math.floor(this.scale * 100000) / 1000);
			});
			$(".crop_info").text("{}");
			$(".point.left").on("blur", e => {
				const newLeft = Number($(".point.left").val()) || 0;
				if(newLeft !== this.pointX) {
					this.pointX = newLeft;
					this.bindNewImage(false);
				}
			}).val(this.pointX);
			$(".point.top").on("blur", e => {
				const newTop = Number($(".point.top").val()) || 0;
				if(newTop !== this.pointY) {
					this.pointY = newTop;
					this.bindNewImage(false);
				}
			}).val(this.pointY);
			$(".zoom").on("blur", e => {
				const newScale = (Number($(".zoom").val()) || 100) / 100;
				if(newScale !== this.scale) {
					this.scale = newScale;
					this.croppie.croppie("setZoom", this.scale);
				}
			}).val(this.scale * 100);
			$(".get_result").on("click", e => {
				this.croppie.croppie("result", {
					type: "canvas",
					format: "png",
					size: "viewport",
					circle: true,
					backgroundColor: this.bgColors[1 & this.isAbyssal],
				}).then(resp => {
					const imgElm = $('<img/>').addClass("cropped_icon")
						.attr("src", resp)
						.attr("alt", `${this.shipId}${this.isDamaged ? "_d" : ""}.png`);
					$(".cropped").append(imgElm);
					$(".cropped").show();
					$(".preview img").attr("src", resp);
					$(".preview").show();
				});
			});
			$(".cropped").on("click", ".cropped_icon,.existed_icon", e => {
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
		},

		bindNewImage: function(addExistedRef = true) {
			this.isLoading = true;
			$(".loading").css("visibility", "visible");
			$(".img_url").removeClass("error").val(this.imgUrl);
			this.croppie.croppie("destroy");
			this.croppie = $(".crop_container").croppie(this.croppieOptions);
			this.croppie.croppie("bind", {
				url: this.imgUrl,
				zoom: this.scale,
				points: [this.pointX, this.pointY,
					this.pointX + this.iconSize / this.scale, this.pointY + this.iconSize / this.scale],
			}).then(img => {
				$(".cr-image").css("background", this.bgColors[1 & this.isAbyssal]);
				$(".loading").css("visibility", "hidden");
				this.isLoading = false;
				if(addExistedRef) {
					$(".cropped").append("&nbsp;").append(
					$("<img/>").addClass("existed_icon").attr("src",
						`/assets/img/${this.isAbyssal ? "abyss" : "ships"}/${this.shipId}${this.isDamaged ? "_d" : ""}.png`)
					);
					$(".cropped").show();
				}
			}).catch(e => {
				$(".loading").css("visibility", "hidden");
				this.isLoading = false;
				$(".img_url").addClass("error");
				// for http get exception, `e` will be a event instance instead of Error instance
				console.debug("Image loading failed", e);
				if(addExistedRef && this.isAbyssal) {
					$(".cropped").append("&nbsp;").append(
						$("<img/>").addClass("existed_icon")
							.attr("src", `/assets/img/abyss/${this.shipId}$.png`)
					);
					$(".cropped").show();
				}
			});
		},

	};
})();
