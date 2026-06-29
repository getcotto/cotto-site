export const LEADS_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"/>
<meta name="apple-mobile-web-app-capable" content="yes"/>
<meta name="apple-mobile-web-app-title" content="Cotto Leads"/>
<meta name="theme-color" content="#B1041F"/>
<title>Cotto Leads — UNFI East</title>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap" rel="stylesheet"/>
<style>
:root{
 --cream:#FFF4DF; --paper:#FFFCF5; --red:#B1041F; --merlot:#570402; --blue:#90C1D3;
 --bluedk:#3F7E93; --green:#85A669; --honey:#F9E0A5; --brioche:#EBC06F; --paprika:#D06506;
 --muted:#9A7E70; --line:rgba(87,4,2,0.14);
}
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
body{margin:0;background:var(--cream);color:var(--merlot);font-family:"Outfit",-apple-system,system-ui,sans-serif;font-weight:400;line-height:1.5;padding:0 0 40px}
.wrap{max-width:520px;margin:0 auto;padding:14px}
header{text-align:center;padding:12px 0 8px}
.mark{font-weight:700;font-size:30px;color:var(--red);letter-spacing:.5px;line-height:1}
.rule{height:4px;width:64px;margin:8px auto 6px;background:linear-gradient(90deg,var(--red) 50%,var(--blue) 50%);border-radius:2px}
.sub{font-size:13px;color:var(--muted);font-weight:500}
.tabbar{display:flex;gap:6px;margin:14px 0;position:sticky;top:0;background:var(--cream);padding:6px 0;z-index:5}
.tab{flex:1;font-family:inherit;font-size:14px;font-weight:600;padding:10px 4px;border-radius:12px;border:1.5px solid var(--line);background:var(--paper);color:var(--merlot);display:flex;align-items:center;justify-content:center;gap:5px}
.tab.active{background:var(--red);color:#fff;border-color:var(--red)}
.pane{display:none}.pane.on{display:block}
.fld{margin-bottom:12px}
.fld label{display:block;font-size:13px;color:var(--muted);font-weight:500;margin-bottom:5px}
input,textarea{width:100%;font-family:inherit;font-size:16px;padding:11px 12px;border:1.5px solid var(--line);border-radius:12px;background:var(--paper);color:var(--merlot)}
input:focus,textarea:focus{outline:none;border-color:var(--blue)}
.chip{font-family:inherit;font-size:14px;font-weight:500;padding:9px 14px;border-radius:11px;border:1.5px solid var(--line);background:var(--paper);color:var(--merlot);margin:0 7px 7px 0}
.chip.on{background:var(--blue);color:var(--merlot);border-color:var(--bluedk);font-weight:600}
.chip.hot.on{background:var(--red);color:#fff;border-color:var(--red)}
.chip.warm.on{background:var(--paprika);color:#fff;border-color:var(--paprika)}
.chip.cold.on{background:var(--blue);color:var(--merlot);border-color:var(--bluedk)}
.btn{font-family:inherit;font-weight:600;font-size:16px;padding:13px;border-radius:12px;border:none;background:var(--red);color:#fff;width:100%;display:flex;align-items:center;justify-content:center;gap:7px}
.btn.sm{width:auto;font-size:13px;padding:7px 13px;background:var(--paper);color:var(--merlot);border:1.5px solid var(--line)}
.cam{display:flex;align-items:center;gap:12px;border:2px dashed var(--blue);border-radius:12px;padding:12px;background:var(--paper)}
.camlbl{display:flex;align-items:center;gap:8px;font-size:15px;font-weight:600;color:var(--red)}
.acct{background:var(--paper);border:1.5px solid var(--line);border-radius:14px;padding:13px 15px;margin-bottom:11px}
.badge{font-size:12px;font-weight:600;padding:3px 10px;border-radius:9px}
.lead{background:var(--paper);border:1.5px solid var(--line);border-radius:12px;padding:11px 13px;margin-bottom:9px}
.row{display:flex;justify-content:space-between;align-items:flex-start;gap:10px}
.k{font-size:13px;color:var(--muted)}
.metric{background:var(--honey);border-radius:12px;padding:11px 13px}
.metric .k{color:var(--paprika);font-weight:600}
.metric .v{font-size:22px;font-weight:700;color:var(--merlot)}
.card-h{font-weight:700;font-size:15px;margin-bottom:5px;color:var(--red)}
a{color:var(--bluedk);font-weight:600}
.thumb{width:50px;height:50px;object-fit:cover;border-radius:10px;border:1.5px solid var(--line)}
.icn{font-style:normal}
</style>
</head>
<body>
<div class="wrap">
<header>
 <div class="mark">Cotto</div>
 <div class="rule"></div>
 <div class="sub">UNFI East · booth tool</div>
</header>

<div class="tabbar">
 <button class="tab active" data-tab="capture">Capture</button>
 <button class="tab" data-tab="watch">Watch</button>
 <button class="tab" data-tab="cheat">Cheat</button>
</div>

<section class="pane on" id="capture">
 <div class="fld"><label>Photo of card / badge</label>
  <div class="cam">
   <label for="f-photo" class="camlbl">📸 Snap card</label>
   <label for="f-upload" class="camlbl" style="color:var(--bluedk)">⬆ Upload</label>
   <input type="file" accept="image/*" capture="environment" id="f-photo" style="display:none"/>
   <input type="file" accept="image/*" id="f-upload" style="display:none"/>
   <img id="f-thumb" alt="" class="thumb" style="display:none"/>
  </div>
 </div>
 <div class="fld"><label>Retailer / company</label><input id="f-store" list="accts" placeholder="e.g. DeCicco & Sons"/><datalist id="accts"></datalist></div>
 <div class="fld"><label>Contact + email/phone (optional if photo)</label><input id="f-contact" placeholder="Name · email · cell"/></div>
 <div class="fld"><label>Interested SKUs</label><div id="skus"><button class="chip" data-sku="FO">FO</button><button class="chip" data-sku="BUF">BUF</button><button class="chip" data-sku="GR">GR</button></div></div>
 <div class="fld"><label>Temperature</label><div id="temp"><button class="chip hot" data-temp="Hot">Hot</button><button class="chip warm" data-temp="Warm">Warm</button><button class="chip cold" data-temp="Cold">Cold</button></div></div>
 <div class="fld"><label>Category review timing</label><input id="f-review" placeholder="e.g. reviews in Sept"/></div>
 <div class="fld"><label>What they asked / next step</label><textarea id="f-notes" rows="2" placeholder="Asked about free fill; send sell sheet"></textarea></div>
 <button class="btn" id="save">✓ Save lead</button>
 <div class="row" style="margin:18px 0 4px;align-items:center">
  <span style="font-weight:700">Leads <span id="count" class="k">(0)</span></span>
  <span><button class="btn sm" id="copy">Copy</button> <button class="btn sm" id="email">Email me</button></span>
 </div>
 <div id="syncstat" class="k" style="margin:0 0 10px">checking backup…</div>
 <div id="leads"></div>
</section>

<section class="pane" id="watch"><div id="watchlist"></div></section>

<section class="pane" id="cheat">
 <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-bottom:14px">
  <div class="metric"><div class="k">SRP</div><div class="v">$9.99</div></div>
  <div class="metric"><div class="k">Wholesale</div><div class="v">~$6.00</div></div>
  <div class="metric"><div class="k">Case</div><div class="v">6 × 8oz</div></div>
  <div class="metric"><div class="k">MOQ</div><div class="v">9 cases</div></div>
 </div>
 <div class="acct"><div class="card-h">The readiness line</div><div>"We can do <b>7 cases / SKU / warehouse / week.</b>" Strategic target: fill <b>UNFI Howell (NJ)</b> — DeCicco, Citarella, Foodtown all pull from it.</div></div>
 <div class="acct"><div class="card-h">Proof points</div><div>PUG #1 in fridge / 1,069 sold · French Onion = the engine · 16 doors + Fairway · NIQ Pitch Slam winner · category +17% YoY, 96% sold plain.</div></div>
 <div class="acct"><div class="card-h">Specs</div><div>Protein: BUF 23g · FO 23g · GR 25g · 60-day shelf life.<br>UPCs: FO 860015 115607 · GR 860015 115614 · BUF 860015 115621.<br><b style="color:var(--red)">Never quote UNFI-to-retailer pricing</b> — SRP + wholesale only.</div></div>
 <div class="acct"><div class="card-h">If they ask…</div><div><b>Slotting:</b> "We're early-stage — any small-supplier program? I'd rather put it into trade/demos. I can do 1 free-fill case."<br><br><b>Promo:</b> "~10–15% of sales to trade; intro TPR 4–8 wks + 2–3 promos/yr; price-off + demos over slotting."</div></div>
 <div class="acct"><div class="card-h">Floor playbook</div><div>Green lanyards = UNFI advocates — get a super-fan.<br>Push the VOTE (retailers + UNFI).<br>Ask everyone: "When's your category review? Off-review placements?"<br>Tongs/spoons at handoff — no gloves.</div></div>
 <div class="acct"><div class="card-h">Contact</div><div>Aaron May (Up Next + Spotlight host): <a href="tel:8607530005">860-753-0005</a><br>Spotlight 10:30am, Hive booth.</div></div>
</section>
</div>

<script>
var accounts=[
{n:"DeCicco & Sons",t:"Best fit",c:"green",info:"13st · NY premium",dc:"UNFI Howell",rev:"Open review",slot:"Free fill · anchor",ask:"Submit anytime; free fill",offer:"Premium NY specialty, your backyard — push first-to-market + free fill."},
{n:"Citarella",t:"Best fit",c:"green",info:"8st · NYC premium",dc:"UNFI Howell",rev:"Open review",slot:"Promo-driven",ask:"Wants strong promos",offer:"Premium natural NY — lead with a promo commitment."},
{n:"Caraluzzi's",t:"Best fit",c:"green",info:"4st · CT natural",dc:"UNFI",rev:"Open review",slot:"Free fill",ask:"Easy natural independent",offer:"Quick yes; free fill."},
{n:"Big Y — LWES",t:"Best fit",c:"green",info:"70st · New England",dc:"UNFI",rev:"Calendar review",slot:"Free fill (natural prog)",ask:"Pitch Live Well Eat Smart set; review date?",offer:"70-store anchor via their natural program — free fill."},
{n:"Earth Origins",t:"Best fit",c:"green",info:"6st · SE natural",dc:"UNFI",rev:"Open review",slot:"Free fill",ask:"Natural independent, open",offer:"Free fill, easy entry."},
{n:"Detwiler's Farm Market",t:"Best fit",c:"green",info:"5st · FL natural",dc:"UNFI",rev:"Open review",slot:"Free fill · anchor",ask:"Open, free fill",offer:"Cheap entry; can anchor a SE DC."},
{n:"Earth Fare",t:"Longer game",c:"brioche",info:"20st · SE natural",dc:"UNFI Atlanta/Sarasota",rev:"Calendar review",slot:"$5.2k/SKU",ask:"Category review timing",offer:"WARM — Wes Hollamon met you at Fancy Food. Mention it."},
{n:"Foodtown",t:"Longer game",c:"brioche",info:"65st · NY metro",dc:"UNFI Howell",rev:"Review TBD",slot:"Free fill · anchor",ask:"Natural sets in 65 stores",offer:"Free fill; anchors Howell."},
{n:"The Fresh Market",t:"Dream anchor",c:"blue",info:"~170st · SE+NE",dc:"via UNFI",rev:"Ask the Hive",slot:"not in tracker",ask:"Pursue via UNFI/Hive intro",offer:"Cottage cheese = their named white space. Your #1 — ask UNFI to connect you."},
{n:"Whole Foods (NE)",t:"Dream anchor",c:"blue",info:"Northeast region",dc:"via UNFI/direct",rev:"Regional",slot:"not in tracker",ask:"You have LEAP history",offer:"Premium fit — lead with velocity proof + LEAP."},
{n:"Sprouts",t:"Dream anchor",c:"blue",info:"national natural",dc:"via UNFI/KeHE",rev:"2026 reset (in flight)",slot:"not in tracker",ask:"You have a reset in motion",offer:"Reference your Fresh Finds reset; ask for the buyer."},
{n:"MOM's Organic Market",t:"Dream anchor",c:"blue",info:"Mid-Atlantic natural",dc:"via UNFI",rev:"Ask the Hive",slot:"not in tracker",ask:"Mid-Atlantic natural anchor",offer:"On-brand natural — pursue a UNFI intro."},
{n:"America's Food Basket",t:"Expensive",c:"red",info:"70st · NE natural",dc:"UNFI",rev:"Review TBD",slot:"$5k–15k/SKU",ask:"High slotting",offer:"Don't lead on slotting; demand-first only."}
];
var BG={green:"#85A669",brioche:"#EBC06F",blue:"#90C1D3",red:"#B1041F"};
var FG={green:"#173404",brioche:"#570402",blue:"#3F7E93",red:"#fff"};

var KEY="cotto_booth_leads_v1";
var leads=[];try{leads=JSON.parse(localStorage.getItem(KEY))||[]}catch(e){}
var selSku={},selTemp="",pendingPhoto="";

document.querySelectorAll(".tab").forEach(function(b){b.onclick=function(){
 document.querySelectorAll(".tab").forEach(function(x){x.classList.remove("active")});b.classList.add("active");
 document.querySelectorAll(".pane").forEach(function(p){p.classList.remove("on")});
 document.getElementById(b.getAttribute("data-tab")).classList.add("on");window.scrollTo(0,0);
}});

var dl=document.getElementById("accts");
accounts.forEach(function(a){var o=document.createElement("option");o.value=a.n;dl.appendChild(o)});

var wl=document.getElementById("watchlist");
accounts.forEach(function(a){
 var d=document.createElement("div");d.className="acct";
 d.innerHTML='<div class="row"><span style="font-weight:700;font-size:16px">'+a.n+'</span><span class="badge" style="background:'+BG[a.c]+';color:'+FG[a.c]+'">'+a.t+'</span></div>'+
 '<div class="k" style="margin:5px 0">'+a.info+' · '+a.dc+'</div>'+
 '<div style="margin-bottom:4px"><b>'+a.rev+'</b> · '+a.slot+'</div>'+
 '<div style="font-size:14px"><span class="k">Ask:</span> '+a.ask+'</div>'+
 '<div style="font-size:14px;margin-bottom:9px"><span class="k">You:</span> '+a.offer+'</div>'+
 '<button class="btn sm logbtn" data-n="'+a.n.replace(/"/g,"&quot;")+'">📸 Log this lead</button>';
 wl.appendChild(d);
});
document.querySelectorAll(".logbtn").forEach(function(b){b.onclick=function(){
 document.getElementById("f-store").value=b.getAttribute("data-n");
 document.querySelector('.tab[data-tab="capture"]').click();
 document.getElementById("f-photo").click();
}});

var thumb=document.getElementById("f-thumb");
function handlePhoto(e){
 var f=e.target.files[0];if(!f)return;var img=new Image();var r=new FileReader();
 r.onload=function(){img.onload=function(){
  var mw=720;var s=Math.min(1,mw/img.width);var cv=document.createElement("canvas");
  cv.width=Math.round(img.width*s);cv.height=Math.round(img.height*s);
  cv.getContext("2d").drawImage(img,0,0,cv.width,cv.height);
  pendingPhoto=cv.toDataURL("image/jpeg",0.55);thumb.src=pendingPhoto;thumb.style.display="block";
 };img.src=r.result};r.readAsDataURL(f);
}
document.getElementById("f-photo").onchange=handlePhoto;
document.getElementById("f-upload").onchange=handlePhoto;

document.querySelectorAll("#skus .chip").forEach(function(c){c.onclick=function(){c.classList.toggle("on");selSku[c.getAttribute("data-sku")]=c.classList.contains("on")}});
document.querySelectorAll("#temp .chip").forEach(function(c){c.onclick=function(){document.querySelectorAll("#temp .chip").forEach(function(x){x.classList.remove("on")});c.classList.add("on");selTemp=c.getAttribute("data-temp")}});

function render(){
 document.getElementById("count").textContent="("+leads.length+")";
 var box=document.getElementById("leads");box.innerHTML="";
 leads.forEach(function(l,i){
  var tc=l.temp==="Hot"?"#B1041F":l.temp==="Warm"?"#D06506":"#90C1D3";
  var tf=l.temp==="Cold"?"#3F7E93":"#fff";
  var d=document.createElement("div");d.className="lead";
  d.innerHTML='<div class="row"><div style="display:flex;gap:11px">'+
  (l.photo?'<img class="thumb" src="'+l.photo+'"/>':'')+
  '<div><div style="font-weight:600">'+(l.store||"(photo lead)")+'</div>'+
  '<div class="k">'+(l.contact||"")+(l.skus?" · "+l.skus:"")+'</div>'+
  (l.review?'<div style="font-size:13px">Review: '+l.review+'</div>':'')+
  (l.notes?'<div style="font-size:14px;margin-top:2px">'+l.notes+'</div>':'')+'</div></div>'+
  (l.temp?'<span class="badge" style="background:'+tc+';color:'+tf+'">'+l.temp+'</span>':'')+'</div>'+
  '<button class="btn sm del" data-i="'+i+'" style="margin-top:7px">Delete</button>';
  box.appendChild(d);
 });
 document.querySelectorAll(".del").forEach(function(b){b.onclick=function(){var i=+b.getAttribute("data-i");var rm=leads[i];leads.splice(i,1);save();if(rm&&rm.id)delServer(rm.id);}});
}
var API="/api/leads";
function setSync(m){var el=document.getElementById("syncstat");if(el)el.textContent=m}
function localCopy(){return leads.map(function(l){return l.synced?Object.assign({},l,{photo:""}):l})}
function persist(){try{localStorage.setItem(KEY,JSON.stringify(localCopy()))}catch(e){try{localStorage.setItem(KEY,JSON.stringify(leads.filter(function(l){return !l.synced})))}catch(e2){}}}
function save(){persist();render()}
function countSynced(){var n=0;leads.forEach(function(l){if(l.synced)n++});return n+"/"+leads.length+" backed up to server"}
function pushLead(l){
 if(!l||!l.id){return}
 setSync("saving…");
 fetch(API,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({lead:l})})
 .then(function(r){if(r.ok){l.synced=true;persist();setSync(countSynced())}else{setSync("offline — saved on phone, will retry")}})
 .catch(function(){setSync("offline — saved on phone, will retry")});
}
function pushUnsynced(){var any=false;leads.forEach(function(l){if(!l.synced){any=true;pushLead(l)}});if(!any)setSync(countSynced())}
function delServer(id){fetch(API+"?id="+encodeURIComponent(id),{method:"DELETE"}).then(function(){setSync(countSynced())}).catch(function(){})}
function reconcile(){
 setSync("syncing…");
 fetch(API).then(function(r){return r.ok?r.json():null}).then(function(d){
  if(d&&d.leads){
   var byId={};leads.forEach(function(l){byId[l.id]=l});
   var changed=0;
   d.leads.forEach(function(s){
    if(!s||!s.id)return;
    if(!byId[s.id]){s.synced=true;leads.push(s);changed++}
    else if(!byId[s.id].photo&&s.photo){byId[s.id].photo=s.photo;changed++}
   });
   if(changed){persist();render()}
  }
  pushUnsynced();
 }).catch(function(){pushUnsynced()});
}

document.getElementById("save").onclick=function(){
 var skus=Object.keys(selSku).filter(function(k){return selSku[k]}).join("/");
 var store=document.getElementById("f-store").value.trim();
 if(!store&&!pendingPhoto){document.getElementById("f-store").focus();return}
 var lead={id:"L"+Date.now().toString(36)+Math.random().toString(36).slice(2,7),ts:new Date().toISOString(),store:store,contact:document.getElementById("f-contact").value.trim(),skus:skus,temp:selTemp,review:document.getElementById("f-review").value.trim(),notes:document.getElementById("f-notes").value.trim(),photo:pendingPhoto,synced:false};
 leads.unshift(lead);
 save();
 pushLead(lead);
 ["f-store","f-contact","f-review","f-notes"].forEach(function(id){document.getElementById(id).value=""});
 document.querySelectorAll(".chip.on").forEach(function(c){c.classList.remove("on")});selSku={};selTemp="";pendingPhoto="";thumb.style.display="none";
 window.scrollTo(0,0);
};

function leadsText(){return leads.map(function(l){return "- "+(l.store||"(photo lead)")+" | "+(l.temp||"")+" | "+(l.contact||"")+(l.skus?" ["+l.skus+"]":"")+(l.review?" | review:"+l.review:"")+(l.notes?" | "+l.notes:"")+(l.photo?" | [photo backed up]":"")}).join("\\n")}
function fallbackCopy(t){try{var ta=document.createElement("textarea");ta.value=t;ta.style.position="fixed";ta.style.opacity="0";document.body.appendChild(ta);ta.focus();ta.select();document.execCommand("copy");document.body.removeChild(ta)}catch(e){}}
document.getElementById("copy").onclick=function(){var t="Cotto UNFI East leads:\\n"+leadsText();var done=function(){var b=document.getElementById("copy"),o=b.textContent;b.textContent="Copied";setTimeout(function(){b.textContent=o},1400)};try{if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(t).then(done,function(){fallbackCopy(t);done()})}else{fallbackCopy(t);done()}}catch(e){fallbackCopy(t);done()}};
document.getElementById("email").onclick=function(){if(!leads.length){setSync("no leads to email yet");return}var url="mailto:kendall@getcotto.com?subject="+encodeURIComponent("Cotto UNFI East leads")+"&body="+encodeURIComponent(leadsText()+"\\n\\n(Photos are backed up to the server — view them in the tool.)");try{(window.top||window).location.href=url}catch(e){window.location.href=url}};

render();reconcile();
</script>
</body>
</html>
`;
