const MAX_DELTA = 100
const UINT16_MAX = 2 ** 16 - 1
const PI = Math.PI

const container = document.getElementById("container")
const canvas = document.createElement("canvas")
canvas.width = 400
canvas.height = 400
container.appendChild(canvas)
const ctx = canvas.getContext("2d")

// Inputs
const NInput = document.getElementById("n")
const timeInput = document.getElementById("t")
const locationBtn = document.getElementById("location")
const shapeSel = document.getElementById("shape")
const widthInput = document.getElementById("width")
const startBtn = document.getElementById("start")
const pauseBtn = document.getElementById("pause")
const state = document.getElementById("state")
const tpsInput = document.getElementById("tps")
const iterationInput = document.getElementById("iteration")
const resetBtn = document.getElementById("reset")
const iterateBtn = document.getElementById("iterate")
const output = document.getElementById("output")
const copyBtn = document.getElementById("copy")
const aiSel = document.getElementById("ai")

/** @type {{
    * pos:    [number,number],
    * vel:    [number,number],
    * target: [number,number],
    * marked: boolean
  * }[]} */
let entities = []
/** @type {[number, number]} */
let markLocation = [200, 200]
let locationGet = false
let running = false

let interval = null
let tick = 0
let n_1 = 0

setInterval(draw, 10)

function init() {
  running = true
  entities = []
  n_1 = 0
  tick = 0

  const randoms = [...crypto.getRandomValues(new Uint16Array(NInput.value * 3))].map(n => n / UINT16_MAX)
  for (let i = 0; i < parseInt(NInput.value); i++) {
    const r = randoms.slice(i * 3, i * 3 + 3)
    const pos = [r[0] * (400 - 20) + 10, r[1] * (400 - 20) + 10]
    entities.push({
      pos,
      dir: r[2] * PI * 2,
      marked: isInRange(pos)
    })
    if (isInRange(pos)) n_1++
  }

}

