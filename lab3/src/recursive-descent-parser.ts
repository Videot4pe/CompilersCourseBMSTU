import { Grammar, Nonterm } from './grammar';
export interface IRecursiveDescentParser {
    parse: (tokens: string) => void
}

export class RecursiveDescentParser implements IRecursiveDescentParser {

    private tokens: string = ''
    private pos: number = 0
    // private tree: TreeNode | null = null
    private stacktrace: string[] = []
    private blockTree: BlockTreeNode | null = null
    constructor(private grammar: Grammar) {}

    public parse(tokens: string) {
        this.tokens = tokens
        console.info('\n\n\nИсходная строка: ', tokens)
        try {
            this.blockTree = this.block()
            this.blockTree.print(0, this.grammar.getNonterms)
            // this.tree.print(0, this.grammar.getNonterms)
        } catch (e) {
            console.warn([...new Set(this.stacktrace)].join('\n'))
        }
        this.stacktrace = []
        this.pos = 0;
        // this.tree = null
    }

    private oldToken() {
        const token = this.tokens[this.pos]
        this.pos++
        return token
    }

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
        while (token !== ' ' && token !== ';') {
            this.pos++
            token = this.tokens[this.pos]
        }

        return this.tokens.slice(startPos, this.pos)
    }

    get currentToken() {
        return this.tokens[this.pos]
    }

    private restore(prevPos: number) {
        this.pos = prevPos
    }

    private block() {

        const node = new BlockTreeNode('block')

        if (this.token() !== 'begin') {
            this.stacktrace.push('Нет символа начала блока \'begin\'')
            return null
        }

        const oplist = this.oplist()

        if (!oplist) {
            this.stacktrace.push(`Ошибка ${this.currentToken}`)
            return null
        }

        if (this.token() !== 'end') {
            if (this.stacktrace.length === 0) {
                this.stacktrace.push('Нет символа конца блока \'end\'')
            }
            return null
        }

        // if (this.token()) {
        //     this.stacktrace.push('Ошибка символа окончания.')
        //     return null
        // }

        node.leftToken = new TerminalNode('begin')
        node.oplist = oplist
        node.rightToken = new TerminalNode('end')
        return node
    }

    private oplistDash() {
        const prevPos = this.pos
        const node = new OpListDashTreeNode('oplist\'')

        if (this.compareToken(this.token(), ';', prevPos + 1) && this.op() && this.oplistDash()) {
            
            this.restore(prevPos)
            node.separator = new TerminalNode(this.token())
            node.op = this.op()
            node.oplist_dash = this.oplistDash()

            return node
        } else {
            this.restore(prevPos)
            node.eps = new TerminalNode('')
            return node
        }
    }

    private oplist() {
        const prevPos = this.pos
        const node = new OpListTreeNode('oplist')

        if (this.op() && this.oplistDash()) {

            this.restore(prevPos)
            node.op = this.op()
            node.oplist = this.oplistDash()

            return node
        }
        this.stacktrace.push(`Ошибка oplist: ${this.tokens.slice(prevPos)} - (${prevPos})`)
        return null
    }

    private op() {
        const prevPos = this.pos
        const node = new OpTreeNode('op')

        if (!this.grammar.getTerms.includes(this.token()) && this.compareToken(this.token(), '=', prevPos+1) && this.expression()) {

            this.restore(prevPos)
            node.id = new TerminalNode(this.token())
            node.eq = new TerminalNode(this.token())
            node.expression = this.expression()

            return node
        }
        this.stacktrace.push(`Ошибка op: ${this.tokens.slice(prevPos)} - (${prevPos})`)

        return null
    }

    private expression() {
        const prevPos = this.pos
        const node = new ExpressionTreeNode('exp')

        if (this.aexpression() && this.relop() && this.aexpression()) {
            this.restore(prevPos)
            node.aexpression = this.aexpression()
            node.relop = this.relop()
            node.second_aexpression = this.aexpression()

            return node
        } else {
            this.restore(prevPos)
            if (this.aexpression()) {

                this.restore(prevPos)
                node.aexpression = this.aexpression()

                return node
            }
        }
        this.stacktrace.push(`Ошибка expression: ${this.tokens.slice(prevPos)} - (${prevPos})`)
        return null
    }

    private aexpressionDash() {
        const prevPos = this.pos
        const node = new AExpressionDashTreeNode('aexp\'')

        if (this.addop() && this.term() && this.aexpressionDash()) {

            this.restore(prevPos)
            node.addop = this.addop()
            node.term = this.term()
            node.aexpression_dash = this.aexpressionDash()

            return node
        } else {
            this.restore(prevPos)
            // if (this.token() === '') {
            node.eps = new TerminalNode('')
            return node
            // }
        }
    }

    private aexpression() {
        const prevPos = this.pos
        const node = new AExpressionTreeNode('aexp')

        if (this.term() && this.aexpressionDash()) {

            this.restore(prevPos)
            node.term = this.term()
            node.aexpression_dash = this.aexpressionDash()

            return node
        }
        this.stacktrace.push(`Ошибка aexpression: ${this.tokens.slice(prevPos)} - (${prevPos})`)
        return null
    }


    private termDash() {
        const prevPos = this.pos
        const node = new TermDashTreeNode('term\'')

        if (prevPos + 3 >= this.tokens.length) {
            this.stacktrace.push(`Ошибка символа окончания: ${this.tokens.slice(prevPos)} - (${prevPos})`)
            return null
        }

        if (this.multop() && this.factor() && this.termDash()) {

            this.restore(prevPos)
            node.multop = this.multop()
            node.factor = this.factor()
            node.term_dash = this.termDash()

            return node
        } else {
            this.restore(prevPos)
            node.eps = new TerminalNode('')
            return node
        } 
    }

    private term() {
        const prevPos = this.pos
        const node = new TermTreeNode('term')

        if (this.factor() && this.termDash()) {

            this.restore(prevPos)
            node.factor = this.factor()
            node.term_dash = this.termDash()

            return node
        }
        this.stacktrace.push(`Ошибка term: ${this.tokens.slice(prevPos)} - (${prevPos})`)
        return null
    }

    private factor() {
        const prevPos = this.pos
        const node = new FactorTreeNode('factor')

        if (!this.grammar.getTerms.includes(this.token())) {

            this.restore(prevPos)
            node.term = new TerminalNode(this.token())

            return node
        } else {
            this.restore(prevPos)
            if (this.token() === '(' && this.aexpression() && this.token() === ')') {

                this.restore(prevPos)
                node.leftArrow = new TerminalNode(this.token())
                node.aexpression = this.aexpression()
                node.rightArrow = new TerminalNode(this.token())

                return node
            }
        }

        this.stacktrace.push(`Ошибка factor: ${this.tokens.slice(prevPos)} - (${prevPos})`)
        return null
    }

    private relop() {
        const prevPos = this.pos
        if (['<', '<=', '==', '<>', '>', '>='].includes(this.token())) {
            this.restore(prevPos)
            return new RelOpNode(this.token())
        }
        this.stacktrace.push(`Ошибка relop: ${this.tokens.slice(prevPos)} - (${prevPos})`)
        return null
    }

    private addop() {
        const prevPos = this.pos
        if (['+', '-'].includes(this.token())) {
            this.restore(prevPos)
            return new AddOpNode(this.token())
        }
        this.stacktrace.push(`Ошибка addop: ${this.tokens.slice(prevPos)} - (${prevPos})`)
        return null
    }

    private multop() {
        const prevPos = this.pos
        if (['*', '/'].includes(this.token())) {
            this.restore(prevPos)
            return new MultOpNode(this.token())
        }
        this.stacktrace.push(`Ошибка multop: ${this.tokens.slice(prevPos)} - (${prevPos})`)
        return null
    }

    private compareToken(token: string, comp: string, pos: number) {
        if (token === comp) {
            return true
        } else {
            this.stacktrace.push(`Ошибка compare: не найден токен \'${comp}\' - (${pos})`)
            return false
        }
    }

}

