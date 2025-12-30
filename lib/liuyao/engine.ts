
/**
 * 六爻排盤核心邏輯 (Portable Version)
 * 
 * 包含所有必要的類型定義、數據常量、計算器和核心排盤邏輯。
 * 移除了對 external library (如 lunar-javascript) 的直接依賴，
 * 改為由調用者傳入所需的時間干支信息。
 * 
 * 使用方法：
 * 1. 準備六個爻值 (6,7,8,9)
 * 2. 準備起卦時間的干支信息 (年/月/日/時干支)
 * 3. 調用 LiuyaoEngine.calculate()
 */

// ============================================
// 1. 類型定義 (From types.ts)
// ============================================

/** 爻值：6=老陰(動), 7=少陽(靜), 8=少陰(靜), 9=老陽(動) */
export type YaoValue = 6 | 7 | 8 | 9;
export type YinYang = '陽' | '陰';
export type WuXing = '金' | '木' | '水' | '火' | '土';
export type LiuQin = '父母' | '兄弟' | '子孫' | '妻財' | '官鬼';
export type LiuShen = '青龍' | '朱雀' | '勾陳' | '螣蛇' | '白虎' | '玄武';
export type FeiShenRelation = '飛生伏' | '飛克伏' | '伏生飛' | '伏克飛' | '比和';
export type JinTuiShenType = '進神' | '退神' | null;
export type WangShuaiState = '旺' | '相' | '休' | '囚' | '死';
export type TianGan = '甲' | '乙' | '丙' | '丁' | '戊' | '己' | '庚' | '辛' | '壬' | '癸';
export type DiZhi = '子' | '丑' | '寅' | '卯' | '辰' | '巳' | '午' | '未' | '申' | '酉' | '戌' | '亥';
export type BaGua = '乾' | '兌' | '離' | '震' | '巽' | '坎' | '艮' | '坤';

export interface LiuyaoInput {
    /** 六個爻值（自下而上，初爻到上爻） */
    yaoValues: [YaoValue, YaoValue, YaoValue, YaoValue, YaoValue, YaoValue];
    /** 日干（用於定六神、計算旬空） */
    dayStem: TianGan;
    /** 日支（用於計算旬空、旺衰） */
    dayBranch: DiZhi;
    /** 月支（用於計算旺衰） */
    monthBranch: DiZhi;
}

export interface YaoInfo {
    position: number;
    value: YaoValue;
    yinYang: YinYang;
    isMoving: boolean;
    changedYinYang?: YinYang;
    naJia: DiZhi;
    naJiaWuXing: WuXing;
    changedNaJia?: DiZhi;
    liuQin: LiuQin;
    liuShen: LiuShen;
    isShiYao: boolean;
    isYingYao: boolean;
    jinTuiShen?: JinTuiShenType;
    wangShuaiByMonth?: WangShuaiState;
    wangShuaiByDay?: WangShuaiState;
}

export interface GuaInfo {
    name: string;
    upperGua: BaGua;
    lowerGua: BaGua;
    gong: BaGua;
    gongWuXing: WuXing;
    shiYaoPosition: number;
    yingYaoPosition: number;
    guaXu: number;
    isYouHun: boolean;
    isGuiHun: boolean;
}

export interface FuShenInfo {
    liuQin: LiuQin;
    diZhi: DiZhi;
    wuXing: WuXing;
    position: number;
    feiShenDiZhi: DiZhi;
    feiShenWuXing: WuXing;
    relation: FeiShenRelation;
    wangShuaiByMonth?: WangShuaiState;
    wangShuaiByDay?: WangShuaiState;
}

export interface LiuyaoResult {
    benGua: GuaInfo;
    bianGua?: GuaInfo;
    yaoList: YaoInfo[];
    movingYaoPositions: number[];
    fuShenList: FuShenInfo[];
    xunKong: [DiZhi, DiZhi];
}

// ============================================
// 2. 數據常量 (From data/guagong.ts)
// ============================================

