import { HLTV } from './index'

const log = (promise: Promise<any>) =>
  promise
    .then((res) => console.dir(res, { depth: null }))
    .catch((err) => console.log(err))

log(HLTV.getMatches())
//log(HLTV.getMatch(2363542))
