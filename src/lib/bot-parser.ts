// Bot message parser - converts custom tags to structured data
// Ported from v1 chat-produccion.html to TypeScript

export interface MenuItem {
  icon: string;
  label: string;
  action: string;
}

export interface StatItem {
  icon: string;
  label: string;
  value: string;
  trend: string | null;
  color: string;
}

export interface AlertItem {
  type: "critical" | "warning" | "normal";
  content: string;
}

export interface ProductItem {
  [key: string]: string;
}

export interface ProgressData {
  value: number;
  max: number;
  color: string;
}

export interface InfoBoxData {
  type: "tip" | "warning" | "error";
  content: string;
}

export interface ParsedBotMessage {
  text: string;
  menu: MenuItem[] | null;
  submenu: { title: string; items: MenuItem[] } | null;
  buttons: MenuItem[];
  stats: StatItem[];
  alerts: AlertItem[];
  products: ProductItem[];
  progress: ProgressData | null;
  infoBox: InfoBoxData | null;
}

function parseItems(raw: string): MenuItem[] {
  return raw
    .trim()
    .split("\n")
    .filter((line) => line.includes("|"))
    .map((line) => {
      const parts = line.split("|").map((s) => s.trim());
      return {
        icon: parts[0],
        label: parts[1],
        action: parts[2] || parts[1].toLowerCase().replace(/\s+/g, "_"),
      };
    });
}

function parseStats(raw: string): StatItem[] {
  const colors = ["emerald", "blue", "orange", "purple", "red", "teal"];
  return raw
    .trim()
    .split("\n")
    .filter((line) => line.includes("|"))
    .map((line, index) => {
      const parts = line.split("|").map((s) => s.trim());
      return {
        icon: parts[0],
        label: parts[1],
        value: parts[2],
        trend: parts[3] || null,
        color: colors[index % colors.length],
      };
    });
}

function parseProduct(raw: string): ProductItem {
  const product: ProductItem = {};
  raw
    .trim()
    .split("\n")
    .forEach((line) => {
      const colonIndex = line.indexOf(":");
      if (colonIndex > -1) {
        const key = line
          .substring(0, colonIndex)
          .trim()
          .toLowerCase()
          .replace(/\s+/g, "_");
        const value = line.substring(colonIndex + 1).trim();
        product[key] = value;
      }
    });
  return product;
}

export function parseBotMessage(rawMessage: string): ParsedBotMessage {
  const result: ParsedBotMessage = {
    text: "",
    menu: null,
    submenu: null,
    buttons: [],
    stats: [],
    alerts: [],
    products: [],
    progress: null,
    infoBox: null,
  };

  let text = rawMessage;

  // Extract MENU [menu]...[/menu]
  const menuMatch = text.match(/\[menu\]([\s\S]*?)\[\/menu\]/);
  if (menuMatch) {
    result.menu = parseItems(menuMatch[1]);
    text = text.replace(menuMatch[0], "");
  }

  // Extract SUBMENU [submenu]...[/submenu]
  const submenuMatch = text.match(
    /\[submenu(?::([^\]]+))?\]([\s\S]*?)\[\/submenu\]/
  );
  if (submenuMatch) {
    result.submenu = {
      title: submenuMatch[1] || "Categorías",
      items: parseItems(submenuMatch[2]),
    };
    text = text.replace(submenuMatch[0], "");
  }

  // Extract BUTTONS [buttons]...[/buttons]
  const buttonsMatch = text.match(/\[buttons\]([\s\S]*?)\[\/buttons\]/);
  if (buttonsMatch) {
    result.buttons = parseItems(buttonsMatch[1]);
    text = text.replace(buttonsMatch[0], "");
  }

  // Extract STATS [stats]...[/stats]
  const statsMatch = text.match(/\[stats\]([\s\S]*?)\[\/stats\]/);
  if (statsMatch) {
    result.stats = parseStats(statsMatch[1]);
    text = text.replace(statsMatch[0], "");
  }

  // Extract ALERTS [alert:type]...[/alert]
  const alertRegex =
    /\[alert:(critical|warning|normal)\]([\s\S]*?)\[\/alert\]/g;
  let alertMatch;
  while ((alertMatch = alertRegex.exec(rawMessage)) !== null) {
    result.alerts.push({
      type: alertMatch[1] as "critical" | "warning" | "normal",
      content: alertMatch[2].trim(),
    });
  }
  text = text.replace(
    /\[alert:(critical|warning|normal)\][\s\S]*?\[\/alert\]/g,
    ""
  );

  // Extract PRODUCT [product]...[/product]
  const productRegex = /\[product\]([\s\S]*?)\[\/product\]/g;
  let productMatch;
  while ((productMatch = productRegex.exec(rawMessage)) !== null) {
    result.products.push(parseProduct(productMatch[1]));
  }
  text = text.replace(/\[product\][\s\S]*?\[\/product\]/g, "");

  // Extract PROGRESS [progress:value:max:color]
  const progressMatch = text.match(/\[progress:(\d+):(\d+):(\w+)\]/);
  if (progressMatch) {
    result.progress = {
      value: parseInt(progressMatch[1]),
      max: parseInt(progressMatch[2]),
      color: progressMatch[3],
    };
    text = text.replace(progressMatch[0], "");
  }

  // Extract INFO [info:type]...[/info]
  const infoMatch = text.match(
    /\[info:(tip|warning|error)\]([\s\S]*?)\[\/info\]/
  );
  if (infoMatch) {
    result.infoBox = {
      type: infoMatch[1] as "tip" | "warning" | "error",
      content: infoMatch[2].trim(),
    };
    text = text.replace(infoMatch[0], "");
  }

  // Clean text
  result.text = text.trim().replace(/\n{3,}/g, "\n\n");

  return result;
}
