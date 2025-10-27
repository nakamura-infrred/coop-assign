import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  setDoc,
  type DocumentData,
  type DocumentSnapshot,
  type Firestore,
  type QueryDocumentSnapshot,
} from 'firebase/firestore'
import type {
  Assignment,
  AssignmentId,
  AssignmentStatus,
  Availability,
  AvailabilityId,
  AvailabilitySlot,
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
import type {
  AssignmentQuery,
  AssignmentWriteInput,
  AvailabilityQuery,
  AvailabilityWriteInput,
  CollectionObserver,
  PersonWriteInput,
  StorageAdapter,
  TaskQuery,
  TaskWriteInput,
  TenantContext,
  Unsubscribe,
  UserProfileWriteInput,
  TeamWriteInput,
  VenueWriteInput,
} from './storage-adapter.js'

const defaultAssignmentStatus: AssignmentStatus = 'draft'

const toIsoDate = (input: string | Date): string =>
  typeof input === 'string' ? input : input.toISOString().slice(0, 10)

const toIsoDateTime = (input: Date = new Date()): string => input.toISOString()

type PersonDoc = Omit<Person, 'id'>
type AvailabilityDoc = Omit<Availability, 'id'>
type TaskDoc = Omit<Task, 'id'>
type AssignmentDoc = Omit<Assignment, 'id'>
type TeamDoc = Omit<Team, 'id'>
type VenueDoc = Omit<Venue, 'id'>
type UserProfileDoc = Omit<UserProfile, 'id'>

const collectionName: Record<
  | 'userProfiles'
  | 'persons'
  | 'availability'
  | 'tasks'
  | 'assignments'
  | 'teams'
  | 'venues',
  string
> = {
  userProfiles: 'users',
  persons: 'persons',
  availability: 'availability',
  tasks: 'tasks',
  assignments: 'assignments',
  teams: 'teams',
  venues: 'venues',
}

export class FirestoreAdapter implements StorageAdapter {
  private readonly db: Firestore

  constructor(db: Firestore) {
    this.db = db
  }

  private userProfilesRef(ctx: TenantContext) {
    return collection(this.db, 'tenants', ctx.tenantId, collectionName.userProfiles)
  }

  private personsRef(ctx: TenantContext) {
    return collection(this.db, 'tenants', ctx.tenantId, collectionName.persons)
  }

  private availabilityRef(ctx: TenantContext) {
    return collection(
      this.db,
      'tenants',
      ctx.tenantId,
      collectionName.availability,
    )
  }

  private tasksRef(ctx: TenantContext) {
    return collection(this.db, 'tenants', ctx.tenantId, collectionName.tasks)
  }

  private assignmentsRef(ctx: TenantContext) {
    return collection(
      this.db,
      'tenants',
      ctx.tenantId,
      collectionName.assignments,
    )
  }

  private teamsRef(ctx: TenantContext) {
    return collection(this.db, 'tenants', ctx.tenantId, collectionName.teams)
  }

  private venuesRef(ctx: TenantContext) {
    return collection(this.db, 'tenants', ctx.tenantId, collectionName.venues)
  }

  private sanitizeString(input: string | undefined) {
    if (typeof input === 'undefined') return undefined
    const trimmed = input.trim()
    return trimmed
  }

  private prepareTeamPayload(
    input: TeamWriteInput,
    existing?: TeamDoc,
  ): Partial<TeamDoc> {
    const payload: Partial<TeamDoc> = {}

    if (typeof input.name !== 'undefined') {
      const name = this.sanitizeString(input.name)
      if (!name) {
        throw new Error('チーム名を入力してください。')
      }
      payload.name = name
    } else if (!existing) {
      throw new Error('新規登録にはチーム名が必要です。')
    }

    if (typeof input.region !== 'undefined') {
      payload.region = input.region
    } else if (!existing) {
      throw new Error('新規登録には地域コードが必要です。')
    }

    if (typeof input.category !== 'undefined') {
      payload.category = input.category
    } else if (!existing) {
      throw new Error('新規登録にはカテゴリが必要です。')
    }

    if (typeof input.league !== 'undefined') {
      payload.league = this.sanitizeString(input.league)
    }
    if (typeof input.shortName !== 'undefined') {
      payload.shortName = this.sanitizeString(input.shortName)
    }
    if (typeof input.leagueCode !== 'undefined') {
      payload.leagueCode = this.sanitizeString(input.leagueCode)
    }
    if (typeof input.regionLabel !== 'undefined') {
      payload.regionLabel = this.sanitizeString(input.regionLabel)
    }
    if (typeof input.primaryLabel !== 'undefined') {
      payload.primaryLabel = this.sanitizeString(input.primaryLabel)
    }
    if (typeof input.slug !== 'undefined') {
      payload.slug = this.sanitizeString(input.slug)
    }
    if (typeof input.sourcePath !== 'undefined') {
      payload.sourcePath = this.sanitizeString(input.sourcePath)
    }
    if (typeof input.isActive !== 'undefined') {
      payload.isActive = input.isActive ?? undefined
    }

    return payload
  }

  private prepareVenuePayload(
    input: VenueWriteInput,
    existing?: VenueDoc,
  ): Partial<VenueDoc> {
    const payload: Partial<VenueDoc> = {}

    if (typeof input.name !== 'undefined') {
      const name = this.sanitizeString(input.name)
      if (!name) {
        throw new Error('会場名を入力してください。')
      }
      payload.name = name
    } else if (!existing) {
      throw new Error('新規登録には会場名が必要です。')
    }

    if (typeof input.type !== 'undefined') {
      payload.type = input.type
    } else if (!existing) {
      throw new Error('新規登録には会場タイプが必要です。')
    }

    if (typeof input.region !== 'undefined') {
      payload.region = input.region
    } else if (!existing) {
      throw new Error('新規登録には地域コードが必要です。')
    }

    if (typeof input.address !== 'undefined') {
      payload.address = this.sanitizeString(input.address)
    }
    if (typeof input.note !== 'undefined') {
      payload.note = this.sanitizeString(input.note)
    }
    if (typeof input.regionLabel !== 'undefined') {
      payload.regionLabel = this.sanitizeString(input.regionLabel)
    }
    if (typeof input.categoryLabel !== 'undefined') {
      payload.categoryLabel = this.sanitizeString(input.categoryLabel)
    }
    if (typeof input.slug !== 'undefined') {
      payload.slug = this.sanitizeString(input.slug)
    }
    if (typeof input.isActive !== 'undefined') {
      payload.isActive = input.isActive ?? undefined
    }

    return payload
  }

  private toUserProfile(
    snap:
      | QueryDocumentSnapshot<DocumentData>
      | DocumentSnapshot<DocumentData>,
    tenantId: TenantId,
  ): UserProfile {
    const data = snap.data() as UserProfileDoc | undefined
    if (!data) {
      throw new Error('User profile document is missing data')
    }
    return {
      ...data,
      id: snap.id,
      tenantId,
    }
  }

  private toPerson(
    snap:
      | QueryDocumentSnapshot<DocumentData>
      | DocumentSnapshot<DocumentData>,
    tenantId: TenantId,
  ): Person {
    const data = snap.data() as PersonDoc | undefined
    if (!data) {
      throw new Error('Person document is missing data')
    }
    return {
      ...data,
      id: snap.id,
      tenantId,
    }
  }

  private toAvailability(
    snap:
      | QueryDocumentSnapshot<DocumentData>
      | DocumentSnapshot<DocumentData>,
    tenantId: TenantId,
  ): Availability {
    const data = snap.data() as AvailabilityDoc | undefined
    if (!data) {
      throw new Error('Availability document is missing data')
    }
    return {
      ...data,
      id: snap.id,
      tenantId,
    }
  }

  private toTask(
    snap:
      | QueryDocumentSnapshot<DocumentData>
      | DocumentSnapshot<DocumentData>,
    tenantId: TenantId,
  ): Task {
    const data = snap.data() as TaskDoc | undefined
    if (!data) {
      throw new Error('Task document is missing data')
    }
    return {
      ...data,
      id: snap.id,
      tenantId,
    }
  }

  private toAssignment(
    snap:
      | QueryDocumentSnapshot<DocumentData>
      | DocumentSnapshot<DocumentData>,
    tenantId: TenantId,
  ): Assignment {
    const data = snap.data() as AssignmentDoc | undefined
    if (!data) {
      throw new Error('Assignment document is missing data')
    }
    return {
      ...data,
      id: snap.id,
      tenantId,
    }
  }

  private toTeam(
    snap: QueryDocumentSnapshot<DocumentData> | DocumentSnapshot<DocumentData>,
  ): Team {
    const data = snap.data() as TeamDoc | undefined
    if (!data) {
      throw new Error('Team document is missing data')
    }
    return {
      ...data,
      id: snap.id,
    }
  }

  private toVenue(
    snap: QueryDocumentSnapshot<DocumentData> | DocumentSnapshot<DocumentData>,
  ): Venue {
    const data = snap.data() as VenueDoc | undefined
    if (!data) {
      throw new Error('Venue document is missing data')
    }
    return {
      ...data,
      id: snap.id,
    }
  }

  private auditFields(
    ctx: TenantContext,
    existing?: { createdAt?: string | null; createdBy?: UserId | null },
  ) {
    const now = toIsoDateTime()
    if (existing?.createdAt && existing.createdBy) {
      return {
        createdAt: existing.createdAt,
        createdBy: existing.createdBy,
        updatedAt: now,
        updatedBy: ctx.actorId,
      }
    }
    return {
      createdAt: now,
      createdBy: ctx.actorId,
      updatedAt: now,
      updatedBy: ctx.actorId,
    }
  }

  async listUserProfiles(ctx: TenantContext): Promise<UserProfile[]> {
    const snapshot = await getDocs(this.userProfilesRef(ctx))
    return snapshot.docs
      .map((docSnap) => this.toUserProfile(docSnap, ctx.tenantId))
      .sort((a, b) => a.displayName.localeCompare(b.displayName, 'ja'))
  }

  async upsertUserProfile(
    ctx: TenantContext,
    input: UserProfileWriteInput,
  ): Promise<UserProfile> {
    const now = toIsoDateTime()

    if (input.id) {
      const docRef = doc(this.userProfilesRef(ctx), input.id)
      const existingSnap = await getDoc(docRef)
      const existingData = existingSnap.exists()
        ? (existingSnap.data() as UserProfileDoc)
        : undefined

      const baseline: UserProfileDoc =
        existingData ?? {
          tenantId: ctx.tenantId,
          email: '',
          displayName: '',
          photoURL: null,
          role: 'viewer' satisfies UserRole,
          status: 'active' satisfies UserStatus,
          note: null,
          createdAt: now,
          createdBy: ctx.actorId,
          updatedAt: now,
          updatedBy: ctx.actorId,
        }

      const next: UserProfileDoc = {
        tenantId: ctx.tenantId,
        email:
          typeof input.email === 'undefined'
            ? baseline.email
            : input.email ?? '',
        displayName:
          typeof input.displayName === 'undefined'
            ? baseline.displayName
            : input.displayName ??
              input.email ??
              baseline.email ??
              '',
        photoURL:
          typeof input.photoURL === 'undefined'
            ? baseline.photoURL ?? null
            : input.photoURL ?? null,
        role:
          typeof input.role === 'undefined'
            ? baseline.role
            : input.role ?? baseline.role,
        status:
          typeof input.status === 'undefined'
            ? baseline.status
            : input.status ?? baseline.status,
        note:
          typeof input.note === 'undefined'
            ? baseline.note ?? null
            : input.note ?? null,
        createdAt: baseline.createdAt ?? now,
        createdBy: baseline.createdBy ?? ctx.actorId,
        updatedAt: now,
        updatedBy: ctx.actorId,
      }

      await setDoc(docRef, next, { merge: false })
      const finalSnap = await getDoc(docRef)
      return this.toUserProfile(finalSnap, ctx.tenantId)
    }

    const payload: UserProfileDoc = {
      tenantId: ctx.tenantId,
      email: input.email ?? '',
      displayName: input.displayName ?? input.email ?? '未設定',
      photoURL:
        typeof input.photoURL === 'undefined' ? null : input.photoURL ?? null,
      role: input.role ?? ('viewer' satisfies UserRole),
      status: input.status ?? ('invited' satisfies UserStatus),
      note: typeof input.note === 'undefined' ? null : input.note ?? null,
      createdAt: now,
      createdBy: ctx.actorId,
      updatedAt: now,
      updatedBy: ctx.actorId,
    }

    const created = await addDoc(this.userProfilesRef(ctx), payload)
    const finalSnap = await getDoc(created)
    return this.toUserProfile(finalSnap, ctx.tenantId)
  }

  async removeUserProfile(ctx: TenantContext, userId: UserId): Promise<void> {
    await deleteDoc(doc(this.userProfilesRef(ctx), userId))
  }

  async upsertTeam(ctx: TenantContext, input: TeamWriteInput): Promise<Team> {
    if (!input.id) {
      throw new Error('チーム ID が指定されていません。')
    }
    const docRef = doc(this.teamsRef(ctx), input.id)
    const existingSnap = await getDoc(docRef)
    const existingData = existingSnap.exists()
      ? (existingSnap.data() as TeamDoc)
      : undefined
    const payload = this.prepareTeamPayload(input, existingData)
    await setDoc(docRef, payload, { merge: true })
    const finalSnap = await getDoc(docRef)
    return this.toTeam(finalSnap)
  }

  async removeTeam(ctx: TenantContext, teamId: Team['id']): Promise<void> {
    await deleteDoc(doc(this.teamsRef(ctx), teamId))
  }

  async upsertVenue(ctx: TenantContext, input: VenueWriteInput): Promise<Venue> {
    if (!input.id) {
      throw new Error('会場 ID が指定されていません。')
    }
    const docRef = doc(this.venuesRef(ctx), input.id)
    const existingSnap = await getDoc(docRef)
    const existingData = existingSnap.exists()
      ? (existingSnap.data() as VenueDoc)
      : undefined
    const payload = this.prepareVenuePayload(input, existingData)
    await setDoc(docRef, payload, { merge: true })
    const finalSnap = await getDoc(docRef)
    return this.toVenue(finalSnap)
  }

  async listPersons(ctx: TenantContext): Promise<Person[]> {
    const snapshot = await getDocs(this.personsRef(ctx))
    return snapshot.docs.map((docSnap) => this.toPerson(docSnap, ctx.tenantId))
  }

  async upsertPerson(
    ctx: TenantContext,
    input: PersonWriteInput,
  ): Promise<Person> {
    const payloadBase = {
      displayName: input.displayName,
      tags: input.tags ?? [],
      skills: input.skills ?? [],
      note: input.note,
      tenantId: ctx.tenantId,
    }

    if (input.id) {
      const docRef = doc(this.personsRef(ctx), input.id)
      const existingSnap = await getDoc(docRef)
      const existingData = existingSnap.exists()
        ? (existingSnap.data() as PersonDoc)
        : undefined
      await setDoc(
        docRef,
        {
          ...payloadBase,
          ...this.auditFields(ctx, {
            createdAt: existingData?.createdAt,
            createdBy: existingData?.createdBy,
          }),
        } as PersonDoc,
        { merge: true },
      )
      const finalSnap = await getDoc(docRef)
      return this.toPerson(finalSnap, ctx.tenantId)
    }

    const created = await addDoc(this.personsRef(ctx), {
      ...payloadBase,
      ...this.auditFields(ctx),
    } as PersonDoc)
    const finalSnap = await getDoc(created)
    return this.toPerson(finalSnap, ctx.tenantId)
  }

  async removePerson(ctx: TenantContext, personId: PersonId): Promise<void> {
    await deleteDoc(doc(this.personsRef(ctx), personId))
  }

  async listAvailability(
    ctx: TenantContext,
    query: AvailabilityQuery = {},
  ): Promise<Availability[]> {
    const snapshot = await getDocs(this.availabilityRef(ctx))
    let items = snapshot.docs.map((docSnap) =>
      this.toAvailability(docSnap, ctx.tenantId),
    )
    if (query.personIds?.length) {
      const personSet = new Set(query.personIds)
      items = items.filter((item) => personSet.has(item.personId))
    }
    if (query.dateRange) {
      items = items.filter(
        (item) =>
          item.date >= query.dateRange!.start &&
          item.date <= query.dateRange!.end,
      )
    }
    return items
  }

  async upsertAvailability(
    ctx: TenantContext,
    input: AvailabilityWriteInput,
  ): Promise<Availability> {
    const payloadBase = {
      personId: input.personId,
      date: toIsoDate(input.date),
      slot: input.slot as AvailabilitySlot,
      note: input.note,
      tenantId: ctx.tenantId,
    }

    if (input.id) {
      const docRef = doc(this.availabilityRef(ctx), input.id)
      const existingSnap = await getDoc(docRef)
      const existingData = existingSnap.exists()
        ? (existingSnap.data() as AvailabilityDoc)
        : undefined
      await setDoc(
        docRef,
        {
          ...payloadBase,
          ...this.auditFields(ctx, {
            createdAt: existingData?.createdAt,
            createdBy: existingData?.createdBy,
          }),
        } as AvailabilityDoc,
        { merge: true },
      )
      const finalSnap = await getDoc(docRef)
      return this.toAvailability(finalSnap, ctx.tenantId)
    }

    const created = await addDoc(this.availabilityRef(ctx), {
      ...payloadBase,
      ...this.auditFields(ctx),
    } as AvailabilityDoc)
    const finalSnap = await getDoc(created)
    return this.toAvailability(finalSnap, ctx.tenantId)
  }

  async removeAvailability(
    ctx: TenantContext,
    availabilityId: AvailabilityId,
  ): Promise<void> {
    await deleteDoc(doc(this.availabilityRef(ctx), availabilityId))
  }

  async listTasks(ctx: TenantContext, query: TaskQuery = {}): Promise<Task[]> {
    const snapshot = await getDocs(this.tasksRef(ctx))
    let items = snapshot.docs.map((docSnap) =>
      this.toTask(docSnap, ctx.tenantId),
    )
    if (query.taskIds?.length) {
      const idSet = new Set(query.taskIds)
      items = items.filter((item) => idSet.has(item.id))
    }
    if (query.dateRange) {
      items = items.filter(
        (item) =>
          item.date >= query.dateRange!.start &&
          item.date <= query.dateRange!.end,
      )
    }
    items.sort((a, b) => a.date.localeCompare(b.date))
    return items
  }

  async upsertTask(ctx: TenantContext, input: TaskWriteInput): Promise<Task> {
    if (input.id) {
      const docRef = doc(this.tasksRef(ctx), input.id)
      const existingSnap = await getDoc(docRef)
      const existingData = existingSnap.exists()
        ? (existingSnap.data() as TaskDoc)
        : undefined

      const updatePayload: Partial<TaskDoc> = {
        date: toIsoDate(input.date),
        startTime: input.startTime,
        endTime: input.endTime,
        venue: input.venue,
        venueId: input.venueId ?? existingData?.venueId,
        venueName: input.venueName ?? input.venue ?? existingData?.venueName,
        title: input.title,
        required: input.required,
        role: input.role ?? existingData?.role,
        league: input.league ?? existingData?.league,
        hostTeamId: input.hostTeamId ?? existingData?.hostTeamId,
        hostTeamName: input.hostTeamName ?? existingData?.hostTeamName,
        opponentTeamId: input.opponentTeamId ?? existingData?.opponentTeamId,
        opponentTeamName:
          input.opponentTeamName ?? existingData?.opponentTeamName,
        durationMinutes:
          input.durationMinutes ?? existingData?.durationMinutes,
        contact: input.contact ?? existingData?.contact,
        assignmentNotes: input.assignmentNotes ?? existingData?.assignmentNotes,
        tenantId: ctx.tenantId,
      }

      if (typeof input.status !== 'undefined') {
        updatePayload.status = input.status
      }

      if (input.metadata) {
        updatePayload.metadata = input.metadata
      }

      if (input.tags) {
        updatePayload.tags = input.tags
      }

      await setDoc(
        docRef,
        {
          ...updatePayload,
          ...this.auditFields(ctx, {
            createdAt: existingData?.createdAt,
            createdBy: existingData?.createdBy,
          }),
        } as TaskDoc,
        { merge: true },
      )
      const finalSnap = await getDoc(docRef)
      return this.toTask(finalSnap, ctx.tenantId)
    }

    const createdPayload: TaskDoc = {
      date: toIsoDate(input.date),
      startTime: input.startTime,
      endTime: input.endTime,
      venue: input.venue,
      venueId: input.venueId,
      venueName: input.venueName ?? input.venue,
      title: input.title,
      required: input.required,
      role: input.role,
      metadata: input.metadata ?? {},
      league: input.league,
      hostTeamId: input.hostTeamId,
      hostTeamName: input.hostTeamName,
      opponentTeamId: input.opponentTeamId,
      opponentTeamName: input.opponentTeamName,
      durationMinutes: input.durationMinutes,
      status: input.status ?? 'scheduled',
      contact: input.contact,
      assignmentNotes: input.assignmentNotes,
      tags: input.tags ?? [],
      tenantId: ctx.tenantId,
      ...this.auditFields(ctx),
    }

    const created = await addDoc(this.tasksRef(ctx), createdPayload)
    const finalSnap = await getDoc(created)
    return this.toTask(finalSnap, ctx.tenantId)
  }

  async removeTask(ctx: TenantContext, taskId: TaskId): Promise<void> {
    await deleteDoc(doc(this.tasksRef(ctx), taskId))
  }

  observeTasks(
    ctx: TenantContext,
    _query: TaskQuery,
    observer: CollectionObserver<Task>,
  ): Unsubscribe {
    return onSnapshot(
      this.tasksRef(ctx),
      (snapshot) => {
        const items = snapshot.docs
          .map((docSnap) => this.toTask(docSnap, ctx.tenantId))
          .sort((a, b) => a.date.localeCompare(b.date))
        observer(items)
      },
      (error) => {
        console.error('Failed to observe tasks', error)
      },
    )
  }

  async listAssignments(
    ctx: TenantContext,
    query: AssignmentQuery = {},
  ): Promise<Assignment[]> {
    const snapshot = await getDocs(this.assignmentsRef(ctx))
    type AssignmentStored = AssignmentDoc & {
      taskDate?: IsoDateString | null
    }
    let docs = snapshot.docs as QueryDocumentSnapshot<AssignmentStored>[]

    if (query.taskIds?.length) {
      const idSet = new Set(query.taskIds)
      docs = docs.filter((docSnap) => idSet.has(docSnap.data().taskId))
    }
    if (query.personIds?.length) {
      const personSet = new Set(query.personIds)
      docs = docs.filter((docSnap) => personSet.has(docSnap.data().personId))
    }
    if (query.dateRange) {
      docs = docs.filter((docSnap) => {
        const taskDate = docSnap.data().taskDate
        if (!taskDate) return false
        return (
          taskDate >= query.dateRange!.start &&
          taskDate <= query.dateRange!.end
        )
      })
    }
    return docs.map((docSnap) => this.toAssignment(docSnap, ctx.tenantId))
  }

  async upsertAssignment(
    ctx: TenantContext,
    input: AssignmentWriteInput,
  ): Promise<Assignment> {
    const now = toIsoDateTime()
    const payloadBase = {
      taskId: input.taskId,
      personId: input.personId,
      role: input.role,
      status: input.status ?? defaultAssignmentStatus,
      note: input.note,
      tenantId: ctx.tenantId,
      taskDate: null as IsoDateString | null,
    }

    // fetch task date for filtering convenience
    const taskSnap = await getDoc(doc(this.tasksRef(ctx), input.taskId))
    if (taskSnap.exists()) {
      const taskData = taskSnap.data() as TaskDoc
      payloadBase.taskDate = taskData.date
    }

    if (input.id) {
      const docRef = doc(this.assignmentsRef(ctx), input.id)
      const existingSnap = await getDoc(docRef)
      const existingData = existingSnap.exists()
        ? (existingSnap.data() as AssignmentDoc & { taskDate?: IsoDateString | null })
        : undefined
      await setDoc(
        docRef,
        {
          ...payloadBase,
          taskDate: payloadBase.taskDate ?? existingData?.taskDate ?? null,
          createdAt: existingData?.createdAt ?? now,
          createdBy: existingData?.createdBy ?? ctx.actorId,
          updatedAt: now,
          updatedBy: ctx.actorId,
        } as AssignmentDoc & { taskDate?: IsoDateString | null },
        { merge: true },
      )
      const finalSnap = await getDoc(docRef)
      return this.toAssignment(finalSnap, ctx.tenantId)
    }

    const created = await addDoc(this.assignmentsRef(ctx), {
      ...payloadBase,
      taskDate: payloadBase.taskDate,
      createdAt: now,
      createdBy: ctx.actorId,
      updatedAt: now,
      updatedBy: ctx.actorId,
    } as AssignmentDoc & { taskDate?: IsoDateString | null })
    const finalSnap = await getDoc(created)
    return this.toAssignment(finalSnap, ctx.tenantId)
  }

  async removeAssignment(
    ctx: TenantContext,
    assignmentId: AssignmentId,
  ): Promise<void> {
    await deleteDoc(doc(this.assignmentsRef(ctx), assignmentId))
  }

  observeAssignments(
    ctx: TenantContext,
    _query: AssignmentQuery,
    observer: CollectionObserver<Assignment>,
  ): Unsubscribe {
    return onSnapshot(
      this.assignmentsRef(ctx),
      (snapshot) => {
        const items = snapshot.docs.map((docSnap) =>
          this.toAssignment(docSnap, ctx.tenantId),
        )
        observer(items)
      },
      (error) => {
        console.error('Failed to observe assignments', error)
      },
    )
  }

  async listTeams(ctx: TenantContext): Promise<Team[]> {
    const snapshot = await getDocs(this.teamsRef(ctx))
    return snapshot.docs
      .map((docSnap) => this.toTeam(docSnap))
      .sort((a, b) => a.name.localeCompare(b.name, 'ja'))
  }

  async listVenues(ctx: TenantContext): Promise<Venue[]> {
    const snapshot = await getDocs(this.venuesRef(ctx))
    return snapshot.docs
      .map((docSnap) => this.toVenue(docSnap))
      .sort((a, b) => a.name.localeCompare(b.name, 'ja'))
  }
}
