/*
 * fetch_ban_console.js
 * 在官網「デッキ構築ルール」頁 (https://ws-tcg.com/rules/deck_rule/) 的瀏覽器 Console 執行，
 * 解析「カードの使用制限に関するルール」中的ネオスタンダード構築制限表，下載 ban_list.js → 覆蓋 js/ban_list.js
 */
(() => {
	const txt = (document.querySelector('main') || document.body).textContent.replace(/[ \t]+/g, ' ').replace(/\n\s*\n+/g, '\n');
	const period = txt.match(/「([^」]*制限改定)」において、対象となるカードは以下の通りです。（適用期間：([^）]*)）/) || [];
	const s = txt.indexOf('ネオスタンダード構築 タップで表示');
	const e = txt.indexOf('スタンダード構築／サイド限定構築 タップで表示', s + 1);
	if (s < 0) { console.error('找不到ネオスタンダード構築的制限表，頁面可能已改版'); return; }
	const lines = txt.slice(s + 'ネオスタンダード構築 タップで表示'.length, e < 0 ? undefined : e).split('\n').map((l) => l.trim()).filter(Boolean);
	const rules = [];
	let title = null, rule = null, m;
	for (const l of lines) {
		if (/^以下のカードは/.test(l)) continue;
		if (l == '使用不可') { rule = { title, type: 'ban', n: 0, cards: [], note: '' }; rules.push(rule); continue; }
		if ((m = l.match(/^(\d+)枚まで使用可$/))) { rule = { title, type: 'limit', n: +m[1], cards: [], note: '' }; rules.push(rule); continue; }
		if ((m = l.match(/^(\d+)種選抜$/))) { rule = { title, type: 'choose', n: +m[1], cards: [], note: '' }; rules.push(rule); continue; }
		if (rule && (m = l.match(/^(.+?)　(.+)$/)) && /[A-Za-z0-9]+\/[A-Za-z0-9]+-/.test(m[2])) {
			rule.cards.push({ name: m[1].trim(), ids: m[2].split(' / ').map((x) => x.trim()).filter(Boolean) });
			continue;
		}
		if (rule && /^ただし|^・/.test(l)) { rule.note += (rule.note ? '\n' : '') + l; continue; }
		title = l; rule = null;
	}
	const today = new Date().toISOString().slice(0, 10);
	const js = '// ヴァイスシュヴァルツ カードの使用制限 (ネオスタンダード構築)\n' +
		'// source: https://ws-tcg.com/rules/deck_rule/ (' + (period[1] || '') + '，適用期間：' + (period[2] || '') + ')\n' +
		'// fetched: ' + today + '　regenerate: tools/fetch_ban_console.js\n' +
		'// type: ban = 使用不可 / limit = n枚まで使用可 / choose = n種選抜 (該組只能選 1 種)\n' +
		'// note: 特別条件 (滿足的牌組不受此限制；本工具只顯示，不自動判定)\n' +
		'var BAN_INFO = ' + JSON.stringify({ name: period[1] || '', period: period[2] || '', fetched: today }) + ';\n' +
		'var BAN_RULES = [\n' + rules.map((r) => '\t' + JSON.stringify(r)).join(',\n') + '\n];\n';
	const a = document.createElement('a');
	a.href = URL.createObjectURL(new Blob([js], { type: 'text/javascript' }));
	a.download = 'ban_list.js';
	document.body.appendChild(a);
	a.click();
	console.log('rules', rules.length);
})();
