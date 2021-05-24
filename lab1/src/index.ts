import RegexParser from './regex-parser';

const regexParser = new RegexParser('a(a|b)*abb')
// const regexParser = new RegexParser('a*b*(a|b)abc');
// const regexParser = new RegexParser('a(a|b)*b');
// const regexParser = new RegexParser('(aa)|(bb)');

const parsed = regexParser.parse();
console.log('Parsed: ', parsed)