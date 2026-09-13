/**
 * F-043R visual verify — assignment 23 / class 22
 */
const fs = require("fs");
const path = require("path");

const TOKEN = process.env.TEACHER_TOKEN;
const OUT = "/Users/hatemgazzar/Desktop/desk top/work/aboutabl/abutabl-admin/tmp-s8-preview/f043r4-quiz-23-verify.png";
const OUT_ASSETS = "/Users/hatemgazzar/.cursor/projects/Users-hatemgazzar-Desktop-desk-top-work-aboutabl/assets/f043r4-quiz-23-verify.png";
const TEXT_OUT = "/Users/hatemgazzar/Desktop/desk top/work/aboutabl/abutabl-admin/tmp-s8-preview/f043r4-page-text.txt";

async function main() {
  const puppeteer = require("puppeteer-core");
  const browser = await puppeteer.launch({
    executablePath:
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    headless: "new",
    args: ["--no-sandbox", "--window-size=1440,1100"],
    defaultViewport: { width: 1440, height: 1100 },
  });

  const page = await browser.newPage();

  // Seed auth before any navigation
  await page.goto("http://127.0.0.1:3000/", { waitUntil: "domcontentloaded" });
  await page.evaluate((payload) => {
    const { token, user } = payload;
    document.cookie = `token_=${token}; path=/; max-age=86400`;
    document.cookie = `abotable_id=${user.id}; path=/; max-age=86400`;
    localStorage.setItem("aboutabl_login_user", JSON.stringify(user));
    localStorage.setItem("user", JSON.stringify(user));
  }, {
    token: TOKEN,
    user: {
      id: 179,
      name: "Teacher Dev",
      type: "teacher",
      email: "teacher@test.com",
    },
  });

  await page.setCookie(
    { name: "token_", value: TOKEN, domain: "127.0.0.1", path: "/" },
    { name: "abotable_id", value: "179", domain: "127.0.0.1", path: "/" }
  );

  const url = "http://127.0.0.1:3000/teacher/classes/22/assignments/23";
  await page.goto(url, { waitUntil: "networkidle2", timeout: 90000 });
  await new Promise((r) => setTimeout(r, 6000));

  // Scroll to table area
  await page.evaluate(() => window.scrollTo(0, 400));
  await new Promise((r) => setTimeout(r, 1000));

  const bodyText = await page.evaluate(() => document.body.innerText);
  fs.writeFileSync(TEXT_OUT, `URL=${page.url()}\n\n${bodyText}`);

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  await page.screenshot({ path: OUT, fullPage: true });
  fs.copyFileSync(OUT, OUT_ASSETS);

  console.log("SCREENSHOT=" + OUT);
  console.log("URL=" + page.url());
  console.log("HAS_AVERAGE_SCORE=" + /Average Score/i.test(bodyText));
  console.log("HAS_COMPLETION_RATE=" + /Completion Rate/i.test(bodyText));
  console.log("HAS_SCORE_HEADER=" + /\bSCORE\b/.test(bodyText));
  console.log("HAS_87_5=" + /87(\.5)?%?/.test(bodyText));
  console.log("HAS_QUIZE11=" + /quize11/i.test(bodyText));

  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
