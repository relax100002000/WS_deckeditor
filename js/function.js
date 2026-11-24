/*
	Weiß Schwarz Deck Builder
	based on WIXOSS_deckeditor / WWB_deckeditor (same layout)

	構築ルール (加卡時檢查)
	- デッキ: 50枚ちょうど
	- 同じカード名は4枚まで
	- クライマックスは8枚まで
*/

const DECK_MAX = 50;
const SAME_NAME_MAX = 4;
const CX_MAX = 8;
const PAGE_SIZE = 10;

const DECK_LIST_KEY = "WSDeckNameList";
const DECK_KEY_PREFIX = "WS_deck_";
const COMMENT_SUFFIX = "_WScomment";
const DARK_KEY = "ws_dark_mode";

// KIND_ORDER / COLOR_* / TRIGGER_NAME / TITLE_NAMES → js/ws_common.js

// タイトル (大系列) → 作品番號 (小系列)：js/card_info.js 的 SERIES；沒列在裡面的作品番號各自當成一個タイトル
const SERIES_LIST = (typeof SERIES !== 'undefined') ? SERIES : [];

var cardById = {};
var rdeckArr = [];
var page = 0;

var deckArr = [];

var deckNamelist = [];

var levelobj = null, colorobj = null, triggerobj = null;

/* ========================================================= */
/*  Language (日本語 / 繁體中文)                               */
/* ========================================================= */

const LANG_KEY = "ws_lang";
var LANG = "JP";
try { LANG = localStorage.getItem(LANG_KEY) || "JP"; } catch(e) {}

function L(jp, tw) { return LANG == "TW" ? tw : jp; }

const KIND_TW = { "キャラ": "角色", "イベント": "事件", "クライマックス": "名場面" };
const COLOR_TW = { "黄": "黃", "緑": "綠", "赤": "紅", "青": "藍", "紫": "紫" };
const TRIGGER_TW = {
	"soul": "魂", "choice": "選擇", "salvage": "回收", "bounce": "彈回",
	"draw": "抽牌", "treasure": "寶藏", "gate": "門", "standby": "待機",
	"stock": "能量", "shot": "射擊", "discovery": "發現", "chance": "機會",
	"focus": "專注", "recovery": "回復"
};
// 商品名中文：只換分類字樣
function productTw(name)
{
	return String(name).replace("[TD+]", "[預組+]").replace("[TD]", "[預組]").replace("PRカード", "PR卡");
}

function kindLabel(k) { return LANG == "TW" ? (KIND_TW[k] || k) : k; }
function colorLabel(c) { return LANG == "TW" ? (COLOR_TW[c] || c) : c; }

// 靜態文字：有 data-tw 的元素，切換時換成 data-tw / 原本的日文
function applyLang()
{
	$("#selectLang").val(LANG);
	$("[data-tw]").each(function() {
		var el = $(this);
		if(el.attr("data-jp") === undefined) el.attr("data-jp", el.html());
		el.html(LANG == "TW" ? el.attr("data-tw") : el.attr("data-jp"));
	});
	$("[data-tw-placeholder]").each(function() {
		var el = $(this);
		if(el.attr("data-jp-placeholder") === undefined) el.attr("data-jp-placeholder", el.attr("placeholder") || "");
		el.attr("placeholder", LANG == "TW" ? el.attr("data-tw-placeholder") : el.attr("data-jp-placeholder"));
	});
	$("#selectSort option").each(function() {
		var el = $(this);
		if(el.attr("data-jp") === undefined) el.attr("data-jp", el.text());
		el.text(LANG == "TW" && el.attr("data-tw") ? el.attr("data-tw") : el.attr("data-jp"));
	});
}

function changeLang()
{
	LANG = $("#selectLang").val() == "TW" ? "TW" : "JP";
	try { localStorage.setItem(LANG_KEY, LANG); } catch(e) {}
	var keep = {
		series: $("#selectSeries").val(), title: $("#selectTitle").val(), feature: $("#selectFeature").val(),
		trigger: $("#selectTrigger").val(), product: $("#selectProduct").val()
	};
	applyLang();
	buildFilterControls();
	$("#selectSeries").val(keep.series); buildTitleOptions();
	$("#selectTitle").val(keep.title); $("#selectFeature").val(keep.feature);
	$("#selectTrigger").val(keep.trigger); $("#selectProduct").val(keep.product);
	rebuildChartLabels();
	showAlldeck();
	hideInfo();
}

/* ========================================================= */
/*  Init                                                      */
/* ========================================================= */

// function.js is loaded before jQuery, so wait for DOMContentLoaded instead of $(document).ready
window.addEventListener('DOMContentLoaded', function() {
	applyLang();
	buildFilterControls();
	buildDeckSlots();
	buildResultSlots();
	buildCharts();
	showInfotable(null);

	document.getElementById('fileinput').addEventListener('change', readSingleFile, false);
	document.getElementById('commentFileinput').addEventListener('change', readSingleCommentFile, false);

	$("#textsearch").keydown(function(event) {
		if(event.keyCode == 13) search();
	});
	$("#selectTitle, #selectFeature, #selectTrigger, #selectProduct, #selectCost").change(search);

	onloaddeck();
	showAlldeck();
	updateDarkModeButton();
	applyDarkModeImages();

	// 起動時：載入上次選的タイトル (沒有的話第一個)
	var last = "";
	try { last = localStorage.getItem(LAST_TITLE_KEY) || ""; } catch(e) {}
	var si = SERIES_LIST.findIndex(function(s) { return s[2] == last; });
	if(si < 0) si = 0;
	if(SERIES_LIST[si])
	{
		$("#selectSeries").val("s" + si);
		onSeriesChange();
	}
	else search();
});

/* ========================================================= */
/*  タイトル別資料檔 (data/<file>.js) 的動態載入                  */
/* ========================================================= */

const LAST_TITLE_KEY = "ws_last_title";
var loadedFiles = {}, loadingFiles = {};

// data/<file>.js 呼叫：加入卡片與パラレル
function wsAddData(file, rows, alt)
{
	for(var i = 0; i < rows.length; i++)
	{
		if(cardById[rows[i][ID]]) continue;
		cardById[rows[i][ID]] = rows[i];
		cardData.push(rows[i]);
	}
	for(var b in alt) if(!ALT_ART[b]) ALT_ART[b] = alt[b];
	loadedFiles[file] = true;
	buildAltIndex();
	productAbbrCache = null;
	banIndex = null;
}

// files 都載入後呼叫 cb (已載入的直接略過)
function loadTitleFiles(files, cb)
{
	var need = files.filter(function(f) { return f && !loadedFiles[f]; });
	if(!need.length) { if(cb) cb(); return; }
	var left = need.length;
	$("#loadingMsg").text(L("読み込み中…", "載入中…"));
	need.forEach(function(f) {
		var done = function() {
			if(--left == 0)
			{
				$("#loadingMsg").text("");
				refreshAfterLoad();
				if(cb) cb();
			}
		};
		if(loadingFiles[f]) { loadingFiles[f].push(done); return; }
		loadingFiles[f] = [done];
		var s = document.createElement("script");
		s.src = "data/" + f + ".js?v=" + Date.now();
		s.onload = s.onerror = function() {
			if(!loadedFiles[f]) toast("Failed to load data/" + f + ".js");
			var cbs = loadingFiles[f]; delete loadingFiles[f];
			cbs.forEach(function(x) { x(); });
		};
		document.head.appendChild(s);
	});
}

// 新資料載入後：重建特徴／トリガー／商品選單 (保留目前的選擇)
function refreshAfterLoad()
{
	var keep = {
		series: $("#selectSeries").val(), title: $("#selectTitle").val(), feature: $("#selectFeature").val(),
		trigger: $("#selectTrigger").val(), product: $("#selectProduct").val()
	};
	buildFilterControls();
	$("#selectSeries").val(keep.series); buildTitleOptions();
	$("#selectTitle").val(keep.title);
	$("#selectFeature").val(keep.feature); if(!$("#selectFeature").val()) $("#selectFeature").val("0");
	$("#selectTrigger").val(keep.trigger); if(!$("#selectTrigger").val()) $("#selectTrigger").val("0");
	$("#selectProduct").val(keep.product); if(!$("#selectProduct").val()) $("#selectProduct").val("0");
}

// 卡號 → 該タイトル的資料檔
function fileForCode(code)
{
	var t = String(code).trim().split("/")[0];
	for(var i = 0; i < SERIES_LIST.length; i++) if(SERIES_LIST[i][1].indexOf(t) != -1) return SERIES_LIST[i][2];
	return null;
}

function filesForCodeText(text)
{
	var files = [];
	String(text || "").replace(/\r/g, "").split(/[\n,]/).forEach(function(x) {
		var f = fileForCode(x);
		if(f && files.indexOf(f) == -1) files.push(f);
	});
	return files;
}

function hideInfo()
{
	$('#cardinformation').css('visibility', 'hidden');
}

