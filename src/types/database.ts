export interface Database {
  public: {
    Tables: {
      lottery_results: {
        Row: {
          id: string;
          lottery_type: string;
          date: string;
          results: Json;
          prizes: Json | null;
          source: string;
          status: 'active' | 'inactive' | 'pending';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          lottery_type: string;
          date: string;
          results: Json;
          prizes?: Json | null;
          source: string;
          status?: 'active' | 'inactive' | 'pending';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          lottery_type?: string;
          date?: string;
          results?: Json;
          prizes?: Json | null;
          source?: string;
          status?: 'active' | 'inactive' | 'pending';
          created_at?: string;
          updated_at?: string;
        };
      };
      message_templates: {
        Row: {
          id: string;
          name: string;
          content: string;
          variables: string[];
          lottery_types: string[];
          enabled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          content: string;
          variables: string[];
          lottery_types: string[];
          enabled: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          content?: string;
          variables?: string[];
          lottery_types?: string[];
          enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      group_configs: {
        Row: {
          id: string;
          name: string;
          platform: 'whatsapp' | 'telegram';
          group_id: string;
          enabled: boolean;
          lottery_types: string[];
          template_id: string | null;
          schedule: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          platform: 'whatsapp' | 'telegram';
          group_id: string;
          enabled: boolean;
          lottery_types: string[];
          template_id?: string | null;
          schedule?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          platform?: 'whatsapp' | 'telegram';
          group_id?: string;
          enabled?: boolean;
          lottery_types?: string[];
          template_id?: string | null;
          schedule?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      scrape_configs: {
        Row: {
          id: string;
          lottery_type: string;
          url: string;
          enabled: boolean;
          selectors: Json;
          headers: Json | null;
          proxy_enabled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          lottery_type: string;
          url: string;
          enabled: boolean;
          selectors: Json;
          headers?: Json | null;
          proxy_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          lottery_type?: string;
          url?: string;
          enabled?: boolean;
          selectors?: Json;
          headers?: Json | null;
          proxy_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      system_logs: {
        Row: {
          id: string;
          level: 'info' | 'warn' | 'error' | 'debug';
          message: string;
          context: Json | null;
          source: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          level: 'info' | 'warn' | 'error' | 'debug';
          message: string;
          context?: Json | null;
          source: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          level?: 'info' | 'warn' | 'error' | 'debug';
          message?: string;
          context?: Json | null;
          source?: string;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface LotteryResult {
  id: string;
  lottery_type: string;
  date: string;
  results: {
    first?: string;
    second?: string;
    third?: string;
    fourth?: string;
    fifth?: string;
  };
  prizes?: {
    first?: string;
    second?: string;
    third?: string;
    fourth?: string;
    fifth?: string;
  };
  source: string;
  status: 'active' | 'inactive' | 'pending';
  created_at: string;
  updated_at: string;
}

export interface MessageTemplate {
  id: string;
  name: string;
  content: string;
  variables: string[];
  lottery_types: string[];
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface GroupConfig {
  id: string;
  name: string;
  platform: 'whatsapp' | 'telegram';
  group_id: string;
  enabled: boolean;
  lottery_types: string[];
  template_id: string | null;
  schedule: string | null;
  created_at: string;
  updated_at: string;
}