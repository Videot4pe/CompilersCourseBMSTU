import { OperatorPrecedenceParser } from './operator-precedence-parser';
import { Grammar } from './grammar';

const grammar = new Grammar('src/grammar.json')
grammar.export('src/resultgrammar.json')

const opp = new OperatorPrecedenceParser(grammar)

opp.parse('a + b / ( c - d )')