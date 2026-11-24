/*
 * build_card_info.js
 * 把官方カードリスト (ws-tcg.com /manage/CardListUser/searchJson) 抓下來的 JSON 轉成
 *   js/card_info.js      : 欄位定義、商品名 (EXPANSIONS)、タイトル一覽 (SERIES)
 *   data/<タイトル>.js   : 每個タイトル一個檔 (基本卡＋パラレル)，選到該タイトル時才載入
 *
 * 用法 (Node 18+，專案根目錄):
 *   node tools/build_card_info.js ws_cards.json [ws_zh.json]
 *
 * ws_cards.json：在官網カードリスト頁的 Console 執行 tools/fetch_ws_console.js 下載的檔案
 *                格式 { titles: [{name, side, codes, cards: [...]}], expansions: {id: 名稱} }
 * ws_zh.json   ：(選用) 中文翻譯，在貓罐子 (bottleneko.app) 頁面的 Console 執行 tools/fetch_zh_console.js 下載
 *                格式 { "カード番号": { t: 中文卡名, e: 中文效果 (\n 換行), a: 譯者 } }
 *                tools/zh_manual.json 為手動補充的翻譯 (優先於 ws_zh.json)
 *
 * 規則 (每個タイトル各自判斷):
 *  - parallel_param 不是「〇」的卡 = 基本卡
 *  - parallel_param 是「〇」的卡 (SR/SP/SSP/RRR/TDP… 等パラレル)，以及同名同テキスト的 PR 再録 = 異圖
 *    依「カード名＋テキスト」對回基本卡；找不到基本卡的パラレル (例: 只有 PR 版) 當作基本卡收錄
 */
const fs = require('fs');
const path = require('path');

const src = process.argv[2] || 'ws_cards.json';
const ROOT = path.join(__dirname, '..');
const input = JSON.parse(fs.readFileSync(src, 'utf8'));
const TITLES = input.titles;
const EXPANSIONS = input.expansions || {};
const zhSrc = process.argv[3];
const zh = zhSrc ? JSON.parse(fs.readFileSync(zhSrc, 'utf8')) : {};
const manualPath = path.join(__dirname, 'zh_manual.json');
if (fs.existsSync(manualPath)) Object.assign(zh, JSON.parse(fs.readFileSync(manualPath, 'utf8')));
const zhOf = (c) => zh[c.card_number] || {};

const KIND = { '2': 'キャラ', '3': 'イベント', '4': 'クライマックス' };
const COLOR = { 'yellow.gif': '黄', 'green.gif': '緑', 'red.gif': '赤', 'blue.gif': '青', 'purple.gif': '紫' };
const icons = (s) => [...String(s || '').matchAll(/\[\[([^\]]+)\.gif\]\]/g)].map((m) => m[1]);
const dash = (s) => (s === '-' || s == null ? '' : String(s));
const numKey = (n) => n.replace(/\d+/g, (d) => d.padStart(4, '0'));

function row(c) {
	const col = (String(c.color).match(/\[\[([^\]]+)\]\]/) || [])[1];
	return [
		c.card_number,                               // ID
		c.card_name,                                 // NAME
		c.card_name_kana || '',                      // KANA
		KIND[c.card_kind] || c.card_kind,            // KIND
		COLOR[col] || dash(c.color),                 // COLOR
		dash(c.level),                               // LEVEL
		dash(c.cost),                                // COST
		dash(c.power),                               // POWER
		String(icons(c.soul).length || ''),          // SOUL
		icons(c.card_trigger).join(' '),             // TRIGGER
		[c.feature1, c.feature2, c.feature3].map(dash).filter(Boolean).join('・'), // FEATURE
		c.rare,                                      // RARE
		c.title_number,                              // TITLE
		String(c.expansion),                         // PRODUCT (expansion id → EXPANSIONS)
		dash(c.text),                                // TEXT
		'',                                          // FLAVOR (不收錄)
		c.picture,                                   // SRC (IMG_BASE + picture)
		(zhOf(c).e || '').replace(/\r?\n/g, '<br>'),  // TW_TEXT
		zhOf(c).t || ''                              // TW_NAME
	];
}

// タイトル → 檔名 (第一個作品番號)
const fileOf = (t) => 't_' + t.codes[0].replace(/[^A-Za-z0-9]/g, '');

fs.mkdirSync(path.join(ROOT, 'data'), { recursive: true });
const today = new Date().toISOString().slice(0, 10);
const series = [];
const usedExp = new Set();
let totalBase = 0, totalPar = 0, totalZh = 0, totalText = 0;

