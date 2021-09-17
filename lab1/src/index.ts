import RegexParser from './regex-parser';
import * as readline from "readline";

const rl= readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.question('Введите выражение: ', regex => {
    const regexParser = new RegexParser(regex || '(a|b)*abb')
    const minDfa = regexParser.parse();

    console.log('\nВведите выражение для проверки: ')
    rl.on('line', checkRegex => {
        minDfa.simulate(checkRegex)
        console.log('\nВведите выражение для проверки: ')
    })
})