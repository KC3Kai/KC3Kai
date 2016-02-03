/* GoalTemplateManager.js

   Manages goal-templates for leveling tab.

*/

(function() {
    "use strict";

    /*

      Data Format:

      localStorage.goalTemplates
      array of templates

      template:
      { stype: <array of ship types> (e.g. ["DD","CL"..])
               (ship type should be normalized (all in uppercase))
               ("*" is a ship type wildcard)
      , map: [<world#>,<map#>]
      , rank: <E,D,C,B,A,S,SS> = <1,2,3,4,5,6,7>
      , flagship: true / false
      , mvp: true / false
      , enable: true / false
      }

     */

    window.GoalTemplateManager = {
        validSTypes: [],

        load: function() {
            return JSON.parse(localStorage.goalTemplates || "[]");
        },
        save: function(t) {
            try {
                if (!Array.isArray(t))
                    throw "not an array";
                localStorage.goalTemplates =
                    JSON.stringify(t);
            } catch (err) {
                console.log("error when saving:", err);
            }
        },
        newTemplate: function() {
            return {
                stype: ["*"],
                map: [3,2],
                rank: 6,
                flagship: true,
                mvp: true,
                enable: true
            };
        },
        // parse ship type query
        parseSType: function(raw) {
            var self = this;
            var parsed = raw
                .split(",")
                .map(function(x) { return x.trim(); } )
                .filter( function(x) { return x.length > 0; } )
                .map( function(x) { return x.toUpperCase(); } );
            // TODO: remove invalid & duplicate
            var shipTypes = [];

            if (parsed.indexOf("*") != -1)
                shipTypes.push("*");

            $.each(self.validSTypes , function(i,stype) {
                if (parsed.indexOf(stype) != -1)
                    shipTypes.push(stype);
            });

            // TODO: make sure "*" is handled properly
            return shipTypes;
        },
        // return a string represetation of stype query
        showSType: function(stypes) {
            function translate(x) {
                return x === "*"? "Any":x;
            }
            return stypes.length === 0 ? "<Empty>" : stypes.map(translate).join(",");
        },
        showInputSType: function(stypes) {
            return stypes.join(",");
        },
        applyTemplate: function(grindData, template) {
            var result = grindData.slice();
            result[1] = template.map[0];
            result[2] = template.map[1];
            result[4] = template.rank;
            result[5] = template.flagship?1:0;
            result[6] = template.mvp?1:0;
            return result;
        },
        checkShipType: function(stypeId, template) {
            if (template.stype.indexOf("*") != -1)
                return true;
            var KGS = PS["KanColle.Generated.SType"];
            var stypeIds = template.stype.map( function(x) {
                return KGS.toInt(KGS.readSType(x));
            });
            return stypeIds.indexOf(stypeId) != -1;
        }
    };

    // initialize valid stypes
    var stypeRaw =
        "DDE DD  CL  CLT " +
        "CA  CAV CVL FBB " +
        "BB  BBV CV  XBB " +
        "SS  SSV AP  AV  " +
        "LHA CVB AR  AS  " +
        "CT  AO";
    window.GoalTemplateManager.validSTypes =
        stypeRaw
          .split(" ")
          .filter( function(x) { return x.length > 0; });
})();