function escapeHtml(s)
{
	return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function isChara(c) { return c[KIND] == "キャラ"; }
function isCX(c) { return c[KIND] == "クライマックス"; }

function featureList(c) { return c[FEATURE] ? c[FEATURE].split("・") : []; }
function triggerList(c) { return c[TRIGGER] ? c[TRIGGER].split(" ") : []; }

function titleLabel(code)
{
	var n = TITLE_NAMES[code];
	if(!n)
	{
		var s = SERIES_LIST.filter(function(x) { return x[1].indexOf(code) != -1; })[0];
		if(s) n = s[0];
	}
	return n && n != code ? "[" + code + "] " + n : code;
}

// タイトルの代號：作品番號共同的開頭 (GA01～GA20 → GA、Sak～Stm → S)，沒有的話列出番號
function seriesAbbr(codes)
{
	if(codes.length == 1) return codes[0];
	var p = codes[0];
	codes.forEach(function(c) { while(p && c.indexOf(p) != 0) p = p.slice(0, -1); });
	p = p.replace(/\d+$/, "");
	return p || codes.slice(0, 3).join("/") + (codes.length > 3 ? "…" : "");
}

function productLabel(code)
{
	var n = (typeof EXPANSIONS !== 'undefined' && EXPANSIONS[code]) || code;
	return LANG == "TW" ? productTw(n) : n;
}

// 商品的縮寫 (卡號「/」與「-」之間的部分，例: S131、W62)；PR 等混合多種的不顯示
var productAbbrCache = null;
function productAbbr(code)
{
	if(!productAbbrCache)
	{
		productAbbrCache = {};
		var add = function(p, id) {
			var m = String(id).match(/\/([A-Za-z]+\d+)-/);
			if(!m) return;
			var s = productAbbrCache[p] = productAbbrCache[p] || [];
			if(s.indexOf(m[1]) == -1) s.push(m[1]);
		};
		for(var i = 0; i < cardData.length; i++) add(cardData[i][PRODUCT], cardData[i][ID]);
		if(typeof ALT_ART !== 'undefined') for(var b in ALT_ART) ALT_ART[b].forEach(function(a) { add(a[2], a[0]); });
	}
	var s = productAbbrCache[code] || [];
	return (s.length && s.length <= 2) ? s.join("/") : "";
}

// 商品選單：EXPANSIONS 依名稱排序 (PR 放最後)
function productCodes()
{
	if(typeof EXPANSIONS === 'undefined') return [];
	productAbbr("");	// 建立 cache (已載入的商品)
	return Object.keys(EXPANSIONS).filter(function(k) { return productAbbrCache[k]; }).sort(function(a, b) {
		var pa = /^PR/.test(EXPANSIONS[a]) ? 1 : 0, pb = /^PR/.test(EXPANSIONS[b]) ? 1 : 0;
		var na = EXPANSIONS[a].replace(/^\[[^\]]*\]/, ""), nb = EXPANSIONS[b].replace(/^\[[^\]]*\]/, "");
		return pa - pb || (na < nb ? -1 : (na > nb ? 1 : 0)) || (EXPANSIONS[a] < EXPANSIONS[b] ? -1 : 1);
	});
}

function buildFilterControls()
{
	var i, str;

	// タイトル (大系列)
	var series = seriesList();
	str = "<option value=\"0\">" + L("--All タイトル--", "--全部系列--") + "</option>";
	for(i = 0; i < series.length; i++) str += "<option value=\"s" + i + "\">" + escapeHtml("[" + seriesAbbr(series[i][1]) + "] " + series[i][0]) + "</option>";
	$("#selectSeries").html(str);
	buildTitleOptions();

	// 特徴
	var feats = [];
	for(i = 0; i < cardData.length; i++)
	{
		var fs = featureList(cardData[i]);
		for(var k = 0; k < fs.length; k++) if(feats.indexOf(fs[k]) == -1) feats.push(fs[k]);
	}
	feats.sort();
	str = "<option value=\"0\">" + L("--All 特徴--", "--全部特徵--") + "</option>";
	for(i = 0; i < feats.length; i++) str += "<option value=\"" + escapeHtml(feats[i]) + "\">《" + escapeHtml(feats[i]) + "》</option>";
	$("#selectFeature").html(str);

	// トリガー
	var trigs = [];
	for(i = 0; i < cardData.length; i++)
	{
		var t = cardData[i][TRIGGER];
		if(trigs.indexOf(t) == -1) trigs.push(t);
	}
	trigs.sort(function(a, b) { return triggerSortKey(a) - triggerSortKey(b); });
	str = "<option value=\"0\">" + L("--All トリガー--", "--全部判定--") + "</option>";
	for(i = 0; i < trigs.length; i++) str += "<option value=\"" + escapeHtml(trigs[i] || "none") + "\">" + escapeHtml(triggerLabel(trigs[i])) + "</option>";
	$("#selectTrigger").html(str);

	// 商品
	str = "<option value=\"0\">" + L("--All Product--", "--全部商品--") + "</option>";
	var pcs = productCodes();
	for(i = 0; i < pcs.length; i++)
	{
		var ab = productAbbr(pcs[i]);
		str += "<option value=\"" + pcs[i] + "\">" + escapeHtml((ab ? "[" + ab + "] " : "") + productLabel(pcs[i])) + "</option>";
	}
	$("#selectProduct").html(str);
}

// 實際有卡的タイトル：[[名稱, [作品番號...]], ...]
function seriesList()
{
	return SERIES_LIST;
}

// 作品 (小系列)：依選擇的タイトル列出
function buildTitleOptions()
{
	var series = seriesList();
	var si = $("#selectSeries").val();
	var codes = [];
	var sel = seriesOf(si);
	if(sel) codes = sel[1];
	else series.forEach(function(s) { if(loadedFiles[s[2]]) codes = codes.concat(s[1]); });
	var keep = $("#selectTitle").val();
	var str = "<option value=\"0\">" + L("--All 作品--", "--全部作品--") + "</option>";
	for(var i = 0; i < codes.length; i++) str += "<option value=\"" + escapeHtml(codes[i]) + "\">" + escapeHtml(titleLabel(codes[i])) + "</option>";
	$("#selectTitle").html(str);
	$("#selectTitle").val(codes.indexOf(keep) != -1 ? keep : "0");
}

function seriesOf(v)
{
	if(!v || v == "0") return null;
	return seriesList()[+String(v).slice(1)] || null;
}

function onSeriesChange()
{
	var sel = seriesOf($("#selectSeries").val());
	if(sel) { try { localStorage.setItem(LAST_TITLE_KEY, sel[2]); } catch(e) {} }
	buildTitleOptions();
	loadTitleFiles(sel ? [sel[2]] : [], function() { buildTitleOptions(); search(); });
}

function triggerLabel(t)
{
	if(!t) return L("なし", "無");
	var list = t.split(" ");
	var soul = list.filter(function(x) { return x == "soul"; }).length;
	var names = LANG == "TW" ? TRIGGER_TW : TRIGGER_NAME;
	var others = list.filter(function(x) { return x != "soul"; }).map(function(x) { return names[x] || x; });
	var parts = [];
	if(soul) parts.push(L("ソウル+", "魂+") + soul);
	return parts.concat(others).join("・");
}

function triggerSortKey(t)
{
	if(!t) return 0;
	if(t == "soul") return 1;
	if(t == "soul soul") return 2;
	return 10;
}

/* ========================================================= */
/*  Slots                                                     */
/* ========================================================= */

// 牌組分兩區：キャラ／イベント (deck_i) 與 クライマックス (cx_j，橫向)
// deckArr 排序後 CX 一定在最後，所以 deck_i = deckArr[i]、cx_j = deckArr[非CX張數 + j]
function slotImg(id, w, h)
{
	return "<img id=\"" + id + "\" class=\"deck-slot card-img\" width=\"" + w + "px\" height=\"" + h + "px\" src=\"img/empty.jpg\" alt=\"\"" +
		" onmouseover=\"onmouseShow(this, 'deck');\"" +
		" onclick=\"delSlot(this);\"" +
		" oncontextmenu=\"addDeck(this); return false;\">";
}

function buildDeckSlots()
{
	var str = "";
	for(var i = 0; i < DECK_MAX; i++)
	{
		str += slotImg("deck_" + i, 86, 120);
		if(i % 10 == 9 && i != DECK_MAX - 1) str += "<br>";
	}
	$("#deckZone").html(str);

	str = "";
	for(i = 0; i < CX_MAX; i++)
	{
		str += slotImg("cx_" + i, 120, 86);
		if(i == 3) str += "<br>";
	}
	$("#cxZone").html(str);
}

function nonCXCount()
{
	var n = 0;
	for(var i = 0; i < deckArr.length; i++) if(!isCX(deckArr[i])) n++;
	return n;
}

// 牌組格子 id → deckArr 的 index (空格子回傳 -1)
function slotIndex(id)
{
	var m = id ? String(id).match(/^(deck|cx)_(\d+)$/) : null;
	if(!m) return -1;
	var n = nonCXCount(), i = +m[2];
	if(m[1] == "deck") return i < n ? i : -1;
	return n + i < deckArr.length ? n + i : -1;
}

function delSlot(x)
{
	var idx = slotIndex(x.id);
	if(idx >= 0) delDeck(idx, x.id);
}

function buildResultSlots()
{
	var i, s0 = "", s1 = "";
	for(i = 0; i < PAGE_SIZE; i++)
	{
		var tag = "<img id=\"rdeck_" + i + "\" class=\"card-img\" onmouseover=\"onmouseShow(this, 'search');\" onclick=\"addDeck(this)\" oncontextmenu=\"return false;\" alt=\"\" height=\"172px\" width=\"123px\" src=\"img/empty.jpg\" style=\"cursor: pointer; vertical-align: bottom;\"> ";
		if(i < PAGE_SIZE / 2) s0 += tag; else s1 += tag;
	}
	$("#resultRow0").html(s0);
	$("#resultRow1").html(s1);
}

