import { Context, Command, Session, h } from 'koishi';
import axios from 'axios';
import puppeteer from 'puppeteer';
import fs from 'fs'; 
import path from 'path';
import { Canvas, createCanvas, loadImage } from 'canvas';

// 日志记录函数
function logWithTimestamp(message: string) {
  console.log(`[${new Date().toLocaleString()}] ${message}`);
}

// 天气现象映射表（全局缓存）
const weatherMap = new Map<string, string>([
  ['BR', '雾'],
  ['FG', '雾或薄雾'],
  ['HZ', '霾'],
  ['FU', '烟雾'],
  ['VA', '火山灰'],
  ['DU', '沙尘'],
  ['SA', '沙'],
  ['SS', '尘暴'],
  ['DS', '风沙'],
  ['SG', '雪粒'],
  ['IC', '冰晶'],
  ['PL', '霰'],
  ['GR', '冰雹'],
  ['GS', '小冰雹'],
  ['UP', '未知降水或降水类型'],
  ['RA', '雨'],
  ['DZ', '毛毛雨'],
  ['SN', '雪'],
  ['SQ', '飑线'],
  ['FC', '风暴'],
  ['TS', '雷暴'],
  ['MI', '微型沙尘暴'],
  ['PR', '部分地区'],
  ['BC', '局部'],
  ['DR', '吹动的尘土或雪花'],
  ['BL', '风暴'],
  ['SH', '阵性降水'],
  ['+', '大'],
  ['-', '小']
]);

// 云层覆盖映射表
const cloudCoverageMap = new Map<string, string>([
  ['FEW', '少云'],
  ['SCT', '疏云'],
  ['BKN', '多云'],
  ['OVC', '满天云'],
  ['NSC', '无显著云层'],
  ['SKC', '晴空'],
  ['CLR', '晴朗']
]);

// 天气现象解析函数
function getWeather(s: string[] | string | null): string {
  logWithTimestamp('开始解析天气现象');
  if (!s || s === '') {
    logWithTimestamp('天气现象为空，返回晴天');
    return '晴天';
  }

  if (Array.isArray(s)) {
    const result = s.map(code => weatherMap.get(code) || '未知天气现象');
    logWithTimestamp(`解析的天气现象结果: ${result.join(', ')}`);
    return result.join(', ');
  }

  logWithTimestamp(`单一天气现象: ${s}`);
  return weatherMap.get(s) || '未知天气现象';
}

// 云层类型解析函数
function getCloudCoverage(s: string): string {
  logWithTimestamp(`开始解析云层类型: ${s}`);
  return cloudCoverageMap.get(s) || s;
}

// 云层解析函数
function parseClouds(cloudData: Array<{ type: string; height: string }>): string {
  logWithTimestamp('开始解析云层信息');
  if (!cloudData || cloudData.length === 0) {
    logWithTimestamp('无特别云层，返回 NSC');
    return '无特别云层（NSC）';
  }

  const result = cloudData.map(cloud => {
    const cloudCoverage = getCloudCoverage(cloud.type);
    logWithTimestamp(`解析云层: ${cloud.type}, 高度: ${cloud.height}`);
    return `${cloudCoverage} 云层高度 ${cloud.height} 00英尺`;
  }).join('，');

  logWithTimestamp(`解析的云层信息: ${result}`);
  return result;
}

// RMK 提取函数
function extractRMK(metar: string): string {
  logWithTimestamp('开始提取 RMK 信息');
  const rmkIndex = metar.indexOf('RMK');
  if (rmkIndex !== -1) {
    const rmk = metar.slice(rmkIndex + 3).trim();
    logWithTimestamp(`提取的 RMK 信息: ${rmk}`);
    return rmk;
  }
  logWithTimestamp('未找到 RMK 信息');
  return '无 RMK 信息';
}

