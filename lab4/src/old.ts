import { Grammar, Nonterm } from './grammar';
import { OpPrecedence, OPTable } from './OPTable';

export class OperatorPrecedenceParser {

    private OPTable: Record<string, Record<string, OpPrecedence>> = OPTable

    private tokens: string = ''
    private pos: number = 0
    private stacktrace: string[] = []

    private stack: string[] = []
    private res: string = ''

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

        // if (startPos === this.pos) {
        //     return false
        // }
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
        console.table(this.OPTable)

        // try {
            this.stack = ['$']
            while(this.pos < this.tokens.length - 1) {
                const next = this.token()
                if (this.stack.length === 0) {
                    this.stack.push(next)
                } else {
                    const prev = this.stack[this.stack.length - 1]
                    if (!this.OPTable[prev]) {
                        this.OPTable[prev] = this.OPTable['id']
                    }
                    if (!this.OPTable[next]) {
                        this.OPTable[next] = this.OPTable['id']
                        this.OPTable[prev][next] = this.OPTable[prev]['id']
                    }
                    if (!this.grammar.getTerms.includes(next)) {
                        this.OPTable[prev][next] = this.OPTable[prev]['id']
                    }

                    if (this.OPTable[prev][next] === OpPrecedence.Yields || this.OPTable[prev][next] === OpPrecedence.Same) {
                        this.shift(next)
                    } else if (this.OPTable[prev][next] === OpPrecedence.Over) {
                        this.reduce(next)
                    } else if (prev === '$' && next === '$') {
                        this.accept()
                    } else if (!this.grammar.getTerms.includes(prev)) {
                        this.reduce(next)
                    } else {
                        console.log('prev-next: ', prev, next)
                        this.reject()
                    }
                }
                // console.log('token: ', next)
                // console.log('res: ', this.res)
                // console.log('STACK: ', this.stack)
            }
            console.log('Результат: ', this.res.replace('$', '').replace('$', ''))
        // } catch (e) {
            // console.warn([...new Set(this.stacktrace)].join('\n'))
        // }
        this.stacktrace = []
        this.pos = 0;
    }

    private shift(token: string) {
        // console.log('shift: ', token)
        this.stack.push(token)
    }

    private reduce(token: string) {
        // console.log('reduce')
        const a = this.stack.pop()
        const b = this.stack.pop()
        this.stack.push(`${a} ${b} ${token}`)
        this.res = `${a} ${b} ${token}`
    }

    private accept() {
        console.log('accept')
    }

    private reject() {
        console.log('reject')
    }
}