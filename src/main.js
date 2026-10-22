// Arranque de la app.
// Overpass: letra basada en la de las señales de carretera (Highway Gothic), con alfabeto cirílico (licencia OFL).
import "@fontsource/overpass/latin-400.css";
import "@fontsource/overpass/latin-700.css";
import "@fontsource/overpass/latin-ext-400.css";
import "@fontsource/overpass/latin-ext-700.css";
import "@fontsource/overpass/cyrillic-400.css";
import "@fontsource/overpass/cyrillic-700.css";
import "./styles/main.css";

import { I18N } from "./core/i18n.js";
import { save } from "./core/state.js";
import { go } from "./core/router.js";
import { preloadVoice } from "./core/audio.js";
// Cada módulo registra sus pantallas.
import "./screens/onboarding.js";
import "./learn/path.js";
import "./learn/review.js";
import "./learn/practice.js";
import "./exams/hub.js";
import "./exams/nationality.js";
import "./exams/tramite.js";
import "./exams/ccse.js";
import "./exams/dele.js";
import "./exams/university.js";
import "./exams/uni-route.js";
import "./exams/pce.js";
import "./exams/driving.js";

if (save.native && !I18N[save.native]) save.native = "";
if (window.speechSynthesis) speechSynthesis.getVoices();
preloadVoice();
go("home");
