import React, { createRef } from "react";
import clsx from "clsx";
import todayJson from "@/lib/data/today.json";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import Image from "next/image";

interface TodayItem {
  display: string;
  supplement: string;
}

const todayData: TodayItem[] = todayJson;

function Question(props: { question: string; setQuestion: any; questionSupplement?: string }) {
  const inputRef = createRef<HTMLTextAreaElement>();

  function startClick() {
    const value = inputRef.current?.value;
    if (value === "") {
      return;
    }
    // 手动输入的问题，显示和解读都用同一个内容
    props.setQuestion(value, value);
  }

  function todayClick(index: number) {
    const item = todayData[index];
    // 页面显示用display，AI解读用supplement
    props.setQuestion(item.display, item.supplement);
  }

  return (
    <div
      className={clsx(
        "ignore-animate flex w-full max-w-md flex-col gap-4",
        props.question || "pt-6",
      )}
    >
      {props.question === "" ? (
        <>
          <label>您想算点什么？</label>
          <Textarea
            ref={inputRef}
            placeholder="毛毛狐 将 为您解读"
            className="resize-none"
            rows={4}
          />
          <div className="flex flex-row-reverse">
            <Button size="sm" onClick={startClick}>
              开始
            </Button>
          </div>

          <label className="mt-16 underline underline-offset-4">
            🧐 让我猜猜您算什么东西？
          </label>
          <div className="flex flex-wrap gap-3">
            {todayData.map(function (item, index) {
              return (
                <span
                  key={index}
                  onClick={() => {
                    todayClick(index);
                  }}
                  className="rounded-md border bg-secondary p-2 text-sm text-muted-foreground shadow transition hover:scale-[1.03] dark:border-0 dark:text-foreground/80 dark:shadow-none"
                >
                  {item.display}
                </span>
              );
            })}
          </div>
        </>
      ) : null}

      {props.question && (
        <div className="flex truncate rounded-md border bg-secondary p-2 shadow dark:border-0 dark:shadow-none">
          <Image
            width={24}
            height={24}
            className="mr-2"
            src="/img/yin-yang.webp"
            alt="yinyang"
          />
          {props.question}
        </div>
      )}
    </div>
  );
}

export default Question;
