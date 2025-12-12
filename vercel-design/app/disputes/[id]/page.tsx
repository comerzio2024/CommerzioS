"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import {
  FileText,
  MessageSquare,
  ArrowLeft,
  Send,
  Paperclip,
  ImageIcon,
  Bot,
  Gavel,
  ThumbsUp,
  ThumbsDown,
  AlertCircle,
  Sparkles,
  Brain,
  ChevronDown,
  ChevronUp,
  Eye,
  ExternalLink,
  Timer,
  HandshakeIcon,
  RefreshCw,
  Check,
  HelpCircle,
  Info,
} from "lucide-react"
import { cn } from "@/lib/utils"

// Types
interface ChatMessage {
  id: string
  sender: "customer" | "vendor" | "system" | "ai"
  senderName: string
  senderAvatar?: string
  content: string
  timestamp: string
  attachments?: { name: string; url: string; type: string }[]
  isProposal?: boolean
  proposalData?: ConsensusProposal
}

interface Evidence {
  id: string
  type: "image" | "document" | "receipt" | "screenshot"
  name: string
  url: string
  uploadedBy: "customer" | "vendor"
  uploadedAt: string
  description: string
}

interface AIProposal {
  model: string
  recommendation: string
  refundAmount: number
  refundPercentage: number
  reasoning: string
  confidence: number
}

interface ConsensusProposal {
  proposalNumber: 1 | 2 | 3
  recommendation: string
  refundAmount: number
  refundPercentage: number
  reasoning: string
  aiConsensus: {
    claude: AIProposal
    gpt: AIProposal
    gemini: AIProposal
  }
  aggregatedConfidence: number
  votingResult: "unanimous" | "majority" | "split"
  status?: "pending" | "accepted" | "rejected"
  respondedBy?: "customer" | "vendor" | "both"
}

interface FinalVerdict {
  decision: string
  refundAmount: number
  reasoning: string
  appealInstructions: string
  nextSteps: string[]
  aiConsensus: {
    claude: AIProposal
    gpt: AIProposal
    gemini: AIProposal
  }
  confidence: number
  issuedAt: string
}

// Mock dispute data
const mockDispute = {
  id: "DSP-2024-001",
  bookingId: "BKG-2024-456",
  serviceType: "Kitchen Renovation",
  status: "phase_2",
  phase: 2 as 1 | 2 | 3,
  disputedAmount: 2850.0,
  customer: {
    id: "cust-123",
    name: "Sarah Mueller",
    avatar: "/professional-woman-diverse.png",
    email: "sarah.m@email.com",
  },
  vendor: {
    id: "vend-456",
    name: "Premium Renovations GmbH",
    avatar: "/construction-company-logo.png",
    email: "info@premiumreno.ch",
  },
  customerClaim:
    "The vendor did not complete the agreed countertop installation. The cabinets were installed incorrectly and there is visible damage to the wall.",
  vendorResponse:
    "We completed 90% of the work as agreed. The countertop delay was due to supply chain issues which we communicated. Minor wall touch-ups were scheduled for follow-up.",
  filedAt: "2024-01-15T10:30:00Z",
  phase1Deadline: "2024-01-17T10:30:00Z",
  lastActivity: "2024-01-16T14:22:00Z",
}

