import { useEffect, useMemo, useState, type FormEvent } from 'react'
import type { Person, Team, Venue } from '@coop-assign/domain'
import { useMasterData } from '../providers/MasterDataProvider'

type ViewMode = 'teams' | 'venues' | 'persons'

const VIEW_LABELS: Record<ViewMode, string> = {
  teams: 'チーム',
  venues: '会場',
  persons: '審判',
}

const VENUE_TYPE_OPTIONS: Array<{ value: Venue['type']; label: string }> = [
  { value: 'university', label: '大学施設' },
  { value: 'stadium', label: '球場' },
]

const PRIMARY_LABEL_BY_CATEGORY: Record<Team['category'] | 'default', string> = {
  university: '大学',
  corporate: '社会人',
  club: '社会人',
  default: '未設定',
}

const normalize = (value?: string | null) => value?.trim() ?? ''

const resolvePrimaryLabel = (category: Team['category'], current?: string | null) => {
  const normalized = normalize(current)
  if (normalized.length > 0) return normalized
  return PRIMARY_LABEL_BY_CATEGORY[category] ?? PRIMARY_LABEL_BY_CATEGORY.default
}

type Feedback = { type: 'success' | 'error'; message: string }

export function MasterDataPreview() {
  const {
    teams,
    venues,
    persons,
    loading,
    error,
    updateTeam,
    removeTeam,
    updateVenue,
    updatePerson,
  } = useMasterData()

  const [viewMode, setViewMode] = useState<ViewMode>('teams')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [teamPrimaryFilter, setTeamPrimaryFilter] = useState<string>('all')
  const [teamRegionFilter, setTeamRegionFilter] = useState<string>('all')
  const [teamLeagueFilter, setTeamLeagueFilter] = useState<string>('all')
  const [venueTypeFilter, setVenueTypeFilter] = useState<string>('all')
  const [venueRegionFilter, setVenueRegionFilter] = useState<string>('all')

  useEffect(() => {
    if (!feedback) return
    const timer = window.setTimeout(() => setFeedback(null), 3200)
    return () => window.clearTimeout(timer)
  }, [feedback])

  useEffect(() => {
    setTeamRegionFilter('all')
    setTeamLeagueFilter('all')
  }, [teamPrimaryFilter])

  useEffect(() => {
    setTeamLeagueFilter('all')
  }, [teamRegionFilter])

  useEffect(() => {
    setVenueRegionFilter('all')
  }, [venueTypeFilter])

  useEffect(() => {
    if (viewMode !== 'teams') {
      setTeamPrimaryFilter('all')
      setTeamRegionFilter('all')
      setTeamLeagueFilter('all')
    }
    if (viewMode !== 'venues') {
      setVenueTypeFilter('all')
      setVenueRegionFilter('all')
    }
  }, [viewMode])

  const matchFilter = (value: string, filter: string) =>
    filter === 'all' || value === filter

  const buildTeamOptions = (
    list: Team[],
    selector: (team: Team) => string | undefined | null,
  ) => {
    const map = new Map<string, string>()
    list.forEach((team) => {
      const raw = normalize(selector(team))
      const label = raw.length > 0 ? raw : '未設定'
      if (!map.has(raw)) {
        map.set(raw, label)
      }
    })
    return [
      { value: 'all', label: 'すべて' },
      ...Array.from(map.entries())
        .sort((a, b) => a[1].localeCompare(b[1], 'ja'))
        .map(([value, label]) => ({ value, label })),
    ]
  }

  const getVenueTypeLabel = (value?: string | null) =>
    VENUE_TYPE_OPTIONS.find((option) => option.value === value)?.label ??
    (normalize(value) || '未設定')

  const teamsFilteredByPrimary = useMemo(() => {
    if (teamPrimaryFilter === 'all') return teams
    return teams.filter((team) =>
      matchFilter(normalize(team.primaryLabel), teamPrimaryFilter),
    )
  }, [teams, teamPrimaryFilter])

  const teamsFilteredByRegion = useMemo(() => {
    if (teamRegionFilter === 'all') return teamsFilteredByPrimary
    return teamsFilteredByPrimary.filter((team) =>
      matchFilter(normalize(team.regionLabel), teamRegionFilter),
    )
  }, [teamsFilteredByPrimary, teamRegionFilter])

  const teamPrimaryOptions = useMemo(
    () => buildTeamOptions(teams, (team) => team.primaryLabel),
    [teams],
  )
  const teamRegionOptions = useMemo(
    () => buildTeamOptions(teamsFilteredByPrimary, (team) => team.regionLabel),
    [teamsFilteredByPrimary],
  )
  const teamLeagueOptions = useMemo(
    () => buildTeamOptions(teamsFilteredByRegion, (team) => team.league),
    [teamsFilteredByRegion],
  )
  const venueTypeOptions = useMemo(() => {
    const map = new Map<string, string>()
    venues.forEach((venue) => {
      const raw = normalize(venue.type)
      const label = getVenueTypeLabel(venue.type)
      if (!map.has(raw)) {
        map.set(raw, label)
      }
    })
    return [
      { value: 'all', label: 'すべて' },
      ...Array.from(map.entries())
        .sort((a, b) => a[1].localeCompare(b[1], 'ja'))
        .map(([value, label]) => ({ value, label })),
    ]
  }, [venues])

  const venueRegionOptions = useMemo(() => {
    const map = new Map<string, string>()
    venues.forEach((venue) => {
      const raw = normalize(venue.regionLabel)
      const label = raw.length > 0 ? raw : '未設定'
      if (!map.has(raw)) {
        map.set(raw, label)
      }
    })
    return [
      { value: 'all', label: 'すべて' },
      ...Array.from(map.entries())
        .sort((a, b) => a[1].localeCompare(b[1], 'ja'))
        .map(([value, label]) => ({ value, label })),
    ]
  }, [venues])

  const filteredList = useMemo(() => {
    const keyword = searchTerm.trim().toLocaleLowerCase('ja')
    if (viewMode === 'teams') {
      let list = teams
      list = list.filter((team) =>
        matchFilter(normalize(team.primaryLabel), teamPrimaryFilter),
      )
      list = list.filter((team) =>
        matchFilter(normalize(team.regionLabel), teamRegionFilter),
      )
      list = list.filter((team) =>
        matchFilter(normalize(team.league), teamLeagueFilter),
      )
      if (keyword.length > 0) {
        list = list.filter((team) =>
          `${team.name} ${team.primaryLabel ?? ''} ${team.regionLabel ?? ''} ${
            team.league ?? ''
          }`
            .toLocaleLowerCase('ja')
            .includes(keyword),
        )
      }
      return list
    }
    if (viewMode === 'venues') {
      let list = venues
      list = list.filter((venue) => matchFilter(normalize(venue.type), venueTypeFilter))
      list = list.filter((venue) =>
        matchFilter(normalize(venue.regionLabel), venueRegionFilter),
      )
      if (keyword.length > 0) {
        list = list.filter((venue) =>
          `${venue.name} ${venue.address ?? ''} ${venue.note ?? ''}`
            .toLocaleLowerCase('ja')
            .includes(keyword),
        )
      }
      return list
    }
    if (keyword.length === 0) return persons
    return persons.filter((person) =>
      `${person.displayName ?? ''} ${person.note ?? ''} ${person.tags.join(' ')}`
        .toLocaleLowerCase('ja')
        .includes(keyword),
    )
  }, [
    viewMode,
    searchTerm,
    teams,
    venues,
    persons,
    teamPrimaryFilter,
    teamRegionFilter,
    teamLeagueFilter,
    venueTypeFilter,
    venueRegionFilter,
  ])

  useEffect(() => {
    if (filteredList.length === 0) {
      setSelectedId(null)
      return
    }
    setSelectedId((prev) => {
      if (prev && filteredList.some((item) => item.id === prev)) {
        return prev
      }
      return filteredList[0]?.id ?? null
    })
  }, [filteredList])

  const selectedItem: Team | Venue | Person | null =
    viewMode === 'teams'
      ? teams.find((team) => team.id === selectedId) ?? null
      : viewMode === 'venues'
        ? venues.find((venue) => venue.id === selectedId) ?? null
        : persons.find((person) => person.id === selectedId) ?? null

  const handleTeamSave = async (values: TeamEditorState) => {
    if (!selectedItem || viewMode !== 'teams') return
    const team = selectedItem as Team
    setSaving(true)
    setFeedback(null)
    try {
      const primaryLabel = resolvePrimaryLabel(team.category, team.primaryLabel)
      await updateTeam({
        id: team.id,
        name: values.name,
        category: team.category,
        league: values.league.trim() ? values.league.trim() : undefined,
        primaryLabel,
        regionLabel: values.regionLabel.trim() ? values.regionLabel.trim() : undefined,
        isActive: values.isActive,
      })
      setFeedback({ type: 'success', message: 'チーム情報を更新しました。' })
    } catch (err) {
      console.error(err)
      const message =
        err instanceof Error ? err.message : 'チーム情報の更新に失敗しました。'
      setFeedback({ type: 'error', message })
    } finally {
      setSaving(false)
    }
  }

  const handleTeamDelete = async (team: Team) => {
    if (!window.confirm(`${team.name} を削除しますか？`)) {
      return
    }
    setRemoving(true)
    setFeedback(null)
    try {
      await removeTeam(team.id)
      setFeedback({ type: 'success', message: 'チームを削除しました。' })
      setSelectedId(null)
    } catch (err) {
      console.error(err)
      const message =
        err instanceof Error ? err.message : 'チームの削除に失敗しました。'
      setFeedback({ type: 'error', message })
    } finally {
      setRemoving(false)
    }
  }

  const handleVenueSave = async (values: VenueEditorState) => {
    if (!selectedItem || viewMode !== 'venues') return
    setSaving(true)
    setFeedback(null)
    try {
      await updateVenue({
        id: selectedItem.id,
        name: values.name,
        type: values.type,
        regionLabel: values.regionLabel.trim() ? values.regionLabel.trim() : '東海',
        address: values.address.trim() ? values.address.trim() : undefined,
        note: values.note.trim() ? values.note.trim() : undefined,
        isActive: values.isActive,
      })
      setFeedback({ type: 'success', message: '会場情報を更新しました。' })
    } catch (err) {
      console.error(err)
      const message =
        err instanceof Error ? err.message : '会場情報の更新に失敗しました。'
      setFeedback({ type: 'error', message })
    } finally {
      setSaving(false)
    }
  }

  const handlePersonSave = async (values: PersonEditorState) => {
    if (!selectedItem || viewMode !== 'persons') return
    setSaving(true)
    setFeedback(null)
    try {
      const tags = parseList(values.tags)
      const skills = parseList(values.skills)
      await updatePerson({
        id: selectedItem.id,
        displayName: values.displayName,
        tags,
        skills,
        note: values.note.trim() ? values.note.trim() : undefined,
      })
      setFeedback({ type: 'success', message: '審判情報を更新しました。' })
    } catch (err) {
      console.error(err)
      const message =
        err instanceof Error ? err.message : '審判情報の更新に失敗しました。'
      setFeedback({ type: 'error', message })
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="app__section">
      <header className="master-header">
        <div>
          <h2>マスターデータ</h2>
          <p className="app__muted">チーム・会場・審判の属性をここでメンテナンスします。</p>
        </div>
        <div className="master-view-toggle">
          {(Object.keys(VIEW_LABELS) as ViewMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              className={
                viewMode === mode
                  ? 'master-view-toggle__button is-active'
                  : 'master-view-toggle__button'
              }
              onClick={() => {
                setViewMode(mode)
                setSearchTerm('')
              }}
            >
              {VIEW_LABELS[mode]}
            </button>
          ))}
        </div>
      </header>

      {feedback && (
        <p className={feedback.type === 'success' ? 'app__notice' : 'app__alert'}>
          {feedback.message}
        </p>
      )}

      {error && <p className="app__alert">{error}</p>}

      <div className="master-layout">
        <aside className="master-sidebar">
          {viewMode === 'teams' && (
            <div className="master-team-filters">
              <label>
                表示ラベル（primaryLabel）
                <select
                  value={teamPrimaryFilter}
                  onChange={(event) => setTeamPrimaryFilter(event.target.value)}
                >
                  {teamPrimaryOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                地域ラベル（regionLabel）
                <select
                  value={teamRegionFilter}
                  onChange={(event) => setTeamRegionFilter(event.target.value)}
                >
                  {teamRegionOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                リーグ
                <select
                  value={teamLeagueFilter}
                  onChange={(event) => setTeamLeagueFilter(event.target.value)}
                >
                  {teamLeagueOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}
          {viewMode === 'venues' && (
            <div className="master-team-filters">
              <label>
                会場タイプ
                <select
                  value={venueTypeFilter}
                  onChange={(event) => setVenueTypeFilter(event.target.value)}
                >
                  {venueTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                地域ラベル
                <select
                  value={venueRegionFilter}
                  onChange={(event) => setVenueRegionFilter(event.target.value)}
                >
                  {venueRegionOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}
          <div className="master-sidebar__search">
            <input
              type="search"
              placeholder={`${VIEW_LABELS[viewMode]}を検索`}
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
            <span>{filteredList.length} 件</span>
          </div>
          {loading ? (
            <p className="app__muted">読み込み中…</p>
          ) : filteredList.length === 0 ? (
            <p className="app__muted">該当するデータがありません。</p>
          ) : (
            <ul className="master-select-list">
          {viewMode === 'teams'
                ? (filteredList as Team[]).map((team) => (
                    <li key={team.id}>
                      <button
                        type="button"
                        className={
                          team.id === selectedId
                            ? 'master-select-list__button is-active'
                            : 'master-select-list__button'
                        }
                        onClick={() => setSelectedId(team.id)}
                      >
                        <strong>{team.name}</strong>
                        <span>{`${team.primaryLabel ?? ''} / ${team.regionLabel ?? ''}`}</span>
                      </button>
                    </li>
                  ))
                : viewMode === 'venues'
                  ? (filteredList as Venue[]).map((venue) => (
                      <li key={venue.id}>
                        <button
                          type="button"
                          className={
                            venue.id === selectedId
                              ? 'master-select-list__button is-active'
                              : 'master-select-list__button'
                          }
                          onClick={() => setSelectedId(venue.id)}
                      >
                        <strong>{venue.name}</strong>
                        <span>{`${getVenueTypeLabel(venue.type)} / ${normalize(venue.regionLabel) || '未設定'}`}</span>
                      </button>
                    </li>
                  ))
                : (filteredList as Person[]).map((person) => (
                      <li key={person.id}>
                        <button
                          type="button"
                          className={
                            person.id === selectedId
                              ? 'master-select-list__button is-active'
                              : 'master-select-list__button'
                          }
                          onClick={() => setSelectedId(person.id)}
                        >
                          <strong>{person.displayName}</strong>
                          <span>{person.tags.join(', ')}</span>
                        </button>
                      </li>
                    ))}
            </ul>
          )}
        </aside>

        <div className="master-editor">
          {loading ? (
            <p className="app__muted">データの読み込みを待っています…</p>
          ) : !selectedItem ? (
            <p className="app__muted">
              {VIEW_LABELS[viewMode]}が選択されていません。リストから編集対象を選んでください。
            </p>
          ) : viewMode === 'teams' ? (
            <TeamEditor
              key={selectedItem.id}
              team={selectedItem as Team}
              onSubmit={handleTeamSave}
              saving={saving}
              removing={removing}
              onDelete={() => handleTeamDelete(selectedItem as Team)}
            />
          ) : viewMode === 'venues' ? (
            <VenueEditor
              key={selectedItem.id}
              venue={selectedItem as Venue}
              onSubmit={handleVenueSave}
              saving={saving}
            />
          ) : (
            <PersonEditor
              key={selectedItem.id}
              person={selectedItem as Person}
              onSubmit={handlePersonSave}
              saving={saving}
            />
          )}
        </div>
      </div>
    </section>
  )
}

type TeamEditorState = {
  name: string
  league: string
  regionLabel: string
  isActive: boolean
}

function TeamEditor({
  team,
  onSubmit,
  onDelete,
  saving,
  removing,
}: {
  team: Team
  onSubmit: (values: TeamEditorState) => Promise<void>
  onDelete: () => Promise<void>
  saving: boolean
  removing: boolean
}) {
  const [state, setState] = useState<TeamEditorState>(() => ({
    name: team.name,
    league: team.league ?? '',
    regionLabel: team.regionLabel ?? '',
    isActive: team.isActive ?? true,
  }))

  useEffect(() => {
    setState({
      name: team.name,
      league: team.league ?? '',
      regionLabel: team.regionLabel ?? '',
      isActive: team.isActive ?? true,
    })
  }, [team])

  const handleChange = (
    key: keyof TeamEditorState,
    value: string | boolean,
  ) => {
    setState((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    await onSubmit(state)
  }

  return (
    <form className="master-form" onSubmit={handleSubmit}>
      <header className="master-form__header">
        <div>
          <h3>{team.name}</h3>
          <p className="master-form__id">ID: {team.id}</p>
        </div>
        <div className="master-form__actions">
          <button
            className="app__button"
            type="submit"
            disabled={saving || removing}
          >
            {saving ? '保存中…' : '変更を保存'}
          </button>
          <button
            type="button"
            className="app__button app__button--danger"
            onClick={() => {
              void onDelete()
            }}
            disabled={saving || removing}
          >
            {removing ? '削除中…' : '削除'}
          </button>
        </div>
      </header>

      <div className="master-form__grid">
        <label>
          チーム名
          <input
            type="text"
            required
            value={state.name}
            onChange={(event) => handleChange('name', event.target.value)}
          />
        </label>
        <label>
          リーグ名
          <input
            type="text"
            value={state.league}
            onChange={(event) => handleChange('league', event.target.value)}
            placeholder="例: 東京六大学"
          />
        </label>
        <label>
          地域ラベル
          <input
            type="text"
            value={state.regionLabel}
            onChange={(event) => handleChange('regionLabel', event.target.value)}
            placeholder="例: 首都圏"
          />
        </label>
      </div>

      <label className="master-form__checkbox">
        <input
          type="checkbox"
          checked={state.isActive}
          onChange={(event) => handleChange('isActive', event.target.checked)}
        />
        稼働中のチームとして扱う
      </label>
    </form>
  )
}

type VenueEditorState = {
  name: string
  type: Venue['type']
  regionLabel: string
  address: string
  note: string
  isActive: boolean
}

function VenueEditor({
  venue,
  onSubmit,
  saving,
}: {
  venue: Venue
  onSubmit: (values: VenueEditorState) => Promise<void>
  saving: boolean
}) {
  const [state, setState] = useState<VenueEditorState>(() => ({
    name: venue.name,
    type: venue.type,
    regionLabel: venue.regionLabel ?? '東海',
    address: venue.address ?? '',
    note: venue.note ?? '',
    isActive: venue.isActive ?? true,
  }))

  useEffect(() => {
    setState({
      name: venue.name,
      type: venue.type,
      regionLabel: venue.regionLabel ?? '東海',
      address: venue.address ?? '',
      note: venue.note ?? '',
      isActive: venue.isActive ?? true,
    })
  }, [venue])

  const handleChange = (
    key: keyof VenueEditorState,
    value: string | boolean,
  ) => {
    setState((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    await onSubmit(state)
  }

  return (
    <form className="master-form" onSubmit={handleSubmit}>
      <header className="master-form__header">
        <div>
          <h3>{venue.name}</h3>
          <p className="master-form__id">ID: {venue.id}</p>
        </div>
        <button className="app__button" type="submit" disabled={saving}>
          {saving ? '保存中…' : '変更を保存'}
        </button>
      </header>

      <div className="master-form__grid">
        <label>
          会場名
          <input
            type="text"
            required
            value={state.name}
            onChange={(event) => handleChange('name', event.target.value)}
          />
        </label>
        <label>
          会場タイプ
          <select
            value={state.type}
            onChange={(event) =>
              handleChange('type', event.target.value as Venue['type'])
            }
          >
            {VENUE_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          地域ラベル
          <input
            type="text"
            value={state.regionLabel}
            onChange={(event) => handleChange('regionLabel', event.target.value)}
            placeholder="例: 東海"
          />
        </label>
        <label className="master-form__full">
          住所・所在地メモ
          <input
            type="text"
            value={state.address}
            onChange={(event) => handleChange('address', event.target.value)}
            placeholder="例: 東京都○○区..."
          />
        </label>
        <label className="master-form__full">
          備考
          <textarea
            rows={3}
            value={state.note}
            onChange={(event) => handleChange('note', event.target.value)}
            placeholder="運用上の注意点やアクセス方法など"
          />
        </label>
      </div>

      <label className="master-form__checkbox">
        <input
          type="checkbox"
          checked={state.isActive}
          onChange={(event) => handleChange('isActive', event.target.checked)}
        />
        稼働中の会場として扱う
      </label>
    </form>
  )
}

type PersonEditorState = {
  displayName: string
  tags: string
  skills: string
  note: string
}

function PersonEditor({
  person,
  onSubmit,
  saving,
}: {
  person: Person
  onSubmit: (values: PersonEditorState) => Promise<void>
  saving: boolean
}) {
  const [state, setState] = useState<PersonEditorState>(() => ({
    displayName: person.displayName,
    tags: person.tags.join(', '),
    skills: person.skills.join(', '),
    note: person.note ?? '',
  }))

  useEffect(() => {
    setState({
      displayName: person.displayName,
      tags: person.tags.join(', '),
      skills: person.skills.join(', '),
      note: person.note ?? '',
    })
  }, [person])

  const handleChange = (
    key: keyof PersonEditorState,
    value: string,
  ) => {
    setState((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    await onSubmit(state)
  }

  return (
    <form className="master-form" onSubmit={handleSubmit}>
      <header className="master-form__header">
        <div>
          <h3>{person.displayName}</h3>
          <p className="master-form__id">ID: {person.id}</p>
        </div>
        <button className="app__button" type="submit" disabled={saving}>
          {saving ? '保存中…' : '変更を保存'}
        </button>
      </header>

      <div className="master-form__grid">
        <label>
          氏名
          <input
            type="text"
            required
            value={state.displayName}
            onChange={(event) => handleChange('displayName', event.target.value)}
          />
        </label>
        <label className="master-form__full">
          タグ（カンマ区切り）
          <input
            type="text"
            value={state.tags}
            onChange={(event) => handleChange('tags', event.target.value)}
            placeholder="例: grade:A, 主審"
          />
        </label>
        <label className="master-form__full">
          スキル・担当可能ポジション（カンマ区切り）
          <input
            type="text"
            value={state.skills}
            onChange={(event) => handleChange('skills', event.target.value)}
            placeholder="例: 主審, 一塁, 三塁"
          />
        </label>
        <label className="master-form__full">
          備考
          <textarea
            rows={4}
            value={state.note}
            onChange={(event) => handleChange('note', event.target.value)}
            placeholder="連絡事項や注意点などを記録できます"
          />
        </label>
      </div>
    </form>
  )
}

function parseList(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
}