/* ========================================================= */
/*  Card image (text placeholder when the image cannot load)  */
/* ========================================================= */

var placeholderCache = {};
var failedSrc = {};
var srcCard = {};	// 卡圖網址 → 卡 (圖片讀取失敗時做文字卡用)

function cardImgSrc(card)
{
	if(!card) return "img/empty.jpg";
	var src = card[SRC] ? IMG_BASE + card[SRC] : "";
	if(src && !failedSrc[src]) { srcCard[src] = card; return src; }
	return makePlaceholder(card);
}

// 官網圖片讀取失敗時 (離線 / 被擋) 改用文字版卡圖
document.addEventListener('error', function(e) {
	var img = e.target;
	if(!img || img.tagName !== 'IMG') return;
	var src = img.getAttribute('src') || "";
	if(src.indexOf(IMG_BASE) != 0 || src.indexOf(ICON_BASE) == 0) return;
	failedSrc[src] = true;
	var c = srcCard[src];
	if(c) img.setAttribute('src', makePlaceholder(c));
}, true);

function makePlaceholder(card)
{
	var pk = card[ID] + "|" + card[SRC];
	if(placeholderCache[pk]) return placeholderCache[pk];

	var bg = COLOR_HEX[card[COLOR]] || "#8a8a8a";
	var name = card[NAME];
	var stat = card[KIND] + (isCX(card) ? "" : "  Lv." + card[LEVEL] + " / C" + card[COST]);
	var stat2 = isChara(card) ? ("P" + card[POWER] + " / S" + card[SOUL]) : triggerLabel(card[TRIGGER]);
	var esc = function(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); };
	var fs = Math.min(40, Math.floor(480 / Math.max(name.length, 1)));
	var svg = "<svg xmlns='http://www.w3.org/2000/svg' width='573' height='800' viewBox='0 0 573 800'>" +
		"<rect width='573' height='800' rx='30' fill='#1e1e28'/>" +
		"<rect x='18' y='18' width='537' height='764' rx='22' fill='" + bg + "' opacity='0.85'/>" +
		"<rect x='40' y='150' width='493' height='420' rx='14' fill='#ffffff' opacity='0.85'/>" +
		"<text x='286' y='80' font-size='36' font-family='sans-serif' font-weight='bold' text-anchor='middle' fill='#fff'>" + esc(card[ID]) + "</text>" +
		"<text x='286' y='330' font-size='" + fs + "' font-family='sans-serif' font-weight='bold' text-anchor='middle' fill='#222'>" + esc(name) + "</text>" +
		"<text x='286' y='470' font-size='30' font-family='sans-serif' text-anchor='middle' fill='#444'>" + (card[SRC] ? "IMAGE NOT LOADED" : "NO IMAGE") + "</text>" +
		"<text x='286' y='650' font-size='34' font-family='sans-serif' text-anchor='middle' fill='#fff'>" + esc(stat) + "</text>" +
		"<text x='286' y='705' font-size='30' font-family='sans-serif' text-anchor='middle' fill='#fff'>" + esc(stat2) + "</text>" +
		"</svg>";
	// クライマックスは横向き：縦のカードを 90° 回転して横長にする
	if(isCX(card)) svg = "<svg xmlns='http://www.w3.org/2000/svg' width='800' height='573' viewBox='0 0 800 573'><g transform='translate(800 0) rotate(90)'>" + svg.replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, "") + "</g></svg>";
	var uri = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
	placeholderCache[pk] = uri;
	return uri;
}

/* ========================================================= */
/*  Search                                                    */
/* ========================================================= */

function search()
{
	var i;
	var keywords = $("#textsearch").val().replace(/　/g, " ").trim().toLowerCase().split(/\s+/).filter(function(s){ return s != ""; });
	var title = $("#selectTitle").val();
	var si = $("#selectSeries").val();
	var seriesCodes = seriesOf(si) ? seriesOf(si)[1] : null;
	var feature = $("#selectFeature").val();
	var trigger = $("#selectTrigger").val();
	var product = $("#selectProduct").val();
	var cost = $("#selectCost").val();

	rdeckArr = [];

	for(i = 0; i < cardData.length; i++)
	{
		var c = cardData[i];

		if(c[KIND] == "キャラ" && !$("#t_chara").prop("checked")) continue;
		if(c[KIND] == "イベント" && !$("#t_event").prop("checked")) continue;
		if(c[KIND] == "クライマックス" && !$("#t_cx").prop("checked")) continue;

		if(!isCX(c) && !$("#lv_" + c[LEVEL]).prop("checked")) continue;
		if(COLOR_CHECK[c[COLOR]] && !$("#" + COLOR_CHECK[c[COLOR]]).prop("checked")) continue;

		if(seriesCodes && seriesCodes.indexOf(c[TITLE]) == -1) continue;
		if(title != "0" && c[TITLE] != title) continue;
		if(feature != "0" && featureList(c).indexOf(feature) == -1) continue;
		if(trigger != "0" && c[TRIGGER] != (trigger == "none" ? "" : trigger)) continue;
		if(product != "0" && c[PRODUCT] != product && !altHasProduct(c, product)) continue;
		if(cost != "0")
		{
			if(isCX(c)) continue;
			var cn = parseInt(c[COST], 10);
			if(cost == "3" ? cn < 3 : cn != parseInt(cost, 10)) continue;
		}

		if(keywords.length > 0)
		{
			var hay = (c[ID] + " " + c[NAME] + " " + c[KANA] + " " + c[TEXT].replace(/<br>/g, " ") + " " + (c[TW_NAME] || "") + " " + (c[TW_TEXT] || "").replace(/<br>/g, " ") + " " + c[FEATURE] + " " + c[KIND] + " " + (TITLE_NAMES[c[TITLE]] || "") + " " + altIds(c).join(" ")).toLowerCase();
			var ok = true;
			for(var k = 0; k < keywords.length; k++)
			{
				if(hay.indexOf(keywords[k]) == -1) { ok = false; break; }
			}
			if(!ok) continue;
		}

		rdeckArr.push(c);
	}

	var sortMode = $("#selectSort").val();
	if(sortMode == "1")
	{
		rdeckArr.sort(function(a, b) { return kindIdx(a) - kindIdx(b) || lvNum(a) - lvNum(b) || colorIdx(a) - colorIdx(b) || costNum(a) - costNum(b) || cmpId(a, b); });
	}
	else if(sortMode == "2")
	{
		rdeckArr.sort(function(a, b) { return kindIdx(a) - kindIdx(b) || costNum(a) - costNum(b) || lvNum(a) - lvNum(b) || cmpId(a, b); });
	}
	else if(sortMode == "3")
	{
		rdeckArr.sort(function(a, b) { return kindIdx(a) - kindIdx(b) || powerNum(b) - powerNum(a) || cmpId(a, b); });
	}
	else
	{
		rdeckArr.sort(cmpId);
	}

	page = 0;
	showrdeck();
}

function checkall()
{
	$("input[type=checkbox]").prop("checked", true);
}

function uncheckall()
{
	$("input[type=checkbox]").prop("checked", false);
}

function clickSpan(x)
{
	var cb = $(x).prev("input[type=checkbox]");
	cb.prop("checked", !cb.prop("checked"));
}

function showrdeck()
{
	var i;
	for(i = 0; i < PAGE_SIZE; i++)
	{
		var idx = page * PAGE_SIZE + i;
		if(idx < rdeckArr.length)
		{
			// クライマックスは横向きで表示
			var cx = isCX(rdeckArr[idx]);
			$("#rdeck_" + i).attr({width: cx ? "160px" : "123px", height: cx ? "115px" : "172px"});
			$("#rdeck_" + i).attr("src", cardImgSrc(rdeckArr[idx])).attr("alt", rdeckArr[idx][ID]);
		}
		else
		{
			$("#rdeck_" + i).attr({width: "123px", height: "172px"});
			$("#rdeck_" + i).attr("src", "img/empty.jpg").attr("alt", "");
		}
	}
	applyDarkModeImages();

	$("#totalCard").html(rdeckArr.length);
	if(rdeckArr.length == 0) $("#page").html("0 / 0");
	else $("#page").html((page + 1) + " / " + Math.ceil(rdeckArr.length / PAGE_SIZE));
}

function changePage(x)
{
	var maxPage = Math.max(0, Math.ceil(rdeckArr.length / PAGE_SIZE) - 1);
	if(x == "back") page = (page > 0) ? page - 1 : maxPage;
	else page = (page < maxPage) ? page + 1 : 0;
	showrdeck();
}

/* ========================================================= */
/*  Sort helpers                                              */
/* ========================================================= */

function kindIdx(c) { var i = KIND_ORDER.indexOf(c[KIND]); return i == -1 ? 9 : i; }
function colorIdx(c) { var i = COLOR_ORDER.indexOf(c[COLOR]); return i == -1 ? 9 : i; }
function lvNum(c) { return c[LEVEL] === "" ? 99 : parseInt(c[LEVEL], 10); }
function costNum(c) { return c[COST] === "" ? 99 : parseInt(c[COST], 10); }
function powerNum(c) { return c[POWER] === "" ? -1 : parseInt(c[POWER], 10); }
function idKey(c) { return c[ID].replace(/\d+/g, function(d) { return ("0000" + d).slice(-4); }); }
function cmpId(a, b) { var x = idKey(a), y = idKey(b); return x < y ? -1 : (x > y ? 1 : 0); }

