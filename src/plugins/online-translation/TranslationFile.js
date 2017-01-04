/**
 * KC3 Translation File
 * Used to laod a single translation file from a specifiable source
 * 
 * Browser compatibility
 * Requires: Chrome 49.0 (ES6)
 * https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Classes#Browser_compatibility
 */
class KC3TranslationFile {
    
    constructor(source, filename, language, async) {
        this.source = source;
        this.filename = filename;
        this.language = language;
        this.async = typeof async == 'undefined' ? true : async;
        
        this.json_en = {};
        this.json_local = {};
    }
    
    
}


(function(){
    "use strict";

    
    window.KC3TranslationFile = function( source, filename, language, async ){
        this.source = source;
        this.filename = filename;
        this.language = language;
        this.async = typeof async == 'undefined' ? true : async;
        
        this.json_en = {};
        this.json_local = {};
    };
    
    //---------------- PUBLIC FUNCTIONS ----------------//
    
    KC3TranslationFile.prototype.loadEnglish = function(callback){
        loadJSON(
            repo+'lang/data/en/' + filename + '.json',
            this.async,
            callback
        );
    };
    
    KC3TranslationFile.prototype.loadLanguage = function(){
        
    };
    
    KC3TranslationFile.prototype.addTags = function(){
        
    };
    
    
    //---------------- PRIVATE FUNCTIONS ----------------//
    
    function loadJSON(targetUrl, doAsync, callback){
        try {
            (doAsync ? loadAsync : loadSync )(targetUrl, callback);
        } catch (e) {
            callback({}, e);
        }
    }
    
    function loadSync(targetUrl, callback){
        var data = JSON.parse($.ajax({
            url : targetUrl,
            dataType: 'JSON',
            async: false
        }).responseText);
        callback(data);
    }
    
    function loadAsync(targetUrl, callback){
        $.ajax({
            url : targetUrl,
            dataType: 'JSON',
            sucess: function(response){
                callback(JSON.parse(response));
            }
        });
    }

})();