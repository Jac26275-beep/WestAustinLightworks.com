/* West Austin Lightworks — progressive enhancement (static host / GitHub Pages).
   No backend: the quote form composes a group text to both owners from the
   visitor's phone. The page still works without this file — the browser's
   native validation runs and the "text us both" links open a group message.
   This layer adds inline errors, the group-text compose step, a confirmation
   panel, and analytics events. */
(function () {
  "use strict";

  var ASHBY = "+17132546153";
  var GATES = "+14096567217";
  var GROUP = "sms:" + ASHBY + "," + GATES; // group text to both owners

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

  function val(id) { return (document.getElementById(id).value || "").trim(); }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!validate()) return;

    // Compose one message with the customer's details; opens a group text to
    // both owners so their reply thread includes Ashby, Gates and the customer.
    var lines = [
      "Hi Ashby & Gates — I'd like a free quote for my holiday lights.",
      "Name: " + val("f-name"),
      "Phone: " + val("f-phone"),
      "Email: " + val("f-email"),
      "Address: " + val("f-address")
    ];
    if (val("f-notes")) lines.push("Thinking: " + val("f-notes"));
    var hear = val("f-hear");
    if (hear) lines.push("Heard about you via: " + hear);

    track("quote_form_submit");
    // "?&body=" is the form that works on both iOS and Android.
    window.location.href = GROUP + "?&body=" + encodeURIComponent(lines.join("\n"));

    // Confirmation stays on the page in case they switch back to the browser.
    wrap.innerHTML =
      '<div class="form-success" role="status">' +
      '<h3>Opening a group text to Ashby &amp; Gates…</h3>' +
      '<p>Your details are already in the message — just tap <strong>Send</strong>. ' +
      'Nothing opened? Text <a href="tel:' + ASHBY + '">(713) 254-6153</a> or ' +
      '<a href="tel:' + GATES + '">(409) 656-7217</a>.</p>' +
      '</div>';
    wrap.scrollIntoView({ block: "center" });
  });

  // Prefill a friendly opener on the standalone "text us both" group links.
  document.querySelectorAll(".js-group-sms").forEach(function (a) {
    a.setAttribute("href", GROUP + "?&body=" +
      encodeURIComponent("Hi Ashby & Gates — I'd like a free quote for "));
  });
})();
