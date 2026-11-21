// 까치카페 블로그 도구: 사이드패널 화면

const NAVER_BLOG_ID = "zee550000";
const SHOP_DEFAULT = [
  "가게 이름: 까치카페 (광명 하안동)",
  "주소: 경기도 광명시 오리로619번길 32 (광명시 보건소 근처)",
  "가는 길: 철산역에서 버스로 10분 정도, 주차 가능",
  "영업시간: 평일 오전 10시 30분~오후 6시 / 주말 오전 10시 30분~오후 9시, 쉬는 날 없음",
  "미리 주문: 카카오톡 채널 '까치카페'",
  "13년째 같은 자리에서 운영",
  "사장은 미술대학에서 조각을 공부한 조각가",
  "베이글과 스콘을 매장에서 매일 직접 구움 (하루 100개, 금방 품절)",
  "재료: 발효버터, 난각번호 1번 계란, 엑스트라버진 올리브유, 무농약 채소",
  "베이글 3,000~3,800원, 스콘 3,000~4,300원 (2026년 11월 기준)"
].join("\n");

const DEFAULT_STATE = {
  step: 1, purpose: "메뉴 소개", topic: "", keyword: "", facts: "",
  tone: "친근하게", length: "보통", useShop: true, shop: SHOP_DEFAULT,
  photos: [], prompt: "", title: "", body: "", savedTitle: "", savedBody: "", savedAt: "",
  gemTabId: null, checks: {}, pub: "아직"
};

let state = structuredClone(DEFAULT_STATE);
let generating = false;
const $ = id => document.getElementById(id);

/* ---------- 저장 ---------- */
let saveTimer = null;
async function writeNow() {
  clearTimeout(saveTimer);
  try { await chrome.storage.local.set({ kkachiBlog: state }); $("autosave").textContent = "자동 저장됨"; }
  catch (e) { $("autosave").textContent = "자동 저장 실패: " + (e.message || e); }
}
function persist(now) {
  clearTimeout(saveTimer);
  $("autosave").textContent = "저장 중…";
  if (now) return writeNow();
  saveTimer = setTimeout(writeNow, 150);
}
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") writeNow(); });
async function load() {
  try {
    const got = await chrome.storage.local.get("kkachiBlog");
    if (got.kkachiBlog) state = Object.assign(structuredClone(DEFAULT_STATE), got.kkachiBlog);
  } catch (e) { /* 처음 실행 */ }
}

/* ---------- 단계 이동 ---------- */
function showStep(n) {
  state.step = Math.min(5, Math.max(1, n));
  document.querySelectorAll(".panel").forEach(p => { p.hidden = Number(p.dataset.panel) !== state.step; });
  document.querySelectorAll(".steps button").forEach(b => {
    const s = Number(b.dataset.step);
    if (s === state.step) b.setAttribute("aria-current", "step"); else b.removeAttribute("aria-current");
    b.classList.toggle("done", s < state.step);
  });
  $("btn-prev").disabled = state.step === 1;
  $("btn-next").textContent = state.step === 5 ? "처음으로" : ({ 1: "다음 · 사진 →", 2: "다음 · 원고 →", 3: "다음 · 네이버 →", 4: "다음 · 발행 확인 →" })[state.step];
  if (state.step === 3) { refreshPrompt(); checkGemini(false); }
  if (state.step === 4) renderPhotos($("photos-naver"), false);
  document.querySelector("main").scrollTop = 0;
  persist();
}

/* ---------- 선택 버튼 ---------- */
function bindChips(id, key) {
  const box = $(id);
  const paint = () => box.querySelectorAll("button").forEach(b => b.setAttribute("aria-checked", String(b.dataset.v === state[key])));
  box.addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b) return;
    state[key] = b.dataset.v; paint(); persist();
    if (key === "tone" || key === "length" || key === "purpose") refreshPrompt();
  });
  paint();
}
function bindText(id, key, after) {
  const el = $(id); el.value = state[key] || "";
  el.addEventListener("input", () => { state[key] = el.value; persist(); if (after) after(); });
}

