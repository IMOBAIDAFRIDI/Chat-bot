# 📱 Afridi-GPT Pro — Standalone React Native & Expo Mobile App

An ultra-fast, native React Native mobile application for Android & iOS powered by **Google Gemini Multimodal Vision** and **Render Live Backend**.

---

### 🚀 Features Included:

- **🖼️ Camera & Photo Picker Multimodal Vision**: Snap a photo or select an image from your phone gallery to analyze.
- **🎙️ Speech-to-Text & Text-To-Speech**: Read AI responses aloud natively on your phone speaker.
- **🎭 AI Personas Selector**: Switch between *Software Engineer*, *Web Researcher*, *UI Designer*, and *Math Reasoner*.
- **⚡ Real-time SSE Streaming**: Ultra-fast responses connected directly to `https://ai-chatbot-backend-ea2h.onrender.com/api`.

---

### 🛠️ How to Run & Build:

#### 1. Install Dependencies
```bash
cd mobile-app
npm install
```

#### 2. Start Expo Mobile Development Server
```bash
npx expo start
```
- Download the **Expo Go** app from Google Play Store or Apple App Store.
- Scan the QR code displayed in your terminal to instantly run Afridi-GPT Pro on your phone!

#### 3. Build Standalone Android `.apk` File
```bash
npm run build:apk
```
Or run Expo Application Services (EAS):
```bash
npx eas-cli build --platform android --profile preview
```
This generates a direct download link for your **`Afridi-GPT-Pro.apk`** file to install on any Android phone!
