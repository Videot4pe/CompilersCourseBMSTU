import { On2DeterministicFiniteAutonaton } from './on2-deterministic-finite-automaton';
import DeterministicFiniteAutomaton from "./deterministic-finite-automaton";
import ReversePolishNotation from "./reverse-polish-notation";
import SyntaxTree from "./syntax-tree";

export default class RegexParser {

    constructor(private regex: string) {}

    public parse() {
        console.log('Исходное выражение: ', this.regex)
        
        const reversePolishNotation = new ReversePolishNotation(this.regex).parse()
        console.log('Обратная польская запись: ', reversePolishNotation)

        const syntaxTree = new SyntaxTree(reversePolishNotation).parse()
        syntaxTree.print()

        const dfa = new DeterministicFiniteAutomaton(syntaxTree, reversePolishNotation).parse()
        dfa.print()

        const minDfa = new On2DeterministicFiniteAutonaton(dfa).parse()
        minDfa.print('Минимизированный ДКА: ')
        return minDfa
    }

}