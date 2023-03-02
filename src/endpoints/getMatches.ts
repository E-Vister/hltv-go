import { HLTVConfig } from '../config'
import { HLTVPageElement, HLTVScraper } from '../scraper'
import { fetchPage, getIdAt } from '../utils'
import { Team } from '../shared/Team'
import { Event } from '../shared/Event'

export interface MatchPreview {
  id: number
  date?: number
  title?: string
  team1?: Team
  team2?: Team
  format?: string
  event?: Event
  live: boolean
}

export const getMatches =
  (config: HLTVConfig) => async (): Promise<MatchPreview[]> => {
    const $ = HLTVScraper(
      await fetchPage(`https://www.hltv.org/matches`, config.loadPage)
    )

    return $('.liveMatch-container')
      .toArray()
      .concat($('.upcomingMatch').toArray())
      .map((el) => {
        const id = el.find('.a-reset').attrThen('href', getIdAt(2))!
        const title = el.find('.matchInfoEmpty').text() || undefined
        const format = el.find('.matchMeta').text()
        const live = el.find('.matchTime.matchLive').text() === 'LIVE'
        const event = getEvent(el)
        const date = el.find('.matchTime').numFromAttr('data-unix')
        const team1 = getTeam(el, 1)
        const team2 = getTeam(el, 2)

        return { id, date, title, team1, team2, format, event, live }
      })
  }

function getTeam(el: HLTVPageElement, index: number) {
  if (!el.find('.matchTeamName').exists()) return undefined

  const teamEl = el.find(`.matchTeam.team${index}`)

  const teamLogo = teamEl.find('.matchTeamLogo.night-only').exists()
    ? el.find('.matchTeamLogo.night-only').attr('src')
    : el.find('.matchTeamLogo').attr('src')
  const teamName = teamEl.find('.matchTeamName').text()

  return {
    name: teamName,
    logo: teamLogo
  }
}

function getEvent(el: HLTVPageElement) {
  if (!el.find('.matchEvent').exists()) return undefined

  const eventLogo = el.find('.matchEventLogo.night-only').exists()
    ? el.find('.matchEventLogo.night-only').attr('src')
    : el.find('.matchEventLogo').attr('src')

  return {
    name: el.find('.matchEventName').text(),
    logo: eventLogo
  }
}