export const BAGUA_BINARY: Record<BaGua, number> = {
    '坤': 0b000, '艮': 0b001, '坎': 0b010, '巽': 0b011,
    '震': 0b100, '離': 0b101, '兌': 0b110, '乾': 0b111,
};

export const BINARY_TO_BAGUA: Record<number, BaGua> = {
    0b000: '坤', 0b001: '艮', 0b010: '坎', 0b011: '巽',
    0b100: '震', 0b101: '離', 0b110: '兌', 0b111: '乾',
};

export const BAGUA_WUXING: Record<BaGua, WuXing> = {
    '乾': '金', '兌': '金', '離': '火', '震': '木',
    '巽': '木', '坎': '水', '艮': '土', '坤': '土',
};

export interface Gua64Info {
    name: string; upper: BaGua; lower: BaGua; gong: BaGua;
    guaXu: number; shiYao: number; yingYao: number;
}

export const GUA64_DATA: Record<number, Gua64Info> = {
    // 乾宮
    [0b111111]: { name: '乾為天', upper: '乾', lower: '乾', gong: '乾', guaXu: 1, shiYao: 6, yingYao: 3 },
    [0b111011]: { name: '天風姤', upper: '乾', lower: '巽', gong: '乾', guaXu: 2, shiYao: 1, yingYao: 4 },
    [0b111001]: { name: '天山遯', upper: '乾', lower: '艮', gong: '乾', guaXu: 3, shiYao: 2, yingYao: 5 },
    [0b111000]: { name: '天地否', upper: '乾', lower: '坤', gong: '乾', guaXu: 4, shiYao: 3, yingYao: 6 },
    [0b011000]: { name: '風地觀', upper: '巽', lower: '坤', gong: '乾', guaXu: 5, shiYao: 4, yingYao: 1 },
    [0b001000]: { name: '山地剝', upper: '艮', lower: '坤', gong: '乾', guaXu: 6, shiYao: 5, yingYao: 2 },
    [0b101000]: { name: '火地晉', upper: '離', lower: '坤', gong: '乾', guaXu: 7, shiYao: 4, yingYao: 1 },
    [0b101111]: { name: '火天大有', upper: '離', lower: '乾', gong: '乾', guaXu: 8, shiYao: 3, yingYao: 6 },
    // 兌宮
    [0b110110]: { name: '兌為澤', upper: '兌', lower: '兌', gong: '兌', guaXu: 1, shiYao: 6, yingYao: 3 },
    [0b110010]: { name: '澤水困', upper: '兌', lower: '坎', gong: '兌', guaXu: 2, shiYao: 1, yingYao: 4 },
    [0b110000]: { name: '澤地萃', upper: '兌', lower: '坤', gong: '兌', guaXu: 3, shiYao: 2, yingYao: 5 },
    [0b110001]: { name: '澤山咸', upper: '兌', lower: '艮', gong: '兌', guaXu: 4, shiYao: 3, yingYao: 6 },
    [0b010001]: { name: '水山蹇', upper: '坎', lower: '艮', gong: '兌', guaXu: 5, shiYao: 4, yingYao: 1 },
    [0b000001]: { name: '地山謙', upper: '坤', lower: '艮', gong: '兌', guaXu: 6, shiYao: 5, yingYao: 2 },
    [0b100001]: { name: '雷山小過', upper: '震', lower: '艮', gong: '兌', guaXu: 7, shiYao: 4, yingYao: 1 },
    [0b100110]: { name: '雷澤歸妹', upper: '震', lower: '兌', gong: '兌', guaXu: 8, shiYao: 3, yingYao: 6 },
    // 離宮
    [0b101101]: { name: '離為火', upper: '離', lower: '離', gong: '離', guaXu: 1, shiYao: 6, yingYao: 3 },
    [0b101001]: { name: '火山旅', upper: '離', lower: '艮', gong: '離', guaXu: 2, shiYao: 1, yingYao: 4 },
    [0b101011]: { name: '火風鼎', upper: '離', lower: '巽', gong: '離', guaXu: 3, shiYao: 2, yingYao: 5 },
    [0b101010]: { name: '火水未濟', upper: '離', lower: '坎', gong: '離', guaXu: 4, shiYao: 3, yingYao: 6 },
    [0b001010]: { name: '山水蒙', upper: '艮', lower: '坎', gong: '離', guaXu: 5, shiYao: 4, yingYao: 1 },
    [0b011010]: { name: '風水渙', upper: '巽', lower: '坎', gong: '離', guaXu: 6, shiYao: 5, yingYao: 2 },
    [0b111010]: { name: '天水訟', upper: '乾', lower: '坎', gong: '離', guaXu: 7, shiYao: 4, yingYao: 1 },
    [0b111101]: { name: '天火同人', upper: '乾', lower: '離', gong: '離', guaXu: 8, shiYao: 3, yingYao: 6 },
    // 震宮
    [0b100100]: { name: '震為雷', upper: '震', lower: '震', gong: '震', guaXu: 1, shiYao: 6, yingYao: 3 },
    [0b100000]: { name: '雷地豫', upper: '震', lower: '坤', gong: '震', guaXu: 2, shiYao: 1, yingYao: 4 },
    [0b100010]: { name: '雷水解', upper: '震', lower: '坎', gong: '震', guaXu: 3, shiYao: 2, yingYao: 5 },
    [0b100011]: { name: '雷風恆', upper: '震', lower: '巽', gong: '震', guaXu: 4, shiYao: 3, yingYao: 6 },
    [0b000011]: { name: '地風升', upper: '坤', lower: '巽', gong: '震', guaXu: 5, shiYao: 4, yingYao: 1 },
    [0b010011]: { name: '水風井', upper: '坎', lower: '巽', gong: '震', guaXu: 6, shiYao: 5, yingYao: 2 },
    [0b110011]: { name: '澤風大過', upper: '兌', lower: '巽', gong: '震', guaXu: 7, shiYao: 4, yingYao: 1 },
    [0b110100]: { name: '澤雷隨', upper: '兌', lower: '震', gong: '震', guaXu: 8, shiYao: 3, yingYao: 6 },
    // 巽宮
    [0b011011]: { name: '巽為風', upper: '巽', lower: '巽', gong: '巽', guaXu: 1, shiYao: 6, yingYao: 3 },
    [0b011111]: { name: '風天小畜', upper: '巽', lower: '乾', gong: '巽', guaXu: 2, shiYao: 1, yingYao: 4 },
    [0b011101]: { name: '風火家人', upper: '巽', lower: '離', gong: '巽', guaXu: 3, shiYao: 2, yingYao: 5 },
    [0b011100]: { name: '風雷益', upper: '巽', lower: '震', gong: '巽', guaXu: 4, shiYao: 3, yingYao: 6 },
    [0b111100]: { name: '天雷無妄', upper: '乾', lower: '震', gong: '巽', guaXu: 5, shiYao: 4, yingYao: 1 },
    [0b101100]: { name: '火雷噬嗑', upper: '離', lower: '震', gong: '巽', guaXu: 6, shiYao: 5, yingYao: 2 },
    [0b001100]: { name: '山雷頤', upper: '艮', lower: '震', gong: '巽', guaXu: 7, shiYao: 4, yingYao: 1 },
    [0b001011]: { name: '山風蠱', upper: '艮', lower: '巽', gong: '巽', guaXu: 8, shiYao: 3, yingYao: 6 },
    // 坎宮
    [0b010010]: { name: '坎為水', upper: '坎', lower: '坎', gong: '坎', guaXu: 1, shiYao: 6, yingYao: 3 },
    [0b010110]: { name: '水澤節', upper: '坎', lower: '兌', gong: '坎', guaXu: 2, shiYao: 1, yingYao: 4 },
    [0b010100]: { name: '水雷屯', upper: '坎', lower: '震', gong: '坎', guaXu: 3, shiYao: 2, yingYao: 5 },
    [0b010101]: { name: '水火既濟', upper: '坎', lower: '離', gong: '坎', guaXu: 4, shiYao: 3, yingYao: 6 },
    [0b110101]: { name: '澤火革', upper: '兌', lower: '離', gong: '坎', guaXu: 5, shiYao: 4, yingYao: 1 },
    [0b100101]: { name: '雷火豐', upper: '震', lower: '離', gong: '坎', guaXu: 6, shiYao: 5, yingYao: 2 },
    [0b000101]: { name: '地火明夷', upper: '坤', lower: '離', gong: '坎', guaXu: 7, shiYao: 4, yingYao: 1 },
    [0b000010]: { name: '地水師', upper: '坤', lower: '坎', gong: '坎', guaXu: 8, shiYao: 3, yingYao: 6 },
    // 艮宮
    [0b001001]: { name: '艮為山', upper: '艮', lower: '艮', gong: '艮', guaXu: 1, shiYao: 6, yingYao: 3 },
    [0b001101]: { name: '山火賁', upper: '艮', lower: '離', gong: '艮', guaXu: 2, shiYao: 1, yingYao: 4 },
    [0b001111]: { name: '山天大畜', upper: '艮', lower: '乾', gong: '艮', guaXu: 3, shiYao: 2, yingYao: 5 },
    [0b001110]: { name: '山澤損', upper: '艮', lower: '兌', gong: '艮', guaXu: 4, shiYao: 3, yingYao: 6 },
    [0b101110]: { name: '火澤睽', upper: '離', lower: '兌', gong: '艮', guaXu: 5, shiYao: 4, yingYao: 1 },
    [0b111110]: { name: '天澤履', upper: '乾', lower: '兌', gong: '艮', guaXu: 6, shiYao: 5, yingYao: 2 },
    [0b011110]: { name: '風澤中孚', upper: '巽', lower: '兌', gong: '艮', guaXu: 7, shiYao: 4, yingYao: 1 },
    [0b011001]: { name: '風山漸', upper: '巽', lower: '艮', gong: '艮', guaXu: 8, shiYao: 3, yingYao: 6 },
    // 坤宮
    [0b000000]: { name: '坤為地', upper: '坤', lower: '坤', gong: '坤', guaXu: 1, shiYao: 6, yingYao: 3 },
    [0b000100]: { name: '地雷復', upper: '坤', lower: '震', gong: '坤', guaXu: 2, shiYao: 1, yingYao: 4 },
    [0b000110]: { name: '地澤臨', upper: '坤', lower: '兌', gong: '坤', guaXu: 3, shiYao: 2, yingYao: 5 },
    [0b000111]: { name: '地天泰', upper: '坤', lower: '乾', gong: '坤', guaXu: 4, shiYao: 3, yingYao: 6 },
    [0b100111]: { name: '雷天大壯', upper: '震', lower: '乾', gong: '坤', guaXu: 5, shiYao: 4, yingYao: 1 },
    [0b110111]: { name: '澤天夬', upper: '兌', lower: '乾', gong: '坤', guaXu: 6, shiYao: 5, yingYao: 2 },
    [0b010111]: { name: '水天需', upper: '坎', lower: '乾', gong: '坤', guaXu: 7, shiYao: 4, yingYao: 1 },
    [0b010000]: { name: '水地比', upper: '坎', lower: '坤', gong: '坤', guaXu: 8, shiYao: 3, yingYao: 6 },
};

