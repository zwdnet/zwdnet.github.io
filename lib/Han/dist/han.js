/*!
 * 漢字標準格式 v3.3.0 | MIT License | css.hanzi.co
 * Han.css: the CSS typography framework optimised for Hanzi
 */

void function( global, factory ) {

  // CommonJS
  if ( typeof module === 'object' && typeof module.exports === 'object' ) {
    module.exports = factory( global, true )
  // AMD
  } else if ( typeof define === 'function' && define.amd ) {
    define(function() {  return factory( global, true )  })
  // Global namespace
  } else {
    factory( global )
  }

}( typeof window !== 'undefined' ? window : this, function( window, noGlobalNS ) {

'use strict'

var document = window.document

var root = document.documentElement

var body = document.body

var VERSION = '3.3.0'

var ROUTINE = [
  // Initialise the condition with feature-detecting
  // classes (Modernizr-alike), binding onto the root
  // element, possibly `<html>`.
  'initCond',

  // Address element normalisation
  'renderElem',

  // Handle Biaodian
  /* 'jinzify', */
  'renderJiya',
  'renderHanging',

  // Address Biaodian correction
  'correctBiaodian',

  // Address Hanzi and Western script mixed spacing
  'renderHWS',

  // Address presentational correction to combining ligatures
  'substCombLigaWithPUA'

  // Address semantic correction to inaccurate characters
  // **Note:** inactivated by default
  /* 'substInaccurateChar', */
]

// Define Han
var Han = function( context, condition ) {
  return new Han.fn.init( context, condition )
}

var init = function() {
  if ( arguments[ 0 ] ) {
    this.context = arguments[ 0 ]
  }
  if ( arguments[ 1 ] ) {
    this.condition = arguments[ 1 ]
  }
  return this
}

Han.version = VERSION

Han.fn = Han.prototype = {
  version: VERSION,

  constructor: Han,

  // Body as the default target context
  context: body,

  // Root element as the default condition
  condition: root,

  // Default rendering routine
  routine: ROUTINE,

  init: init,

  setRoutine: function( routine ) {
    if ( Array.isArray( routine )) {
      this.routine = routine
    }
    return this
  },

  // Note that the routine set up here will execute
  // only once. The method won't alter the routine in
  // the instance or in the prototype chain.
  render: function( routine ) {
    var it = this
    var routine = Array.isArray( routine )
      ? routine
      : this.routine

    routine
    .forEach(function( method ) {
      if (
         typeof method === 'string' &&
         typeof it[ method ] === 'function'
      ) {
        it[ method ]()
      } else if (
        Array.isArray( method ) &&
        typeof it[ method[0] ] === 'function'
      ) {
        it[ method.shift() ].apply( it, method )
      }
    })
    return this
  }
}

Han.fn.init.prototype = Han.fn

/**
 * Shortcut for `render()` under the default
 * situation.
 *
 * Once initialised, replace `Han.init` with the
 * instance for future usage.
 */
Han.init = function() {
  return Han.init = Han().render()
}

var UNICODE = {
  /**
   * Western punctuation (西文標點符號)
   */
  punct: {
    base:   '[\u2026,.;:!?\u203D_]',
    sing:   '[\u2010-\u2014\u2026]',
    middle: '[\\\/~\\-&\u2010-\u2014_]',
    open:   '[\'"‘“\\(\\[\u00A1\u00BF\u2E18\u00AB\u2039\u201A\u201C\u201E]',
    close:  '[\'"”’\\)\\]\u00BB\u203A\u201B\u201D\u201F]',
    end:    '[\'"”’\\)\\]\u00BB\u203A\u201B\u201D\u201F\u203C\u203D\u2047-\u2049,.;:!?]',
  },

  /**
   * CJK biaodian (CJK標點符號)
   */
  biaodian: {
    base:   '[︰．、，。：；？！ー]',
    liga:   '[—…⋯]',
    middle: '[·＼／－゠\uFF06\u30FB\uFF3F]',
    open:   '[「『《〈（〔［｛【〖]',
    close:  '[」』》〉）〕］｝】〗]',
    end:    '[」』》〉）〕］｝】〗︰．、，。：；？！ー]'
  },

  /**
   * CJK-related blocks (CJK相關字符區段)
   *
   *  1. 中日韓統一意音文字：[\u4E00-\u9FFF]
         Basic CJK unified ideographs
   *  2. 擴展-A區：[\u3400-\u4DB5]
         Extended-A
   *  3. 擴展-B區：[\u20000-\u2A6D6]（[\uD840-\uD869][\uDC00-\uDED6]）
         Extended-B
   *  4. 擴展-C區：[\u2A700-\u2B734]（\uD86D[\uDC00-\uDF3F]|[\uD86A-\uD86C][\uDC00-\uDFFF]|\uD869[\uDF00-\uDFFF]）
         Extended-C
   *  5. 擴展-D區：[\u2B740-\u2B81D]（急用漢字，\uD86D[\uDF40-\uDFFF]|\uD86E[\uDC00-\uDC1F]）
         Extended-D
   *  6. 擴展-E區：[\u2B820-\u2F7FF]（暫未支援）
         Extended-E (not supported yet)
   *  7. 擴展-F區（暫未支援）
         Extended-F (not supported yet)
   *  8. 筆畫區：[\u31C0-\u31E3]
         Strokes
   *  9. 意音數字「〇」：[\u3007]
         Ideographic number zero
   * 10. 相容意音文字及補充：[\uF900-\uFAFF][\u2F800-\u2FA1D]（不使用）
         Compatibility ideograph and supplement (not supported)

         12 exceptions:
         [\uFA0E\uFA0F\uFA11\uFA13\uFA14\uFA1F\uFA21\uFA23\uFA24\uFA27-\uFA29]

         https://zh.wikipedia.org/wiki/中日韓統一表意文字#cite_note-1

   * 11. 康熙字典及簡化字部首：[\u2F00-\u2FD5\u2E80-\u2EF3]
         Kangxi and supplement radicals
   * 12. 意音文字描述字元：[\u2FF0-\u2FFA]
         Ideographic description characters
   */
  hanzi: {
    base:    '[\u4E00-\u9FFF\u3400-\u4DB5\u31C0-\u31E3\u3007\uFA0E\uFA0F\uFA11\uFA13\uFA14\uFA1F\uFA21\uFA23\uFA24\uFA27-\uFA29]|[\uD800-\uDBFF][\uDC00-\uDFFF]',
    desc:    '[\u2FF0-\u2FFA]',
    radical: '[\u2F00-\u2FD5\u2E80-\u2EF3]'
  },

  /**
   * Latin script blocks (拉丁字母區段)
   *
   * 1. 基本拉丁字母：A-Za-z
        Basic Latin
   * 2. 阿拉伯數字：0-9
        Digits
   * 3. 補充-1：[\u00C0-\u00FF]
        Latin-1 supplement
   * 4. 擴展-A區：[\u0100-\u017F]
        Extended-A
   * 5. 擴展-B區：[\u0180-\u024F]
        Extended-B
   * 5. 擴展-C區：[\u2C60-\u2C7F]
        Extended-C
   * 5. 擴展-D區：[\uA720-\uA7FF]
        Extended-D
   * 6. 附加區：[\u1E00-\u1EFF]
        Extended additional
   * 7. 變音組字符：[\u0300-\u0341\u1DC0-\u1DFF]
        Combining diacritical marks
   */
  latin: {
    base:    '[A-Za-z0-9\u00C0-\u00FF\u0100-\u017F\u0180-\u024F\u2C60-\u2C7F\uA720-\uA7FF\u1E00-\u1EFF]',
    combine: '[\u0300-\u0341\u1DC0-\u1DFF]'
  },

  /**
   * Elli̱niká (Greek) script blocks (希臘字母區段)
   *
   * 1. 希臘字母及擴展：[\u0370–\u03FF\u1F00-\u1FFF]
        Basic Greek & Greek Extended
   * 2. 阿拉伯數字：0-9
        Digits
   * 3. 希臘字母變音組字符：[\u0300-\u0345\u1DC0-\u1DFF]
        Combining diacritical marks
   */
  ellinika: {
    base:    '[0-9\u0370-\u03FF\u1F00-\u1FFF]',
    combine: '[\u0300-\u0345\u1DC0-\u1DFF]'
  },

  /**
   * Kirillica (Cyrillic) script blocks (西里爾字母區段)
   *
   * 1. 西里爾字母及補充：[\u0400-\u0482\u048A-\u04FF\u0500-\u052F]
        Basic Cyrillic and supplement
   * 2. 擴展B區：[\uA640-\uA66E\uA67E-\uA697]
        Extended-B
   * 3. 阿拉伯數字：0-9
        Digits
   * 4. 西里爾字母組字符：[\u0483-\u0489\u2DE0-\u2DFF\uA66F-\uA67D\uA69F]（位擴展A、B區）
        Cyrillic combining diacritical marks (in extended-A, B)
   */
  kirillica: {
    base:    '[0-9\u0400-\u0482\u048A-\u04FF\u0500-\u052F\uA640-\uA66E\uA67E-\uA697]',
    combine: '[\u0483-\u0489\u2DE0-\u2DFF\uA66F-\uA67D\uA69F]'
  },

  /**
   * Kana (假名)
   *
   * 1. 日文假名：[\u30A2\u30A4\u30A6\u30A8\u30AA-\u30FA\u3042\u3044\u3046\u3048\u304A-\u3094\u309F\u30FF]
        Japanese Kana
   * 2. 假名補充[\u1B000\u1B001]（\uD82C[\uDC00-\uDC01]）
        Kana supplement
   * 3. 日文假名小寫：[\u3041\u3043\u3045\u3047\u3049\u30A1\u30A3\u30A5\u30A7\u30A9\u3063\u3083\u3085\u3087\u308E\u3095\u3096\u30C3\u30E3\u30E5\u30E7\u30EE\u30F5\u30F6\u31F0-\u31FF]
        Japanese small Kana
   * 4. 假名組字符：[\u3099-\u309C]
        Kana combining characters
   * 5. 半形假名：[\uFF66-\uFF9F]
        Halfwidth Kana
   * 6. 符號：[\u309D\u309E\u30FB-\u30FE]
        Marks
   */
  kana: {
    base:    '[\u30A2\u30A4\u30A6\u30A8\u30AA-\u30FA\u3042\u3044\u3046\u3048\u304A-\u3094\u309F\u30FF]|\uD82C[\uDC00-\uDC01]',
    small:   '[\u3041\u3043\u3045\u3047\u3049\u30A1\u30A3\u30A5\u30A7\u30A9\u3063\u3083\u3085\u3087\u308E\u3095\u3096\u30C3\u30E3\u30E5\u30E7\u30EE\u30F5\u30F6\u31F0-\u31FF]',
    combine: '[\u3099-\u309C]',
    half:    '[\uFF66-\uFF9F]',
    mark:    '[\u30A0\u309D\u309E\u30FB-\u30FE]'
  },

  /**
   * Eonmun (Hangul, 諺文)
   *
   * 1. 諺文音節：[\uAC00-\uD7A3]
        Eonmun (Hangul) syllables
   * 2. 諺文字母：[\u1100-\u11FF\u314F-\u3163\u3131-\u318E\uA960-\uA97C\uD7B0-\uD7FB]
        Eonmun (Hangul) letters
   * 3. 半形諺文字母：[\uFFA1-\uFFDC]
        Halfwidth Eonmun (Hangul) letters
   */
  eonmun: {
    base:    '[\uAC00-\uD7A3]',
    letter:  '[\u1100-\u11FF\u314F-\u3163\u3131-\u318E\uA960-\uA97C\uD7B0-\uD7FB]',
    half:    '[\uFFA1-\uFFDC]'
  },

  /**
   * Zhuyin (注音符號, Mandarin & Dialect Phonetic Symbols)
   *
   * 1. 國語注音、方言音符號：[\u3105-\u312D][\u31A0-\u31BA]
        Bopomofo phonetic symbols
   * 2. 平上去聲調號：[\u02D9\u02CA\u02C5\u02C7\u02EA\u02EB\u02CB] （**註：**國語三聲包含乙個不合規範的符號）
        Level, rising, departing tones
   * 3. 入聲調號：[\u31B4-\u31B7][\u0358\u030d]?
        Checked (entering) tones
   */
  zhuyin: {
    base:    '[\u3105-\u312D\u31A0-\u31BA]',
    initial: '[\u3105-\u3119\u312A-\u312C\u31A0-\u31A3]',
    medial:  '[\u3127-\u3129]',
    final:   '[\u311A-\u3129\u312D\u31A4-\u31B3\u31B8-\u31BA]',
    tone:    '[\u02D9\u02CA\u02C5\u02C7\u02CB\u02EA\u02EB]',
    checked: '[\u31B4-\u31B7][\u0358\u030d]?'
  }
}

var TYPESET = (function() {
  var rWhite = '[\\x20\\t\\r\\n\\f]'
  // Whitespace characters
  // http://www.w3.org/TR/css3-selectors/#whitespace

  var rPtOpen = UNICODE.punct.open
  var rPtClose = UNICODE.punct.close
  var rPtEnd = UNICODE.punct.end
  var rPtMid = UNICODE.punct.middle
  var rPtSing = UNICODE.punct.sing
  var rPt = rPtOpen + '|' + rPtEnd + '|' + rPtMid

  var rBDOpen = UNICODE.biaodian.open
  var rBDClose = UNICODE.biaodian.close
  var rBDEnd = UNICODE.biaodian.end
  var rBDMid = UNICODE.biaodian.middle
  var rBDLiga = UNICODE.biaodian.liga + '{2}'
  var rBD = rBDOpen + '|' + rBDEnd + '|' + rBDMid

  var rKana = UNICODE.kana.base + UNICODE.kana.combine + '?'
  var rKanaS = UNICODE.kana.small + UNICODE.kana.combine + '?'
  var rKanaH = UNICODE.kana.half
  var rEon = UNICODE.eonmun.base + '|' + UNICODE.eonmun.letter
  var rEonH = UNICODE.eonmun.half

  var rHan = UNICODE.hanzi.base + '|' + UNICODE.hanzi.desc + '|' + UNICODE.hanzi.radical + '|' + rKana

  var rCbn = UNICODE.ellinika.combine
  var rLatn = UNICODE.latin.base + rCbn + '*'
  var rGk = UNICODE.ellinika.base + rCbn + '*'

  var rCyCbn = UNICODE.kirillica.combine
  var rCy = UNICODE.kirillica.base + rCyCbn + '*'

  var rAlph = rLatn + '|' + rGk + '|' + rCy

  // For words like `it's`, `Jones’s` or `'99`
  var rApo = '[\u0027\u2019]'
  var rChar = rHan + '|(?:' + rAlph + '|' + rApo + ')+'

  var rZyS = UNICODE.zhuyin.initial
  var rZyJ = UNICODE.zhuyin.medial
  var rZyY = UNICODE.zhuyin.final
  var rZyD = UNICODE.zhuyin.tone + '|' + UNICODE.zhuyin.checked

  return {
    /* Character-level selector (字級選擇器)
     */
    char: {
      punct: {
        all:   new RegExp( '(' + rPt + ')', 'g' ),
        open:  new RegExp( '(' + rPtOpen + ')', 'g' ),
        end:   new RegExp( '(' + rPtEnd + ')', 'g' ),
        sing:  new RegExp( '(' + rPtSing + ')', 'g' )
      },

      biaodian: {
        all:   new RegExp( '(' + rBD + ')', 'g' ),
        open:  new RegExp( '(' + rBDOpen + ')', 'g' ),
        close: new RegExp( '(' + rBDClose + ')', 'g' ),
        end:   new RegExp( '(' + rBDEnd + ')', 'g' ),
        liga:  new RegExp( '(' + rBDLiga + ')', 'g' )
      },

      hanzi:     new RegExp( '(' + rHan + ')', 'g' ),

      latin:     new RegExp( '(' + rLatn + ')', 'ig' ),
      ellinika:  new RegExp( '(' + rGk + ')', 'ig' ),
      kirillica: new RegExp( '(' + rCy + ')', 'ig' ),

      kana:      new RegExp( '(' + rKana + '|' + rKanaS + '|' + rKanaH + ')', 'g' ),
      eonmun:    new RegExp( '(' + rEon + '|' + rEonH + ')', 'g' )
    },

    /* Word-level selectors (詞級選擇器)
     */
    group: {
      biaodian: [
        new RegExp( '((' + rBD + '){2,})', 'g' ),
        new RegExp( '(' + rBDLiga + rBDOpen + ')', 'g' )
      ],
      punct:       null,
      hanzi:       new RegExp( '(' + rHan + ')+', 'g' ),
      western:     new RegExp( '(' + rLatn + '|' + rGk + '|' + rCy + '|' + rPt + ')+', 'ig' ),
      kana:        new RegExp( '(' + rKana + '|' + rKanaS + '|' + rKanaH + ')+', 'g' ),
      eonmun:      new RegExp( '(' + rEon + '|' + rEonH + '|' + rPt + ')+', 'g' )
    },

    /* Punctuation Rules (禁則)
     */
    jinze: {
      hanging:  new RegExp( rWhite + '*([、，。．])(?!' + rBDEnd + ')', 'ig' ),
      touwei:   new RegExp( '(' + rBDOpen + '+)(' + rChar + ')(' + rBDEnd + '+)', 'ig' ),
      tou:      new RegExp( '(' + rBDOpen + '+)(' + rChar + ')', 'ig' ),
      wei:      new RegExp( '(' + rChar + ')(' + rBDEnd + '+)', 'ig' ),
      middle:   new RegExp( '(' + rChar + ')(' + rBDMid + ')(' + rChar + ')', 'ig' )
    },

    zhuyin: {
      form:     new RegExp( '^\u02D9?(' + rZyS + ')?(' + rZyJ + ')?(' + rZyY + ')?(' + rZyD + ')?$' ),
      diao:     new RegExp( '(' + rZyD + ')', 'g' )
    },

    /* Hanzi and Western mixed spacing (漢字西文混排間隙)
     * - Basic mode
     * - Strict mode
     */
    hws: {
      base: [
        new RegExp( '('+ rHan + ')(' + rAlph + '|' + rPtOpen + ')', 'ig' ),
        new RegExp( '('+ rAlph + '|' + rPtEnd + ')(' + rHan + ')', 'ig' )
      ],

      strict: [
        new RegExp( '('+ rHan + ')' + rWhite + '?(' + rAlph + '|' + rPtOpen + ')', 'ig' ),
        new RegExp( '('+ rAlph + '|' + rPtEnd + ')' + rWhite + '?(' + rHan + ')', 'ig' )
      ]
    },

    // The feature displays the following characters
    // in its variant form for font consistency and
    // presentational reason. Meanwhile, this won't
    // alter the original character in the DOM.
    'display-as': {
      'ja-font-for-hant': [
        // '夠 够',
        '查 査',
        '啟 啓',
        '鄉 鄕',
        '值 値',
        '污 汚'
      ],

      'comb-liga-pua': [
        [ '\u0061[\u030d\u0358]', '\uDB80\uDC61' ],
        [ '\u0065[\u030d\u0358]', '\uDB80\uDC65' ],
        [ '\u0069[\u030d\u0358]', '\uDB80\uDC69' ],
        [ '\u006F[\u030d\u0358]', '\uDB80\uDC6F' ],
        [ '\u0075[\u030d\u0358]', '\uDB80\uDC75' ],

        [ '\u31B4[\u030d\u0358]', '\uDB8C\uDDB4' ],
        [ '\u31B5[\u030d\u0358]', '\uDB8C\uDDB5' ],
        [ '\u31B6[\u030d\u0358]', '\uDB8C\uDDB6' ],
        [ '\u31B7[\u030d\u0358]', '\uDB8C\uDDB7' ]
      ],

      'comb-liga-vowel': [
        [ '\u0061[\u030d\u0358]', '\uDB80\uDC61' ],
        [ '\u0065[\u030d\u0358]', '\uDB80\uDC65' ],
        [ '\u0069[\u030d\u0358]', '\uDB80\uDC69' ],
        [ '\u006F[\u030d\u0358]', '\uDB80\uDC6F' ],
        [ '\u0075[\u030d\u0358]', '\uDB80\uDC75' ]
      ],

      'comb-liga-zhuyin': [
        [ '\u31B4[\u030d\u0358]', '\uDB8C\uDDB4' ],
        [ '\u31B5[\u030d\u0358]', '\uDB8C\uDDB5' ],
        [ '\u31B6[\u030d\u0358]', '\uDB8C\uDDB6' ],
        [ '\u31B7[\u030d\u0358]', '\uDB8C\uDDB7' ]
      ]
    },

    // The feature actually *converts* the character
    // in the DOM for semantic reason.
    //
    // Note that this could be aggressive.
    'inaccurate-char': [
      [ '[\u2022\u2027]', '\u00B7' ],
      [ '\u22EF\u22EF', '\u2026\u2026' ],
      [ '\u2500\u2500', '\u2014\u2014' ],
      [ '\u2035', '\u2018' ],
      [ '\u2032', '\u2019' ],
      [ '\u2036', '\u201C' ],
      [ '\u2033', '\u201D' ]
    ]
  }
})()

Han.UNICODE = UNICODE
Han.TYPESET = TYPESET

// Aliases
Han.UNICODE.cjk      = Han.UNICODE.hanzi
Han.UNICODE.greek    = Han.UNICODE.ellinika
Han.UNICODE.cyrillic = Han.UNICODE.kirillica
Han.UNICODE.hangul   = Han.UNICODE.eonmun
Han.UNICODE.zhuyin.ruyun = Han.UNICODE.zhuyin.checked

Han.TYPESET.char.cjk      = Han.TYPESET.char.hanzi
Han.TYPESET.char.greek    = Han.TYPESET.char.ellinika
Han.TYPESET.char.cyrillic = Han.TYPESET.char.kirillica
Han.TYPESET.char.hangul   = Han.TYPESET.char.eonmun

Han.TYPESET.group.hangul  = Han.TYPESET.group.eonmun
Han.TYPESET.group.cjk     = Han.TYPESET.group.hanzi

var $ = {
  /**
   * Query selectors which return arrays of the resulted
   * node lists.
   */
  id: function( selector, $context ) {
    return ( $context || document ).getElementById( selector )
  },

  tag: function( selector, $context ) {
    return this.makeArray(
      ( $context || document ).getElementsByTagName( selector )
    )
  },

  qs: function( selector, $context ) {
    return ( $context || document ).querySelector( selector )
  },

  qsa: function( selector, $context ) {
    return this.makeArray(
      ( $context || document ).querySelectorAll( selector )
    )
  },

  parent: function( $node, selector ) {
    return selector
      ? (function() {
        if ( typeof $.matches !== 'function' )  return

        while (!$.matches( $node, selector )) {
          if (
            !$node ||
            $node === document.documentElement
          ) {
            $node = undefined
            break
          }
          $node = $node.parentNode
        }
        return $node
      })()
      : $node
      ? $node.parentNode : undefined
  },

  /**
   * Create a document fragment, a text node with text
   * or an element with/without classes.
   */
  create: function( name, clazz ) {
    var $elmt = '!' === name
      ? document.createDocumentFragment()
      : '' === name
      ? document.createTextNode( clazz || '' )
      : document.createElement( name )

    try {
      if ( clazz ) {
        $elmt.className = clazz
      }
    } catch (e) {}

    return $elmt
  },

  /**
   * Clone a DOM node (text, element or fragment) deeply
   * or childlessly.
   */
  clone: function( $node, deep ) {
    return $node.cloneNode(
      typeof deep === 'boolean'
      ? deep
      : true
    )
  },

  /**
   * Remove a node (text, element or fragment).
   */
  remove: function( $node ) {
    return $node.parentNode.removeChild( $node )
  },

  /**
   * Set attributes all in once with an object.
   */
  setAttr: function( target, attr ) {
    if ( typeof attr !== 'object' )  return
    var len = attr.length

    // Native `NamedNodeMap``:
    if (
      typeof attr[0] === 'object' &&
      'name' in attr[0]
    ) {
      for ( var i = 0; i < len; i++ ) {
        if ( attr[ i ].value !== undefined ) {
          target.setAttribute( attr[ i ].name, attr[ i ].value )
        }
      }

    // Plain object:
    } else {
      for ( var name in attr ) {
        if (
          attr.hasOwnProperty( name ) &&
          attr[ name ] !== undefined
        ) {
          target.setAttribute( name, attr[ name ] )
        }
      }
    }
    return target
  },

  /**
   * Indicate whether or not the given node is an
   * element.
   */
  isElmt: function( $node ) {
    return $node && $node.nodeType === Node.ELEMENT_NODE
  },

  /**
   * Indicate whether or not the given node should
   * be ignored (`<wbr>` or comments).
   */
  isIgnorable: function( $node ) {
    if ( !$node )  return false

    return (
      $node.nodeName === 'WBR' ||
      $node.nodeType === Node.COMMENT_NODE
    )
  },

  /**
   * Convert array-like objects into real arrays.
   */
  makeArray: function( object ) {
    return Array.prototype.slice.call( object )
  },

  /**
   * Extend target with an object.
   */
  extend: function( target, object ) {
    if ((
      typeof target === 'object' ||
      typeof target === 'function' ) &&
      typeof object === 'object'
    ) {
      for ( var name in object ) {
        if (object.hasOwnProperty( name )) {
          target[ name ] = object[ name ]
        }
      }
    }
    return target
  }
}

var Fibre =
/*!
 * Fibre.js v0.2.1 | MIT License | github.com/ethantw/fibre.js
 * Based on findAndReplaceDOMText
 */

function( Finder ) {

'use strict'

var VERSION = '0.2.1'
var NON_INLINE_PROSE = Finder.NON_INLINE_PROSE
var AVOID_NON_PROSE = Finder.PRESETS.prose.filterElements

var global = window || {}
var document = global.document || undefined

function matches( node, selector, bypassNodeType39 ) {
  var Efn = Element.prototype
  var matches = Efn.matches || Efn.mozMatchesSelector || Efn.msMatchesSelector || Efn.webkitMatchesSelector
  
  if ( node instanceof Element ) {
    return matches.call( node, selector ) 
  } else if ( bypassNodeType39 ) {
    if ( /^[39]$/.test( node.nodeType ))  return true
  }
  return false
}

if ( typeof document === 'undefined' )  throw new Error( 'Fibre requires a DOM-supported environment.' )

var Fibre = function( context, preset ) {
  return new Fibre.fn.init( context, preset )
}

Fibre.version = VERSION
Fibre.matches = matches

Fibre.fn = Fibre.prototype = {
  constructor: Fibre,

  version: VERSION,

  finder: [],

  context: undefined,

  portionMode: 'retain',

  selector: {},

  preset: 'prose',

  init: function( context, noPreset ) {
    if ( !!noPreset )  this.preset = null

    this.selector = {
      context: null,
      filter: [],
      avoid: [],
      boundary: []
    }

    if ( !context ) {
      throw new Error( 'A context is required for Fibre to initialise.' ) 
    } else if ( context instanceof Node ) {
      if ( context instanceof Document )  this.context = context.body || context
      else  this.context = context
    } else if ( typeof context === 'string' ) {
      this.context = document.querySelector( context )
      this.selector.context = context
    }
    return this
  },

  filterFn: function( node ) {
    var filter = this.selector.filter.join( ', ' ) || '*'
    var avoid  = this.selector.avoid.join( ', ' ) || null
    var result = matches( node, filter, true ) && !matches( node, avoid )
    return ( this.preset === 'prose' ) ? AVOID_NON_PROSE( node ) && result : result
  },

  boundaryFn: function( node ) {
    var boundary = this.selector.boundary.join( ', ' ) || null
    var result = matches( node, boundary )
    return ( this.preset === 'prose' ) ? NON_INLINE_PROSE( node ) || result : result
  },

  filter: function( selector ) {
    if ( typeof selector === 'string' ) {
      this.selector.filter.push( selector )
    }
    return this
  },

  endFilter: function( all ) {
    if ( all ) {
      this.selector.filter = []
    } else {
      this.selector.filter.pop()
    }
    return this
  },

  avoid: function( selector ) {
    if ( typeof selector === 'string' ) {
      this.selector.avoid.push( selector )
    }
    return this
  },

  endAvoid: function( all ) {
    if ( all ) {
      this.selector.avoid = []
    } else {
      this.selector.avoid.pop()
    }
    return this
  },

  addBoundary: function( selector ) {
    if ( typeof selector === 'string' ) {
      this.selector.boundary.push( selector )
    }
    return this
  },

  removeBoundary: function() {
    this.selector.boundary = []
    return this
  },

  setMode: function( portionMode ) {
    this.portionMode = portionMode === 'first' ? 'first' : 'retain'
    return this
  },

  replace: function( regexp, newSubStr ) {
    var it = this
    it.finder.push(Finder( it.context, {
      find: regexp, 
      replace: newSubStr,
      filterElements: function( currentNode ) {
        return it.filterFn( currentNode )
      }, 
      forceContext: function( currentNode ) {
        return it.boundaryFn( currentNode )
      },
      portionMode: it.portionMode
    }))
    return it 
  },

  wrap: function( regexp, strElemName ) {
    var it = this
    it.finder.push(Finder( it.context, {
      find: regexp, 
      wrap: strElemName,
      filterElements: function( currentNode ) {
        return it.filterFn( currentNode )
      },
      forceContext: function( currentNode ) {
        return it.boundaryFn( currentNode )
      },
      portionMode: it.portionMode
    }))
    return it
  },

  revert: function( level ) {
    var max = this.finder.length        
    var level = Number( level ) || ( level === 0 ? Number(0) :
      ( level === 'all' ? max : 1 ))

    if ( typeof max === 'undefined' || max === 0 )  return this
    else if ( level > max )  level = max

    for ( var i = level; i > 0; i-- ) {
      this.finder.pop().revert()
    }
    return this
  }
}

// Deprecated API(s)
Fibre.fn.filterOut = Fibre.fn.avoid

// Make sure init() inherit from Fibre()
Fibre.fn.init.prototype = Fibre.fn

return Fibre

}(

/**
 * findAndReplaceDOMText v 0.4.3
 * @author James Padolsey http://james.padolsey.com
 * @license http://unlicense.org/UNLICENSE
 *
 * Matches the text of a DOM node against a regular expression
 * and replaces each match (or node-separated portions of the match)
 * in the specified element.
 */
 (function() {

  var PORTION_MODE_RETAIN = 'retain'
  var PORTION_MODE_FIRST = 'first'
  var doc = document
  var toString = {}.toString
  var hasOwn = {}.hasOwnProperty
  function isArray(a) {
    return toString.call(a) == '[object Array]'
  }

  function escapeRegExp(s) {
    return String(s).replace(/([.*+?^=!:${}()|[\]\/\\])/g, '\\$1')
  }

  function exposed() {
    // Try deprecated arg signature first:
    return deprecated.apply(null, arguments) || findAndReplaceDOMText.apply(null, arguments)
  }

  function deprecated(regex, node, replacement, captureGroup, elFilter) {
    if ((node && !node.nodeType) && arguments.length <= 2) {
      return false
    }
    var isReplacementFunction = typeof replacement == 'function'
    if (isReplacementFunction) {
      replacement = (function(original) {
        return function(portion, match) {
          return original(portion.text, match.startIndex)
        }
      }(replacement))
    }

    // Awkward support for deprecated argument signature (<0.4.0)
    var instance = findAndReplaceDOMText(node, {

      find: regex,

      wrap: isReplacementFunction ? null : replacement,
      replace: isReplacementFunction ? replacement : '$' + (captureGroup || '&'),

      prepMatch: function(m, mi) {

        // Support captureGroup (a deprecated feature)

        if (!m[0]) throw 'findAndReplaceDOMText cannot handle zero-length matches'
        if (captureGroup > 0) {
          var cg = m[captureGroup]
          m.index += m[0].indexOf(cg)
          m[0] = cg
        }
     
        m.endIndex = m.index + m[0].length
        m.startIndex = m.index
        m.index = mi
        return m
      },
      filterElements: elFilter
    })
    exposed.revert = function() {
      return instance.revert()
    }
    return true
  }

  /** 
   * findAndReplaceDOMText
   * 
   * Locates matches and replaces with replacementNode
   *
   * @param {Node} node Element or Text node to search within
   * @param {RegExp} options.find The regular expression to match
   * @param {String|Element} [options.wrap] A NodeName, or a Node to clone
   * @param {String|Function} [options.replace='$&'] What to replace each match with
   * @param {Function} [options.filterElements] A Function to be called to check whether to
   *	process an element. (returning true = process element,
   *	returning false = avoid element)
   */
  function findAndReplaceDOMText(node, options) {
    return new Finder(node, options)
  }

  exposed.NON_PROSE_ELEMENTS = {
    br:1, hr:1,
    // Media / Source elements:
    script:1, style:1, img:1, video:1, audio:1, canvas:1, svg:1, map:1, object:1,
    // Input elements
    input:1, textarea:1, select:1, option:1, optgroup: 1, button:1
  }
  exposed.NON_CONTIGUOUS_PROSE_ELEMENTS = {

    // Elements that will not contain prose or block elements where we don't
    // want prose to be matches across element borders:

    // Block Elements
    address:1, article:1, aside:1, blockquote:1, dd:1, div:1,
    dl:1, fieldset:1, figcaption:1, figure:1, footer:1, form:1, h1:1, h2:1, h3:1,
    h4:1, h5:1, h6:1, header:1, hgroup:1, hr:1, main:1, nav:1, noscript:1, ol:1,
    output:1, p:1, pre:1, section:1, ul:1,
    // Other misc. elements that are not part of continuous inline prose:
    br:1, li: 1, summary: 1, dt:1, details:1, rp:1, rt:1, rtc:1,
    // Media / Source elements:
    script:1, style:1, img:1, video:1, audio:1, canvas:1, svg:1, map:1, object:1,
    // Input elements
    input:1, textarea:1, select:1, option:1, optgroup: 1, button:1,
    // Table related elements:
    table:1, tbody:1, thead:1, th:1, tr:1, td:1, caption:1, col:1, tfoot:1, colgroup:1

  }
  exposed.NON_INLINE_PROSE = function(el) {
    return hasOwn.call(exposed.NON_CONTIGUOUS_PROSE_ELEMENTS, el.nodeName.toLowerCase())
  }
  // Presets accessed via `options.preset` when calling findAndReplaceDOMText():
  exposed.PRESETS = {
    prose: {
      forceContext: exposed.NON_INLINE_PROSE,
      filterElements: function(el) {
        return !hasOwn.call(exposed.NON_PROSE_ELEMENTS, el.nodeName.toLowerCase())
      }
    }
  }
  exposed.Finder = Finder
  /**
   * Finder -- encapsulates logic to find and replace.
   */
  function Finder(node, options) {

    var preset = options.preset && exposed.PRESETS[options.preset]
    options.portionMode = options.portionMode || PORTION_MODE_RETAIN
    if (preset) {
      for (var i in preset) {
        if (hasOwn.call(preset, i) && !hasOwn.call(options, i)) {
          options[i] = preset[i]
        }
      }
    }

    this.node = node
    this.options = options
    // ENable match-preparation method to be passed as option:
    this.prepMatch = options.prepMatch || this.prepMatch
    this.reverts = []
    this.matches = this.search()
    if (this.matches.length) {
      this.processMatches()
    }

  }

  Finder.prototype = {

    /**
     * Searches for all matches that comply with the instance's 'match' option
     */
    search: function() {

      var match
      var matchIndex = 0
      var offset = 0
      var regex = this.options.find
      var textAggregation = this.getAggregateText()
      var matches = []
      var self = this
      regex = typeof regex === 'string' ? RegExp(escapeRegExp(regex), 'g') : regex
      matchAggregation(textAggregation)
      function matchAggregation(textAggregation) {
        for (var i = 0, l = textAggregation.length; i < l; ++i) {

          var text = textAggregation[i]
          if (typeof text !== 'string') {
            // Deal with nested contexts: (recursive)
            matchAggregation(text)
            continue
          }

          if (regex.global) {
            while (match = regex.exec(text)) {
              matches.push(self.prepMatch(match, matchIndex++, offset))
            }
          } else {
            if (match = text.match(regex)) {
              matches.push(self.prepMatch(match, 0, offset))
            }
          }

          offset += text.length
        }
      }

      return matches
    },

    /**
     * Prepares a single match with useful meta info:
     */
    prepMatch: function(match, matchIndex, characterOffset) {

      if (!match[0]) {
        throw new Error('findAndReplaceDOMText cannot handle zero-length matches')
      }
   
      match.endIndex = characterOffset + match.index + match[0].length
      match.startIndex = characterOffset + match.index
      match.index = matchIndex
      return match
    },

    /**
     * Gets aggregate text within subject node
     */
    getAggregateText: function() {

      var elementFilter = this.options.filterElements
      var forceContext = this.options.forceContext
      return getText(this.node)
      /**
       * Gets aggregate text of a node without resorting
       * to broken innerText/textContent
       */
      function getText(node, txt) {

        if (node.nodeType === 3) {
          return [node.data]
        }

        if (elementFilter && !elementFilter(node)) {
          return []
        }

        var txt = ['']
        var i = 0
        if (node = node.firstChild) do {

          if (node.nodeType === 3) {
            txt[i] += node.data
            continue
          }

          var innerText = getText(node)
          if (
            forceContext &&
            node.nodeType === 1 &&
            (forceContext === true || forceContext(node))
          ) {
            txt[++i] = innerText
            txt[++i] = ''
          } else {
            if (typeof innerText[0] === 'string') {
              // Bridge nested text-node data so that they're
              // not considered their own contexts:
              // I.e. ['some', ['thing']] -> ['something']
              txt[i] += innerText.shift()
            }
            if (innerText.length) {
              txt[++i] = innerText
              txt[++i] = ''
            }
          }
        } while (node = node.nextSib