function sortDeck()
{
	deckArr.sort(function(a, b) {
		return kindIdx(a) - kindIdx(b) || lvNum(a) - lvNum(b) || colorIdx(a) - colorIdx(b) || costNum(a) - costNum(b) || cmpId(a, b) || (deckCardId(a) < deckCardId(b) ? -1 : (deckCardId(a) > deckCardId(b) ? 1 : 0));
	});
}

/* ========================================================= */
/*  Add / Delete                                              */
/* ========================================================= */

function countByName(name)
{
	var n = 0;
	for(var i = 0; i < deckArr.length; i++) if(deckArr[i][NAME] == name) n++;
	return n;
}

function countCX()
{
	var n = 0;
	for(var i = 0; i < deckArr.length; i++) if(isCX(deckArr[i])) n++;
	return n;
}

var toastTimer = null;
function toast(msg)
{
	var el = document.getElementById("wsToast");
	if(!el)
	{
		el = document.createElement("div");
		el.id = "wsToast";
		el.style.cssText = "position:fixed;left:50%;top:18px;transform:translateX(-50%);background:rgba(40,40,40,0.92);color:#fff;padding:8px 16px;border-radius:8px;z-index:3000;font-size:14px;pointer-events:none;transition:opacity .2s;";
		document.body.appendChild(el);
	}
	el.textContent = msg;
	el.style.opacity = "1";
	clearTimeout(toastTimer);
	toastTimer = setTimeout(function(){ el.style.opacity = "0"; }, 2400);
}

// 加入檢查 (quiet = 不顯示訊息，給異圖選擇器用)
function canAdd(c, quiet)
{
	var msg = "";
	if(deckArr.length >= DECK_MAX) msg = L("デッキは50枚までです", "牌組最多 50 張");
	else if(countByName(c[NAME]) >= SAME_NAME_MAX) msg = L("同じカード名は4枚までです", "同名卡最多 4 張");
	else if(isCX(c) && countCX() >= CX_MAX) msg = L("クライマックスは8枚までです", "名場面最多 8 張");
	else
	{
		var b = banCheck(c);
		msg = b.msg;
		if(!msg && b.warn && !quiet) toast(b.warn);
	}
	if(msg && !quiet) toast(msg);
	return !msg;
}

function addDeck(x)
{
	var id = x.alt;
	if(!id) return;
	var c = cardById[id];
	if(!c) return;

	// 要加入的列：異圖選擇器指定 > 牌組裡那一張（右鍵複製，保留卡圖）> 基本卡
	var si = slotIndex(x.id);
	if(pendingArtKey) c = withArt(c, pendingArtKey);
	else if(si >= 0 && deckArr[si][ID] == c[ID]) c = deckArr[si];

	if(!canAdd(c)) return;
	deckArr.push(c);
	sortDeck();
	showAlldeck();
}

function delDeck(idx, slotId)
{
	if(!deckArr[idx]) return;
	// ALT＋點牌組的卡：替換這一張的卡圖（不刪除）
	if(window.event && window.event.altKey && cardArts(deckArr[idx]).length > 1)
	{
		openArtPicker(cardById[deckArr[idx][ID]], {index: idx});
		return;
	}
	deckArr.splice(idx, 1);
	showAlldeck();

	// keep preview in sync with what is now under the cursor
	var img = slotId ? document.getElementById(slotId) : null;
	if(img) onmouseShow(img, 'deck');
}

function cleardeck()
{
	if(!confirm("It will clear current deck. Are you sure?")) return;
	dataInit();
}

function dataInit()
{
	deckArr = [];
	showAlldeck();
}

/* ========================================================= */
/*  Render deck                                               */
/* ========================================================= */

function showAlldeck()
{
	var main = deckArr.filter(function(c) { return !isCX(c); });
	var cxs = deckArr.filter(isCX);
	for(var i = 0; i < DECK_MAX; i++)
	{
		var img = $("#deck_" + i);
		if(i < main.length) img.attr("src", cardImgSrc(main[i])).attr("alt", main[i][ID]);
		else img.attr("src", "img/empty.jpg").attr("alt", "");
	}
	for(i = 0; i < CX_MAX; i++)
	{
		var cimg = $("#cx_" + i);
		if(i < cxs.length) cimg.attr("src", cardImgSrc(cxs[i])).attr("alt", cxs[i][ID]);
		else cimg.attr("src", "img/empty.jpg").attr("alt", "");
	}
	$("#cxCount").text(cxs.length + " / " + CX_MAX).removeClass("ok ng").addClass(cxs.length == CX_MAX ? "ok" : (cxs.length > CX_MAX ? "ng" : ""));

	var n = deckArr.length;
	$("#deckCount").text(n + " / " + DECK_MAX).removeClass("ok ng").addClass(n == DECK_MAX ? "ok" : (n > DECK_MAX ? "ng" : ""));

	var kinds = [0, 0, 0], lv = [0, 0, 0, 0], soul = 0;
	for(i = 0; i < deckArr.length; i++)
	{
		var c = deckArr[i];
		var k = kindIdx(c);
		if(k < 3) kinds[k]++;
		if(!isCX(c) && lv[lvNum(c)] !== undefined) lv[lvNum(c)]++;
		soul += triggerList(c).filter(function(t) { return t == "soul"; }).length;
	}
	var cx = kinds[2];
	$("#deckDetail").html(kindLabel("キャラ") + " " + kinds[0] + "　" + kindLabel("イベント") + " " + kinds[1] + "　<span class='" + (cx > CX_MAX ? "ng" : "") + "'>CX " + cx + " / " + CX_MAX + "</span>" +
		"　｜　Lv0 " + lv[0] + "　Lv1 " + lv[1] + "　Lv2 " + lv[2] + "　Lv3 " + lv[3] +
		"　｜　" + L("ソウルトリガー ", "魂判定 ") + soul +
		deckViolations().map(function(v) { return "<br><span class='ng'>⚠ " + L("使用制限 ", "使用限制 ") + escapeHtml(v) + "</span>"; }).join(""));

	applyDarkModeImages();
	updatechart();
}

/* ========================================================= */
/*  Charts                                                    */
/* ========================================================= */

function getLegendColor()
{
	return document.body.classList.contains('dark-mode') ? '#e6e6e6' : 'rgb(0, 0, 0)';
}

function makeDoughnut(id, labels, colors)
{
	return new Chart(document.getElementById(id), {
		type: 'doughnut',
		data: {
			labels: labels,
			datasets: [{ data: labels.map(function(){ return 0; }), backgroundColor: colors, hoverOffset: 4 }]
		},
		options: {
			plugins: {
				legend: { display: true, labels: { color: getLegendColor(), font: { size: 11 }, boxWidth: 12 } }
			}
		}
	});
}

function trigChartLabels() { return [L("なし", "無"), L("ソウル+1", "魂+1"), L("ソウル+2", "魂+2"), L("その他", "其他")]; }

function buildCharts()
{
	if(typeof Chart === 'undefined') return;
	levelobj = makeDoughnut('levelChart', ['Lv.0', 'Lv.1', 'Lv.2', 'Lv.3', L('CX', '名場面')],
		['#e0e0e0', '#b0b0b0', '#808080', '#505050', '#f28e2b']);
	colorobj = makeDoughnut('colorChart', COLOR_ORDER.map(colorLabel),
		COLOR_ORDER.map(function(c) { return COLOR_HEX[c]; }));
	triggerobj = makeDoughnut('triggerChart', trigChartLabels(), ['#c9cbcf', '#4e79a7', '#1f3f7a', '#f28e2b']);
}

function updatechart()
{
	if(!levelobj) return;
	var lv = [0, 0, 0, 0, 0];
	var col = COLOR_ORDER.map(function(){ return 0; });
	var tr = [0, 0, 0, 0];

	for(var i = 0; i < deckArr.length; i++)
	{
		var c = deckArr[i];
		if(isCX(c)) lv[4]++;
		else if(lvNum(c) <= 3) lv[lvNum(c)]++;
		var ci = COLOR_ORDER.indexOf(c[COLOR]);
		if(ci >= 0) col[ci]++;
		var t = c[TRIGGER];
		tr[!t ? 0 : (t == "soul" ? 1 : (t == "soul soul" ? 2 : 3))]++;
	}

	levelobj.data.datasets[0].data = lv; levelobj.update();
	colorobj.data.datasets[0].data = col; colorobj.update();
	triggerobj.data.datasets[0].data = tr; triggerobj.update();
}

function rebuildChartLabels()
{
	if(!levelobj) return;
	colorobj.data.labels = COLOR_ORDER.map(colorLabel);
	triggerobj.data.labels = trigChartLabels();
	levelobj.data.labels = ['Lv.0', 'Lv.1', 'Lv.2', 'Lv.3', L('CX', '名場面')];
}

function updateChartsTheme()
{
	var color = getLegendColor();
	[levelobj, colorobj, triggerobj].forEach(function(obj) {
		if(obj) { obj.options.plugins.legend.labels.color = color; obj.update(); }
	});
}

/* ========================================================= */
/*  Card preview                                              */
/* ========================================================= */

