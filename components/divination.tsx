"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import Coin from "@/components/coin";
import Hexagram, { HexagramObj } from "@/components/hexagram";
import { bool } from "aimless.js";
import Result, { ResultObj } from "@/components/result";
import Question from "@/components/question";
import ResultAI from "@/components/result-ai";
import { animateChildren } from "@/lib/animate";
import guaIndexData from "@/lib/data/gua-index.json";
import guaListData from "@/lib/data/gua-list.json";
import { getAnswer } from "@/app/server";
import { readStreamableValue } from "ai/rsc";
import { Button } from "./ui/button";
import { LiuyaoPanel } from "@/components/liuyao-panel";
import { BrainCircuit, ListRestart, LayoutTemplate } from "lucide-react";
import { ERROR_PREFIX } from "@/lib/constant";
import { saveToHistory } from "@/components/history";
import { LiuyaoEngine, YaoValue, LiuyaoResult, LiuyaoInput, TianGan, DiZhi } from "@/lib/liuyao/engine";
import { Lunar, Solar } from "lunar-javascript";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
} from "@/components/ui/dialog";

const AUTO_DELAY = 600;

function Divination() {
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [completion, setCompletion] = useState<string>("");
  const [engineResultState, setEngineResultState] = useState<{
    result: LiuyaoResult;
    lunarDate: string;
    xunKong: string;
  } | null>(null);

  function getEngineResult(hexagrams: HexagramObj[]) {
    if (hexagrams.length !== 6) return undefined;

    // 1. 转换爻值
    // HexagramObj: { yang: boolean, change: boolean | null }
    // 6=老陰(動): yang=false, change=true
    // 7=少陽(靜): yang=true, change=false
    // 8=少陰(靜): yang=false, change=false
    // 9=老陽(動): yang=true, change=true
    const yaoValues: YaoValue[] = hexagrams.map(h => {
      if (h.yang) {
        return h.change ? 9 : 7;
      } else {
        return h.change ? 6 : 8;
      }
    }) as unknown as [YaoValue, YaoValue, YaoValue, YaoValue, YaoValue, YaoValue];

    // 2. 获取当前时间干支 (Lunar)
    const solar = Solar.fromDate(new Date());
    const lunar = solar.getLunar();
    const dayStem = lunar.getDayGan() as TianGan;
    const dayBranch = lunar.getDayZhi() as DiZhi;
    const monthBranch = lunar.getMonthZhi() as DiZhi;

    // 3. 调用引擎
    const input: LiuyaoInput = {
      yaoValues: yaoValues as [YaoValue, YaoValue, YaoValue, YaoValue, YaoValue, YaoValue],
      dayStem,
      dayBranch,
      monthBranch,
    };

    const result = LiuyaoEngine.calculate(input);
    const xunKong = result.xunKong.join("");
    const lunarDate = `${lunar.getYearInGanZhi()}年 ${lunar.getMonthInGanZhi()}月 ${lunar.getDayInGanZhi()}日`;

    setEngineResultState({ result, lunarDate, xunKong });

    // 4. 格式化输出给 AI 的 prompt
    const { benGua, bianGua, fuShenList, yaoList, movingYaoPositions } = result;

    let report = `起卦时间：${lunarDate} (旬空: ${xunKong})\n`;
    report += `本卦：${benGua.gongWuXing}${benGua.gong}宫 - ${benGua.name} (六親:${benGua.gongWuXing})\n`;
    if (bianGua) {
      report += `变卦：${bianGua.name}\n`;
    }

    report += `\n【六爻详解】\n`;
    yaoList.forEach(yao => {
      const moveStr = yao.isMoving ? (yao.changedNaJia ? ` -> 动化${yao.changedNaJia}${yao.changedYinYang}` : ' -> 动') : '';
      const shiYing = yao.isShiYao ? ' (世)' : (yao.isYingYao ? ' (应)' : '');
      const mark = movingYaoPositions.includes(yao.position) ? 'O' : (yao.isShiYao || yao.isYingYao ? '*' : '-');
      report += `${yao.position}爻 ${yao.yinYang} ${yao.naJia}(${yao.liuQin}) ${yao.liuShen}${shiYing} [${yao.wangShuaiByMonth} / ${yao.wangShuaiByDay}]${moveStr}\n`;
      if (yao.jinTuiShen) {
        report += `   >>> 动化${yao.jinTuiShen}\n`;
      }
    });

    if (fuShenList.length > 0) {
      report += `\n【伏神】\n`;
      fuShenList.forEach(fu => {
        report += `伏神 ${fu.liuQin}${fu.diZhi}(${fu.wuXing}) 藏于 ${fu.position}爻 之飞神 ${fu.feiShenDiZhi}(${fu.feiShenWuXing}) 下，关系：${fu.relation}\n`;
      });
    }

    return report;
  }

  async function onCompletion() {
    setError("");
    setCompletion("");
    setIsLoading(true);

    // 计算专业排盘数据
    const engineReport = getEngineResult(hexagramList);
    console.log("DEBUG: engineReport generated:", engineReport ? "Yes" : "No");

    try {
      console.log("DEBUG: Calling getAnswer with 6 args");
      const { data, error } = await getAnswer(
        questionSupplement || question, // 优先使用补充说明，如果没有则使用原问题
        resultObj!.guaMark,
        resultObj!.guaTitle,
        resultObj!.guaResult,
        resultObj!.guaChange,
        engineReport // 传入新参数
      );
      console.log("DEBUG: getAnswer returned", { data: !!data, error });
      if (error) {
        setError(error);
        return;
      }
      if (data) {
        let ret = "";
        for await (const delta of readStreamableValue(data)) {
          if (delta.startsWith(ERROR_PREFIX)) {
            setError(delta.slice(ERROR_PREFIX.length));
            return;
          }
          ret += delta;
          setCompletion(ret);
        }
        // AI解读完成后更新历史记录
        if (ret && resultObj) {
          saveToHistory(
            question, // 使用相同的 question，确保能匹配到之前的记录
            resultObj.guaMark,
            resultObj.guaTitle,
            resultObj.guaResult,
            resultObj.guaChange,
            ret
          );
        }
      }
    } catch (err: any) {
      setError(err.message ?? err);
    } finally {
      setIsLoading(false);
    }
  }

  const [frontList, setFrontList] = useState([true, true, true]);
  const [rotation, setRotation] = useState(false);

  const [hexagramList, setHexagramList] = useState<HexagramObj[]>([]);

  const [resultObj, setResultObj] = useState<ResultObj | null>(null);
  const [question, setQuestion] = useState("");
  const [questionSupplement, setQuestionSupplement] = useState("");

  const handleSetQuestion = (displayText: string, supplementText?: string) => {
    setQuestion(displayText);
    setQuestionSupplement(supplementText || displayText);
  };

  const [resultAi, setResultAi] = useState(false);

  const flexRef = useRef<HTMLDivElement>(null);

  const [count, setCount] = useState(0);

  const startClick = useCallback(() => {
    if (rotation) {
      return;
    }
    if (hexagramList.length >= 6) {
      setHexagramList([]);
    }
    setFrontList([bool(), bool(), bool()]);
    setRotation(true);
    setCount(prev => prev + 1);
  }, [rotation, hexagramList.length]);

  // 自动卜筮
  useEffect(() => {
    if (rotation || resultObj || count >= 6 || !question) {
      return;
    }
    const timer = setTimeout(() => {
      if (!rotation && !resultObj && count < 6 && question) {
        startClick();
      }
    }, AUTO_DELAY);
    return () => clearTimeout(timer);
  }, [question, rotation, count, resultObj, startClick]);

  useEffect(() => {
    if (!flexRef.current) {
      return;
    }
    const observer = animateChildren(flexRef.current);
    return () => observer.disconnect();
  }, []);

  function onTransitionEnd() {
    setRotation(false);
    let frontCount = frontList.reduce((acc, val) => (val ? acc + 1 : acc), 0);
    setHexagramList((list) => {
      const newList = [
        ...list,
        {
          change: frontCount == 0 || frontCount == 3 || null,
          yang: frontCount >= 2,
          separate: list.length == 3,
        },
      ];
      setResult(newList);
      return newList;
    });
  }

  async function testClick() {
    for (let i = 0; i < 6; i++) {
      onTransitionEnd();
    }
  }

  function restartClick() {
    setResultObj(null);
    setHexagramList([]);
    setQuestion("");
    setQuestionSupplement("");
    setResultAi(false);
    setCount(0);
    setEngineResultState(null);
  }

  function aiClick() {
    setResultAi(true);
    onCompletion();
  }

  function setResult(list: HexagramObj[]) {
    if (list.length != 6) {
      return;
    }
    const guaDict1 = ["坤", "震", "坎", "兑", "艮", "离", "巽", "乾"];
    const guaDict2 = ["地", "雷", "水", "泽", "山", "火", "风", "天"];

    const changeYang = ["初九", "九二", "九三", "九四", "九五", "上九"];
    const changeYin = ["初六", "六二", "六三", "六四", "六五", "上六"];

    const changeList: String[] = [];
    list.forEach((value, index) => {
      if (!value.change) {
        return;
      }
      changeList.push(value.yang ? changeYang[index] : changeYin[index]);
    });

    // 卦的结果： 第X卦 X卦 XX卦 X上X下
    // 计算卦的索引，111对应乾卦，000对应坤卦，索引转为10进制。
    const upIndex =
      (list[5].yang ? 4 : 0) + (list[4].yang ? 2 : 0) + (list[3].yang ? 1 : 0);
    const downIndex =
      (list[2].yang ? 4 : 0) + (list[1].yang ? 2 : 0) + (list[0].yang ? 1 : 0);

    const guaIndex = guaIndexData[upIndex][downIndex] - 1;
    const guaName1 = guaListData[guaIndex];

    let guaName2;
    if (upIndex === downIndex) {
      // 上下卦相同，格式为X为X
      guaName2 = guaDict1[upIndex] + "为" + guaDict2[upIndex];
    } else {
      guaName2 = guaDict2[upIndex] + guaDict2[downIndex] + guaName1;
    }

    const guaDesc = guaDict1[upIndex] + "上" + guaDict1[downIndex] + "下";

    const newResultObj = {
      // 例：26.山天大畜
      guaMark: `${(guaIndex + 1).toString().padStart(2, "0")}.${guaName2}`,
      guaTitle: `周易第${guaIndex + 1}卦`,
      // 例：大畜卦(山天大畜)_艮上乾下
      guaResult: `${guaName1}卦(${guaName2})_${guaDesc}`,
      guaChange:
        changeList.length === 0 ? "无变爻" : `变爻: ${changeList.toString()}`,
    };

    setResultObj(newResultObj);

    // 卦象生成后立即保存基础历史记录（不含AI解读）
    saveToHistory(
      question,
      newResultObj.guaMark,
      newResultObj.guaTitle,
      newResultObj.guaResult,
      newResultObj.guaChange
    );
  }

  const showResult = resultObj !== null;
  const inputQuestion = question === "";
  return (
    <main
      ref={flexRef}
      className="gap mx-auto flex h-0 w-[90%] flex-1 flex-col flex-nowrap items-center"
    >
      <Question question={question} setQuestion={handleSetQuestion} />

      {!resultAi && !inputQuestion && (
        <Coin
          onTransitionEnd={onTransitionEnd}
          frontList={frontList}
          rotation={rotation}
        />
      )}

      {!inputQuestion && !showResult && (
        <div className="relative">
          <span className="pl-2 text-lg font-medium">
            🎲 第{" "}
            <span className="font-mono text-xl font-bold text-orange-500">
              {count === 0 ? "-/-" : `${count}/6`}
            </span>{" "}
            次卜筮
          </span>
        </div>
      )}

      {!inputQuestion && hexagramList.length != 0 && (
        <div className="flex max-w-md gap-2">
          <Hexagram list={hexagramList} />
          {showResult && (
            <div className="flex flex-col justify-around gap-4 items-center">
              <Result {...resultObj} />



              <div className="flex flex-col gap-2 sm:px-6 w-full items-center">
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={restartClick}
                  disabled={rotation}
                  className="w-full"
                >
                  <ListRestart size={18} className="mr-1" />
                  重来
                </Button>
                <div className="flex gap-2 w-full justify-between">
                  {resultAi ? (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={!engineResultState || rotation}
                          className="flex-1"
                        >
                          <LayoutTemplate size={16} className="mr-1" />
                          排盘
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                        <DialogTitle>六爻排盘</DialogTitle>
                        {engineResultState && (
                          <LiuyaoPanel
                            result={engineResultState.result}
                            lunarDate={engineResultState.lunarDate}
                            xunKong={engineResultState.xunKong}
                          />
                        )}
                      </DialogContent>
                    </Dialog>
                  ) : (
                    <Button
                      size="sm"
                      onClick={aiClick}
                      disabled={rotation}
                      className="flex-1"
                    >
                      <BrainCircuit size={16} className="mr-1" />
                      AI 解读
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {resultAi && (
        <ResultAI
          completion={completion}
          isLoading={isLoading}
          onCompletion={onCompletion}
          error={error}
        />
      )}


    </main>
  );
}

export default Divination;
