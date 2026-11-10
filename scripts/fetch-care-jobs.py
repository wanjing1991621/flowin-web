#!/usr/bin/env python3
"""从中国残疾人就业创业网络服务平台（cdpee.org.cn）抓取在招残障岗位，生成 app/care-jobs.ts"""
import json, re, time, urllib.request

API = "https://www.cdpee.org.cn/api/app-jycy-job/querySearchJobInfo"
HEADERS = {"Content-Type": "application/json", "User-Agent": "Mozilla/5.0 (Macintosh) AppleWebKit/537.36"}

def fetch_page(page):
    body = json.dumps({"pageNum": page, "pageSize": 15}).encode()
    req = urllib.request.Request(API, data=body, headers=HEADERS, method="POST")
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.loads(r.read().decode())

def clean(text, limit):
    if not text:
        return ""
    t = re.sub(r"【[^】]*】", "", text)
    t = re.sub(r"\s+", " ", t).strip()
    t = re.sub(r"^[\d.、;；\s]+", "", t)
    return t[:limit - 1] + "…" if len(t) > limit else t

def esc(s):
    return s.replace("\\", "\\\\").replace("'", "\\'")

seen, jobs = set(), []
for page in range(1, 7):
    try:
        records = fetch_page(page)
    except Exception as e:
        print(f"page {page} failed: {e}")
        break
    if not isinstance(records, list) or not records:
        break
    for r in records:
        jid = r.get("id")
        name = (r.get("jobName") or "").strip()
        company = ((r.get("companyInfo") or {}).get("companyName") or "").strip()
        if not jid or jid in seen or not name or not company:
            continue
        seen.add(jid)
        salary = r.get("jobSalary") or "薪资面议"
        loc = " ".join(x for x in [r.get("provinceid"), r.get("cityid")] if x) or "地点详见原页"
        distypes = sorted({d.get("disType", "") for d in r.get("distype") or [] if d.get("disType")})
        summary = clean((r.get("jobClobOutDTO") or {}).get("jobDescript") or "", 90)
        labels = [l["labelName"] for l in r.get("jobLabels") or [] if l.get("labelName")]
        tags = [t for t in [r.get("edu"), r.get("exp")] + labels[:2] if t][:4]
        jobs.append({
            "id": jid, "title": name, "company": company,
            "symbol": name[0], "kind": r.get("jobType") or "全职",
            "salary": salary, "location": loc,
            "distypes": distypes, "summary": summary, "tags": tags,
            "posted": r.get("createTime") or "",
            "url": f"https://www.cdpee.org.cn/job/jobDetail?id={jid}",
        })
    time.sleep(1)

# 优先展示写明薪资的岗位，其次按发布时间
jobs.sort(key=lambda j: (j["salary"] == "薪资面议", j["posted"]), reverse=False)
picked = jobs[:12]
print(f"fetched {len(jobs)} unique jobs, picked {len(picked)}")

lines = ["// 数据来源：中国残疾人就业创业网络服务平台（cdpee.org.cn），中国残联主办", "// 抓取时间：2026-11-10；岗位状态与详情以原平台为准", "export type CareJob={id:string;title:string;publisher:string;symbol:string;kind:string;salary:string;location:string;summary:string;tags:string[];distypes:string[];url:string;posted:string};", "export const careJobs:CareJob[]=["]
for j in picked:
    note = "；".join(distypes_note for distypes_note in ["面向：" + "、".join(j["distypes"])] if j["distypes"])
    lines.append("{id:'%s',title:'%s',publisher:'%s',symbol:'%s',kind:'%s',salary:'%s',location:'%s',summary:'%s',tags:[%s],distypes:[%s],url:'%s',posted:'%s'}," % (
        esc(j["id"]), esc(j["title"]), esc(j["company"]), esc(j["symbol"]), esc(j["kind"]), esc(j["salary"]),
        esc(j["location"]), esc(j["summary"]), ",".join("'%s'" % esc(t) for t in j["tags"]),
        ",".join("'%s'" % esc(d) for d in j["distypes"]), esc(j["url"]), esc(j["posted"])))
lines.append("];")
out = "\n".join(lines) + "\n"
with open("/Users/tongsining/Downloads/ai-projects/flowin-web/app/care-jobs.ts", "w") as f:
    f.write(out)
print("written app/care-jobs.ts")
for j in picked:
    print(" -", j["title"], "|", j["company"][:16], "|", j["salary"], "|", j["location"])