var bigPicLocked = false;
(function setupBigPicAltLock(){
	function setLocked(v) {
		if(v === bigPicLocked) return;
		bigPicLocked = v;
		window.bigPicLocked = v;
		document.body.classList.toggle('bigpic-locked', v);
	}
	function sync(e) { setLocked(!!e.altKey); }
	window.addEventListener('keydown', function(e) {
		if((e.key === 'Alt' || e.keyCode === 18) && !e.ctrlKey && !e.shiftKey && !e.metaKey) e.preventDefault();
		sync(e);
	}, true);
	window.addEventListener('keyup', sync, true);
	window.addEventListener('mousemove', sync, true);
	window.addEventListener('mouseover', sync, true);
	window.addEventListener('mousedown', sync, true);
	window.addEventListener('blur', function() { setLocked(false); });
})();

// 預覽大圖：記住預覽來自哪裡（牌組的話點大圖＝替換那一張）
var bigPicSource = "", bigPicIdx = -1;

function onmouseShow(x, source)
{
	if(bigPicLocked) return;
	// 空白欄位：不影響目前預覽
	if(!x.alt) return;

	if(source == 'search') $('#cardinformation').css('margin', '150px 0px 0px 40px');
	else $('#cardinformation').css('margin', '150px 0px 0px 960px');

	var c = cardById[x.alt];
	bigPicSource = source; bigPicIdx = -1;
	var si = (source == 'deck') ? slotIndex(x.id) : -1;
	if(si >= 0 && c && deckArr[si][ID] == c[ID])
	{
		bigPicIdx = si;
		c = deckArr[bigPicIdx];
	}
	if(!c)
	{
		$("#cardinformation").css("visibility", "hidden");
		return;
	}

	$("#cardinformation").css("visibility", "visible");
	// クライマックスは横向き
	if(isCX(c)) $("#big_pic").attr({width: "500px", height: "358px"});
	else $("#big_pic").attr({width: "358px", height: "500px"});
	$("#big_pic").attr("src", cardImgSrc(c)).attr("alt", c[ID]);
	showInfotable(c);
}

function infoRow(label, value)
{
	return "<tr><td class='label'>" + label + "</td><td>" + value + "</td></tr>";
}

function iconImg(name)
{
	return "<img class='ws-icon' src='" + ICON_BASE + escapeHtml(name) + ".gif' alt='" + escapeHtml(TRIGGER_NAME[name] || name) + "' title='" + escapeHtml(TRIGGER_NAME[name] || name) + "'>";
}

function showInfotable(c)
{
	var str = "";
	if(!c)
	{
		str += infoRow(L("カード番号", "卡號"), "");
		str += infoRow(L("カード名", "卡名"), "");
		str += infoRow(L("種類", "種類"), "");
		$("#infoTable").html(str);
		$("#bigPicArt").html("");
		return;
	}

	var tw = LANG == "TW";
	str += infoRow(L("カード番号", "卡號"), escapeHtml(deckCardId(c)));
	str += infoRow(L("カード名", "卡名"), escapeHtml(c[NAME]));
	str += infoRow(L("作品", "作品"), escapeHtml(titleLabel(c[TITLE])));
	str += infoRow(L("種類", "種類"), escapeHtml(kindLabel(c[KIND])));
	str += infoRow(L("色", "顏色"), "<i class='color-chip' style='background:" + (COLOR_HEX[c[COLOR]] || "#888") + "'></i>" + escapeHtml(colorLabel(c[COLOR])));
	if(!isCX(c))
	{
		str += infoRow(L("レベル / コスト", "等級 / 費用"), escapeHtml(c[LEVEL]) + " / " + escapeHtml(c[COST]));
	}
	if(isChara(c))
	{
		str += infoRow(L("パワー", "攻擊力"), escapeHtml(c[POWER]));
		var soulN = parseInt(c[SOUL], 10) || 0;
		str += infoRow(L("ソウル", "魂傷"), soulN ? new Array(soulN + 1).join(iconImg("soul")) : "-");
	}
	str += infoRow(L("トリガー", "判定"), c[TRIGGER] ? triggerList(c).map(iconImg).join("") + "　<span style='font-size:12px;'>" + escapeHtml(triggerLabel(c[TRIGGER])) + "</span>" : "-");
	if(c[FEATURE]) str += infoRow(L("特徴", "特徵"), featureList(c).map(function(f) { return "《" + escapeHtml(f) + "》"; }).join(""));
	var banHtml = banInfoHtml(c);
	if(banHtml) str += infoRow("<span style='color:#c62828;margin-top:0;'>" + L("使用制限", "使用限制") + "</span>", banHtml);

	var text = (tw && c[TW_TEXT]) ? c[TW_TEXT] : c[TEXT];
	if(text) str += "<tr><td colspan='2'>" + formatText(text) + "</td></tr>";
	if(tw && c[TW_TEXT]) str += "<tr><td colspan='2' style='color:#888;font-size:12px;'>中文翻譯：貓罐子 BottleNeko</td></tr>";
	else if(tw && c[TEXT]) str += "<tr><td colspan='2' style='color:#888;font-size:12px;'>（尚無中文翻譯）</td></tr>";

	var comment = "";
	try { comment = localStorage.getItem(c[ID] + COMMENT_SUFFIX) || ""; } catch(e) {}
	str += "<tr><td colspan='2'><textarea id='comment' placeholder='Comment' style='width: 270px; height: 40px; resize: vertical; vertical-align: middle;'>" + escapeHtml(comment) + "</textarea>" +
		"<button class='small-btn' style='vertical-align: middle; margin-left: 6px;' onclick=\"setComment('" + escapeHtml(c[ID]) + "')\">" + L("更新", "儲存") + "</button>" +
		"<span id='commentMsg' style='font-size:12px;color:#2e7d32;margin:0 0 0 6px;'></span></td></tr>";

	$("#infoTable").html(str);

	// 預覽圖下方：レアリティ／収録／異圖張數
	var nArts = cardArts(c).length;
	$("#bigPicArt").html("<b>" + escapeHtml(c[RARE]) + "</b>　" + escapeHtml(productLabel(c[PRODUCT])) +
		(nArts > 1 ? "<br><span class='bigPicArtCount'>🖼 " + L("異圖 ", "異圖 ") + nArts + L(" 張（點卡圖切換）", " 張（點卡圖切換）") + "</span>" : ""));
}

function formatText(t)
{
	return t.split("<br>").map(function(line) {
		var s = escapeHtml(line);
		s = s.replace(/\[\[([a-z0-9_]+)\.gif\]\]/g, function(m, n) { return iconImg(n); });
		s = s.replace(/(【(?:自|永|起)】)/g, "<b style='color:#1565c0'>$1</b>");
		s = s.replace(/(【(?:カウンター|CXコンボ)】)/g, "<b style='color:#c2185b'>$1</b>");
		return s;
	}).join("<br>");
}

function setComment(id)
{
	try {
		var v = $("#comment").val();
		if(v != "") localStorage.setItem(id + COMMENT_SUFFIX, v);
		else localStorage.removeItem(id + COMMENT_SUFFIX);
		$("#commentMsg").text(v != "" ? L("保存しました", "已儲存") : L("削除しました", "已刪除"));
	} catch(e) {
		$("#commentMsg").text("Failed");
	}
}

/* ========================================================= */
/*  Popup windows                                             */
/* ========================================================= */

function showPopup(containerId)
{
	var el = document.getElementById(containerId);
	el.style.display = "block";
	window.onmousedown = function(e) {
		if(e.target == el) el.style.display = "none";
	};
}

function openWindow(x)
{
	if(x == "view")
	{
		showDeckView();
		showPopup("window-container");
	}
	else
	{
		showList();
		showPopup("window-container-list");
	}
}

function viewRow(title, arr, w, h)
{
	var s = "<div class='view-row'><span class='view-title'>" + title + " (" + arr.length + ")</span>";
	for(var i = 0; i < arr.length; i++)
	{
		s += "<img class='card-img' width='" + w + "px' height='" + h + "px' src='" + cardImgSrc(arr[i]) + "' alt='' title='" + escapeHtml(deckCardId(arr[i]) + " " + arr[i][NAME]) + "'>";
	}
	return s + "</div>";
}

function showDeckView()
{
	var str = "";
	var title = $("#selectDeck").val() || "";
	if(title) str += "<div style='font-size:20px;font-weight:bold;margin-bottom:8px;'>" + escapeHtml(title) + "</div>";
	for(var lv = 0; lv <= 3; lv++)
	{
		var arr = deckArr.filter(function(c) { return isChara(c) && lvNum(c) == lv; });
		if(arr.length) str += viewRow(kindLabel("キャラ") + " Lv." + lv, arr, 115, 160);
	}
	var ev = deckArr.filter(function(c) { return c[KIND] == "イベント"; });
	if(ev.length) str += viewRow(kindLabel("イベント"), ev, 115, 160);
	var cx = deckArr.filter(isCX);
	if(cx.length) str += viewRow(kindLabel("クライマックス"), cx, 160, 115);
	$("#deckView").html(str || "Deck is empty.");
}

function groupList(arr)
{
	var list = [];
	for(var i = 0; i < arr.length; i++)
	{
		var found = false;
		for(var j = 0; j < list.length; j++)
		{
			if(deckCardId(list[j][0]) == deckCardId(arr[i])) { list[j][1]++; found = true; break; }
		}
		if(!found) list.push([arr[i], 1]);
	}
	return list;
}

