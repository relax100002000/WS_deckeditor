/*
 * fetch_ws_console.js
 * 在 https://ws-tcg.com/cardlist/ 頁面的瀏覽器 Console 貼上執行，下載 ws_cards.json
 * 之後執行: node tools/build_card_info.js ws_cards.json ws_zh.json
 *
 * TITLES: 要收錄的タイトル名稱 (官網カードリスト「タイトル」選單的名稱)
 */
(async () => {
	const TITLES = ['GA文庫', '角川スニーカー文庫', 'BanG Dream!', 'ガールズ＆パンツァー', 'ステラソラ', 'anemoi',
		'勝利の女神：NIKKE', '葬送のフリーレン', '【推しの子】', 'Re:ゼロから始める異世界生活',
		'アイドルマスター シンデレラガールズ', 'ブラウンダスト2'];
	const opt = await (await fetch('/manage/CardListUser/filter-options')).json();
	const titles = [], ids = new Set();
	for (const name of TITLES) {
		const t = opt.sides.find((x) => x.name == name);
		if (!t) { console.warn('找不到タイトル', name); continue; }
		const q = 'title_number=' + encodeURIComponent(t.title_number);
		const m = new Map();
		for (let p = 1; p <= 200; p++) {
			let j;
			for (let k = 0; k < 3 && !j; k++) { try { j = await (await fetch('/manage/CardListUser/searchJson?' + q + '&show_page_count=100&page=' + p)).json(); } catch (e) {} }
			j.items.forEach((c) => m.set(c.card_number, c));
			if (j.items.length < 100) break;
		}
		const cards = [...m.values()];
		cards.forEach((c) => ids.add(String(c.expansion)));
		titles.push({ name, side: t.side, codes: t.title_number.replace(/^##|##$/g, '').split('##'), cards });
		console.log(name, cards.length);
	}
	const expansions = {};
	(Array.isArray(opt.expansions) ? opt.expansions : Object.values(opt.expansions).flat())
		.forEach((e) => { if (e && ids.has(String(e.id))) expansions[e.id] = e.name; });
	const a = document.createElement('a');
	a.href = URL.createObjectURL(new Blob([JSON.stringify({ titles, expansions })], { type: 'application/json' }));
	a.download = 'ws_cards.json';
	document.body.appendChild(a);
	a.click();
})();
