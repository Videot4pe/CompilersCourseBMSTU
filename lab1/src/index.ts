import RegexParser from './regex-parser';

const regexParser = new RegexParser('a(a|b)*b');
const parsed = regexParser.parse();
console.log('Parsed: ', parsed)