export const NAJIA_TABLE: Record<BaGua, { inner: [DiZhi, DiZhi, DiZhi]; outer: [DiZhi, DiZhi, DiZhi] }> = {
    '乾': { inner: ['子', '寅', '辰'], outer: ['午', '申', '戌'] },
    '坤': { inner: ['未', '巳', '卯'], outer: ['丑', '亥', '酉'] },
    '震': { inner: ['子', '寅', '辰'], outer: ['午', '申', '戌'] },
    '巽': { inner: ['丑', '亥', '酉'], outer: ['未', '巳', '卯'] },
    '坎': { inner: ['寅', '辰', '午'], outer: ['申', '戌', '子'] },
    '離': { inner: ['卯', '丑', '亥'], outer: ['酉', '未', '巳'] },
    '艮': { inner: ['辰', '午', '申'], outer: ['戌', '子', '寅'] },
    '兌': { inner: ['巳', '卯', '丑'], outer: ['亥', '酉', '未'] },
};

export const DIZHI_WUXING: Record<DiZhi, WuXing> = {
    '子': '水', '丑': '土', '寅': '木', '卯': '木', '辰': '土', '巳': '火',
    '午': '火', '未': '土', '申': '金', '酉': '金', '戌': '土', '亥': '水',
};

export function getGua64Info(upper: BaGua, lower: BaGua): Gua64Info {
    const key = BAGUA_BINARY[upper] * 8 + BAGUA_BINARY[lower];
    return GUA64_DATA[key];
}