function update() {
  for (let i = 0; i < entities.length; i++) {
    const entity = entities[i]
    const vel = [10 * Math.cos(entity.dir), 10 * Math.sin(entity.dir)]
    entity.pos[0] += vel[0]
    entity.pos[1] += vel[1]

    // TODO: add target based entity movement
    if (aiSel.value === "destination") {
      const r = [...crypto.getRandomValues(new Uint16Array(2))].map(n => n / UINT16_MAX)
      if (entity.target === undefined || dist2(...entity.pos, ...entity.target) <= 400) {
        entity.target = [r[0] * (400 - 20) + 10, r[1] * (400 - 20) + 10]
      }

      const dy = entity.target[1] - entity.pos[1]
      const dx = entity.target[0] - entity.pos[0]
      entity.dir = Math.atan2(dy, dx)
    }

    if (entity.pos[0] < 5
      || entity.pos[0] > 400 - 5
      || entity.pos[1] < 5
      || entity.pos[1] > 400 - 5) {

      const r = (crypto.getRandomValues(new Uint16Array(parseInt(NInput.value) * 3))[0] / UINT16_MAX)

      if (entity.pos[0] < 5) {
        entity.dir = -PI / 2 + r * PI
      }
      if (entity.pos[0] > 400 - 5) {
        entity.dir = PI / 2 + r * PI
      }
      if (entity.pos[1] < 5) {
        entity.dir = r * PI
      }
      if (entity.pos[1] > 400 - 5) {
        entity.dir = PI + r * PI
      }

      entity.pos[0] -= vel[0]
      entity.pos[1] -= vel[1]
    }

    entity.dir %= 2 * PI
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  entities.forEach(entity => {
    const vel = [15 * Math.cos(entity.dir), 15 * Math.sin(entity.dir)]

    if (entity.marked) {
      ctx.fillStyle = "orangered"
      ctx.fillRect(entity.pos[0] - 5, entity.pos[1] - 5, 10, 10)
    }

    ctx.strokeRect(entity.pos[0] - 5, entity.pos[1] - 5, 10, 10)
    ctx.beginPath()
    ctx.moveTo(entity.pos[0], entity.pos[1])
    ctx.lineTo(entity.pos[0] + vel[0], entity.pos[1] + vel[1])
    ctx.stroke()
    ctx.closePath()
  })

  if (markLocation !== null) {
    const width = parseInt(widthInput.value)
    if (shapeSel.value === "circle") {
      ctx.beginPath()
      ctx.arc(markLocation[0], markLocation[1], width / 2, 0, 2 * PI)
      ctx.fillStyle = "rgb(100 250 100 / 0.4)"
      ctx.fill()
      ctx.strokeStyle = "black"
      ctx.stroke()
      ctx.closePath()
    }
    if (shapeSel.value === "square") {
      ctx.fillStyle = "rgb(100 250 100 / 0.4)"
      ctx.fillRect(markLocation[0] - width / 2, markLocation[1] - width / 2, width, width)
      ctx.strokeStyle = "black"
      ctx.strokeRect(markLocation[0] - width / 2, markLocation[1] - width / 2, width, width)
    }
  }
}


function loop() {
  running && tick++
  running && update();

  let n_2 = 0
  let m = 0

  if (running && tick === parseInt(timeInput.value)) {
    running = false
    entities.forEach(entity => {
      if (isInRange(entity.pos)) {
        n_2++
        if (entity.marked) m++
      }
    })

    // n,n1,n2,m,estimated n
    output.innerText += `${NInput.value},${n_1},${n_2},${m},${Math.round(n_1 * n_2 / m)}\n`
  }

  state.innerHTML = `time: ${tick} ticks<br>
    n<sub>1</sub>: ${n_1}<br>
    n<sub>2</sub>: ${n_2}<br>
    m: ${m}<br>
    estimated N: ${n_1 * n_2 / m}
  `
}

/** @param {number} n */
function iterate(num) {
  for (let i = 0; i < num; i++) {
    setTimeout(() => {
      init()

      for (let t = 0; t < parseInt(timeInput.value); t++) {
        update()
      }

      let n_2 = 0
      let m = 0

      entities.forEach(entity => {
        if (isInRange(entity.pos)) {
          n_2++
          if (entity.marked) m++
        }
      })

      output.innerText += `${NInput.value},${n_1},${n_2},${m},${Math.round(n_1 * n_2 / m)}\n`

      draw()
    }, 0)
  }
}

resetBtn.addEventListener("click", () => {
  entities = []
  n_1 = 0
  output.innerHTML = "n,n1,n2,m,estimated n\n"
})
iterateBtn.addEventListener("click", () => {
  iterate(parseInt(iterationInput.value))
})
copyBtn.addEventListener("click", async () => {
  await navigator.clipboard.writeText(output.innerText)
})
locationBtn.addEventListener("click", () => {
  locationGet = true
  locationBtn.disabled = true
})
canvas.addEventListener("click", (e) => {
  if (!locationGet) return

  markLocation = [e.offsetX, e.offsetY]
  locationGet = false
  locationBtn.disabled = false
})
startBtn.addEventListener("click", () => {
  init()

  if (interval !== null) clearInterval(interval)
  interval = setInterval(loop, 1000 / parseInt(tpsInput.value))
})
pauseBtn.addEventListener("click", () => running = !running)

/** @param {[number, number]} pos 
  * @return boolean
  * */
function isInRange(pos) {
  const width = parseInt(widthInput.value)
  return (shapeSel.value === "circle" &&
    dist2(...markLocation, ...pos) <= width ** 2 / 4
  ) || (shapeSel.value === "square"
    && markLocation[0] - width / 2 <= pos[0]
    && pos[0] <= markLocation[0] + width / 2
    && markLocation[1] - width / 2 <= pos[1]
    && pos[1] <= markLocation[1] + width / 2
    )
}

function dist2(x1, y1, x2, y2) {
  return (x1 - x2) ** 2 + (y1 - y2) ** 2
}
