# -*- coding: utf-8 -*-
"""Merge every sweep into one deduplicated, account-level CRM dataset.

Inputs : sweep_01..04 (Gmail, by date window), sweep_05 (Notion/calendar/LinkedIn),
         door_plan.json (financial model), accounts.json (live customers, the spine).
Outputs: crm_accounts.json  — the dataset the site renders
         merge_report.txt   — every alias->canonical decision, for audit
"""
import json, glob, re, unicodedata, datetime, collections, os

HERE = os.path.dirname(os.path.abspath(__file__))
TODAY = datetime.date(2026, 7, 16)

# ---------------------------------------------------------------- load
recs = []
for f in sorted(glob.glob(os.path.join(HERE, "sweep_0[1-4]*.json"))):
    win = os.path.basename(f)[6:8]
    for r in json.load(open(f, encoding="utf-8")):
        if any(k.startswith("_") for k in r):
            continue
        r["_src"] = "gmail"; r["_win"] = win
        recs.append(r)
d5 = json.load(open(os.path.join(HERE, "sweep_05_notion_calendar_linkedin.json"), encoding="utf-8"))
for k in ("notion_crm", "calendar", "linkedin"):
    for r in d5.get(k, []):
        r["_src"] = k; r["_win"] = "05"
        recs.append(r)

door_plan = json.load(open(os.path.join(HERE, "door_plan.json"), encoding="utf-8"))
try:
    spine = json.load(open(r"C:\Users\kenda\_cs_ops\ops\spine\accounts.json", encoding="utf-8"))
    if isinstance(spine, dict):
        spine = spine.get("accounts", list(spine.values()))
except Exception:
    spine = []

# ---------------------------------------------------------------- canonicalize
def norm(s):
    s = unicodedata.normalize("NFKD", str(s or "")).lower()
    s = re.sub(r"[^a-z0-9 &]", " ", s)
    return re.sub(r"\s+", " ", s).strip()

