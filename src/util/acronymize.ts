export default (
	s: string,
	lang: AbbreviateSupportedLanguage = AbbreviateSupportedLanguage.ES
) => {
	const ommitedWords = abbreviateLanguageToOmmitedWordsMap[lang]
	return s
		.split(' ')
		.filter((w) => !ommitedWords.includes(w.toLocaleLowerCase()))
		.map((w) => w.charAt(0).toLocaleUpperCase())
		.join('')
}

export enum AbbreviateSupportedLanguage {
	ES = 'es',
	EN = 'en'
}

export const abbreviateLanguageToOmmitedWordsMap: {
	[key in AbbreviateSupportedLanguage]: string[]
} = {
	[AbbreviateSupportedLanguage.ES]: ['de', 'y', 'la', 'el', 'lo', 'en'],
	[AbbreviateSupportedLanguage.EN]: ['and', 'the', 'of']
}

// trigger build
