import * as fs from 'fs'
import * as R from 'ramda'

type Symbol = string
type Term = Symbol
type Nonterm = Symbol
type BothTermOrNonterm = Term | Nonterm

type Production = Record<Nonterm, BothTermOrNonterm[]>

export interface IGrammarData {
    nonterm: Array<Nonterm>
    term: Array<Term>
    productions: Array<Production>
    startsymbol: Symbol
}

interface IGrammar {
    leftRecursionElimination: () => void,
    chainRulesElimination: () => void,
    factorization: () => void,
    print: (text: string) => void,
    import: (path: string) => void,
    export: (path: string) => void,
}

export class Grammar implements IGrammar {
    private nonterm: Array<Nonterm>
    private term: Array<Term>
    private productions: Array<Production>
    private startsymbol: Symbol

    constructor(path: string) {
        this.import(path)
    }

    public print(text: string) {
        console.log(`\n\n\n${text}`)

        console.log(`\nНетерминальные символы: ${this.nonterm.join(', ')}`)

        console.log(`\nТерминальные символы: ${this.term.join(', ')}`)

        console.log(`\nПравила вывода: `)
        console.table(this.productions)

        console.log(`\nНачальный символ: ${this.startsymbol}`)
    }

    /**
     * 
     * @returns Составленный объект grammar: Grammar, пригодный для экспорта
     */
    private combineObject() {
        const grammar: IGrammarData = {
            nonterm: this.nonterm,
            term: this.term,
            productions: this.productions,
            startsymbol: this.startsymbol
        }
        return grammar
    }

    /**
     * 
     * @param path: string - путь к файлу
     * Заполняет поля класса соответствующими данными из файла
     */
    public import(path: string) {
        const rawdata = fs.readFileSync(path);
        const grammar: IGrammarData = JSON.parse(rawdata.toString());

        this.nonterm = grammar.nonterm
        this.term = grammar.term
        this.productions = grammar.productions
        this.startsymbol = grammar.startsymbol
    }

    /**
     * 
     * @param path: string - путь к файлу
     * Записы
     */
    public export(path: string) {
        fs.writeFileSync(path, JSON.stringify(this.combineObject()))
    }

    /**
     * 
     * @param nonterm: Nonterm
     * Удаляет левую рекурсию из продукций нетерминала
     */
    private removeNontermLeftRecProductions(nonterm: Nonterm) {
        const recProductions = this.getNontermLeftRecProductions(nonterm)
        const notRecProductions = this.getNontermNotLeftRecProductions(nonterm)

        if (recProductions.length > 0) {
            notRecProductions.forEach(production => {
                if (production[nonterm][0] === 'eps') {
                    production[nonterm].splice(0, 1)
                }

                production[nonterm].push(`${nonterm}'`) // Добавляем nonterm' ко всем не леворекурсивным продукциям
            })
            recProductions.forEach(production => {
                production[`${nonterm}'`] = R.clone(production[nonterm]) // Копируем продукцию, заменяя ключ (нетерминал) на nonterm'
                delete production[nonterm] // Удаляем продукцию по старому ключу (леворекурсивная продукция)
                production[`${nonterm}'`].splice(0, 1) // Удаляем левую рекурсию (удаляем nonterm так, чтобы осталась только альфа) и добавляем в конец nonterm'
                production[`${nonterm}'`].push(`${nonterm}'`) 
            })
            this.productions.push({})
            this.productions[this.productions.length - 1][`${nonterm}'`] = ['eps']
            this.nonterm.push(`${nonterm}'`)
        }
    }

    /**
     * 
     * @param firstNonterm: Nonterm - исходный нетерминал
     * @param secondNonterm: Nonterm - нетерминал в продукции
     * Подставляет в продукцию нетерминала firstNonterm продукции нетерминала secondNonterm
     */
    private replaceNontermLeftRecProductionsForNonterm(firstNonterm: Nonterm, secondNonterm: Nonterm) {

        const leftRecProductions = this.getNontermLeftRecProductionsForNonterm(firstNonterm, secondNonterm)
        const secondNontermProductions = this.getNontermProductions(secondNonterm)

        leftRecProductions.forEach(production => {
            secondNontermProductions.forEach(secondProduction => {
                this.productions.push({})
                this.productions[this.productions.length - 1][firstNonterm] = secondProduction[secondNonterm].concat(production[firstNonterm].slice(1))
            })
            this.productions.splice(this.productions.indexOf(production), 1)
        })

    }

    /**
     * 
     * @param nonterm: Nonterm
     * @returns Array<Production> - массив продукций нетерминала
     */
    private getNontermProductions(nonterm: Nonterm) {
        return this.productions.filter(production => production[nonterm])
    }
    
    /**
     * 
     * @param nonterm: Nonterm
     * @returns Array<Production> - массив леворекурсивных продукций нетерминала
     */
    private getNontermLeftRecProductions(nonterm: Nonterm) {
        return this.productions.filter(production => production[nonterm] && production[nonterm][0] === nonterm)
    }

