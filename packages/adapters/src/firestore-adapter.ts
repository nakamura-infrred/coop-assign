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
  TenantId,
  UserId,
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
} from './storage-adapter.js'

const defaultAssignmentStatus: AssignmentStatus = 'draft'

const toIsoDate = (input: string | Date): string =>
  typeof input === 'string' ? input : input.toISOString().slice(0, 10)

const toIsoDateTime = (input: Date = new Date()): string => input.toISOString()

type PersonDoc = Omit<Person, 'id'>
type AvailabilityDoc = Omit<Availability, 'id'>
type TaskDoc = Omit<Task, 'id'>
type AssignmentDoc = Omit<Assignment, 'id'>

const collectionName: Record<
  'persons' | 'availability' | 'tasks' | 'assignments',
  string
> = {
  persons: 'persons',
  availability: 'availability',
  tasks: 'tasks',
  assignments: 'assignments',
}

export class FirestoreAdapter implements StorageAdapter {
  private readonly db: Firestore

  constructor(db: Firestore) {
    this.db = db
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
    const payloadBase = {
      date: toIsoDate(input.date),
      startTime: input.startTime,
      endTime: input.endTime,
      venue: input.venue,
      title: input.title,
      required: input.required,
      role: input.role,
      metadata: input.metadata ?? {},
      tenantId: ctx.tenantId,
    }

    if (input.id) {
      const docRef = doc(this.tasksRef(ctx), input.id)
      const existingSnap = await getDoc(docRef)
      const existingData = existingSnap.exists()
        ? (existingSnap.data() as TaskDoc)
        : undefined
      await setDoc(
        docRef,
        {
          ...payloadBase,
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

    const created = await addDoc(this.tasksRef(ctx), {
      ...payloadBase,
      ...this.auditFields(ctx),
    } as TaskDoc)
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
}