function listTable(title, arr)
{
	var g = groupList(arr);
	var s = "<br><b>" + title + " (" + arr.length + ")</b><br><br><table>";
	for(var i = 0; i < g.length; i++)
	{
		var c = g[i][0];
		var info = isCX(c) ? triggerLabel(c[TRIGGER]) : ("Lv." + c[LEVEL] + " C" + c[COST]);
		var nm = (LANG == "TW" && c[TW_NAME]) ? c[TW_NAME] : c[NAME];
		var bl = banOf(c);
		if(bl.length) nm += "　[" + bl.map(function(x) { return ruleLabel(x.rule); }).join(" / ") + "]";
		s += "<tr><td style='width: 30px;'>" + g[i][1] + "</td><td style='width: 150px;'>" + escapeHtml(deckCardId(c)) + "</td><td style='width: 30px;'><i class='color-chip' style='background:" + (COLOR_HEX[c[COLOR]] || "#888") + "'></i></td><td style='width: 90px;'>" + escapeHtml(info) + "</td><td>" + escapeHtml(nm) + "</td></tr>";
	}
	return s + "</table>";
}

function showList()
{
	var str = "<table><tr><td style='vertical-align: top;'>";
	str += listTable(kindLabel("キャラ"), deckArr.filter(isChara));
	str += "</td><td style='vertical-align: top; padding-left: 60px;'>";
	str += listTable(kindLabel("イベント"), deckArr.filter(function(c) { return c[KIND] == "イベント"; }));
	str += listTable(kindLabel("クライマックス"), deckArr.filter(isCX));
	str += "</td></tr></table>";
	$("#decklist").html(str);
}

/* ========================================================= */
/*  Deck code / save / load                                   */
/* ========================================================= */

function buildCode()
{
	return ["deck"].concat(deckArr.map(deckCardId)).join(",");
}

function parseCode(text)
{
	var out = [], unknown = [];
	var parts = String(text || "").replace(/\r/g, "").split(/[\n,]/).map(function(x) { return x.trim(); }).filter(function(x) { return x != ""; });
	for(var j = 0; j < parts.length; j++)
	{
		if(parts[j] == "deck") continue;
		var c = cardFromCode(parts[j]);
		if(!c) { unknown.push(parts[j]); continue; }
		out.push(c);
	}
	return { deck: out, unknown: unknown };
}

// 讀入牌組代碼 (先載入牌組用到的タイトル資料檔)；cb: 讀完後呼叫
function applyCode(text, cb)
{
	loadTitleFiles(filesForCodeText(text), function() {
		var r = parseCode(text);
		deckArr = r.deck.slice(0, DECK_MAX);
		sortDeck();
		showAlldeck();
		if(r.unknown.length) toast(L("不明なカード番号: ", "未知的卡號: ") + r.unknown.join(", "));
		if(cb) cb();
	});
}

function openCodeWindow()
{
	$("#textCode").val(buildCode());
	$("#deckTitle").val($("#selectDeck").val() || $("#deckTitle").val() || "Simple Deck");
	$("#deckStr").html("&emsp;");
	showPopup("window-container-code");
}

function loadFromCode()
{
	applyCode($("#textCode").val());
	$("#deckStr").html("Deck code loaded.");
}

function downloadDeck()
{
	var content = buildCode();
	$("#textCode").val(content);
	var blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
	var a = document.createElement('a');
	a.href = URL.createObjectURL(blob);
	a.setAttribute('download', ($("#deckTitle").val() || "deck") + ".csv");
	a.click();
}

function readSingleFile(evt)
{
	var f = evt.target.files[0];
	if(!f) { alert("Failed to load file"); return; }
	$("#deckTitle").val(f.name.replace(/\.(csv|txt)$/i, ""));
	var r = new FileReader();
	r.onload = function(e) {
		$("#textCode").val(e.target.result);
		applyCode(e.target.result);
		$("#deckStr").html("Deck file loaded.");
	};
	r.readAsText(f);
	$("#fileinput").val("");
}

function copyClipboard()
{
	var t = document.querySelector('#textCode');
	t.select();
	try {
		if(navigator.clipboard) navigator.clipboard.writeText(t.value);
		else document.execCommand('copy');
	} catch(e) { document.execCommand('copy'); }
	$("#deckStr").html("Deck code copied!");
}

function saveDeckNameList()
{
	try { localStorage.setItem(DECK_LIST_KEY, JSON.stringify(deckNamelist)); } catch(e) {}
}

function onloaddeck()
{
	try {
		deckNamelist = JSON.parse(localStorage.getItem(DECK_LIST_KEY)) || [];
	} catch(e) {
		deckNamelist = [];
	}
	updateDecklist("");
}

function updateDecklist(select)
{
	var str = "<option value=''>--Select Deck--</option>";
	for(var i = 0; i < deckNamelist.length; i++)
	{
		var n = escapeHtml(deckNamelist[i]);
		str += "<option value='" + n + "'" + (select == deckNamelist[i] ? " selected" : "") + ">" + n + "</option>";
	}
	$("#selectDeck").html(str);
}

function selectDeck()
{
	var deck = $("#selectDeck").val();
	if(!deck) { dataInit(); return; }
	var code = "";
	try { code = localStorage.getItem(DECK_KEY_PREFIX + deck) || ""; } catch(e) {}
	applyCode(code);
}

function addDecklist()
{
	var title = $.trim($("#deckTitle").val());
	if(title == "") { alert("Do not set empty string as title."); return; }

	var exists = deckNamelist.indexOf(title) != -1;
	if(exists && !confirm("Deck exist. Do you want to overwrite it?")) return;

	applyCode($("#textCode").val(), function() {
		try { localStorage.setItem(DECK_KEY_PREFIX + title, buildCode()); } catch(e) { alert("Failed to save deck."); return; }
		if(!exists) deckNamelist.push(title);
		saveDeckNameList();
		updateDecklist(title);
		$("#deckStr").html("Deck has been added.");
	});
}

function deletedecklist()
{
	var deck = $("#selectDeck").val();
	if(!deck) return;
	if(!confirm("It will delete this deck. Are you sure?")) return;
	try { localStorage.removeItem(DECK_KEY_PREFIX + deck); } catch(e) {}
	var idx = deckNamelist.indexOf(deck);
	if(idx != -1) deckNamelist.splice(idx, 1);
	saveDeckNameList();
	updateDecklist("");
	dataInit();
}

function resetAllDecks()
{
	if(!confirm("Delete ALL saved decks? This cannot be undone.")) return;
	for(var i = 0; i < deckNamelist.length; i++)
	{
		try { localStorage.removeItem(DECK_KEY_PREFIX + deckNamelist[i]); } catch(e) {}
	}
	deckNamelist = [];
	saveDeckNameList();
	updateDecklist("");
	$("#deckStr").html("All saved decks were deleted.");
}

/* ========================================================= */
/*  Comment manager                                           */
/* ========================================================= */

function collectCurrentComments()
{
	var obj = {};
	try {
		for(var i = 0; i < localStorage.length; i++)
		{
			var k = localStorage.key(i);
			if(k && k.length > COMMENT_SUFFIX.length && k.slice(-COMMENT_SUFFIX.length) == COMMENT_SUFFIX)
			{
				obj[k.slice(0, -COMMENT_SUFFIX.length)] = localStorage.getItem(k);
			}
		}
	} catch(e) {}
	return obj;
}

function openCommentManager()
{
	$("#textCommentCode").val(JSON.stringify(collectCurrentComments(), null, 2));
	$("#commentStr").html("&emsp;");
	showPopup("window-container-comment");
}

function applyCommentText()
{
	var obj;
	try { obj = JSON.parse($("#textCommentCode").val()); } catch(e) { $("#commentStr").html("Invalid JSON."); return; }
	var n = 0;
	for(var k in obj)
	{
		if(!cardById[k]) continue;
		try {
			if(obj[k]) localStorage.setItem(k + COMMENT_SUFFIX, String(obj[k]));
			else localStorage.removeItem(k + COMMENT_SUFFIX);
			n++;
		} catch(e) {}
	}
	$("#commentStr").html(n + " comment(s) applied.");
}

function downloadCommentBlob()
{
	var content = JSON.stringify(collectCurrentComments(), null, 2);
	var blob = new Blob([content], { type: "text/plain;charset=utf-8;" });
	var a = document.createElement('a');
	a.href = URL.createObjectURL(blob);
	a.setAttribute('download', "ws_comment.json");
	a.click();
}

function copyCommentClipboard()
{
	var t = document.querySelector('#textCommentCode');
	t.select();
	try {
		if(navigator.clipboard) navigator.clipboard.writeText(t.value);
		else document.execCommand('copy');
	} catch(e) { document.execCommand('copy'); }
	$("#commentStr").html("Comment copied!");
}

function readSingleCommentFile(evt)
{
	var f = evt.target.files[0];
	if(!f) return;
	var r = new FileReader();
	r.onload = function(e) {
		$("#textCommentCode").val(e.target.result);
		applyCommentText();
	};
	r.readAsText(f);
	$("#commentFileinput").val("");
}

function resetAllComments()
{
	if(!confirm("Delete ALL comments? This cannot be undone.")) return;
	var obj = collectCurrentComments();
	for(var k in obj)
	{
		try { localStorage.removeItem(k + COMMENT_SUFFIX); } catch(e) {}
	}
	$("#textCommentCode").val("{}");
	$("#commentStr").html("All comments were deleted.");
}

