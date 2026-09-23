# BD CHAT BOOK - Google Play Store পাবলিশিং ও প্যাকেজিং গাইড

এই ডকুমেন্টে আপনার **BD CHAT BOOK** অ্যাপটিকে গুগল প্লে স্টোরে আপলোড করার জন্য ধাপে ধাপে নির্দেশনা দেওয়া হয়েছে।

---

## ১. অ্যাপের তথ্য (Play Store Listing Data)
- **App Name:** BD CHAT BOOK
- **Short Description (৮০ অক্ষর):** ৯-ডিজিট কোড দিয়ে রিয়েল-টাইম ও অফলাইন ফুল ডিসপ্লে মেসেজিং অ্যাপ
- **Full Description:**
  BD CHAT BOOK হলো একটি আধুনিক ও নিরাপদ যোগাযোগ মাধ্যম। 
  - ৯-ডিজিট ইউনিক কোড দিয়ে যেকোনো ডিভাইসে সরাসরি সংযোগ।
  - কল বা চ্যাট রিকোয়েস্ট এক্সেপ্টের মাধ্যমে নিরাপদ যোগাযোগ।
  - ফুল ডিসপ্লে মোডে মেসেজ, ড্রয়িং, ভয়েস নোট, ছবি ও ভিডিও আদান-প্রদান।
  - অফলাইন টেক্সট ট্রান্সফার প্রযুক্তি।
  - কোনো বিজ্ঞাপন নেই, সম্পূর্ণ দ্রুত ও নিরাপদ।
- **Category:** Communication / Social
- **Content Rating:** Everyone
- **Package ID:** `com.bdchatbook.app`

---

## ২. গুগল প্লে স্টোরের জন্য AAB (Android App Bundle) তৈরির উপায়

### পদ্ধতি ক: Bubblewrap CLI (গুগলের অফিসিয়াল টুল - সবচেয়ে সহজ)
গুগল ক্রোম টিম PWA অ্যাপকে সরাসরি প্লে স্টোর AAB ফাইলে রূপান্তর করার জন্য `Bubblewrap` তৈরি করেছে।

১. আপনার কম্পিউটারে Node.js ও Java (JDK 17) এবং Android SDK ইনস্টল থাকতে হবে।
২. টার্মিনালে রান করুন:
   ```bash
   npm install -g @bubblewrap/cli
   ```
৩. প্রজেক্ট ফোল্ডারে টার্মিনাল খুলে রান করুন:
   ```bash
   bubblewrap init --manifest=https://[YOUR-DEPLOYED-URL]/manifest.webmanifest
   ```
৪. এটি স্বয়ংক্রিয়ভাবে `twa-manifest.json` পড়বে এবং কি-স্টোর তৈরি করবে।
৫. এবার AAB ফাইল তৈরি করতে রান করুন:
   ```bash
   bubblewrap build
   ```
   এর ফলে `app-release-bundle.aab` তৈরি হবে যা সরাসরি প্লে স্টোরে আপলোডযোগ্য।

---

### পদ্ধতি খ: PWABuilder (এক ক্লিকে কোনো সফটওয়্যার ইনস্টল ছাড়া)
১. ব্রাউজারে যান: **[https://www.pwabuilder.com](https://www.pwabuilder.com)**
২. আপনার অ্যাপের পাবলিশড URL দিন (যেমন Cloud Run বা কাস্টম ডোমেইন URL)।
৩. **"Package for Stores"** বাটনে চাপ দিন।
৪. **"Google Play"** নির্বাচন করুন।
5. প্যাকেজ আইডি দিন: `com.bdchatbook.app`
৬. **"Generate"** বাটনে চাপ দিলে গুগল প্লে স্টোরের জন্য রেডিমেড `.aab` ফাইল এবং সোর্স কোড ডাউনলোড হয়ে যাবে!

---

## ৩. ডিজিটাল অ্যাসেট লিঙ্কস (Digital Asset Links) ভেরিফিকেশন
গুগল প্লে স্টোরে TWA অ্যাপ সম্পূর্ণ ফুলস্ক্রিন (ব্রাউজার বার ছাড়া) দেখানোর জন্য:
- আপনার কি-স্টোরের SHA-256 ফিঙ্গারপ্রিন্ট নিয়ে `/.well-known/assetlinks.json` ফাইলে যুক্ত করতে হয়।
- Bubblewrap বা PWABuilder স্বয়ংক্রিয়ভাবে আপনাকে এই ফাইলটি দিয়ে দেবে।

---

## ৪. প্লে কনসোলে আপলোড করার ধাপ
১. **[Google Play Console](https://play.google.com/console)** এ যান।
২. **Create App** এ ক্লিক করে নাম দিন `BD CHAT BOOK`।
৩. Store Presence (Title, Icon 512x512, Feature Graphic 1024x500, Screenshots) পূরণ করুন।
৪. **Production** বা **Internal Testing** ট্যাবে গিয়ে আপনার জেনারেট করা `.aab` ফাইলটি ড্রপ করুন।
৫. Review & Rollout করুন!
