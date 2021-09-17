import { RecursiveDescentParser } from './recursive-descent-parser';
import { Grammar } from './grammar';

const grammar = new Grammar('src/grammar.json')
grammar.leftRecursionElimination()
grammar.export('src/resultgrammar.json')

const rdp = new RecursiveDescentParser(grammar)

// rdp.parse('begin a = c - b / d <= e; b = c * 3 == 5 end')
// rdp.parse('begin a = b end')

// rdp.parse('begin a = b en')
// rdp.parse('b a = b e')

// rdp.parse('begin abc = r * 3 end')
// rdp.parse('begin abc = r * 3 b = a == r end')

// rdp.parse('begin abc = r / 4; b == 5 end')
// rdp.parse('begin abc = r * 3; b = a + r end')

// rdp.parse('begin abc = r / 4; b == 5 end')
// rdp.parse('begin abc = r * 3 b >= ar end')

// rdp.parse('beg abc = r / 4; b = 5 end')
rdp.parse('begin abc = r / 4; b = 5 end')

rdp.parse('begin abc = r / 4; b == 5 end')
rdp.parse('begin abc = r * 3 b >= ar end')