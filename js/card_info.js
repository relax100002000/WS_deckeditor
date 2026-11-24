/*
	Weiß Schwarz card data (index)
	source: https://ws-tcg.com/cardlist/ (公式カードリスト)  fetched: 2026-11-24
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
const EXPANSIONS = {
	"12": "PRカード【Wサイド】",
	"13": "PRカード【Sサイド】",
	"141": "2015年度トライアルデッキ【W】",
	"151": "アイドルマスター シンデレラガールズ",
	"161": "2016年度トライアルデッキ【S】",
	"167": "アイドルマスター シンデレラガールズ 2nd SEASON",
	"185": "Re:ゼロから始める異世界生活",
	"187": "[TD+]BanG Dream!",
	"194": "BanG Dream! きら★きらカードコレクション♪",
	"196": "BanG Dream!",
	"201": "[TD+]Re:ゼロから始める異世界生活",
	"212": "[TD+]バンドリ！ ガールズバンドパーティ！ ［Roselia］",
	"213": "バンドリ！ ガールズバンドパーティ！",
	"218": "[TD+]バンドリ！ ガールズバンドパーティ！ ［Pastel＊Palettes］",
	"224": "[TD+]バンドリ！ ガールズバンドパーティ！ ［Afterglow］",
	"230": "[TD+]バンドリ！ ガールズバンドパーティ！ ［ハロー、ハッピーワールド！］",
	"233": "スペシャルパック　「バンドリ！ ガールズバンドパーティ！ 」",
	"234": "「Re:ゼロから始める異世界生活」Vol.2",
	"246": "[TD+]バンドリ！ ガールズバンドパーティ！［Poppin’Party］",
	"255": "「バンドリ！ ガールズバンドパーティ！」Vol.2",
	"257": "[TD+]角川スニーカー文庫",
	"259": "角川スニーカー文庫",
	"280": "Re:ゼロから始める異世界生活 Memory Snow",
	"282": "[TD+]BanG Dream!［RAISE A SUILEN］",
	"286": "「BanG Dream!」Vol.2",
	"303": "Re:ゼロから始める異世界生活 氷結の絆",
	"325": "プレミアムブースター バンドリ！ ガールズバンドパーティ！",
	"334": "[TD+]バンドリ！ ガールズバンドパーティ！［Morfonica］",
	"335": "Poppin’Party×Roselia",
	"336": "Morfonica×RAISE A SUILEN",
	"381": "[ID]バンドリ！ ガールズバンドパーティ！ 5th Anniversary",
	"382": "バンドリ！ ガールズバンドパーティ！ 5th Anniversary",
	"440": "プレミアムブースター バンドリ！ ガールズバンドパーティ！ Countdown Collection",
	"442": "[TDP]BanG Dream! [MyGO!!!!!]",
	"453": "[TD]【推しの子】",
	"454": "【推しの子】",
	"456": "[TD]葬送のフリーレン",
	"466": "葬送のフリーレン",
	"474": "[TD]アイドルマスター シンデレラガールズ Type:Cute",
	"475": "[TD]アイドルマスター シンデレラガールズ Type:Cool",
	"476": "[TD]アイドルマスター シンデレラガールズ Type:Passion",
	"477": "アイドルマスター シンデレラガールズ Next Twinkle!",
	"492": "「Re:ゼロから始める異世界生活」Vol.3",
	"493": "[TD]勝利の女神：NIKKE",
	"494": "勝利の女神：NIKKE",
	"496": "THE IDOLM@STER M@STER EXPO開催記念カードセット",
	"504": "【推しの子】Vol.2",
	"505": "[TD] BanG Dream! [Ave Mujica]",
	"506": "MyGO!!!!! × Ave Mujica",
	"509": "[TD]角川スニーカー文庫 Vol.2",
	"510": "角川スニーカー文庫 Vol.2",
	"526": "プレミアムブースター BanG Dream! 10th Anniversary！",
	"539": "プレミアムブースター アイドルマスター シンデレラガールズ",
	"543": "BanG Dream! [夢限大みゅーたいぷ]",
	"545": "葬送のフリーレン 新装版",
	"550": "[TD]anemoi",
	"554": "GA文庫",
	"555": "[TD]GA文庫",
	"558": "ブラウンダスト2",
	"559": "[TD]ブラウンダスト2",
	"560": "アイドルマスター シンデレラガールズ シンデレラガール総選挙2026",
	"561": "「Re:ゼロから始める異世界生活」Vol.4",
	"562": "【推しの子】Vol.3",
	"563": "葬送のフリーレン Vol.2",
	"564": "勝利の女神：NIKKE Vol.2",
	"565": "anemoi",
	"566": "ステラソラ",
	"567": "[TD]ステラソラ",
	"568": "ガールズ＆パンツァー",
	"569": "[TD]ガールズ＆パンツァー 大洗女子学園",
	"570": "[TD]ガールズ＆パンツァー 無限軌道杯",
	"571": "BanG Dream! [夢限大みゅーたいぷ]"
};

// タイトル一覽: [名稱, [作品番號...], 資料檔 (data/<file>.js), 卡片數]
const SERIES = [
	["GA文庫",["GA01","GA02","GA03","GA04","GA05","GA06","GA07","GA08","GA09","GA10","GA11","GA12","GA13","GA14","GA15","GA16","GA17","GA18","GA19","GA20"],"t_GA01",150],
	["角川スニーカー文庫",["Sak","Sbm","Scn","Sde","Sdy","Seo","Sfl","Shg","Shh","Shm","Sks","Sky","Sle","Sls","Smc","Sme","Smi","Smu","Snk","Snw","Soa","Soj","Srd","Srm","Ssc","Ssh","Ssk","Ssn","Sst","Ssw","Ssy","Stk","Stm"],"t_Sak",283],
	["BanG Dream!",["BD","BDY"],"t_BD",1752],
	["ガールズ＆パンツァー",["GUP"],"t_GUP",155],
	["ステラソラ",["STS"],"t_STS",121],
	["anemoi",["ANM"],"t_ANM",126],
	["勝利の女神：NIKKE",["NIK"],"t_NIK",254],
	["葬送のフリーレン",["SFN"],"t_SFN",351],
	["【推しの子】",["OSK"],"t_OSK",351],
	["Re:ゼロから始める異世界生活",["RZ"],"t_RZ",652],
	["アイドルマスター シンデレラガールズ",["IMC"],"t_IMC",632],
	["ブラウンダスト2",["BRD"],"t_BRD",120]
];

// 已載入的卡片 (data/*.js 透過 wsAddData 加入)
var cardData = [];
var ALT_ART = {};
