export interface User {
  id: string;
  email: string;
  name?: string;
  role: "admin" | "client";
  created_at: string;
  updated_at: string;
  locked?: boolean;
  first_name?: string;
  last_name?: string;
  company?: string;
  title?: string;
}

export interface Invite {
  id: string;
  email: string;
  token: string;
  expires_at: string;
  used: boolean;
  created_at: string;
  created_by: string;
}

export interface RFQItem {
  id: string;
  title: string;
  status: "pending" | "in review" | "approved" | "completed";
  itemsCount: number;
  submittedAt: string;
}

export interface SupportTicket {
  id: string;
  title: string;
  status: "open" | "in-progress" | "resolved";
  priority: "high" | "medium" | "low";
  date: string;
}

export interface TrainingItem {
  id: string;
  title: string;
  price: string;
  description: string;
  level: "Beginner" | "Intermediate" | "Advanced" | "All Levels";
  code: string;
  duration: string;
}

export interface Manual {
  id: string;
  title: string;
  tags: string[];
  size: string;
  date: string;
  filePath: string;
}

export interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}
