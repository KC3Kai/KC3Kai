# KC3改

Successor to KanColle Command Center, KC3改 is a Kantai Collection Game Viewer containing useful tools. *It's an easy one-click installation from the Chrome Webstore, and its free!*

#### Installation
Just visit KC3改 on Chrome Webstore and click on the "Free" button at the top:

* [Visit on Chrome Webstore](https://chrome.google.com/webstore/detail/kancolle-command-center-改/hkgmldnainaglpjngpajnnjfhpdjkohh)
* **Please uninstall the old KC3!**

*What are the requirements?* Just your [Google Chrome](http://www.google.com/chrome/) browser, and will work on any OS that has it, except for mobile devices.

#### Updating
Like the old KC3, **there is no need to worry about updating**. Chrome extensions update automatically when they are released. Commits here on GitHub are different from version releases so do not worry if you still don't see features that have code but not yet on your KC3改 installation.

If you're still not seeing the latest version as it is claimed on the KC3改 introduction page, you can force to update Chrome Extensions by going to `chrome://extensions/`, tick "*Developer mode*" and a button saying "*Update extensions now*" will appear.

#### Other Chromium-based Browsers
If you're not using Google Chrome, and prefer to use [another Chromium-based browser](http://en.wikipedia.org/wiki/Chromium_%28web_browser%29%23Other_browsers_based_on_Chromium) such as Comodo Dragon, Rockment, Opera, etc, you can request a `.crx` file on [Issues Tracker](https://github.com/dragonjet/KC3Kai/issues), name it "*CRX Request*", and mark it with "*help wanted*" label. They are not fully supported browsers though, you may attempt to use the `.crx` file but there's no guaranteed help.


## Features
This is only a quick list of the main features. If you want to see the full list and details of each, please visit the official [KC3改 introduction page on KanColle English Wikia](#).

#### Region Cookies
Whenever you get *Error Area* page on DMM, just go to the KC3改 menu at the top-right of your Chrome (**Gold Heart** Icon) and select "**Activate Region Cookies**". Please note that you only need to do this the first time. Succeeding logins will not restrict you anymore, until you specifically attempt to clear your cookies.

#### Play via API Link
* One-click action from the menu to get a new API link
* Ability to remember your last used API link
* Set any background image or color around the game screen

#### Play directly on DMM
In case you want to play directly on DMM without API Links (*e.g. it's your preference, or renaming fleets, or purchasing from item shop*), you may do so by selecting "**Play on DMM**" from the KC3改 menu. It will not extract your API Link. Note that **you can still use the "*F12*" Dashboard while on DMM**, just make sure it is open before the game loads.

#### "*F12*" Admiral Dashboard
* View **HQ Information**, level, exp and percentage bar
* **Consumable item** counts such as bucket, screw, furniture coins
* Ship slot and equipment slot **counts**
* **Timers and alert** for expedition, repair, and construction
* View fleet summaries for any of the **four fleets**
* View fleet totals like **Sum Level, Effective LoS, Fighter Power**, etc
* Ship list and ship details inside fleet, including **morale, equipment**, etc.
* **Share Fleet composition** as image

#### Strategy Room
* Interactive Ship List and Equipment List
* Quest list **with Flowchart** and completion highlights
* **Resource** Logs with **line graph** for usage **visualization**
* Detailed Sortie and **Event Battle Logs**
* Ship Construction Logs
* Equipment Crafting Logs
* Extra Tools such as EXP Calculator


## FAQ
For more information and FAQs, please visit the official [KC3改 introduction page on KanColle English Wikia](#).

#### Is this safe?
**Yes**, there is nothing in between the client game and the servers, the network is 100% natural. There are no packets changed in between neither sent off towards the server. KC3改 only feeds off of **history** on the "Network" tab on the F12 panel (the reason why it's there beside it). The keyword is **history**, means the calls already happened before we receive it and we're **not intercepting** anything. Nothing gets safer than this to the paranoid level.

#### Do I need to have both KC3 and KC3改 installed?
**No**, actually, t is even recommended to uninstall the old KC3 so it won't conflict, like for example when getting a new API link. Both will attempt to extract it when you go to DMM. You will also have less icons on your browser if you uninstall the traditional KC3.

#### Can I play other DMM Games using this?
**No**, it will not give you data and timers for other games. However, you may still play them on Chrome even if KC3改 is installed and running KanColle. No need to worry about conflict or account safety when playing other games. If you're still looking for a game container for other games, you might to check [ViewThisGlobal](https://github.com/dragonjet/ViewThisGlobal) instead.


## About
#### Logo and Icon
Designed by [Kurotoshigami](http://www.pixiv.net/member.php?id=11090147) during the [KC3 Kai Logo Design Contest](http://kancolle.wikia.com/wiki/Thread:207644).

![KC3改 Logo](http://puu.sh/h4Gbb.png)

#### License
**MIT**. See the License file.

#### Third-party Libraries
* [jQuery](https://jquery.com) - JavaScript Library
* [Dexie.js](http://www.dexie.org) - IndexedDB Wrapper
* [Chart.js](http://www.chartjs.org) - Charts for the strategy room
* [Bootstrap.css](http://getbootstrap.com) - Responsive framework
* [Keys.css](http://michaelhue.com/keyscss) - Keyboard styling
* Build tools: [NPM](https://www.npmjs.com) and [Grunt](http://gruntjs.com).
