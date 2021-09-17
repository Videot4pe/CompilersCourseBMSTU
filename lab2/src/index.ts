import { Grammar } from './grammar';

// let grammar = new Grammar('io/lr1-input.json')
// grammar.print('Исходная грамматика 1')
// grammar.leftRecursionElimination()
// grammar.print('Удаление левой рекурсии')
// grammar.export('io/lr1-output.json')


// grammar = new Grammar('io/lr2-input.json')
// grammar.print('Исходная грамматика 2')
// grammar.leftRecursionElimination()
// grammar.print('Удаление левой рекурсии')
// grammar.export('io/lr2-output.json')


const grammar = new Grammar('io/lr3-input.json')
grammar.print('Исходная грамматика 3')
grammar.leftRecursionElimination()
grammar.print('Удаление левой рекурсии')
grammar.export('io/lr3-output.json')


// grammar = new Grammar('io/factorization-input.json')
// grammar.print('Исходная грамматика 4')
// grammar.factorization()
// grammar.print('Факторизация')
// grammar.export('io/factorization-output.json')


// grammar = new Grammar('io/factorization-input.json')
// grammar.print('Исходная грамматика 5')
// grammar.factorization()
// grammar.print('Факторизация')
// grammar.export('io/factorization-output.json')



// grammar = new Grammar('io/chain-input.json')
// grammar.print('Исходная грамматика 6')
// grammar.chainRulesElimination()
// grammar.print('Устранение цепных правил')
// grammar.export('io/chain-output.json')
