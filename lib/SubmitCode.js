import fs from "fs";
import path from "path";
import https from "https";
import readline from "readline";
import { exec } from "child_process";
import { fileURLToPath } from "url";

// Constants from constants.hpp
const ARENA_SUBMIT_URL =
  "https://arena.olimpiici.com/api/competitions/%s/problem/%s/submit";
const ARENA_SUBMISSION_URL = "https://arena.olimpiici.com/#/submission/%s/view";
const ARENA_ORIGIN_URL = "https://arena.olimpiici.com";
const ARENA_CONFIG_FILENAME = "arena.env";

const PESHO_SUBMIT_URL =
  "https://pesho.org/api/user/assignments/%s/tasks/%s/submitcode";
const PESHO_SUBMISSION_URL = "https://pesho.org/assignments/%a/submissions/%s";
const PESHO_CONFIG_FILENAME = "pesho.env";

const PATH_TO_LAST_SAVE = "lastSave.txt";
const PATH_TO_CONFIG = path.join(".config", "CodeSenderData");

// Platform detection enum
const TypeOfSite = {
  PESHO: 0,
  ARENA: 1,
};

// Get config directory path
function getConfigDir() {
  const home = process.env.HOME || process.env.USERPROFILE;
  return path.join(home, PATH_TO_CONFIG);
}

// Ensure config directory exists
function ensureConfigDir() {
  const configDir = getConfigDir();
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }
}

// Get last saved filename
function GetLastFilename() {
  const configDir = getConfigDir();
  const filepath = path.join(configDir, PATH_TO_LAST_SAVE);
  if (!fs.existsSync(filepath)) return "";
  return fs.readFileSync(filepath, "utf8").trim();
}

// Save last used file
function SaveLastFile(filename) {
  ensureConfigDir();
  const configDir = getConfigDir();
  const filepath = path.join(configDir, PATH_TO_LAST_SAVE);
  const resolvedPath = path.resolve(filename);
  fs.writeFileSync(filepath, resolvedPath);
}

// Set authentication
function SetAuth(args) {
  if (args.length < 3) {
    console.log("Add what to authenticate");
    return;
  }

  ensureConfigDir();
  const configDir = getConfigDir();

  if (args[2][0] === "p") {
    if (args.length < 5) {
      console.log("Add user and pass.");
      return;
    }
    const filepath = path.join(configDir, PESHO_CONFIG_FILENAME);
    fs.writeFileSync(filepath, args[3] + "\n" + args[4] + "\n");
    console.log("Pesho credentials saved.");
  } else if (args[2][0] === "a") {
    if (args.length < 4) {
      console.log("Add Bearer token");
      return;
    }
    const filepath = path.join(configDir, ARENA_CONFIG_FILENAME);
    fs.writeFileSync(filepath, args[3] + "\n");
    console.log("Arena token saved.");
  }
}

// Get Pesho auth (username, password)
function GetPeshoAuth() {
  const configDir = getConfigDir();
  const filepath = path.join(configDir, PESHO_CONFIG_FILENAME);
  if (!fs.existsSync(filepath)) return ["", ""];
  const content = fs.readFileSync(filepath, "utf8").split("\n");
  return [content[0].trim(), content[1] ? content[1].trim() : ""];
}

// Get Arena auth (bearer token)
function GetArenaAuth() {
  const configDir = getConfigDir();
  const filepath = path.join(configDir, ARENA_CONFIG_FILENAME);
  if (!fs.existsSync(filepath)) return "";
  return fs.readFileSync(filepath, "utf8").trim();
}

