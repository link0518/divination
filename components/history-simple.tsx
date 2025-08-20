'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'

interface HistoryRecord {
  id: string
  question: string
  hexagram: string
  hexagramName: string
  interpretation: string
  timestamp: number
  guaMark: string
  guaTitle: string
  guaResult: string
  guaChange: string
}

export default function HistorySimple() {
  const [history, setHistory] = useState<HistoryRecord[]>([])
  const [selectedRecord, setSelectedRecord] = useState<HistoryRecord | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    loadHistory()
  }, [])

  const loadHistory = () => {
    const saved = localStorage.getItem('divination-history')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setHistory(parsed.sort((a: HistoryRecord, b: HistoryRecord) => b.timestamp - a.timestamp))
      } catch (error) {
        console.error('加载历史记录失败:', error)
      }
    }
  }

  const clearHistory = () => {
    localStorage.removeItem('divination-history')
    setHistory([])
  }

  const deleteRecord = (id: string) => {
    const newHistory = history.filter(record => record.id !== id)
    setHistory(newHistory)
    localStorage.setItem('divination-history', JSON.stringify(newHistory))
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (!isOpen) {
    return (
      <Button variant="outline" size="sm" onClick={() => setIsOpen(true)}>
        📚 历史记录 ({history.length})
      </Button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl max-h-[80vh] w-full mx-4 overflow-hidden">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">📚 占卜历史记录</h2>
          <button 
            onClick={() => setIsOpen(false)}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>
        
        <div className="flex justify-between items-center mb-4">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            共 {history.length} 条记录
          </span>
          {history.length > 0 && (
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={clearHistory}
            >
              🗑️ 清空历史
            </Button>
          )}
        </div>

        <div className="overflow-y-auto max-h-[60vh]">
          {history.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              暂无历史记录
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((record) => (
                <div key={record.id} className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-700">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h3 className="font-medium text-lg">{record.question}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        🕒 {formatDate(record.timestamp)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setSelectedRecord(selectedRecord?.id === record.id ? null : record)}
                        className="text-blue-500 hover:text-blue-700 text-sm"
                      >
                        {selectedRecord?.id === record.id ? '收起' : '查看详情'}
                      </button>
                      <button 
                        onClick={() => deleteRecord(record.id)}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                  
                  <div className="text-sm mb-2">
                    <div className="font-medium text-blue-600 dark:text-blue-400">{record.guaResult}</div>
                    <div className="text-gray-600 dark:text-gray-300">{record.guaChange}</div>
                  </div>

                  {selectedRecord?.id === record.id && (
                    <div className="mt-4 p-4 bg-white dark:bg-gray-600 rounded border">
                      <h4 className="font-medium mb-2">🔮 卦象详情</h4>
                      <div className="mb-4 p-3 bg-gray-100 dark:bg-gray-500 rounded">
                        <div className="font-medium">{record.guaTitle}</div>
                        <div className="text-blue-600 dark:text-blue-400">{record.guaResult}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-300 italic">
                          {record.guaChange}
                        </div>
                      </div>
                      {record.interpretation && (
                        <div>
                          <h4 className="font-medium mb-2">🤖 AI 解读</h4>
                          <div className="bg-gray-100 dark:bg-gray-500 p-3 rounded whitespace-pre-wrap text-sm">
                            {record.interpretation}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// 保存历史记录的工具函数
export const saveToHistory = (
  question: string,
  guaMark: string,
  guaTitle: string,
  guaResult: string,
  guaChange: string,
  interpretation?: string
) => {
  const saved = localStorage.getItem('divination-history')
  let history: HistoryRecord[] = []
  
  if (saved) {
    try {
      history = JSON.parse(saved)
    } catch (error) {
      console.error('解析历史记录失败:', error)
    }
  }

  // 查找是否已存在相同的记录（基于问题和卦象匹配）
  const existingIndex = history.findIndex(record => 
    record.question === question && 
    record.guaMark === guaMark &&
    record.guaResult === guaResult &&
    record.guaChange === guaChange
  )

  if (existingIndex !== -1) {
    // 如果找到已存在的记录
    if (interpretation && interpretation.trim() !== '') {
      // 如果提供了AI解读，则更新该记录
      history[existingIndex].interpretation = interpretation
    }
    // 如果没有提供AI解读，说明是重复调用，直接返回不做任何操作
  } else {
    // 如果没有找到相同记录，则创建新记录
    const timestamp = Date.now()
    const record: HistoryRecord = {
      id: `${timestamp}-${Math.random().toString(36).substr(2, 9)}`,
      question,
      hexagram: guaMark,
      hexagramName: guaResult,
      interpretation: interpretation || '',
      timestamp,
      guaMark,
      guaTitle,
      guaResult,
      guaChange
    }
    history.unshift(record)
  }
  
  // 限制历史记录数量，最多保存100条
  if (history.length > 100) {
    history = history.slice(0, 100)
  }

  localStorage.setItem('divination-history', JSON.stringify(history))
}
