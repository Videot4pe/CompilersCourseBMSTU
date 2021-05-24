import ReversePolishNotation from "./reverse-polish-notation";
import SyntaxTree from "./syntax-tree";

interface IRegexParser {
    parse: () => string
}

export default class RegexParser implements IRegexParser {

    constructor(private regex: string) {}

    public parse() {
        const reversePolishNotation = new ReversePolishNotation(this.regex).parse()

        const syntaxTree = new SyntaxTree(reversePolishNotation).parse()

        return syntaxTree
    }

}