export class TerminalNode {
    constructor(private token: string) {}
   
    public print(lvl: number = 0, nonterms:  Array<Nonterm>) {
		if (!lvl) {
			console.log('\nСинтаксическое дерево: ')
		}

		const treeRow = `${'    '.repeat(lvl)}${lvl ? '--' : ''} ${this.token}`
        console.log(treeRow)
	}
}

export class BlockTreeNode {

    public leftToken: TerminalNode
    public rightToken: TerminalNode
    public oplist: OpListTreeNode

    constructor(private token: string) {}

    public print(lvl: number = 0, nonterms:  Array<Nonterm>) {
		if (!lvl) {
			console.log('\nСинтаксическое дерево: ')
		}

		const treeRow = `${'    '.repeat(lvl)}${lvl ? '--' : ''} ${this.token}`
        console.log(treeRow)

        if (this.leftToken) {
            this.leftToken.print(lvl + 1, nonterms)
        }
        if (this.oplist) {
            this.oplist.print(lvl + 1, nonterms)
        }
        if (this.rightToken) {
            this.rightToken.print(lvl + 1, nonterms)
        }
	}
}

export class OpListTreeNode {

    public oplist: OpListDashTreeNode | null = null
    public op: OpTreeNode | null = null

    constructor(private token: string) {}