// ============================================
// 3. 計算器 (Calculators)
// ============================================

export class LiuqinCalculator {
    static calculate(gongWuXing: WuXing, yaoWuXing: WuXing): LiuQin {
        const WUXING_SHENG: Record<WuXing, WuXing> = { '木': '火', '火': '土', '土': '金', '金': '水', '水': '木' };
        const WUXING_KE: Record<WuXing, WuXing> = { '木': '土', '土': '水', '水': '火', '火': '金', '金': '木' };

        if (gongWuXing === yaoWuXing) return '兄弟';
        if (WUXING_SHENG[yaoWuXing] === gongWuXing) return '父母';
        if (WUXING_SHENG[gongWuXing] === yaoWuXing) return '子孫';
        if (WUXING_KE[yaoWuXing] === gongWuXing) return '官鬼';
        if (WUXING_KE[gongWuXing] === yaoWuXing) return '妻財';
        return '兄弟';
    }
}

export class LiushenCalculator {
    static calculateAll(dayStem: TianGan): LiuShen[] {
        const LIUSHEN_ORDER: LiuShen[] = ['青龍', '朱雀', '勾陳', '螣蛇', '白虎', '玄武'];
        const STEM_TO_START_INDEX: Record<TianGan, number> = {
            '甲': 0, '乙': 0, '丙': 1, '丁': 1, '戊': 2, '己': 3, '庚': 4, '辛': 4, '壬': 5, '癸': 5,
        };
        const startIndex = STEM_TO_START_INDEX[dayStem];
        const results: LiuShen[] = [];
        for (let i = 1; i <= 6; i++) {
            results.push(LIUSHEN_ORDER[(startIndex + i - 1) % 6]);
        }
        return results;
    }
}

