import { TreeNode } from './syntax-tree';
import DeterministicFiniteAutomaton, { DState, StateType } from "./deterministic-finite-automaton";
import * as R from 'ramda'

export class On2DeterministicFiniteAutonaton {

    private mindfa: DeterministicFiniteAutomaton

    constructor(private dfa: DeterministicFiniteAutomaton) {
        this.mindfa = Object.assign({}, dfa)
    }

    public parse() {
    
        console.log('\n\nМинимизация: \n')

        const statesCount = this.dfa.getState.length

        let marked: Record<string, Record<string, boolean>> = {}
        let queue = []

        let backRibs: Record<string, Record<string, DState[]>> = {}

        for (const x of this.dfa.getStateIds) {
            backRibs[x] = {}

            for (const symbol of this.dfa.alphabet) {
                backRibs[x][symbol] = []
            }

            for (const y of this.dfa.getState) {
                Object.entries(y.tran).forEach(z => {
                    const ids = z[1].map(z => z.getId).join('')
                    if (ids === x) {
                        if (!backRibs[x][z[0]]) {
                            backRibs[x][z[0]] = []
                        }
                        backRibs[x][z[0]].push(y)
                    }
                })
            }
        }
        
        console.log('Обратные ребра: ')

        let result = []
        Object.entries(backRibs).forEach(x => {
            const row = {}
            row['state'] = x[0]
            Object.entries(x[1]).forEach(y => {
                row[y[0]] = y[1].flatMap(h => h.state.flatMap(k => k.getId).join('')).join(', ')
                // console.log(`${x[0]} - ${y[0]}: ${y[1].flatMap(h => h.state.flatMap(k => k.getId).join('')).join(', ')}`)
            })
            result.push(row)
        })
        console.table(result)

        const startState = this.dfa.getState[1]

        let visited = {}
        let reachable = findReachable(startState, this.dfa.getState, visited)

        function findReachable(state: DState, dfa, visited) {
            if (!state) {
                return
            }
            if (visited[state.state.map(x => x.getId).join('')]) {
                return
            }
            visited[state.state.map(x => x.getId).join('')] = true
            return [state.state.map(y => y.getId).join(''), ...new Set(Object.values(state.tran).flatMap(t => {
                return findReachable(dfa.find(x => x.state.map(y => y.getId).join('') === t.map(x => x.getId).join('')), dfa, visited)
            }))];
        }
        reachable = reachable.filter(x => x)

        console.log('\nСостояния, достижимые из начального сосояния: ', reachable.join(', '))

        for (let state1 of this.dfa.getState) {
            for (let state2 of this.dfa.getState) {
                if (!marked[state1.state.map(x => x.getId).join('')]) {
                    marked[state1.state.map(x => x.getId).join('')] = {}
                }
                if (!marked[state2.state.map(x => x.getId).join('')]) {
                    marked[state2.state.map(x => x.getId).join('')] = {}
                }
                if (
                    !marked[state1.state.map(x => x.getId).join('')][state2.state.map(x => x.getId).join('')] && 
                        (
                            (state1.type === StateType.Final && state2.type !== StateType.Final) || 
                            (state1.type !== StateType.Final && state2.type === StateType.Final)
                        )
                ) {
                    marked[state1.state.map(x => x.getId).join('')][state2.state.map(x => x.getId).join('')] = true
                    marked[state2.state.map(x => x.getId).join('')][state1.state.map(x => x.getId).join('')] = true
                    queue.push([state1, state2])
                }
            }
        }

        while (queue.length > 0) {
            const pair = queue.pop()
            for (const symbol of this.dfa.alphabet) {
                for (const rib1 of backRibs[pair[0].state.map(x => x.getId).join('')][symbol]) {
                    for (const rib2 of backRibs[pair[1].state.map(x => x.getId).join('')][symbol]) {
                        if (!marked[rib1.state.map(x => x.getId).join('')][rib2.state.map(x => x.getId).join('')]) {
                            marked[rib1.state.map(x => x.getId).join('')][rib2.state.map(x => x.getId).join('')] = true
                            marked[rib2.state.map(x => x.getId).join('')][rib1.state.map(x => x.getId).join('')] = true
                            queue.push([rib1, rib2])
                        }
                    }
                }
            }
        }

        console.log('Итоговая матрица: ')
        console.table(marked)

        const classes = []
        for (const i of this.dfa.getState) {
            for (const j of this.dfa.getState) {
                if (!reachable.includes(j.state.map(x => x.getId).join(''))) {
                    break;
                }
                if (!marked[i.state.map(x => x.getId).join('')] || !marked[j.state.map(x => x.getId).join('')] || 
                !marked[i.state.map(x => x.getId).join('')][j.state.map(x => x.getId).join('')]) {
                    classes.push([i.state.map(x => x.getId).join(''), j.state.map(x => x.getId).join('')])
                }
            }
        }

        const classesWithoutDuplicates = []
        classes.forEach(x => {
            if (!classesWithoutDuplicates.some(y => y[0] === x[1] && y[1] === x[0])) {
                classesWithoutDuplicates.push(x)
            }
        })

        console.log('\nКлассы эквивалентных состояний: ', classesWithoutDuplicates)

        const minDfa = Object.assign(Object.create(Object.getPrototypeOf(this.dfa)), this.dfa)

        const changes = classesWithoutDuplicates.filter(x => x[0] !== x[1])

        changes.forEach((x) => {
            const newState = minDfa.minificateStates(x[0], x[1])
            const x1 = R.clone(x[0])
            const x2 = R.clone(x[1])
            changes.forEach((y, index) => {
                if ([x1, x2].includes(y[0])) {
                    changes[index][0] = newState
                }
                if ([x1, x2].includes(y[1])) {
                    changes[index][1] = newState
                }
            })
        })

        return minDfa
    }
}