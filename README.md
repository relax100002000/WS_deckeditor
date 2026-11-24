# WS_deckeditor

Author: ZZZ

ヴァイスシュヴァルツ (Weiß Schwarz) 的組牌器，以 WIXOSS_deckeditor / WWB_deckeditor 為基礎改寫。
目前收錄 12 個タイトル：GA文庫、角川スニーカー文庫、BanG Dream!、ガールズ＆パンツァー、ステラソラ、anemoi、勝利の女神：NIKKE、葬送のフリーレン、【推しの子】、Re:ゼロから始める異世界生活、アイドルマスター シンデレラガールズ、ブラウンダスト2。
每個タイトル一個資料檔 (`data/t_*.js`)，在「タイトル」選單選到時才載入；讀入牌組時會自動載入牌組用到的タイトル。

## 使用方式
直接用瀏覽器開啟 `index.html`。

- 右側搜尋結果點一下 → 加入牌組；牌組中點一下 → 移除；牌組中右鍵 → 再加一張同卡 (保留卡圖)
- 滑鼠移到卡片上顯示大圖與效果；按住 ALT 可鎖定預覽
- 點預覽大圖：有パラレル (SR／SP／SSP／RRR／TDP…) 的卡會列出所有卡圖，點選即以該卡圖加入；從牌組預覽點大圖、或 ALT＋點牌組的卡 = 替換那一張的卡圖
- Deck Code：匯出／匯入牌組代碼、下載 CSV、存到 Deck List (localStorage)
- Deck View／Card List：檢視整副牌組
- Comment：每張卡可寫備註 (按「更新」儲存)，可匯出／匯入 JSON
- Language：日本語／繁體中文切換 (介面、篩選選單、卡片資料與效果)
- 効果まとめ／效果簡述：左上角連結開啟 `summary.html`

## 安裝成 App (PWA)
- 用 Chrome／Edge 開啟 GitHub Pages 網址 → 左上角「📲 安裝 App」按鈕，或網址列右側的安裝圖示
- Android Chrome：選單 →「安裝應用程式／加到主畫面」；iPhone／iPad Safari：分享 →「加入主畫面」
- 安裝後以獨立視窗開啟；長按／右鍵 App 圖示有「效果簡述」捷徑
- 離線使用：看過的タイトル資料與卡圖會快取 (`sw.js`)，沒網路時也能組牌；網站檔案每次有網路時都抓最新版
- 需要 https (GitHub Pages) 或 localhost；直接開本機 `index.html` (file://) 不會啟用

## 效果簡述 (`summary.html`)
人工整理的繁體中文效果重點，每張卡一段。

- 依タイトル／作品／種類／色／Lv 篩選，關鍵字可搜卡名、卡號、簡述與原文
- 滑鼠移到卡圖上浮出放大圖，點擊全螢幕放大；勾「顯示原文」列出日文原文與貓罐子翻譯
- 簡述檔：`data/sum_t_*.js` (`wsAddSummary(檔名, 卡號前綴, {卡號後綴: 簡述})`)，新增後把檔名加進 `summary.html` 的 `SUMMARY_READY`
- 目前完成：GA文庫 (150 張)；其他タイトル分批加入

## 構築ルール (加卡時檢查)
- デッキ 50 枚
- 同じカード名は 4 枚まで
- クライマックスは 8 枚まで
- カードの使用制限 (ネオスタンダード構築)：`js/ban_list.js`（官網「デッキ構築ルール」2026年度後期制限改定，2026/6/27 適用）
  - 使用不可 / ○枚まで使用可 / ○種選抜：加卡時擋下並提示；牌組統計與 Card List 標出違規；預覽顯示該卡的制限
  - 附「特別条件」的規則只提示不擋 (例：BanG Dream! ミッシェルシール)
  - GA文庫、角川スニーカー文庫目前沒有制限對象
  - 更新：在官網デッキ構築ルール頁的 Console 執行 `tools/fetch_ban_console.js` → 下載的 `ban_list.js` 覆蓋 `js/ban_list.js`

## 資料
- 卡片資料・卡圖：[ヴァイスシュヴァルツ 公式カードリスト](https://ws-tcg.com/cardlist/)（2026-11-24 取得）
  - 合計 9,977 筆 → 基本卡 4,947 張 ＋ パラレル 5,030 張
  - `js/card_info.js`：欄位定義、商品名 (EXPANSIONS)、タイトル一覽 (SERIES)
  - `data/t_*.js`：各タイトルの基本卡與パラレル (BanG Dream! 最大，約 1.5 MB)
  - パラレル依「カード名＋テキスト」對回基本卡；存檔寫パラレル卡號本身 (例: `GA01/S131-102SP`)
  - 作品名 (`js/ws_common.js` 的 `TITLE_NAMES`，組牌器與效果簡述共用)：角川スニーカー文庫依卡圖下方的作品名標示；GA文庫卡圖只有著作權標示，依作者對照
- 中文效果翻譯：[貓罐子 BottleNeko](https://bottleneko.app/)（譯者 くろう-KUROU-）；貓罐子尚未翻譯的卡顯示日文 (BanG Dream!、シンデレラガールズ的舊彈較多)；GA文庫／角川的幾張 PR 由 `tools/zh_manual.json` 補充
- 卡圖、アイコン直接外連官網圖片
- 更新／新增作品：
  1. 在官網カードリスト頁的 Console 執行 `tools/fetch_ws_console.js` (修改其中的 `TITLES`) → 下載 `ws_cards.json`
  2. (中文) 在貓罐子頁面的 Console 執行 `tools/fetch_zh_console.js` (修改其中的 `SERIES`) → 下載 `ws_zh.json`
  3. `node tools/build_card_info.js ws_cards.json ws_zh.json` → 重新產生 `js/card_info.js` 與 `data/t_*.js`

## Release note
20261124 v1.01
1. 可安裝成 App (PWA)：manifest、App 圖示、組牌器左上角「📲 安裝 App」按鈕、App 圖示捷徑「效果簡述」
2. 離線使用：Service Worker (`sw.js`) 快取網站檔案、看過的タイトル資料與卡圖 (卡圖上限 4000 張)；有網路時網站檔案一律抓最新版

20261124 v1.00
1. First release：12 個タイトル (GA文庫、角川スニーカー文庫、BanG Dream!、ガールズ＆パンツァー、ステラソラ、anemoi、勝利の女神：NIKKE、葬送のフリーレン、【推しの子】、Re:ゼロ、シンデレラガールズ、ブラウンダスト2)，依タイトル分檔、選到時才載入
2. タイトル＋作品兩層篩選 (選單附 GA01／Sak 等代號)，以及種類・レベル・色・コスト・特徴・トリガー・商品・關鍵字篩選
3. 牌組編輯：名場面 (クライマックス) 獨立區塊放在牌組上方、搜尋結果橫向顯示；構築檢查 (50 枚／同名 4 枚／名場面 8 枚)
4. 使用制限 (ネオスタンダード，2026年度後期制限改定)：加卡時擋下並提示、牌組與 Card List 標出違規
5. 日文／繁體中文切換 (中文翻譯：貓罐子 BottleNeko)；卡片資訊移除讀音、稀有度、風味文字
6. 圖表 (レベル／色／トリガー) 雙欄排版、牌組存讀、Deck Code、CSV、Comment (更新按鈕)、黑暗模式、ALT 鎖定預覽、パラレル卡圖切換
7. 新增效果簡述頁 `summary.html`：GA文庫 150 張人工中文簡述、篩選搜尋、滑鼠移上放大卡圖、可顯示原文
