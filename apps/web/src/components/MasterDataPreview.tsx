import { useMemo, useState } from 'react'
import { useMasterData } from '../providers/MasterDataProvider'

const PAGE_SIZE = 20

const normalize = (value: string) => value.toLocaleLowerCase('ja')
const optionLabel = (value: string | null | undefined, fallback: string) =>
  value && value.trim().length > 0 ? value : fallback

export function MasterDataPreview() {
  const { teams, venues, loading, error } = useMasterData()
  const [teamFilter, setTeamFilter] = useState('')
  const [teamCategory, setTeamCategory] = useState('all')
  const [teamLeague, setTeamLeague] = useState('all')
  const [teamRegion, setTeamRegion] = useState('all')
  const [venueFilter, setVenueFilter] = useState('')
  const [venueType, setVenueType] = useState('all')
  const [venueRegion, setVenueRegion] = useState('all')
  const [teamLimit, setTeamLimit] = useState(PAGE_SIZE)
  const [venueLimit, setVenueLimit] = useState(PAGE_SIZE)

  const teamCategories = useMemo(() => {
    const labels = new Set(
      teams.map((team) => optionLabel(team.primaryLabel ?? team.category ?? '', '未分類')),
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

  const teamRegions = useMemo(() => {
    const labels = new Set(
      teams.map((team) => optionLabel(team.regionLabel ?? team.region ?? '', '未定義')),
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

  const filteredTeams = useMemo(() => {
    const keyword = normalize(teamFilter.trim())
    return teams.filter((team) => {
      const categoryLabel = optionLabel(team.primaryLabel ?? team.category ?? '', '未分類')
      const leagueLabel = optionLabel(team.league ?? '', '未設定')
      const regionLabel = optionLabel(team.regionLabel ?? team.region ?? '', '未定義')

      const matchesCategory = teamCategory === 'all' || categoryLabel === teamCategory
      const matchesLeague = teamLeague === 'all' || leagueLabel === teamLeague
      const matchesRegion = teamRegion === 'all' || regionLabel === teamRegion
      const matchesKeyword =
        keyword.length === 0
          ? true
          : normalize(
              `${team.name}${leagueLabel}${categoryLabel}${regionLabel}${team.shortName ?? ''}`,
            ).includes(keyword)

      return matchesCategory && matchesLeague && matchesRegion && matchesKeyword
    })
  }, [teamCategory, teamLeague, teamRegion, teamFilter, teams])

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

  const visibleTeams = filteredTeams.slice(0, teamLimit)
  const visibleVenues = filteredVenues.slice(0, venueLimit)

  if (!loading && teams.length === 0 && venues.length === 0 && !error) {
    return (
      <section className="app__section">
        <h2>マスターデータ</h2>
        <p className="app__muted">Firestore にチーム・会場データが登録されていません。</p>
      </section>
    )
  }

  return (
    <section className="app__section">
      <h2>マスターデータ</h2>
      {loading ? (
        <p className="app__muted">マスターデータを読み込んでいます…</p>
      ) : (
        <div className="master-grid">
          <div>
            <header className="master-grid__header">
              <div>
                <h3>チーム一覧</h3>
                <p className="app__muted">
                  {filteredTeams.length.toLocaleString()} / {teams.length.toLocaleString()} 件
                </p>
              </div>
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
              </div>
              <input
                className="master-grid__search"
                type="search"
                placeholder="チーム名・リーグで絞り込み"
                value={teamFilter}
                onChange={(event) => {
                  setTeamFilter(event.target.value)
                  setTeamLimit(PAGE_SIZE)
                }}
              />
            </header>

            {filteredTeams.length === 0 ? (
              <p className="app__muted">該当するチームが見つかりません。</p>
            ) : (
              <>
                <table className="master-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>名称</th>
                      <th>カテゴリ</th>
                      <th>リーグ</th>
                      <th>地域</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleTeams.map((team) => (
                      <tr key={team.id}>
                        <td title={team.id}>{team.id}</td>
                        <td title={team.name}>{team.name}</td>
                        <td>{team.category ?? '未設定'}</td>
                        <td>{team.league ?? '未設定'}</td>
                        <td>{team.regionLabel ?? team.region ?? '未設定'}</td>
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

          <div>
            <header className="master-grid__header">
              <div>
                <h3>会場一覧</h3>
                <p className="app__muted">
                  {filteredVenues.length.toLocaleString()} / {venues.length.toLocaleString()} 件
                </p>
              </div>
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
              </div>
              <input
                className="master-grid__search"
                type="search"
                placeholder="会場名・種別で絞り込み"
                value={venueFilter}
                onChange={(event) => {
                  setVenueFilter(event.target.value)
                  setVenueLimit(PAGE_SIZE)
                }}
              />
            </header>

            {filteredVenues.length === 0 ? (
              <p className="app__muted">該当する会場が見つかりません。</p>
            ) : (
              <>
                <table className="master-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>名称</th>
                      <th>種別</th>
                      <th>地域</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleVenues.map((venue) => (
                      <tr key={venue.id}>
                        <td title={venue.id}>{venue.id}</td>
                        <td title={venue.name}>{venue.name}</td>
                        <td>{venue.type ?? '未設定'}</td>
                        <td>{venue.regionLabel ?? venue.region ?? '未設定'}</td>
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
        </div>
      )}
      {error && <p className="app__alert">{error}</p>}
    </section>
  )
}
