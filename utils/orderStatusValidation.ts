/**
 * Order Status Transition Validation Utility
 * 
 * This utility provides validation logic for order status transitions
 * to ensure business rules are followed consistently across the application.
 */

export type OrderStatus = 'pending' | 'preparation' | 'ontheway' | 'delivered' | 'cancelled';

export interface StatusTransitionRule {
  from: OrderStatus;
  to: OrderStatus[];
  description: string;
}

/**
 * Valid status transitions based on business rules
 */
export const STATUS_TRANSITION_RULES: StatusTransitionRule[] = [
  {
    from: 'pending',
    to: ['preparation', 'cancelled'],
    description: 'Pending orders can be moved to preparation or cancelled'
  },
  {
    from: 'preparation',
    to: ['ontheway', 'cancelled'],
    description: 'Preparation orders can be moved to on the way or cancelled'
  },
  {
    from: 'ontheway',
    to: ['delivered', 'cancelled'],
    description: 'On the way orders can be moved to delivered or cancelled'
  },
  {
    from: 'delivered',
    to: [],
    description: 'Delivered orders cannot be changed to any other status'
  },
  {
    from: 'cancelled',
    to: [],
    description: 'Cancelled orders cannot be changed to any other status'
  }
];

/**
 * Check if a status transition is valid
 * @param fromStatus - Current order status
 * @param toStatus - Target order status
 * @returns boolean indicating if transition is valid
 */
export function isValidStatusTransition(fromStatus: OrderStatus, toStatus: OrderStatus): boolean {
  const rule = STATUS_TRANSITION_RULES.find(rule => rule.from === fromStatus);
  return rule ? rule.to.includes(toStatus) : false;
}

/**
 * Get all valid status transitions for a given current status
 * @param currentStatus - Current order status
 * @returns Array of valid target statuses
 */
export function getValidTransitions(currentStatus: OrderStatus): OrderStatus[] {
  const rule = STATUS_TRANSITION_RULES.find(rule => rule.from === currentStatus);
  return rule ? rule.to : [];
}

/**
 * Get invalid status transitions for a given current status
 * @param currentStatus - Current order status
 * @returns Array of invalid target statuses
 */
export function getInvalidTransitions(currentStatus: OrderStatus): OrderStatus[] {
  const allStatuses: OrderStatus[] = ['pending', 'preparation', 'ontheway', 'delivered', 'cancelled'];
  const validTransitions = getValidTransitions(currentStatus);
  return allStatuses.filter(status => !validTransitions.includes(status) && status !== currentStatus);
}

/**
 * Get transition description for a given status
 * @param currentStatus - Current order status
 * @returns Description of what transitions are allowed
 */
export function getTransitionDescription(currentStatus: OrderStatus): string {
  const rule = STATUS_TRANSITION_RULES.find(rule => rule.from === currentStatus);
  return rule ? rule.description : 'No transitions available';
}

/**
 * Check if an order can be modified (not cancelled or delivered)
 * @param currentStatus - Current order status
 * @returns boolean indicating if order can be modified
 */
export function canModifyOrder(currentStatus: OrderStatus): boolean {
  return currentStatus !== 'cancelled' && currentStatus !== 'delivered';
}

/**
 * Get status priority for ordering (lower number = earlier in process)
 * @param status - Order status
 * @returns Priority number
 */
export function getStatusPriority(status: OrderStatus): number {
  const priorities: Record<OrderStatus, number> = {
    'pending': 1,
    'preparation': 2,
    'ontheway': 3,
    'delivered': 4,
    'cancelled': 5
  };
  return priorities[status] || 0;
}

/**
 * Check if a status represents a completed state
 * @param status - Order status
 * @returns boolean indicating if status is completed
 */
export function isCompletedStatus(status: OrderStatus): boolean {
  return status === 'delivered' || status === 'cancelled';
}

/**
 * Check if a status represents an active state
 * @param status - Order status
 * @returns boolean indicating if status is active
 */
export function isActiveStatus(status: OrderStatus): boolean {
  return status === 'pending' || status === 'preparation' || status === 'ontheway';
}
