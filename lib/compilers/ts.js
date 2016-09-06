var fs = require('fs')
var path = require('path')
var assign = require('object-assign')
var ensureRequire = require('../ensure-require')

// To create the final options:
// 1. we start from defaultTypescriptOptions
// 2. unless compiler.options.typescript.tsconfigPath === null, we look for
//    tsconfig in the specified path (or the current directory as default)
//    and merge the compilerOptions field
// 3. if compiler.options.typescript exists, we merge the options
// Note: source map settings are always overriden based on compiler.options.sourceMap

var defaultTypescriptOptions = {
  target: 'es5',
  module: 'commonjs',
  experimentalDecorators: true
}

var typescriptOptions

function resolveOptions (compiler) {
  if (typescriptOptions) {
    return typescriptOptions
  }
  typescriptOptions = assign({}, defaultTypescriptOptions)
  if (compiler.options.typescript && compiler.options.typescript.tsconfigPath) {
    assign(typescriptOptions, getTsconfigOptions(compiler.options.typescript.tsconfigPath))
  } else if (!compiler.options.typescript || compiler.options.typescript.tsconfigPath !== null) {
    assign(typescriptOptions, getTsconfigOptions())
  }
  assign(typescriptOptions, compiler.options.typescript || {})
  delete typescriptOptions.tsconfigPath
  delete typescriptOptions.inlineSourceMap
  delete typescriptOptions.inlineSources
  typescriptOptions.sourceMap = compiler.options.sourceMap

  return typescriptOptions

  function getTsconfigOptions (tsconfigPath) {
    var fullPath = path.resolve(process.cwd(), tsconfigPath || 'tsconfig.json')
    if (!fs.existsSync(fullPath)) {
      if (tsconfigPath) {
        throw new Error('[vueify] tsconfig not found: ' + fullPath)
      } else {
        return {}
      }
    }

    var compilerOptions
    try {
      compilerOptions = JSON.parse(fs.readFileSync(fullPath, 'utf-8'))['compilerOptions']
    } catch (e) {
      throw new Error('[vueify] Your tsconfig "' + fullPath + '" seems to be incorrectly formatted.')
    }
    return compilerOptions
  }
}

module.exports = function (raw, cb, compiler, filePath) {
  ensureRequire('typescript', 'typescript')
  var typescript = require('typescript')
  var res
  var options = {
    compilerOptions: resolveOptions(compiler),
    moduleName: '',
    reportDiagnostics: true
  }
  try {
    res = typescript.transpileModule(raw, options)
  } catch (err) {
    return cb(err)
  }
  if (res.diagnostics.length > 0) {
    var err = ''
    for (var i = 0; i < res.diagnostics.length; i++) {
      err += res.diagnostics[i].file.fileName + ': TS error ' +
        res.diagnostics[i].code + ': ' + res.diagnostics[i].messageText + '\n'
    }
    return cb(err)
  }
  if (compiler.options.sourceMap) {
    res = {
      code: res.outputText,
      map: res.sourceMapText
    }
  } else {
    res = res.outputText
  }
  cb(null, res)
}
