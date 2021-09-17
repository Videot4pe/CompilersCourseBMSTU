import { CONNECTORS } from './constants';
import { TreeNode } from "./syntax-tree";
import * as R from 'ramda'

export enum StateType {
    Start = 'Start',
    Final = 'Final',
    Normal = '',
    Empty = ''
}

export interface DState {
    state: TreeNode[]
    tran: Record<string, TreeNode[]>
    marked: boolean
    type: StateType
}

export default class DeterministicFiniteAutomaton {

    public alphabet: string[] = []
    private dStates: DState[] = []

    constructor(private syntaxTree: TreeNode, regex: string) {
        this.alphabet = [...new Set(regex.split('').filter(symbol => !CONNECTORS.includes(symbol) && symbol !== '#'))]
    }

    public parse() {

        this.dStates.push({state: [], marked: true, type: StateType.Empty, tran: {}})
        this.alphabet.forEach(symbol => {
            this.dStates[0].tran[symbol] = this.dStates[0].state
        })

        this.dStates.push({state: this.syntaxTree.firstPos, marked: false, tran: {}, type: StateType.Start})
    
        let currentStateNumber = 1

        while (this.dStates.some(x => !x.marked)) {

            this.dStates[currentStateNumber].marked = true

            this.alphabet.forEach(symbol => {
                const transitions = [...new Set(this.dStates[currentStateNumber].state.filter(s => s.getValue === symbol).flatMap(x => x.followPos))]
                if (transitions.length) {
                    this.dStates[currentStateNumber].tran[symbol] = [...new Set(this.dStates[currentStateNumber].state.filter(s => s.getValue === symbol).flatMap(x => x.followPos))]
                }
                else {
                    this.dStates[currentStateNumber].tran[symbol] = this.dStates[0].state
                }
            })

            Object.values(this.dStates[currentStateNumber].tran).forEach(nextState => {
                if (nextState.length > 0) {
                    if (!this.newStateAlreadyExist([...new Set(nextState)])) {
                        // console.log(nextState.map(x => x.getId), this.dStates.map(s => s.state.map(y => y.getId)))
                        this.dStates.push({state: [...new Set(nextState)], marked: false, tran: {}, type: nextState.some(x => x.getValue === '#') ? StateType.Final : StateType.Normal})
                    }
                }
            })

            currentStateNumber++
        }
        return this
    }

    get getState() {
        return this.dStates
    }

    get getStateIds() {
        return this.dStates.map(x => x.state.map(y => y.getId).join(''))
    }

    private arraysAreEqual(array1, array2) {

        if (array1.length === array2.length && array1.length) {
            for (const id of array1) {
                if (!array2.includes(id)) {
                    return false
                }
            }
            return true
        }
        return false

    }

    private newStateAlreadyExist(nextState: TreeNode[]) {

        const nextStateIds = nextState.map(x => x.getId)
        const statesIds = this.dStates.map(s => s.state.map(y => y.getId))

        for (const state of statesIds) {
            if (this.arraysAreEqual(state, nextStateIds)) {
                return true
            }
        }
        return false
    }

    private clone(obj: any) {
        return Object.assign(Object.create(Object.getPrototypeOf(obj)), obj)
    }

    public minificateStates(state1: string, state2: string) {

        const s1 = this.dStates.find(x => x.state.map(y => y.getId).join('') === state1)
        const s2 = this.dStates.find(x => x.state.map(y => y.getId).join('') === state2)

        const clonedS1 = this.clone(s1)
        const clonedS2 = this.clone(s2)

        const newState = clonedS1.state.concat(clonedS2.state)

        const newTran = clonedS1.tran
        Object.entries(clonedS2.tran).forEach(x => {
            newTran[x[0]] = x[1]
        })

        const marked = clonedS1.marked && clonedS2.marked

        const type = [clonedS1.type, clonedS2.type].includes(StateType.Start) ? StateType.Start : [clonedS1.type, clonedS2.type].includes(StateType.Final) ? StateType.Final : StateType.Normal

        this.dStates.splice(this.dStates.indexOf(s1), 1, {state: newState, tran: newTran, marked, type})
        this.dStates.splice(this.dStates.indexOf(s2), 1)

        this.dStates.forEach(x => {
            Object.entries(x.tran).forEach(y => {
                if ([s1.state.map(z => z.getId).join(''), s2.state.map(z => z.getId).join('')].includes(y[1].map(z => z.getId).join(''))) {
                    x.tran[y[0]] = newState
                }
            })
        })
        return newState.map(x => x.getId).join('')
    }

    public print(label: string = 'ДКА: ') {

        console.log('\n\n', label)

        let result = []

        this.dStates.forEach(d => {
            const row = {}
            row['state'] = d.state.map(node => node.getId).join(', ')
            row['type'] = d.type
            this.alphabet.forEach(symbol => {
                row[symbol] = d.tran[symbol].map(x => x.getId).join(', ')
            })
            result.push(row)
        })

        console.table(result)

    }

    public simulate(exp: string) {

        let currentState = this.dStates.find(x => x.type === StateType.Start)

        for (const symbol of exp.split('')) {
            const transitionExist = Object.keys(currentState.tran).find(x => x === symbol)
            if (transitionExist) {
                currentState = this.dStates.find(x => x.state.map(x => x.getId).join('') === currentState.tran[symbol].map(x => x.getId).join(''))
            } else {
                console.log('\x1b[31m%s\x1b[0m', `Цепочка ${exp} не принадлежит множеству, описываемому конечным автоматом`)
                return false
            }
        }

        if (currentState.type === StateType.Final) {
            console.log('\x1b[36m%s\x1b[0m', `Цепочка ${exp} принадлежит множеству, описываемому конечным автоматом`)
            return true
        } else {
            console.log('\x1b[31m%s\x1b[0m', `Цепочка ${exp} не принадлежит множеству, описываемому конечным автоматом`)
            return false
        }

    }

}