export class XunkongCalculator {
    static calculate(dayStem: TianGan, dayBranch: DiZhi): [DiZhi, DiZhi] {
        const TIANGAN_INDEX: Record<TianGan, number> = { '甲': 0, '乙': 1, '丙': 2, '丁': 3, '戊': 4, '己': 5, '庚': 6, '辛': 7, '壬': 8, '癸': 9 };
        const DIZHI_INDEX: Record<DiZhi, number> = { '子': 0, '丑': 1, '寅': 2, '卯': 3, '辰': 4, '巳': 5, '午': 6, '未': 7, '申': 8, '酉': 9, '戌': 10, '亥': 11 };
        const DIZHI_ARRAY: DiZhi[] = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

        const stemIndex = TIANGAN_INDEX[dayStem];
        const branchIndex = DIZHI_INDEX[dayBranch];
        const xunStartBranchIndex = (branchIndex - stemIndex + 12) % 12;

        const kong1Index = (xunStartBranchIndex + 10) % 12;
        const kong2Index = (xunStartBranchIndex + 11) % 12;

        return [DIZHI_ARRAY[kong1Index], DIZHI_ARRAY[kong2Index]];
    }
}

export class NajiaCalculator {
    static calculate(position: number, upperGua: BaGua, lowerGua: BaGua): { diZhi: DiZhi; wuXing: WuXing } {
        const isOuter = position > 3;
        const gua = isOuter ? upperGua : lowerGua;
        const positionInGua = isOuter ? position - 3 : position;
        const naJiaData = NAJIA_TABLE[gua];
        const arr = isOuter ? naJiaData.outer : naJiaData.inner;
        const diZhi = arr[positionInGua - 1];
        return { diZhi, wuXing: DIZHI_WUXING[diZhi] };
    }

