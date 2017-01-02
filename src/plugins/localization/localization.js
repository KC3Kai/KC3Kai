(function(){
	
	const PluginSettings = [
		{
			id : "language",
			name : "SettingsLanguage",
			type : "radio",
			options : {
				choices : [
					[ "en", "English" ],
					[ "de", "Deutsch" ],
					[ "nl", "Dutch" ],
					[ "es", "Español" ],
					[ "fr", "Français" ],
					[ "id", "Indonesian" ],
					[ "it", "Italiano" ],
					[ "jp", "日本語" ],
					[ "kr", "한국어" ],
					[ "pt", "Português" ],
					[ "ru", "Русский" ],
					[ "scn", "简体中文" ],
					[ "tcn", "繁體中文" ],
					[ "th", "ภาษาไทย" ],
					[ "vi", "Tiếng Việt" ],
					[ "ua", "Українська" ]
				]
			}
		}
	];
	
	const PluginLoaded = function(){
		
		KC3Translation.loadTranslationFile = function(filename, callback){
			const tlfile = new KC3TranslationFile(source, filename, language, true);
			
			// tlfile
			
		};
		
		
		KC3Meta.loadTranslations = function(){
			var self = this;
			
			KC3Translation.setSource(repo);
			
			KC3Translation.loadTranslationFile('ships', function(data){ self._ship = data; });
			KC3Translation.loadTranslationFile('items', function(data){ self._slotitem = data; });
			KC3Translation.loadTranslationFile('equiptype', function(data){ self._equiptype = data; });
			KC3Translation.loadTranslationFile('quests', function(data){ self._quests = data; });
			KC3Translation.loadTranslationFile('ranks', function(data){ self._ranks = data; });
			KC3Translation.loadTranslationFile('stype', function(data){ self._stype = data; });
			KC3Translation.loadTranslationFile('servers', function(data){ self._servers = data; });
			KC3Translation.loadTranslationFile('battle', function(data){ self._battle = data; });
			KC3Translation.loadTranslationFile('custom', function(data){ self._langcustom = data; });
		};
		
		/**
		 * APPLY WORDS
		 * Change words inside visible DOM elements
		 */
		KC3Translation.applyWords = function(){
			// Interchange element contents with translations
			$(".i18n").each(function(){
				$(this).html( KC3Meta.term( $(this).text() ) );
				$(this).css("visibility", "visible");
			});
			// Update title attribute with translations
			$(".i18n_title").each(function(){
				$(this).attr("title", KC3Meta.term( $(this).attr("title") ) );
			});
		};
		
		/**
		 * APPLY CUSTOM FONTS
		 * For specific languages that need custom font for readability
		 */
		KC3Translation.applyCustomFont = function(){
			// Specialized fonts
			var fontFamily = false;
			switch(ConfigManager.language){
				
				case "scn": fontFamily = '"HelveticaNeue-Light","Helvetica Neue Light","Helvetica Neue",Helvetica,"Nimbus Sans L",Arial,"Lucida Grande","Liberation Sans","Microsoft YaHei UI","Microsoft YaHei","Hiragino Sans GB","Wenquanyi Micro Hei","WenQuanYi Zen Hei","ST Heiti",SimHei,"WenQuanYi Zen Hei Sharp",sans-serif'; break;
				
				case "tcn": fontFamily = '"Helvetica Neue", Helvetica, "Microsoft JhengHei", "Microsoft JhengHei UI", Arial,"Heiti TC", sans-serif'; break;
				
				case "jp": fontFamily = '"Helvetica Neue", "Tahoma", Helvetica, Arial, "ヒラギノ角ゴ Pro W3", "Hiragino Kaku Gothic Pro", Osaka, "メイリオ", "Meiryo", "Yu Gothic UI Semibold", "ＭＳ Ｐゴシック", "MS PGothic", sans-serif'; break;
				
				default: break;
			}
			
			if(fontFamily){ $("body").css("font-family", fontFamily); }
		};
		
		/**
		 * APPLY HTML LANGUAGE TAG
		 * Add attribute to HTML tag about language
		 */
		KC3Translation.applyHtmlLanguageTag = function(){
			// Apply HTML language code
			$("html").attr("lang", ConfigManager.language);
		};
		
	};
	
	KC3Plugins.registerPlugin('localization', PluginLoaded, PluginSettings);
	
	KC3Plugins.registerHook.Game('localization', function(){
		KC3Translation.applyWords();
		KC3Translation.applyCustomFont();
		KC3Translation.applyHtmlLanguageTag();
	});
	
	KC3Plugins.registerHook.StrategyRoom('localization', function(){
		KC3Translation.applyWords();
		KC3Translation.applyCustomFont();
		KC3Translation.applyHtmlLanguageTag();
	});
	
	KC3Plugins.registerHook.Panel('localization', function(){
		KC3Translation.applyWords();
		KC3Translation.applyCustomFont();
		KC3Translation.applyHtmlLanguageTag();
	});
	
	KC3Plugins.registerHook.Page('localization', function(){
		KC3Translation.applyWords();
		KC3Translation.applyCustomFont();
		KC3Translation.applyHtmlLanguageTag();
	});
	
	KC3Plugins.registerHook.Menu('localization', function(){
		KC3Translation.applyWords();
		KC3Translation.applyCustomFont();
		KC3Translation.applyHtmlLanguageTag();
	});
	
})();