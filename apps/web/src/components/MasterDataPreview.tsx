import { useCallback, useMemo, useState } from 'react'
import { useMasterData } from '../providers/MasterDataProvider'

type ViewMode = 'teams' | 'venues' | 'persons'
const PAGE_SIZE = 20
const GRADE_TAG_PREFIX = 'grade:'

const normalize = (value: string) => value.toLocaleLowerCase('ja')
const optionLabel = (value: string | null | undefined, fallback: string) =>
  value && value.trim().length > 0 ? value : fallback

export function MasterDataPreview() {
  const { teams, venues, persons, loading, error } = useMasterData()
  const [viewMode, setViewMode] = useState<ViewMode>('teams')

  const [teamFilter, setTeamFilter] = useState('')
  const [teamCategory, setTeamCategory] = useState('all')
  const [teamRegion, setTeamRegion] = useState('all')
  const [teamLeague, setTeamLeague] = useState('all')
  const [teamLimit, setTeamLimit] = useState(PAGE_SIZE)

  const [venueFilter, setVenueFilter] = useState('')
  const [venueType, setVenueType] = useState('all')
  const [venueRegion, setVenueRegion] = useState('all')
  const [venueLimit, setVenueLimit] = useState(PAGE_SIZE)

  const [personFilter, setPersonFilter] = useState('')
  const [personGrade, setPersonGrade] = useState('all')
  const [personLimit, setPersonLimit] = useState(PAGE_SIZE)

  const getPersonGrade = useCallback((person: { tags?: string[] }) => {
    const tag = person.tags?.find((value) => value.startsWith(GRADE_TAG_PREFIX))
    if (!tag) {
      return '未設定'
    }
    const grade = tag.slice(GRADE_TAG_PREFIX.length)
    return grade.length > 0 ? grade : '未設定'
  }, [])

  const teamCategories = useMemo(() => {
    const labels = new Set(
      teams.map((team) => optionLabel(team.primaryLabel ?? team.category ?? '', '未分類')),
    )
    return ['all', ...Array.from(labels).sort((a, b) => a.localeCompare(b, 'ja'))]
  }, [teams])

  const teamRegions = useMemo(() => {
    const labels = new Set(
      teams.map((team) => optionLabel(team.regionLabel ?? team.region ?? '', '未定義')),
    )
    return ['all', ...Array.from(labels).sort((a, b) => a.localeCompare(b, 'ja'))]
  }, [teams])

  const teamLeagues = useMemo(() => {
    const labels = new Set(
      teams
        .map((team) => (team.league && team.league.trim().length > 0 ? team.league : null))
        .filter((league): league is string => Boolean(league)),
    )
    return ['all', ...Array.from(labels).sort((a, b) => a.localeCompare(b, 'ja'))]
  }, [teams])

  const venueTypes = useMemo(() => {
    const labels = new Set(
      venues.map((venue) => optionLabel(venue.categoryLabel ?? venue.type ?? '', '未分類')),
    )
    return ['all', ...Array.from(labels).sort((a, b) => a.localeCompare(b, 'ja'))]
  }, [venues])

  const venueRegions = useMemo(() => {
    const labels = new Set(
      venues.map((venue) => optionLabel(venue.regionLabel ?? venue.region ?? '', '未定義')),
    )
    return ['all', ...Array.from(labels).sort((a, b) => a.localeCompare(b, 'ja'))]
  }, [venues])

  const personGrades = useMemo(() => {
    const labels = new Set(
      persons.map((person) => {
        const grade = getPersonGrade(person)
        return grade.length > 0 ? grade : '未設定'
      }),
    )
    return ['all', ...Array.from(labels).sort((a, b) => a.localeCompare(b, 'ja'))]
  }, [persons, getPersonGrade])

  const filteredTeams = useMemo(() => {
    const keyword = normalize(teamFilter.trim())
    return teams.filter((team) => {
      const categoryLabel = optionLabel(team.primaryLabel ?? team.category ?? '', '未分類')
      const regionLabel = optionLabel(team.regionLabel ?? team.region ?? '', '未定義')
      const leagueLabel = optionLabel(team.league ?? '', '未設定')

      const matchesCategory = teamCategory === 'all' || categoryLabel === teamCategory
      const matchesRegion = teamRegion === 'all' || regionLabel === teamRegion
      const matchesLeague = teamLeague === 'all' || leagueLabel === teamLeague
      const matchesKeyword =
        keyword.length === 0
          ? true
          : normalize(
              `${team.name}${categoryLabel}${regionLabel}${leagueLabel}${team.shortName ?? ''}`,
            ).includes(keyword)

      return matchesCategory && matchesRegion && matchesLeague && matchesKeyword
    })
  }, [teamCategory, teamRegion, teamLeague, teamFilter, teams])

  const filteredVenues = useMemo(() => {
    const keyword = normalize(venueFilter.trim())
    return venues.filter((venue) => {
      const typeLabel = optionLabel(venue.categoryLabel ?? venue.type ?? '', '未分類')
      const regionLabel = optionLabel(venue.regionLabel ?? venue.region ?? '', '未定義')

      const matchesType = venueType === 'all' || typeLabel === venueType
      const matchesRegion = venueRegion === 'all' || regionLabel === venueRegion
      const matchesKeyword =
        keyword.length === 0
          ? true
          : normalize(`${venue.name}${typeLabel}${regionLabel}`).includes(keyword)

      return matchesType && matchesRegion && matchesKeyword
    })
  }, [venueFilter, venues, venueType, venueRegion])

  const filteredPersons = useMemo(() => {
    const keyword = normalize(personFilter.trim())
    return persons.filter((person) => {
      const gradeLabel = getPersonGrade(person)
      const noteLabel = optionLabel(person.note ?? '', '未設定')

      const matchesGrade = personGrade === 'all' || gradeLabel === personGrade
      const matchesKeyword =
        keyword.length === 0
          ? true
          : normalize(
              `${person.displayName}${gradeLabel}${noteLabel}${(person.tags ?? []).join('')}`,
            ).includes(keyword)

      return matchesGrade && matchesKeyword
    })
  }, [getPersonGrade, personFilter, personGrade, persons])

  const visibleTeams = filteredTeams.slice(0, teamLimit)
  const visibleVenues = filteredVenues.slice(0, venueLimit)
  const visiblePersons = filteredPersons.slice(0, personLimit)

  if (!loading && teams.length === 0 && venues.length === 0 && persons.length === 0 && !error) {
    return (
      <section className="app__section">
        <h2>マスターデータ</h2>
        <p className="app__muted">Firestore にチーム・会場・審判データが登録されていません。</p>
      </section>
    )
  }

  const summaryText = (() => {
    switch (viewMode) {
      case 'teams':
        return `${filteredTeams.length.toLocaleString()} / ${teams.length.toLocaleString()} 件`
      case 'venues':
        return `${filteredVenues.length.toLocaleString()} / ${venues.length.toLocaleString()} 件`
      case 'persons':
        return `${filteredPersons.length.toLocaleString()} / ${persons.length.toLocaleString()} 件`
      default:
        return ''
    }
  })()

  const renderCurrentView = () => {
    if (loading) {
      return <p className="app__muted">マスターデータを読み込んでいます…</p>
    }

    if (viewMode === 'teams') {
      return (
        <div className="master-panel">
          <div className="master-filters">
            <label>
              区分
              <select
                value={teamCategory}
                onChange={(event) => {
                  setTeamCategory(event.target.value)
                  setTeamLimit(PAGE_SIZE)
                }}
              >
                {teamCategories.map((label) => (
                  <option key={label} value={label}>
                    {label === 'all' ? 'すべて' : label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              地域
              <select
                value={teamRegion}
                onChange={(event) => {
                  setTeamRegion(event.target.value)
                  setTeamLimit(PAGE_SIZE)
                }}
              >
                {teamRegions.map((label) => (
                  <option key={label} value={label}>
                    {label === 'all' ? 'すべて' : label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              リーグ
              <select
                value={teamLeague}
                onChange={(event) => {
                  setTeamLeague(event.target.value)
                  setTeamLimit(PAGE_SIZE)
                }}
              >
                {teamLeagues.map((label) => (
                  <option key={label} value={label}>
                    {label === 'all' ? 'すべて' : label}
                  </option>
                ))}
              </select>
            </label>
            <input
              className="master-grid__search"
              type="search"
              placeholder="チーム名で絞り込み"
              value={teamFilter}
              onChange={(event) => {
                setTeamFilter(event.target.value)
                setTeamLimit(PAGE_SIZE)
              }}
            />
          </div>

          {filteredTeams.length === 0 ? (
            <p className="app__muted">該当するチームが見つかりません。</p>
          ) : (
            <>
              <table className="master-table">
                <thead>
                  <tr>
                    <th>名称</th>
                    <th>区分</th>
                    <th>地域</th>
                    <th>リーグ</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleTeams.map((team) => (
                    <tr key={team.id}>
                      <td>{team.name}</td>
                      <td>{optionLabel(team.primaryLabel ?? team.category ?? '', '未設定')}</td>
                      <td>{optionLabel(team.regionLabel ?? team.region ?? '', '未設定')}</td>
                      <td>{optionLabel(team.league ?? '', '未設定')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredTeams.length > visibleTeams.length && (
                <button
                  className="master-more"
                  onClick={() => setTeamLimit((prev) => prev + PAGE_SIZE)}
                >
                  他 {filteredTeams.length - visibleTeams.length} 件を表示
                </button>
              )}
            </>
          )}
        </div>
      )
    }

    if (viewMode === 'venues') {
      return (
        <div className="master-panel">
          <div className="master-filters">
            <label>
              種別
              <select
                value={venueType}
                onChange={(event) => {
                  setVenueType(event.target.value)
                  setVenueLimit(PAGE_SIZE)
                }}
              >
                {venueTypes.map((label) => (
                  <option key={label} value={label}>
                    {label === 'all' ? 'すべて' : label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              地域
              <select
                value={venueRegion}
                onChange={(event) => {
                  setVenueRegion(event.target.value)
                  setVenueLimit(PAGE_SIZE)
                }}
              >
                {venueRegions.map((label) => (
                  <option key={label} value={label}>
                    {label === 'all' ? 'すべて' : label}
                  </option>
                ))}
              </select>
            </label>
            <input
              className="master-grid__search"
              type="search"
              placeholder="会場名で絞り込み"
              value={venueFilter}
              onChange={(event) => {
                setVenueFilter(event.target.value)
                setVenueLimit(PAGE_SIZE)
              }}
            />
          </div>

          {filteredVenues.length === 0 ? (
            <p className="app__muted">該当する会場が見つかりません。</p>
          ) : (
            <>
              <table className="master-table">
                <thead>
                  <tr>
                    <th>名称</th>
                    <th>種別</th>
                    <th>地域</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleVenues.map((venue) => (
                    <tr key={venue.id}>
                      <td>{venue.name}</td>
                      <td>{optionLabel(venue.categoryLabel ?? venue.type ?? '', '未設定')}</td>
                      <td>{optionLabel(venue.regionLabel ?? venue.region ?? '', '未設定')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredVenues.length > visibleVenues.length && (
                <button
                  className="master-more"
                  onClick={() => setVenueLimit((prev) => prev + PAGE_SIZE)}
                >
                  他 {filteredVenues.length - visibleVenues.length} 件を表示
                </button>
              )}
            </>
          )}
        </div>
      )
    }

    return (
      <div className="master-panel">
        <div className="master-filters">
          <label>
            クラス
            <select
              value={personGrade}
              onChange={(event) => {
                setPersonGrade(event.target.value)
                setPersonLimit(PAGE_SIZE)
              }}
            >
              {personGrades.map((label) => (
                <option key={label} value={label}>
                  {label === 'all' ? 'すべて' : label}
                </option>
              ))}
            </select>
          </label>
          <input
            className="master-grid__search"
            type="search"
            placeholder="氏名・備考で絞り込み"
            value={personFilter}
            onChange={(event) => {
              setPersonFilter(event.target.value)
              setPersonLimit(PAGE_SIZE)
            }}
          />
        </div>

        {filteredPersons.length === 0 ? (
          <p className="app__muted">該当する審判が見つかりません。</p>
        ) : (
          <>
            <table className="master-table">
              <thead>
                <tr>
                  <th>氏名</th>
                  <th>クラス</th>
                  <th>備考</th>
                </tr>
              </thead>
              <tbody>
                {visiblePersons.map((person) => (
                  <tr key={person.id}>
                    <td>{person.displayName}</td>
                    <td>{getPersonGrade(person)}</td>
                    <td>{optionLabel(person.note ?? '', '未設定')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredPersons.length > visiblePersons.length && (
              <button
                className="master-more"
                onClick={() => setPersonLimit((prev) => prev + PAGE_SIZE)}
              >
                他 {filteredPersons.length - visiblePersons.length} 件を表示
              </button>
            )}
          </>
        )}
      </div>
    )
  }

  return (
    <section className="app__section">
      <header className="master-grid__header master-grid__header--top">
        <div>
          <h2>マスターデータ</h2>
          <p className="app__muted">{summaryText}</p>
        </div>
        <div className="master-view-toggle">
          <button
            type="button"
            className={
              viewMode === 'teams'
                ? 'master-view-toggle__button is-active'
                : 'master-view-toggle__button'
            }
            onClick={() => setViewMode('teams')}
          >
            チーム
          </button>
          <button
            type="button"
            className={
              viewMode === 'venues'
                ? 'master-view-toggle__button is-active'
                : 'master-view-toggle__button'
            }
            onClick={() => setViewMode('venues')}
          >
            会場
          </button>
          <button
            type="button"
            className={
              viewMode === 'persons'
                ? 'master-view-toggle__button is-active'
                : 'master-view-toggle__button'
            }
            onClick={() => setViewMode('persons')}
          >
            審判
          </button>
        </div>
      </header>

      {renderCurrentView()}
      {error && <p className="app__alert">{error}</p>}
    </section>
  )
}