    static calculateAll(upperGua: BaGua, lowerGua: BaGua): { diZhi: DiZhi; wuXing: WuXing }[] {
        const results: { diZhi: DiZhi; wuXing: WuXing }[] = [];
        for (let i = 1; i <= 6; i++) {
            results.push(this.calculate(i, upperGua, lowerGua));
        }
        return results;
    }

    static getGuaFromYaoValues(yaoValues: YaoValue[]): { upper: BaGua; lower: BaGua } {
        const yinYang = yaoValues.map(v => v === 7 || v === 9);
        const lowerBinary = (yinYang[0] ? 4 : 0) + (yinYang[1] ? 2 : 0) + (yinYang[2] ? 1 : 0);
        const upperBinary = (yinYang[3] ? 4 : 0) + (yinYang[4] ? 2 : 0) + (yinYang[5] ? 1 : 0);
        return { upper: BINARY_TO_BAGUA[upperBinary], lower: BINARY_TO_BAGUA[lowerBinary] };
    }

    static isMoving(yaoValue: YaoValue): boolean {
        return yaoValue === 6 || yaoValue === 9;
    }

    static getChangedYinYang(yaoValue: YaoValue): YinYang | undefined {
        if (!this.isMoving(yaoValue)) return undefined;
        return yaoValue === 9 ? '陰' : '陽';
    }

    static getYinYang(yaoValue: YaoValue): YinYang {
        return (yaoValue === 7 || yaoValue === 9) ? '陽' : '陰';
    }
}

export class JintuishenCalculator {
    static calculate(originalDiZhi: DiZhi, changedDiZhi: DiZhi): JinTuiShenType {
        const JIN_SHEN_MAP: Partial<Record<DiZhi, DiZhi>> = { '亥': '子', '寅': '卯', '巳': '午', '申': '酉', '丑': '辰', '辰': '未', '未': '戌', '戌': '丑' };
        const TUI_SHEN_MAP: Partial<Record<DiZhi, DiZhi>> = { '子': '亥', '卯': '寅', '午': '巳', '酉': '申', '辰': '丑', '未': '辰', '戌': '未', '丑': '戌' };
        if (JIN_SHEN_MAP[originalDiZhi] === changedDiZhi) return '進神';
        if (TUI_SHEN_MAP[originalDiZhi] === changedDiZhi) return '退神';
        return null;
    }
}

export class WangshuaiCalculator {
    static calculate(yaoWuXing: WuXing, lingDiZhi: DiZhi): WangShuaiState {
        const lingWuXing = DIZHI_WUXING[lingDiZhi];
        const SHENG: Record<WuXing, WuXing> = { '金': '水', '水': '木', '木': '火', '火': '土', '土': '金' };
        const KE: Record<WuXing, WuXing> = { '金': '木', '木': '土', '土': '水', '水': '火', '火': '金' };

        if (yaoWuXing === lingWuXing) return '旺';
        if (SHENG[lingWuXing] === yaoWuXing) return '相';
        if (SHENG[yaoWuXing] === lingWuXing) return '休';
        if (KE[yaoWuXing] === lingWuXing) return '囚';
        if (KE[lingWuXing] === yaoWuXing) return '死';
        return '休';
    }
}

