// 신청서 전송
// Google Apps Script 웹앱 주소를 배포한 뒤 아래 ENDPOINT에 넣습니다. (apps-script/README.md 참고)
const ENDPOINT = "";

(function () {
  const form = document.getElementById("apply-form");
  if (!form) return;
  const status = document.getElementById("form-status");
  const button = form.querySelector('button[type="submit"]');

  const messages = {
    name: "이름을 적어주세요.",
    phone: "연락받을 전화번호를 적어주세요.",
    email: "이메일 주소를 확인해 주세요.",
    age: "나이대를 선택해 주세요.",
    career: "연차를 선택해 주세요.",
    concern: "지금 가장 큰 고민을 한두 줄 적어주세요.",
    mode: "희망 방식을 선택해 주세요.",
    callTime: "통화 가능한 시간대를 적어주세요.",
    consent: "개인정보 수집과 이용에 동의해 주셔야 신청할 수 있습니다."
  };

  function setStatus(text, type) {
    status.textContent = text;
    status.className = "form-status" + (type ? " is-" + type : "");
  }

  function firstInvalid() {
    form.querySelectorAll(".has-error").forEach(el => el.classList.remove("has-error"));
    for (const el of form.elements) {
      if (!el.name || !el.required) continue;
      if (el.type === "radio") {
        const group = form.querySelectorAll(`input[name="${el.name}"]`);
        if (![...group].some(r => r.checked)) return el;
        continue;
      }
      if (!el.checkValidity()) return el;
    }
    return null;
  }

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    const bad = firstInvalid();
    if (bad) {
      const field = bad.closest(".field");
      if (field) field.classList.add("has-error");
      setStatus(messages[bad.name] || "빠진 항목을 확인해 주세요.", "error");
      bad.focus();
      return;
    }
    if (form.website.value) return; // 스팸 방지용 숨은 칸

    if (!ENDPOINT) {
      setStatus("신청 접수를 준비하고 있습니다. 곧 열겠습니다.", "error");
      return;
    }

    const data = new URLSearchParams();
    for (const [k, v] of new FormData(form)) if (k !== "website") data.append(k, v);
    data.append("page", location.href);

    button.disabled = true;
    button.textContent = "보내는 중입니다";
    setStatus("");
    try {
      await fetch(ENDPOINT, { method: "POST", mode: "no-cors", body: data });
      form.reset();
      setStatus("신청서를 받았습니다. 확인 후 적어주신 연락처로 직접 연락드리겠습니다.", "ok");
    } catch (err) {
      setStatus("신청서를 보내지 못했습니다. 인터넷 연결을 확인하고 다시 보내주세요.", "error");
    } finally {
      button.disabled = false;
      button.textContent = "신청서 보내기";
    }
  });
})();
