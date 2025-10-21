import type {
  Assignment,
  RuleViolation,
  Task,
  TenantId,
  UserId,
} from './types.js'

export interface ConstraintCheckContext {
  tenantId: TenantId
  actorId: UserId
  timestamp: string
}

export interface ConstraintInput {
  tasks: Task[]
  assignments: Assignment[]
}

export interface Constraint {
  id: string
  level: 'hard' | 'soft'
  description: string
  evaluate: (
    context: ConstraintCheckContext,
    input: ConstraintInput,
  ) => RuleViolation[]
}

export type ConstraintRegistry = Record<string, Constraint>

export function registerConstraint(
  registry: ConstraintRegistry,
  constraint: Constraint,
): ConstraintRegistry {
  return {
    ...registry,
    [constraint.id]: constraint,
  }
}