export class FushenCalculator {
    static calculate(
        gongWuXing: WuXing,
        gong: BaGua,
        presentLiuQin: LiuQin[],
        benGuaNaJia: { diZhi: DiZhi; wuXing: WuXing }[],
        monthBranch?: DiZhi,
        dayBranch?: DiZhi
    ): FuShenInfo[] {
        const ALL_LIUQIN: LiuQin[] = ['父母', '兄弟', '子孫', '妻財', '官鬼'];
        const presentSet = new Set(presentLiuQin);
        const missingLiuQin = ALL_LIUQIN.filter(lq => !presentSet.has(lq));
        if (missingLiuQin.length === 0) return [];

        const shouGuaNaJia = this.getShouGuaNaJia(gong);
        const shouGuaLiuQin = shouGuaNaJia.map(nj => LiuqinCalculator.calculate(gongWuXing, nj.wuXing));
        const fuShenList: FuShenInfo[] = [];

        for (const missingLq of missingLiuQin) {
            const position = shouGuaLiuQin.findIndex(lq => lq === missingLq);
            if (position === -1) continue;

            const fuShenNaJia = shouGuaNaJia[position];
            const feiShenNaJia = benGuaNaJia[position];
            const relation = this.calculateRelation(feiShenNaJia.wuXing, fuShenNaJia.wuXing);

            const fuShenInfo: FuShenInfo = {
                liuQin: missingLq,
                diZhi: fuShenNaJia.diZhi,
                wuXing: fuShenNaJia.wuXing,
                position: position + 1,
                feiShenDiZhi: feiShenNaJia.diZhi,
                feiShenWuXing: feiShenNaJia.wuXing,
                relation,
            };

            if (monthBranch) fuShenInfo.wangShuaiByMonth = WangshuaiCalculator.calculate(fuShenNaJia.wuXing, monthBranch);
            if (dayBranch) fuShenInfo.wangShuaiByDay = WangshuaiCalculator.calculate(fuShenNaJia.wuXing, dayBranch);
            fuShenList.push(fuShenInfo);
        }
        return fuShenList;
    }

    private static getShouGuaNaJia(gong: BaGua): { diZhi: DiZhi; wuXing: WuXing }[] {
        const naJiaData = NAJIA_TABLE[gong];
        const result: { diZhi: DiZhi; wuXing: WuXing }[] = [];
        for (const dz of naJiaData.inner) result.push({ diZhi: dz, wuXing: DIZHI_WUXING[dz] });
        for (const dz of naJiaData.outer) result.push({ diZhi: dz, wuXing: DIZHI_WUXING[dz] });
        return result;
    }

    private static calculateRelation(feiWuXing: WuXing, fuWuXing: WuXing): FeiShenRelation {
        if (feiWuXing === fuWuXing) return '比和';
        const SHENG: Record<WuXing, WuXing> = { '金': '水', '水': '木', '木': '火', '火': '土', '土': '金' };
        const KE: Record<WuXing, WuXing> = { '金': '木', '木': '土', '土': '水', '水': '火', '火': '金' };
        if (SHENG[feiWuXing] === fuWuXing) return '飛生伏';
        if (KE[feiWuXing] === fuWuXing) return '飛克伏';
        if (SHENG[fuWuXing] === feiWuXing) return '伏生飛';
        if (KE[fuWuXing] === feiWuXing) return '伏克飛';
        return '比和';
    }
}

// ============================================
// 4. 主引擎 (Main Engine)
// ============================================

