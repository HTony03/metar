import { Context, Schema } from 'koishi';
export declare const name = "metar-image";
export declare const inject: string[];
export declare const usage = "\n\u83B7\u53D6\u5E76\u5C55\u793A\u673A\u573A\u7684 METAR \u6C14\u8C61\u62A5\u544A\u3002\n\n- \u652F\u6301\u81EA\u5B9A\u4E49\u751F\u6210\u56FE\u7247\u7684\u5C3A\u5BF8\u3002\n- \u81EA\u52A8\u5904\u7406 METAR \u6570\u636E\u89E3\u6790\u548C\u683C\u5F0F\u5316\u3002\n- \u4F7F\u7528 Puppeteer \u751F\u6210\u7F8E\u89C2\u7684 METAR \u62A5\u544A\u56FE\u7247\u3002\n";
interface MapEntry {
    code: string;
    description: string;
}
export declare const Config: Schema<Schemastery.ObjectS<{
    commandname: Schema<string, string>;
    commandalias: Schema<string, string>;
}> | Schemastery.ObjectS<{
    imageMode: Schema<"auto" | "manual", "auto" | "manual">;
    screenshotquality: Schema<number, number>;
}> | Schemastery.ObjectS<{
    weatherMap: Schema<Schemastery.ObjectS<{
        code: Schema<string, string>;
        description: Schema<string, string>;
    }>[], Schemastery.ObjectT<{
        code: Schema<string, string>;
        description: Schema<string, string>;
    }>[]>;
    cloudCoverageMap: Schema<Schemastery.ObjectS<{
        code: Schema<string, string>;
        description: Schema<string, string>;
    }>[], Schemastery.ObjectT<{
        code: Schema<string, string>;
        description: Schema<string, string>;
    }>[]>;
}> | Schemastery.ObjectS<{
    consoleinfo: Schema<boolean, boolean>;
    pageautoclose: Schema<boolean, boolean>;
}> | Schemastery.ObjectS<{
    imageMode: Schema<"auto", "auto">;
}> | Schemastery.ObjectS<{
    imageMode: Schema<"manual", "manual">;
    imageWidth: Schema<number, number>;
    imageHeight: Schema<number, number>;
}>, {
    commandname: string;
    commandalias: string;
} & import("cosmokit").Dict & {
    imageMode: "auto" | "manual";
    screenshotquality: number;
} & ({
    weatherMap: Schemastery.ObjectT<{
        code: Schema<string, string>;
        description: Schema<string, string>;
    }>[];
    cloudCoverageMap: Schemastery.ObjectT<{
        code: Schema<string, string>;
        description: Schema<string, string>;
    }>[];
} & ({
    consoleinfo: boolean;
    pageautoclose: boolean;
} & (Schemastery.ObjectT<{
    imageMode: Schema<"auto", "auto">;
}> | Schemastery.ObjectT<{
    imageMode: Schema<"manual", "manual">;
    imageWidth: Schema<number, number>;
    imageHeight: Schema<number, number>;
}>)))>;
export interface Config {
    commandalias: string;
    pageautoclose: boolean;
    consoleinfo: any;
    commandname: any;
    screenshotquality: number;
    imageWidth: number;
    imageHeight: number;
    weatherMap: MapEntry[];
    cloudCoverageMap: MapEntry[];
    imageMode: 'auto' | 'manual';
}
export declare function apply(ctx: Context, config: Config): void;
export {};
