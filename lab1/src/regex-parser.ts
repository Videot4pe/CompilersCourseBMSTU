import ReversePolishNotation from "./reverse-polish-notation";

interface IRegexParser {
    parse: () => string
}

export default class RegexParser implements IRegexParser {

    constructor(private regex: string) {}

    public parse() {
        const reversePolishNotation = new ReversePolishNotation(this.regex)

        return reversePolishNotation.parse()
    }

}