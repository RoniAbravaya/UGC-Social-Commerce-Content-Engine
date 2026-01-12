/**
 * TypeScript type definitions shared across the application
 */

// Re-export schema-derived types
export type {
  PaginationInput,
  UtmParams,
} from '../schemas/common';

export type {
  RegisterInput,
  LoginInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  UpdateProfileInput,
  UserResponse,
} from '../schemas/auth';

export type {
  WorkspaceRole,
  WorkspacePlan,
  CreateWorkspaceInput,
  UpdateWorkspaceInput,
  WorkspaceResponse,
  InviteMemberInput,
  UpdateMemberRoleInput,
  MemberResponse,
  InvitationResponse,
  AcceptInvitationInput,
  WorkspaceWithRole,
} from '../schemas/workspace';

export type {
  Platform,
  RightsStatus,
  SocialAccountStatus,
  ConnectSocialAccountInput,
  ImportUgcManualInput,
  ImportUgcCsvRow,
  UgcPostFilters,
  UgcPostResponse,
  CreateRightsRequestInput,
  UpdateRightsStatusInput,
  RightsRequestResponse,
} from '../schemas/ugc';

export type {
  ProductProvider,
  CreateProductInput,
  UpdateProductInput,
  ProductResponse,
  ProductFilters,
  ShopifyImportConfig,
  MapProductToContentInput,
  ContentProductMapResponse,
} from '../schemas/products';

// Session types for NextAuth
export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
}

export interface SessionWorkspace {
  id: string;
  name: string;
  slug: string;
  role: WorkspaceRole;
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}

// Job types
export interface JobProgress {
  jobId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  message?: string;
  error?: string;
}

// Media types
export interface MediaDimensions {
  width: number;
  height: number;
}

export interface VideoMetadata extends MediaDimensions {
  duration: number;
  codec?: string;
  bitrate?: number;
  fps?: number;
}

// Caption style configuration
export interface CaptionStyle {
  fontFamily: string;
  fontSize: number;
  fontColor: string;
  backgroundColor?: string;
  backgroundOpacity?: number;
  position: 'top' | 'center' | 'bottom';
  marginBottom?: number;
  maxWidth?: number;
}

// Clip generation parameters
export interface ClipGenerationParams {
  durations: number[]; // Target durations in seconds
  formats: ('VERTICAL_9_16' | 'SQUARE_1_1' | 'HORIZONTAL_16_9')[];
  generateCaptions: boolean;
  captionStyle?: CaptionStyle;
  burnInCaptions: boolean;
}

// Analytics types
export interface AnalyticsMetric {
  value: number;
  change?: number;
  changePercent?: number;
}

export interface AnalyticsSummary {
  totalViews: AnalyticsMetric;
  totalClicks: AnalyticsMetric;
  totalRevenue: AnalyticsMetric;
  conversionRate: AnalyticsMetric;
}

export interface TopContent {
  id: string;
  title: string;
  thumbnailUrl?: string;
  views: number;
  clicks: number;
  revenue: number;
}

export interface TopCreator {
  handle: string;
  platform: Platform;
  postsCount: number;
  views: number;
  revenue: number;
}

import type { WorkspaceRole, Platform } from '../schemas';
