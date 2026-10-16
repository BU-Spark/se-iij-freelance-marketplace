/**
 * app/types/index.ts
 *
 * This file serves as a central export point for all shared type definitions and interfaces in this directory.
 * This allows for cleaner imports in other parts of the application.
 *
 * For example:
 * import type { User, Product, Order } from '@/app/types';
 */

export * from './user.types'; // Exports User, Role, UserProfilePageData, etc.
export * from './availability.types'; // Export availability types
export * from './portfolioItem.types'; // Export PortfolioItem and ClipType
// Add other type files here as they are created, e.g.:
// export * from './product.types';
// export * from './api.types';
export * from './assignments.types'; // Export Assignment
export * from './badges.types'; // Export Badges
export * from './messages.types'; // Export Message, Conversation
export * from './organization.types'; // Export Organization
export * from './dashboard.types'; // Export DeskAssignment, RosterMember, etc.