/* ---------- 사진 ---------- */
function readAsDataURL(file) {
  return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(file); });
}
async function shrink(dataUrl) {
  // 미리보기용으로만 작게 보관 (원본 파일은 사장님 PC에 그대로 있음)
  const img = new Image(); img.src = dataUrl; await img.decode();
  const max = 320, r = Math.min(1, max / Math.max(img.width, img.height));
  const c = document.createElement("canvas"); c.width = Math.round(img.width * r); c.height = Math.round(img.height * r);
  c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
  return c.toDataURL("image/jpeg", 0.8);
}
$("photo-input").addEventListener("change", async e => {
  for (const f of e.target.files) {
    try { state.photos.push({ id: crypto.randomUUID(), name: f.name, thumb: await shrink(await readAsDataURL(f)) }); }
    catch (err) { console.error("photo", f.name, err && (err.message || err)); }
  }
  e.target.value = ""; renderPhotos($("photos"), true); refreshPrompt(); persist(true);
});
function renderPhotos(host, editable) {
  host.textContent = "";
  if (!state.photos.length) {
    const li = document.createElement("li"); li.className = "muted"; li.style.display = "block";
    li.textContent = editable ? "아직 고른 사진이 없어요." : "고른 사진이 없어요. 네이버에서 바로 사진을 넣어도 돼요.";
    host.append(li); return;
  }
  state.photos.forEach((p, i) => {
    const li = document.createElement("li");
    const no = document.createElement("span"); no.className = "no"; no.textContent = "사진" + (i + 1);
    const img = document.createElement("img"); img.src = p.thumb; img.alt = "";
    const nm = document.createElement("span"); nm.className = "nm"; nm.textContent = p.name; nm.title = p.name;
    li.append(no, img, nm);
    if (editable) {
      const ctl = document.createElement("span"); ctl.className = "ctl";
      const mk = (t, label, fn, dis) => { const b = document.createElement("button"); b.type = "button"; b.textContent = t; b.setAttribute("aria-label", label); b.disabled = dis; b.addEventListener("click", fn); return b; };
      ctl.append(
        mk("↑", "위로", () => { [state.photos[i - 1], state.photos[i]] = [state.photos[i], state.photos[i - 1]]; renderPhotos(host, true); refreshPrompt(); persist(); }, i === 0),
        mk("↓", "아래로", () => { [state.photos[i + 1], state.photos[i]] = [state.photos[i], state.photos[i + 1]]; renderPhotos(host, true); refreshPrompt(); persist(); }, i === state.photos.length - 1),
        mk("✕", "빼기", () => { state.photos.splice(i, 1); renderPhotos(host, true); refreshPrompt(); persist(); }, false)
      );
      li.append(ctl);
    }
    host.append(li);
  });
}

/* ---------- 부탁문 ---------- */
function buildPrompt() {
  const facts = state.facts.trim();
  const lines = [
    "너는 광명 하안동 '까치카페' 사장이 직접 쓰는 네이버 블로그 글을 돕는 작가야.",
    "",
    "[글 목적] " + state.purpose,
    "[오늘 쓸 주제] " + state.topic.trim()
  ];
  if (state.keyword.trim()) lines.push("[노리는 검색어] " + state.keyword.trim() + " (제목 앞쪽과 첫 문단에 한 번씩 자연스럽게 넣어 줘)");
  lines.push("", "[직접 확인한 사실]", facts || "(따로 적은 사실 없음)");
  if (state.useShop && state.shop.trim()) lines.push("", "[가게 기본 정보]", state.shop.trim());
  lines.push(
    "",
    "[조건]",
    "- 위에 적힌 사실만 써. 적혀 있지 않은 가격, 할인, 이벤트, 직접 겪은 듯한 일은 만들지 마.",
    "- 가게 주인이 손님에게 직접 말하듯 " + state.tone + " 써 줘. '매우 유용한', '특별한 경험' 같은 과한 표현은 빼.",
    "- 길이: " + (state.length === "짧게" ? "본문 600~900자" : "본문 1,200~1,800자") + ".",
    "- 소제목은 2~4개. 소제목 줄 맨 앞에 '## '를 붙여 줘.",
    state.photos.length
      ? "- 사진이 " + state.photos.length + "장 있어. 어울리는 곳에 [사진1]부터 [사진" + state.photos.length + "]까지 순서대로 한 줄씩 넣어 줘."
      : "- 사진이 들어갈 만한 곳에 [사진] 이라고 한 줄씩 표시해 줘.",
    "- 마지막 줄에 태그 5~9개를 #태그 형식으로 넣어 줘.",
    "",
    "[답변 형식] 아래 형식만 지키고 다른 말은 붙이지 마.",
    "제목: (한 줄)",
    "본문:",
    "(본문)"
  );
  return lines.join("\n");
}
function refreshPrompt() { state.prompt = buildPrompt(); $("prompt").value = state.prompt; }

