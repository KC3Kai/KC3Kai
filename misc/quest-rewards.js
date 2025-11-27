// For running in strategy room devtools console, in order to reuse master and translation data.
// note: console command line copy() to clipboard function not availiable in promise context

// fetch collected unmodified quests first
fetch("https://kcrdb.hitomaru.dev/quests/data?is_mod=false&sort=api_no").then((resp) => (resp.ok && resp.json())).then((o) => { quests=o; dupes=o.items.filter(q => q.api_select_rewards).map(({api_no, api_title, api_select_rewards}) => ({id:api_no, title:api_title, select:api_select_rewards})); console.debug(quests, dupes); })

// compile known selectable rewards
rewards={}; dupes.map(q => q.select.map(g => g.map(o => (((o.api_kind==11 ? KC3Meta.shipNameById(o.api_mst_id) : o.api_kind==12 ? KC3Meta.gearNameById(o.api_mst_id) : o.api_kind==13 ? KC3Meta.useItemName(o.api_mst_id) : o.api_kind==14 ? KC3Master.furniture(o.api_mst_id).api_title :"")||[o.api_kind,o.api_mst_id].join("="))+" x"+o.api_count+(o.api_slotitem_level?" \u2605+"+o.api_slotitem_level:"") )))).forEach((r,i) => { rewards[dupes[i].id] = r}); console.debug(rewards);
copy(JSON.stringify(rewards,null,"\t"))

// check id diff for new quests
diff=quests.items.filter(q => (!KC3Meta.quest(q.api_no))); meta={}; diff.forEach(q => { meta[q.api_no]={ code:"???", name:q.api_title, desc:q.api_detail, memo:"※", hash:q.api_title.hashCode()}; }); console.debug(diff.length, meta);
copy(JSON.stringify(meta,null,"    "))

// check text diff for correcting jp json
fetch("https://kcrdb.hitomaru.dev/quests/data?is_mod=false&is_verified=false").then(resp => (resp.ok && resp.json())).then(o => { quests=o; console.debug(quests); });
diff=quests.items.filter(q => { m = KC3Meta.quest(q.api_no); return m.name != q.api_title || m.desc.replace(/<br>/g,'') != q.api_detail.replace(/<br>/g,''); }).map(q => ({ id: q.api_no, name: q.api_title, desc: q.api_detail, difftitle: q.api_title != KC3Meta.quest(q.api_no).name })); console.debug(diff);
copy(JSON.stringify(diff,null,"    "))

// update to tl json temporarily for tests
meta=KC3Meta._quests; quests.items.forEach(q => { m=meta[q.api_no]||{}; m.name=q.api_title; m.desc=q.api_detail; }); console.debug(meta); copy(JSON.stringify(meta,null,"    "))

