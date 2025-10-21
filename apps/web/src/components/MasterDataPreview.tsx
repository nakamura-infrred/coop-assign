import { useMemo, useState } from 'react'
import { useMasterData } from '../providers/MasterDataProvider'

const PAGE_SIZE = 20

const normalize = (value: string) => value.toLocaleLowerCase('ja')

export function MasterDataPreview() {
  const { teams, venues, loading, error } = useMasterData()
  const [teamFilter, setTeamFilter] = useState('')
  const [venueFilter, setVenueFilter] = useState('')
  const [teamLimit, setTeamLimit] = useState(PAGE_SIZE)
  const [venueLimit, setVenueLimit] = useState(PAGE_SIZE)

  const filteredTeams = useMemo(() => {
    const keyword = normalize(teamFilter.trim())
    if (!keyword) return teams
    return teams.filter((team) =>
      normalize(`${team.name}${team.league ?? ''}${team.category ?? ''}`).includes(keyword),
    )
  }, [teamFilter, teams])

  const filteredVenues = useMemo(() => {
    const keyword = normalize(venueFilter.trim())
    if (!keyword) return venues
    return venues.filter((venue) =>
      normalize(`${venue.name}${venue.type ?? ''}${venue.regionLabel ?? ''}`).includes(keyword),
    )
  }, [venueFilter, venues])

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