const mockChatHistory: ChatMessage[] = [
  {
    id: "1",
    sender: "system",
    senderName: "System",
    content: "Dispute filed. Both parties have 48 hours to reach an amicable resolution.",
    timestamp: "2024-01-15T10:30:00Z",
  },
  {
    id: "2",
    sender: "customer",
    senderName: "Sarah Mueller",
    senderAvatar: "/professional-woman-diverse.png",
    content:
      "I'm very disappointed with the work. The countertops were never installed and the cabinets are crooked. I have photos showing the damage.",
    timestamp: "2024-01-15T10:35:00Z",
    attachments: [
      { name: "cabinet_damage.jpg", url: "#", type: "image" },
      { name: "missing_countertop.jpg", url: "#", type: "image" },
    ],
  },
  {
    id: "3",
    sender: "vendor",
    senderName: "Premium Renovations GmbH",
    senderAvatar: "/construction-company-logo.png",
    content:
      "We apologize for the inconvenience. The countertop material was delayed by our supplier. We did communicate this delay via email on Jan 10th. The cabinets were installed per specification - I can provide the installation measurements.",
    timestamp: "2024-01-15T14:20:00Z",
    attachments: [
      { name: "email_communication.pdf", url: "#", type: "document" },
      { name: "installation_specs.pdf", url: "#", type: "document" },
    ],
  },
  {
    id: "4",
    sender: "customer",
    senderName: "Sarah Mueller",
    senderAvatar: "/professional-woman-diverse.png",
    content:
      "I never received that email. And the cabinets are clearly not level - look at the gap on the left side. This is unacceptable for the price I paid.",
    timestamp: "2024-01-15T15:45:00Z",
  },
  {
    id: "5",
    sender: "vendor",
    senderName: "Premium Renovations GmbH",
    senderAvatar: "/construction-company-logo.png",
    content:
      "We can send a technician to adjust the cabinets at no extra cost. For the countertop, we can either wait for the material (2 more weeks) or offer a 15% discount to use an alternative material.",
    timestamp: "2024-01-16T09:15:00Z",
  },
  {
    id: "6",
    sender: "customer",
    senderName: "Sarah Mueller",
    senderAvatar: "/professional-woman-diverse.png",
    content: "15% is not enough given all the issues. I want at least 40% refund and the work completed properly.",
    timestamp: "2024-01-16T11:30:00Z",
  },
  {
    id: "7",
    sender: "vendor",
    senderName: "Premium Renovations GmbH",
    senderAvatar: "/construction-company-logo.png",
    content:
      "40% is too much - we've completed most of the work. We can offer 20% maximum plus free cabinet adjustment.",
    timestamp: "2024-01-16T14:22:00Z",
  },
  {
    id: "8",
    sender: "system",
    senderName: "System",
    content:
      "48-hour amicable resolution period has ended without agreement. The dispute is now escalating to Phase 2: AI-Assisted Mediation.",
    timestamp: "2024-01-17T10:30:00Z",
  },
]

const mockEvidence: Evidence[] = [
  {
    id: "ev-1",
    type: "image",
    name: "cabinet_damage.jpg",
    url: "/damaged-kitchen-cabinet.jpg",
    uploadedBy: "customer",
    uploadedAt: "2024-01-15T10:35:00Z",
    description: "Photo showing misaligned cabinet doors",
  },
  {
    id: "ev-2",
    type: "image",
    name: "missing_countertop.jpg",
    url: "/kitchen-without-countertop.jpg",
    uploadedBy: "customer",
    uploadedAt: "2024-01-15T10:35:00Z",
    description: "Kitchen with missing countertop installation",
  },
  {
    id: "ev-3",
    type: "document",
    name: "original_contract.pdf",
    url: "#",
    uploadedBy: "customer",
    uploadedAt: "2024-01-15T10:40:00Z",
    description: "Original service contract with scope of work",
  },
  {
    id: "ev-4",
    type: "document",
    name: "email_communication.pdf",
    url: "#",
    uploadedBy: "vendor",
    uploadedAt: "2024-01-15T14:20:00Z",
    description: "Email thread about countertop delay",
  },
  {
    id: "ev-5",
    type: "receipt",
    name: "payment_receipt.pdf",
    url: "#",
    uploadedBy: "customer",
    uploadedAt: "2024-01-15T10:42:00Z",
    description: "Payment receipt for CHF 2,850.00",
  },
]

