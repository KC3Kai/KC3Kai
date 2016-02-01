(function(){
	"use strict";
	/*jshint: validthis true*/
	
	KC3StrategyTabs.overlodger = new KC3StrategyTab("overlodger");
	
	/* Local Variables
	------------------------------------------------ */
	
	var
		ctx = this,
		
		CONST          = {
			ratingMagnitude:      5, /* Maximum magnitude */
			ratingOffset   :     +5, /* Base offset magnitude */
			ratingHScore   :    0.2, /* Half of the score */
			
			materialPeak   : function(i){return [ 20000, 20000, 20000, 10000][i];},
			consumePeak    : function(i){return [    50,    30,    20,    10][i];},
			
			resourcePeak   : function(i){return this[[(i>=4) ? 'consume' : 'material','Peak'].join('')](i%4); },
			dayScaleCoef   : function(d){
				return Math.pow(1+(Math.log(d)/Math.log(7)),2);
			},
		},
		
		iconData       = ["fuel","ammo","steel","bauxite","ibuild","bucket","devmat","screws"],
		tDurEnum       = {
			0:['Time' ,1,'Whole'  ,  0],
			1:['Date' ,1,'Daily'  ,  1],
			2:['Week' ,1,'Weekly' ,  3],
			4:['Month',1,'Monthly', 15],
			8:['Year' ,1,'Yearly' , 60]
		},
		tShutsuEnum    = [
			['Any'  ,'norq',false],
			['Basic','rqbs',false],
			['Extra','rqex', true],
			['Event','rqev', true],
		],
		tEventEnum     = {
			//    Key Name         Clear AlClr
			 '0':['All Sortie'    ,false,false],
			 '1':['Clear Stage'   ,false,false],
			'-1':['Extra Stage'   , true,false],
			 '2':['Clear Event'   , true, true],
			'-2':['Extra Event'   , true, true],
			 '3':['All Basic Runs',false,false],
			'-3':['All Extra Runs', true,false],
		},
		dataType       = [
			// Apply grouping
			['sortie','pvp'   ,'exped' ,'quest' ,'akashi' ,'regen'  ,'useitem'],
			['crship','critem','dsship','dsitem','remodel','rmditem','overall']
		],
		dataScale      = [
			1.0, 4.0, 2.5, 2.0, 2.5,25.0, 3.0,
			1.0, 2.0, 4.0, 4.0, 4.0, 2.0, 1.0,
		],
		mapWorldDesc   = function(map_id){
			var 
				mapLocal = {
					string: ["Naval Base","Southwestern","Northern","Western","Southern","Central"]
						.map(function(str){return [str,'Area'].join(' ');}),
					value : [ 1,undefined]
				},
				mapEvent = {
					string: ["Winter","Spring","Summer","Fall"],
					value : [21,2013]
				},
				mapDesc;
			
			mapDesc = (function(array_data,array_index){
				var
					entryLimit = array_data.string.length,
					selectedIndex = (array_index - array_data.value[0]);
				
				return [
					array_data.string.slice( selectedIndex % entryLimit ).shift(),
					array_data.value[1] + parseInt(selectedIndex / entryLimit,10)
				].filter(function(str){return str;}).join(' ');
			})((map_id < 10) ? mapLocal : mapEvent,map_id);
			
			return [Number(map_id).toDigits(2), mapDesc ].join(': ');
		},
		
		mapBuffer = {},
		allBuffer = [],
		sortieCache = (function(){
			function KC3SortieCacheMapInfo(){}
			return new KC3SortieCacheMapInfo();
		})(),
		ledgerCache = (function(){
			function KC3LedgerCacheMapInfo(){}
			return new KC3LedgerCacheMapInfo();
		})(),
		lookupBound = [-Infinity,+Infinity],
		polarityRating = [0,0],
		
		
		dateFormatYMDH = "yyyy-mm-dd'T'HH:00:00",
		bufferCancel = false,
		baseContext;
	
	$.extend(this,Object.freeze(CONST));
	
	/* Page definition
	------------------------------------------------ */
	
	KC3StrategyTabs.overlodger.definition = {
		tabSelf: KC3StrategyTabs.overlodger,
		
		timeRange: {
			/*
				0 - whole
				1 - day
				2 - week
				4 - month
				8 - year
			*/
			duration: 1,
			
			/*
				true  - looks 1 time scale behind
				false - looks around current time scale
			*/
			scope: true,
			rate: 1,
			/* Convention (defined later)
				0 - Standard Convention : 0 AM start of a day, Sunday start of a week
				1 - Tanaka Convention   : 5 AM start of a quest day, Monday start of a quest week
				
				TODO: not sure to put this or not.
			*/
			convention: null,
		},
		
		sortie: (function(){
			function KC3LodgerSortieConfig(){
				/*
					1 - Basic Sortie
					2 - Extra Sortie
					3 - Event Sortie
				*/
				var f,w,m,p;
				Object.defineProperties(this,{
					Filter: {
						get: function( ){return f || 0;},
						set: function(x){f = Math.max(0,Math.min( 3,Number(x) || 0)); this.World = null;}
					},
					World : {
						get: function( ){return w || 0;},
						set: function(x){w = Math.max(0,Math.min(99,Number(x) || 0)); this.Map   = null;}
					},
					Map   : {
						get: function( ){return m || 0;},
						set: function(x){m = Math.max(0,Math.min( 9,Number(x) || 0)); this.Period= null;}
					},
					Period: {
						get: function( ){return p || 0;},
						set: function(x){p = (isFinite(x) && !isNaN(x) && Number(x) || 0);}
					}
				});
			}
			return new KC3LodgerSortieConfig();
		})(),
		
		filter: {},
		dataBuffer: {},
		totalBuffer: [],
		flatBuffer: [],
		sortieBuffer: {},
		sortieRange: {},
		
		wholeSortieFilter: (function(){
			var
				cacheKeyFX  = [0,0,0,0,0],
				cacheKeyMD  = [0,0,0,0,0],
				funcac = {},cx;
			function cache(x,f,w,m,p,r) {
				// x - ledger id
				// f - filter
				// w - world id
				// m - map id
				// p - period code
				// r - result
				var k = [x,f,w,m,p].map(Number).join('-');
				return (typeof funcac[k] !== 'boolean') ? (
					(typeof r == 'boolean') ? (funcac[k] = r) : (undefined)
				) : (funcac[k]);
			}
			var retfun = function(key,data,index,array){
				var self = this;
				if(self != cx){cx = self;}
				if(this.timeRange.duration){
					return true;
				} else {
					/* Sortie Filter
					
					Filter
						0 - all sortie
						1 - basic non-EO  sortie
							map to match: World 1-9, Map 1-4
						2 - basic EO-only sortie
							map to match: World 1-9, Map 5-9
							period match: Monthly
						3 - event sortie
							map to match: World 10-99, Map 1-9
							period match: Eventual State (8 state)
						
					World
						0 - does no filtering
						
					Map
						0 - does no filtering
						
					EO Period
						0 - does no filtering
						N - apply on specific month
					
					Event Period
						0 - does no filtering
						1 - start sortie until clear the map
						2 - start sortie until clear the event
						3 - only sortie
					*/
					
					cacheKeyFX[0] = data.id;
					(function(){
						cacheKeyFX[1] = this.Filter;
						cacheKeyFX[2] = this.World;
						cacheKeyFX[3] = this.Map;
						cacheKeyFX[4] = this.Period;
					}).call(this.sortie);
					
					var
						cacheD       = cache.apply(null,cacheKeyFX),
						sortieD      = $.extend([],(key !== 'sortie') ? null : this.sortieBuffer[data.opt]),
						rqMapBound   = [[ 1, 9],[ 1, 4]],
						rqMapMatch   = false,
						rqBoundMatch = false,
						rqMonthMatch = false,
						rqEventMatch = false;
					
					if(typeof cacheD == 'boolean') { return cacheD; }
					switch(this.sortie.Filter){
						case 0:
							return true;
						case 1:
							rqMapMatch   = true;
							rqBoundMatch = true;
							break;
						case 2:
							rqMapBound[1]= [ 5, 9];
							
							rqMapMatch   = true;
							rqBoundMatch = true;
							rqMonthMatch = true;
							break;
						case 3:
							rqMapBound[0]= [10,99];
							rqMapBound[1]= [ 0, 9];
							
							rqMapMatch   = (this.sortie.Period % 3 === 0);
							rqBoundMatch = true;
							rqEventMatch = true;
							break;
					}
					
					if(rqMapMatch && !sortieD.length) return false;
					
					var
						chkBound = (
							rqBoundMatch ? (
								(sortieD || []).every(function(mapCode,bIdx){ return mapCode ? (0).inside.apply(mapCode,rqMapBound[bIdx]) : true; })) : true
						),
						chkWorld = (
							rqMapMatch ? (
								(!this.sortie.World || !sortieD || sortieD[0] == this.sortie.World) &&
								(!this.sortie.Map   || !sortieD || sortieD[1] == this.sortie.Map  )
							) : true
						),
						chkMonth = (
							rqMonthMatch ? (
								!this.sortie.Period || !sortieD || (function(cDate,mnhour){
									var mxhour = Math.hrdInt('floor',(new Date(mnhour * 3600000)).shiftMonth(0,true)/3.6,6,1);
									return Math.hrdInt('floor',cDate/3.6,3,1).inside(mnhour,mxhour);
								}).call(null,sortieD.time,this.sortie.Period)
							) : true
						),
						chkEvent = (
							rqEventMatch ? (function(ledger_type){
								var
									rs = false,
									sr = [0,Infinity,Infinity,0],
									er = [0,Infinity,Infinity,0],
									
									lt = parseInt(Math.abs (ledger_type),10),
									gs = Math.sign(ledger_type),
									fc = gs >= 0,
									cx = gs <= 0,
									fi = {w:self.sortie.World,m:self.sortie.Map},
									
									rg = function(x,i){switch(lt){
										case  1: return (i <= 1);           // F C
										case  2: return (i >= 1);           //   C L X
										default: return (i %  2 == lt %  2); // F   L
									}};
								
								cacheKeyMD[0] = cacheKeyFX[0];
								cacheKeyMD[1] = cacheKeyFX[1];
								cacheKeyMD[4] = cacheKeyFX[4];
								
								try {
									if(lt > 0) {
										return (fi.w ? [fi.w] : Object.keys(ledgerCache)).some(function(wr){
											var sw = ledgerCache[wr],sc;
											er = [sw.first,sw.clear,sw.last,0].map(function(dt,id){
												return dt || er[id]; });
											cacheKeyMD[2] = Number(wr);
											
											switch(lt % 3) {
													// logic :
													// 1 - 
													//   0-0 => World Num iteration (n^2)
													//     31-1,31-2,...,31-7,32-1,32-2,...,32-5,etc.
													//   M-0 => Fixed World iteration (n)
													//     31-1,31-2,...,31-7.
													//   M-N => Single-range iteration (1)
													// 2 - 
													//   0-0 => World Num iteration (n)
													//     31-0,32-0,...,etc.
													//   M-0 => Single-range iteration (1)
													//     31-0
													//   M-N => Reduced Scope iteration (1)
													// 3 - only allow sortie ID inside specified range (FC/CLX ranges)
												case 1:
													return ((fi.w && fi.m) ? [fi.m] : Object.keys(sw)).some(function(nm){
														cacheKeyMD[3] = Number(nm);
														cacheD = cache.apply(null,cacheKeyMD);
														if(typeof cacheD == 'boolean') { return cacheD; }
														
														sc = sw[nm];
														sr = [sc.first,sc.clear,sc.last,0].map(function(dt,id){
															return dt || sr[id]; });
														return cache.apply(null, cacheKeyMD.concat( (0).inside.apply(data.id,sr.filter(rg)) ) );
													});
												case 2:
													cacheKeyMD[3] = Number(fi.m);
													cacheD = cache.apply(null,cacheKeyMD);
													if(typeof cacheD == 'boolean') { return cacheD; }
													
													sc = sw[fi.m];
													sr = [sc.first,sw.clear,sw.last,0].map(function(dt,id){
														return dt || sr[id]; });
													return cache.apply(null, cacheKeyMD.concat( (0).inside.apply(data.id,sr.filter(rg)) ) );
												default:
													cacheKeyMD[3] = Number(fi.m);
													cacheD = cache.apply(null,cacheKeyMD);
													if(typeof cacheD == 'boolean') { return cacheD; }
													
													sc = sortieCache[wr][fi.m];
													sr = [sc.sortieFirst,sw.sortieClear,sw.sortieLast,0].map(function(dt,id){
														return dt || sr[id]; });
													return cache.apply(null, cacheKeyMD.concat( (0).inside.apply(data.opt,sr.filter(rg)) ) );
											}
										});
									}
								} catch (e) {
									console.error(e); // Accessing non exists ledger data
									return false;
								} finally {
									return true;
								}
							})(this.sortie.Period) : true
						);
					
					return chkBound && chkWorld　&& chkMonth && chkEvent;
				}
			};
			return $.extend(retfun,{cache:funcac});
		})(),
		
		dataRating: 0,
		
		/* INIT
		Prepares all data needed
		---------------------------------*/
		init :function(){
			var self = this;
			baseContext = ".tab_overlodger";
			
			dataType.reduce(function(x,y){return x.concat(y);}).forEach(function(filterKey){
				self.filter[filterKey] =
					(typeof self.filter[filterKey] != 'boolean') || self.filter[filterKey];
				self.dataBuffer[filterKey] = [];
			});
			
			Object.defineProperties(this.timeRange,{
				convention:{
					get: function(){ ConfigManager.load(); return Number(ConfigManager.ledger_convention) || 0; },
					set: function(value){ ConfigManager.ledger_convention = isFinite(value) && value || 0; ConfigManager.save(); }
				},
			});
			
			Object.defineProperties(this.sortieBuffer,{
				length:{ get: function(){return Object.keys(this).length; } },
			});
			
			refreshCurrentBuffer.call(self);
		},
		
		/* EXECUTE
		Places data onto the interface
		---------------------------------*/
		execute :function(){
			var
				self = this,
				mdb  = localStorage.getObject('maps');
			
			// Refresh Map Data Buffer
			$.each(mapBuffer,function(k,v){ delete mapBuffer[k]; });
			$.each(sortieCache,function(k,v){ delete sortieCache[k]; });
			$.each(ledgerCache,function(k,v){ delete ledgerCache[k]; });
			
			mapBuffer[0] = 0;
			
			Object.keys(mdb)
				.map(function(mapKey){ return /m(\d+)(\d)/.exec(mapKey); })
				.filter(function(mapData){ return mapData; })
				.map(function(mapData){ return mapData.slice(1); })
				.sort(function(lhs,rhs){
					return Array.apply(null,lhs)
						.map(function(x,ind){ return Math.sign(lhs[ind] - rhs[ind]); })
						.reduce(function(preComp,curComp){ return preComp || curComp; },0);
				})
				.forEach(function(mapData){
					var
						wr = mapData[0],
						nm = mapData[1],
						md = mdb[['m'].concat(mapData).join('')];
					mapBuffer[wr] = Math.max(mapBuffer[wr] || 1,nm);
					
					if(md.stat) {
						var 
							worldData = (sortieCache[wr] = $.extend(new KC3SortieCacheMapWorld(),sortieCache[wr])),
							wmapData  = (worldData[nm]   = new KC3SortieCacheMapSpec()),
							
							lwd = (ledgerCache[wr] = $.extend(new KC3LedgerCacheMapWorld(),ledgerCache[wr])),
							lmd = (lwd[nm]         = new KC3LedgerCacheMapSpec());
						
						wmapData.clear = md.stat.onClear;
						worldData.clear = (typeof(worldData.onClear) == 'undefined' ? true : worldData.clear) && md.stat.onClear;
						
						Object.defineProperties(wmapData,{
							sortieFirst: { get: function(){ return Number((self.sortieRange[[wr,nm].join('')] || [null]).slice( 0).shift()); } },
							sortieLast : { get: function(){ return Number((self.sortieRange[[wr,nm].join('')] || [null]).slice(-1).shift()); } },
							ledgerFirst: { get: function(){
								var self = this;
								return (activeSelf.dataBuffer.sortie.slice().reverse().find(function(x){
									return Number(x.opt).inside(self.sortieFirst,self.sortieLast);
								})||{id:null}).id;
							} },
							ledgerClear: { get: function(){
								return (activeSelf.dataBuffer.sortie.slice().reverse().find(function(x){ return wmapData.clear == x.opt;
									})||{id:null}).id;
							} },
							ledgerLast : { get: function(){
								var self = this;
								return (activeSelf.dataBuffer.sortie.slice().reverse().find(function(x){return self.sortieLast && (Number(x.opt) >= self.sortieLast);})||{id:null}).id;
							} },
						});
						Object.defineProperties(worldData,{
							sortieFirst: { get: function(){ return worldData[1].sortieFirst; } },
							sortieLast : { get: function(){
								var nonEmptySortie = 0;
								while( worldData[++nonEmptySortie].sortieLast ) {}
								try { return worldData[--nonEmptySortie].sortieLast; } catch (e) { return 0; }
							} },
							ledgerFirst: { get: function(){ return worldData[1].ledgerFirst; } },
							ledgerClear: { get: function(){
								var nonClearLedger = 0;
								while( worldData[++nonClearLedger].ledgerClear ) {}
								try { return worldData[nonClearLedger].ledgerClear; } catch (e) { return null; }
							} },
							ledgerLast : { get: function(){
								var nonEmptyLedger = 0;
								while( worldData[++nonEmptyLedger].ledgerLast ) {}
								try { return worldData[--nonEmptyLedger].ledgerLast; } catch (e) { return null; }
							} },
							0          : { get: function(){ return this; } },
						});
						
						Object.defineProperties(lmd,{
							range : {value:function( t ){
								return [this.first,this.clear,this.last,0].filter(function(x,i){switch(Number(t)){
									case  1: return (i <= 1);           // F C
									case  2: return (i >= 1);           //   C L X
									default: return (i %  2 == t %  2); // F   L
								}});
							}},
							inside: {value:function(a,b){ return Number(a) && (0).inside.apply(Number(a),this.range(b));}},
							
							first : {get  :function(   ){ return wmapData.ledgerFirst; }},
							clear : {get  :function(   ){ return wmapData.ledgerClear; }},
							last  : {get  :function(   ){ return wmapData.ledgerLast;  }},
						});
						Object.defineProperties(lwd,{
							0     : {get  :function(   ){ return this; }},
							range : {value:function( t ){ return Object.keys(this).reduce(function(tary,nkey){
								tary.push(this[nkey].range(t)); return tary; }.bind(this),[]); }},
							inside: {value:function(a,b){ return Object.keys(this).some(function(k){
									return this[k].inside(a,b); }.bind(this)); }},
							find  : {value:function(a,b){ return Object.keys(this).find(function(k){
									return this[k].inside(a,b); }.bind(this))||null; }},
							
							first : {get  :function(   ){ return worldData.ledgerFirst; }},
							clear : {get  :function(   ){ return worldData.ledgerClear; }},
							last  : {get  :function(   ){ return worldData.ledgerLast;  }},
						});
					}
				});
			console.log(sortieCache,ledgerCache);
			
			$.each(mapBuffer,function(k,v){
				mapBuffer[k] = v = Object.freeze(
					Object.defineProperties(new KC3PrimitiveWrapper(),{
						toString: { value: String.prototype.toString.bind( Number(k) ? mapWorldDesc(k) : "All worlds" ) },
						valueOf : { value: Number.prototype.valueOf.bind(  v  ) }
					})
				);
			});
			
			// Factory cloning
			$.each(tDurEnum,function(k,v){
				var fTypeBox = $(".factory .base-radio",baseContext).clone()
					.removeClass('base-radio').addClass('filterType');
				
				$("input",fTypeBox).attr('name','range-type').val(parseInt(k,10));
				$(".filterText",fTypeBox).text(KC3Meta.term('LodgerTime' + v[2]));
				
				fTypeBox.insertBefore(".filterRangeLen");
			});
			
			$.each(iconData,function(k,v){
				var
					targetBox = $(".factory .lodger-data .materials",baseContext),
					mDataBox  = $(".factory .material.base-material",baseContext).clone();
				
				$("img",mDataBox).attr('src',['../../../../assets/img/client/',v,'.png'].join(''));
				mDataBox
					.addClass([v,k < 4 ? 'rsc' : 'csm'].join(' '))
					.removeClass('base-material')
					.insertBefore($(".clear",targetBox));
			});
			
			$.each(self.filter,function(k,v){
				var notWholeItem = (k!=='overall');
				
				// Filter Checklist
				if(notWholeItem) {
					var
						fDataBox = $(".factory .filterData",baseContext).clone(),
						tgElm    = [".filter_data",['DB','MS'][
							dataType
								.map(function(filterKey,index){ return (filterKey.indexOf(k) >= 0) ? index : undefined; })
								.filter(function(udfFlag){ return typeof udfFlag == 'number'; })
								.pop()
						]].join('');
					
					$('input',fDataBox).prop('checked',v).data('ref',k);
					$('.filterText',fDataBox).text(KC3Meta.term('Lodger' + (function trickProperCase(str){
						return str.slice(0,1).toUpperCase() + str.slice(1).toLowerCase();
					})(k)));
					
					fDataBox.appendTo(tgElm);
				}
				
				// Rating Data
				var
					ratingBox = $(".factory .lodger-data",baseContext).clone();
				ratingBox.addClass(k).appendTo($(".lodger-statistics",baseContext)).hide();
			});
			
			$.each(tShutsuEnum,function(k,v){
				var fTypeBox;
				
				// Sortie Group Filter
				fTypeBox = $(".factory .base-radio",baseContext).clone()
					.removeClass('base-radio').addClass('filterSType');
				
				$("input",fTypeBox)
					.attr('name','sortie-scope').val(k)
					.data('addition',v[1]);
				$(".filterText",fTypeBox).text(v[0]);
				
				fTypeBox.insertBefore($(".filterMapTypes > .clear",baseContext));
				
				// Sortie Period Filter
				if(v[2]) {
					fTypeBox = $("<select></select>").addClass(['period',v[0]].join(''));
					
					fTypeBox.appendTo(".filterMapPeriod");
				}
			});
			
			// Generate Map World List
			$.each(mapBuffer,function(k,v){
				var
					mapDataBuffer = localStorage.getObject('maps'),
					
					is = Object.defineProperties({},{
						wildCard: { get: function(){ return !Number(k); } },
						eventMap: { get: function(){ return this.wildCard || k >= 10; } },
						basicMap: { get: function(){ return this.wildCard || k <  10; } },
						basicEO : { value: function(m){ return this.basicMap && m > 4; } },
						lockEO  : { get: function(){ return !this.wildCard && this.basicMap && v <= 4; } }
					}),
					map = Object.defineProperties({},{
						count : { get: function(){ return Number(v); } },
						clear : { get: function(){
							return Object.keys(mapDataBuffer)
								.filter(function(MapCode){ return (/m(\d+)(\d)/.exec(MapCode) || "0")[1] == k; })
								.map(function(MapCode){ return mapDataBuffer[MapCode].clear; })
								.filter(function(MapState){ return MapState; }).length;
						} },
						total : { get: function(){
							return Object.keys(KC3Meta._edges).filter(function(MapCode){
								return MapCode.indexOf("World "+k+"-")+1;
							}).length;
						} },
						AC    : { get: function(){ return is.eventMap && this.clear >= this.total; } }
					});
				
				/* Sortie Option Structure
					Mode 0 =>
						W[0-0][0-9] M[1-4] P[N/A]
					Mode 1 =>
						W[0-0][0-9] M[5-9] P[YYYYMM]
						  YYYYMM : 4-digit year + 2-digit month
					Mode 2 =>
						W[1-9][0-9] M[1-9] P[0-5]
						  Period : (up to 10 defineable condition)
							  - Start of the map
							  - Start of event
							  - Cleared the map         (GREAT DESTR)
							  - Cleared the event       (FINAL DANSE)
							  - Post clearing the map   (EXTRA STAGE)
							  - Post clearing the event (EXTRA DANSE)
				*/
				
				var elm = $("<option></option>");
				$(elm).attr('value',k).text(v)
					.data('length',v)
					.data('clr-map', map.clear )
					.data('max-map', map.total )
					.addClass("sortieWorld")
					.addClass(is.basicMap ? "basic" : "")
					.addClass(is.eventMap ? "event" : "")
					.addClass(is.lockEO   ? "no-extra" : "")
					.addClass((function(){
						try { return !ledgerCache[Number(k)].first; } catch(e) { return true; }
					})() ? "no-ledger" : "")
					.addClass(map.AC      ? "all-clear" : "");
				$(elm).appendTo( $(".filterMapWorld select",baseContext) );
			});
			
			// Generate Map Num List (y: coz not using it)
			Array.apply(null,{length:10}).forEach(function(unused_var,x){
				var elm = $("<option></option>");
				$(elm).attr('value',x).text(x || "All").hide()
					.addClass("sortieMap")
					.addClass(x > 4 ? "extra" : "basic");
				$(elm).appendTo( $(".filterMapNum select",baseContext) );
			});
			
			// Generate Map Period List (Only applicable to non-basic)
			$.each(tEventEnum,function(i,d){
				var elm = $("<option></option>");
				$(elm).attr('value',i).text(d[0])
					.addClass("sortieMoment")
					.addClass(d[1] && "requireClear")
					.addClass(d[2] && "requireAllClear");
				$(elm).appendTo( $(".filterMapPeriod .periodEvent",baseContext) );
			});
			
			// Reinitialize input
			$(".filterBoxes .filterType  input[type=radio]",baseContext).each(function(i,x){
				$(this).prop('checked',JSON.parse($(this).val()) == self.timeRange.duration);
			});
			$(".filterBoxes .filterScope input[type=radio]",baseContext).each(function(i,x){
				$(this).prop('checked',JSON.parse($(this).val()) == self.timeRange.scope);
			});
			$(".filterBoxes .filterRangeLen input",baseContext).each(function(i,x){
				$(this).val(self.timeRange.rate);
			});
			
			$(".filterBoxes .filterSType input[type=radio]",baseContext).on('reinit',function(){
				$(this).prop('checked',JSON.parse($(this).val()) == self.sortie.Filter);
			}).trigger('reinit');
			
			// Input Limiter
			$("input",baseContext).each(function(i,x){
				$(this).data('prev',$(this).val());
			}).on('change',function(e){
				// Inverts for every invalid input
				var valid;
				$(this).data('valid',valid = this.checkValidity());
				if(valid) {
					$(this).data('prev',$(this).val());
				} else {
					$(this).val($(this).data('prev'));
				}
				return valid;
			});
			
			// ASYNC EVENT HANDLER
			(function AsyncHandler(){
				try {
					var threads = $.extend([],{
						watchThread:function(name){
							var ctr  = $.Deferred();
							var time = Date.now();
							ctr.always(function(){
								time = Date.now() - time;
							}).done(function(){
								console.log('Execution',name,'Completed in ',time,'ms');
							}).fail(function(){
								console.error('Execution',name,'Failed after',time,'ms');
							});
							this.push(ctr);
							return ctr;
						},
						unwatchThread:function(data){
							switch(typeof data){
								case 'number':
								case 'string': data = this[parseInt(data,10)]; break;
								case 'object': break;
								default: data = null;
							}
							
							var rmv = this.indexOf(data);
							
							if(rmv+1) { this.splice(rmv,1); }
						}
					});
					
					// ASYNC == Refresh Sortie Data Buffer
					(function AsyncSDBuff(thr){
						var sbf = Object.keys(this.sortieBuffer);
						KC3Database.get_sortie_maps( [ sbf.slice(-1).shift(),Infinity ],
							(function(newBuffer){
								try {
									var oldBufferLen = this.sortieBuffer.length || 0;
									console.log("Extending map buffer from",oldBufferLen,"by",newBuffer.length);
									$.extend(this.sortieBuffer,newBuffer);
									$.each(this.sortieRange,function(k,v){ (sortieRange[k] = sortieRange[k] || []).splice(0); });
									
									Object.keys(this.sortieBuffer).forEach(function(sortieID){
										var
											sortieData = self.sortieBuffer[sortieID],
											sortieKey  = [sortieData[0],sortieData[1]].join(''),
											sortieAry  = (self.sortieRange[sortieKey] = (self.sortieRange[sortieKey] || []));
										sortieAry.push(sortieID);
									});
									
									
									thr.resolve(newBuffer.length);
								} catch (e) {
									thr.reject(e);
								}
							}).bind(this)
						);
					}).call(this,threads.watchThread('SDBuff'));
					
					// ASYNC == Specify Boundary
					(function AsyncBound(thr){
						var
							maximumLookout  = Date.now(),
							dateTimeInputs  = $("input[type=datetime-local]",baseContext),
							scaleRadioInput = $(".filterType input[type=radio]",baseContext);
						dateTimeInputs.prop('disabled',true);
						scaleRadioInput
							.parent().css('visibility','hidden').end()
							.prop('disabled',true);
						KC3Database.get_lodger_bound(function(furthestBound){
							var minDate = new (Date.bind.apply(Date,[null].concat([furthestBound].filter(function(data){
								return (
									(typeof data == 'number' || (typeof data == 'object' && data instanceof Number && Number(data))) &&
									isFinite(data) && !isNaN(data)
								);
							}))))();
							
							try {
								dateTimeInputs.each(function(idx,elm){
									$(elm)
										.attr('min',minDate.format(dateFormatYMDH))
										.attr('step',3600);
									if(elm.name == 'range-source'){
										$(elm).prop('disabled',false).val(dateFormat(maximumLookout,dateFormatYMDH)).trigger('change');
									} else {
										$(elm).data('disable-lock',true);
									}
								});
								
								var totalDays = Math.hrdInt('floor',(maximumLookout - minDate)/86.4,6,1);
								scaleRadioInput.each(function(idx,elm){
									var
										requiredDays = tDurEnum[parseInt($(this).val(),10)][3],
										satisfied    = totalDays >= requiredDays;
									$(elm)
										.data('disable-lock',!satisfied)
										.parent().css('visibility',satisfied ? 'visible' : 'hidden').end();
								});
								
								// Configure EO Period
								(function(){
									var dr = [minDate,maximumLookout].map(function(dt){
										return new Date(Math.qckInt('floor',dt/3.6,6)*3.6);
									}), eb;
									
									eb = $("<option></option>");
									eb.text( "All EO" );
									eb.val ( 0 );
									
									eb.appendTo(".periodExtra");
									
									while(dr[0] < dr[1]) {
										eb = $("<option></option>");
										eb.text( dr[0].format("mmmm yyyy") );
										eb.val ( Math.hrdInt('floor',Date.parse(dr[0].format("mmmm yyyy"))/3.6,6,1) - (new Date()).getTimezoneOffset()/60 );
										
										eb.appendTo(".periodExtra");
										
										dr[0].shiftMonth(0,true);
									}
								}).call(this);
								
								thr.resolve(maximumLookout - minDate);
							} catch (e) {
								thr.reject(e);
							}
						});
					}).call(this,threads.watchThread('SortieBound'));
					
					// ASYNC == Fetch Available Data
					(function AsyncFetch(thr){
						var oldwholebuff = Object.keys(this.totalBuffer);
						// Fetch new buffer
						KC3Database.get_lodger_data(
							Range(oldwholebuff.slice(-1).shift() || 0,Infinity,0,1),
							function(newBuffer){
								// Process here
								try {
									newBuffer.forEach(function(newData,index){
										var
											givenType = /([a-z]+)(\d*)/.exec(newData.type),
											givenAry  = self.dataBuffer[givenType[1]],
											newItem   = new KC3LodgerBuffer(
												newData.id,
												newData.hour,
												newData.data,
												givenType[1],
												dataScale[Object.keys(self.dataBuffer).indexOf(givenType[1])],
												givenType[2]
											);
										[givenAry,self.totalBuffer].forEach(function(bufferArray){
											if(bufferArray.every(function(buffer){
												return !buffer.equals(newItem);
											}))
												bufferArray.push(newItem);
										});
									});
								} catch (e) {
									console.error(e.stack);
								} finally {
									bufferCancel = false;
									thr.resolve(newBuffer.length);
								}
							}
						);
					}).call(this,threads.watchThread('CollectBuffer'));
					
					$.when.apply(null,threads).then(function(){
						console.info.apply(console,["Async Completed"].concat([].slice.apply(arguments)));
						// Finalize
						refreshCurrentBuffer.call(self);
						$(".filterRefresh",baseContext).trigger('click');
					},function(e){
						console.error("Thread Execution Failed",e);
					});
				} catch (e) {
					throw e;
				}
			}).call(this);
			
			/* LISTENER CONFIGURATION */
				// Initialize Maximum on Date Input Fields
				$("input[type=datetime-local]",baseContext)
					.attr('max',(new Date()).format(dateFormatYMDH))
					.on('change',function(){
						if(this.name == 'range-source' && $(this).data('valid')){
							$('input[name=range-maximum]',baseContext).val(
								calculateMaximumBacklookup(self.timeRange,this.valueAsNumber).format(dateFormatYMDH,true)
							);
						}
					});
				
				// Time Range Listener
				$(".filterType input[type=radio]",baseContext)
					.on('click',function(){
						var oldDur = self.timeRange.duration;
						self.timeRange.duration = JSON.parse($(this).val());
						switch(self.timeRange.duration) {
							case 0:
								if(oldDur != self.timeRange.duration) {
									$('button,input,select,option',baseContext).prop('disabled',true);
									self.resetBuffer();
								}
								break;
							case 1:
								$(".filterRangeLen input").prop('max',364);
							break;
							case 2:
								$(".filterRangeLen input").prop('max',52);
							break;
							case 4:
								$(".filterRangeLen input").prop('max',11);
							break;
							case 8:
								$(".filterRangeLen input").prop('max',1);
							break;
						}
						self.sortie.Filter = !self.timeRange.duration && self.sortie.Filter;
						
						$(".filterBoxes .filterSType input[type=radio]",baseContext).trigger('reinit');
						$(".filterRangeLen input",baseContext)
							.val(Math.min($(".filterRangeLen input",baseContext).prop('max'),$(".filterRangeLen input").val()))
							.trigger('change');
						$(".filterDate input",baseContext).trigger('change');
						$("input:not([readonly]),button:not(.filterRefresh)",$(".filter_reset",baseContext))
							.data('disable-lock',!self.timeRange.duration);
						$(".filterRefresh",baseContext).trigger('click');
					});
				$(".filterRangeLen input[type=number]",baseContext)
					.on('input keyup',function(){
						$(this).trigger('change');
						self.timeRange.rate = JSON.parse($(this).val());
						$(".filterDate input",baseContext).trigger('change');
					});
				// Time Scope Listener
				$(".filterScope input[type=radio]",baseContext)
					.on('click',function(){
						self.timeRange.scope = JSON.parse($(this).val());
						$(".filterDate input",baseContext).trigger('change');
						$(".filterRefresh",baseContext).trigger('click');
					});
				
				// Data Filter Handler
				$(".filterData input[type=checkbox]",baseContext)
					.on('click',function(){
						self.filter[$(this).data('ref')] = $(this).prop('checked');
						refreshCurrentBuffer.call(self);
						self.refreshList();
					});
				
				// Time Step / Button Handler
				$(".filterNavigate",baseContext)
					.on('click',function(){
						var
							targetItem = $("input[name=range-source][type=datetime-local]",baseContext),
							valBound   = ['min','max'].map(function(prop){ return new Date(targetItem.prop(prop)); });
						var nextStep;
						
						if(self.timeRange.scope) {
							var stepLength = parseInt($(this).data('step')) * targetItem.prop('step') * 1000;
							nextStep   = targetItem.prop('valueAsNumber') + stepLength;
						} else {
							var
								durDat= tDurEnum[self.timeRange.duration],
								cDate = new Date(targetItem.prop('valueAsNumber')),
								args  = [parseInt($(this).data('step')),false,null];
							if(durDat[0] == 'Week') {
								args.unshift('Sunday',0);
							}
							cDate[['shift',durDat[0]].join('')].apply(cDate,args);
							nextStep = cDate.shiftDate(0,1,{Hours:-1}).getTime();
						}
						
						nextStep = Math.max(valBound[0],Math.min(valBound[1],nextStep));
						
						var newVal = dateFormat(nextStep,dateFormatYMDH,true);
						
						if(newVal !== targetItem.val()) {
							targetItem.val(newVal).trigger('change');
							$(".filterRefresh",baseContext).trigger('click');
						}
					});
				
				// Sortie Grouping Handler
				$(".filterSType input[type=radio]",baseContext)
					.on('click',function(){
						var allClass = tShutsuEnum.map(function(enm){return enm[1];})
							.filter(function(cls){return cls;})
							.join(' ');
						
						self.sortie.Filter = $(this).val();
						$(".filterRefresh").trigger('refresh');
						
						$(this).parent().parent().parent()
							.removeClass(allClass).addClass($(this).data('addition'))
							.removeClass('crok crng acok acng');
						
						/*
						var
							invokeEvent = (self.sortie.Filter == 3),
							requireEO   = (self.sortie.Filter == 2);
						$("option.sortieWorld",baseContext).each(function(idx,elm){
							$(elm)[ (
								!(requireEO && $(elm).hasClass('no-extra')) &&
								!($(elm).hasClass('event')^invokeEvent)
							)?'show':'hide' ]();
						});
						/* */
						$(".filterRefresh",baseContext).trigger('click');
					});
				
				// Sortie World Filter Handler
				$(".filterMapWorld select",baseContext).on('change',function(){
					var
						mapSel = $(this.selectedOptions),
						mapClr = mapSel.data('clr-map'),
						mapMax = mapSel.data('max-map'),
						mapLen = mapSel.data('length'),
						allClearFlag = mapSel.is(".all-clear"),
						invokeEvent = (self.sortie.Filter == 3),
						lockExtra = (self.sortie.Filter == 1);
					self.sortie.World = $(this).val();
					
					$(this).parent().parent().parent()
						.removeClass('crok crng acok acng').addClass(allClearFlag ? 'acok' : 'acng');
					
					$(".filterMapNum",baseContext)
						.find('select')
							.prop('selectedIndex',0)
							.prop('disabled',!$(this).prop('selectedIndex'))
							.data('disable-lock',!$(this).prop('selectedIndex'))
							.addClass('map-clear')
						.end()
						.find('option').each(function(idx,elm){
							$(elm).removeClass('map-clear')
								.addClass(idx<=mapClr ? 'map-clear' : '')
								[(idx<=Math.min(mapLen,mapMax))?'show':'hide']();
						})
						.end();
					
					$(".filterRefresh").trigger('refresh');
				});
				
				// Sortie Specific Map Filter Handler
				$(".filterMapNum select",baseContext).on('change',function(){
					var clearFlag = $(this.selectedOptions).is(".map-clear");
					$(this).removeClass('map-clear')
						.addClass(clearFlag ? "map-clear" : "")
						.parent().parent().parent()
							.removeClass('crok crng')
							.addClass(clearFlag ? 'crok' : 'crng');
					self.sortie.Map = $(this).val();
					$(".filterRefresh").trigger('refresh');
				});
				
				// Sortie Period Filter Handler
				$(".filterMapPeriod select",baseContext).on('change',function(){
					self.sortie.Period = $(this).val();
				});
				
				// Filter Group Handler
				$(".filterGroup",baseContext).on('refresh',function(event){
					var
						elm = this,
						state = Object.keys(tDurEnum).every(function(durKey){
							var
								k = ['duration',durKey].join(''),
								d = self.timeRange.duration,
								c = $(elm).data(k);
							try {
								c = JSON.parse(c);
								return !((d == durKey) ^ c);
							} catch (e) {
								return true;
							}
						});
					
					$(this)[state ? 'show' : 'hide']();
				});
				
				// Data Refresh Handler
				$(".filterRefresh",baseContext)
					.on('enable-flag',function(){
						bufferCancel = false;
						$("button,input,select,option",baseContext).each(function(idx,elm){
							$(elm).prop('disabled',$(elm).data('disable-lock') || false);
						});
					})
					.on('refresh',function(){
						$(".filterMapWorld select",baseContext)
							.prop('disabled',!self.sortie.Filter).data('disable-lock',!self.sortie.Filter)
							.val(self.sortie.World);
						$(".filterMapNum select",baseContext)
							.prop('disabled',!self.sortie.World).data('disable-lock',!self.sortie.World)
							.val(self.sortie.Map);
						$(".filterMapPeriod select",baseContext)
							.prop('disabled',self.sortie.Filter<=1).data('disable-lock',self.sortie.Filter<=1)
							.each(function(i,elm){
								$(elm).val(self.sortie.Period);
								$(elm).prop('selectedIndex',$(elm).prop('selectedIndex')>-1 ? $(elm).prop('selectedIndex') : 0);
							});
					})
					.on('click',function(){
						$('button,input,select,option',baseContext).prop('disabled',true);
						
						self.resetBuffer();
						$(".filterGroup",baseContext).trigger('refresh');
						$(this).trigger('refresh');
					});
		},
		
		refreshList :function(){
			var
				self = this,
				timeRangeAry = [lookupDays()];
			
			$(".lodger-header",baseContext).text(
				[1,2].reduce(function(str,key,ind){
					return str.replace('%DATE' + key,dateFormat(lookupBound[ind] * 3600000,'ddd yyyy-mm-dd HH:' + ['00','59'][ind]));
				},KC3Meta.term('LodgerLabel'))
			);
			
			$.each(self.dataBuffer,function(k,v){
				var wholeData = (k==='overall');
				
				if(!self.filter[k] && !wholeData) {
					$(".lodger-data." + k,$(".lodger-statistics",baseContext)).hide();
					return true;
				}
				
				var
					availData = v.filter(function(buff){return self.flatBuffer.indexOf(buff) >= 0;}),
					baseName  = $(".filterData",baseContext).filter(function(i,x){
						return $("input",x).data('ref') == k;
					}).find(".filterText").text() || KC3Meta.term('Lodger'+k),
					matrSum   = [0,0,0,0,0,0,0,0],
					rating    = {
						box : $(".lodger-data." + k,".lodger-statistics"),
						val : availData.length ? calculateRating.apply(null,timeRangeAry.concat(availData)) : NaN
					};
				
				
				if(wholeData){
					matrSum = self.flatBuffer.reduce(function(pre,cur){
						return pre.map(function(cval,cind){ return cval + Number(cur.matr[cind]); });
					},matrSum);
					rating.val = self.dataRating;
				} else if(isNaN(rating.val)){
					rating.val = CONST.ratingOffset;
				} else {
					matrSum = availData.reduce(function(pre,cur){
						return pre.map(function(cval,cind){ return cval + cur.matr[cind]; });
					},matrSum);
				}
				
				rating.OK  = rating.val / 2;
				rating.NG  = CONST.ratingMagnitude - rating.OK;
				
				rating.NG *= 100/CONST.ratingMagnitude;
				rating.OK *= 100/CONST.ratingMagnitude;
				
				rating.excess = Math.max(rating.NG,rating.OK)>100;
				
				var
					normalizedMagnitude = Math.max(-CONST.ratingMagnitude,
						Math.min(CONST.ratingMagnitude,rating.val - CONST.ratingOffset)
					),
					normalizedRating = Math.qckInt('ceil',normalizedMagnitude,2,false,true),
					ratingCond = (rating.val < CONST.ratingOffset) ? 'NG' : 'OK',
					texifyRating = Math.qckInt('ceil',Math.abs(normalizedMagnitude),0);
				
				rating.box
					.find('.bar.NG,.bar.OK').each(function(idx,elm){
						// For every NG/OK bar, put their bar value
						// Don't forget to mark excessive values
						var selfRating = rating[elm.className.split(' ')[1]];
						$(elm).css('width',Math.min(selfRating,100) + '%')
							.removeClass('over')
							.addClass(selfRating > 100 ? 'over' : '');
					}).end()
					.find('.info')
						.attr('title',KC3Meta.term(['LodgeRating',ratingCond,texifyRating].join('')))
						.find('.rating')
							.removeClass('NG OK over')
							.addClass((rating.val != CONST.ratingOffset) ? (ratingCond) : '')
							.addClass(rating.excess ? 'over' : '')
							.data('val',normalizedMagnitude + CONST.ratingOffset)
							.text((normalizedRating + CONST.ratingOffset).toFixed(2))
						.end()
						.find('.type').text(baseName).end()
					.end()
					.find('.materials .material').each(function(idx,elm){
						var
							matrVal = matrSum[idx],
							matrScl = (dataScale[Object.keys(self.dataBuffer).indexOf( k )] || 0) / (ctx.dayScaleCoef( timeRangeAry[0] )),
							matrOvr = Math.abs(matrVal) > 99999,
							matrExc = Math.abs(matrVal * matrScl && !matrOvr) > ctx.resourcePeak(idx),
							matrHlf = Math.abs(matrVal * matrScl && !(matrOvr || matrExc)) > (ctx.resourcePeak(idx) * ctx.ratingHScore);
						$(elm).removeClass('half full over OK NG')
							.addClass((matrOvr && 'over') || (matrExc && 'full') || (matrHlf && 'half') || "")
							.addClass(Math.abs(parseInt(matrVal,10)) > 0 ? (Math.sign(matrVal) >= 0 ? 'OK' : 'NG') : '')
							.attr('data-actual-value',matrVal);
						$("span",elm).text(matrOvr ? matrVal.shorten() : matrVal);
					}).end()
					.show();
			}.bind(ctx));
			
			$(".filterRefresh",baseContext).trigger('enable-flag');
		},
		
		resetBuffer :function(){
			var self = this;
			if(bufferCancel){
				console.error("Rejected attempt to modify the locked buffer, please wait gently.");
				return false;
			}
			
			lookupBound = Array.apply(null,$('input[type=datetime-local]',baseContext)
				.map(function(i,x){return x.valueAsNumber;})).reverse();
			
			bufferCancel = true;
			
			switch(true){
				case(!this.timeRange.duration):
					lookupBound[0] = -Infinity;
					lookupBound[1] = +Infinity;
				break;
				case(!this.timeRange.scope):
					var
						args = [this.timeRange.rate],
						next = new Date(lookupBound[0]);
					
					if(this.timeRange.duration & 2)
						args.unshift(null,1);
					
					lookupBound[1] = next[['shift',tDurEnum[this.timeRange.duration][0]].join('')]
						.apply(next,args)
						.getTime() - 1;
				break;
				default:
				break;
			}
			
			var GMT = (new Date()).getTimezoneOffset() * 60000;
			// Convert UnixTimestamp into UnixHour
			lookupBound.push.apply(lookupBound,
				lookupBound.splice(0)
					.map(function(x,i){ return Math.hrdInt('floor',(x + GMT)/3.6,6,1); }
				)
			);
			
			lookupBound[0] = this.totalBuffer.slice().reverse().find(function(buf){return buf.hour >= lookupBound[0]; }).hour;
			lookupBound[1] = this.totalBuffer.slice().find(function(buf){return buf.hour <= lookupBound[1]; }).hour;
			
			refreshCurrentBuffer.call(this);
			this.refreshList();
		}
		
	};
	
	/* Local/Inner class KC3Buffer
	----------------------------------------------- */
	
	var
		KC3LodgerBuffer = (function(){
			function KC3LodgerBuffer(id,hour,matr,kind,mult,optional) {
				/*jshint: validthis true*/
				if(this instanceof KC3LodgerBuffer){
					if(!Range(4,6).inside(arguments.length)){
						var
							kn = ['id','hour','matr','kind','mult','optional','overflow'],
							at = [].map.call(arguments,function(v,i){
								var type = typeof(v);
								switch(type){
									case('number'):
										type = (parseInt(v,10) == v) ? 'int' : 'float';
									break;
									case('string'):
										type = (v.length != 1) ? 'string' : 'char';
									break;
									case('object'):
										type = (v.constructor.name || "(anonymous function)");
										
										type = type + (typeof v.length == 'number' ? JSON.stringify([v.length]) : '');
									break;
								}
								return [type,kn[i>6 ? 6 : i]].join(' ');
							}).slice(0,7);
						throw new RangeError([
							"Constructor form:\t KC3LodgerBuffer(int id,int hour,int[8] matr,string kind[,float mult=1[,variant optional]])",
							"Requested form:\t KC3LodgerBuffer("+at+")"
						].join('\n'));
					}else{
						matr = matr.map(function(x){return parseInt(x,10) || 0;});
						mult = Math.max(0,(!parseFloat(mult) || isNaN(mult) || !isFinite(mult) || Math.sign(mult) < 0) ? 1 : mult);
						
						Object.defineProperties(this,{
							id  :{value:id      },
							hour:{value:hour    },
							matr:{value:matr    },
							kind:{value:kind    },
							mult:{value:mult    },
							opt :{value:optional},
							
							toString:{value:this.toString.bind(this,this)},
							equals  :{value:this.equals  .bind(this,this)},
							rating  :{get:  this.rating  .bind(this,this)},
							bRating :{get:  this.bRating .bind(this,this)},
						});
						Object.seal(this);
					}
				}else{
					throw new TypeError('Requires instantiation from KC3Buffer class!');
				}
			}
			
			Object.defineProperties(KC3LodgerBuffer.prototype,{
				toString: { value: Function.prototype.apply.bind(function(){
					var self = this;
					if(typeof self == 'undefined' || self == KC3LodgerBuffer.prototype) {
						return "KC3Buffer {Prototype}";
					} else {
						return [
							"KC3Buffer #",self.id,
							["(",self.opt,")"].filter(function(){return typeof self.opt != 'undefined';}).join(''),
							" @",self.hour,
							" [",self.matr.join(),"]"
						].join('');
					}
				}) },
				equals : { value: Function.prototype.apply.bind(function(other){
					var self = this;
					return [self,other].reduce(function(precVal,varData){
						return precVal && (typeof varData == 'object') && (varData instanceof KC3LodgerBuffer);
					},true) && (Object.keys(self)).map(function(key){
						var pt = self[key];
						switch(typeof pt){
							case 'object':
								return JSON.stringify(self[key]) == JSON.stringify(other[key]);
							default:
								return self[key] == other[key];
						}
					});
				}) },
				bRating : { value: Function.prototype.apply.bind(function(){
					var
						self     = this,
						halfRate = 1 / Math.log2(1/CONST.ratingHScore),
						aRating  = this.matr.reduce(function(tRate,cMat,mInd){
							return tRate + Math.min(2,
								Math.pow( Math.abs(cMat * self.mult / CONST.resourcePeak(mInd) ), halfRate )
							)*Math.sign(cMat);
						},0)/8;
					return aRating;
				}) },
				rating : { value: Function.prototype.apply.bind(function(){
					return Math.min(Math.abs(this.bRating),1) * Math.sign(this.bRating) * 1.25 * CONST.ratingMagnitude + CONST.ratingOffset;
				}) }
			});
			
			KC3LodgerBuffer.toString = String.prototype.toString.bind("function KC3Buffer(id,hour,material[,coefficient[,optional]])");
			
			Object.defineProperty(KC3LodgerBuffer,'toString',{});
			
			return KC3LodgerBuffer;
		})(),
		
		KC3PrimitiveWrapper = (function(){
			function KC3PrimitiveWrapper(){}
			
			Object.defineProperties( KC3PrimitiveWrapper, {
				name: { value: "KC3 Wrapper" },
				toString: { value: String.prototype.toString.bind("function Primitive Wrapper (){}") },
			});
			
			return KC3PrimitiveWrapper;
		})(),
		
		KC3SortieCacheMapWorld = (function(){ return function KC3SortieCacheMapWorld(){}; })(),
		KC3SortieCacheMapSpec  = (function(){ return function KC3SortieCacheMapSpec (){}; })(),
		KC3LedgerCacheMapWorld = (function(){ return function KC3LedgerCacheMapWorld(){}; })(),
		KC3LedgerCacheMapSpec  = (function(){ return function KC3LedgerCacheMapSpec (){}; })();
	
	/* Local Function
	----------------------------------------------- */
	
	function refreshCurrentBuffer(){
		// This is a private function for the lodger tab itself though.
		/*jshint validthis: true*/
		if(this !== activeTab.definition) {
			return false;
		}
		var
			self = this,
			fun  = self.wholeSortieFilter;
		allBuffer = (this.totalBuffer)
			.filter(function(d,i,a){
				return (typeof fun === 'function') ? fun.call(self,d.kind,d,i,a) : true; })
			.filter(function(d,i,a){
				return Range.apply(null,lookupBound).inside(d.hour);
			});
		this.flatBuffer = Object.freeze(allBuffer.slice(0));
		this.dataRating = calculateRating.apply(null,[lookupDays()].concat(allBuffer));
		
		return true;
	}
	
	function calculateMaximumBacklookup(timeRange,givenDate){
		// Initialize Required Variables
		var
			targetDate = new Date(givenDate),
			durData    = tDurEnum[timeRange.duration],
			durKey     = durData[0],
			rCoef      = durData[1];
		timeRange = JSON.parse(JSON.stringify(timeRange));
		
		/* How backlookup works:
			Scope/Duration
			LookBHD/Day    - starts from specified date for N day backwards
			  bhd(2015-12-12 04:00,1) --> (2015-12-11 04:00)
			  bhd(2015-12-12 04:00,2) --> (2015-12-10 04:00)
			LookARD/Day    - looks 24*N hours around current day
			  ard(2015-12-12 04:00,1) --> (2015-12-12 00:00)
			  ard(2015-12-12 23:00,1) --> (2015-12-12 00:00)
			  ard(2015-12-12 23:00,2) --> (2015-12-11 00:00)
			  ard(2015-12-12 23:00,4) --> (2015-12-09 00:00)
			Any/Week       - 7x effectivity of Any/Day (1 week, 2 weeks, etc.)
			Any/Whole      - starts from specified date till nullity
			
			In concept:
			LookBHD/Look Behind - looks out the exact given duration from specified time
			  > Day  : looks up 24 hours
			  > Week : looks up 168 hours
			  > Month: looks up the same date of previous month (leap year is exception!)
			  > Year : looks up the same month of previous year
			LookARD/Look Around - looks out from the beginning of the <time definition> till now
			  > Day  : from 0AM
			  > Week : from Sunday
			  > Month: from 1st day of the month
			  > Year : from 1st month of the year
		*/
		
		if(timeRange.duration) { /* Not applying WHOLE-Scoped */
			var args = [-timeRange.rate * rCoef,!timeRange.scope,null];
			
			if(durKey == 'Week') {
				args.unshift(!timeRange.scope ? 'Sunday' : undefined,-1,args.shift() + !timeRange.scope /* */);
			}
			
			targetDate[['shift',durKey].join('')].apply(targetDate,args);
		} else {
			// Enforce return nothing
			targetDate = {format:function(){return "";}};
		}
		
		return targetDate;
	}
	
	function lookupDays(){
		var result = (lookupBound[1] - lookupBound[0])/24;
		return isFinite(result) ? result : 1;
	}
	
	function calculateRating( /* bufferList */ ){
		var
			days = 1,
			args = [].slice.apply(arguments);
		if(typeof args[0] == 'number')
			days = Math.max(1,args.shift());
		
		// Check Emptiness
		if(!args.length)
			return 5;
		// Validate Parameters
		[].forEach.call(args,function(bufferData){
			if(!(bufferData instanceof KC3LodgerBuffer))
				throw new TypeError(["Given item is not a KC3Buffer class! (",String(bufferData),")"].join(''));
		});
		
		var dcCoef, dataSum, dataAvg, aRating, sRatio, dRating, pRatio, bResult;
		
		dcCoef  = CONST.dayScaleCoef(days);
		dataSum = [].map.call(args,function(bufferData,index,array){
			return bufferData.matr.map(function(rsc){
				return rsc * bufferData.mult;
			});
		}).reduce(function(pre,cur,ary){
			return pre.map(function(matr,indx){
				return matr + cur[indx] / dcCoef;
			});
		},Array.apply(null,{length:8}).map(function(){return 0;}));
		
		dataAvg = [].map.call(args,function(bufferData,index,array){
			return bufferData.bRating;
		});
		
		aRating = dataAvg.reduce(function(avg,val,num){
			return (avg * num + val)/(num + 1);
		},0);
		
		sRatio  = Math.pow(dcCoef,-0.5);
		aRating = (aRating * (1-sRatio) + (new KC3LodgerBuffer(null,null,dataSum,"overall")).bRating * sRatio);
		
		dRating = dataAvg.length > 1 ? Math.stdev.apply(null,dataAvg) : 0;
		pRatio  = Math.pow(Math.max(0,1 - Math.abs(aRating)),1.5) * Math.sign(aRating);
		
		bResult = {bRating: aRating + dRating * pRatio};
		return KC3LodgerBuffer.prototype.rating.bind(bResult,bResult).call();
	}
	
}).call({});
