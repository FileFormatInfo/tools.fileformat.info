declare module 'encoding-japanese' {
  export type EncodingName =
    | 'UTF8'
    | 'UTF16'
    | 'UTF32'
    | 'SJIS'
    | 'EUCJP'
    | 'JIS'
    | 'ASCII'
    | 'BINARY'

  export interface EncodingJapanese {
    detect(data: number[], encodings?: EncodingName[]): string | false
  }

  const encodingJapanese: EncodingJapanese
  export default encodingJapanese
}
