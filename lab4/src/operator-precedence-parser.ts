import { Grammar, Nonterm } from './grammar';
import { OpPrecedence, OPTable } from './OPTable';

export class OperatorPrecedenceParser {

    private OPTable: Record<string, Record<string, OpPrecedence>> = OPTable

    private tokens: string = ''
    private pos: number = 0
    private stacktrace: string[] = []

    private stack: string[] = []
    private res: string[] = []

    constructor(private grammar: Grammar) {}

    private token() {
        let token = this.tokens[this.pos]

        while (token === ' ') {
            this.pos++
            token = this.tokens[this.pos]
        }

        for (const i of this.grammar.getTerms.sort((a, b) => a.length < b.length ? 1 : -1)) {
            if (this.tokens.slice(this.pos, this.pos + i.length) === i) {
                token = this.tokens.slice(this.pos, this.pos + i.length)
                this.pos = this.pos + i.length
                return token
            }
        }

        let startPos = this.pos
        while (token !== ' ' && token !== '$') {
            if (!token) {
                break;
            }
            this.pos++
            token = this.tokens[this.pos]
        }

        return this.tokens.slice(startPos, this.pos)
    }

    get nextToken() {
        const pos = this.pos
        let token = this.tokens[this.pos]

        while (token === ' ') {
            this.pos++
            token = this.tokens[this.pos]
        }

        for (const i of this.grammar.getTerms.sort((a, b) => a.length < b.length ? 1 : -1)) {
            if (this.tokens.slice(this.pos, this.pos + i.length) === i) {
                token = this.tokens.slice(this.pos, this.pos + i.length)
                this.pos = this.pos + i.length
                return token
            }
        }

        let startPos = this.pos
        while (token !== ' ' && token !== '$') {
            if (!token) {
                break;
            }
            this.pos++
            token = this.tokens[this.pos]
        }

        this.pos = pos
        return this.tokens.slice(startPos, this.pos)
    }

    public parse(tokens: string) {
        this.tokens = `${tokens} $`
        console.info('\n\n\nИсходная строка: ', this.tokens)
        // console.table(this.OPTable)

        // try {
            this.stack = ['$']

            let next = this.token()
            if (next === '$') {
                return
            }
            while(this.stack.length > 0 || next !== '$') {
                // console.log('prev-next: ', this.stack[this.stack.length - 1], next, this.OPTable[this.stack[this.stack.length - 1]][next])
                console.log('Стэк: ', this.stack)

                if (!this.OPTable[next]) {
                    this.OPTable[next] = this.OPTable['const']
                    Object.keys(this.OPTable).forEach(x => {
                        this.OPTable[x][next] = this.OPTable[x]['const']
                    })
                }

                if ([OpPrecedence.Yields, OpPrecedence.Same].includes(this.OPTable[this.stack[this.stack.length - 1]][next])) {
                    this.stack.push(next)
                    next = this.token()
                } else if (this.OPTable[this.stack[this.stack.length - 1]][next] === OpPrecedence.Over) {
                    let counter = this.stack.length - 1
                    while(true) {
                        const currentFromStack = this.stack.pop()

                        this.result(currentFromStack)
                        counter--;

                        if (this.OPTable[this.stack[counter]][currentFromStack] === OpPrecedence.Yields) {
                            break;
                        }
                    }
                } else {
                    if (this.nextToken) {
                        console.log('Ошибка! ');
                    }
                    break;
                }
            }
            console.log('Результат: ', this.res.join(''))

            console.table(this.OPTable)
        // } catch (e) {
            // console.warn([...new Set(this.stacktrace)].join('\n'))
        // }
        this.stacktrace = []
        this.pos = 0;
    }

    private result(s: string) {
        if (s != '(' && s != ')')
        this.res.push(s)
    }
}