var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __export = (target, all) => {
  for (var name2 in all)
    __defProp(target, name2, { get: all[name2], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var src_exports = {};
__export(src_exports, {
  Config: () => Config,
  apply: () => apply,
  inject: () => inject,
  name: () => name,
  usage: () => usage
});
module.exports = __toCommonJS(src_exports);
var import_koishi = require("koishi");
var name = "metar-image";
var inject = ["puppeteer", "http", "i18n"];
var usage = `
获取并展示机场的 METAR 气象报告。

- 支持自定义生成图片的尺寸。
- 自动处理 METAR 数据解析和格式化。
- 使用 Puppeteer 生成美观的 METAR 报告图片。
`;
var Config = import_koishi.Schema.intersect([
  import_koishi.Schema.object({
    commandname: import_koishi.Schema.string().default("metar").description("注册的指令名称"),
    commandalias: import_koishi.Schema.string().default("气象").description("注册的指令别名")
  }).description("基础设置"),
  import_koishi.Schema.object({
    // fontPath: Schema.string().description("`请填写.ttf 字体文件的绝对路径`").default(path.join(__dirname, '../font/千图马克手写体.ttf')),
    imageMode: import_koishi.Schema.union([
      import_koishi.Schema.const("auto").description("自动截图对应大小的元素"),
      import_koishi.Schema.const("manual").description("手动指定渲染大小")
    ]).description("渲染模式选择").default("auto"),
    screenshotquality: import_koishi.Schema.number().default(80).min(30).max(100).role("slider").description("渲染质量（%）")
  }).description("渲染设置"),
  import_koishi.Schema.union([
    import_koishi.Schema.object({
      imageMode: import_koishi.Schema.const("auto")
    }),
    import_koishi.Schema.object({
      imageMode: import_koishi.Schema.const("manual").required(),
      imageWidth: import_koishi.Schema.number().default(1600).description("生成图片的宽度"),
      imageHeight: import_koishi.Schema.number().default(700).description("生成图片的高度")
    })
  ]),
  import_koishi.Schema.object({
    weatherMap: import_koishi.Schema.array(import_koishi.Schema.object({
      code: import_koishi.Schema.string().required().description("天气代码"),
      description: import_koishi.Schema.string().required().description("天气描述")
    })).role("table").default([
      { code: "BR", description: "雾" },
      { code: "FG", description: "雾或薄雾" },
      { code: "HZ", description: "霾" },
      { code: "FU", description: "烟雾" },
      { code: "VA", description: "火山灰" },
      { code: "DU", description: "沙尘" },
      { code: "SA", description: "沙" },
      { code: "SS", description: "尘暴" },
      { code: "DS", description: "风沙" },
      { code: "SG", description: "雪粒" },
      { code: "IC", description: "冰晶" },
      { code: "PL", description: "霰" },
      { code: "GR", description: "冰雹" },
      { code: "GS", description: "小冰雹" },
      { code: "UP", description: "未知降水" },
      { code: "RA", description: "雨" },
      { code: "DZ", description: "毛毛雨" },
      { code: "SN", description: "雪" },
      { code: "SQ", description: "飑线" },
      { code: "FC", description: "风暴" },
      { code: "TS", description: "雷暴" },
      { code: "MI", description: "微型沙尘暴" },
      { code: "PR", description: "部分地区" },
      { code: "BC", description: "局部" },
      { code: "DR", description: "吹动的尘土或雪花" },
      { code: "BL", description: "风暴" },
      { code: "SH", description: "阵性降水" },
      { code: "+", description: "大" },
      { code: "-", description: "小" }
    ]).description("天气现象映射表"),
    cloudCoverageMap: import_koishi.Schema.array(import_koishi.Schema.object({
      code: import_koishi.Schema.string().required().description("云层代码"),
      description: import_koishi.Schema.string().required().description("云层描述")
    })).role("table").default([
      { code: "FEW", description: "少云" },
      { code: "SCT", description: "疏云" },
      { code: "BKN", description: "多云" },
      { code: "OVC", description: "满天云" },
      { code: "NSC", description: "无显著云层" },
      { code: "SKC", description: "晴空" },
      { code: "CLR", description: "晴朗" }
    ]).description("云层覆盖映射表")
  }).description("映射表设置"),
  import_koishi.Schema.object({
    consoleinfo: import_koishi.Schema.boolean().default(false).description("日志调试模式"),
    pageautoclose: import_koishi.Schema.boolean().default(true).description("自动page.close `无关人员请勿改动`<br>关闭后，适用于有头模式的puppeteer调试。")
  }).description("开发者选项")
]);
function parseWeather(s, weatherMap) {
  if (!s) return "晴天";
  if (Array.isArray(s)) {
    return s.map((code) => weatherMap[code] || "未知天气现象").join(", ");
  }
  return weatherMap[s] || "未知天气现象";
}
__name(parseWeather, "parseWeather");
function parseCloudCoverage(s, cloudCoverageMap) {
  return cloudCoverageMap[s] || s;
}
__name(parseCloudCoverage, "parseCloudCoverage");
function parseClouds(cloudData, cloudCoverageMap) {
  if (!cloudData || cloudData.length === 0) return "无特别云层（NSC）";
  return cloudData.map((cloud) => `${parseCloudCoverage(cloud.type, cloudCoverageMap)} 云层高度 ${cloud.height} 00英尺`).join("，");
}
__name(parseClouds, "parseClouds");
function extractRMK(metar) {
  const rmkIndex = metar.indexOf("RMK");
  return rmkIndex !== -1 ? metar.slice(rmkIndex + 3).trim() : "无 RMK 信息";
}
__name(extractRMK, "extractRMK");
function formatMetarTime(metarReport) {
  const timePart = metarReport.match(/\d{6}Z/)?.[0];
  if (!timePart) throw new Error("Invalid METAR time format");
  const day = parseInt(timePart.slice(0, 2), 10);
  const hour = parseInt(timePart.slice(2, 4), 10);
  const minute = parseInt(timePart.slice(4, 6), 10);
  const now = /* @__PURE__ */ new Date();
  let currentYear = now.getUTCFullYear();
  let currentMonth = now.getUTCMonth();
  if (day > now.getUTCDate()) {
    currentMonth -= 1;
    if (currentMonth < 0) {
      currentMonth = 11;
      currentYear -= 1;
    }
  }
  const utcDate = new Date(Date.UTC(currentYear, currentMonth, day, hour, minute));
  const cstDate = new Date(utcDate.getTime() - 8 * 60 * 60 * 1e3);
  const formatTime = /* @__PURE__ */ __name((date) => `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`, "formatTime");
  return `UTC ${formatTime(cstDate)} / CST  ${formatTime(utcDate)}`;
}
__name(formatMetarTime, "formatMetarTime");
function generateHtmlContent(metarData, config) {
  const weatherMap = {};
  config.weatherMap.forEach(({ code, description }) => {
    weatherMap[code] = description;
  });
  const cloudCoverageMap = {};
  config.cloudCoverageMap.forEach(({ code, description }) => {
    cloudCoverageMap[code] = description;
  });
  let decoded = {};
  if (typeof metarData.metarDecode === "string" && metarData.metarDecode.trim() !== "") {
    try {
      decoded = JSON.parse(metarData.metarDecode);
    } catch (error) {
      console.warn(`Failed to parse metarDecode: ${error}`);
    }
  }
  const visibilityUnit = decoded.visibility_unit === "meter" ? "米" : decoded.visibility_unit === "mile" ? "英里" : "未知";
  const now = /* @__PURE__ */ new Date();
  const generatedTime = `本页面由九号生成于 ${now.getFullYear()}年${String(now.getMonth() + 1).padStart(2, "0")}月${String(now.getDate()).padStart(2, "0")}日${String(now.getHours()).padStart(2, "0")}时${String(now.getMinutes()).padStart(2, "0")}分${String(now.getSeconds()).padStart(2, "0")}秒，数据源于XFlysim Network`;
  return `
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: sans-serif; margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; height: 100vh; background-color: #f4f4f4; }
        .container { background-color: #fff; border-radius: 10px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1); padding: 20px; width: 90%; max-width: 800px; text-align: center; }
        .header { font-size: 1.5em; margin-bottom: 10px; color: #333; }
        .subheader { font-size: 0.8em; color:rgb(94, 94, 94) ; margin-bottom: 20px; }
        .overview { display: flex; flex-wrap: wrap; gap: 16px; justify-content: center; margin-bottom: 20px; }
        .overview div { flex: 1 1 calc(20% - 16px); min-width: 150px; background-color: #f9f9f9; padding: 10px; border: 1px solid #ddd; border-radius: 8px; text-align: center; }
        .highlight { font-size: 1.2em; font-weight: bold; color: #555; }
        .details { margin-top: 20px; text-align: left; }
        .details p { margin: 5px 0; font-size: 0.9em; color: #555; }
      </style>
      <title>METAR 报告</title>
    </head>
    <body>
      <div class="container">
        <div class="header">METAR 信息 - ${metarData.icao || "未知"}</div>
        <div class="subheader">${generatedTime}</div>
        <div class="overview">
          <div>风向<br><span class="highlight">${decoded.wind_dir || "地面静风"}°</span></div>
          <div>风速<br><span class="highlight">${decoded.wind_speed || "N/A"} m/s</span></div>
          <div>温度<br><span class="highlight">${decoded.temperature || "N/A"}°C</span></div>
          <div>能见度<br><span class="highlight">${decoded.visibility || "N/A"} ${visibilityUnit}</span></div>
          <div>气压<br><span class="highlight">${decoded.qnh || "N/A"} hPa</span></div>
        </div>
        <div class="details">
            <p><strong>时间：</strong>${metarData.metar ? formatMetarTime(metarData.metar) : "未知"}</p>
          <p><strong>风向：</strong>${decoded.wind_dir || "未知"}°</p>
          <p><strong>风速：</strong>${decoded.wind_speed || "未知"} /${decoded.wind_unit || "未知"}</p>
          <p><strong>能见度：</strong>${decoded.visibility || "未知"} ${visibilityUnit}</p>
          <p><strong>天气现象：</strong>${parseWeather(decoded.weather || [], weatherMap)}</p>
          <p><strong>温度：</strong>${decoded.temperature || "未知"}°C</p>
          <p><strong>露点：</strong>${decoded.dewpoint || "未知"}°C</p>
          <p><strong>气压：</strong>${decoded.qnh || "未知"}   ${decoded.qnh_unit || "未知"}</p>
          <p><strong>云层状况：</strong>${parseClouds(decoded.cloud || [], cloudCoverageMap)}</p>
          <p><strong>预报：</strong>${decoded.forecast || "无显著变化"}</p>
          <p><strong>Remark：</strong>${extractRMK(metarData.metar || "")}</p>
            <p><strong>原始METAR：</strong>${metarData.metar || "未知"}</p>
        </div>
      </div>
    </body>
    </html>
    `;
}
__name(generateHtmlContent, "generateHtmlContent");
function apply(ctx, config) {
  function loggerinfo(message, message2) {
    if (config.consoleinfo) {
      if (message2) {
        ctx.logger.info(`${message} ${message2}`);
      } else {
        ctx.logger.info(message);
      }
    }
  }
  __name(loggerinfo, "loggerinfo");
  ctx.i18n.define("zh-CN", {
    commands: {
      [config.commandname]: {
        description: "查询指定 ICAO 机场的 METAR/SPECI 天气报告",
        messages: {
          "invalid_icao": "请提供一个有效的 ICAO 代码。"
        }
      }
    }
  });
  ctx.command(`${config.commandname} <icao:string>`).alias(config.commandalias).usage("使用方法：metar <ICAO代码>").example("metar KSFO").action(async ({ session }, icao) => {
    if (!icao) {
      await session.send(session.text(".invalid_icao"));
      await session.execute(`${config.commandname} -h`);
      return;
    }
    loggerinfo(`用户 ${session.userId} 指定icao为：`, icao);
    icao = icao.toUpperCase();
    try {
      const response = await ctx.http.get(`https://api.xflysim.com/pilot/api/realTimeMap/weather/${icao}`);
      if (!response) {
        throw new Error(`HTTP error! 
 ${response}`);
      }
      const metarData = await response;
      loggerinfo(metarData);
      if (metarData.code !== 2e4) {
        throw new Error(metarData.message || "无法获取 METAR 数据");
      }
      const validData = metarData.data || {};
      const htmlData = {
        ...validData,
        metarDecode: validData.metarDecode || JSON.stringify(validData),
        // 确保 metarDecode 存在
        metar: validData.metar,
        icao: validData.icao
      };
      loggerinfo("渲染质量：", config.screenshotquality);
      const page = await ctx.puppeteer.page();
      const htmlContent = generateHtmlContent(htmlData, config);
      await page.setContent(htmlContent);
      if (config.imageMode === "manual") {
        loggerinfo(`宽度：${config.imageWidth}`, `高度：${config.imageHeight}`);
        await page.setViewport({ width: config.imageWidth, height: config.imageHeight });
      }
      let screenshot;
      if (config.imageMode === "auto") {
        const container = await page.$(".container");
        if (!container) {
          throw new Error("Could not find the .container element.");
        }
        screenshot = await container.screenshot({ type: "jpeg", quality: config.screenshotquality });
      } else {
        screenshot = await page.screenshot({ type: "jpeg", quality: config.screenshotquality });
      }
      if (page && !page.isClosed() && config.pageautoclose) {
        await page.close();
      }
      return import_koishi.h.image(screenshot, "image/jpeg");
    } catch (error) {
      ctx.logger.error(`Failed to fetch, generate or send METAR: ${error.message}`);
      if (error.stack) {
        ctx.logger.error(error.stack);
      }
      return "获取或生成 METAR 信息失败，请稍后再试。";
    }
  });
}
__name(apply, "apply");
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Config,
  apply,
  inject,
  name,
  usage
});
