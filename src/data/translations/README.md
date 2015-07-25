## KC3改 Localization

https://github.com/dragonjet/KC3Kai/wiki/Localization

This note file will be maintained so translators from forks can easily check back if anything has changed within the EN json files, and have their locally translated files updated as well. This will also inform of latest change in mechanism so adjustments can be made by translators.

## Maintainers & Translators
In case you want to assist the translations, you may contact related constributors by tagging them on an issue. If it is a new language, see the GitHub wiki link at the top about Localization.

##### DE (German "Deutsch")
* [Admiral Mikado](http://kancolle.wikia.com/wiki/User:Admiral_Mikado) (via manual)

##### EN (English)
* @dragonjet (via main repo)

##### FR (French "Français")
* @Arkayda963 (via manual)

##### ID (Indonesian)
* @freezebear (via fork)
* @hufuhufu (via fork)
* @vrarara (via fork)

##### JP (Japanese "日本語")
Note that the jp folder contain translations for Japanese (ja)
* @nicky008 (via fork)

##### SCN (Simplified Chinese "简体中文")
Note that the scn folder contain translations for Simplified Chinese (zh-hans)
* @Diablohu (via fork)

##### TCN (Traditional Chinese "繁體中文")
Note that the tcn folder contain translations for Traditional Chinese (zh-hant)
* @kololz (via fork)
* @c933103 (via fork)

##### VI (Vietnamese "Tiếng Việt")
* @bamboo3250 (via fork)



## Translation Changelog

#### 22nd July 2015

Everyone, please view:
* https://github.com/dragonjet/KC3Kai/issues/355

`developers.json`
* No need to copy this on your localized files. Remove if exists.

`settings.json`
* No need to copy this on your localized files. Remove if exists.

`terms.json`
* Words from `developers.json` and `settings.json` were transferred here.


#### 21st July 2015

**General**
* For those who are not yet informed, there's a new mechanism that merges your local translations on top the English files. This means if you missed any translation or have not yet translated it, by default, English will be used. This means you can leave untranslated JSON files as empty `{}`. This also means that in your localized files, you also do not need to include fixed variables such as `type` and sometimes `options` in `settings.json` or `links` in `developers.json`, etc.
* It is advised that in your `settings.json`, remove the `language` > `options` > `choices`. Due to the mechanism mentioned above, missing local translations will use the English one - which is a good thing for this case to keep all languages to have the same list of choices. You also do not need to translate other languages since it should **always** use its **native name**, e.g. "Deutsch" instead of "German" regardless of selected language.

`terms.json`
* added `PanelErrorStorage`



#### 20th July 2015

`developers.json`
* Added Admiral Mikado

`settings.json`
* Added German


#### 17th July 2015

`terms.json`
* AboutTitle
* MenuPlayAPIName
* MenuPlayAPIDesc
* MenuRefreshAPIName
* MenuRefreshAPIDesc
* MenuPlayDMMName
* MenuPlayDMMDesc
* MenuCookiesName
* MenuCookiesDesc
* MenuStrategyName
* MenuStrategyDesc
* MenuSettingsDesc
* MenuAboutDesc
* MenuChecking
* MenuOnLatest


#### 16th July 2015

`developers.json`
* Diablohu has been updated with ", TL (SCN)" under his `desc`

`settings.json`
* Now includes 5 languages. make sure your local settings.json also have them
	
`terms.json`
* AboutHelpCommunity
* AboutHelpLearnMore

`record.json`
* This file will be removed soon. Please use `terms.json`
