// ヴァイスシュヴァルツ カードの使用制限 (ネオスタンダード構築)
// source: https://ws-tcg.com/rules/deck_rule/ (2026年度後期制限改定，適用期間：2026/6/27より)
// fetched: 2026-11-24　regenerate: tools/fetch_ban_console.js
// type: ban = 使用不可 / limit = n枚まで使用可 / choose = n種選抜 (該組只能選 1 種)
// note: 特別条件 (滿足的牌組不受此限制；本工具只顯示，不自動判定)
var BAN_INFO = {"name":"2026年度後期制限改定","period":"2026/6/27より","fetched":"2026-11-24"};
var BAN_RULES = [
	{"title":"ダ・カーポ＆Dal Segno","type":"choose","n":3,"cards":[{"name":"水着の杏","ids":["DC/W01-091","DC/WC01-091","DC/W81-P02S","DC/W128-P09","DC/W128-P09S"]},{"name":"木琴占い","ids":["DC/W01-095","DC/WC01-095","DC/W81-P01S"]},{"name":"選挙ポスター撮影","ids":["DC/W128-096","DC/W128-096S","DC/W128-096SP"]}],"note":""},
	{"title":"涼宮ハルヒの憂鬱","type":"ban","n":0,"cards":[{"name":"情報連結解除","ids":["SY/W08-T16","SY/W08-097"]}],"note":""},
	{"title":"ペルソナ","type":"ban","n":0,"cards":[{"name":"神木 秋成","ids":["P3/S01-014","P3/SC01-014"]}],"note":""},
	{"title":"艦隊これくしょん -艦これ-","type":"choose","n":2,"cards":[{"name":"陽炎型駆逐艦7番艦 初風","ids":["KC/S25-006","KC/S42-105"]},{"name":"暁型駆逐艦2番艦 響","ids":["KC/S25-056"]}],"note":""},
	{"title":"BanG Dream!","type":"ban","n":0,"cards":[{"name":"ミッシェルシール","ids":["BD/W54-021"]}],"note":"ただし、以下の特別条件を満たすデッキは、上記の使用制限を満たす必要はありません。\n・キャラ：特徴《ハロー、ハッピーワールド！》を持つカードのみ\n・イベント：指定なし\n・CX：指定なし"},
	{"title":"BanG Dream!","type":"limit","n":1,"cards":[{"name":"キラキラを求めて 香澄","ids":["BD/W47-P28","BD/W47-P28S"]}],"note":""},
	{"title":"BanG Dream!","type":"choose","n":3,"cards":[{"name":"市ヶ谷有咲","ids":["BD/W47-082","BD/W47-082SP"]},{"name":"がんばれパン","ids":["BD/W54-065","BD/WE42-P36","BD/W125-063","BD/W125-063S"]},{"name":"拒絶の言葉 豊川祥子","ids":["BD/W125-010","BD/W125-010S"]}],"note":""},
	{"title":"ひなろじ ～from Luck ＆ Logic～","type":"limit","n":1,"cards":[{"name":"見守る者 学園長","ids":["HLL/WE29-11"]}],"note":""},
	{"title":"Fate","type":"choose","n":3,"cards":[{"name":"銀糸錬金 天使の詩 イリヤ","ids":["FS/S34-078","FS/S34-078S","FS/S77-079","FS/S77-079S"]},{"name":"“闇夜の巡回”凛＆アーチャー","ids":["FS/S36-P03"]},{"name":"HEROIC 凛＆アーチャー","ids":["FS/S64-063","FS/S64-063S"]}],"note":""},
	{"title":"デート・ア・ライブ","type":"limit","n":2,"cards":[{"name":"“最悪の精霊”狂三","ids":["DAL/W79-053","DAL/W79-053SEC","DAL/W131-P04S"]}],"note":""},
	{"title":"ソードアート・オンライン","type":"ban","n":0,"cards":[{"name":"真っ直ぐな道 アリス","ids":["SAO/S100-011","SAO/S100-011S"]}],"note":""},
	{"title":"ラブライブ！スーパースター!!","type":"ban","n":0,"cards":[{"name":"ギャラクシー すみれ","ids":["LSP/W92-062"]}],"note":""},
	{"title":"ラブライブ！スーパースター!!","type":"choose","n":2,"cards":[{"name":"ソングフォーオール!!","ids":["LSP/W92-038"]},{"name":"Liella! 可可","ids":["LSP/W92-083","LSP/W92-083S"]}],"note":""},
	{"title":"アサルトリリィ","type":"limit","n":3,"cards":[{"name":"“その笑顔を守るために”叶星","ids":["ALL/S90-008","ALL/S90-008SP"]}],"note":""},
	{"title":"五等分の花嫁","type":"limit","n":2,"cards":[{"name":"走り出す恋心 中野 二乃","ids":["5HY/W90-052","5HY/W90-052SSP"]}],"note":""},
	{"title":"五等分の花嫁","type":"choose","n":3,"cards":[{"name":"微睡の中 中野 一花","ids":["5HY/W90-061","5HY/W90-061S"]},{"name":"ありがとうの花 中野 二乃","ids":["5HY/W101-081","5HY/W101-081HYR"]},{"name":"めいっぱいのアプローチ 中野 二乃","ids":["5HY/WE43-23","5HY/WE43-23IGP"]}],"note":""},
	{"title":"ホロライブプロダクション","type":"ban","n":0,"cards":[{"name":"アニキ 百鬼あやめ","ids":["HOL/W104-099","HOL/W104-099S"]}],"note":""},
	{"title":"ホロライブプロダクション","type":"limit","n":2,"cards":[{"name":"未来へと踏み出す一歩 がうる・ぐら","ids":["HOL/W104-113","HOL/W104-113S","HOL/W104-113SP"]}],"note":""},
	{"title":"ホロライブプロダクション","type":"choose","n":4,"cards":[{"name":"姫森ルーナ","ids":["HOL/W91-057","HOL/W91-057S"]},{"name":"はあちゃまビーム 赤井はあと","ids":["HOL/W91-105","HOL/W91-105S"]},{"name":"プールでまったり 大神ミオ","ids":["HOL/W104-040","HOL/W104-040S","HOL/W104-040SSP"]},{"name":"二人きりのアンコール 尾丸ポルカ","ids":["HOL/W104-069","HOL/W104-069S","HOL/W104-069SSP"]}],"note":""},
	{"title":"D_CIDE TRAUMEREI","type":"limit","n":3,"cards":[{"name":"夢見る高校生 蘭堂","ids":["DCT/S86-079","DCT/S86-079SP"]}],"note":""},
	{"title":"D_CIDE TRAUMEREI","type":"choose","n":3,"cards":[{"name":"最高のアイドル ありや","ids":["DCT/S86-002","DCT/S86-002SP"]},{"name":"気付いた感情 える","ids":["DCT/S86-076","DCT/S86-076SP"]},{"name":"不思議な転校生 える","ids":["DCT/S86-088"]}],"note":""},
	{"title":"オーバーロード","type":"ban","n":0,"cards":[{"name":"豊穣の母神からの返礼 アインズ","ids":["OVL/S99-032","OVL/S99-032S"]}],"note":""},
	{"title":"オーバーロード","type":"choose","n":4,"cards":[{"name":"精神操作の吐息 アウラ","ids":["OVL/S62-106","OVL/SE54-31OLR"]},{"name":"自信満々 アウラ","ids":["OVL/S99-104"]},{"name":"骸骨の魔法使い アインズ","ids":["OVL/SE54-57","OVL/SE54-57OLR","OVL/SE54-57EX"]},{"name":"慈悲深き純白の悪魔 アルベド","ids":["OVL/SE54-61","OVL/SE54-61OLR","OVL/SE54-61SP"]}],"note":""},
	{"title":"Key","type":"choose","n":4,"cards":[{"name":"思い出とたい焼き あゆ","ids":["Kka/W102-003","Kka/W102-003SP"]},{"name":"宝物になった日","ids":["Kdb/W102-068","Kdb/W102-068S"]},{"name":"最後の夏やすみ 観鈴","ids":["Kai/W102-077","Kai/W102-077SP"]},{"name":"ひげ猫団 鴎","ids":["Ksm/W102-037","Ksm/W102-037S"]}],"note":""},
	{"title":"転生したらスライムだった件","type":"choose","n":4,"cards":[{"name":"“爆炎の支配者”シズ","ids":["TSK/S70-065","TSK/S70-065SP"]},{"name":"静かなる怒り シュナ","ids":["TSK/S101-052","TSK/S101-052S"]},{"name":"強者の元へ ベニマル","ids":["TSK/S101-054","TSK/S101-054S"]},{"name":"自由を告げる鼓動 ミュウラン","ids":["TSK/S101-077","TSK/S101-077SP"]}],"note":""},
	{"title":"チェンソーマン","type":"limit","n":2,"cards":[{"name":"公安対魔特異4課 早川アキ","ids":["CSM/S96-029","CSM/S96-029S"]}],"note":""},
	{"title":"チェンソーマン","type":"choose","n":2,"cards":[{"name":"同盟結成 姫野","ids":["CSM/S96-085"]},{"name":"休憩中 姫野","ids":["CSM/S96-086","CSM/S96-086S"]}],"note":""},
	{"title":"パズル＆ドラゴンズ","type":"limit","n":1,"cards":[{"name":"甘美の零龍喚士・ネイ","ids":["PAD/S105-003","PAD/S105-003SP"]}],"note":""},
	{"title":"青春ブタ野郎シリーズ","type":"limit","n":2,"cards":[{"name":"君と過ごした一年間 桜島 麻衣","ids":["SBY/W114-049","SBY/W114-049ABR","SBY/W114-049OFR"]}],"note":""},
	{"title":"アイドルマスター シャイニーカラーズ","type":"limit","n":1,"cards":[{"name":"伸ばす手に乗せるのは 風野灯織","ids":["ISC/S110-009","ISC/S110-009SP"]}],"note":""},
	{"title":"アイドルマスター シャイニーカラーズ","type":"choose","n":4,"cards":[{"name":"たそかれスワッグ 八宮めぐる","ids":["ISC/S110-004","ISC/S110-004OFR","ISC/S110-004SSP"]},{"name":"アンシーン・ダブルキャスト 黛 冬優子","ids":["ISC/S110-038","ISC/S110-038SP"]},{"name":"interStellar-Stella 櫻木真乃","ids":["ISC/S110-061","ISC/S110-061OFR","ISC/S110-061SSP"]},{"name":"Beautiful Sunset 白瀬咲耶","ids":["ISC/S110-093","ISC/S110-093WIR"]}],"note":""},
	{"title":"プロジェクトセカイ カラフルステージ！ feat. 初音ミク","type":"choose","n":2,"cards":[{"name":"その心意気を買って 神代類","ids":["PJS/S109-001","PJS/S109-001SSP"]},{"name":"アウトドアクッキング！ 青柳冬弥","ids":["PJS/S109-060","PJS/S109-060SSP"]}],"note":""},
	{"title":"アリス・ギア・アイギス","type":"choose","n":5,"cards":[{"name":"“ツナギをまとった天使”リタ","ids":["AGS/W108-005","AGS/W108-005SP"]},{"name":"相河 愛花","ids":["AGS/W108-009","AGS/W108-009S"]},{"name":"“ワイルド・ワイルド・ムードメーカー”リン","ids":["AGS/W108-032","AGS/W108-032SP"]},{"name":"私に出来ること 夜露","ids":["AGS/W108-034","AGS/W108-034S"]},{"name":"暴走 のどか","ids":["AGS/W108-038","AGS/W108-038S"]}],"note":""},
	{"title":"ウマ娘 プリティーダービー","type":"choose","n":3,"cards":[{"name":"シニカルガール ナイスネイチャ","ids":["UMA/W106-T11","UMA/W106-T11R"]},{"name":"学園理事長 秋川やよい","ids":["UMA/W106-035","UMA/W106-035S"]},{"name":"ブリュニサージュ・ライン メジロブライト","ids":["UMA/W106-131","UMA/W106-131SP"]}],"note":""},
	{"title":"クレヨンしんちゃん","type":"limit","n":1,"cards":[{"name":"“おわり”のない映画","ids":["CS/S114-047","CS/S114-047S"]}],"note":""},
	{"title":"Re:ゼロから始める異世界生活","type":"choose","n":3,"cards":[{"name":"パジャマパーティー レム","ids":["RZ/S116-P09S","RZ/S116-P09EX"]},{"name":"無防備なあくび レム","ids":["RZ/S116-078","RZ/S116-078S","RZ/S116-078SP"]},{"name":"ギンガムチェックの案内人 レム","ids":["RZ/S116-083","RZ/S116-083S"]}],"note":""},
	{"title":"ラブライブ！蓮ノ空女学院スクールアイドルクラブ","type":"choose","n":4,"cards":[{"name":"Dream Believers 百生 吟子","ids":["LHS/W122-002","LHS/W122-002S","LHS/W122-002EX"]},{"name":"みんなで叶える物語 藤島 慈","ids":["LHS/W122-009","LHS/W122-009S","LHS/W122-009SP"]},{"name":"PASSION!!!!!! 藤島 慈","ids":["LHS/W122-012","LHS/W122-012S"]},{"name":"ハクチューアラモード 大沢 瑠璃乃","ids":["LHS/W122-050","LHS/W122-050S"]}],"note":""},
	{"title":"学園アイドルマスター","type":"limit","n":2,"cards":[{"name":"アイヴイ 月村手毬","ids":["GIM/W124-071a","GIM/W124-071b","GIM/W124-071EX","GIM/W124-071S","GIM/W124-071SP"]}],"note":""},
	{"title":"学園アイドルマスター","type":"choose","n":2,"cards":[{"name":"君と出会い、夢に翔ける 花海咲季","ids":["GIM/W124-045","GIM/W124-045S"]},{"name":"世界一可愛い私 藤田ことね","ids":["GIM/W124-007","GIM/W124-007S","GIM/W124-007SP","GIM/W124-P09"]}],"note":""}
];
