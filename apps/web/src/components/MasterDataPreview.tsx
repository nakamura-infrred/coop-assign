import { useMemo, useState } from 'react'
import { useMasterData } from '../providers/MasterDataProvider'

const MAX_VISIBLE = 10

export function MasterDataPreview() {
  const { teams, venues, loading, error } = useMasterData()
  const [teamFilter, setTeamFilter] = useState('')
  const [venueFilter, setVenueFilter] = useState('')

  const filteredTeams = useMemo(() => {
    const keyword = teamFilter.trim().toLowerCase()
    if (!keyword) return teams
    return teams.filter((team) => team.name.toLowerCase().includes(keyword))
  }, [teamFilter, teams])

  const filteredVenues = useMemo(() => {
    const keyword = venueFilter.trim().toLowerCase()
    if (!keyword) return venues
    return venues.filter((venue) => venue.name.toLowerCase().includes(keyword))
  }, [venueFilter, venues])

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
                <p className="app__muted">{filteredTeams.length} / {teams.length} 件</p>
              </div>
              <input
                className="master-grid__search"
                type="search"
                placeholder="チーム名で絞り込み"
                value={teamFilter}
                onChange={(event) => setTeamFilter(event.target.value)}
              />
            </header>
            <ul className="master-list">
              {filteredTeams.slice(0, MAX_VISIBLE).map((team) => (
                <li key={team.id} className="master-list__item">
                  <strong>{team.name}</strong>
                  <span className="master-list__meta">
                    {team.league ?? 'リーグ未設定'} / {team.category}
                  </span>
                </li>
              ))}
            </ul>
            {filteredTeams.length > MAX_VISIBLE && (
              <p className="app__muted">他 {filteredTeams.length - MAX_VISIBLE} 件…検索で絞り込んでください。</p>
            )}
          </div>

          <div>
            <header className="master-grid__header">
              <div>
                <h3>会場一覧</h3>
                <p className="app__muted">{filteredVenues.length} / {venues.length} 件</p>
              </div>
              <input
                className="master-grid__search"
                type="search"
                placeholder="会場名で絞り込み"
                value={venueFilter}
                onChange={(event) => setVenueFilter(event.target.value)}
              />
            </header>
            <ul className="master-list">
              {filteredVenues.slice(0, MAX_VISIBLE).map((venue) => (
                <li key={venue.id} className="master-list__item">
                  <strong>{venue.name}</strong>
                  <span className="master-list__meta">{venue.type}</span>
                </li>
              ))}
            </ul>
            {filteredVenues.length > MAX_VISIBLE && (
              <p className="app__muted">他 {filteredVenues.length - MAX_VISIBLE} 件…検索で絞り込んでください。</p>
            )}
          </div>
        </div>
      )}

      {error && <p className="app__alert">{error}</p>}
    </section>
  )
}
