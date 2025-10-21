export type TenantId = string
export type UserId = string
export type PersonId = string
export type AvailabilityId = string
export type TaskId = string
export type AssignmentId = string

export type IsoDateString = string // e.g. "2025-10-21"
export type IsoDateTimeString = string // e.g. "2025-10-21T15:30:00Z"

export type AvailabilitySlot = 'NONE' | 'AM' | 'PM' | 'FULL'

export type AssignmentStatus = 'draft' | 'confirmed'

export type RegionCode = 'tokai' | 'kansai' | 'hokuriku' | 'chubu' | 'other'
export type TeamCategory = 'university' | 'corporate' | 'club'
export type VenueType = 'university' | 'stadium'

export interface ContactInfo {
  name: string
  phone?: string
  notes?: string
}

export interface Team {
  id: string
  name: string
  region: RegionCode
  category: TeamCategory
  league?: string
  shortName?: string
}

export interface Venue {
  id: string
  name: string
  type: VenueType
  region: RegionCode
  address?: string
  note?: string
}

export interface Person {
  id: PersonId
  tenantId: TenantId
  displayName: string
  tags: string[]
  skills: string[]
  note?: string
  createdAt: IsoDateTimeString
  createdBy: UserId
  updatedAt: IsoDateTimeString
  updatedBy: UserId
}

export interface Availability {
  id: AvailabilityId
  tenantId: TenantId
  personId: PersonId
  date: IsoDateString
  slot: AvailabilitySlot
  note?: string
  createdAt: IsoDateTimeString
  createdBy: UserId
  updatedAt: IsoDateTimeString
  updatedBy: UserId
}

export interface Task {
  id: TaskId
  tenantId: TenantId
  date: IsoDateString
  startTime?: string // HH:mm
  endTime?: string // HH:mm
  venue?: string
  venueId?: string
  venueName?: string
  title: string
  required: number
  role?: string
  metadata?: Record<string, unknown>
  league?: string
  hostTeamId?: string
  hostTeamName?: string
  opponentTeamId?: string
  opponentTeamName?: string
  durationMinutes?: number
  status?: 'scheduled' | 'cancelled' | 'postponed'
  contact?: ContactInfo
  assignmentNotes?: string
  tags?: string[]
  createdAt: IsoDateTimeString
  createdBy: UserId
  updatedAt: IsoDateTimeString
  updatedBy: UserId
}

export interface Assignment {
  id: AssignmentId
  tenantId: TenantId
  taskId: TaskId
  personId: PersonId
  role?: string
  status: AssignmentStatus
  note?: string
  createdAt: IsoDateTimeString
  createdBy: UserId
  updatedAt: IsoDateTimeString
  updatedBy: UserId
}

export interface AssignmentHistoryEvent {
  id: string
  tenantId: TenantId
  assignmentId: AssignmentId
  actorId: UserId
  action:
    | 'created'
    | 'updated'
    | 'deleted'
    | 'status-changed'
    | 'reassigned'
  snapshot: Partial<Assignment>
  occurredAt: IsoDateTimeString
}

export interface RuleViolation {
  id: string
  tenantId: TenantId
  level: 'hard' | 'soft'
  message: string
  affectedAssignments: AssignmentId[]
  detectedAt: IsoDateTimeString
}

export interface DistributionMetric {
  personId: PersonId
  periodStart: IsoDateString
  periodEnd: IsoDateString
  totalAssignments: number
  totalHours?: number
}
