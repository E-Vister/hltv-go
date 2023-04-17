import cheerio from 'cheerio'

export const parseNumber = (str: string | undefined): number | undefined => {
  if (!str) {
    return undefined
  }

  const num = Number(str)

  return Number.isNaN(num) ? undefined : num
}

export const fetchPage = async (
  url: string,
  loadPage: (url: string) => Promise<string>
): Promise<cheerio.Root> => {
  const root = cheerio.load(await loadPage(url))

  const html = root.html()

  if (
    html.includes('error code:') ||
    html.includes('Sorry, you have been blocked') ||
    html.includes('Checking your browser before accessing')
  ) {
    throw new Error(
      'Access denied | www.hltv.org used Cloudflare to restrict access'
    )
  }

  return root
}

export function getIdAt(index: number, href: string): number | undefined
export function getIdAt(index: number): (href: string) => number | undefined
export function getIdAt(index?: number, href?: string): any {
  switch (arguments.length) {
    case 1:
      return (href: string) => getIdAt(index!, href)
    default:
      return parseNumber(href!.split('/')[index!])
  }
}
