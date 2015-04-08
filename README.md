# KC3改

Successor to KanColle Command Center, KC3改 is a Kantai Collection Game Viewer containing useful tools. It's an easy one-click installation from the Chrome Webstore, and its free!

#### Installation
Just visit KC3改 on Chrome Webstore and click on the "Free" button at the top:

* Visit on Chrome Webstore (*not yet released*)

#### Updating
Like the old KC3, **there is no need to worry about updating**. Chrome extensions update automatically when they are released. Commits here on GitHub are different from version releases so do not worry if you still don't see features that have code but not yet on your KC3改 installation.

If you're still not seeing the latest version as it is claimed on the KC3改 introduction page, you can force to update Chrome Extensions by going to `chrome://extensions/`, tick "*Developer mode*" and a button saying "*Update extensions now*" will appear.

#### Other Chromium-based Browsers
If you're not using Google Chrome, and prefer to use [another Chromium-based browser](http://en.wikipedia.org/wiki/Chromium_%28web_browser%29%23Other_browsers_based_on_Chromium) such as Comodo Dragon, Rockment, Opera, etc, you can request a `.crx` file on [Issues Tracker](https://github.com/dragonjet/KC3Kai/issues), name it "*CRX Request*", and mark it with "*help wanted*" label.


## Features
#### Region Cookies
Whenever you get *Error Area* page on DMM, just go to the KC3改 menu at the top-right of your Chrome (**Gold Heart** Icon) and select "**Activate Region Cookies**". Please note that you only need to do this the first time. Succeeding logins will not restrict you anymore, until you specifically attempt to clear your cookies.

#### Play via API Link
text here

* Ability to remember your
* Two-click action will refresh your API link

#### Play directly on DMM
In case you want to play directly on DMM without API Links (*e.g. it's your preference, or renaming fleets, or purchasing from item shop*), you may do so by selecting "**Play on DMM**" from the KC3改 menu. It will not extract your API Link. Note that **you can still use the "*F12*" Dashboard while on DMM**, just make sure it is open before the game loads.

#### Strategy Room
text here

* Ship List and Equipment List
* Sortie and Event Battle Logs
*  Ship Construction Logs
* Equipment Crafting Logs


## FAQ
#### Do I need to have both KC3 and KC3改 installed?
**No**, actually, t is even recommended to uninstall the old KC3 so it won't conflict, like for example when getting a new API link. Both will attempt to extract it when you go to DMM. You will also have less icons on your browser if you uninstall the traditional KC3.

#### Can I play other DMM Games using this?
**No**, it will not give you data and timers for other games. However, you may still play them on Chrome even if KC3改 is installed and running KanColle. No need to worry about conflict or account safety when playing other games. If you're still looking for a game container for other games, you might to check [ViewThisGlobal](https://github.com/dragonjet/ViewThisGlobal) instead.


## About
#### Logo and Icon
Designed by [Kurotoshigami](http://www.pixiv.net/member.php?id=11090147) during the [KC3 Kai Logo Design Contest](http://kancolle.wikia.com/wiki/Thread:207644).

![KC3改 Logo](http://puu.sh/h4Gbb.png)

#### Third-party Libraries
* [jQuery](https://jquery.com) - JavaScript Library
* [Dexie.js](http://www.dexie.org) - IndexedDB Wrapper
* [Chart.js](http://www.chartjs.org) - Charts for the strategy room
* [Bootstrap.css](http://getbootstrap.com) - Responsive framework
* [Keys.css](http://michaelhue.com/keyscss) - Keyboard styling
* Build tools: [NPM](https://www.npmjs.com) and [Grunt](http://gruntjs.com).