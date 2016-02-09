(function(){
	"use strict";
	
	KC3StrategyTabs.overlodger = new KC3StrategyTab("overlodger");
	
	/* Local Variables
	------------------------------------------------ */
	
	var
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
			1:['Date' ,1,'Daily'  ,  2],
			2:['Week' ,1,'Weekly' , 14],
			4:['Month',1,'Monthly', 70],
			8:['Year' ,1,'Yearly' ,280]
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
		
		sortieBuffer = [],
		allBuffer = [],
		lookupBound = [-Infinity,+Infinity],
		polarityRating = [0,0],
		
		dateFormatYMDH = "yyyy-mm-dd'T'HH:00:00",
		bufferCancel = false,
		baseContext;
	
	Object.freeze(CONST);
	
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
			*/
			convention: null,
		},
		
		filter: {},
		dataBuffer: {},
		flatBuffer: [],
		
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
				self.dataBuffer[filterKey] = null;
			});
			
			Object.defineProperties(this.timeRange,{
				convention:{
					get: function(){ ConfigManager.load(); return Number(ConfigManager.lodger_convention) || 0; },
					set: function(value){ ConfigManager.lodger_convention = isFinite(value) && value || 0; ConfigManager.save(); }
				},
			});
			
			refreshCurrentBuffer.call(self);
		},
		
		/* EXECUTE
		Places data onto the interface
		---------------------------------*/
		execute :function(){
			var self = this;
			
			// Factory cloning
			$.each(tDurEnum,function(k,v){
				var fTypeBox = $(".factory .filterType",baseContext).clone();
				
				$("input",fTypeBox).val(parseInt(k,10));
				$(".filterText",fTypeBox).text(KC3Meta.term('LodgerTime' + v[2]));
				
				fTypeBox.insertBefore(".filterRangeLen");
			});
			
			$.each(iconData,function(k,v){
				var
					targetBox = $(".factory .lodger-data .materials",baseContext),
					mDataBox  = $(".factory .material.base-material",baseContext).clone();
				
				$("img",mDataBox).attr('src',['../../../../assets/img/client/',v,'.png'].join(''));
				mDataBox
					.addClass(v)
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
			
			// Specify Boundary
			(function(){
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
					
					dateTimeInputs.each(function(idx,elm){
						$(elm)
							.attr('min',minDate.format(dateFormatYMDH))
							.attr('step',3600);
						if(elm.name == 'range-source'){
							$(elm).prop('disabled',false).val(dateFormat(maximumLookout,dateFormatYMDH)).trigger('change');
							$(".filterRefresh",baseContext).trigger('click');
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
				});
			})();
			
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
					self.timeRange.duration = JSON.parse($(this).val());
					$($("input",".filterRangeLen,.filterScope"),baseContext).prop('disabled',!self.timeRange.duration);
					switch(self.timeRange.duration) {
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
					$(".filterRangeLen input")
						.val(Math.min($(".filterRangeLen input").prop('max'),$(".filterRangeLen input").val()))
						.trigger('change');
					$(".filterDate input",baseContext).trigger('change');
					$(".filterNavigate",baseContext).data('disable-lock',!self.timeRange.duration)
						.prop('disabled',!self.timeRange.duration);
					$(".filterRefresh",baseContext).trigger('click');
				});
			$(".filterRangeLen input[type=number]",baseContext)
				.on('click',function(){
					$(this).trigger('change');
				});
			$(".filterRangeLen input[type=number]",baseContext)
				.on('change',function(){
					self.timeRange.rate = JSON.parse($(this).val());
					$(".filterDate input",baseContext).trigger('change');
				});
			// Time Scope Listener
			$(".filterScope input[type=radio]",baseContext)
				.on('click',function(){
					self.timeRange.scope = JSON.parse($(this).val());
					$(".filterDate input",baseContext).trigger('change');
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
			
			// Data Refresh Handler
			$(".filterRefresh",baseContext)
				.on('click',function(){
					self.resetBuffer();
					$('button,input',baseContext).prop('disabled',true);
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
					baseName  = $(".filterData",baseContext).filter(function(i,x){
						return $("input",x).data('ref') == k;
					}).find(".filterText").text() || KC3Meta.term('Lodger'+k),
					matrSum   = [0,0,0,0,0,0,0,0],
					rating    = {
						box : $(".lodger-data." + k,".lodger-statistics"),
						val : v.length ? calculateRating.apply(null,timeRangeAry.concat(v)) : NaN
					};
				
				
				if(wholeData){
					matrSum = self.flatBuffer.reduce(function(pre,cur){
						return pre.map(function(cval,cind){ return cval + Number(cur.matr[cind]); });
					},matrSum);
					rating.val = self.dataRating;
				} else if(isNaN(rating.val)){
					rating.val = CONST.ratingOffset;
				} else {
					matrSum = v.reduce(function(pre,cur){
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
						$("span",elm).text(matrSum[idx]);
					}).end()
					.show();
			});
		},
		
		resetBuffer :function(){
			var self = this;
			if(bufferCancel){
				console.error("Rejected attempt to modify the locked buffer, please wait gently.");
				return false;
			}
			
			lookupBound = Array.apply(null,$('input[type=datetime-local]',baseContext)
				.map(function(i,x){return x.valueAsNumber;})).reverse();
			
			// Clear current buffer
			$.each(self.dataBuffer,function(k,v){
				if(typeof v == 'object' && v instanceof Array){
					self.dataBuffer[k].splice(0);
				} else {
					self.dataBuffer[k] = [];
				}
			});
			allBuffer.splice(0);
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
			// Fetch new buffer
			KC3Database.get_lodger_data(
				lookupBound,
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
									dataScale[Object.keys(self.dataBuffer).indexOf(givenType[1])],
									givenType[2]
								);
							if(givenAry.every(function(buffer){
								return !buffer.equals(newItem);
							}))
								givenAry.push(newItem);
						});
						
						var tempBound = [newBuffer.pop(),newBuffer.shift()].map(function(data){ return Number((data || {}).hour); });
						lookupBound.push.apply(lookupBound,
							lookupBound.splice(0).map(function(bound,index){
								var
									vld = function(val){return isFinite(val) && !isNaN(val);},
									ary = [tempBound[index],bound];
								if(!ary.every(vld))
									return ary.filter(vld).pop();
								else
									return Math[['max','min'][index]].apply(null,ary);
							})
						);
						
						refreshCurrentBuffer.call(self);
						
						// Finalize
						self.refreshList();
					} catch (e) {
						console.error(e.stack);
					} finally {
						bufferCancel = false;
						$("button,input",baseContext).each(function(idx,elm){
							$(elm).prop('disabled',$(elm).data('disable-lock') || false);
						});
					}
				}
			);
		}
		
	};
	
	/* Local/Inner class KC3Buffer
	----------------------------------------------- */
	
	var KC3LodgerBuffer = (function(){
		function KC3LodgerBuffer(id,hour,matr,mult,optional) {
			/*jshint: validthis true*/
			if(this instanceof KC3LodgerBuffer){
				if([3,5].indexOf(arguments.length) < 0){
					throw new RangeError('Constructor parameter only able to take between 3 and 5 inclusive.');
				}else{
					mult = Math.max(0,(!parseInt(mult) || isNaN(mult) || !isFinite(mult) || Math.sign(mult) < 0) ? 1 : mult);
					
					Object.defineProperties(this,{
						id  :{value:id      },
						hour:{value:hour    },
						matr:{value:matr    },
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
		
		KC3LodgerBuffer.toString = String.prototype.toString.bind("function KC3Buffer(id,hour,material[,optional])",function(){ return ;});
		
		Object.defineProperty(KC3LodgerBuffer,'toString',{});
		
		return KC3LodgerBuffer;
	})();
	
	/* Local Function
	----------------------------------------------- */
	
	function refreshCurrentBuffer(){
		// This is a private function for the lodger tab itself though.
		/*jshint validthis: true*/
		if(this !== activeTab.definition) {
			return false;
		}
		var self = this;
		allBuffer = Object.keys(this.dataBuffer)
			.filter(function(x){return self.filter[x];})
			.map(function(x){return self.dataBuffer[x] || [];})
			.reduce(function(x,y){return x.concat(y);});
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
		
		sRatio  = Math.pow(dcCoef,-0.2);
		aRating = (aRating * (1-sRatio) + (new KC3LodgerBuffer(null,null,dataSum)).bRating * sRatio);
		
		dRating = dataAvg.length > 1 ? Math.stdev.apply(null,dataAvg) : 0;
		pRatio  = Math.pow(Math.max(0,1 - Math.abs(aRating)),1.5) * Math.sign(aRating);
		
		bResult = {bRating: aRating + dRating * pRatio};
		return KC3LodgerBuffer.prototype.rating.bind(bResult,bResult).call();
	}
	
})();
