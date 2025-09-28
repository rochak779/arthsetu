import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, Send, Bot, User, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
}

export const EducationChatbot = () => {
  // Helper for detailed request/response logging
  const fetchWithLogs = async (
    url: string,
    init: (RequestInit & { timeoutMs?: number }) | undefined,
    context: { tag: string }
  ) => {
    const { timeoutMs = 20000, ...opts } = init || {};
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), timeoutMs);
    const started = performance.now();
    const reqId = Math.random().toString(36).slice(2, 8);
    try {
      console.info(
        `[Chatbot][req ${reqId}] ${context.tag} → POST %s`,
        url,
        {
          headers: opts.headers ?? {},
          hasBody: opts.body != null,
          timeoutMs,
        }
      );
      const res = await fetch(url, { ...opts, signal: ctrl.signal });
      const ms = Math.round(performance.now() - started);
      const text = await res.text();
      console.info(
        `[Chatbot][res ${reqId}] ${context.tag} ← %s in %dms`,
        res.status,
        ms,
        { ok: res.ok, len: text.length, preview: text.slice(0, 300) }
      );
      return { res, text, ms } as const;
    } catch (e: unknown) {
      const ms = Math.round(performance.now() - started);
      const errMsg = (typeof e === 'object' && e && 'message' in e)
        ? String((e as { message: unknown }).message)
        : String(e);
      console.error(`[Chatbot][err ${reqId}] ${context.tag} after ${ms}ms:`, errMsg);
      throw e;
    } finally {
      clearTimeout(to);
    }
  };

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Hi! I'm your investment education assistant. Ask me anything about trading, investing, or market fundamentals!",
      sender: "bot",
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState(() => {
    const savedRaw = localStorage.getItem("education-chatbot-webhook-url") ?? "";
    const saved = savedRaw.trim();
    const envUrl = import.meta.env.VITE_CHATBOT_WEBHOOK_URL ?? undefined;
    const isProd = import.meta.env.PROD;

    const isValid = (u?: string) => !!u && /^https?:\/\//i.test(u);

    // Resolve initial URL:
    // - In PROD: use env if valid, else empty (force configuration)
    // - In DEV: prefer saved if valid; otherwise fall back to valid env; else empty until user sets it
    const finalUrl = isProd
      ? (isValid(envUrl) ? envUrl! : "")
      : (isValid(saved) ? saved : (isValid(envUrl) ? envUrl! : ""));

    console.info("[Chatbot] Using webhook URL:", finalUrl, { isProd, envUrl, hasSaved: saved.length > 0 });
    return finalUrl;
  });
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    const isProd = import.meta.env.PROD;
    if (isProd) return;
    // Only persist valid URLs in dev; remove key if invalid to avoid sticky bad values
    if (webhookUrl && /^https?:\/\//i.test(webhookUrl)) {
      localStorage.setItem("education-chatbot-webhook-url", webhookUrl);
    } else {
      localStorage.removeItem("education-chatbot-webhook-url");
    }
  }, [webhookUrl]);

  const validateUrl = (url: string): boolean => {
    try {
      new URL(url);
      return url.startsWith('http://') || url.startsWith('https://');
    } catch {
      return false;
    }
  };

  const testConnection = async () => {
    if (!validateUrl(webhookUrl)) {
      const isProd = import.meta.env.PROD;
      toast({
        title: isProd ? "Webhook not configured" : "Invalid URL",
        description: isProd
          ? "Set VITE_CHATBOT_WEBHOOK_URL to your Supabase Function URL and redeploy."
          : "Please enter a valid webhook URL starting with http:// or https://",
        variant: "destructive",
      });
      return;
    }

    setIsTestingConnection(true);
    try {
      const { res, text } = await fetchWithLogs(
        webhookUrl,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: "Connection test",
            timestamp: new Date().toISOString(),
            source: "education_chatbot_test",
          }),
          timeoutMs: 15000,
        },
        { tag: "testConnection" }
      );

      if (res.ok) {
        toast({
          title: "Connection Successful",
          description: "Webhook is responding correctly!",
        });
      } else {
        toast({
          title: "Connection Failed",
          description: `Status ${res.status}. Body: ${text.slice(0, 140)}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      let description = "Failed to connect to webhook.";
      
      if (errorMessage.includes("CORS")) {
        description = "CORS error: Webhook must allow requests from this domain.";
      } else if (errorMessage.includes("network")) {
        description = "Network error: Check your internet connection and webhook URL.";
      }
      
      toast({
        title: "Connection Test Failed",
        description,
        variant: "destructive",
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const sendMessage = async (retryCount = 0) => {
    if (!inputValue.trim()) return;
    
    if (!validateUrl(webhookUrl)) {
      const isProd = import.meta.env.PROD;
      toast({
        title: isProd ? "Webhook not configured" : "Invalid Webhook URL",
        description: isProd
          ? "Set VITE_CHATBOT_WEBHOOK_URL to your Supabase Function URL and redeploy."
          : "Please enter a valid webhook URL starting with http:// or https://",
        variant: "destructive",
      });
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: "user",
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const { res, text } = await fetchWithLogs(
        webhookUrl,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: userMessage.text,
            timestamp: new Date().toISOString(),
            source: "education_chatbot",
          }),
          timeoutMs: 20000,
        },
        { tag: "sendMessage" }
      );

      if (res.ok) {
        let data: unknown;
        try { data = JSON.parse(text); } catch { data = { response: text } as { response: string }; }
        const responseText = (() => {
          if (typeof data === 'string') return data;
          if (data && typeof data === 'object') {
            const obj = data as Record<string, unknown>;
            if (typeof obj.response === 'string') return obj.response;
            if (typeof obj.text === 'string') return obj.text;
          }
          return "I received your question and I'm processing it. Let me think about the best way to help you learn!";
        })();
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: responseText,
          sender: "bot",
          timestamp: new Date()
        };
        setMessages(prev => [...prev, botMessage]);
      } else {
        throw new Error(`Server responded with status ${res.status}: ${text.slice(0, 280)}`);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      
      // Retry logic for network errors
      if (retryCount < 2 && error instanceof Error && (
        error.message.includes("network") || 
        error.message.includes("fetch")
      )) {
        setTimeout(() => sendMessage(retryCount + 1), 1000 * (retryCount + 1));
        return;
      }
      
      let errorText = "I'm having trouble connecting right now. Please try again later or check your webhook configuration.";
      let toastDescription = "Failed to connect to the chatbot service. Please check your webhook URL.";
      
      const errorString = error instanceof Error ? error.message : "Unknown error";
      
      if (errorString.includes("CORS")) {
        errorText = "There's a CORS (Cross-Origin) issue with the webhook. Please configure your webhook to allow requests from this domain.";
        toastDescription = "CORS error: The webhook must be configured to accept requests from this domain.";
      } else if (errorString.includes("404")) {
        errorText = "The webhook endpoint was not found. Please check the URL path.";
        toastDescription = "404 error: Webhook endpoint not found. Please verify the URL.";
      } else if (errorString.includes("500")) {
        errorText = "The webhook server encountered an error. Please try again later.";
        toastDescription = "Server error: The webhook service is experiencing issues.";
      } else if (/\b(401|403)\b/.test(errorString)) {
        errorText = "The webhook rejected the request (auth/permission). Verify any required keys or access rules.";
        toastDescription = "Auth error: The webhook responded with 401/403.";
      }
      
      const botErrorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: errorText,
        sender: "bot",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botErrorMessage]);
      
      toast({
        title: "Connection Error",
        description: toastDescription,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-24 right-4 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          size="lg"
          className="rounded-full h-14 w-14 shadow-lg hover:scale-105 transition-transform"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-24 right-4 z-50 w-80 sm:w-96">
      <Card className="h-96 shadow-xl border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              Academy Assistant
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-0 flex flex-col h-full">
          <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-2 ${
                    message.sender === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {message.sender === "bot" && (
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] p-3 rounded-lg text-sm ${
                      message.sender === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {message.text}
                  </div>
                  {message.sender === "user" && (
                    <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4 text-accent" />
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-2 justify-start">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                  <div className="bg-muted text-muted-foreground p-3 rounded-lg text-sm">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-current rounded-full animate-pulse"></div>
                      <div className="w-2 h-2 bg-current rounded-full animate-pulse delay-100"></div>
                      <div className="w-2 h-2 bg-current rounded-full animate-pulse delay-200"></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
          
          <div className="p-4 border-t">
            <div className="flex gap-2 mb-2">
              <Input
                placeholder="Ask about investing, trading, or markets..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isLoading}
                className="flex-1"
              />
                <Button
                  onClick={() => sendMessage()}
                  disabled={isLoading || !inputValue.trim()}
                  size="sm"
                >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            
            {!import.meta.env.PROD && (
              <div className="space-y-2 text-xs">
                <div className="flex gap-2">
                  <Input
                    placeholder="Webhook URL (e.g., http://localhost:54321/functions/v1/chatbot-webhook)"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    className="text-xs h-8 flex-1"
                  />
                  <Button
                    onClick={testConnection}
                    disabled={isTestingConnection || !webhookUrl.trim()}
                    size="sm"
                    variant="outline"
                    className="h-8 px-3 text-xs"
                  >
                    {isTestingConnection ? "Testing..." : "Test"}
                  </Button>
                </div>
                {!validateUrl(webhookUrl) && webhookUrl.trim() && (
                  <p className="text-destructive text-xs">Please enter a valid URL starting with http:// or https://</p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};