for (const t of TITLES) {
	const byNum = new Map();
	t.cards.forEach((c) => byNum.set(c.card_number, c));
	const cards = [...byNum.values()];
	cards.forEach((c) => usedExp.add(String(c.expansion)));

	const key = (c) => c.card_name + '\u0001' + c.text;
	const nonPrKeys = new Set(cards.filter((c) => c.parallel_param !== '〇' && !/^PR/.test(c.rare)).map(key));
	const isPar = (c) => c.parallel_param === '〇' || (/^PR/.test(c.rare) && nonPrKeys.has(key(c)));
	const base = cards.filter((c) => !isPar(c));
	const baseByKey = {};
	base.forEach((c) => { if (!baseByKey[key(c)]) baseByKey[key(c)] = c; });

	const alt = {};
	const orphan = [];
	cards.filter(isPar).forEach((c) => {
		const b = baseByKey[key(c)];
		if (!b) { orphan.push(c); return; }
		(alt[b.card_number] = alt[b.card_number] || []).push([c.card_number, c.rare, String(c.expansion), c.picture]);
	});
	const all = base.concat(orphan);
	all.sort((a, b) => (numKey(a.card_number) < numKey(b.card_number) ? -1 : 1));
	for (const k in alt) alt[k].sort((a, b) => (numKey(a[0]) < numKey(b[0]) ? -1 : 1));

	const file = fileOf(t);
	const codes = t.codes.filter((code) => cards.some((c) => c.title_number == code));
	series.push([t.name, codes, file, all.length]);

	const nPar = cards.length - all.length;
	const nZh = all.filter((c) => zhOf(c).e).length, nText = all.filter((c) => dash(c.text)).length;
	totalBase += all.length; totalPar += nPar; totalZh += nZh; totalText += nText;

	let out = `// ${t.name} (${codes.join(',')}) : ${cards.length} entries -> ${all.length} cards + パラレル ${nPar}\n` +
		`// source: https://ws-tcg.com/cardlist/  fetched: ${today}  regenerate: node tools/build_card_info.js\n` +
		`wsAddData(${JSON.stringify(file)}, [\n` +
		all.map((c) => '\t' + JSON.stringify(row(c))).join(',\n') + '\n], {\n' +
		Object.keys(alt).sort((x, y) => (numKey(x) < numKey(y) ? -1 : 1)).map((k) => '\t' + JSON.stringify(k) + ':' + JSON.stringify(alt[k])).join(',\n') +
		'\n});\n';
	fs.writeFileSync(path.join(ROOT, 'data', file + '.js'), out);
	console.log(t.name.padEnd(24), file.padEnd(10), 'cards', all.length, 'parallel', nPar, 'zh', nZh + '/' + nText);
}

let idx = `/*
	Weiß Schwarz card data (index)
	source: https://ws-tcg.com/cardlist/ (公式カードリスト)  fetched: ${today}
	各タイトルの卡片在 data/<file>.js (選到該タイトル時才載入)
	regenerate: tools/fetch_ws_console.js → node tools/build_card_info.js ws_cards.json ws_zh.json
*/

const ID = 0;		// カード番号
const NAME = 1;		// カード名
const KANA = 2;		// カード名 (カナ)
const KIND = 3;		// キャラ / イベント / クライマックス
const COLOR = 4;	// 黄 / 緑 / 赤 / 青
const LEVEL = 5;
const COST = 6;
const POWER = 7;
const SOUL = 8;		// ソウル数
const TRIGGER = 9;	// トリガー (icon 名, 空白区切り: soul / choice / salvage / ...)
const FEATURE = 10;	// 特徴 (・区切り)
const RARE = 11;	// レアリティ
const TITLE = 12;	// 作品番号 (GA01 …)
const PRODUCT = 13;	// 収録 (expansion id → EXPANSIONS)
const TEXT = 14;	// テキスト ([[xxx.gif]] = アイコン)
const FLAVOR = 15;	// (不收錄)
const SRC = 16;		// 卡圖 (IMG_BASE + SRC)
const TW_TEXT = 17;	// 中文效果 (貓罐子 BottleNeko 翻譯 / tools/zh_manual.json)
const TW_NAME = 18;	// 中文卡名

const IMG_BASE = "https://ws-tcg.com/wordpress/wp-content/images/cardlist/";
const ICON_BASE = "https://ws-tcg.com/wordpress/wp-content/images/cardlist/_partimages/";

// 収録商品 (官網 expansion)
const EXPANSIONS = ${JSON.stringify(Object.fromEntries(Object.entries(EXPANSIONS).filter(([k]) => usedExp.has(k))), null, '\t')};

// タイトル一覽: [名稱, [作品番號...], 資料檔 (data/<file>.js), 卡片數]
const SERIES = [
${series.map((s) => '\t' + JSON.stringify(s)).join(',\n')}
];

// 已載入的卡片 (data/*.js 透過 wsAddData 加入)
var cardData = [];
var ALT_ART = {};
`;
fs.writeFileSync(path.join(ROOT, 'js', 'card_info.js'), idx);
console.log('total cards', totalBase, 'parallel', totalPar, 'zh', totalZh + '/' + totalText);
