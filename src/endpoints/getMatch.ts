import { Team } from '../shared/Team'
import { Event } from '../shared/Event'
import { HLTVConfig } from '../config'
import { HLTVPage, HLTVPageElement, HLTVScraper } from '../scraper'
import { fetchPage } from '../utils'
import Cheerio = cheerio.Cheerio

interface HalfResult {
  side: 't' | 'ct'
  rounds: number
}

interface MapTeam {
  totalScore: number
  first: HalfResult
  second: HalfResult
}

interface Map {
  name: string
  pickedBy: string
  team1: MapTeam
  team2: MapTeam
  number: number
}

export interface MainScore {
  team1: number
  team2: number
}

export interface Score {
  main: MainScore
  maps: Map[]
  firstPick: string
}

export interface Match {
  id: number
  time: string
  event: Event
  team1: Team
  team2: Team
  score: Score
  picks: string[]
  meta: string
  matchType: string
  matchStatus: string
  stream: string
}

export const getMatch =
  (config: HLTVConfig) =>
  async (matchId: number): Promise<Match> => {
    const $ = HLTVScraper(
      await fetchPage(
        `https://www.hltv.org/matches/${matchId}/_`,
        config.loadPage
      )
    )

    const time = new Date(
      +$('.timeAndEvent .date').attr('data-unix').toString()
    ).toISOString()
    const event = getEvent($)
    const team1 = getTeam($, 0)
    const team2 = getTeam($, 1)
    const mapPicks = $('.maps')
      .children()
      .first()
      .children()
      .eq(2)
      .children()
      .first()
    const score = getScore($, mapPicks)
    const picks = getPicks($, mapPicks)
    const meta = `bo${$('.mapholder').length}`
    const matchType = $('.maps')
      .children()
      .first()
      .children()
      .eq(1)
      .children()
      .first()
      .text()
      .split(' ')[3]
      .split(')')[0]
      .slice(1)
    const matchStatus =
      $('.countdown').text() === 'Match over' ? 'ended' : 'upcoming'
    const stream = getStream($)

    return {
      id: Number(matchId),
      time,
      event,
      team1,
      team2,
      score,
      picks,
      meta,
      matchType,
      matchStatus,
      stream
    }
  }

function getEvent($: HLTVPage) {
  return {
    id: +$('.event').children().first().attr('href')?.split('/')[2],
    name: $('.timeAndEvent').find('.event').text()
  }
}

function getTeam($: HLTVPage, index: number) {
  const teamEl = $('.teamsBox').children('.team').eq(index)

  const logo = teamEl.find('.logo.night-only').exists()
    ? teamEl.find('.logo.night-only').attr('src')
    : teamEl.find('.logo').attr('src')
  const name = teamEl.find('.teamName').text()
  const country = teamEl.find('img').attr('src')?.split('/') || 'WORLD.png'

  return {
    name,
    logo,
    country: country[country.length - 1].split('.')[0]
  }
}

function getScore($: HLTVPage, mapPicks: HLTVPageElement) {
  const teamName = $('.teamsBox')
    .children('.team')
    .eq(0)
    .find('.teamName')
    .text()

  return {
    main: {
      team1: +$('.team1-gradient').children().last().text() || 0,
      team2: +$('.team2-gradient').children().last().text() || 0
    },
    maps: getMaps($),
    firstPick: mapPicks.children().first().text()?.includes(teamName)
      ? 'team1'
      : 'team2'
  }
}

function getMaps($: HLTVPage) {
  const maps: Map[] = []
  const mapsEl = $('.mapholder')
  const matchStatus =
    $('.countdown').text() === 'Match over' ? 'ended' : 'upcoming'
  let mapIndex = 1

  mapsEl.each((_, el) => {
    const mapTeam1 = {
      totalScore: Number(
        el.find('.results-left').find('.results-team-score').text()
      ),
      first: {
        side: el
          .find('.results-center-half-score')
          .children()
          .eq(1)
          .attr('class') as any,
        rounds:
          Number(
            el.find('.results-center-half-score').children().eq(1).text()
          ) || 0
      },
      second: {
        side: el
          .find('.results-center-half-score')
          .children()
          .eq(5)
          .attr('class') as any,
        rounds:
          Number(
            el.find('.results-center-half-score').children().eq(5).text()
          ) || 0
      }
    }

    const mapTeam2 = {
      totalScore: Number(
        el.find('.results-right').find('.results-team-score').text()
      ),
      first: {
        side: el
          .find('.results-center-half-score')
          .children()
          .eq(3)
          .attr('class') as any,
        rounds:
          Number(
            el.find('.results-center-half-score').children().eq(3).text()
          ) || 0
      },
      second: {
        side: el
          .find('.results-center-half-score')
          .children()
          .eq(7)
          .attr('class') as any,
        rounds:
          Number(
            el.find('.results-center-half-score').children().eq(7).text()
          ) || 0
      }
    }

    if (
      el.find('.results-right').find('.results-team-score').text() === '-' &&
      matchStatus !== 'ended'
    ) {
      maps.push({
        name: el.find('.mapname').text(),
        pickedBy:
          el.find('.pick').find('.results-teamname').text() || 'decider',
        team1: {
          totalScore: 0,
          first: { side: 't', rounds: 0 },
          second: { side: 'ct', rounds: 0 }
        },
        team2: {
          totalScore: 0,
          first: { side: 'ct', rounds: 0 },
          second: { side: 't', rounds: 0 }
        },
        number: mapIndex
      })
    } else if (mapTeam1.totalScore && mapTeam2.totalScore) {
      maps.push({
        name: el.find('.mapname').text(),
        pickedBy:
          el.find('.pick').find('.results-teamname').text() || 'decider',
        team1: mapTeam1,
        team2: mapTeam2,
        number: mapIndex
      })
    }

    mapIndex += 1
  })

  return maps
}

function getPicks($: HLTVPage, mapPicks: HLTVPageElement) {
  const picks: string[] = []

  mapPicks.children().each((_, el) => {
    const mapNames = [
      'Vertigo',
      'Overpass',
      'Nuke',
      'Mirage',
      'Ancient',
      'Inferno',
      'Anubis'
    ]

    const pick = el
      .text()
      .split(' ')
      .filter((i) => mapNames.find((j) => i === j))[0]

    picks.push(pick)
  })

  if (!picks[0]) picks.pop()
  if (!picks[0]) picks.pop()

  return picks
}

function getStream($: HLTVPage) {
  return (
    ($('.stream-box-embed')
      .first()
      .attr('data-stream-embed')
      ?.slice(0, -12) as string) ||
    ($('.spoiler')
      .children()
      .first()
      .attr('data-stream-embed')
      ?.slice(0, -12) as string)
  )
}
