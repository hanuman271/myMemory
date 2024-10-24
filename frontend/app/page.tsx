"use client";

import { useState, useEffect } from "react";
import { Brain, Send, Sparkles, Calendar, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { initializeSocket, getSocket } from "@/lib/socket";

interface Message {
  type: 'user' | 'bot';
  content: string;
}

export default function Home() {
  const [chatInput, setChatInput] = useState("");
  const [memoryTopic, setMemoryTopic] = useState("");
  const [memoryContent, setMemoryContent] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { type: 'bot', content: 'Hello! I am your memory assistant. Ask me anything about your memories.' }
  ]);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const socket = initializeSocket();

    socket.on('connect', () => {
      console.log('Connected to server');
    });

    socket.on('set_user_id', (data) => {
      setUserId(data.user_id);
      socket.emit('join', { user_id: data.user_id });
    });

    socket.on('bot_response', (message) => {
      setMessages(prev => [...prev, { type: 'bot', content: message.data }]);
    });

    return () => {
      socket.off('connect');
      socket.off('set_user_id');
      socket.off('bot_response');
    };
  }, []);

  const handleChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !userId) return;
    
    const socket = getSocket();
    setMessages(prev => [...prev, { type: 'user', content: chatInput }]);
    socket.emit('user_message', { data: chatInput, user_id: userId });
    setChatInput("");
  };

  const handleMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memoryTopic.trim() || !memoryContent.trim()) return;
    
    try {
      const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000/';
      const response = await fetch(`${BACKEND_URL}save_memory/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ Topic: memoryTopic, memory: memoryContent })
      });
      
      const data = await response.json();
      console.log('Success:', data);
      alert("Memory saved!");
      setMemoryTopic("");
      setMemoryContent("");
    } catch (error) {
      console.error('Error:', error);
      alert("Failed to save memory.");
    }
  };

  return (
    <main className="h-screen bg-gradient-to-br from-background via-background/95 to-background/90 overflow-hidden">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-900 via-background to-background"></div>
      
      <div className="h-full container mx-auto px-4 py-4">
        <div className="text-center mb-6 relative">
          <div className="absolute inset-0 -z-10 blur-3xl opacity-30 bg-gradient-to-r from-gray-500/40 via-gray-600/20 to-gray-500/40 rounded-full"></div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-2 bg-gradient-to-r from-gray-200 to-gray-400 bg-clip-text text-transparent flex items-center justify-center gap-3">
            <Sparkles className="w-8 h-8 text-gray-300" />
            MyMemory
          </h1>
          <p className="text-muted-foreground italic text-sm">
            A place for your life&apos;s memories and moments.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4 h-[calc(100vh-160px)]">
          <Card className="bg-black/40 backdrop-blur-xl border-gray-800 shadow-xl">
            <CardHeader className="py-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Brain className="w-5 h-5 text-gray-300" />
                Chat with MyMemory
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[calc(100vh-300px)] mb-4 rounded-lg bg-black/20 p-4">
                <div className="space-y-4">
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={cn(
                        "flex gap-2 p-3 rounded-lg",
                        message.type === 'user' 
                          ? "ml-auto bg-gray-800/50 backdrop-blur-sm max-w-[80%]" 
                          : "mr-auto bg-gray-900/50 backdrop-blur-sm max-w-[80%]"
                      )}
                    >
                      {message.type === 'bot' && <Brain className="w-5 h-5 text-gray-300 shrink-0" />}
                      <p className="text-sm">{message.content}</p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <form onSubmit={handleChat} className="flex gap-2">
                <Input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask me something..."
                  className="bg-black/30 backdrop-blur-sm border-gray-800"
                />
                <Button type="submit" size="icon" className="bg-gray-800 hover:bg-gray-700 text-white">
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="bg-black/40 backdrop-blur-xl border-gray-800 shadow-xl">
            <CardHeader className="py-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Brain className="w-5 h-5 text-gray-300" />
                Feed Your Memories
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleMemory} className="space-y-4">
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="text-sm text-gray-400 mb-1 flex items-center gap-2">
                      <Tag className="w-4 h-4" /> Topic
                    </label>
                    <Input
                      value={memoryTopic}
                      onChange={(e) => setMemoryTopic(e.target.value)}
                      placeholder="E.g., First Kiss, Graduation"
                      className="bg-black/30 backdrop-blur-sm border-gray-800"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Memory Details</label>
                  <Textarea
                    value={memoryContent}
                    onChange={(e) => setMemoryContent(e.target.value)}
                    placeholder="Describe your memory in detail..."
                    className="min-h-[calc(100vh-460px)] bg-black/30 backdrop-blur-sm border-gray-800 resize-none"
                  />
                </div>     
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="secondary" className="bg-gray-800/50 hover:bg-gray-700/50">
                    #personal
                  </Badge>
                  <Badge variant="secondary" className="bg-gray-800/50 hover:bg-gray-700/50">
                    #milestone
                  </Badge>
                  <Badge variant="secondary" className="bg-gray-800/50 hover:bg-gray-700/50">
                    #life
                  </Badge>
                </div>
                <Button type="submit" className="w-full bg-gray-800/50 hover:bg-gray-700 text-white">
                  Save Memory
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}