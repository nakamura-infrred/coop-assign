import type {
  Assignment,
  AssignmentId,
  Availability,
  ContactInfo,
  IsoDateString,
  Person,
  PersonId,
  Task,
  TaskId,
  Team,
  TenantId,
  UserId,
  Venue,
} from '@coop-assign/domain'

export type Unsubscribe = () => void

export interface TenantContext {
  tenantId: TenantId
  actorId: UserId
}

export interface PersonWriteInput {
  id?: PersonId
  displayName: string
  tags?: string[]
  skills?: string[]
  note?: string
}

export interface AvailabilityQuery {
  personIds?: PersonId[]
  dateRange?: {
    start: IsoDateString
    end: IsoDateString
  }
}

export interface AvailabilityWriteInput {
  id?: string
  personId: PersonId
  date: IsoDateString
  slot: Availability['slot']
  note?: string
}

export interface TaskQuery {
  dateRange?: {
    start: IsoDateString
    end: IsoDateString
  }
  taskIds?: TaskId[]
}

export interface TaskWriteInput {
  id?: TaskId
  date: IsoDateString
  startTime?: string
  endTime?: string
  venueId?: string
  venueName?: string
  venue?: string
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
}

export interface AssignmentQuery {
  taskIds?: TaskId[]
  personIds?: PersonId[]
  dateRange?: {
    start: IsoDateString
    end: IsoDateString
  }
}

export interface AssignmentWriteInput {
  id?: AssignmentId
  taskId: TaskId
  personId: PersonId
  role?: string
  status?: Assignment['status']
  note?: string
}

export type CollectionObserver<T> = (items: T[]) => void

export interface StorageAdapter {
  listPersons(ctx: TenantContext): Promise<Person[]>
  upsertPerson(ctx: TenantContext, input: PersonWriteInput): Promise<Person>
  removePerson(ctx: TenantContext, personId: PersonId): Promise<void>

  listAvailability(
    ctx: TenantContext,
    query: AvailabilityQuery,
  ): Promise<Availability[]>
  upsertAvailability(
    ctx: TenantContext,
    input: AvailabilityWriteInput,
  ): Promise<Availability>
  removeAvailability(ctx: TenantContext, availabilityId: string): Promise<void>

  listTasks(ctx: TenantContext, query: TaskQuery): Promise<Task[]>
  upsertTask(ctx: TenantContext, input: TaskWriteInput): Promise<Task>
  removeTask(ctx: TenantContext, taskId: TaskId): Promise<void>
  observeTasks?(
    ctx: TenantContext,
    query: TaskQuery,
    observer: CollectionObserver<Task>,
  ): Unsubscribe

  listAssignments(
    ctx: TenantContext,
    query: AssignmentQuery,
  ): Promise<Assignment[]>
  upsertAssignment(
    ctx: TenantContext,
    input: AssignmentWriteInput,
  ): Promise<Assignment>
  removeAssignment(ctx: TenantContext, assignmentId: AssignmentId): Promise<void>
  observeAssignments(
    ctx: TenantContext,
    query: AssignmentQuery,
    observer: CollectionObserver<Assignment>,
  ): Unsubscribe

  listTeams(ctx: TenantContext): Promise<Team[]>
  listVenues(ctx: TenantContext): Promise<Venue[]>
}