/* ========================================================= */
/*  Dark mode                                                 */
/* ========================================================= */

function updateDarkModeButton()
{
	var btn = document.getElementById('darkModeToggle');
	if(btn) btn.textContent = document.body.classList.contains('dark-mode') ? '☀ Light' : '🌙 Dark';
}

function swapImageForDarkMode(img, isDark)
{
	var src = img.getAttribute('src');
	if(!src || src.indexOf("img/") != 0) return;
	var pairs = [["empty.jpg", "empty_black.jpg"], ["cancel_icon.png", "cancel_icon_black.png"], ["larrow.png", "larrow_black.png"], ["rarrow.png", "rarrow_black.png"]];
	for(var i = 0; i < pairs.length; i++)
	{
		if(isDark && src == "img/" + pairs[i][0]) { img.setAttribute('src', "img/" + pairs[i][1]); return; }
		if(!isDark && src == "img/" + pairs[i][1]) { img.setAttribute('src', "img/" + pairs[i][0]); return; }
	}
}

function applyDarkModeImages()
{
	var isDark = document.body.classList.contains('dark-mode');
	var imgs = document.getElementsByTagName('img');
	for(var i = 0; i < imgs.length; i++) swapImageForDarkMode(imgs[i], isDark);
}

function toggleDarkMode()
{
	document.body.classList.toggle('dark-mode');
	var isDark = document.body.classList.contains('dark-mode');
	try { localStorage.setItem(DARK_KEY, isDark ? '1' : '0'); } catch(e) {}
	updateDarkModeButton();
	updateChartsTheme();
	applyDarkModeImages();
}

/* ========================================================= */
/*  About                                                     */
/* ========================================================= */

function showVersion()
{
	var str = "";
	str += "Weiß Schwarz Deck Builder\n";
	str += "(based on WIXOSS_deckeditor by ZZZ)\n";
	str += "\n";
	str += "20261124 v1.00\n";
	str += "1.First release.\n";
	str += "2.收錄 " + SERIES_LIST.map(function(s) { return s[0]; }).join("、") + "\n   (每個タイトル一個資料檔，選擇時才載入)\n";
	str += "3.加卡規則：デッキ50枚・同名4枚まで・クライマックス8枚まで\n";
	str += "4.パラレル (SR/SP/SSP/RRR/TDP…) 可在預覽大圖切換卡圖\n";
	str += "5.日文／繁體中文切換 (中文效果翻譯：貓罐子 BottleNeko)\n";
	str += "6.カードの使用制限 (ネオスタンダード構築，" + (typeof BAN_INFO !== "undefined" ? BAN_INFO.name : "") + ")\n";
	str += "\n";
	str += "資料・卡圖來源: ヴァイスシュヴァルツ 公式カードリスト (ws-tcg.com)\n";

	alert(str);
}

/* ========================================================= */
/*  異圖（パラレル）: js/alt_art.js                             */
/* ========================================================= */
/* 牌組列是基本卡的複本：SRC / RARE / PRODUCT 換成該パラレル、ART 欄記パラレル卡號 (例: GA01/S131-102SP)。
 * 同名 4 枚 / CX 8 枚的計算照舊；存檔寫パラレル卡號本身，讀回時還原；註解以基本卡號存取。 */
const ART = 19;
var altBase = {};	// パラレル卡號 → 基本卡號

function buildAltIndex()
{
	if(typeof ALT_ART === 'undefined') return;
	for(var b in ALT_ART) ALT_ART[b].forEach(function(a) { altBase[a[0]] = b; });
}

function cardArts(card)
{
	var base = cardById[card[ID]] || card;
	var list = [{key: base[ID], src: IMG_BASE + base[SRC], rarity: base[RARE], product: base[PRODUCT]}];
	var v = (typeof ALT_ART !== 'undefined' && ALT_ART[base[ID]]) || [];
	v.forEach(function(a) { list.push({key: a[0], src: IMG_BASE + a[3], rarity: a[1], product: a[2], pic: a[3]}); });
	return list;
}

function altIds(c)
{
	var v = (typeof ALT_ART !== 'undefined' && ALT_ART[c[ID]]) || [];
	return v.map(function(a) { return a[0]; });
}

function altHasProduct(c, product)
{
	var v = (typeof ALT_ART !== 'undefined' && ALT_ART[c[ID]]) || [];
	return v.some(function(a) { return a[2] == product; });
}

function withArt(card, key)
{
	var base = card && cardById[card[ID]];
	if(!base) return card;
	if(!key || key == base[ID]) return base;
	var a = cardArts(base).filter(function(x) { return x.key == key; })[0];
	if(!a) return base;
	var c = base.slice();
	c[SRC] = a.pic;
	c[RARE] = a.rarity;
	c[PRODUCT] = a.product;
	c[ART] = key;
	return c;
}

function deckCardId(row) { return row[ART] || row[ID]; }

// 存檔的 1 項目 (基本卡號 or パラレル卡號) → 牌組列
function cardFromCode(code)
{
	code = String(code).trim().toUpperCase();
	if(cardById[code]) return cardById[code];
	var b = altBase[code];
	return b ? withArt(cardById[b], code) : null;
}

function onBigPicClick(x)
{
	if(!x || !x.alt) return;
	var c = cardById[x.alt];
	if(!c) return;
	if(cardArts(c).length <= 1) { addDeck(x); return; }
	if(bigPicSource == "deck" && bigPicIdx >= 0 && deckArr[bigPicIdx] && deckArr[bigPicIdx][ID] == c[ID])
	{
		openArtPicker(c, {index: bigPicIdx});
		return;
	}
	openArtPicker(c, null);
}

function deckCopies(card)
{
	var out = [];
	deckArr.forEach(function(r, i) { if(r[ID] == card[ID]) out.push(i); });
	return out;
}

function replaceDeckCard(index, row)
{
	if(!deckArr[index]) return;
	deckArr[index] = row;
	sortDeck();
	showAlldeck();
}

function artPickerTouch() { return !!(window.matchMedia && window.matchMedia('(hover: none)').matches); }

var pendingArtKey = null;

