'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Logo } from '@/components/Logo'
import { chatbaseService, ChatbaseMessage } from '@/lib/chatbase'
import { 
  Send, 
  Bot, 
  User, 
  ArrowLeft, 
  Loader2, 
  Copy, 
  ThumbsUp, 
  ThumbsDown,
  RefreshCw,
  Sparkles,
  MessageSquare,
  Zap,
  Lightbulb,
  BookOpen,
  Headphones,
  FileText
} from 'lucide-react'

interface Message {
  id: string
  text: string
  isUser: boolean
  timestamp: Date
}

interface QuickReply {
  id: string
  text: string
  icon: any
  category: string
}

export default function AIAssistantPage() {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "This AI chatbot provides general information about OMNI products and services. Although we strive to provide reliable information, responses may not reflect current specifications or requirements.  The information provided does not constitute a formal technical advice. For official guidance or on complex topics, please contact a qualified OMNI representative at helpdesk@omniflow.com",
      isUser: false,
      timestamp: new Date(),
    },
  ])
  const [inputText, setInputText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [showQuickReplies, setShowQuickReplies] = useState(true)
  const [chatId, setChatId] = useState<string | undefined>()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const quickReplies: QuickReply[] = [
    { id: '1', text: 'What products do you offer?', icon: FileText, category: 'Products' },
    { id: '2', text: 'How can I get support?', icon: Headphones, category: 'Support' },
    { id: '3', text: 'Tell me about your services', icon: BookOpen, category: 'Services' },
    { id: '4', text: 'What are your business hours?', icon: Lightbulb, category: 'General' },
    { id: '5', text: 'How do I place an order?', icon: Zap, category: 'Orders' },
    { id: '6', text: 'Technical documentation', icon: BookOpen, category: 'Documentation' },
  ]

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Remove markdown formatting from text
  const cleanMarkdown = (text: string): string => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold (**text** -> text)
      .replace(/\*(.*?)\*/g, '$1') // Remove italic (*text* -> text)
      .replace(/__(.*?)__/g, '$1') // Remove bold (__text__ -> text)
      .replace(/_(.*?)_/g, '$1') // Remove italic (_text_ -> text)
      .replace(/~~(.*?)~~/g, '$1') // Remove strikethrough (~~text~~ -> text)
      .replace(/`(.*?)`/g, '$1') // Remove inline code (`text` -> text)
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async () => {
    if (!inputText.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      isUser: true,
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setInputText('')
    setIsTyping(true)
    setShowQuickReplies(false)

    try {
      const response = await chatbaseService.sendMessage(inputText, chatId)
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: cleanMarkdown(response.text),
        isUser: false,
        timestamp: new Date(),
      }

      setMessages(prev => [...prev, aiMessage])
    } catch (error) {
      console.error('Error sending message:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Sorry, I encountered an error. Please try again.',
        isUser: false,
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsTyping(false)
    }
  }

  const handleQuickReply = (reply: QuickReply) => {
    setInputText(reply.text)
    setShowQuickReplies(false)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const clearChat = () => {
    setMessages([
      {
        id: '1',
        text: "Hello! I'm your Omni AI Assistant. How can I help you today?",
        isUser: false,
        timestamp: new Date(),
      },    
    ])
    setShowQuickReplies(true)
    setChatId(undefined)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200/50 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => router.push('/home')}
                className="flex items-center gap-2 px-3"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center space-x-3">
                <div className="w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-green-100"></div>
                <div>
                  <h1 className="text-xl font-bold text-slate-900">AI Assistant</h1>
                  <p className="text-sm text-slate-600">Online</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={clearChat}
                className="flex items-center gap-2 px-4 py-2"
              >
                <RefreshCw className="h-4 w-4" />
                Clear Chat
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-8 h-[calc(100vh-200px)]">
          {/* Chat Area */}
          <div className="flex-1 min-w-0">
            <Card className="h-full border-0 shadow-sm">
              <CardContent className="p-0 h-full flex flex-col">
                {/* Messages */}
                <div className="flex-1 p-8 overflow-y-auto">
                  <div className="space-y-8 max-w-5xl mx-auto">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.isUser ? 'justify-end' : 'justify-start'} mb-3.5 px-1`}
                      >
                        <div className={`flex max-w-[75%] ${message.isUser ? 'flex-row-reverse' : 'flex-row'} items-end`}>
                          {!message.isUser && (
                            <div className="w-8 h-8 bg-gradient-to-br from-red-600 to-red-700 rounded-full flex items-center justify-center mr-2 mb-0.5 shadow-lg">
                              <Sparkles className="h-4 w-4 text-white" />
                            </div>
                          )}
                          <div className={`flex-1 ${message.isUser ? 'text-right' : 'text-left'}`}>
                            <div className={`inline-block p-4 rounded-2xl ${
                              message.isUser
                                ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-br-sm'
                                : 'bg-white border border-slate-200 text-slate-900 rounded-bl-sm shadow-sm'
                            }`}>
                              <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.text}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {isTyping && (
                      <div className="flex justify-start mb-3.5 px-1">
                        <div className="flex items-end">
                          <div className="w-8 h-8 bg-gradient-to-br from-red-600 to-red-700 rounded-full flex items-center justify-center mr-2 mb-0.5 shadow-lg">
                            <Sparkles className="h-4 w-4 text-white" />
                          </div>
                          <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-sm p-4 shadow-sm">
                            <div className="flex items-center space-x-2">
                              <div className="flex space-x-1">
                                <div className="w-2 h-2 bg-red-600 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-red-600 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                                <div className="w-2 h-2 bg-red-600 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div ref={messagesEndRef} />
                  </div>
                </div>

                {/* Input Area */}
                <div className="bg-white border-t border-slate-200 p-4">
                  <div className="flex items-center bg-slate-50 rounded-3xl px-4 py-2">
                    <input
                      type="text"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type your message..."
                      className="flex-1 border-0 bg-transparent focus:ring-0 focus:border-0 focus:outline-none text-sm py-2"
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!inputText.trim() || isTyping}
                      className={`w-10 h-10 rounded-full p-0 transition-all duration-200 ${
                        inputText.trim() 
                          ? 'bg-gradient-to-br from-red-600 to-red-700 hover:from-red-700 hover:to-red-800' 
                          : 'bg-slate-300'
                      }`}
                    >
                      <Send className="h-4 w-4 text-white" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Replies Sidebar */}
          <div className="w-full lg:w-80 flex-shrink-0">
            <Card className="h-full border-0 shadow-sm">
              <CardContent className="p-6 h-full flex flex-col">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">Quick Replies</h3>
                  <p className="text-sm text-slate-600">Click to ask common questions</p>
                </div>
                
                <div className="flex-1 overflow-y-auto">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Quick actions</div>
                  <div className="flex flex-wrap gap-2">
                    {quickReplies.map((reply, index) => {
                      const Icon = reply.icon
                      const gradients = [
                        'from-blue-500 to-blue-600',
                        'from-purple-500 to-purple-600', 
                        'from-green-500 to-green-600',
                        'from-orange-500 to-orange-600',
                        'from-pink-500 to-pink-600',
                        'from-indigo-500 to-indigo-600'
                      ]
                      return (
                        <Button
                          key={reply.id}
                          onClick={() => handleQuickReply(reply)}
                          className={`bg-gradient-to-r ${gradients[index]} text-white rounded-2xl px-4 py-3 text-sm font-semibold shadow-lg hover:shadow-xl transition-all flex items-center gap-2`}
                        >
                          <Icon className="h-4 w-4" />
                          {reply.text}
                        </Button>
                      )
                    })}
                  </div>
                </div>

              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}