# ordered (pattern -> canonical). First match wins, so put specific before generic.
RULES = [
    (r"duplicate", None),                      # drop Notion housekeeping rows
    (r"\bshoprite\b|wakefern \(procurement", "Wakefern / ShopRite"),
    (r"fairway", "Fairway Market"),
    (r"^wakefern$|village super market", "Wakefern / ShopRite"),
    (r"gourmet garage", "Gourmet Garage"),
    (r"whole foods|wholefoods", "Whole Foods Market"),
    (r"\bunfi\b", "UNFI"),
    (r"meraki", "Meraki Direct"),
    (r"localee", "Localee Wholesale"),
    (r"rainforest", "Rainforest Distribution"),
    (r"dora", "Dora's Naturals"),
    (r"gourmet foods international|gfi foods|\bgfi\b", "Gourmet Foods International (GFI)"),
    (r"misfits", "Misfits Market"),
    (r"pop up grocer", "Pop Up Grocer"),
    (r"^target$|^target\b", "Target"),
    (r"omg inc", "OMG Inc (Ryan Rogers)"),
    (r"the shelf", "The Shelf"),
    (r"last minute market|last minute montclair", "Last Minute Market"),
    (r"agata", "Agata & Valentina"),
    (r"albertsons", "Albertsons"),
    (r"fields texas", "Fields Texas"),
    (r"be neighborly|neighborly", "Be Neighborly"),
    (r"eco.?meal", "Eco-Meal"),
    (r"aux delices", "Aux Delices"),
    (r"city acres", "City Acres Market"),
    (r"castaway", "Castaway Cafe"),
    (r"schmidt", "Schmidt's Country Market"),
    (r"sagaponack", "Sagaponack General Store"),
    (r"key food", "Key Food"),
    (r"market fresh", "Market Fresh (MI)"),
    (r"olive & oak|olive and oak", "Olive & Oak"),
    (r"raley", "Raley's"),
    (r"startup ?cpg", "Startup CPG"),
    (r"rangeme|ecrm", "RangeMe / ECRM"),
    (r"airgoods", "Airgoods"),
    (r"chicexecs", "ChicExecs"),
    (r"lunr", "Lunr Capital"),
    (r"many thanks", "Many Thanks Consulting"),
    (r"naturally new york", "Naturally New York"),
    (r"new hope", "New Hope Network"),
    (r"walmart canada", "Walmart Canada"),
    (r"walmart", "Walmart U.S."),
    (r"perishable distributors|pdi", "PDI / Hy-Vee"),
    (r"butterfield", "Butterfield Market"),
    (r"farm to people", "Farm to People"),
    (r"^aldi", "Aldi"),
    (r"giant food", "Giant Food"),
    (r"westside market|w market nyc", "Westside Market"),
    (r"eli zabar|eli s market", "Eli Zabar"),
    (r"^zabar", "Zabar's"),
    (r"fresh thyme", "Fresh Thyme Market"),
    (r"fresh ?direct", "FreshDirect"),
    (r"fresh market", "The Fresh Market"),          # plan says "Fresh Market", leads say "The Fresh Market"
    (r"\bahold\b|giant food|stop & shop", "Ahold (Giant / Stop & Shop)"),  # plan calls it Ahold, leads call it Giant Food
    (r"sprouts", "Sprouts Farmers Market"),
    (r"wegmans", "Wegmans"),
    (r"earth fare", "Earth Fare"),
    (r"hungryroot|hungry root", "Hungryroot"),
    (r"stew leonard", "Stew Leonard's"),
    (r"uncle giuseppe", "Uncle Giuseppe's Marketplace"),
    (r"decicco", "DeCicco & Sons"),
    (r"citarella", "Citarella"),
    (r"morton williams", "Morton Williams"),
    (r"union market", "Union Market"),
    (r"green spoon", "Green Spoon Sales"),
    (r"crossmark", "CROSSMARK"),
    (r"acosta", "Acosta"),
    (r"moscoe", "The Moscoe Group"),
    (r"kinneberg|kmg", "KMG (Kinneberg)"),
    (r"pinnacle food", "Pinnacle Food Sales"),
    (r"shelf ?wolf", "Shelf Wolf"),
    (r"summit cpg", "Summit CPG"),
    (r"peaklign", "Peaklign Partners"),
    (r"infra", "INFRA"),
    (r"kehe", "KeHE"),
    (r"\bawg\b|associated wholesale", "AWG"),
    (r"instacart", "Instacart"),
    (r"nielseniq|\bniq\b", "NielsenIQ"),
    (r"meadow lane", "Meadow Lane"),
    (r"happier", "Happier Grocery"),
    (r"jack s market|superfresh", "Jack's Market"),
    (r"montauk", "Montauk Yacht Club"),
    (r"amber waves", "Amber Waves Farm"),
    (r"double l", "Double L Market"),
    (r"foxtrot", "Foxtrot"),
    (r"erewhon", "Erewhon"),
    (r"thrive", "Thrive Market"),
    (r"good eggs", "Good Eggs"),
    (r"good stuff", "Good Stuff Distributors"),
    (r"gus s community", "Gus's Community Market"),
    (r"gold coast", "Gold Coast Distributors"),
    (r"dairy delivery", "Dairy Delivery Distribution"),
    (r"mom s organic", "MOM's Organic Market"),
    (r"bristol farms", "Bristol Farms"),
    (r"natural grocers", "Natural Grocers"),
    (r"winn.?dixie", "Winn-Dixie"),
    (r"harmons", "Harmons"),
    (r"heinen", "Heinen's"),
    (r"redner", "Redner's"),
    (r"loot grocery", "Loot Grocery"),
    (r"goods mart", "The Goods Mart"),
    (r"julie b", "Julie B Eatery"),
    (r"mcmahon", "McMahon's Farm"),
    (r"union kitchen", "Union Kitchen"),
    (r"youngstown", "Youngstown Distributing"),
    (r"valley roots|fuel & iron", "Valley Roots"),
    (r"meadeco|meadeconnect", "MeadeConnect"),
    (r"river sea", "River Sea Network (internal)"),
    (r"food n bev|food'n'bev", "Food'N'Bev Connect"),
    (r"step two", "Step Two Advisors"),
    (r"soulberry", "Soulberry Market"),
    (r"seacrest", "Seacrest Foods"),
    (r"daniel foods", "Daniel Foods"),
    (r"eataly", "Eataly"),
    (r"d agostino|dag nyc", "D'Agostino"),
    (r"greens natural", "Greens Natural Foods"),
    (r"eden gourmet|garden of eden", "Eden Gourmet"),
    (r"murray s cheese", "Murray's Cheese"),
    (r"tico", "Tico's"),
]

def canon(company):
    n = norm(company)
    if not n or n == "?":
        return None
    for pat, out in RULES:
        if re.search(pat, n):
            return out
    return re.sub(r"\s*\(.*?\)\s*", " ", str(company)).strip(" .,-—") or None

# ---------------------------------------------------------------- helpers
def pick_date(r):
    for k in ("last_contact_date", "last_touch_date"):
        v = r.get(k)
        if v and re.match(r"^\d{4}-\d{2}-\d{2}$", str(v)):
            return str(v)
    return None

def days_since(d):
    if not d: return None
    try:
        return (TODAY - datetime.date.fromisoformat(d)).days
    except Exception:
        return None