export default function DisputeDetailPage() {
  const params = useParams()
  const disputeId = params.id as string

  const [dispute] = useState(mockDispute)
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>(mockChatHistory)
  const [evidence] = useState<Evidence[]>(mockEvidence)
  const [newMessage, setNewMessage] = useState("")
  const [currentPhase, setCurrentPhase] = useState<1 | 2 | 3>(2)
  const [isGeneratingProposals, setIsGeneratingProposals] = useState(false)
  const [proposals, setProposals] = useState<ConsensusProposal[]>([])
  const [currentProposalIndex, setCurrentProposalIndex] = useState(0)
  const [finalVerdict, setFinalVerdict] = useState<FinalVerdict | null>(null)
  const [showAIDetails, setShowAIDetails] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState("chat")
  const [timeRemaining, setTimeRemaining] = useState({ hours: 0, minutes: 0, seconds: 0 })

  const chatEndRef = useRef<HTMLDivElement>(null)

  // Calculate time remaining for current phase
  useEffect(() => {
    const calculateTimeRemaining = () => {
      const deadline = new Date(dispute.phase1Deadline)
      const now = new Date()
      const diff = deadline.getTime() - now.getTime()

      if (diff > 0) {
        const hours = Math.floor(diff / (1000 * 60 * 60))
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((diff % (1000 * 60)) / 1000)
        setTimeRemaining({ hours, minutes, seconds })
      } else {
        setTimeRemaining({ hours: 0, minutes: 0, seconds: 0 })
      }
    }

    calculateTimeRemaining()
    const interval = setInterval(calculateTimeRemaining, 1000)
    return () => clearInterval(interval)
  }, [dispute.phase1Deadline])

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [chatHistory])

  // Generate AI proposals
  const generateProposals = async () => {
    setIsGeneratingProposals(true)

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 3000))

    const generatedProposals: ConsensusProposal[] = [
      {
        proposalNumber: 1,
        recommendation: "35% refund (CHF 997.50) with guaranteed completion of remaining work within 2 weeks",
        refundAmount: 997.5,
        refundPercentage: 35,
        reasoning:
          "Based on analysis of 8 chat messages and 5 evidence items, the customer's concerns about cabinet alignment and missing countertop are well-documented. The vendor's communication about delays was not effectively received. This proposal balances both parties' positions.",
        aiConsensus: {
          claude: {
            model: "Claude Opus 4.5",
            recommendation: "35% refund with completion guarantee",
            refundAmount: 997.5,
            refundPercentage: 35,
            reasoning:
              "Evidence strongly supports customer's claims about incomplete work. Vendor showed good faith in offering fixes but communication gaps occurred.",
            confidence: 0.88,
          },
          gpt: {
            model: "GPT-5.1",
            recommendation: "32% refund with service credit",
            refundAmount: 912.0,
            refundPercentage: 32,
            reasoning: "Mixed responsibility detected. Customer concerns valid but vendor attempted remediation.",
            confidence: 0.85,
          },
          gemini: {
            model: "Gemini 3",
            recommendation: "38% refund with timeline guarantee",
            refundAmount: 1083.0,
            refundPercentage: 38,
            reasoning:
              "Photo evidence clearly shows installation defects. Vendor's email defense is weak without delivery confirmation.",
            confidence: 0.9,
          },
        },
        aggregatedConfidence: 0.88,
        votingResult: "unanimous",
        status: "pending",
      },
      {
        proposalNumber: 2,
        recommendation: "25% refund (CHF 712.50) with extended warranty and priority scheduling for repairs",
        refundAmount: 712.5,
        refundPercentage: 25,
        reasoning:
          "If Proposal 1 is rejected, this moderate compromise acknowledges both the customer's valid concerns and the vendor's partial completion of work. Includes additional protections for the customer.",
        aiConsensus: {
          claude: {
            model: "Claude Opus 4.5",
            recommendation: "25% refund with warranty extension",
            refundAmount: 712.5,
            refundPercentage: 25,
            reasoning: "Balanced approach considering vendor's 90% completion claim and documented delays.",
            confidence: 0.82,
          },
          gpt: {
            model: "GPT-5.1",
            recommendation: "22% refund plus service credit",
            refundAmount: 627.0,
            refundPercentage: 22,
            reasoning: "Moderate position accounting for shared responsibility in communication breakdown.",
            confidence: 0.8,
          },
          gemini: {
            model: "Gemini 3",
            recommendation: "28% refund with expedited completion",
            refundAmount: 798.0,
            refundPercentage: 28,
            reasoning: "Fair middle ground that incentivizes prompt resolution.",
            confidence: 0.83,
          },
        },
        aggregatedConfidence: 0.82,
        votingResult: "majority",
        status: "pending",
      },
      {
        proposalNumber: 3,
        recommendation:
          "15% refund (CHF 427.50) with free cabinet adjustment and countertop completion at no additional cost",
        refundAmount: 427.5,
        refundPercentage: 15,
        reasoning:
          "Final compromise before binding decision. Minimal financial compensation but ensures all work is completed satisfactorily. This is the last negotiated option.",
        aiConsensus: {
          claude: {
            model: "Claude Opus 4.5",
            recommendation: "15% refund with guaranteed completion",
            refundAmount: 427.5,
            refundPercentage: 15,
            reasoning: "Minimum acceptable resolution that ensures customer gets completed work.",
            confidence: 0.78,
          },
          gpt: {
            model: "GPT-5.1",
            recommendation: "12% refund plus future discount",
            refundAmount: 342.0,
            refundPercentage: 12,
            reasoning: "Baseline offer focusing on work completion over monetary compensation.",
            confidence: 0.75,
          },
          gemini: {
            model: "Gemini 3",
            recommendation: "18% refund with service guarantee",
            refundAmount: 513.0,
            refundPercentage: 18,
            reasoning: "Final offer before escalation to binding decision.",
            confidence: 0.76,
          },
        },
        aggregatedConfidence: 0.76,
        votingResult: "majority",
        status: "pending",
      },
    ]

    setProposals(generatedProposals)
    setIsGeneratingProposals(false)

    // Add AI message to chat
    const aiMessage: ChatMessage = {
      id: `ai-${Date.now()}`,
      sender: "ai",
      senderName: "AI Mediator",
      content:
        "I have analyzed all evidence and chat history. Based on consensus from three AI models (Claude, GPT, and Gemini), I am presenting Proposal 1 of 3 progressive negotiation options.",
      timestamp: new Date().toISOString(),
      isProposal: true,
      proposalData: generatedProposals[0],
    }

    setChatHistory((prev) => [...prev, aiMessage])
  }

  // Handle proposal response
  const handleProposalResponse = (accepted: boolean, proposalIndex: number) => {
    const updatedProposals = [...proposals]
    updatedProposals[proposalIndex].status = accepted ? "accepted" : "rejected"
    setProposals(updatedProposals)

    if (accepted) {
      // Proposal accepted - resolution achieved
      const acceptMessage: ChatMessage = {
        id: `accept-${Date.now()}`,
        sender: "system",
        senderName: "System",
        content: `Proposal ${proposalIndex + 1} has been accepted. The dispute will be resolved with a ${updatedProposals[proposalIndex].refundPercentage}% refund (CHF ${updatedProposals[proposalIndex].refundAmount.toFixed(2)}).`,
        timestamp: new Date().toISOString(),
      }
      setChatHistory((prev) => [...prev, acceptMessage])
    } else {
      // Proposal rejected - show next or escalate to Phase 3
      if (proposalIndex < 2) {
        setCurrentProposalIndex(proposalIndex + 1)
        const nextProposalMessage: ChatMessage = {
          id: `next-${Date.now()}`,
          sender: "ai",
          senderName: "AI Mediator",
          content: `Proposal ${proposalIndex + 1} was rejected. Presenting Proposal ${proposalIndex + 2} of 3.`,
          timestamp: new Date().toISOString(),
          isProposal: true,
          proposalData: proposals[proposalIndex + 1],
        }
        setChatHistory((prev) => [...prev, nextProposalMessage])
      } else {
        // All proposals rejected - escalate to Phase 3
        setCurrentPhase(3)
        generateFinalVerdict()
      }
    }
  }

  // Generate final verdict
  const generateFinalVerdict = async () => {
    const escalateMessage: ChatMessage = {
      id: `escalate-${Date.now()}`,
      sender: "system",
      senderName: "System",
      content: "All negotiation proposals have been rejected. Escalating to Phase 3: Final AI Binding Decision.",
      timestamp: new Date().toISOString(),
    }
    setChatHistory((prev) => [...prev, escalateMessage])

    // Simulate verdict generation
    await new Promise((resolve) => setTimeout(resolve, 2500))

    const verdict: FinalVerdict = {
      decision:
        "The AI tribunal has determined a 30% refund (CHF 855.00) is fair and binding. The vendor must complete all remaining work within 14 days.",
      refundAmount: 855.0,
      reasoning:
        "After thorough analysis of all evidence, chat history, and platform policies, the consensus of three AI models determined that: (1) The customer's claims about incomplete work are substantiated by photographic evidence; (2) The vendor's communication about delays lacked proper delivery confirmation; (3) The vendor did complete approximately 70% of the agreed work satisfactorily. This decision balances the customer's right to completed work with fair compensation for the vendor's partial fulfillment.",
      appealInstructions:
        "You may appeal this decision within 7 days by submitting new evidence not previously considered. Appeals are reviewed by our human support team and require a CHF 50 filing fee (refunded if appeal is successful).",
      nextSteps: [
        "Refund of CHF 855.00 will be processed within 3-5 business days",
        "Vendor must complete remaining work by February 1, 2024",
        "Both parties will receive email confirmation of this decision",
        "Appeal window is open until January 24, 2024",
      ],
      aiConsensus: {
        claude: {
          model: "Claude Opus 4.5",
          recommendation: "30% refund with completion mandate",
          refundAmount: 855.0,
          refundPercentage: 30,
          reasoning: "Evidence-based decision favoring customer on documentation, vendor on partial completion.",
          confidence: 0.91,
        },
        gpt: {
          model: "GPT-5.1",
          recommendation: "28% refund with timeline enforcement",
          refundAmount: 798.0,
          refundPercentage: 28,
          reasoning: "Balanced verdict accounting for all presented evidence and arguments.",
          confidence: 0.89,
        },
        gemini: {
          model: "Gemini 3",
          recommendation: "32% refund with quality guarantee",
          refundAmount: 912.0,
          refundPercentage: 32,
          reasoning: "Final determination prioritizing customer satisfaction while acknowledging vendor efforts.",
          confidence: 0.9,
        },
      },
      confidence: 0.9,
      issuedAt: new Date().toISOString(),
    }

    setFinalVerdict(verdict)

    const verdictMessage: ChatMessage = {
      id: `verdict-${Date.now()}`,
      sender: "ai",
      senderName: "AI Tribunal",
      content: verdict.decision,
      timestamp: new Date().toISOString(),
    }
    setChatHistory((prev) => [...prev, verdictMessage])
  }

  // Send chat message
  const sendMessage = () => {
    if (!newMessage.trim()) return

    const message: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: "customer",
      senderName: dispute.customer.name,
      senderAvatar: dispute.customer.avatar,
      content: newMessage,
      timestamp: new Date().toISOString(),
    }

    setChatHistory((prev) => [...prev, message])
    setNewMessage("")
  }

  // Format timestamp
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // Get phase info
  const getPhaseInfo = (phase: number) => {
    switch (phase) {
      case 1:
        return {
          title: "Amicable Resolution",
          description: "Direct communication between parties",
          icon: HandshakeIcon,
          color: "from-blue-500 to-cyan-500",
        }
      case 2:
        return {
          title: "AI Mediation",
          description: "AI-assisted negotiation proposals",
          icon: Brain,
          color: "from-purple-500 to-pink-500",
        }
      case 3:
        return {
          title: "Final Decision",
          description: "Binding AI tribunal verdict",
          icon: Gavel,
          color: "from-orange-500 to-red-500",
        }
      default:
        return {
          title: "Unknown",
          description: "",
          icon: HelpCircle,
          color: "from-gray-500 to-gray-600",
        }
    }
  }

  const phaseInfo = getPhaseInfo(currentPhase)

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container mx-auto px-4 py-8">
        {/* Back Button & Header */}
        <div className="mb-6">
          <Button variant="ghost" size="sm" asChild className="mb-4">
            <Link href="/disputes">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Disputes
            </Link>
          </Button>

          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Badge variant="secondary" className="font-mono text-sm">
                  {dispute.id}
                </Badge>
                <Badge
                  className={cn(
                    "bg-gradient-to-r",
                    currentPhase === 1
                      ? "from-blue-500 to-cyan-500"
                      : currentPhase === 2
                        ? "from-purple-500 to-pink-500"
                        : "from-orange-500 to-red-500",
                  )}
                >
                  Phase {currentPhase}: {phaseInfo.title}
                </Badge>
              </div>
              <h1 className="text-2xl lg:text-3xl font-bold mb-2">{dispute.serviceType} Dispute</h1>
              <p className="text-muted-foreground">
                Booking: {dispute.bookingId} | Disputed Amount:{" "}
                <span className="text-primary font-semibold">CHF {dispute.disputedAmount.toFixed(2)}</span>
              </p>
            </div>

            {/* Phase Progress */}
            <Card className="lg:w-80 border-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium">Resolution Progress</span>
                  <span className="text-xs text-muted-foreground">Phase {currentPhase}/3</span>
                </div>
                <div className="flex items-center gap-2 mb-3">
                  {[1, 2, 3].map((phase) => (
                    <div key={phase} className="flex-1 flex items-center">
                      <div
                        className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all",
                          phase < currentPhase
                            ? "bg-green-500 text-white"
                            : phase === currentPhase
                              ? "bg-gradient-to-r from-primary to-accent text-white"
                              : "bg-muted text-muted-foreground",
                        )}
                      >
                        {phase < currentPhase ? <Check className="h-4 w-4" /> : phase}
                      </div>
                      {phase < 3 && (
                        <div className={cn("flex-1 h-1 mx-1", phase < currentPhase ? "bg-green-500" : "bg-muted")} />
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <phaseInfo.icon className="h-3.5 w-3.5" />
                  <span>{phaseInfo.description}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Chat & Evidence */}
          <div className="lg:col-span-2 space-y-6">
            {/* Parties Info */}
            <div className="grid sm:grid-cols-2 gap-4">
              <Card className="border-border">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={dispute.customer.avatar || "/placeholder.svg"} />
                      <AvatarFallback>SM</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{dispute.customer.name}</span>
                        <Badge variant="outline" className="text-xs">
                          Customer
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{dispute.customer.email}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={dispute.vendor.avatar || "/placeholder.svg"} />
                      <AvatarFallback>PR</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{dispute.vendor.name}</span>
                        <Badge variant="outline" className="text-xs">
                          Vendor
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{dispute.vendor.email}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Chat Area */}
            <Card className="border-border">
              <CardHeader className="border-b border-border">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Dispute Communication
                  </CardTitle>
                  <Badge variant="secondary">{chatHistory.length} messages</Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {/* Chat Messages */}
                <div className="h-[500px] overflow-y-auto p-4 space-y-4">
                  {chatHistory.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        "flex gap-3",
                        message.sender === "customer" && "justify-end",
                        message.sender === "system" && "justify-center",
                        message.sender === "ai" && "justify-start",
                      )}
                    >
                      {message.sender === "system" ? (
                        <div className="bg-muted/50 rounded-lg px-4 py-2 max-w-md text-center">
                          <p className="text-sm text-muted-foreground">{message.content}</p>
                          <span className="text-xs text-muted-foreground/70">{formatTime(message.timestamp)}</span>
                        </div>
                      ) : message.sender === "ai" ? (
                        <div className="flex gap-3 max-w-[85%]">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                            <Bot className="h-5 w-5 text-white" />
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{message.senderName}</span>
                              <span className="text-xs text-muted-foreground">{formatTime(message.timestamp)}</span>
                            </div>
                            <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-lg p-4">
                              <p className="text-sm mb-3">{message.content}</p>

                              {/* Proposal Card */}
                              {message.isProposal && message.proposalData && (
                                <div className="bg-background/80 rounded-lg p-4 border border-border space-y-4">
                                  <div className="flex items-center justify-between">
                                    <Badge className="bg-gradient-to-r from-purple-500 to-pink-500">
                                      Proposal {message.proposalData.proposalNumber} of 3
                                    </Badge>
                                    <div className="flex items-center gap-1">
                                      <Sparkles className="h-3.5 w-3.5 text-yellow-500" />
                                      <span className="text-xs font-medium">
                                        {Math.round(message.proposalData.aggregatedConfidence * 100)}% Confidence
                                      </span>
                                    </div>
                                  </div>

                                  <div className="space-y-2">
                                    <h4 className="font-semibold">{message.proposalData.recommendation}</h4>
                                    <p className="text-sm text-muted-foreground">{message.proposalData.reasoning}</p>
                                  </div>

                                  <div className="flex items-center gap-4 py-2 border-y border-border">
                                    <div className="text-center">
                                      <div className="text-2xl font-bold text-primary">
                                        CHF {message.proposalData.refundAmount.toFixed(2)}
                                      </div>
                                      <div className="text-xs text-muted-foreground">
                                        {message.proposalData.refundPercentage}% Refund
                                      </div>
                                    </div>
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 text-xs">
                                        <Badge
                                          variant="outline"
                                          className={cn(
                                            message.proposalData.votingResult === "unanimous"
                                              ? "border-green-500 text-green-500"
                                              : message.proposalData.votingResult === "majority"
                                                ? "border-blue-500 text-blue-500"
                                                : "border-yellow-500 text-yellow-500",
                                          )}
                                        >
                                          {message.proposalData.votingResult === "unanimous"
                                            ? "Unanimous"
                                            : message.proposalData.votingResult === "majority"
                                              ? "Majority"
                                              : "Split"}{" "}
                                          AI Consensus
                                        </Badge>
                                      </div>
                                    </div>
                                  </div>

                                  {/* AI Details Toggle */}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-full justify-between"
                                    onClick={() =>
                                      setShowAIDetails(
                                        showAIDetails === message.proposalData?.proposalNumber
                                          ? null
                                          : (message.proposalData?.proposalNumber ?? null),
                                      )
                                    }
                                  >
                                    <span className="flex items-center gap-2">
                                      <Brain className="h-4 w-4" />
                                      View AI Model Breakdown
                                    </span>
                                    {showAIDetails === message.proposalData.proposalNumber ? (
                                      <ChevronUp className="h-4 w-4" />
                                    ) : (
                                      <ChevronDown className="h-4 w-4" />
                                    )}
                                  </Button>

                                  {showAIDetails === message.proposalData.proposalNumber && (
                                    <div className="space-y-3 pt-2 border-t border-border">
                                      {Object.entries(message.proposalData.aiConsensus).map(([key, ai]) => (
                                        <div key={key} className="bg-muted/50 rounded-lg p-3">
                                          <div className="flex items-center justify-between mb-2">
                                            <span className="font-medium text-sm">{ai.model}</span>
                                            <Badge variant="secondary" className="text-xs">
                                              {Math.round(ai.confidence * 100)}% confident
                                            </Badge>
                                          </div>
                                          <p className="text-xs text-muted-foreground mb-1">{ai.recommendation}</p>
                                          <p className="text-xs text-muted-foreground/80 italic">{ai.reasoning}</p>
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                  {/* Response Buttons */}
                                  {message.proposalData.status === "pending" && currentPhase === 2 && (
                                    <div className="flex gap-3 pt-2">
                                      <Button
                                        className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:opacity-90"
                                        onClick={() =>
                                          handleProposalResponse(true, message.proposalData!.proposalNumber - 1)
                                        }
                                      >
                                        <ThumbsUp className="mr-2 h-4 w-4" />
                                        Accept Proposal
                                      </Button>
                                      <Button
                                        variant="outline"
                                        className="flex-1 border-red-500/50 text-red-500 hover:bg-red-500/10 bg-transparent"
                                        onClick={() =>
                                          handleProposalResponse(false, message.proposalData!.proposalNumber - 1)
                                        }
                                      >
                                        <ThumbsDown className="mr-2 h-4 w-4" />
                                        Reject
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div
                          className={cn("flex gap-3 max-w-[75%]", message.sender === "customer" && "flex-row-reverse")}
                        >
                          <Avatar className="h-8 w-8 flex-shrink-0">
                            <AvatarImage src={message.senderAvatar || "/placeholder.svg"} />
                            <AvatarFallback>{message.senderName.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className={cn("space-y-1", message.sender === "customer" && "text-right")}>
                            <div
                              className={cn(
                                "flex items-center gap-2",
                                message.sender === "customer" && "flex-row-reverse",
                              )}
                            >
                              <span className="font-medium text-sm">{message.senderName}</span>
                              <span className="text-xs text-muted-foreground">{formatTime(message.timestamp)}</span>
                            </div>
                            <div
                              className={cn(
                                "rounded-lg p-3",
                                message.sender === "customer" ? "bg-primary text-primary-foreground" : "bg-muted",
                              )}
                            >
                              <p className="text-sm">{message.content}</p>
                            </div>
                            {message.attachments && message.attachments.length > 0 && (
                              <div
                                className={cn(
                                  "flex flex-wrap gap-2 mt-2",
                                  message.sender === "customer" && "justify-end",
                                )}
                              >
                                {message.attachments.map((att, idx) => (
                                  <Badge
                                    key={idx}
                                    variant="secondary"
                                    className="text-xs cursor-pointer hover:bg-primary/10"
                                  >
                                    {att.type === "image" ? (
                                      <ImageIcon className="h-3 w-3 mr-1" />
                                    ) : (
                                      <FileText className="h-3 w-3 mr-1" />
                                    )}
                                    {att.name}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>

                {/* Chat Input */}
                <div className="border-t border-border p-4">
                  {currentPhase === 1 ? (
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon">
                        <Paperclip className="h-5 w-5" />
                      </Button>
                      <Input
                        placeholder="Type your message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                        className="flex-1"
                      />
                      <Button onClick={sendMessage} disabled={!newMessage.trim()}>
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : currentPhase === 2 && proposals.length === 0 ? (
                    <Button
                      className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90"
                      onClick={generateProposals}
                      disabled={isGeneratingProposals}
                    >
                      {isGeneratingProposals ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          Generating AI Proposals...
                        </>
                      ) : (
                        <>
                          <Brain className="mr-2 h-4 w-4" />
                          Generate AI Mediation Proposals
                        </>
                      )}
                    </Button>
                  ) : currentPhase === 3 && !finalVerdict ? (
                    <div className="text-center py-4">
                      <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
                      <p className="text-sm text-muted-foreground">Generating final binding decision...</p>
                    </div>
                  ) : (
                    <div className="text-center py-2 text-sm text-muted-foreground">
                      {finalVerdict ? "Final verdict has been issued" : "Respond to the current proposal above"}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Phase Timer (Phase 1) */}
            {currentPhase === 1 && (
              <Card className="border-2 border-blue-500/30 bg-gradient-to-br from-blue-500/5 to-cyan-500/5">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Timer className="h-5 w-5 text-blue-500" />
                    <span className="font-semibold">Amicable Resolution Period</span>
                  </div>
                  <div className="text-3xl font-bold text-center mb-2 font-mono">
                    {String(timeRemaining.hours).padStart(2, "0")}:{String(timeRemaining.minutes).padStart(2, "0")}:
                    {String(timeRemaining.seconds).padStart(2, "0")}
                  </div>
                  <p className="text-xs text-center text-muted-foreground">Time remaining to reach agreement</p>
                </CardContent>
              </Card>
            )}

            {/* Final Verdict Card (Phase 3) */}
            {finalVerdict && (
              <Card className="border-2 border-orange-500/30 bg-gradient-to-br from-orange-500/5 to-red-500/5">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Gavel className="h-5 w-5 text-orange-500" />
                    Final Binding Decision
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center py-3 bg-background/50 rounded-lg border border-border">
                    <div className="text-3xl font-bold text-primary">CHF {finalVerdict.refundAmount.toFixed(2)}</div>
                    <div className="text-sm text-muted-foreground">Awarded Refund</div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">Decision Summary</h4>
                    <p className="text-sm text-muted-foreground">{finalVerdict.decision}</p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">Next Steps</h4>
                    <ul className="space-y-1">
                      {finalVerdict.nextSteps.map((step, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs text-muted-foreground">
                          <Check className="h-3.5 w-3.5 text-green-500 mt-0.5 flex-shrink-0" />
                          {step}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-2 border-t border-border">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                      <AlertCircle className="h-3.5 w-3.5" />
                      <span>Appeal within 7 days</span>
                    </div>
                    <Button variant="outline" size="sm" className="w-full bg-transparent">
                      <ExternalLink className="mr-2 h-3.5 w-3.5" />
                      File an Appeal
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Evidence Section */}
            <Card className="border-border">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-lg">
                  <span className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Evidence
                  </span>
                  <Badge variant="secondary">{evidence.length} files</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {evidence.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div
                      className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center",
                        item.type === "image"
                          ? "bg-blue-500/10"
                          : item.type === "receipt"
                            ? "bg-green-500/10"
                            : "bg-orange-500/10",
                      )}
                    >
                      {item.type === "image" ? (
                        <ImageIcon className="h-5 w-5 text-blue-500" />
                      ) : item.type === "receipt" ? (
                        <FileText className="h-5 w-5 text-green-500" />
                      ) : (
                        <FileText className="h-5 w-5 text-orange-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        By {item.uploadedBy === "customer" ? "Customer" : "Vendor"}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                ))}

                {currentPhase === 1 && (
                  <Button variant="outline" size="sm" className="w-full mt-2 bg-transparent">
                    <Paperclip className="mr-2 h-4 w-4" />
                    Upload Evidence
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* How It Works */}
            <Card className="border-border">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Info className="h-5 w-5" />
                  Resolution Process
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { phase: 1, title: "48h Amicable", desc: "Direct negotiation", icon: HandshakeIcon },
                  { phase: 2, title: "AI Mediation", desc: "3 progressive proposals", icon: Brain },
                  { phase: 3, title: "Final Decision", desc: "Binding AI verdict", icon: Gavel },
                ].map((step) => (
                  <div
                    key={step.phase}
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-lg transition-colors",
                      currentPhase === step.phase ? "bg-primary/10 border border-primary/30" : "bg-muted/30",
                    )}
                  >
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                        currentPhase > step.phase
                          ? "bg-green-500 text-white"
                          : currentPhase === step.phase
                            ? "bg-primary text-white"
                            : "bg-muted text-muted-foreground",
                      )}
                    >
                      {currentPhase > step.phase ? <Check className="h-4 w-4" /> : step.phase}
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">{step.title}</h4>
                      <p className="text-xs text-muted-foreground">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* AI Consensus Info */}
            <Card className="border-2 border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-pink-500/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <Sparkles className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">AI Consensus Mechanism</h4>
                    <p className="text-xs text-muted-foreground">Powered by 3 AI models</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  {["Claude", "GPT", "Gemini"].map((model) => (
                    <div key={model} className="bg-background/50 rounded-lg p-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary/50 to-accent/50 mx-auto mb-1 flex items-center justify-center">
                        <Brain className="h-3 w-3" />
                      </div>
                      <span className="text-xs font-medium">{model}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-3 text-center">
                  Decisions require majority consensus for fairness and accuracy
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
