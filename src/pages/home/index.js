// Hello
import $ from 'jquery'
import 'js/alert'
import './index.css'

function log (x, y = 'World') {
  console.log(x, y)
}

log('Hello') // Hello World
log('Hello', 'China') // Hello China
log('Hello', '')