EMAIL_RE = re.compile(r"[\w.+-]+@[\w-]+\.[\w.]+")
def emails_of(r):
    out = []
    for tok in EMAIL_RE.findall(str(r.get("email") or "")):
        t = tok.strip(" .,;")
        if t.lower() not in [e.lower() for e in out]:
            out.append(t)
    return out

TYPE_RANK = {"retailer": 5, "distributor": 4, "buying-group": 3, "broker": 2, "other": 1}

# live customers from the spine
live_names = set()
for a in spine if isinstance(spine, list) else []:
    nm = a.get("name") or a.get("account") if isinstance(a, dict) else None
    if nm:
        c = canon(nm)
        if c: live_names.add(c)

plan_by = {}
for p in door_plan:
    c = canon(p["account"])
    if c and c not in plan_by:
        plan_by[c] = p

# ---------------------------------------------------------------- merge
accounts = {}
merge_log = collections.defaultdict(set)
dropped = []
for r in recs:
    c = canon(r.get("company"))
    if not c:
        dropped.append(r.get("company"))
        continue
    merge_log[c].add(str(r.get("company") or "").strip())
    a = accounts.setdefault(c, {
        "company": c, "type": None, "contacts": [], "statuses": [], "notes": [],
        "reviewWindows": [], "thirdParty": [], "threads": [], "sources": set(),
        "doorsSeen": [], "lastTouch": None, "owes": None, "_owesDate": None, "aliases": set(),
    })
    a["sources"].add(r.get("_src"))
    a["aliases"].add(str(r.get("company") or "").strip())
    t = (r.get("type") or "").strip().lower()
    if t in TYPE_RANK and TYPE_RANK[t] > TYPE_RANK.get(a["type"] or "", 0):
        a["type"] = t
    # contact
    person = (r.get("person") or "").strip()
    if person and person.lower() not in ("null", "none"):
        ems = emails_of(r)
        existing = next((x for x in a["contacts"] if x["name"].lower() == person.lower()), None)
        if existing:
            for e in ems:
                if e.lower() not in [y.lower() for y in existing["emails"]]:
                    existing["emails"].append(e)
            if not existing.get("role") and r.get("role"):
                existing["role"] = str(r["role"])[:200]
        else:
            a["contacts"].append({"name": person[:120], "role": str(r.get("role") or "")[:200],
                                  "emails": ems, "source": r.get("_src")})
    d = pick_date(r)
    # A future-dated record is a SCHEDULED MEETING, not a past touch. Keep them apart:
    # counting a 7/22 calendar invite as "last contact" would hide a lead that's actually gone quiet.
    if d and d > TODAY.isoformat():
        if not a.get("nextMeeting") or d < a["nextMeeting"]:
            a["nextMeeting"] = d
        d = None
    if d and (not a["lastTouch"] or d > a["lastTouch"]):
        a["lastTouch"] = d
    ow = (r.get("who_owes_next_move") or "").strip().lower()
    if ow in ("us", "them") and (not a["_owesDate"] or (d or "") >= a["_owesDate"]):
        a["owes"] = ow; a["_owesDate"] = d or ""
    if r.get("status"):
        a["statuses"].append({"date": d, "src": r.get("_src"), "text": str(r["status"])})
    if r.get("notes"):
        a["notes"].append(str(r["notes"]))
    rw = r.get("review_window")
    if rw and str(rw).strip() and str(rw).lower() not in ("null", "none"):
        a["reviewWindows"].append(str(rw))
    tp = r.get("retailer_named_by_third_party")
    if tp and str(tp).strip() and str(tp).lower() not in ("null", "none"):
        a["thirdParty"].append(str(tp))
    if r.get("thread_id"):
        a["threads"].append(str(r["thread_id"]))
    # Door counts: only trust an explicit "N doors/stores/locations". A bare number grab
    # pulled 6600 out of Be Neighborly's street address (6600 Topanga Canyon Blvd).
    ds = r.get("doors_or_stores")
    n = None
    if isinstance(ds, (int, float)):
        n = int(ds)
    elif ds and str(ds).strip():
        m = re.search(r"~?\s*(\d{1,4})\s*\+?\s*(?:doors?|stores?|locations?)", str(ds), re.I)
        if m:
            n = int(m.group(1))
    if n and 0 < n <= 3000:
        a["doorsSeen"].append(n)

