/* GoalTemplateManager.js

   Manages goal-templates for leveling tab.

*/

(function() {
    "use strict";

    /*

      Data Format: 
      
      localStorage.goalTemplates
      { templates: <array of templates>
      , version: 1
      }

      template:
      { stype: <array of ship types> (e.g. ["DD","CL"..])
               (ship type should be normalized (all in uppercase))
               ("*" is a ship type wildcard)
      , map: [<world#>,<map#>]
      , rank: <E,D,C,B,A,S,SS> = <1,2,3,4,5,6,7>
      , flagship: true / false
      , mvp: true / false
      }

     */

    window.GoalTemplateManager = {
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
                mvp: true
            };
        }
    };
})();