// 时间格式化函数
function formatMetarTime(metarReport: string): string {
  logWithTimestamp('开始时间格式化');
  const timePart = metarReport.match(/\d{6}Z/)?.[0];
  if (!timePart) {
    logWithTimestamp('METAR 时间格式无效');
    throw new Error('Invalid METAR time format');
  }

  // 解析 METAR 时间
  const day = parseInt(timePart.slice(0, 2), 10); // 当月第几天
  const hour = parseInt(timePart.slice(2, 4), 10); // 小时
  const minute = parseInt(timePart.slice(4, 6), 10); // 分钟

  // 获取当前日期
  const now = new Date();
  let currentYear = now.getUTCFullYear();
  let currentMonth = now.getUTCMonth(); // 0-11

  // 如果 METAR 时间中的日期大于当前日期，说明是上个月的数据
  if (day > now.getUTCDate()) {
    currentMonth -= 1; // 上个月
    if (currentMonth < 0) {
      currentMonth = 11; // 如果月份为负数，调整为上一年的 12 月
      currentYear -= 1; // 年份减 1
    }
  }

  // 创建 UTC 时间对象
  const utcDate = new Date(Date.UTC(currentYear, currentMonth, day, hour, minute));

  // 转换为 CST 时间（UTC+8）
  const cstDate = new Date(utcDate.getTime() - 8 * 60 * 60 * 1000);

  // 格式化时间
  const formatTime = (date: Date): string => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  // 格式化日期
  const formatDate = (date: Date): string => {
    const year = date.getUTCFullYear();
    const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
    const day = date.getUTCDate().toString().padStart(2, '0');
    return `${year}.${month}.${day}`;
  };

  logWithTimestamp('完成时间格式化');
  return `UTC ${formatTime(cstDate)} / CST  ${formatTime(utcDate)}`;
}

// 获取 METAR 数据
async function fetchMetarData(icao: string, session: Session): Promise<any> {
  logWithTimestamp(`开始获取 ICAO 为 ${icao} 的 METAR 数据`);
  try {
    const response = await axios.get(`https://api.xflysim.com/pilot/api/realTimeMap/weather/${icao}`);
    logWithTimestamp(`API 响应成功，状态码: ${response.status}`);
    
    // 验证 session 是否有效
    if (session) {
      session.send('稍等一会，小九正在获取中~');
    } else {
      logWithTimestamp('session 未定义，无法发送消息');
    }

    if (response.data.code !== 20000) {
      logWithTimestamp(`API 返回错误信息: ${response.data.message}`);
      throw new Error(response.data.message || '无法获取 METAR 数据');
    }

    logWithTimestamp('成功获取 METAR 数据');
    return response.data;
  } catch (error) {
    logWithTimestamp(`获取 METAR 数据失败: ${error instanceof Error ? error.message : error}`);
    return { code: 500, data: { metar: '无法获取 METAR 数据，请稍后再试。', icao }, message: '请求失败' };
  }
}


// 定义 MetarData 接口
interface MetarData {
  wind_dir?: string; // 风向
  wind_speed?: string; // 风速
  wind_unit?: string; // 风速单位
  visibility?: string; // 能见度
  visibility_unit?: string; // 能见度单位
  temperature?: string; // 温度
  dewpoint?: string; // 露点温度
  qnh?: string; // 气压 (QNH)
  qnh_unit?: string; // 气压单位
  weather?: string[] | null; // 天气现象
  cloud?: Array<{ type: string; height: string }>; // 云层信息
  forecast?: string; // 预报信息
  [key: string]: any; // 其他可能存在的属性
}

