import { Timestamp } from './common';

export type OrgStatus = 'active' | 'suspended';
export type OrgMemberRole = 'owner' | 'admin';
export type OrgMemberStatus = 'active' | 'disabled';

/**
 * Organization - top-level multi-tenant container that owns LLCs
 * Stored at: /accounts/{accountId}
 *
 * Represents a property management company (client) on the platform.
 */
export interface Organization {
  id: string;
  name: string;
  ownerUserId: string; // Exactly one owner
  status: OrgStatus;
  createdAt: Timestamp;
  createdBy?: string;
  stripeCustomerId?: string;
  billingStatus?: string;
}

/**
 * OrgMember - owner or admin of an Organization
 * Stored at: /accounts/{accountId}/accountMembers/{userId}
 *
 * Sub-collection is named 'accountMembers' (not 'members') to avoid
 * collectionGroup collision with llcs/{llcId}/members.
 */
export interface OrgMember {
  userId: string;
  role: OrgMemberRole;
  status: OrgMemberStatus;
  addedAt: Timestamp;
  addedByUserId?: string;
}

export interface CreateOrgInput {
  name: string;
  ownerUserId: string;
}

export interface UpdateOrgInput {
  name?: string;
  status?: OrgStatus;
}

export interface AddOrgMemberInput {
  userId: string;
  role: OrgMemberRole;
}

export interface UpdateOrgMemberInput {
  role?: OrgMemberRole;
  status?: OrgMemberStatus;
}
