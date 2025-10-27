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
  UserProfile,
  UserRole,
  UserStatus,
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

export interface UserProfileWriteInput {
  id?: UserId
  email?: string
  displayName?: string
  photoURL?: string | null
  role?: UserRole
  status?: UserStatus
  note?: string | null
}

export type TeamWriteInput = Partial<Omit<Team, 'id'>> & { id: string }
export type VenueWriteInput = Partial<Omit<Venue, 'id'>> & { id: string }

export type CollectionObserver<T> = (items: T[]) => void

export interface StorageAdapter {
  listUserProfiles(ctx: TenantContext): Promise<UserProfile[]>
  upsertUserProfile(
    ctx: TenantContext,
    input: UserProfileWriteInput,
  ): Promise<UserProfile>
  removeUserProfile(ctx: TenantContext, userId: UserId): Promise<void>

  upsertTeam(ctx: TenantContext, input: TeamWriteInput): Promise<Team>
  removeTeam(ctx: TenantContext, teamId: Team['id']): Promise<void>
  upsertVenue(ctx: TenantContext, input: VenueWriteInput): Promise<Venue>

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
