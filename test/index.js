'use strict'
const jhaml = require('../')
const fs = require('fs')
const p = require('path')
const assert = require('assert')
const es = require('event-stream')

const jhamlfixtures = `${__dirname}/fixtures/jhaml`
const hamljsfixtures = `${__dirname}/fixtures/haml.js`

const scope = {
  disabled: true, 
  select: [{value: 0, text: 'Zero'}, {value: 1, text: 'One'}],
  interpolated: 'Test',
  test: '&<>',
  message: 'it works!',
  stuff: 'just fine!',
  link: 'link',
  suffix: 'suffix',
  method: function(foo) { return 'bar'; }
}

var equal = function(path, opts) {
  if(!opts)
    opts = {}

  opts.fixtures = opts.fixtures || jhamlfixtures

  return function(done) {
    fs.readFile(`${opts.fixtures}/${path}.html`, function(err, html) {
      if(err) 
        throw err

      let stream = opts.eval === true ? jhaml(opts.scope || scope) : jhaml.tohtml(opts.scope || scope)
      let haml = new Buffer(html.length).fill(0)
      let cursor = 0

      fs.createReadStream(`${opts.fixtures}/${path}.haml`)
        .pipe(stream)
      
      stream.on('data', function(d) {
        d.copy(haml, cursor)
        cursor += d.length
      })

      stream.on('error', function(e) {
       if(opts.error === true) {
          done() 
       } else {
         throw e
       }
      })

      stream.on('end', function() {
        try {
          assert(haml.equals(html))
        } catch (e) {
          console.error('Haml:', haml.toString())
          console.error('Html:', html.toString())
          throw e
        }

        if(!opts.error) {
          done()
        }
      })
    })
  }
}

describe('jhaml', function() {
  function test(path, opts) {
    it('should ' + path, equal(path, opts)) 
  }

  test('html/comment')
  test('html/conditionalcomment') 
  test('html/escape') 
  test('html/elements') 
  test('html/attributes') 
  test('html/attributes.angular2') 
  test('html/attributes.boolean') 
  test('html/attributes.empty') 
  test('html/htmlcomment') 
  test('html/sidebuttons') 
  test('html/whitespace') 
  test('html/errors/indent') 
  test('html/errors/invalid') 
  test('html/quoteinsidequote') 
  test('html/attributes.numbers') 
  test('html/htmlspecialchar') 
  test('eval/encode', {eval: true}) 
  test('eval/execute', {eval: true}) 
  test('eval/switch', {eval: true}) 
  test('eval/whitespace', {eval: true}) 
  test('eval/interpolate', {eval: true}) 
  test('eval/errors/undefined', {error: true, eval: true}) 
  test('eval/errors/syntaxerror', {error: true, eval: true}) 
  test('eval/errors/anothererror', {error: true, eval: true}) 
  test('eval/all', {eval: true}) 
})

describe('haml.js', function() {
  let list = fs.readdirSync(hamljsfixtures)
  for(let i in list) {
    if(p.extname(list[i]) !== '.haml')
      continue

    let path = `${p.basename(list[i], '.haml')}`

    it('should ' + path, equal(path, {fixtures: hamljsfixtures, eval: true}))
  }
})

describe('stream', function() {

  it('should get a stream flow', function(cb) {
    let stream = jhaml.tohtml()

    let read = es.readArray(['.test', '\n   %p'])

    read.pipe(stream)

    let html = []

    stream.on('data', function(c) {
      html.push(c)
    })

    stream.on('end', function() {
      html = Buffer.concat(html)
      assert(html.equals(fs.readFileSync(`${__dirname}/fixtures/jhaml/stream.html`)))
      cb()
    })
  })

  it('should get a stream flow (js)', function(cb) {
    let stream = jhaml({}, {eval: false})

    let read = es.readArray(['.test', '\n   %p'])

    read.pipe(stream)

let result = `
'use strict';
for(let i in scope) { if(!global[i]) { global[i] = scope[i]; }}
var __html = '';
__html += \`<div class="test">\`;
__html += \`\\n   <p>\`;
__html += \`\\n   </p>\`;
__html += \`\\n</div>\`;`

    let html = []

    stream.on('data', function(c) {
      html.push(c)
    })

    stream.on('end', function() {
      html = Buffer.concat(html)
      assert(html.toString() == result)
      cb()
    })
  })

  it('should get a stream flow (normal)', function(cb) {
    let stream = jhaml({})

    let read = es.readArray(['.test', '\n   %p'])

    read.pipe(stream)

    let html = []

    stream.on('data', function(c) {
      html.push(c)
    })

    stream.on('end', function() {
      html = Buffer.concat(html)
      assert(html.equals(fs.readFileSync(`${__dirname}/fixtures/jhaml/stream.html`)))
      cb()
    })
  })
})
