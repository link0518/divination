'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Trash2, Eye, Clock, History as HistoryIcon, Search, Calendar, BookOpen, Sparkles, Filter } from 'lucide-react'

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

export default function History() {
  const [history, setHistory] = useState<HistoryRecord[]>([])
  const [filteredHistory, setFilteredHistory] = useState<HistoryRecord[]>([])
  const [selectedRecord, setSelectedRecord] = useState<HistoryRecord | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'with-ai' | 'without-ai'>('all')

  useEffect(() => {
    loadHistory()
  }, [])

  useEffect(() => {
    let filtered = history

    // 搜索过滤
    if (searchTerm.trim() !== '') {
      filtered = filtered.filter(record => 
        record.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.guaResult.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.interpretation.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // 类型过滤
    if (filterType === 'with-ai') {
      filtered = filtered.filter(record => record.interpretation && record.interpretation.trim() !== '')
    } else if (filterType === 'without-ai') {
      filtered = filtered.filter(record => !record.interpretation || record.interpretation.trim() === '')
    }

    setFilteredHistory(filtered)
  }, [history, searchTerm, filterType])

  const loadHistory = () => {
    const saved = localStorage.getItem('divination-history')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        const sortedHistory = parsed.sort((a: HistoryRecord, b: HistoryRecord) => b.timestamp - a.timestamp)
        setHistory(sortedHistory)
      } catch (error) {
        console.error('加载历史记录失败:', error)
      }
    }
  }

  const clearHistory = () => {
    if (confirm('确定要清空所有历史记录吗？此操作不可恢复。')) {
      localStorage.removeItem('divination-history')
      setHistory([])
      setFilteredHistory([])
    }
  }

  const deleteRecord = (id: string) => {
    if (confirm('确定要删除这条记录吗？')) {
      const newHistory = history.filter(record => record.id !== id)
      setHistory(newHistory)
      localStorage.setItem('divination-history', JSON.stringify(newHistory))
    }
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffTime = now.getTime() - timestamp
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) {
      return '今天 ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    } else if (diffDays === 1) {
      return '昨天 ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    } else if (diffDays < 7) {
      return `${diffDays}天前`
    } else {
      return date.toLocaleString('zh-CN', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }

  const getRecordIcon = (record: HistoryRecord) => {
    if (record.interpretation && record.interpretation.trim() !== '') {
      return <Sparkles className="h-4 w-4 text-yellow-500" />
    }
    return <BookOpen className="h-4 w-4 text-blue-500" />
  }

  const getFilterCount = (type: 'all' | 'with-ai' | 'without-ai') => {
    if (type === 'all') return history.length
    if (type === 'with-ai') return history.filter(r => r.interpretation && r.interpretation.trim() !== '').length
    return history.filter(r => !r.interpretation || r.interpretation.trim() === '').length
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" title="历史记录">
          <HistoryIcon className="h-[1.2rem] w-[1.2rem]" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl max-h-[85vh] w-[95vw]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <HistoryIcon size={24} />
            占卜历史记录
          </DialogTitle>
          <DialogDescription>
            查看您的占卜历史和AI解读结果，支持搜索和筛选
          </DialogDescription>
        </DialogHeader>
        
        {/* 搜索和筛选区域 */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="搜索问题、卦象或解读内容..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={filterType === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterType('all')}
                className="whitespace-nowrap"
              >
                全部 ({getFilterCount('all')})
              </Button>
              <Button
                variant={filterType === 'with-ai' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterType('with-ai')}
                className="whitespace-nowrap"
              >
                <Sparkles className="h-3 w-3 mr-1" />
                有解读 ({getFilterCount('with-ai')})
              </Button>
              <Button
                variant={filterType === 'without-ai' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterType('without-ai')}
                className="whitespace-nowrap"
              >
                <BookOpen className="h-3 w-3 mr-1" />
                仅卦象 ({getFilterCount('without-ai')})
              </Button>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-sm">
                显示 {filteredHistory.length} / {history.length} 条记录
              </Badge>
              {searchTerm && (
                <Badge variant="outline" className="text-sm">
                  搜索: &quot;{searchTerm}&quot;
                </Badge>
              )}
            </div>
            {history.length > 0 && (
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={clearHistory}
                className="shrink-0"
              >
                <Trash2 size={14} className="mr-1" />
                清空历史
              </Button>
            )}
          </div>
        </div>

        <ScrollArea className="h-[500px] pr-4">
          {filteredHistory.length === 0 ? (
            <div className="text-center text-muted-foreground py-12">
              <HistoryIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg mb-2">
                {history.length === 0 ? '暂无历史记录' : '没有找到匹配的记录'}
              </p>
              <p className="text-sm">
                {history.length === 0 ? '开始您的第一次占卜吧' : '尝试调整搜索条件或筛选类型'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredHistory.map((record, index) => (
                <Dialog key={record.id}>
                  <DialogTrigger asChild>
                    <Card className="relative hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start gap-3 min-w-0">
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <div className="flex items-center gap-2 mb-1 min-w-0">
                          {getRecordIcon(record)}
                          <h3 
                            className="text-base font-semibold flex-1 min-w-0" 
                            style={{
                              overflow: 'hidden !important',
                              textOverflow: 'ellipsis !important',
                              whiteSpace: 'nowrap !important',
                              maxWidth: '100%'
                            }}
                          >
                            {record.question}
                          </h3>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock size={12} />
                          {formatDate(record.timestamp)}
                          <Badge variant="outline" className="text-xs px-1 py-0">
                            #{index + 1}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-1 flex-shrink-0 ml-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteRecord(record.id);
                          }}
                          title="删除记录"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {record.guaMark}
                        </Badge>
                        <span className="text-sm font-medium text-primary truncate">
                          {record.guaResult}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {record.guaChange}
                      </div>
                      {record.interpretation && record.interpretation.trim() !== '' && (
                        <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded border-l-2 border-yellow-400">
                          <div className="flex items-center gap-1 mb-1">
                            <Sparkles size={10} />
                            <span className="font-medium">AI解读预览</span>
                          </div>
                          <div className="line-clamp-2">
                            {record.interpretation.substring(0, 120)}
                            {record.interpretation.length > 120 && '...'}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                    </Card>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl max-h-[80vh]">
                    <DialogHeader>
                      <DialogTitle className="text-left">{record.question}</DialogTitle>
                      <DialogDescription className="flex items-center gap-2">
                        <Calendar size={12} />
                        {formatDate(record.timestamp)}
                      </DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="max-h-[60vh]">
                      <div className="space-y-6 pr-4">
                        <div>
                          <h4 className="font-semibold mb-3 flex items-center gap-2">
                            <BookOpen size={16} />
                            卦象结果
                          </h4>
                          <div className="bg-muted/50 p-4 rounded-lg border">
                            <div className="font-medium text-primary mb-1">{record.guaTitle}</div>
                            <div className="text-lg font-semibold mb-2">{record.guaResult}</div>
                            <div className="text-sm text-muted-foreground italic">
                              {record.guaChange}
                            </div>
                          </div>
                        </div>
                        {record.interpretation && record.interpretation.trim() !== '' && (
                          <div>
                            <h4 className="font-semibold mb-3 flex items-center gap-2">
                              <Sparkles size={16} />
                              AI 解读
                            </h4>
                            <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 p-4 rounded-lg border whitespace-pre-wrap text-sm leading-relaxed">
                              {record.interpretation}
                            </div>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </DialogContent>
                </Dialog>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
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
