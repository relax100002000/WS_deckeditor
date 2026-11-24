/*
 * fetch_zh_console.js
 * 在貓罐子 BottleNeko (https://bottleneko.app/) 頁面的瀏覽器 Console 執行，下載中文翻譯 ws_zh.json
 * 之後執行: node tools/build_card_info.js ws_cards.json ws_zh.json
 *
 * SERIES: 貓罐子的系列編號 (系列卡表網址 https://bottleneko.app/ws/series/<編號>；GA文庫 = 172、角川スニーカー文庫 = 89、BanG Dream! = 31 …)
 */
(async () => {
	const SERIES = [172, 89, 31, 176, 174, 167, 154, 147, 146, 72, 27, 170];
	const out = {};
	for (const s of SERIES) {
		const cards = await (await fetch('https://api.bottleneko.app/series/' + s + '/cards')).json();
		cards.forEach((c) => {
			const z = c.i18n && c.i18n.zh;
			if (z && z.effect) out[c.id] = { t: z.title || '', e: z.effect, a: z.author || '' };
		});
	}
	const a = document.createElement('a');
	a.href = URL.createObjectURL(new Blob([JSON.stringify(out)], { type: 'application/json' }));
	a.download = 'ws_zh.json';
	document.body.appendChild(a);
	a.click();
	console.log('downloaded', Object.keys(out).length, 'translations');
})();
