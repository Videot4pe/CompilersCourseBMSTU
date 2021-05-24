interface IConnection {
	id: number
	connector: string
}

interface ITreeNode {
	id: number
	value: string

	root?: ITreeNode
	left?: ITreeNode
	right?: ITreeNode

	nullable: () => void
	firstpos: () => void
	lastpos: () => void
	followpos: () => void
}

export default class SyntaxTree {
    _CONNECTORS = ['|', '*', '.']

	private root: TreeNode
	private currentNode: TreeNode
	private maxId: number = 0

	constructor(private rpn: string) {}

	public parse() {

		const symbols = this.rpn.split('')

        return symbols.join('')

    }
}

type LinkNode = TreeNode | undefined
type Value = string | undefined

export class TreeNode {

	constructor(
		private id: number, 
		public value: Value = undefined, 
		private parentNode: LinkNode = undefined,
		private leftChild: LinkNode = undefined,
		private rightChild: LinkNode = undefined,
	) {}

	public setLeftChild(node: LinkNode) {
		this.leftChild = node
	}

	public setRightChild(node: LinkNode) {
		this.rightChild = node
	}

	public setValue(value: Value) {
		this.value = value
	}

	get parent() {
		return this.parentNode
	}

	private nullable() {
		return 
	}

	private firstpos() {
		return 
	}

	private lastpos() {
		return 
	}

	private followpos() {
		return 
	}

}