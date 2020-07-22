class ScrollableTable {
  constructor({ selector }) {
    this.nRows = 500
    this.nCols = 100
    this.scrollIntervalMs = 10
    this.scrollSpeed = [0, 0]
    this.isMouseDown = false
    // Number of pixels within the container where scrolling will already start
    this.scrollMargin = 50
    // Determines how quickly the exponential speed curve
    // will grow. The bigger this number is, the more quickly
    // the speed will grow when the mouse is moved farther away.
    this.speedExponent = 2
    // The maximum scrolling speed.
    this.maxSpeed = 300
    // The pixel offset from the bottom of the screen at
    // which the maximum speed will be reached.
    this.maxScrolloff = 150
    this.selector = selector
    this.elContainer = document.querySelector(selector)
    this.elTable = this.elContainer.querySelector('table')
    this.elSelectionStyle = document.querySelector('#scroll-selection-style')
    this.selection = {
      start: [],
      end: []
    }
    this.lastStyleChangeTimestamp = 0
    this.styleUpdateInterval = 150
    this.init()
  }

  range(n) {
    return [...Array(n).keys()]
  }

  getContainerSize() {
    return [this.elContainer.clientWidth, this.elContainer.clientHeight]
  }

  getScrollSpeedForAxisScrolloff(scrolloff) {
    const scrolloffSign = Math.sign(scrolloff)
    const absScrolloff = Math.abs(scrolloff)
    const clampedScrolloff = Math.max(absScrolloff, 0)
    const expScrolloff = Math.pow(clampedScrolloff, this.speedExponent)
    const expMaxScrolloff = Math.pow(this.maxScrolloff, this.speedExponent)
    const speed = Math.min(
      expScrolloff / expMaxScrolloff * this.maxSpeed,
      this.maxSpeed
    )
    // We're going to scroll every `this.scrollIntervalMs` ms,
    // but we want to scroll the same amount regardless of
    // how often we're doing the scrolling
    const scaledSpeed = speed / this.scrollIntervalMs
    return scaledSpeed * scrolloffSign
  }

  getScrollSpeedForScrolloff(scrolloff) {
    return scrolloff.map(this.getScrollSpeedForAxisScrolloff.bind(this))
  }

  getMouseScrolloff(e) {
    const containerSize = this.getContainerSize()
    const containerRect = this.elContainer.getBoundingClientRect()
    const scrollPos = [
      e.clientX - containerRect.left,
      e.clientY - containerRect.top,
    ]
    let scrolloff = [0, 0]

    if (scrollPos[0] < this.scrollMargin) {
      scrolloff[0] = scrollPos[0] - this.scrollMargin
    } else if (scrollPos[0] > containerSize[0] - this.scrollMargin) {
      scrolloff[0] = scrollPos[0] - containerSize[0] + this.scrollMargin
    }

    if (scrollPos[1] < this.scrollMargin) {
      scrolloff[1] = scrollPos[1] - this.scrollMargin
    } else if (scrollPos[1] > containerSize[1] - this.scrollMargin) {
      scrolloff[1] = scrollPos[1] - containerSize[1] + this.scrollMargin
    }

    return scrolloff
  }

  getElementIndexInParent(el) {
    return Array.prototype.indexOf.call(el.parentNode.childNodes, el)
  }

  getTableCellPosition(el) {
    return [
      this.getElementIndexInParent(el),
      this.getElementIndexInParent(el.parentNode)
    ]
  }

  handleMouseUp(e) {
    this.isMouseDown = false
    const clickedElement = e.target
    // this.selection.end = this.getTableCellPosition(clickedElement)
    // this.updateSelectionStyle()
  }

  handleMouseDown(e) {
    this.isMouseDown = true
    const clickedElement = e.target
    this.selection.start = this.getTableCellPosition(clickedElement)
    this.scrollSpeed = [0, 0]
  }

  handleMouseMove(e) {
    const scrolloff = this.getMouseScrolloff(e)
    this.scrollSpeed = this.getScrollSpeedForScrolloff(scrolloff)
    const currentTimestamp = +(new Date())
    if (currentTimestamp - this.lastStyleChangeTimestamp > this.styleUpdateInterval) {
      const clickedElement = e.target
      this.selection.end = this.getTableCellPosition(clickedElement)
      requestAnimationFrame(() => {
        this.updateSelectionStyle()
      })
      this.lastStyleChangeTimestamp = currentTimestamp
    }

    console.log('lol')
  }

  updateSelectionStyle() {
    this.elSelectionStyle.innerHTML = `
      ${this.selector}
      tr:nth-child(n+${this.selection.start[1] + 1}):nth-child(-n+${this.selection.end[1] + 1})
      td:nth-child(n+${this.selection.start[0] + 1}):nth-child(-n+${this.selection.end[0] + 1}) {
        background-color: tomato;
      }
    `
    
  }

  makeCol(index) {
    return `<td></td>`
  }

  makeRow(index) {
    const cols = this.range(this.nCols).map(i => this.makeCol(i)).join('')
    return `<tr>${cols}</tr>`
  }

  initTable() {
    const rows = this.range(this.nRows).map(i => this.makeRow(i)).join('')
    this.elTable.innerHTML = rows
  }

  doScroll() {
    if (!this.isMouseDown) { return; }
    this.elContainer.scrollTo(
      this.elContainer.scrollLeft + this.scrollSpeed[0],
      this.elContainer.scrollTop + this.scrollSpeed[1],
    )
  }

  init() {
    this.initTable()
    setInterval(this.doScroll.bind(this), this.scrollIntervalMs) // Oof
    window.addEventListener('mouseup', this.handleMouseUp.bind(this))
    window.addEventListener('mousedown', this.handleMouseDown.bind(this))
    window.addEventListener('mousemove', this.handleMouseMove.bind(this))
  }
}

const table = new ScrollableTable({
  selector: '.table-container',
})