function openArtPicker(card, replace)
{
	closeArtPicker();
	var arts = cardArts(card);
	var copies = replace ? [] : deckCopies(card);
	var pmode = "add", target = 0;
	var current = replace ? deckCardId(deckArr[replace.index]) : card[ID];
	var touch = artPickerTouch();
	var cx = isCX(card);
	var ov = document.createElement("div");
	ov.id = "artPicker";
	ov.setAttribute("style", "position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.9);display:flex;flex-direction:column;align-items:center;padding:16px;box-sizing:border-box;");
	var html = '<div style="width:100%;max-width:1100px;display:flex;align-items:center;gap:12px;color:#fff;margin-bottom:10px;">' +
		'<b style="font-size:18px;flex:1;color:#fff;">' + escapeHtml(card[ID] + "　" + card[NAME]) + '　異圖 ' + arts.length + ' 張' + (replace ? '　<span style="color:#f0c040;">［替換卡圖］</span>' : '') + '</b>' +
		'<span id="artPickerMsg" style="color:#9f9;font-size:14px;"></span>' +
		'<button type="button" id="artPickerClose" style="font-size:16px;padding:4px 14px;cursor:pointer;height:auto;">✕</button></div>' +
		'<div style="color:#ddd;font-size:13px;width:100%;max-width:1100px;margin-bottom:8px;">' +
		(replace ? '點選卡圖即替換牌組裡的這一張（只換這一張）。' : '點選卡圖即以該卡圖加入牌組（存檔記錄該パラレル的卡號）。' + (copies.length ? '牌組已有這張卡，可切換成「替換」。' : '')) +
		'點背景或按 Esc 關閉。</div>' +
		(copies.length ? '<div id="artPickerMode" style="width:100%;max-width:1100px;color:#fff;font-size:14px;margin-bottom:8px;display:flex;flex-wrap:wrap;align-items:center;gap:8px;"></div>' : '') +
		'<div id="artPickerGrid" style="width:100%;max-width:1100px;flex:1;overflow:auto;display:grid;grid-template-columns:repeat(auto-fill,minmax(' + (touch ? 110 : (cx ? 220 : 160)) + 'px,1fr));gap:10px;align-content:start;">';
	arts.forEach(function(a) {
		html += '<div class="artPickerItem" data-art="' + escapeHtml(a.key) + '" style="cursor:pointer;background:#222;border-radius:8px;padding:6px;text-align:center;' + (a.key == current ? 'outline:3px solid #f0c040;' : '') + '">' +
			'<img loading="lazy" src="' + escapeHtml(a.src) + '" alt="" style="width:100%;border-radius:6px;display:block;border:none;" onerror="this.style.opacity=.3">' +
			'<div style="color:#fff;font-size:13px;margin-top:4px;">' + escapeHtml(a.key + "　" + (a.rarity || "")) + (a.key == current ? '（目前）' : '') + '</div>' +
			'<div style="color:#aaa;font-size:11px;">' + escapeHtml(productLabel(a.product)) + '</div></div>';
	});
	html += '</div><img id="artPickerZoom" alt="" style="position:fixed;display:none;pointer-events:none;z-index:10000;width:' + (cx ? 560 : 400) + 'px;max-width:45vw;max-height:90vh;object-fit:contain;border-radius:14px;box-shadow:0 6px 30px rgba(0,0,0,.8);background:#111;border:none;">';
	ov.innerHTML = html;
	document.body.appendChild(ov);

	var modeBar = document.getElementById("artPickerMode");
	function renderMode()
	{
		if(!modeBar) return;
		var btn = function(m, label) { return '<button type="button" data-pmode="' + m + '" style="height:auto;padding:5px 12px;border-radius:999px;cursor:pointer;border:1px solid #f0c040;' + (pmode == m ? 'background:#f0c040;color:#000;font-weight:bold;' : 'background:transparent;color:#f0c040;') + '">' + label + '</button>'; };
		var h = btn("add", "加入一張") + btn("rep", "替換牌組裡的一張（" + copies.length + " 張）");
		if(pmode == "rep")
		{
			h += '<span style="margin-left:6px;color:#ddd;margin-top:0;">要換哪一張：</span>';
			copies.forEach(function(idx, n) {
				var row = deckArr[idx];
				h += '<span data-copy="' + n + '" style="cursor:pointer;display:inline-flex;flex-direction:column;align-items:center;font-size:11px;color:#fff;padding:2px;margin-top:0;border-radius:6px;' + (n == target ? 'outline:3px solid #f0c040;' : 'outline:1px solid #555;') + '">' +
					'<img src="' + escapeHtml(cardImgSrc(row)) + '" alt="" style="height:64px;border-radius:4px;border:none;">' + escapeHtml(row[RARE] || "") + '</span>';
			});
		}
		modeBar.innerHTML = h;
	}
	renderMode();

	var zoom = document.getElementById("artPickerZoom");
	function placeZoom(e)
	{
		var w = zoom.offsetWidth || 400, h = zoom.offsetHeight || 560, gap = 24;
		var x = e.clientX + gap, y = e.clientY - h / 2;
		if(x + w > window.innerWidth - 8) x = e.clientX - gap - w;
		if(x < 8) x = 8;
		y = Math.max(8, Math.min(y, window.innerHeight - h - 8));
		zoom.style.left = x + "px"; zoom.style.top = y + "px";
	}
	ov.addEventListener("mouseover", function(e) {
		if(touch) return;
		var item = e.target.closest ? e.target.closest(".artPickerItem") : null;
		if(!item) { zoom.style.display = "none"; return; }
		var src = item.querySelector("img").getAttribute("src");
		if(zoom.getAttribute("src") != src) zoom.setAttribute("src", src);
		zoom.style.display = "block";
		placeZoom(e);
	});
	ov.addEventListener("mousemove", function(e) { if(zoom.style.display == "block") placeZoom(e); });
	ov.addEventListener("mouseleave", function() { zoom.style.display = "none"; });

	ov.addEventListener("click", function(e) {
		if(e.target === ov || e.target.id == "artPickerClose") { closeArtPicker(); return; }
		var pm = e.target.closest ? e.target.closest("[data-pmode]") : null;
		if(pm) { pmode = pm.getAttribute("data-pmode"); renderMode(); return; }
		var cpEl = e.target.closest ? e.target.closest("[data-copy]") : null;
		if(cpEl) { target = +cpEl.getAttribute("data-copy"); renderMode(); return; }
		var item = e.target.closest ? e.target.closest(".artPickerItem") : null;
		if(!item) return;
		var key = item.getAttribute("data-art");
		var msg = document.getElementById("artPickerMsg");
		if(replace)
		{
			replaceDeckCard(replace.index, withArt(card, key));
			closeArtPicker();
			return;
		}
		if(pmode == "rep" && copies[target] !== undefined)
		{
			replaceDeckCard(copies[target], withArt(card, key));
			copies = deckCopies(card);
			if(target >= copies.length) target = 0;
			renderMode();
			if(msg) msg.textContent = "已替換成：" + key;
			return;
		}
		var row = withArt(card, key);
		if(canAdd(row, true))
		{
			pendingArtKey = key;
			try { addDeck({alt: card[ID]}); } finally { pendingArtKey = null; }
			if(!modeBar) { closeArtPicker(); openArtPicker(card, null); var m2 = document.getElementById("artPickerMsg"); if(m2) m2.textContent = "已加入：" + key; }
			else { copies = deckCopies(card); renderMode(); if(msg) msg.textContent = "已加入：" + key; }
		}
		else if(copies.length)
		{
			pmode = "rep"; renderMode();
			if(msg) msg.textContent = "無法再加入，已切換成「替換」：選要換的那張，再點卡圖";
		}
		else if(msg) msg.textContent = "無法加入（牌組已滿／同名已4張／CX已8張）";
	});
	document.addEventListener("keydown", artPickerKey);
}

function artPickerKey(e) { if(e.key == "Escape") closeArtPicker(); }

function closeArtPicker()
{
	var ov = document.getElementById("artPicker");
	if(ov) ov.parentNode.removeChild(ov);
	document.removeEventListener("keydown", artPickerKey);
}

/* ========================================================= */
/*  カードの使用制限 (ネオスタンダード構築): js/ban_list.js     */
/* ========================================================= */
/* BAN_RULES: [{title, type: ban|limit|choose, n, cards: [{name, ids}], note}]
 * 卡片比對：該卡 (基本卡號＋所有パラレル卡號) 出現在 ids，或カード名相同 (同名卡合計)。
 * 有 note (特別条件) 的規則只提示，不擋加入。 */
var banIndex = null;

function buildBanIndex()
{
	banIndex = {};
	if(typeof BAN_RULES === 'undefined') return;
	BAN_RULES.forEach(function(r) {
		r.cards.forEach(function(e) {
			e.ids.forEach(function(id) { (banIndex[id] = banIndex[id] || []).push({rule: r, entry: e}); });
			(banIndex["name:" + e.name] = banIndex["name:" + e.name] || []).push({rule: r, entry: e});
		});
	});
}

function cardIdsAll(c)
{
	var base = cardById[c[ID]] || c;
	return [base[ID]].concat(altIds(base));
}

// 該卡適用的制限 [{rule, entry}]
function banOf(c)
{
	if(!banIndex) buildBanIndex();
	var out = [];
	cardIdsAll(c).concat(["name:" + c[NAME]]).forEach(function(k) {
		(banIndex[k] || []).forEach(function(x) {
			if(!out.some(function(y) { return y.rule === x.rule && y.entry === x.entry; })) out.push(x);
		});
	});
	return out;
}

function entryMatch(entry, c)
{
	if(entry.name == c[NAME]) return true;
	var ids = cardIdsAll(c);
	return entry.ids.some(function(id) { return ids.indexOf(id) != -1; });
}

function countEntry(entry)
{
	var n = 0;
	for(var i = 0; i < deckArr.length; i++) if(entryMatch(entry, deckArr[i])) n++;
	return n;
}

function ruleLabel(r)
{
	if(r.type == "ban") return L("使用不可", "禁止使用");
	if(r.type == "limit") return L(r.n + "枚まで使用可", "最多 " + r.n + " 張");
	return L(r.n + "種選抜", r.n + " 種選 1");
}

// 加入 c 會違反的制限訊息 (空字串 = 可以加入)；warn = 有特別条件，只提示
function banCheck(c)
{
	var res = { msg: "", warn: "" };
	banOf(c).forEach(function(x) {
		var r = x.rule, e = x.entry, m = "";
		if(r.type == "ban") m = L("使用不可カードです", "禁止使用的卡片");
		else if(r.type == "limit" && countEntry(e) >= r.n) m = L("このカードは" + r.n + "枚まで使用可です", "此卡最多只能放 " + r.n + " 張");
		else if(r.type == "choose")
		{
			var other = r.cards.filter(function(o) { return o !== e && countEntry(o) > 0; })[0];
			if(other) m = L(r.n + "種選抜：「" + other.name + "」を使用中です", r.n + " 種選 1：牌組已使用「" + other.name + "」");
		}
		if(!m) return;
		if(r.note) res.warn = res.warn || m + L("（特別条件あり）", "（有特別條件，請自行確認）");
		else res.msg = res.msg || m;
	});
	return res;
}

// 目前牌組違反的制限
function deckViolations()
{
	if(typeof BAN_RULES === 'undefined') return [];
	var out = [];
	BAN_RULES.forEach(function(r) {
		var used = r.cards.filter(function(e) { return countEntry(e) > 0; });
		if(!used.length) return;
		var bad = false;
		if(r.type == "ban") bad = true;
		else if(r.type == "limit") bad = used.some(function(e) { return countEntry(e) > r.n; });
		else if(r.type == "choose") bad = used.length > 1;
		if(bad) out.push(ruleLabel(r) + "：" + used.map(function(e) { return e.name; }).join(" / ") + (r.note ? L("（特別条件あり）", "（有特別條件）") : ""));
	});
	return out;
}

function banInfoHtml(c)
{
	var list = banOf(c);
	if(!list.length) return "";
	return list.map(function(x) {
		var r = x.rule;
		var s = "<b style='color:#c62828;'>" + escapeHtml(ruleLabel(r)) + "</b>";
		if(r.type == "choose") s += "<br><span style='font-size:12px;'>" + L("対象：", "同組：") + r.cards.map(function(e) { return escapeHtml(e.name); }).join(" / ") + "</span>";
		if(r.note) s += "<br><span style='font-size:12px;color:#888;'>" + r.note.split("\n").map(escapeHtml).join("<br>") + "</span>";
		return s;
	}).join("<hr style='border:none;border-top:1px dashed #ccc;margin:4px 0;'>");
}