    public print(lvl: number = 0, nonterms:  Array<Nonterm>) {
		if (!lvl) {
			console.log('\nСинтаксическое дерево: ')
		}

		const treeRow = `${'    '.repeat(lvl)}${lvl ? '--' : ''} ${this.token}`
        console.log(treeRow)

        if (this.op) {
            this.op.print(lvl + 1, nonterms)
        }
        if (this.oplist) {
            this.oplist.print(lvl + 1, nonterms)
        }
	}
}

export class OpListDashTreeNode {

    public eps: TerminalNode | null = null
    public separator: TerminalNode | null = null
    public op: OpTreeNode | null = null
    public oplist_dash: OpListDashTreeNode | null = null

    constructor(private token: string) {}

    public print(lvl: number = 0, nonterms:  Array<Nonterm>) {
		if (!lvl) {
			console.log('\nСинтаксическое дерево: ')
		}

		const treeRow = `${'    '.repeat(lvl)}${lvl ? '--' : ''} ${this.token}`
        console.log(treeRow)

        if (this.separator) {
            this.separator.print(lvl + 1, nonterms)
        }
        if (this.op) {
            this.op.print(lvl + 1, nonterms)
        }
        if (this.oplist_dash) {
            this.oplist_dash.print(lvl + 1, nonterms)
        }
        if (this.eps) {
            this.eps.print(lvl + 1, nonterms)
        }
	}
}

export class OpTreeNode {

    public id: TerminalNode | null = null
    public eq: TerminalNode | null = null
    public expression: ExpressionTreeNode | null = null

    constructor(private token: string) {}

    public print(lvl: number = 0, nonterms:  Array<Nonterm>) {
		if (!lvl) {
			console.log('\nСинтаксическое дерево: ')
		}

		const treeRow = `${'    '.repeat(lvl)}${lvl ? '--' : ''} ${this.token}`
        console.log(treeRow)

        if (this.id) {
            this.id.print(lvl + 1, nonterms)
        }
        if (this.eq) {
            this.eq.print(lvl + 1, nonterms)
        }
        if (this.expression) {
            this.expression.print(lvl + 1, nonterms)
        }
	}
}

export class FactorTreeNode {

    public term: TerminalNode | null = null
    public leftArrow: TerminalNode | null = null
    public aexpression: AExpressionTreeNode | null = null
    public rightArrow: TerminalNode | null = null


    constructor(private token: string) {}

    public print(lvl: number = 0, nonterms:  Array<Nonterm>) {
		if (!lvl) {
			console.log('\nСинтаксическое дерево: ')
		}

		const treeRow = `${'    '.repeat(lvl)}${lvl ? '--' : ''} ${this.token}`
        console.log(treeRow)

        if (this.term) {
            this.term.print(lvl + 1, nonterms)
        }
        if (this.leftArrow) {
            this.leftArrow.print(lvl + 1, nonterms)
        }
        if (this.aexpression) {
            this.aexpression.print(lvl + 1, nonterms)
        }
        if (this.rightArrow) {
            this.rightArrow.print(lvl + 1, nonterms)
        }
	}
}

export class TermTreeNode {

    public factor: FactorTreeNode | null = null
    public term_dash: TermDashTreeNode | null = null

    constructor(private token: string) {}

    public print(lvl: number = 0, nonterms:  Array<Nonterm>) {
		if (!lvl) {
			console.log('\nСинтаксическое дерево: ')
		}

		const treeRow = `${'    '.repeat(lvl)}${lvl ? '--' : ''} ${this.token}`
        console.log(treeRow)

        if (this.factor) {
            this.factor.print(lvl + 1, nonterms)
        }
        if (this.term_dash) {
            this.term_dash.print(lvl + 1, nonterms)
        }
	}
}

export class TermDashTreeNode {

    public eps: TerminalNode | null = null
    public multop: MultOpNode | null = null
    public factor: FactorTreeNode | null = null
    public term_dash: TermDashTreeNode | null = null

    constructor(private token: string) {}

