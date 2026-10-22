// Pestaña Exámenes: los pases de pago (Nacionalidad y Universidad).
import { ui } from "../core/i18n.js";
import { register, go } from "../core/router.js";
import { el } from "../ui/dom.js";
import { speech } from "../ui/mascot.js";
import { app, screen, setTab } from "../ui/shell.js";
import { hasPass, menuRow } from "./common.js";

function showExams() {
  setTab("exams");
  screen("main");
  app.append(el("h1", "", "🎓 " + ui("examsTitle")), speech(ui("examsIntro"), "talk"));
  const list = el("div", "menu");
  list.append(
    menuRow("🏛️", ui("passNat"), ui("passNatDesc"), () => go("nationality"), { badge: hasPass("nacionalidad") ? ui("passActive") : ui("free") + " · " + ui("locked") }),
    menuRow("🎓", ui("passUni"), ui("passUniDesc"), () => go("university"), { badge: hasPass("universidad") ? ui("passActive") : ui("free") + " · " + ui("locked") }),
  );
  app.append(list, el("p", "small-print", ui("disclaimer")));
}

register("exams", showExams);