export class LiuyaoEngine {
    /**
     * 計算六爻排盤
     */
    static calculate(input: LiuyaoInput): LiuyaoResult {
        // 1. 本卦
        const { upper: benUpper, lower: benLower } = NajiaCalculator.getGuaFromYaoValues(input.yaoValues);
        const benGuaData = getGua64Info(benUpper, benLower);
        const benGua: GuaInfo = {
            name: benGuaData.name,
            upperGua: benGuaData.upper,
            lowerGua: benGuaData.lower,
            gong: benGuaData.gong,
            gongWuXing: BAGUA_WUXING[benGuaData.gong],
            shiYaoPosition: benGuaData.shiYao,
            yingYaoPosition: benGuaData.yingYao,
            guaXu: benGuaData.guaXu,
            isYouHun: benGuaData.guaXu === 7,
            isGuiHun: benGuaData.guaXu === 8,
        };

        // 2. 動爻和變卦
        const movingYaoPositions: number[] = [];
        const changedYaoYinYang: boolean[] = [];
        for (let i = 0; i < 6; i++) {
            const yaoValue = input.yaoValues[i];
            const isMoving = NajiaCalculator.isMoving(yaoValue);
            const isYang = yaoValue === 7 || yaoValue === 9;
            if (isMoving) {
                movingYaoPositions.push(i + 1);
                changedYaoYinYang.push(!isYang);
            } else {
                changedYaoYinYang.push(isYang);
            }
        }

        let bianGua: GuaInfo | undefined;
        if (movingYaoPositions.length > 0) {
            const lowerBinary = (changedYaoYinYang[0] ? 4 : 0) + (changedYaoYinYang[1] ? 2 : 0) + (changedYaoYinYang[2] ? 1 : 0);
            const upperBinary = (changedYaoYinYang[3] ? 4 : 0) + (changedYaoYinYang[4] ? 2 : 0) + (changedYaoYinYang[5] ? 1 : 0);
            const bianUpper = BINARY_TO_BAGUA[upperBinary];
            const bianLower = BINARY_TO_BAGUA[lowerBinary];
            const bianGuaData = getGua64Info(bianUpper, bianLower);
            bianGua = {
                name: bianGuaData.name,
                upperGua: bianGuaData.upper,
                lowerGua: bianGuaData.lower,
                gong: bianGuaData.gong,
                gongWuXing: BAGUA_WUXING[bianGuaData.gong],
                shiYaoPosition: bianGuaData.shiYao,
                yingYaoPosition: bianGuaData.yingYao,
                guaXu: bianGuaData.guaXu,
                isYouHun: bianGuaData.guaXu === 7,
                isGuiHun: bianGuaData.guaXu === 8,
            };
        }

        // 3. 六爻詳細信息
        const yaoList: YaoInfo[] = [];
        const liuShenList = LiushenCalculator.calculateAll(input.dayStem);
        const naJiaList = NajiaCalculator.calculateAll(benGua.upperGua, benGua.lowerGua);

        for (let i = 0; i < 6; i++) {
            const position = i + 1;
            const yaoValue = input.yaoValues[i];
            const isMoving = NajiaCalculator.isMoving(yaoValue);
            const yinYang = NajiaCalculator.getYinYang(yaoValue);
            const changedYinYang = NajiaCalculator.getChangedYinYang(yaoValue);
            const naJia = naJiaList[i];
            const liuQin = LiuqinCalculator.calculate(benGua.gongWuXing, naJia.wuXing);

            let changedNaJia: DiZhi | undefined;
            let jinTuiShen = undefined;
            if (isMoving && bianGua) {
                const bianNaJiaList = NajiaCalculator.calculateAll(bianGua.upperGua, bianGua.lowerGua);
                changedNaJia = bianNaJiaList[i].diZhi;
                jinTuiShen = JintuishenCalculator.calculate(naJia.diZhi, changedNaJia);
            }

            const wangShuaiByMonth = WangshuaiCalculator.calculate(naJia.wuXing, input.monthBranch);
            const wangShuaiByDay = WangshuaiCalculator.calculate(naJia.wuXing, input.dayBranch);

            yaoList.push({
                position,
                value: yaoValue,
                yinYang,
                isMoving,
                changedYinYang,
                naJia: naJia.diZhi,
                naJiaWuXing: naJia.wuXing,
                changedNaJia,
                liuQin,
                liuShen: liuShenList[i],
                isShiYao: position === benGua.shiYaoPosition,
                isYingYao: position === benGua.yingYaoPosition,
                jinTuiShen,
                wangShuaiByMonth,
                wangShuaiByDay,
            });
        }

        // 4. 伏神
        const presentLiuQin = yaoList.map(y => y.liuQin);
        const benGuaNaJia = yaoList.map(y => ({ diZhi: y.naJia, wuXing: y.naJiaWuXing }));
        const fuShenList = FushenCalculator.calculate(
            benGua.gongWuXing,
            benGua.gong,
            presentLiuQin,
            benGuaNaJia,
            input.monthBranch,
            input.dayBranch
        );

        // 5. 旬空
        const xunKong = XunkongCalculator.calculate(input.dayStem, input.dayBranch);

        return {
            benGua,
            bianGua,
            yaoList,
            movingYaoPositions,
            fuShenList,
            xunKong,
        };
    }
}
