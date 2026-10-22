// Arranque de la app.
import "@fontsource/lexend/latin-400.css";
import "@fontsource/lexend/latin-500.css";
import "@fontsource/lexend/latin-600.css";
import "@fontsource/lexend/latin-ext-400.css";
import "@fontsource/lexend/latin-ext-600.css";
import "@fontsource/fredoka/latin-500.css";
import "@fontsource/fredoka/latin-600.css";
import "@fontsource/fredoka/latin-700.css";
import "./styles/main.css";

import { I18N } from "./core/i18n.js";
import { save } from "./core/state.js";
import { go } from "./core/router.js";
// Cada módulo registra sus pantallas.
import "./screens/onboarding.js";
import "./learn/path.js";
import "./learn/review.js";

if (save.native && !I18N[save.native]) save.native = "";
if (window.speechSynthesis) speechSynthesis.getVoices();
go("home");
