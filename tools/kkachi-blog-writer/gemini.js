// Gemini 웹 화면과 이어지는 부분.
// 아래 gm* 함수들은 chrome.scripting.executeScript로 Gemini 탭 안에서 실행된다.
// 그래서 함수 밖의 변수를 쓰면 안 되고, 함수 하나만으로 완결돼야 한다.
// Gemini 화면 구조가 바뀌면 여기 선택자(selector)를 고쳐야 한다.

/* 탭 안에서 실행: 입력창이 있는지 확인 */
function gmProbe() {
  const url = location.href;
  if (!/^https:\/\/gemini\.google\.com\//.test(url)) return { ok: false, reason: "notgemini" };
  const sels = [
    'rich-textarea div.ql-editor[contenteditable="true"]',
    'div.ql-editor[contenteditable="true"]',
    'div[contenteditable="true"][role="textbox"]'
  ];
  let input = null;
  for (const s of sels) { input = document.querySelector(s); if (input) break; }
  if (!input) {
    const loginBtn = [...document.querySelectorAll('a,button')].some(e => /로그인|Sign in/i.test(e.textContent || ""));
    return { ok: false, reason: loginBtn ? "login" : "noinput" };
  }
  return { ok: true, count: document.querySelectorAll("model-response").length };
}

/* 탭 안에서 실행: 지금 답을 만드는 중인지, 마지막 답이 무엇인지 */
function gmStatus() {
  const responses = document.querySelectorAll("model-response");
  const last = responses[responses.length - 1];
  let text = "";
  if (last) {
    const md = last.querySelector(".markdown, message-content, .model-response-text");
    text = ((md || last).innerText || "").trim();
  }
  const generating = !!document.querySelector(
    'button[aria-label*="Stop"], button[aria-label*="중지"], button[aria-label*="중단"], mat-icon[fonticon="stop"], .stop-icon'
  );
  const bodyText = (document.body.innerText || "").slice(-3000);
  const limited = /한도에 도달|limit reached|try again later|나중에 다시 시도/i.test(bodyText);
  return { count: responses.length, text, generating, limited };
}

/* 탭 안에서 실행: 부탁문을 넣고 보내기 */
async function gmSend(prompt) {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const sels = [
    'rich-textarea div.ql-editor[contenteditable="true"]',
    'div.ql-editor[contenteditable="true"]',
    'div[contenteditable="true"][role="textbox"]'
  ];
  let input = null;
  for (const s of sels) { input = document.querySelector(s); if (input) break; }
  if (!input) return { ok: false, reason: "noinput" };

  const existing = (input.innerText || "").trim();
  if (existing) return { ok: false, reason: "busyinput" };

  const before = document.querySelectorAll("model-response").length;
  input.focus();
  document.execCommand("selectAll", false, null);
  document.execCommand("insertText", false, prompt);
  input.dispatchEvent(new InputEvent("input", { bubbles: true }));
  await sleep(500);

  const btnSels = [
    'button.send-button',
    'button[aria-label*="Send"]',
    'button[aria-label*="보내기"]',
    'button[aria-label*="전송"]',
    'button[data-test-id="send-button"]'
  ];
  let btn = null;
  for (const s of btnSels) {
    const b = document.querySelector(s);
    if (b && !b.disabled && b.getAttribute("aria-disabled") !== "true") { btn = b; break; }
  }
  if (btn) btn.click();
  else input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", code: "Enter", keyCode: 13, bubbles: true }));
  return { ok: true, before };
}
