// to run in sroom console

// fetch collected quests
fetch("https://kcrdb.hitomaru.dev/quests/data?is_sus=false&sort=api_no").then((resp) => (resp.ok && resp.json())).then((o) => { quests=o; dupes=o.items.filter(q => q.api_select_rewards).map(({api_no, api_title, api_select_rewards}) => ({id:api_no, title:api_title, select:api_select_rewards})); console.debug(quests, dupes); })

// compile known selectable rewards
rewards={}; dupes.map(q => q.select.map(g => g.map(o => (((o.api_kind==11 ? KC3Meta.shipNameById(o.api_mst_id) : o.api_kind==12 ? KC3Meta.gearNameById(o.api_mst_id) : o.api_kind==13 ? KC3Meta.useItemName(o.api_mst_id) : o.api_kind==14 ? KC3Master.furniture(o.api_mst_id).api_title :"")||[o.api_kind,o.api_mst_id].join("="))+" x"+o.api_count+(o.api_slotitem_level?" \u2605+"+o.api_slotitem_level:"") )))).forEach((r,i) => { rewards[titles[i].id] = r}); console.debug(rewards);

copy(JSON.stringify(rewards,null,"\t"))