# ---------------------------------------------------------------- enrich
out = []
for c, a in accounts.items():
    plan = plan_by.get(c)
    ds = days_since(a["lastTouch"])
    is_live = c in live_names
    # accounts.json (the spine) is the ONLY authority on who is a live customer -- it is the
    # one writer for that fact. Never infer "live" from prose.
    #
    # For everyone else, judge from the MOST RECENT status only. Scanning all history is what
    # made Whole Foods read as "passed": it did pass Round 9 in the spring, but Cotto
    # resubmitted 7/7 and has a 7/22 meeting, so the account is plainly in-talks today.
    latest = ""
    dated = [x for x in a["statuses"] if x["date"]]
    if dated:
        latest = max(dated, key=lambda x: x["date"])["text"].lower()
    elif a["statuses"]:
        latest = a["statuses"][0]["text"].lower()
    # A real relationship needs evidence of an actual exchange (a dated touch or an email
    # thread). Notion rows like "Target, Priority High. Sample Status = Not Requested. No
    # contact recorded." are a wish list, not a conversation -- don't let them read as in-talks.
    engaged = bool(a["lastTouch"]) or bool(a["threads"])
    if is_live:
        stage = "live"
    elif re.search(r"\bpassed\b|\brejected\b|\bdeclined\b|not selected|no spots|\bdormant\b", latest):
        stage = "passed"
    elif engaged:
        stage = "in-talks"
    else:
        stage = "target"
    # Due-for-outreach. "They owe us" is NOT a reason to sit still -- a buyer who has gone
    # quiet for three weeks is a chase, not a wait. That distinction is the whole point of this.
    due = False; why = None
    if stage == "passed":
        pass
    elif a["owes"] == "us":
        due = True; why = "We owe the next move"
    elif a["owes"] == "them" and ds is not None and ds >= 21:
        due = True; why = f"Waiting on them {ds} days - chase"
    elif ds is not None and ds >= 45 and stage in ("in-talks", "live"):
        due = True; why = f"No contact in {ds} days"
    elif stage == "target" and (a["doorsSeen"] or plan):
        due = True; why = "Never contacted"
    out.append({
        "id": re.sub(r"[^a-z0-9]+", "-", c.lower()).strip("-"),
        "company": c,
        "type": a["type"] or "other",
        "stage": stage,
        # Doors describe shelf presence, so they only mean anything for a retailer.
        # A distributor's "~350 accounts" is not a Cotto door count.
        "doors": (max(a["doorsSeen"]) if a["doorsSeen"] and (a["type"] or "") == "retailer" else None),
        "plannedDoors": plan["doors"] if plan else None,
        "plannedOpen": plan["open_date"] if plan else None,
        "plannedChannel": plan["channel"] if plan else None,
        "inPlan": bool(plan),
        "contacts": a["contacts"],
        "lastTouch": a["lastTouch"],
        "nextMeeting": a.get("nextMeeting"),
        "daysSince": ds,
        "owes": a["owes"],
        "due": due, "dueReason": why,
        "statuses": sorted(a["statuses"], key=lambda x: x["date"] or "", reverse=True)[:6],
        "reviewWindows": list(dict.fromkeys(a["reviewWindows"]))[:6],
        "thirdParty": list(dict.fromkeys(a["thirdParty"]))[:4],
        "threads": list(dict.fromkeys(a["threads"]))[:8],
        "sources": sorted(a["sources"]),
        "aliases": sorted(x for x in a["aliases"] if x),
        "notes": list(dict.fromkeys(a["notes"]))[:4],
    })

out.sort(key=lambda x: (x["stage"] != "live", -(x["plannedDoors"] or 0), x["company"]))
json.dump(out, open(os.path.join(HERE, "crm_accounts.json"), "w", encoding="utf-8"), indent=1, ensure_ascii=False)

with open(os.path.join(HERE, "merge_report.txt"), "w", encoding="utf-8") as fh:
    fh.write(f"{len(recs)} raw records -> {len(out)} accounts\n\n")
    for c in sorted(merge_log):
        al = sorted(x for x in merge_log[c] if x and x != c)
        if al:
            fh.write(f"{c}\n" + "".join(f"    <- {x}\n" for x in al))
    if dropped:
        fh.write("\nDROPPED (no company / duplicate rows): %d\n" % len(dropped))

print(f"raw records      : {len(recs)}")
print(f"merged accounts  : {len(out)}")
print(f"dropped rows     : {len(dropped)}")
print(f"in door plan     : {sum(1 for x in out if x['inPlan'])}")
print(f"live             : {sum(1 for x in out if x['stage']=='live')}")
print(f"due for outreach : {sum(1 for x in out if x['due'])}")
print(f"with review win  : {sum(1 for x in out if x['reviewWindows'])}")
print("\nTOP BY PLANNED DOORS:")
for x in sorted(out, key=lambda z: -(z["plannedDoors"] or 0))[:12]:
    print(f"  {str(x['plannedDoors'] or '-'):>4} doors | {x['plannedOpen'] or '-':10} | {x['stage']:9} | {x['company']}")