    /**
     * 
     * @param nonterm: Nonterm
     * @returns Array<Production> - массив !не! леворекурсивных продукций нетерминала
     */
     private getNontermNotLeftRecProductions(nonterm: Nonterm) {
        return this.productions.filter(production => production[nonterm] && production[nonterm][0] !== nonterm)
    }

    /**
     * 
     * @param firstNonterm: Nonterm - исходный нетерминал
     * @param secondNonterm: Nonterm - нетерминал, который будем заменять
     * @returns Array<Production> - массив леворекурсивных продукций нетерминала
     */
    private getNontermLeftRecProductionsForNonterm(firstNonterm: Nonterm, secondNonterm: Nonterm) {
        return this.productions.filter(production => production[firstNonterm] && production[firstNonterm][0] === secondNonterm)
    }

    public leftRecursionElimination() {

        this.nonterm.forEach((firstNonterm, index) => {
    
            for (let i = 0; i < index; i++) {
                const secondNonterm = this.nonterm[i]
                this.replaceNontermLeftRecProductionsForNonterm(firstNonterm, secondNonterm)
            }

            this.removeNontermLeftRecProductions(firstNonterm)

        })
    }

    public factorization() {

        this.nonterm.forEach(nonterm => {
    
            const productions = this.getNontermProductions(nonterm)

            for (let i = 0; i < productions.length; i++) {
                let prefix = productions[i][nonterm]
                let maxPrefix = ''
                let maxPrefixElements = []
                for (let j = i + 1; j < productions.length; j++) {
                    let full = true
                    for (let h = 0; h < prefix.length; h++) {
                        if (prefix[h] !== productions[j][nonterm][h]) {
                            full = false
                            if (maxPrefix.length > h || h === 0) {
                                break
                            } else if(maxPrefix.length === h) {
                                maxPrefixElements.push(j)
                                break
                            } else {
                                maxPrefix = prefix.slice(0, h).join()
                                maxPrefixElements = [j]
                                break
                            }
                        }
                    }
                    if(full) {
                        if (maxPrefix.length !== prefix.length) {
                            maxPrefix = prefix.join('')
                            maxPrefixElements = [j]
                        } else {
                            maxPrefixElements.push(j)
                        }
                    }
                }

                if (maxPrefix.length > 0) {
                    const branches = []
                    let branch = productions[i][nonterm].slice(maxPrefix.length, productions[i][nonterm].length)
                    branches.push(branch.length === 0 ? ['eps'] : branch)
                    this.productions.splice(this.productions.indexOf(productions[i]), 1)
                    for (let j = 0; j < maxPrefixElements.length; j++) {
                        branch = productions[maxPrefixElements[j]][nonterm].slice(maxPrefix.length)
                        branches.push(branch.length === 0 ? ['eps'] : branch)
                        this.productions.splice(this.productions.indexOf(productions[maxPrefixElements[j]]), 1)
                    }
                    this.nonterm.push(`${nonterm}'${maxPrefix}`)
                    this.productions.push({})
                    this.productions[this.productions.length - 1][nonterm] = maxPrefix.split('').concat(`${nonterm}'${maxPrefix}`)
                    branches.forEach(branch => {
                        this.productions.push({})
                        this.productions[this.productions.length - 1][`${nonterm}'${maxPrefix}`] = branch
                    })
                }
            }
        })
    }

    public chainRulesElimination() {
        // Для каждого нетерминала вычислить множество выводимых из него нетерминалов
        const achievable: Record<Nonterm, Nonterm[]> = {}
        this.nonterm.forEach(nonterm => {
            achievable[nonterm] = [nonterm]
            
            while (true) {
                const count = achievable[nonterm].length
                achievable[nonterm].forEach(x => {
                    const productions = this.getNontermProductions(x)
                    productions.forEach(production => {
                        if (production[x] && this.nonterm.includes(production[x][0])) {
                            if (!achievable[nonterm].includes(production[x][0])) {
                                achievable[nonterm].push(production[x][0])
                            }
                        }
                    })
                })
                if (count === achievable[nonterm].length) {
                    break;
                }
            }
        })
        console.log('\nДостижимость: ')
        console.table(achievable)

        for (const production of this.productions) {
            if (!(Object.values(production)[0].length === 1 && this.nonterm.includes(Object.values(production)[0][0]))) {
                const key = Object.keys(production)[0]
                Object.keys(achievable).forEach(x => {
                    if (achievable[x].includes(key) && !this.getNontermProductions(x).map(y => Object.values(y)[0].join('')).includes(Object.values(production)[0].join(''))) {
                        this.productions.push({})
                        // console.log('ach: ', x, Object.values(production)[0])
                        this.productions[this.productions.length - 1][x] = Object.values(production)[0]
                    }
                })
            }
        }
        for (const production of this.productions) {
            if (Object.values(production)[0].length === 1 && this.nonterm.includes(Object.values(production)[0][0])) {
                this.productions.splice(this.productions.indexOf(production), 1)
            }
        }
    }

}