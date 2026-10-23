// Hand-written Min-Heap (Priority Queue)
// A binary min-heap stores elements in an array where each parent
// is less than or equal to its children.
// The smallest priority element is always at the root (index 0).
// Operations:
// - push: O(log N)
// - pop:  O(log N)
// - peek: O(1)

export class MinHeap {
  constructor() {
    // Each entry is { item, priority, insertOrder }
    // insertOrder is used as a tie-breaker for deterministic FIFO behavior
    this.elements = [];
    this.counter = 0;
  }

  // Number of elements in the heap
  get size() {
    return this.elements.length;
  }

  // Returns true if the heap is empty
  isEmpty() {
    return this.elements.length === 0;
  }

  // Insert a new item with a numeric priority
  push(item, priority) {
    const node = {
      item,
      priority,
      order: this.counter++
    };
    this.elements.push(node);
    this.bubbleUp(this.elements.length - 1);
  }

  // Remove and return the item with the lowest priority value
  pop() {
    if (this.isEmpty()) {
      return null;
    }
    const minNode = this.elements[0];
    const lastNode = this.elements.pop();

    if (this.elements.length > 0) {
      this.elements[0] = lastNode;
      this.sinkDown(0);
    }

    return minNode.item;
  }

  // Look at the lowest priority item without removing it
  peek() {
    return this.isEmpty() ? null : this.elements[0].item;
  }

  // Move the element at index up until heap order is restored
  bubbleUp(index) {
    let current = index;

    while (current > 0) {
      const parent = Math.floor((current - 1) / 2);

      if (this.isHigherPriority(this.elements[current], this.elements[parent])) {
        // Swap with parent
        const temp = this.elements[current];
        this.elements[current] = this.elements[parent];
        this.elements[parent] = temp;
        current = parent;
      } else {
        break;
      }
    }
  }

  // Move the element at index down until heap order is restored
  sinkDown(index) {
    const length = this.elements.length;
    let current = index;

    while (true) {
      let smallest = current;
      const leftChild = 2 * current + 1;
      const rightChild = 2 * current + 2;

      if (
        leftChild < length &&
        this.isHigherPriority(this.elements[leftChild], this.elements[smallest])
      ) {
        smallest = leftChild;
      }

      if (
        rightChild < length &&
        this.isHigherPriority(this.elements[rightChild], this.elements[smallest])
      ) {
        smallest = rightChild;
      }

      if (smallest !== current) {
        // Swap with the smaller child
        const temp = this.elements[current];
        this.elements[current] = this.elements[smallest];
        this.elements[smallest] = temp;
        current = smallest;
      } else {
        break;
      }
    }
  }

  // Helper: returns true if nodeA has higher priority (lower value) than nodeB
  isHigherPriority(nodeA, nodeB) {
    if (nodeA.priority < nodeB.priority) {
      return true;
    }
    if (nodeA.priority === nodeB.priority) {
      return nodeA.order < nodeB.order;
    }
    return false;
  }

  // Return the top N items sorted by priority (for UI inspection)
  getTop(limit = 5) {
    return [...this.elements]
      .sort((a, b) => {
        if (a.priority !== b.priority) {
          return a.priority - b.priority;
        }
        return a.order - b.order;
      })
      .slice(0, limit)
      .map((entry) => ({
        item: entry.item,
        priority: entry.priority
      }));
  }
}
