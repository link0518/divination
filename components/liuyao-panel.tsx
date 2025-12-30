
import React from "react";
import { LiuyaoResult } from "@/lib/liuyao/engine";
import { cn } from "@/lib/utils";

interface LiuyaoPanelProps {
    result: LiuyaoResult;
    lunarDate: string; // e.g., "乙巳年 丙戌月 丁酉日"
    xunKong: string; // e.g., "辰巳"
}

export function LiuyaoPanel({ result, lunarDate, xunKong }: LiuyaoPanelProps) {
    const { benGua, bianGua, yaoList, movingYaoPositions, fuShenList } = result;

    return (
        <div className="w-full max-w-md rounded-lg border border-border bg-card p-4 text-card-foreground shadow-sm">
            {/* 头部信息 */}
            <div className="mb-4 flex flex-col gap-1 text-center">
                <div className="text-sm text-muted-foreground">
                    {lunarDate} <span className="ml-2 rounded bg-muted px-1.5 py-0.5 text-xs">旬空: {xunKong}</span>
                </div>
                <div className="mt-2 text-lg font-bold text-primary">
                    {benGua.name} {bianGua ? `之 ${bianGua.name}` : ""}
                </div>
                <div className="text-xs text-muted-foreground">
                    {benGua.gongWuXing}{benGua.gong}宫
                    {benGua.isGuiHun ? " (归魂)" : benGua.isYouHun ? " (游魂)" : ""}
                </div>
            </div>

            {/* 排盘表格 */}
            <div className="w-full overflow-hidden text-sm">
                <div className="grid grid-cols-[1fr_2fr_1fr] gap-2 border-b border-border pb-2 text-xs font-medium text-muted-foreground">
                    <div className="text-center">六神</div>
                    <div className="text-center">本卦 (六亲/纳甲/状态)</div>
                    <div className="text-center">变卦</div>
                </div>

                <div className="flex flex-col-reverse gap-1 py-2">
                    {yaoList.map((yao) => {
                        const isMoving = movingYaoPositions.includes(yao.position);
                        const isShi = yao.isShiYao;
                        const isYing = yao.isYingYao;

                        // 查找对应的伏神
                        const fuShen = fuShenList.find(f => f.position === yao.position);

                        return (
                            <div key={yao.position} className="relative grid grid-cols-[1fr_2fr_1fr] gap-2 items-center py-1">
                                {/* 六神 */}
                                <div className="text-center text-xs text-muted-foreground">{yao.liuShen}</div>

                                {/* 本卦爻 */}
                                <div className="relative flex flex-col items-center justify-center rounded bg-secondary/30 px-2 py-1">
                                    <div className="flex w-full justify-between items-center">
                                        <span className={cn("text-xs w-8",
                                            yao.liuQin === '官鬼' ? 'text-red-500' :
                                                yao.liuQin === '妻財' ? 'text-green-600 dark:text-green-400' :
                                                    yao.liuQin === '子孫' ? 'text-blue-500' : ''
                                        )}>{yao.liuQin}</span>

                                        <span className={cn("font-bold mx-1 flex-1 text-center", isMoving && "text-destructive")}>
                                            {yao.yinYang === '陽' ? '▅▅▅▅▅' : '▅▅  ▅▅'}
                                            {isShi && <span className="absolute -right-1 top-0 text-[10px] text-primary font-normal">世</span>}
                                            {isYing && <span className="absolute -right-1 top-0 text-[10px] text-muted-foreground font-normal">应</span>}
                                        </span>

                                        <span className="text-xs w-8 text-right text-muted-foreground">{yao.naJia}</span>
                                    </div>

                                    {/* 伏神显示 */}
                                    {fuShen && (
                                        <div className="absolute -left-12 top-0 text-[10px] text-muted-foreground/60 w-12 text-right scale-90 origin-right">
                                            伏{fuShen.liuQin}{fuShen.wuXing}
                                        </div>
                                    )}

                                    {/* 旺衰/动爻标记 */}
                                    <div className="w-full flex justify-between text-[10px] text-muted-foreground/50 mt-0.5 px-0.5">
                                        <span>{yao.wangShuaiByMonth}{yao.wangShuaiByDay}</span>
                                        {isMoving && <span>O</span>}
                                    </div>
                                </div>

                                {/* 变卦爻 */}
                                <div className="flex items-center justify-center text-xs text-muted-foreground">
                                    {isMoving && yao.changedNaJia ? (
                                        <span className="flex items-center gap-1">
                                            <span>→</span>
                                            <span>{yao.changedNaJia}</span>
                                            <span className="text-[10px] opacity-70">
                                                ({yao.jinTuiShen ? yao.jinTuiShen : (yao.changedYinYang === '陽' ? '化阳' : '化阴')})
                                            </span>
                                        </span>
                                    ) : (
                                        <span className="opacity-10">-</span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
