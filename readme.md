# koishi-plugin-meter-image

[![npm](https://img.shields.io/npm/v/koishi-plugin-meter-image?style=flat-square)](https://www.npmjs.com/package/koishi-plugin-meter-image)

[![npm](https://img.shields.io/npm/dm/koishi-plugin-metar-image.svg)](https://www.npmjs.com/package/koishi-plugin-metar-image)

这是一个 Koishi 插件，用于获取并以图片形式展示机场的 METAR 气象报告。

利用 Puppeteer 生成美观、易读的 METAR 报告图片。

## 特性

- **获取 METAR 数据**：从指定的 API 获取机场的 METAR 气象报告。
- **自定义图片尺寸**：支持自定义生成图片的尺寸。
- **自动数据解析**：自动处理 METAR 数据解析和格式化。
- **美观的图片输出**：使用 Puppeteer 生成美观的 METAR 报告图片。
- **高度可配置**：通过配置项自定义天气现象和云层覆盖的描述。
- **两种渲染模式**：自动模式（截取特定元素）和手动模式（指定渲染大小）。



## 配置项

| 配置项              | 类型                                         | 默认值       | 说明                                                                                             |
| ------------------- | -------------------------------------------- | ------------ | ------------------------------------------------------------------------------------------------ |
| `commandname`       | `string`                                     | `"metar"`    | 注册的指令名称。                                                                                 |
| `commandalias`      | `string`                                     | `"气象"`     | 注册的指令别名。                                                                                 |
| `imageMode`         | `'auto' \| 'manual'`                         | `'auto'`     | 渲染模式选择。`auto` 自动截图对应大小的元素，`manual` 手动指定渲染大小。                         |
| `screenshotquality` | `number`                                     | `80`         | 渲染质量（%），范围 30-100。                                                                     |
| `imageWidth`        | `number`                                     | `1600`       | （仅当 `imageMode` 为 `manual` 时）生成图片的宽度。                                              |
| `imageHeight`       | `number`                                     | `700`        | （仅当 `imageMode` 为 `manual` 时）生成图片的高度。                                              |
| `weatherMap`        | `Array<{code: string, description: string}>` | 见下方默认值 | 天气现象映射表。                                                                                 |
| `cloudCoverageMap`  | `Array<{code: string, description: string}>` | 见下方默认值 | 云层覆盖映射表。                                                                                 |
| `consoleinfo`       | `boolean`                                    | `false`      | 开发者选项，启用日志调试模式。                                                                   |
| `pageautoclose`     | `boolean`                                    | `true`       | 开发者选项，自动关闭 Puppeteer 页面。关闭后，适用于有头模式的 Puppeteer 调试。无关人员请勿改动。 |
