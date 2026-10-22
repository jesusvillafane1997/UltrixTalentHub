import { UserRole } from '@/types/database';

export interface AuthSession {
  user: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    avatar_url?: string | null;
  };
}

// Permissions Matrix defined in Ultrix Talent Hub Spec Section 2
export const Permissions = {
  canManageOpenings: (role: UserRole): boolean => {
    return ['admin', 'hr_manager', 'recruiter'].includes(role);
  },

  canEditCandidates: (role: UserRole): boolean => {
    return ['admin', 'hr_manager', 'recruiter'].includes(role);
  },

  canAddCandidate: (role: UserRole): boolean => {
    return ['admin', 'hr_manager', 'recruiter'].includes(role);
  },

  canUploadCV: (role: UserRole): boolean => {
    return ['admin', 'hr_manager', 'recruiter'].includes(role);
  },

  canViewCompensation: (role: UserRole, adminOptIn = false): boolean => {
    if (['admin', 'hr_manager'].includes(role)) return true;
    if (role === 'viewer' && adminOptIn) return true;
    return false;
  },

  canViewBillRate: (role: UserRole, isOwnClient = false, adminOptIn = false): boolean => {
    if (['admin', 'hr_manager'].includes(role)) return true;
    if (role === 'account_manager' && isOwnClient) return true;
    if (role === 'viewer' && adminOptIn) return true;
    return false;
  },

  canViewMargin: (role: UserRole, adminOptIn = false): boolean => {
    if (['admin', 'hr_manager'].includes(role)) return true;
    if (role === 'viewer' && adminOptIn) return true;
    return false; // AM NEVER sees margin!
  },

  canManageAssignments: (role: UserRole, isOwnClient = false): boolean => {
    if (['admin', 'hr_manager'].includes(role)) return true;
    if (role === 'account_manager' && isOwnClient) return true;
    return false;
  },

  canManageCompensation: (role: UserRole): boolean => {
    return ['admin', 'hr_manager'].includes(role);
  },

  canUploadContracts: (role: UserRole): boolean => {
    return ['admin', 'hr_manager'].includes(role);
  },

  canViewContracts: (role: UserRole, isOwnClient = false): boolean => {
    if (['admin', 'hr_manager'].includes(role)) return true;
    if (role === 'account_manager' && isOwnClient) return true;
    return false;
  },

  canFillMonthlyReviews: (role: UserRole, isOwnWorker = false): boolean => {
    if (['admin', 'hr_manager'].includes(role)) return true;
    if (role === 'account_manager' && isOwnWorker) return true;
    return false;
  },

  canManageSettings: (role: UserRole): boolean => {
    return role === 'admin';
  },

  canPurgeCandidate: (role: UserRole): boolean => {
    return ['admin', 'hr_manager'].includes(role);
  },

  canDeleteOpening: (role: UserRole): boolean => {
    return ['admin', 'hr_manager'].includes(role);
  },

  canDeleteCandidate: (role: UserRole): boolean => {
    return ['admin', 'hr_manager'].includes(role);
  },
};
