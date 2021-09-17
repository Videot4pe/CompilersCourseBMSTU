enum Precedence {
    High = 4,
    Medium = 3,
    Low = 2,
    Lowest = 1,
}

export default class ReversePolishNotation {

    private precedence = { '*': Precedence.High, '.': Precedence.Medium, '|': Precedence.Low, '(': Precedence.Lowest, ')': Precedence.Lowest }
    private outputQueue: Array<string> = []
    private stack: Array<string> = []

    constructor(private regex: string) {
        this.regex += '#'
        console.log('Преобразованное выражение: ', this.regex)
    }

    public parse() {

        let prevSymbol = ''

        this.regex.split('').forEach(symbol => {
            const currentSymbolPrecedence = this.precedence[symbol]

            if (currentSymbolPrecedence) { // Есть приоритет
                if (currentSymbolPrecedence === Precedence.Lowest) { // Скобки
                    this.parseParentheses(symbol, prevSymbol)
                } else {
                    this.parseOperator(symbol, currentSymbolPrecedence)
                }
            } else { // Нет приоритета (не спецсимвол)
                if (!['|', '(', ''].includes(prevSymbol) && (!Object.keys(this.precedence).includes(symbol) || symbol === '(')) {
                    this.parseOperator('.', Precedence.Medium)
                }
                this.outputQueue.push(symbol)
            }
            
            prevSymbol = symbol

        })

        for (let i = this.stack.pop(); i; i = this.stack.pop()) {
            this.outputQueue.push(i)
        }

        return this.outputQueue.join('')
    }

    private parseOperator(symbol: string, currentSymbolPrecedence: number) {
        for (let k = this.stack[this.stack.length - 1]; this.precedence[k] >= currentSymbolPrecedence; k = this.stack[this.stack.length - 1]) {
            this.outputQueue.push(this.stack.pop())
        }
        this.stack.push(symbol)
    }

    private parseParentheses(symbol: string, prevSymbol: string) {
        if (symbol === '(') {
            if (!['|', '(', ''].includes(prevSymbol) && (!Object.keys(this.precedence).includes(symbol) || symbol === '(')) {
                this.parseOperator('.', Precedence.Medium)
            }
            this.stack.push(symbol)
        } else {
            for (let j = this.stack.pop(); j !== '(' && j; j = this.stack.pop()) {
                this.outputQueue.push(j)
            }
        }
    }

}