    public print(lvl: number = 0, nonterms:  Array<Nonterm>) {
		if (!lvl) {
			console.log('\nСинтаксическое дерево: ')
		}

		const treeRow = `${'    '.repeat(lvl)}${lvl ? '--' : ''} ${this.token}`
        console.log(treeRow)

        if (this.eps) {
            this.eps.print(lvl + 1, nonterms)
        }
        if (this.multop) {
            this.multop.print(lvl + 1, nonterms)
        }
        if (this.factor) {
            this.factor.print(lvl + 1, nonterms)
        }
        if (this.term_dash) {
            this.term_dash.print(lvl + 1, nonterms)
        }
	}
}

export class ExpressionTreeNode {

    public relop: RelOpNode | null = null
    public aexpression: AExpressionTreeNode | null = null
    public second_aexpression: AExpressionTreeNode | null = null

    constructor(private token: string) {}

    public print(lvl: number = 0, nonterms:  Array<Nonterm>) {
		if (!lvl) {
			console.log('\nСинтаксическое дерево: ')
		}

		const treeRow = `${'    '.repeat(lvl)}${lvl ? '--' : ''} ${this.token}`
        console.log(treeRow)

    
        if (this.aexpression) {
            this.aexpression.print(lvl + 1, nonterms)
        }
        if (this.relop) {
            this.relop.print(lvl + 1, nonterms)
        }
        if (this.second_aexpression) {
            this.second_aexpression.print(lvl + 1, nonterms)
        }

	}
}

export class AExpressionTreeNode {

    public term: TermTreeNode | null = null
    public aexpression_dash: AExpressionDashTreeNode | null = null

    constructor(private token: string) {}

    public print(lvl: number = 0, nonterms:  Array<Nonterm>) {
		if (!lvl) {
			console.log('\nСинтаксическое дерево: ')
		}

		const treeRow = `${'    '.repeat(lvl)}${lvl ? '--' : ''} ${this.token}`
        console.log(treeRow)

        if (this.term) {
            this.term.print(lvl + 1, nonterms)
        }
        if (this.aexpression_dash) {
            this.aexpression_dash.print(lvl + 1, nonterms)
        }

	}
}

export class AExpressionDashTreeNode {

    public eps: TerminalNode | null = null
    public addop: AddOpNode | null = null
    public term: TermTreeNode | null = null
    public aexpression_dash: AExpressionDashTreeNode | null = null

    constructor(private token: string) {}

    public print(lvl: number = 0, nonterms:  Array<Nonterm>) {
		if (!lvl) {
			console.log('\nСинтаксическое дерево: ')
		}

		const treeRow = `${'    '.repeat(lvl)}${lvl ? '--' : ''} ${this.token}`
        console.log(treeRow)

        if (this.eps) {
            this.eps.print(lvl + 1, nonterms)
        }
        if (this.addop) {
            this.addop.print(lvl + 1, nonterms)
        }
        if (this.term) {
            this.term.print(lvl + 1, nonterms)
        }
        if (this.aexpression_dash) {
            this.aexpression_dash.print(lvl + 1, nonterms)
        }

	}
}

export class AddOpNode {

    constructor(private token: string) {}

    public print(lvl: number = 0, nonterms:  Array<Nonterm>) {
		if (!lvl) {
			console.log('\nСинтаксическое дерево: ')
		}

		const treeRow = `${'    '.repeat(lvl)}${lvl ? '--' : ''} ${this.token}`
        console.log(treeRow)
        // this.term.print(lvl + 1, nonterms)
	}
}

export class MultOpNode {

    constructor(private token: string) {}

    public print(lvl: number = 0, nonterms:  Array<Nonterm>) {
		if (!lvl) {
			console.log('\nСинтаксическое дерево: ')
		}

		const treeRow = `${'    '.repeat(lvl)}${lvl ? '--' : ''} ${this.token}`
        console.log(treeRow)
        // this.term.print(lvl + 1, nonterms)
	}
}

export class RelOpNode {

    constructor(private token: string) {}

    public print(lvl: number = 0, nonterms:  Array<Nonterm>) {
		if (!lvl) {
			console.log('\nСинтаксическое дерево: ')
		}

		const treeRow = `${'    '.repeat(lvl)}${lvl ? '--' : ''} ${this.token}`
        console.log(treeRow)
        // this.term.print(lvl + 1, nonterms)
	}
}

export class MulOpNode {

    constructor(private token: string) {}

    public print(lvl: number = 0, nonterms:  Array<Nonterm>) {
		if (!lvl) {
			console.log('\nСинтаксическое дерево: ')
		}

		const treeRow = `${'    '.repeat(lvl)}${lvl ? '--' : ''} ${this.token}`
        console.log(treeRow)
        // this.term.print(lvl + 1, nonterms)
	}
}