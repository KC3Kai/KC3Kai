(function(){
	"use strict";

	KC3StrategyTabs.mapmarkers = new KC3StrategyTab("mapmarkers");

	KC3StrategyTabs.mapmarkers.definition = {
		tabSelf: KC3StrategyTabs.mapmarkers,

		/* INIT: mandatory
		Prepares initial static data needed.
		---------------------------------*/
		init: function() {
			this.pixiJsUrl = "https://cdnjs.cloudflare.com/ajax/libs/pixi.js/4.8.1/pixi.min.js";
			this.serverIp = (new KC3Server()).setNum(PlayerManager.hq.server).ip;
			this.jsonMaxLength = 60;
			this.world = 1;
			this.map = 1;
			this.zoom = 55;
			this.isShowEdges = true;
			this.isShowEnemies = false;
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
			const updateParams = () => {
				$(".world").val(this.world);
				$(".map").val(this.map);
				$(".zoom").val(this.zoom);
				$(".zoomSlider").val(this.zoom);
				$(".show_edges").prop("checked", this.isShowEdges);
				$(".show_enemies").prop("checked", this.isShowEnemies);
				$(".map_url").val(this.mapInfoMeta || "");
			};
			updateParams();
			const updateMapZoom = (scale) => {
				$(".map_container").css("zoom", scale);
				$(".overlays").css("zoom", scale);
				$(".scrollable").height(720 * scale);
			};
			const buildMapRscUrl = (world, map, file) => {
				const worldStr = String(world).pad(3, '0');
				const mapStr = String(map).pad(2, '0');
				return `http://${this.serverIp}/kcs2/resources/map/${worldStr}/${mapStr}_${file}`;
			};
			const loadMapAssets = () => {
				if(this.isLoading) {
					updateParams();
					return;
				}
				this.isLoading = true;
				$(".loading").css("visibility", "visible");
				this.isShowEdges = $(".show_edges").prop("checked");
				this.isShowEnemies = $(".show_enemies").prop("checked");
				this.mapImgMeta = buildMapRscUrl(this.world, this.map, "image.json");
				this.mapInfoMeta = buildMapRscUrl(this.world, this.map, "info.json");
				this.mapKey = `${String(this.world).pad(3, '0')}${String(this.map).pad(2, '0')}`;
				updateParams();
				this.pixiTextStyle = this.pixiTextStyle || new this.pixi.TextStyle({
					fontFamily: "Arial",
					fontSize: 18,
					fill: "white",
					stroke: '#ff3300',
					strokeThickness: 4,
				});
				const container = new this.pixi.Container();
				const loader = new this.pixi.loaders.Loader();
				loader.add(this.mapImgMeta)
				//.add(`http://${this.serverIp}/kcs2/img/map/map_common.json`)
				.load(() => {
					$.getJSON(this.mapInfoMeta, info => {
						this.mapInfoMeta = info;
						for(const bg of this.mapInfoMeta.bg) {
							const frame = this.pixi.Texture.fromFrame(`map${this.mapKey}_${bg}`);
							container.addChild(new this.pixi.Sprite(frame));
						}
						this.pixiApp.stage.addChild(container);
						if(this.isShowEnemies && this.mapInfoMeta.enemies) {
							for(const enemy of this.mapInfoMeta.enemies) {
								const frame = this.pixi.Texture.fromFrame(`map${this.mapKey}_${enemy.img}`);
								const sprite = new this.pixi.Sprite(frame);
								sprite.position.set(enemy.x, enemy.y);
								this.pixiApp.stage.addChild(sprite);
							}
						}
						if(this.isShowEdges && this.mapInfoMeta.spots) {
							for(const spot of this.mapInfoMeta.spots) {
								const id = spot.no;
								if(!spot.line) continue;
								const frame = this.pixi.Texture.fromFrame(`map${this.mapKey}_${spot.line.img || ("route_" + id)}`);
								const sprite = new this.pixi.Sprite(frame);
								sprite.position.set(spot.x + spot.line.x, spot.y + spot.line.y);
								const bounds = sprite.getBounds();
								const edgeText = new this.pixi.Text(id, this.pixiTextStyle);
								edgeText.anchor.set(0.5, 0.5);
								this.pixiApp.stage.addChild(edgeText);
								edgeText.position.set(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
							}
						}
						this.addMarkers();
						this.isLoading = false;
						$(".loading").css("visibility", "hidden");
					});
				});
			};
			$.cachedScript(this.pixiJsUrl, {}, () => {
				this.pixi = window.PIXI;
				this.pixiApp = this.pixiApp || new this.pixi.Application({
					width: 1200, height: 720,
					transparent: true,
					forceCanvas: true
				});
				this.canvas = this.pixiApp.view;
				$(".map_container").append(this.canvas);
				$(".map_container canvas").css("width", "100%");
				updateMapZoom(this.zoom / 100);
				loadMapAssets();
			});
			$(".world").on("change", e => {
				this.world = Math.max(1, Number($(e.target).val()));
				loadMapAssets();
			});
			$(".map").on("change", e => {
				this.map = Math.max(1, Number($(e.target).val()));
				loadMapAssets();
			});
			$(".zoom").on("change", e => {
				this.zoom = Number($(e.target).val());
				$(".zoomSlider").val(this.zoom);
				updateMapZoom(this.zoom / 100);
			});
			$(".zoomSlider").on("change", e => {
				this.zoom = Number($(e.target).val());
				$(".zoom").val(this.zoom).trigger("change");
			});
			$(".show_edges").on("change", e => {
				loadMapAssets();
			});
			$(".show_enemies").on("change", e => {
				loadMapAssets();
			});
			$(".markers textarea").on("change", e => {
				$(".markers").removeClass("error");
				const json = $(e.target).val();
				try {
					const obj = JSON.parse(json);
					const mapNodes = obj[`World ${this.world}-${this.map}`];
					this.addMarkers(mapNodes);
				} catch(err) {
					$(".markers").addClass("error");
					console.debug("Marker JSON parsing", err);
				}
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

		collectMarkers: function() {
			const mapNodes = {};
			$(".overlay_markers .letter").each((_, el) => {
				const letter = $(el);
				const left = this.cssValue(letter, "left"),
					top = this.cssValue(letter, "top");
				mapNodes.letters = mapNodes.letters || {};
				mapNodes.letters[letter.text()] = [left, top];
			});
			$(".overlay_markers .icon").each((_, el) => {
				const icon = $(el);
				const left = this.cssValue(icon, "left"),
					top = this.cssValue(icon, "top");
				const iconImg = $("img", icon);
				const width = this.cssValue(iconImg, "width"),
					height = this.cssValue(iconImg, "height"),
					imgUri = iconImg.attr("src").substr("/assets/img".length + 1);
				mapNodes.markers = mapNodes.markers || [];
				mapNodes.markers.push({
					"img": imgUri,
					"pos": [left, top],
					"size": [width, height]
				});
			});
			$(".markers textarea").val(
				this.compactStringify(this.buildMapNodesObj(mapNodes),
					{maxLength: this.jsonMaxLength})
			);
		},

		addMarkers: function(mapNodes = KC3Meta.nodes(this.world, this.map)) {
			$(".markers textarea").val(
				this.compactStringify(this.buildMapNodesObj(mapNodes),
					{maxLength: this.jsonMaxLength})
			);
			const letters = mapNodes.letters || {};
			const lettersFound = !!letters && Object.keys(letters).length > 0;
			const icons = mapNodes.markers || [];
			const iconsFound = !!icons.length && icons.length > 0;
			let dragging = null;
			const pointerDownFunc = (e) => {
				// only LMB accepted
				if(e.button !== 0) return;
				let target = $(e.target);
				if(target.get(0).nodeName === "IMG") target = target.parent();
				target.addClass("moving");
				dragging = {
					target: target,
					width: target.outerWidth(),
					height: target.outerHeight(),
				};
				e.preventDefault();
			};
			const pointerUpFunc = (e) => {
				let target = $(e.target);
				if(target.get(0).nodeName === "IMG") target = target.parent();
				target.removeClass("moving");
				if(dragging) {
					$(dragging.target).removeClass("moving");
					const left = this.cssValue($(dragging.target), "left"),
						top = this.cssValue($(dragging.target), "top");
					$(dragging.target).css({
						"left": left + "px", "top": top + "px"
					});
					this.collectMarkers();
				}
				dragging = null;
				e.preventDefault();
			};
			$(".overlay_markers").empty();
			if(lettersFound) {
				for(const l in letters) {
					const letterDiv = $('<div class="letter"></div>').text(l)
						.css("left", letters[l][0] + "px")
						.css("top", letters[l][1] + "px");
					if(l.length > 1) letterDiv.css("font-size", 34 - 6 * l.length);
					$(".overlay_markers").append(letterDiv);
					letterDiv.on("pointerdown", pointerDownFunc).on("pointerup", pointerUpFunc);
				}
			}
			if(iconsFound) {
				for(const i in icons){
					const obj = icons[i];
					const iconImg = $('<img />')
						.attr("src", "/assets/img/" + obj.img)
						.attr("width", obj.size[0])
						.attr("height", obj.size[1]);
					const iconDiv = $('<div class="icon"></div>')
						.css("left", obj.pos[0] + "px")
						.css("top", obj.pos[1] + "px")
						.append(iconImg);
					$(".overlay_markers").append(iconDiv);
					iconDiv.on("pointerdown", pointerDownFunc).on("pointerup", pointerUpFunc);
				}
			}
			$(".overlay_markers").on("pointermove", e => {
				if(dragging) {
					const scale = this.zoom / 100;
					const scrollTop = $(document).scrollTop();
					dragging.target.offset({
						left: Math.floor(e.pageX / scale) - Math.floor(dragging.width / 2),
						top: Math.floor((e.pageY - scrollTop) / scale + scrollTop) - Math.floor(dragging.height / 2),
					});
				}
			}).on("pointerup", pointerUpFunc).on("pointerleave", e => {
				// remove element if pointer out of map canvas
				let target = $(e.target);
				if(target.get(0).nodeName === "IMG") target = target.parent();
				target.removeClass("moving");
				if(dragging) {
					dragging.target.remove();
					this.collectMarkers();
				}
				dragging = null;
				e.preventDefault();
			});
		},

		cssValue: function(elm, attr) {
			return parseInt(elm.css(attr).slice(0, -2), 10);
		},

		buildMapNodesObj: function(values) {
			const mapKey = `World ${this.world}-${this.map}`;
			const mapValues = {};
			mapValues[mapKey] = values;
			return mapValues;
		},

		compactStringify: function(obj, options = {}) {
			const get = (options, name, defaultValue) => (
				name in options ? options[name] : defaultValue
			);
			const indent = JSON.stringify([1], null, get(options, 'indent', '\t')).slice(2, -3);
			const addMargin = get(options, 'margins', false);
			const maxLength = (indent === '' ? Infinity : get(options, 'maxLength', 80));
			const stringOrChar = /("(?:[^\\"]|\\.)*")|[:,\][}{]/g;
			const prettify = (string, addMargin) => {
				const m = addMargin ? ' ' : '';
				const tokens = {
					'{': '{' + m,
					'[': '[' + m,
					'}': m + '}',
					']': m + ']',
					',': ', ',
					':': ': '
				};
				return string.replace(stringOrChar, (match, string) => (string ? match : tokens[match]));
			};
			return (function _stringify (obj, currentIndent, reserved) {
				const string = JSON.stringify(obj);
				if(string === undefined) { return string; }
				const length = maxLength - currentIndent.length - reserved;
				if(string.length <= length) {
					const prettified = prettify(string, addMargin);
					if (prettified.length <= length) {
						return prettified;
					}
				}
				if(typeof obj === 'object' && obj !== null) {
					const nextIndent = currentIndent + indent;
					const items = [];
					let delimiters;
					const comma = (array, index) => (index === array.length - 1 ? 0 : 1);
					if(Array.isArray(obj)) {
						for(let index = 0; index < obj.length; index++) {
							items.push(_stringify(obj[index], nextIndent, comma(obj, index)) || 'null');
						}
						delimiters = '[]';
					} else {
						Object.keys(obj).forEach((key, index, array) => {
							const keyPart = JSON.stringify(key) + ': ';
							const value = _stringify(obj[key], nextIndent, keyPart.length + comma(array, index));
							if (value !== undefined) {
								items.push(keyPart + value);
							}
						});
						delimiters = '{}';
					}
					if (items.length > 0) {
						return [
							delimiters[0],
							indent + items.join(',\n' + nextIndent),
							delimiters[1]
						].join('\n' + currentIndent);
					}
				}
				return string;
			}(obj, '', 0));
		},

	};
})();