/* ---------- 메시지 ---------- */
function say(id, text, kind) { const el = $(id); el.textContent = text; el.className = "msg" + (kind ? " " + kind : ""); }
async function copy(text, msgId, what) {
  if (!text.trim()) { say(msgId, what + "이 비어 있어요.", "bad"); return; }
  try { await navigator.clipboard.writeText(text); say(msgId, what + "을 복사했어요. 붙여 넣을 곳을 누르고 Ctrl+V 하세요.", "ok"); }
  catch (e) { say(msgId, "복사하지 못했어요. 칸의 글을 직접 선택해서 복사해 주세요.", "bad"); }
}
function plainBody(body) { return body.replace(/^#{1,6}\s+/gm, ""); }

/* ---------- Gemini 연결 ---------- */
function gemUI(kind, text) {
  $("gem-dot").className = "dot" + (kind ? " " + kind : "");
  $("gem-status").textContent = text;
}
async function geminiTabs() { return chrome.tabs.query({ url: "https://gemini.google.com/*" }); }
async function run(tabId, func, args) {
  const [r] = await chrome.scripting.executeScript({ target: { tabId }, func, args: args || [] });
  return r && r.result;
}
async function checkGemini(userClicked) {
  let tabs = [];
  try { tabs = await geminiTabs(); } catch (e) { gemUI("bad", "탭 목록을 읽지 못했어요."); return false; }
  const sel = $("gem-tabs");
  if (!tabs.length) {
    state.gemTabId = null; sel.hidden = true;
    gemUI("bad", "열린 Gemini 탭이 없어요. 'Gemini 열기'를 누르고 로그인한 뒤 'Gemini 연결'을 눌러 주세요.");
    persist(); return false;
  }
  sel.textContent = "";
  tabs.forEach(t => sel.append(new Option((t.title || "Gemini") + " · 탭 " + t.id, String(t.id))));
  sel.hidden = tabs.length < 2;
  if (!tabs.some(t => t.id === state.gemTabId)) {
    if (tabs.length === 1 || userClicked) state.gemTabId = Number(sel.value || tabs[0].id);
    else { gemUI("", "Gemini 탭이 " + tabs.length + "개 있어요. 연결할 탭을 고르고 'Gemini 연결'을 눌러 주세요."); return false; }
  }
  sel.value = String(state.gemTabId);
  try {
    const p = await run(state.gemTabId, gmProbe);
    if (p && p.ok) { gemUI("ok", "연결됨 · 입력창을 확인했어요."); persist(); return true; }
    const why = { login: "Gemini에 로그인이 필요해요. 그 탭에서 직접 로그인한 뒤 다시 연결해 주세요.",
      noinput: "Gemini 입력창을 찾지 못했어요. 그 탭을 새로고침하고 다시 연결해 주세요.",
      notgemini: "고른 탭이 Gemini 화면이 아니에요." }[p && p.reason] || "연결을 확인하지 못했어요.";
    gemUI("bad", why); return false;
  } catch (e) {
    gemUI("bad", "그 탭에 연결하지 못했어요. 탭을 새로고침하고 다시 연결해 주세요.");
    return false;
  }
}
$("gem-tabs").addEventListener("change", e => { state.gemTabId = Number(e.target.value); persist(); });
$("btn-gem-connect").addEventListener("click", () => { state.gemTabId = $("gem-tabs").hidden ? state.gemTabId : Number($("gem-tabs").value); checkGemini(true); });
$("btn-gem-open").addEventListener("click", () => chrome.tabs.create({ url: "https://gemini.google.com/app" }));
chrome.tabs.onRemoved.addListener(id => { if (id === state.gemTabId) { state.gemTabId = null; gemUI("bad", "연결한 Gemini 탭이 닫혔어요. 'Gemini 연결'을 다시 눌러 주세요."); persist(); } });

function parseDraft(text) {
  const t = text.replace(/\r/g, "").trim();
  const m = t.match(/제목\s*[:：]\s*(.+)\n+\s*본문\s*[:：]\s*\n?([\s\S]*)$/);
  if (m) return { title: m[1].trim().replace(/^\**|\**$/g, ""), body: m[2].trim() };
  const lines = t.split("\n");
  return { title: lines[0].replace(/^#+\s*|^제목\s*[:：]\s*/g, "").trim(), body: lines.slice(1).join("\n").trim() };
}

$("btn-generate").addEventListener("click", async () => {
  if (generating) return;
  if (!state.topic.trim()) { say("gen-msg", "1단계에서 '오늘 쓸 주제'를 먼저 적어 주세요.", "bad"); return; }
  if ((state.title.trim() || state.body.trim()) && state.title + state.body !== state.savedTitle + state.savedBody) {
    say("gen-msg", "저장하지 않은 원고가 있어요. '원고 저장'을 누르거나 글 파일로 저장한 뒤 다시 눌러 주세요.", "bad"); return;
  }
  if (!(await checkGemini(false))) { say("gen-msg", "Gemini 연결부터 확인해 주세요.", "bad"); return; }
  refreshPrompt();
  generating = true; const btn = $("btn-generate"); btn.disabled = true; btn.textContent = "원고 만드는 중…";
  gemUI("busy", "Gemini가 원고를 쓰고 있어요.");
  const done = (msg, kind) => { generating = false; btn.disabled = false; btn.textContent = "원고 만들기"; say("gen-msg", msg, kind); checkGemini(false); };
  try {
    const s = await run(state.gemTabId, gmSend, [state.prompt]);
    if (!s || !s.ok) {
      return done(s && s.reason === "busyinput"
        ? "Gemini 입력창에 이미 다른 글이 있어요. 덮어쓰지 않았어요. 입력창을 비운 뒤 다시 눌러 주세요."
        : "Gemini 입력창을 찾지 못했어요. 탭을 새로고침하고 다시 연결해 주세요.", "bad");
    }
    const start = Date.now(); let lastText = "", stable = 0;
    while (Date.now() - start < 180000) {
      await new Promise(r => setTimeout(r, 1500));
      let st;
      try { st = await run(state.gemTabId, gmStatus); } catch (e) { return done("Gemini 탭과 연결이 끊겼어요. 다시 연결해 주세요.", "bad"); }
      if (st.limited) return done("Gemini 이용 한도 안내가 나왔어요. 화면 안내에 따라 나중에 다시 시도해 주세요. 기존 원고는 그대로예요.", "bad");
      if (st.count > s.before && st.text) {
        if (!st.generating && st.text === lastText) stable++; else stable = 0;
        lastText = st.text;
        say("gen-msg", "답을 받는 중… (" + st.text.length + "자)");
        if (stable >= 2) {
          const d = parseDraft(st.text);
          state.title = d.title; state.body = d.body; $("title").value = d.title; $("body").value = d.body; persist();
          return done("원고가 들어왔어요. 사실이 맞는지 읽어 보고 '원고 저장'을 눌러 주세요.", "ok");
        }
      }
    }
    done("3분이 지나도 답이 끝나지 않았어요. Gemini 탭을 확인하고, 답이 나왔다면 직접 복사해 붙여 넣어 주세요.", "bad");
  } catch (e) {
    done("원고를 받지 못했어요: " + (e.message || e), "bad");
  }
});

/* ---------- 원고 보관 ---------- */
function dirty() { return state.title !== state.savedTitle || state.body !== state.savedBody; }
function paintSave() {
  if (dirty() && (state.title || state.body)) say("save-msg", "바뀐 내용이 있어요. '원고 저장'을 눌러 주세요.", "bad");
  else if (state.savedAt) say("save-msg", "저장했어요 · " + state.savedAt, "ok");
  else say("save-msg", "");
}
$("btn-save").addEventListener("click", () => {
  if (!state.title.trim() && !state.body.trim()) { say("save-msg", "제목이나 본문을 먼저 적어 주세요.", "bad"); return; }
  state.savedTitle = state.title; state.savedBody = state.body;
  state.savedAt = new Date().toLocaleString("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });
  persist(true); paintSave();
});
$("btn-copy-title").addEventListener("click", () => copy(state.title, "save-msg", "제목"));
$("btn-copy-body").addEventListener("click", () => copy(plainBody(state.body), "save-msg", "본문"));
$("btn-file").addEventListener("click", () => {
  if (!state.title.trim() && !state.body.trim()) { say("save-msg", "저장할 원고가 없어요.", "bad"); return; }
  const d = new Date(), ymd = d.getFullYear() + String(d.getMonth() + 1).padStart(2, "0") + String(d.getDate()).padStart(2, "0");
  const safe = (state.title || "원고").replace(/[\\/:*?"<>|]/g, "").slice(0, 40);
  const blob = new Blob(["제목: " + state.title + "\n\n" + state.body + "\n"], { type: "text/plain;charset=utf-8" });
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = ymd + "_" + safe + ".txt";
  document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  say("save-msg", "글 파일을 내려받았어요.", "ok");
});
$("btn-prompt-make").addEventListener("click", () => { refreshPrompt(); say("gen-msg", state.topic.trim() ? "부탁문을 새로 만들었어요." : "주제가 비어 있어요. 1단계에서 주제를 적어 주세요.", state.topic.trim() ? "ok" : "bad"); });
$("btn-prompt-copy").addEventListener("click", () => { refreshPrompt(); copy(state.prompt, "gen-msg", "부탁문"); });

/* ---------- 네이버 ---------- */
$("btn-naver").addEventListener("click", () => chrome.tabs.create({ url: "https://blog.naver.com/" + NAVER_BLOG_ID + "?Redirect=Write" }));
$("btn-copy-title2").addEventListener("click", () => copy(state.title, "naver-msg", "제목"));
$("btn-copy-body2").addEventListener("click", () => copy(plainBody(state.body), "naver-msg", "본문"));

/* ---------- 발행 확인 ---------- */
function paintChecks() { document.querySelectorAll("#checks input").forEach(c => { c.checked = !!state.checks[c.dataset.k]; }); }
$("checks").addEventListener("change", e => { state.checks[e.target.dataset.k] = e.target.checked; persist(); });

/* ---------- 새 글 ---------- */
$("btn-new").addEventListener("click", () => { $("confirm-new").hidden = false; });
$("btn-new-no").addEventListener("click", () => { $("confirm-new").hidden = true; });
$("btn-new-yes").addEventListener("click", () => {
  const keep = { shop: state.shop, useShop: state.useShop, tone: state.tone, length: state.length, gemTabId: state.gemTabId };
  state = Object.assign(structuredClone(DEFAULT_STATE), keep);
  $("confirm-new").hidden = true; init(true);
});

/* ---------- 시작 ---------- */
function init(fromReset) {
  ["topic", "keyword", "facts", "shop", "title", "body"].forEach(k => { $(k).value = state[k] || ""; });
  $("use-shop").checked = state.useShop;
  ["purpose", "tone", "length", "pub"].forEach(id => $(id).querySelectorAll("button").forEach(b => b.setAttribute("aria-checked", String(b.dataset.v === state[id]))));
  renderPhotos($("photos"), true); paintChecks(); refreshPrompt(); paintSave();
  say("gen-msg", ""); say("naver-msg", "");
  showStep(fromReset ? 1 : state.step);
}
(async function start() {
  await load();
  bindChips("purpose", "purpose"); bindChips("tone", "tone"); bindChips("length", "length"); bindChips("pub", "pub");
  bindText("topic", "topic", refreshPrompt); bindText("keyword", "keyword", refreshPrompt); bindText("facts", "facts", refreshPrompt);
  bindText("shop", "shop", refreshPrompt);
  bindText("title", "title", paintSave); bindText("body", "body", paintSave);
  $("use-shop").addEventListener("change", e => { state.useShop = e.target.checked; refreshPrompt(); persist(); });
  $("use-shop").addEventListener("click", e => e.stopPropagation());
  $("btn-shop-reset").addEventListener("click", () => { state.shop = SHOP_DEFAULT; $("shop").value = SHOP_DEFAULT; refreshPrompt(); persist(); });
  document.querySelectorAll(".steps button").forEach(b => b.addEventListener("click", () => showStep(Number(b.dataset.step))));
  $("btn-prev").addEventListener("click", () => showStep(state.step - 1));
  $("btn-next").addEventListener("click", () => {
    if (state.step === 1 && !state.topic.trim()) { $("topic").focus(); $("topic").placeholder = "주제를 먼저 적어 주세요. 예) 11월 제철 메뉴 홍시 라떼 소개"; return; }
    showStep(state.step === 5 ? 1 : state.step + 1);
  });
  init(false);
})();
