import { defaultConfig, defaultLoadPage, HLTVConfig } from './config'
import { getMatches } from './endpoints/getMatches'

export class Hltv {
  constructor(private config: Partial<HLTVConfig> = {}) {
    if (config.httpAgent && !config.loadPage) {
      config.loadPage = defaultLoadPage(config.httpAgent)
    }

    if (!config.httpAgent) {
      config.httpAgent = defaultConfig.httpAgent
    }

    if (!config.loadPage) {
      config.loadPage = defaultConfig.loadPage
    }
  }

  getMatches = getMatches(this.config as HLTVConfig)

  public createInstance(config: Partial<HLTVConfig>) {
    return new Hltv(config)
  }

  public TEAM_PLACEHOLDER_IMAGE =
    'https://www.hltv.org/img/static/team/placeholder.svg'

  public PLAYER_PLACEHOLDER_IMAGE =
    'https://static.hltv.org/images/playerprofile/bodyshot/unknown.png'
}

const hltv = new Hltv()

export default hltv
export { hltv as HLTV }

export type { MatchPreview } from './endpoints/getMatches'

export type { Event } from './shared/Event'
export type { Team } from './shared/Team'
