(function(){
	"use strict";

	KC3StrategyTabs.mapmarkers = new KC3StrategyTab("mapmarkers");

	KC3StrategyTabs.mapmarkers.definition = {
		tabSelf: KC3StrategyTabs.mapmarkers,

		/* INIT: mandatory
		Prepares initial static data needed.
		---------------------------------*/
		init: function() {
			this.pixiJsUrl = "https://cdnjs.cloudflare.com/ajax/libs/pixi.js/4.8.8/pixi.min.js";
			this.serverIp = (new KC3Server()).setNum(PlayerManager.hq.server).ip;
			this.jsonMaxLength = 60;
			this.world = 0;
			this.map = 1;
			this.zoom = 55;
			this.isShowEdges = true;
			this.isShowEnemies = false;
			this.isShowArrows = true;
			this.isShowEdgeIds = true;
			this.isShowRedBg = true;
			this.isShowMarkers = true;
			this.isLoading = false;
			this.digEventSpots = false;
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
			const updateMapZoom = (scale) => {
				$(".map_container").css("zoom", scale);
				$(".overlays").css("zoom", scale);
				$(".scrollable").height(720 * scale);
			};
			const initPixiApp = () => {
				this.pixiApp = new this.pixi.Application({
					width: 1200, height: 720,
					transparent: true,
					forceCanvas: true
				});
				this.canvas = this.pixiApp.view;
				$(".map_container").append(this.canvas);
				$(".map_container canvas").css("width", "100%");
				updateMapZoom(this.zoom / 100);
			};
			
			this.updateParams();
			if(this.pixiApp) {
				// Do not reload pixi.js again, and destroy old stage
				this.pixiApp.destroy(true, {children: true});
				initPixiApp();
				// Render map at once if already specified
				if(this.mapInfoMetaUrl) this.loadMapAssets();
			} else {
				$.cachedScript(this.pixiJsUrl, {}, () => {
					window.PIXI.utils.skipHello();
					this.pixi = window.PIXI;
					initPixiApp();
				});
			}
			$(".world").on("change", e => {
				this.world = Math.max(1, Number($(e.target).val()));
				this.loadMapAssets();
			});
			$(".map").on("change", e => {
				this.map = Math.max(1, Number($(e.target).val()));
				this.loadMapAssets();
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
			$(".show_edges, .show_edge_ids, .show_arrows, .show_enemies, .show_red_bg").on("change", e => {
				this.loadMapAssets();
			});
			$(".show_markers").on("change", e => {
				this.isShowMarkers = $(e.target).prop("checked");
				$(".overlay_markers").toggle(this.isShowMarkers);
			});
			const updateMarkersAreaJson = (addElementCallback) => {
				const json = $(".markers textarea").val();
				try {
					const obj = JSON.parse(json);
					const mapNodes = obj[`World ${this.world}-${this.map}`];
					if(typeof addElementCallback === "function") {
						addElementCallback.call(this, mapNodes);
					}
					this.addMarkers(mapNodes);
				} catch(err) {
					$(".markers").addClass("error");
					console.debug("Marker JSON parsing", err);
				}
			};
			$(".markers textarea").on("change", e => {
				$(".markers").removeClass("error");
				updateMarkersAreaJson();
			});
			$("#add_letter").on("click", e => {
				updateMarkersAreaJson((mapNodes) => {
					if(!mapNodes.letters) mapNodes.letters = {};
					const existed = Object.keys(mapNodes.letters);
					const existedAmount = existed.length;
					const lastCharCode = (existed.slice(-1)[0] || "@").charCodeAt(0) || 0;
					const nextLetter = lastCharCode.inside(64, 89) ?
						String.fromCharCode(lastCharCode + 1) : "Z{0}".format(existedAmount + 1);
					mapNodes.letters[nextLetter] = [60, 40 + existedAmount * 24];
				});
			});
			$("#add_icon").on("click", e => {
				updateMarkersAreaJson((mapNodes) => {
					if(!mapNodes.markers) mapNodes.markers = [];
					mapNodes.markers.push({
						"img": "client/fuel.png",
						"pos": [160, 40 + mapNodes.markers.length * 30],
						"size": [27, 27]
					});
				});
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

		updateParams: function() {
			$(".world").val(this.world);
			$(".map").val(this.map);
			$(".zoom").val(this.zoom);
			$(".zoomSlider").val(this.zoom);
			$(".show_edges").prop("checked", this.isShowEdges);
			$(".show_edge_ids").prop("checked", this.isShowEdgeIds);
			$(".show_arrows").prop("checked", this.isShowArrows);
			$(".show_enemies").prop("checked", this.isShowEnemies);
			$(".show_red_bg").prop("checked", this.isShowRedBg);
			$(".show_markers").prop("checked", this.isShowMarkers);
			$(".map_url").val(this.mapInfoMetaUrl || "");
		},

		loadMapAssets: function() {
			if(this.isLoading) {
				this.updateParams();
				return;
			}
			// see `TaskCreateMap.prototype._getPath`
			const getMapRscUrl = (world, map, file) => {
				const worldStr = String(world).pad(3, '0');
				const mapStr = String(map).pad(2, '0');
				return `http://${this.serverIp}/kcs2/resources/map/${worldStr}/${mapStr}_${file}`;
			};
			// api_color_no to common image texture, see `SpotPointImage.prototype._getTexture`
			const getTextureByColorNo = colorNo => {
				switch(colorNo) {
					// -99 undefined in `_getTexture`, used by land base at `AirBaseLayer.prototype.create`
					case -99: return 'map_main_19';
					// -100 undefined either, used by landing flag at `LandingFlag.prototype._getTexture_no`
					case -100: return 'map_main_40';
					// -1 indicates uncommon icon nodes like night battle, air raid, rsc finish line, etc
					case -1:
					// 0 undefined in `_getTexture`, just treat it as -1 default white dot
					case 0: return 'map_main_58';
					case 1: return 'map_main_51';
					case 2:
					case 6: return 'map_main_54';
					case 3: return 'map_main_56';
					case 4: return 'map_main_57';
					case 5: return 'map_main_45';
					case 7: return 'map_main_43';
					case 8: return 'map_main_44';
					case 9: return 'map_main_55';
					case 10: return 'map_main_42';
					case 11: return 'map_main_59';
					case 12: return 'map_main_60';
					case 13: return 'map_main_17';
					// -2 indicates boss node red dot before actually entering map
					case -2: return 'map_main_53';
					// -3 indicates extra start point before actually entering map
					case -3: return 'map_main_50';
					case 14: return 'map_main_51';
					case 15: return 'map_main_18';
				}
			};
			this.isLoading = true;
			$(".loading").css("visibility", "visible");
			this.isShowEdges = $(".show_edges").prop("checked");
			this.isShowEdgeIds = $(".show_edge_ids").prop("checked");
			this.isShowArrows = $(".show_arrows").prop("checked");
			this.isShowEnemies = $(".show_enemies").prop("checked");
			this.isShowRedBg = $(".show_red_bg").prop("checked");
			this.mapImgMetaUrl = getMapRscUrl(this.world, this.map, "image.json");
			this.mapInfoMetaUrl = getMapRscUrl(this.world, this.map, "info.json");
			this.updateParams();
			this.pixiTextStyle = this.pixiTextStyle || new this.pixi.TextStyle({
				fontFamily: "Arial",
				fontSize: 18,
				fill: "white",
				stroke: "#ff3300",
				strokeThickness: 4,
				dropShadow: true,
				dropShadowColor: "#000000",
				dropShadowDistance: 2,
			});
			const mapKey = `${String(this.world).pad(3, '0')}${String(this.map).pad(2, '0')}`;
			const texturePrefix = `map${mapKey}_`;
			const stage = this.pixiApp.stage;
			// Clean up rendered old containers
			const clearStage = (destroyChildren = true) => {
				for(let i = stage.children.length - 1; i >= 0; i--) {
					const child = stage.children[i];
					if(destroyChildren && typeof child.destroy === "function") child.destroy();
					stage.removeChild(child);
				}
			};
			// Render map based on `this.mapInfoMeta`
			const renderMapStage = () => {
				clearStage();
				const bgContainer = new this.pixi.Container();
				for(const bg of this.mapInfoMeta.bg) {
					const textureName = typeof bg === "string" ? bg : bg.img ? bg.img : false;
					if(textureName === false) {
						console.debug("Unknown BG texture:", bg);
						continue;
					}
					if(!this.isShowRedBg && bg.name === "red") {
						continue;
					}
					const frame = this.pixi.Texture.fromFrame(`${texturePrefix}${textureName}`);
					bgContainer.addChild(new this.pixi.Sprite(frame));
				}
				stage.addChild(bgContainer);
				if(this.isShowEdges && this.mapInfoMeta.spots) {
					const edges = {};
					const edgesContainer = new this.pixi.Container();
					const labelsContainer = new this.pixi.Container();
					let isAddingRouteStart = false;
					// Fill edge numbers of lines, colored nodes, etc
					for(const spot of this.mapInfoMeta.spots) {
						const spotCoord = [spot.x, spot.y].join(',');
						edges[spotCoord] = edges[spotCoord] || [];
						edges[spotCoord].push(spot);
						const edge = spot.no;
						// Check if there is unknown spot element
						if(edge && !spot.route && !spot.line) {
							if(isAddingRouteStart || [-3, 8].includes(spot.color)) {
								// Will draw additional start point later by node color -3
								/*
								const frame = this.pixi.Texture.fromFrame(getTextureByColorNo(-3));
								const sprite = new this.pixi.Sprite(frame);
								sprite.position.set(spot.x - sprite.width / 2, spot.y - sprite.height / 2);
								stage.addChild(sprite);
								*/
							} else if(KC3Meta.isEventWorld(this.world)) {
								// Except adding a hidden start point, no line no route spot found (nothing to be drawn) since Fall 2020 E-3
								// btw an orphan boss node (not linked with any other node) has existed since Rainy 2020 E-3
								// an orphan finish line node (color 8) visible from phase 1, linked in later phases, since Summer 2021 E-3
								console.debug("Unknown invisible spot:", spot, this.mapInfoMeta.spots);
								spot.unknown = true;
							}
						}
						if(!spot.line) continue;
						const isAddingRoute = !!spot.route || spot.no >= this.mapInfoMeta.initSpotCnt;
						isAddingRouteStart |= isAddingRoute;
						const textureName = spot.line.img || (isAddingRoute && spot.route.img) || "route_" + edge;
						const frame = this.pixi.Texture.fromFrame(`${texturePrefix}${textureName}`);
						const sprite = new this.pixi.Sprite(frame);
						sprite.position.set(spot.x + spot.line.x, spot.y + spot.line.y);
						// Fill lines of additional routes
						if(isAddingRoute) stage.addChild(sprite);
						const bounds = sprite.getBounds();
						const fromSpot = {x: bounds.x + bounds.width, y: bounds.y + bounds.height};
						if(spot.line.x < 0) fromSpot.x += spot.line.x;
						if(spot.line.y < 0) fromSpot.y += spot.line.y;
						const angle = Math.atan2(spot.y - fromSpot.y, spot.x - fromSpot.x);
						// Show Landing flag icon beside transport point if any
						if(spot.landing) {
							const flagInfo = spot.landing;
							const frame = this.pixi.Texture.fromFrame(getTextureByColorNo(-100));
							const sprite = new this.pixi.Sprite(frame);
							sprite.position.set(spot.x + flagInfo.x, spot.y + flagInfo.y - frame.height);
							stage.addChild(sprite);
						}
						// Draw an arrow to indicate the edge direction
						if(this.isShowArrows) {
							const grp = new this.pixi.Graphics();
							grp.setTransform(
								spot.x + (fromSpot.x - spot.x) / 2,
								spot.y + (fromSpot.y - spot.y) / 2,
								1, 1, angle);
							const arrowHeight = 18, arrowColor = 0xcdcde9;
							grp.lineStyle(2, arrowColor, 1);
							grp.moveTo(0, 0);
							grp.beginFill(arrowColor);
							grp.lineTo(-arrowHeight, -arrowHeight / 1.5);
							grp.lineTo(-arrowHeight / 1.4, 0);
							grp.lineTo(-arrowHeight, +arrowHeight / 1.5);
							grp.lineTo(0, 0);
							grp.endFill();
							stage.addChild(grp);
						}
						// Show edge numbers
						if(this.isShowEdgeIds) {
							const edgeText = new this.pixi.Text(edge, this.pixiTextStyle);
							edgeText.anchor.set(
								1.5 * (Math.abs(angle) / Math.PI),
								Math.abs(spot.y - fromSpot.y) < 100 ? 0.5 : 0.5 - 0.5 * Math.sign(spot.y - fromSpot.y)
							);
							edgeText.position.set(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
							edgesContainer.addChild(edgeText);
						}
					}
					// Fill labels of additional nodes
					if(Array.isArray(this.mapInfoMeta.labels)) {
						for(const label of this.mapInfoMeta.labels) {
							const frame = this.pixi.Texture.fromFrame(`${texturePrefix}${label.img}`);
							const sprite = new this.pixi.Sprite(frame);
							sprite.position.set(label.x, label.y);
							labelsContainer.addChild(sprite);
						}
					}
					// Fill node spot colors/icons if master mapcell data ready or additional route
					for(const edgeKey of Object.keys(edges)) {
						const edge = edges[edgeKey];
						const node = edge[0];
						node.color = KC3Master.mapCell(this.world, this.map, node.no).api_color_no || node.color;
						// Replace -1 with air raid icon 10 if indicated by airraids definition
						if(node.color === -1 && Array.isArray(this.mapInfoMeta.airraids)
							&& this.mapInfoMeta.airraids.map(ar => ar.no).includes(node.no)) {
							node.color = 10;
						}
						// Show blue dot for branching node by default if any
						if((!node.color || node.color === -1) && node.branch) {
							node.color = 1;
						}
						// Show green dot for landing node by default if any
						if((!node.color || node.color === -1) && node.landing) {
							node.color = 2;
						}
						if(node.no && (node.color || node.route || node.line)
							// To keep red dot for both initial (undefined) and added (-2) boss node
							&& (node.color || node.no >= this.mapInfoMeta.initSpotCnt)) {
							const frame = this.pixi.Texture.fromFrame(getTextureByColorNo(node.color || 0));
							const sprite = new this.pixi.Sprite(frame);
							let offsetX = 0, offsetY = 0;
							if(node.color === 5) offsetY = -5;
							if(node.offsets && node.offsets[node.color]) {
								offsetX = node.offsets[node.color].x;
								offsetY = node.offsets[node.color].y;
							}
							sprite.anchor.set(0.5, 0.5);
							sprite.position.set(node.x + offsetX, node.y + offsetY);
							stage.addChild(sprite);
							// Mark unknown node with yellow box
							if(node.unknown) {
								const grp = new this.pixi.Graphics();
								grp.lineStyle(2, 0xffff00, 1);
								grp.drawRect(node.x, node.y, 20, 20);
								stage.addChild(grp);
							}
						}
					}
					stage.addChild(edgesContainer);
					stage.addChild(labelsContainer);
				}
				// Show Land base 'AB' icon if exists
				if(this.mapInfoMeta.airbase) {
					const airbase = this.mapInfoMeta.airbase;
					const frame = this.pixi.Texture.fromFrame(getTextureByColorNo(-99));
					const sprite = new this.pixi.Sprite(frame);
					sprite.anchor.set(0.5, 0.5);
					sprite.position.set(airbase.x, airbase.y);
					stage.addChild(sprite);
				}
				// Show possibly multiple 'AB' icons for event maps
				if(Array.isArray(this.mapInfoMeta.airbases)) {
					this.mapInfoMeta.airbases.forEach(elm => {
						const airbase = elm.point;
						const frame = this.pixi.Texture.fromFrame(getTextureByColorNo(-99));
						const sprite = new this.pixi.Sprite(frame);
						sprite.anchor.set(0.5, 0.5);
						sprite.position.set(airbase.x, airbase.y);
						stage.addChild(sprite);
					});
				}
				if(this.isShowEnemies && this.mapInfoMeta.enemies) {
					for(const enemy of this.mapInfoMeta.enemies) {
						const frame = this.pixi.Texture.fromFrame(`${texturePrefix}${enemy.img}`);
						const sprite = new this.pixi.Sprite(frame);
						sprite.position.set(enemy.x, enemy.y);
						stage.addChild(sprite);
					}
				}
				this.addMarkers();
				$(".overlays").show();
				this.isLoading = false;
				$(".loading").css("visibility", "hidden");
			};
			const loader = new this.pixi.loaders.Loader();
			// Register error handler
			loader.onError.add(err => {
				$(".map_url").addClass("error");
				console.debug(err);
				this.isLoading = false;
				$(".loading").css("visibility", "hidden");
			});
			loader.add(this.mapImgMetaUrl)
			.add(`http://${this.serverIp}/kcs2/img/map/map_main.json`)
			.load((thisLoader, res) => {
				if(!this.isLoading) {
					clearStage();
					$(".overlays").hide();
					return;
				}
				$(".map_url").removeClass("error");
				$.getJSON(this.mapInfoMetaUrl, info => {
					this.mapInfoMeta = info;
					const initSpotCnt = this.mapInfoMeta.spots.length;
					let currentSpotCnt = initSpotCnt, addedSpotCnt = 0;
					const knownTotalSpotCnt = Object.keys(KC3Master.mapCell(this.world, this.map)).length;
					info.initSpotCnt = initSpotCnt;
					info.knownTotalSpotCnt = knownTotalSpotCnt;
					info.totalSpotCnt = currentSpotCnt;
					// Confirmed condition if nodes amount at first not reach expected one
					if((this.digEventSpots || knownTotalSpotCnt > currentSpotCnt) && this.isShowEdges) {
						// Additional info (hidden nodes), see `TaskCreateMap.prototype._loadAddingInfo`
						const loadAdditonalInfo = () => {
							const additionalUrl = getMapRscUrl(this.world, this.map, `info${currentSpotCnt}.json`);
							$.getJSON(additionalUrl, addingInfo => {
								if(addingInfo.bg) info.bg.push(...addingInfo.bg);
								if(addingInfo.spots) info.spots.push(...addingInfo.spots);
								if(addingInfo.enemies) {
									info.enemies = info.enemies || [];
									info.enemies.push(...addingInfo.enemies);
								}
								if(addingInfo.airraids) {
									info.airraids = info.airraids || [];
									info.airraids.push(...addingInfo.airraids);
								}
								if(addingInfo.labels) {
									info.labels = info.labels || [];
									info.labels.push(...addingInfo.labels);
								}
								if(addingInfo.airbases) {
									info.airbases = info.airbases || [];
									info.airbases.push(...addingInfo.airbases);
								}
								const foundSpotCnt = (addingInfo.spots || []).length;
								addedSpotCnt += foundSpotCnt;
								console.debug("Found additional spots", foundSpotCnt,
									"merged to previous", currentSpotCnt,
									this.mapInfoMeta);
								loader.add(getMapRscUrl(this.world, this.map, `image${currentSpotCnt}.json`));
								currentSpotCnt += foundSpotCnt;
								info.totalSpotCnt = currentSpotCnt;
								if(this.digEventSpots || !knownTotalSpotCnt || currentSpotCnt < knownTotalSpotCnt) {
									loadAdditonalInfo();
								} else if(currentSpotCnt >= knownTotalSpotCnt) {
									console.debug(`Found ${currentSpotCnt} /${knownTotalSpotCnt} spots totally`);
									loader.load(() => { renderMapStage(); });
								}
							}).fail(xhr => {
								console.debug("No more additional spot found");
								if(knownTotalSpotCnt > currentSpotCnt + addedSpotCnt) {
									console.debug(`Expected spots amount ${knownTotalSpotCnt} not met by ${initSpotCnt} + additional ${addedSpotCnt}, more hidden nodes existed?`);
								}
								if(currentSpotCnt > initSpotCnt) {
									console.debug(`Found ${currentSpotCnt} /${knownTotalSpotCnt} spots totally`);
									loader.load(() => { renderMapStage(); });
								} else {
									renderMapStage();
								}
							});
						};
						loadAdditonalInfo();
					} else {
						renderMapStage();
					}
				});
			});
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
			$(".overlay_markers").toggle(this.isShowMarkers);
		},

		cssValue: function(elm, attr) {
			// seems some values will be changed under some zoom scale?
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
