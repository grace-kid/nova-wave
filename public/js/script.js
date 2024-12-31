console.log("start");

// JavaScript to remove the loading screen after the page loads
window.addEventListener("load", function () {
  document.getElementById("loading-screen").style.display = "none";
  document.getElementById("main-content").classList.remove("hidden");
});

function copyReferralLink() {
  const referralLink = document.getElementById("referralLink");
  referralLink.select();
  referralLink.setSelectionRange(0, 99999);
  navigator.clipboard.writeText(referralLink.value);
  alert("Referral link copied: " + referralLink.value);
}

function copyAddress() {
  const copyAddress = document.getElementById("address");
  copyAddress.select();
  copyAddress.setSelectionRange(0, 99999);
  navigator.clipboard.writeText(copyAddress.value);
  alert("Address link copied: " + copyAddress.value);
}

function shareLinkButton() {
  const referralLink = document.getElementById("referralLink").value;
  const domain = window.location.hostname;
  const part = "/signup?referral_code=";
  const link = `  ${part}${referralLink}`;
  if (navigator.share) {
    try {
      navigator.share({
        title: "Join NOVAWAVE the best investment platform!",
        text: "Sign up using my referral link and earn a bonus!",
        url: link,
      });
      console.log("Referral link shared successfully!");
    } catch (error) {
      console.error("Error sharing the referral link:", error);
    }
  } else {
    console.log("Web Share API is not supported in this browser.");
  }
}
// Function to initialize Google Translate

// Function to initialize Google Translate
function googleTranslateElementInit() {
  new google.translate.TranslateElement(
    {
      pageLanguage: "en", // Set default language for your website
      includedLanguages: "en,fr,es,de,zh,ar,hi,pt,ru,ja,ko,it,nl", // Add more languages if needed
      layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
      autoDisplay: false, // Prevent the automatic display of Google Translate bar
    },
    "google_translate_element"
  );
}

// Fetch user location using ipinfo.io with your token
fetch("https://ipinfo.io?token=83999d9e50a879")
  .then((response) => response.json())
  .then((data) => {
    const userCountry = data.country; // Get user country code
    let language = "en"; // Default language

    // Map country codes to languages using a switch statement
    switch (userCountry) {
      case "FR":
        language = "fr"; // France -> French
        break;
      case "ES":
        language = "es"; // Spain -> Spanish
        break;
      case "DE":
        language = "de"; // Germany -> German
        break;
      case "CN":
        language = "zh"; // China -> Chinese
        break;
      case "AR":
        language = "ar"; // Arabic-speaking countries
        break;
      case "IN":
        language = "hi"; // India -> Hindi
        break;
      case "BR":
        language = "pt"; // Brazil -> Portuguese
        break;
      case "RU":
        language = "ru"; // Russia -> Russian
        break;
      case "JP":
        language = "ja"; // Japan -> Japanese
        break;
      case "KR":
        language = "ko"; // Korea -> Korean
        break;
      case "IT":
        language = "it"; // Italy -> Italian
        break;
      case "NL":
        language = "nl"; // Netherlands -> Dutch
        break;
      default:
        language = "en"; // Default to English if country is not in the list
    }

    // Load the Google Translate API script only after detecting the location
    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src =
      "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    document.head.appendChild(script);

    // After the Google Translate widget is initialized, auto-select the language
    script.onload = function () {
      setTimeout(function () {
        const googleTranslateFrame = document.querySelector(".goog-te-combo");
        if (googleTranslateFrame) {
          googleTranslateFrame.value = language; // Set the detected language
          googleTranslateFrame.dispatchEvent(new Event("change")); // Trigger the language change
        }
      }, 500); // Delay to ensure the widget is loaded
    };
  })
  .catch((error) => {
    console.error("Geolocation error:", error);
  });

// Function to clear sessionStorage, localStorage, and cookies
function clearClientSideData() {
  // Clear sessionStorage (session data for the current session)
  sessionStorage.clear();

  // Clear localStorage (persistent data across sessions)
  localStorage.clear();

  // Clear cookies
  clearCookies();

  // Redirect user to the index page after clearing data
  window.location.href = "/logout"; // Redirect to the index page after logout
}

// Function to delete all cookies
function clearCookies() {
  var cookies = document.cookie.split(";");

  // Loop through the cookies and delete each one
  for (var i = 0; i < cookies.length; i++) {
    var cookie = cookies[i];
    var equalsPos = cookie.indexOf("=");
    var name = equalsPos > -1 ? cookie.substr(0, equalsPos) : cookie;
    // Set cookie expiration date to the past to delete it
    document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/";
  }
}
