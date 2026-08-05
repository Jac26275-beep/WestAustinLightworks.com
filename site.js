/* West Austin Lightworks — progressive enhancement.
   The site works fully without this file: the Netlify form posts normally and
   the browser's native validation runs. This layer adds inline errors, an
   on-page success panel (no redirect), and analytics events. */
(function () {
  "use strict";

  function track(name, props) {
    if (typeof window.plausible === "function") window.plausible(name, props ? { props: props } : undefined);
  }

  /* ---- Analytics: phone / text / gallery-depth ---- */
  document.querySelectorAll('a[href^="tel:"]').forEach(function (a) {
    a.addEventListener("click", function () { track("phone_call_click"); });
  });
  document.querySelectorAll('a[href^="sms:"]').forEach(function (a) {
    a.addEventListener("click", function () { track("text_click"); });
  });
  var work = document.getElementById("work");
  if (work && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.intersectionRatio >= 0.5) { track("gallery_scroll_50"); io.disconnect(); }
      });
    }, { threshold: [0.5] });
    io.observe(work);
  }

  /* ---- Quote form: inline validation + on-page success ---- */
  var form = document.getElementById("quote-form");
  if (!form) return;
  form.setAttribute("novalidate", "novalidate");

  var wrap = document.getElementById("quote-form-wrap");
  var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  var rules = [
    { id: "f-name",    test: function (v) { return v.trim().length > 0; },              msg: "Please enter your name." },
    { id: "f-phone",   test: function (v) { return v.replace(/\D/g, "").length >= 10; }, msg: "Please enter a phone number we can reach you at." },
    { id: "f-email",   test: function (v) { return emailRe.test(v.trim()); },            msg: "Please enter a valid email address." },
    { id: "f-address", test: function (v) { return v.trim().length > 0; },              msg: "Please enter your property address." }
  ];

  function setError(id, msg) {
    var field = document.getElementById(id).closest(".field");
    var out = document.querySelector('.field-error[data-for="' + id + '"]');
    if (msg) {
      if (field) field.classList.add("invalid");
      if (out) out.textContent = msg;
    } else {
      if (field) field.classList.remove("invalid");
      if (out) out.textContent = "";
    }
  }

  function validate() {
    var ok = true, firstBad = null;
    rules.forEach(function (r) {
      var el = document.getElementById(r.id);
      if (!r.test(el.value)) { setError(r.id, r.msg); ok = false; firstBad = firstBad || el; }
      else setError(r.id, "");
    });
    var consent = document.getElementById("f-consent");
    if (!consent.checked) {
      setError("f-consent", "Please check the box so we can text you back.");
      ok = false; firstBad = firstBad || consent;
    } else setError("f-consent", "");
    if (firstBad) firstBad.focus();
    return ok;
  }

  // Clear a field's error as the user fixes it.
  form.addEventListener("input", function (e) {
    if (e.target.id) setError(e.target.id, "");
  });

  form.addEventListener("submit", function (e) {
    if (!validate()) { e.preventDefault(); return; }
    e.preventDefault();
    var body = new URLSearchParams(new FormData(form)).toString();
    var btn = form.querySelector('button[type="submit"]');
    if (btn) { btn.disabled = true; btn.textContent = "Sending…"; }
    fetch("/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body
    }).then(function () {
      track("quote_form_submit");
      wrap.innerHTML =
        '<div class="form-success" role="status">' +
        '<h3>Got it — we’ll text you back within 2 hours.</h3>' +
        '<p>Usually sooner. Keep an eye out for a message from our West Austin number.</p>' +
        '</div>';
      wrap.scrollIntoView({ block: "center" });
    }).catch(function () {
      // Network failed — fall back to a normal (redirecting) Netlify submit.
      form.submit();
    });
  });
})();