// Parse URL parts
function GetParts(url) {
  // Remove protocol (https://)
  const withoutProtocol = url.replace(/^https?:\/\//, "");
  return withoutProtocol.split("/");
}

// Get params for Arena URL
function GetParamsForArena(url) {
  const parts = GetParts(url);
  // Format: arena.olimpiici.com/competitions/{competitionId}/.../problem/{problemId}
  return [parts[7], parts[9]]; // competitionId and canonicalCompetitionId
}

// Get params for Pesho URL
function GetParamsForPesho(url) {
  const parts = GetParts(url);
  // Format: pesho.org/assignments/{assignment}/tasks/{task}
  return [parts[6], parts[8]]; // assignment and task
}

// Extract code info from file
function GetCodeFromFile(filename) {
  if (!fs.existsSync(filename)) {
    console.error("Error opening the file");
    return null;
  }

  const content = fs.readFileSync(filename, "utf8");
  const lines = content.split("\n");
  const firstLine = lines[0];
  const code = lines.slice(1).join("\n");

  const out = {
    code: code,
    type: null,
    first: "",
    second: "",
  };

  if (firstLine.includes(ARENA_ORIGIN_URL)) {
    const [compId, probId] = GetParamsForArena(firstLine);
    out.first = compId;
    out.second = probId;
    out.type = TypeOfSite.ARENA;
  } else {
    const [assignment, task] = GetParamsForPesho(firstLine);
    out.first = assignment;
    out.second = task;
    out.type = TypeOfSite.PESHO;
  }

  return out;
}

// Extract ID from Arena response (JSON)
function GetIDFromString(s) {
  // Response: {"id":12345,...}
  try {
    const data = JSON.parse(s);
    return String(data.id);
  } catch (e) {
    // Fallback to string parsing
    const end = s.indexOf(",");
    let str = end !== -1 ? s.substring(0, end) : s;
    const start = str.lastIndexOf(":") + 1;
    str = str.substring(start).replace(/[{}]/g, "").trim();
    console.log(str);
    return str;
  }
}

// Extract ID from Pesho response (plain text)
function GetIDFromString2(s) {
  // Response: "Submitted. 12345"
  const end = s.lastIndexOf("\n");
  let str = end !== -1 ? s.substring(0, end) : s;
  const start = str.lastIndexOf(" ") + 1;
  str = str.substring(start).trim();
  console.log(str);
  return str;
}

// Format URL with submission ID
function URLFromID(id, startUrl) {
  return startUrl.replace("%s", id);
}

// Open URL in browser
function OpenURLInBrowser(url) {
  console.log(`Opening ${url}`);
  const platform = process.platform;
  let command;

  if (platform === "linux") {
    command = "xdg-open";
  } else if (platform === "darwin") {
    command = "open";
  } else if (platform === "win32") {
    command = "start";
  } else {
    console.log("Can't open browser in this OS.");
    return;
  }

  exec(`${command} "${url}"`, (err) => {
    if (err) console.error("Error opening browser:", err.message);
  });
}

// Make HTTPS POST request
function httpsPost(url, options = {}) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const postData = options.body || "";

    const requestOptions = {
      hostname: parsedUrl.hostname,
      port: 443,
      path: parsedUrl.pathname + parsedUrl.search,
      method: "POST",
      headers: {
        "Content-Type": "text/plain",
        "Content-Length": Buffer.byteLength(postData),
        ...options.headers,
      },
    };

    const req = https.request(requestOptions, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => resolve(data));
    });

    req.on("error", reject);
    if (postData) req.write(postData);
    req.end();
  });
}

// Send code to Arena
async function SendCodeToArena(
  competitionId,
  canonicalCompetitionId,
  code,
  bearerToken,
) {
  const url = ARENA_SUBMIT_URL.replace("%s", competitionId).replace(
    "%s",
    canonicalCompetitionId,
  );
  console.log(`POST ${url}`);

  try {
    const response = await httpsPost(url, {
      body: code,
      headers: {
        Authorization: `Bearer ${bearerToken}`,
        "Content-Type": "text/plain",
      },
    });
    console.log(`RESPONSE: ${response}`);
    return response;
  } catch (error) {
    console.error("Error:", error.message);
    return "";
  }
}

// Send code to Pesho
async function SendCodeToPesho(assignment, task, code) {
  const url = PESHO_SUBMIT_URL.replace("%s", assignment).replace("%s", task);
  console.log(`POST ${url}`);

  const [username, password] = GetPeshoAuth();
  const auth = Buffer.from(`${username}:${password}`).toString("base64");

  try {
    const response = await httpsPost(url, {
      body: `code=${encodeURIComponent(code)}`,
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
    console.log(`RESPONSE: ${response}`);
    return response;
  } catch (error) {
    console.error("Error:", error.message);
    return "";
  }
}

// Main submission logic
export async function SubmitCode(filename) {
  if (!filename) {
    console.log("No file specified. Usage: node sender.js <filename>");
    return;
  }

  const code = GetCodeFromFile(filename);
  if (!code) return;

  console.log(`param1:${code.first};param2:${code.second}`);

  if (code.type === TypeOfSite.ARENA) {
    const response = await SendCodeToArena(
      code.first,
      code.second,
      code.code,
      GetArenaAuth(),
    );
    if (response) {
      if (response.indexOf("error") != -1) {
        console.log("error");
        return;
      }
      const id = GetIDFromString(response);
      const url = ARENA_SUBMISSION_URL.replace("%s", id).replace(
        "%a",
        code.first,
      );
      OpenURLInBrowser(url);
    }
  } else if (code.type === TypeOfSite.PESHO) {
    const response = await SendCodeToPesho(code.first, code.second, code.code);
    if (response) {
      if (response.indexOf("error") != -1) {
        console.log("error");
        return;
      }
      const id = GetIDFromString2(response);
      const url = PESHO_SUBMISSION_URL.replace("%s", id).replace(
        "%a",
        code.first,
      );
      OpenURLInBrowser(url);
    }
  }
}
