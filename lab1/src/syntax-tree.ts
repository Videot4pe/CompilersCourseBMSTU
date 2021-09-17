import { CONNECTORS } from './constants';

type StackElement = string | TreeNode

export default class SyntaxTree {

	private root: TreeNode = undefined
	private stack: StackElement[] = []
	private maxId = 1

	constructor(private expression: string) {}

	public parse() {
		this.expression.split('').forEach(symbol => {
			if (!CONNECTORS.includes(symbol)) {
				this.stack.push(symbol)
			} else {
				const newTree = new TreeNode(undefined, symbol)

				if (symbol === '*') {
					const child = this.stack.pop()
					if (!child) {
						throw new Error('Стэк пуст')
					}
					if (typeof child === 'string') {
						newTree.setOnlyChild(new TreeNode(newTree, child, this.maxId))
						this.maxId++
					} else {
						child.setRoot(newTree)
						newTree.setOnlyChild(child)
					}
				} else {
					const rightChild = this.stack.pop()
					const leftChild = this.stack.pop()

					if (!leftChild) {
						throw new Error('Стэк пуст')
					}
					
					if (typeof leftChild === 'string') {
						newTree.setLeftChild(new TreeNode(newTree, leftChild, this.maxId))
						this.maxId++;
					} else {
						leftChild.setRoot(newTree)
						newTree.setLeftChild(leftChild)
					}

					if (!rightChild) {
						throw new Error('Стэк пуст')
					}
	
					if (typeof rightChild === 'string') {
						newTree.setRightChild(new TreeNode(newTree, rightChild, this.maxId))
						this.maxId++;
					} else {
						rightChild.setRoot(newTree)
						newTree.setRightChild(rightChild)
					}
				}
				
				this.stack.push(newTree)
			}
		})

		this.root = this.stack.pop() as TreeNode
        return this.root
    }

	get finiteStateId() {
        return this.maxId - 1
    }

}

type LinkNode = TreeNode | undefined
type Value = string | undefined
type Id = number | undefined

export class TreeNode {

	private leftChild: LinkNode = undefined
	private rightChild: LinkNode = undefined
	private onlyChild: LinkNode = undefined

	public firstPos = []
	public lastPos = []
	public nullable = false
	public followPos = []

	constructor(
		private root: LinkNode = undefined,
		private value: Value = undefined,
		private id: Id = undefined,
	) {
		if (id) {
			this.getPositions()
		}
	}

	public setLeftChild(node: LinkNode) {
		this.leftChild = node
		if (this.rightChild) {
			this.getPositions()
		}
	}

	get getLeftChild() {
		return this.leftChild
	}

	public setRightChild(node: LinkNode) {
		this.rightChild = node
		if (this.leftChild) {
			this.getPositions()
		}
	}

	get getRightChild() {
		return this.rightChild
	}

	public setOnlyChild(node: LinkNode) {
		this.onlyChild = node
		this.getPositions()
	}

	get getOnlyChild() {
		return this.onlyChild
	}

	get children() {
		return [this.leftChild, this.rightChild, this.onlyChild].filter(child => child)
	}

	public setValue(value: Value) {
		this.value = value
	}

	get getValue() {
		return this.value
	}

	get getId() {
		return this.id
	}

	public setRoot(root: TreeNode) {
		this.root = root
	}

	get getRoot() {
		return this.root
	}

	private getPositions() {
		this.nullable = this.getNullable()
		this.firstPos = this.getFirstPos()
		this.lastPos = this.getLastPos()
		this.getFollowPos()
	}

	private getNullable() {
		// console.log(this.value)
		if (['*', 'e'].includes(this.value)) {
			return true
		} else if (this.value === '|') {
			return (this.leftChild && this.leftChild.nullable) || (this.rightChild && this.rightChild.nullable)
		} else if (this.value === '.') {
			// console.log(this.leftChild?.nullable, this.rightChild?.nullable)
			return (this.leftChild && this.leftChild.nullable) && (this.rightChild && this.rightChild.nullable)
		} else {
			return false
		}
	}

	private getFirstPos() {
		switch (this.value) {
			case '*':
				return this.onlyChild.firstPos
				break;
			case 'e':
				return []
				break;
			case '|':
				return [...new Set([...this.leftChild.firstPos, ...this.rightChild.firstPos])]
				break;
			case '.':
				if (this.leftChild.nullable) {
					return [...new Set([...this.leftChild.firstPos, ...this.rightChild.firstPos])]
				} else {
					return this.leftChild.firstPos
				}
				break;
			default:
				return [this]
		}
	}

	private getLastPos() {
		switch (this.value) {
			case '*':
				return this.onlyChild.lastPos
				break;
			case 'e':
				return []
				break;
			case '|':
				return [...new Set([...this.leftChild.lastPos, ...this.rightChild.lastPos])]
				break;
			case '.':
				if (this.rightChild.nullable) {
					return [...new Set([...this.leftChild.lastPos, ...this.rightChild.lastPos])]
				} else {
					return this.rightChild.lastPos
				}
				break;
			default:
				return [this]
		}
	}

	private getFollowPos() {
		if (!this.id) {
			// console.log('value: ', this.value)
			if (this.value === '.' && this.leftChild && this.rightChild) {
				this.leftChild.lastPos.forEach(last => {
					// console.log(`last ${last.value}-${last.id} before: [${this.rightChild.firstPos.map(x => x.id)}], [${last.followPos.map(x => x.id)}]`)
					last.followPos = [...new Set([...last.followPos, ...this.rightChild.firstPos])].filter(x => x)
					// last.followPos = [...last.followPos, ...this.rightChild.firstPos].filter(x => x)
					// console.log(`last ${last.value}-${last.id} after: [${this.rightChild.firstPos.map(x => x.id)}], [${last.followPos.map(x => x.id)}]`)
				})
			} else if (this.value === '*') {
				this.lastPos.forEach(last => {
					last.followPos = [...new Set([...last.followPos, ...this.firstPos])].filter(x => x)
					// last.followPos = [...last.followPos, ...this.onlyChild.firstPos].filter(x => x)
				})
			}
		}
		if (this.root) {
			this.root.getFollowPos()
		}
	}

	public print(lvl: number = 0) {
		if (!lvl) {
			console.log('\n\nСинтаксическое дерево: ')
		}

		let stats = `nullable: ${this.nullable}; firstPos: [${this.firstPos.map(x => x.id)}], lastPos: [${this.lastPos.map(x => x.id)}]`
		if (this.id) {
			stats += `, followPos: [${this.followPos.map(x => x.id)}]`
		}
		const treeRow = `${'    '.repeat(lvl)}${lvl ? '--' : ''} ${this.getValue} ${this.id ?? ''} ${'    '.repeat(7 - lvl)}${this.id ? '' : ' '}${this.root ? '' : '  '}(${stats})`
		console.log(treeRow)

		this.children.forEach(child => child.print(lvl + 1))
	}

	private searchStack = []

	public recSearchPrinter() {
		this.searchStack = []
		this.recSearch(this)
		console.log(this.searchStack.map(x => {return {value: x.value, follow: x.followPos.map(y => y.id)}}))
	}

	private recSearch(root: TreeNode) {
		console.log('root')
		this.searchStack.push(root)
		if (root.leftChild) this.recSearch(root.leftChild)
		if (root.rightChild) this.recSearch(root.rightChild)
		if (root.onlyChild) this.recSearch(root.onlyChild)
	}

}