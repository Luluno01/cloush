import jsSHA from 'jssha'


export function sha512(content: string) {
  const sha512 = new jsSHA('SHA-512', 'TEXT')
  sha512.update(content)
  return sha512.getHash('HEX')
}

export default sha512
