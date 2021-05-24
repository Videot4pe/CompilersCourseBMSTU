interface IRPN {
    parse: () => string
}

enum Precedence {
    High = 4,
    Medium = 3,
    Low = 2,
    Lowest = 1,
}

export default class ReversePolishNotation implements IRPN {

    private precedence = { '*': Precedence.High, '#': Precedence.Medium, '|': Precedence.Low, '(': Precedence.Lowest, ')': Precedence.Lowest }
    private outputQueue: Array<string> = []
    private stack: Array<string> = []

    constructor(private regex: string) {}

    public parse() {

        for (const symbol of this.regex) {

            const currentSymbolPrecedence = this.precedence[symbol]

            if (currentSymbolPrecedence) { // Есть приоритет
                if (currentSymbolPrecedence === Precedence.Lowest) { // Скобки
                    if (symbol === '(') {
                        this.stack.push(symbol)
                    } else {
                        for (let j = this.stack.pop(); j !== '(' && j; j = this.stack.pop()) {
                            this.outputQueue.push(j)
                        }
                    }
                } else {
                    for (let k = this.stack[this.stack.length - 1]; this.precedence[k] >= currentSymbolPrecedence; k = this.stack[this.stack.length - 1]) {
                        this.outputQueue.push(this.stack.pop())
                    }
                    this.stack.push(symbol)
                }
            } else { // Нет приоритета (не спецсимвол)
                this.outputQueue.push(symbol)
            }
        }
        for (let i = this.stack.pop(); i; i = this.stack.pop()) {
            this.outputQueue.push(i)
        }

        return this.outputQueue.join('')
    }

}