// 生成 HTML 内容
function generateHtmlContent(metarData: { data: MetarData }): string {
  logWithTimestamp('开始生成 HTML 内容');
  let decoded: MetarData = {};
  try {
    if (typeof metarData.data.metarDecode === 'string' && metarData.data.metarDecode.trim() !== '') {
      decoded = JSON.parse(metarData.data.metarDecode) as MetarData;
      logWithTimestamp('成功解析 metarDecode 数据');
    }
  } catch (error) {
    logWithTimestamp(`解析 metarDecode 数据失败: ${error}`);
  }

  // 转换 visibility_unit 为中文
  const visibilityUnit = decoded.visibility_unit === 'meter' ? '米' : decoded.visibility_unit === 'mile' ? '英里' : '未知';

  // 获取当前时间并格式化
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const date = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const generatedTime = `本页面由九号生成于 ${year}年${month}月${date}日${hours}时${minutes}分${seconds}秒，数据源于XFlysim Network`;

  // 构建 HTML 内容
  const htmlContent = `
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
        <div class="header">METAR 信息 - ${metarData.data.icao || '未知'}</div>
        <div class="subheader">${generatedTime}</div>
        <div class="overview">
          <div>风向<br><span class="highlight">${decoded.wind_dir || '地面静风'}°</span></div>
          <div>风速<br><span class="highlight">${decoded.wind_speed || 'N/A'} m/s</span></div>
          <div>温度<br><span class="highlight">${decoded.temperature || 'N/A'}°C</span></div>
          <div>能见度<br><span class="highlight">${decoded.visibility || 'N/A'} ${visibilityUnit}</span></div>
          <div>气压<br><span class="highlight">${decoded.qnh || 'N/A'} hPa</span></div>
        </div>
        <div class="details">
           <p><strong>时间：</strong>${  metarData.data.metar ? formatMetarTime(metarData.data.metar) : '未知'}</p>
          <p><strong>风向：</strong>${decoded.wind_dir || '未知'}°</p>
          <p><strong>风速：</strong>${decoded.wind_speed || '未知'} /${decoded.wind_unit || '未知'}</p>
          <p><strong>能见度：</strong>${decoded.visibility || '未知'} ${visibilityUnit}</p>
          <p><strong>天气现象：</strong>${getWeather(decoded.weather || [])}</p>
          <p><strong>温度：</strong>${decoded.temperature || '未知'}°C</p>
          <p><strong>露点：</strong>${decoded.dewpoint || '未知'}°C</p>
          <p><strong>气压：</strong>${decoded.qnh || '未知'}   ${decoded.qnh_unit || '未知'}</p>
          <p><strong>云层状况：</strong>${parseClouds(decoded.cloud || [])}</p>
          <p><strong>预报：</strong>${decoded.forecast || '无显著变化'}</p>
          <p><strong>Remark：</strong>${extractRMK(metarData.data.metar || '')}</p>
           <p><strong>原始METAR：</strong>${metarData.data.metar || '未知'}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  logWithTimestamp('HTML 内容生成完成');
  return htmlContent;
}

// 创建 METAR 报告截图
export async function createScreenshotFromMetarData(metarData: { data: MetarData }): Promise<string> {
  logWithTimestamp('开始生成 METAR 报告截图');

  const validData = metarData.data || {};
  const htmlData = {
    data: {
      ...validData,
      metarDecode: validData.metarDecode || JSON.stringify(validData),
      metar: validData.metar,
      icao: validData.icao
    }
  };

  const screenshotPath = path.join(__dirname, 'metar_info.jpg');
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  const htmlContent = generateHtmlContent(htmlData);
  await page.setContent(htmlContent);
  await page.setViewport({ width: 1600, height: 700 });

  await page.screenshot({ path: screenshotPath, fullPage:true  });

  await browser.close();
  logWithTimestamp('METAR 报告截图生成完成');
  return screenshotPath;
}

// 注册命令处理器
export default (ctx: Context) => {
  ctx.command('metar <icao>', '查询指定 ICAO 机场的 METAR/SPECI 天气报告')
    .alias('weather', '气象', 'metarinfo')
    .usage('使用方法：metar <ICAO代码>')
    .example('metar KSFO')
    .action(async ({ session }, icao) => {
      logWithTimestamp('开始处理 metar 命令');
      
      if (!icao) {
        logWithTimestamp('未提供 ICAO 代码');
        session.send('请提供一个有效的 ICAO 代码。');
        return;
      }

      icao = icao.toUpperCase();
      logWithTimestamp(`处理的 ICAO 代码: ${icao}`);

      // 传递 session 参数
      const metarResponse = await fetchMetarData(icao, session);

      const metarMessage = metarResponse?.data?.metar || '无法获取 METAR 数据，请稍后再试。';
      logWithTimestamp(`获取到的 METAR 信息: ${metarMessage}`);

      if (metarMessage.includes('无法获取')) {
        session.send(metarMessage);
        return;
      }

      try {
        const screenshotPath = await createScreenshotFromMetarData(metarResponse);
        session.send(h.image(fs.readFileSync(screenshotPath), 'metar_info.jpg'));
        logWithTimestamp('发送 METAR 截图成功');
      } catch (error) {
        logWithTimestamp(`生成或发送截图失败: ${error instanceof Error ? error.message : error}`);
        session.send(`生成 METAR 截图失败，请稍后再试。`);
      }
    });
};
