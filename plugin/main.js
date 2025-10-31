const editor = editorManager.editor;

// --- 1. DAFTAR KEYWORD, LITERAL, DAN TYPE KERL.JS ---  
const LT_COMPLETIONS_DATA = [
  // Keyword Utama  
  {
    value: "val",
    meta: "keyword"
  },
  {
    value: "mut",
    meta: "keyword"
  },
  {
    value: "fun",
    meta: "keyword"
  },
  {
    value: "if",
    meta: "keyword"
  },
  {
    value: "else",
    meta: "keyword"
  },
  {
    value: "for",
    meta: "keyword"
  },
  {
    value: "while",
    meta: "keyword"
  },
  {
    value: "switch",
    meta: "keyword"
  },
  {
    value: "case",
    meta: "keyword"
  },
  {
    value: "default",
    meta: "keyword"
  },
  {
    value: "break",
    meta: "keyword"
  },
  {
    value: "continue",
    meta: "keyword"
  },
  {
    value: "return",
    meta: "keyword"
  },
  {
    value: "print",
    meta: "function"
  },
  {
    value: "error",
    meta: "function"
  },
  {
    value: "println",
    meta: "function"
  },
  {
    value: "errorln",
    meta: "function"
  },
  {
    value: "string",
    meta: "function"
  },
  {
    value: "number",
    meta: "function"
  },
  {
    value: "typeof",
    meta: "function"
  },

  // Literal Bahasa (Nilai yang baku)  
  {
    value: "true",
    meta: "literal"
  },
  {
    value: "false",
    meta: "literal"
  },
  {
    value: "null",
    meta: "literal"
  },
  {
    value: "undefined",
    meta: "literal"
  },

  // Tipe Data  
  {
    value: "Any",
    meta: "type"
  },
  {
    value: "Anything",
    meta: "type"
  },
  {
    value: "Num",
    meta: "type"
  },
  {
    value: "Number",
    meta: "type"
  },
  {
    value: "Int",
    meta: "type"
  },
  {
    value: "Integer",
    meta: "type"
  },
  {
    value: "Flt",
    meta: "type"
  },
  {
    value: "Float",
    meta: "type"
  },
  {
    value: "Dbl",
    meta: "type"
  },
  {
    value: "Double",
    meta: "type"
  },
  {
    value: "Lng",
    meta: "type"
  },
  {
    value: "Long",
    meta: "type"
  },
  {
    value: "Str",
    meta: "type"
  },
  {
    value: "String",
    meta: "type"
  },
  {
    value: "Char",
    meta: "type"
  },
  {
    value: "Character",
    meta: "type"
  },
  {
    value: "Bool",
    meta: "type"
  },
  {
    value: "Boolean",
    meta: "type"
  },
  {
    value: "Obj",
    meta: "type"
  },
  {
    value: "Object",
    meta: "type"
  },
  {
    value: "Func",
    meta: "type"
  },
  {
    value: "Function",
    meta: "type"
  },
];

// --- 2. KEYWORD COMPLETER ---  
const keywordCompleter = {
  id: "lt-keyword-completion",
  getCompletions: function(editor, session, pos, prefix, callback) {
    // 1. Cek apakah file yang aktif adalah .lt  
    const filename = editorManager.activeFile?.name;
    if (!filename || !filename.endsWith(".lt")) {
      return; // Stop jika bukan file .lt  
    }

    // 2. Filter data berdasarkan 'prefix'  
    const completions = LT_COMPLETIONS_DATA
      // Filter yang cocok dengan prefix (cek di properti 'value')  
      .filter(item => item.value.startsWith(prefix))
      // Mapping ke format yang diminta Ace Completer  
      .map(item => ({
        caption: item.value, // Teks yang ditampilkan  
        meta: item.meta, // Label kustom (Keyword, Literal, Type, dll.)  
        value: item.value, // Teks yang akan disisipkan  
        score: 9000 // Prioritas tinggi  
      }));

    callback(null, completions);
  }
};
// ... (Sisa kode class AcodePlugin dan inisialisasi tetap sama)  

class AcodePlugin {
  async init($page, cacheFile, cacheFileUrl) {
    this.addModes();
    // Tambahkan keyword completer saat plugin init  
    if (editor) {
      editor.completers.push(keywordCompleter);
      editor.commands.addCommand({
        name: "continueDocComment",
        bindKey: {
          win: "Enter",
          mac: "Enter"
        },
        exec: function(editor) {
          const pos = editor.getCursorPosition();
          const line = editor.session.getLine(pos.row);
          const before = line.substring(0, pos.column);

          // Regex untuk start comment: /** lalu ENTER  
          const startsDocComment = /\/\*\*\s*$/.test(before);

          // Regex untuk baris di tengah: BARIS DIAWALI SPASI DAN BINTANG (misal: "  * teks")  
          const insideDocCommentLine = /^\s*\*/.test(line.trim());

          // Regex untuk kursor di posisi yang valid untuk lanjutin bintang (misal: "  * teks|")  
          // Mengecek kursor ada di akhir baris yang diawali bintang, TAPI bukan setelah "*/"  
          // Kita cek apakah kursor berada SETELAH TANDA BINTANG PERTAMA  
          const cursorAfterStar = /^\s*\*\s*(.*)$/.test(before);

          // Check untuk menghindari `insideDocComment` berjalan saat di `*/`  
          const isClosingLine = /^\s*\*\/$/.test(line.trim());

          // 1. kalau ngetik /** dan tekan Enter  
          if (startsDocComment) {
            const indent = line.match(/^\s*/)[0];
            const snippet = `\n${indent} * \n${indent} */`;
            editor.insert(snippet);
            // cursor balik ke tengah antara * dan */  
            editor.navigateUp(1);
            editor.navigateLineEnd();
            return;
          }

          // 2. kalau lagi di dalam /** ... */ dan kursor di tempat yang tepat  
          if (insideDocCommentLine && cursorAfterStar && !isClosingLine) {
            // Cek indentasi dari bintang sebelumnya  
            const match = line.match(/^(\s*\*)\s*/);
            if (match) {
              const starIndent = match[1]; // contoh: " * " atau "    *"  
              editor.insert(`\n${starIndent} `);
              return;
            }
          }

          // 3. default enter biasa  
          editor.insert("\n");
        }
      });
    }
  }

  addModes() {
    ace.require("ace/ext/modelist").modes.push({
      caption: "lightscript",
      extRe: /\.lt$/,
      extensions: "lt",
      mode: "ace/mode/lightscript",
      name: "ls"
    },
    {
      caption: "lightscript bytecode",
      extRe: /\.ltc$/,
      extensions: "ltc",
      mode: "ace/mode/lightscript_bytecode",
      name: "ltc"
    });

    define("ace/mode/lightscript_highlight_rules", [
      "require", "exports", "module",
      "ace/lib/oop",
      "ace/mode/text_highlight_rules"
    ], function(require, exports, module) {
      "use strict";
      const oop = require("../lib/oop");
      const {
        TextHighlightRules
      } = require("./text_highlight_rules");

      function LangHighlightRules() {
        this.$rules = {
          start: [{
              token: "comment.lt",
              regex: /(\/\/.*)$/ // ← ini single-line comment  
            },
            {
              token: "comment.block.start.lt",
              regex: /\/\*/,
              push: [{
                  token: "comment.block.lt",
                  regex: /\*\//,
                  next: "pop"
                },
                {
                  defaultToken: "comment.block.lt"
                }
              ]
            },
            {
              token: "comment.block.doc.lt",
              regex: /\/\*\*/,
              push: [{
                  token: "comment.block.doc.lt",
                  regex: /\*\//,
                  next: "pop"
                },
                // ✨ Highlight @tag kayak @param, @return, @throws, dll  
                {
                  token: "storage.type.annotation.lt",
                  regex: /@(?:param|return|throws|deprecated|see|example|todo)\b/
                },
                // ✨ Highlight tipe {string}  
                {
                  token: "storage.type.lt",
                  regex: /\{[a-zA-Z0-9_]+\}/
                },
                // ✨ Highlight nama parameter setelah @param  
                {
                  token: "string.qouted.single.lt",
                  regex: /\b[a-zA-Z_][a-zA-Z0-9_]*\b(?=\s|-)/
                },
                // sisanya tetep dianggap comment doc biasa  
                {
                  defaultToken: "comment.block.doc.lt"
                }
              ]
            },
            {
              token: "entity.name.function.lt",
              regex: /(?<=\bfun\s+)\b[a-zA-Z_][a-zA-Z0-9_]*\b/
            },
            {
              token: "keyword.control.switch.lt",
              regex: /\bswitch\b/,
              push: [
                {
                  token: "paren.lparen",
                  regex: /\{/,
                  next: "switch_block"
                },
                {
                  defaultToken: "text"
                }
              ]
            },
            {
              token: "paren.lparen",
              regex: /\{/,
              next: "block"
            },
            {
              token: "keyword.lt",
              regex: /\b(?:val|mut|fun|if|else|for|while|switch|case|default|break|continue|return|print|error|println|errorln|string|number|typeof|palakontoltelkomsel)\b/
            },
            {
              token: "constant.language.lt",
              regex: /\b(?:true|false|null|undefined)\b/
            },
            {
              token: "punctuation.separator.lt",
              regex: /:/
            },
            {
              token: "storage.type.variable.lt",
              regex: /(?<=:\s*)\b(?:Any|Anything|Num|Number|Int|Integer|Flt|Float|Dbl|Double|Lng|Long|Str|String|Char|Character|Bool|Boolean|Obj|Object|Func|Function|[A-Z][a-zA-Z0-9_]*)\b\??/
            },
            {
              token: "constant.numeric.lt",
              regex: /[+-]?\d+(?:\.\d+)?\b/
            },
            {
              token: "string.quoted.double.lt",
              regex: /"/,
              push: [
                {
                  token: "constant.character.escape.lt",
                  regex: /\\./
                },
                {
                  token: "variable.parameter.interpolation.lt",
                  regex: /\$[a-zA-Z_][a-zA-Z0-9_]*/
                },
                {
                  token: "punctuation.section.interpolation.lt",
                  regex: /\$\{/,
                  push: [
                    {
                      token: "punctuation.section.interpolation.lt",
                      regex: /\}/,
                      next: "pop"
                    },
                    {
                      include: "start"
                    }
                  ]
                },
                {
                  token: "string.quoted.double.lt",
                  regex: /"/,
                  next: "pop"
                },
                {
                  defaultToken: "string.quoted.double.lt"
                }
              ]
            },
            {
              token: "string.qouted.single.lt",
              regex: /'(?:[^'\\]|\\.)*'/
            },
            {
              token: "identifier.lt",
              regex: /\b[a-zA-Z_][a-zA-Z0-9_]*\b/
            },
            {
              token: "keyword.operator.lt",
              regex: /==?=?|!=?=?|\|\||&&|[+\-*/%<>]=?|\+\+|--/
            },
            {
              token: "punctuation.separator.lt",
              regex: /[:;,.]/
            },
            {
              token: "paren.lparen",
              regex: /[{(]/
            },
            {
              token: "paren.rparen",
              regex: /[)}]/
            }
          ]
        };
        this.$rules.switch_block = [
          {
            token: "keyword.control.case.lt",
            regex: /\bcase\b/,
            push: "case_block"
          },
          {
            token: "keyword.control.default.lt",
            regex: /\bdefault\b/,
            push: "case_block"
          },
          {
            token: "paren.rparen",
            regex: /\}/,
            next: "pop"
          },
          { defaultToken: "text" }
        ];
        
        this.$rules.case_block = [
          {
            token: "paren.rparen",
            regex: /(?=case|default|\})/,
            next: "pop"
          },
          { include: "start" }
        ];
        this.normalizeRules();
      }
      LangHighlightRules.metaData = {
        fileTypes: ["lt"],
        name: "lt"
      };
      oop.inherits(LangHighlightRules, TextHighlightRules);
      exports.LangHighlightRules = LangHighlightRules;
    });

    define("ace/mode/lightscript", [
      "require", "exports", "module",
      "ace/lib/oop",
      "ace/mode/text",
      "ace/mode/lightscript_highlight_rules"
    ], function(require, exports, module) {
      "use strict";
      const oop = require("../lib/oop");
      const {
        Mode: TextMode
      } = require("./text");
      const {
        LangHighlightRules
      } = require("./lightscript_highlight_rules");

      function LangMode() {
        this.HighlightRules = LangHighlightRules;
        this.$behaviour = this.$defaultBehaviour;
      };
      oop.inherits(LangMode, TextMode);
      LangMode.prototype.$id = "ace/mode/lightscript";
      exports.Mode = LangMode;
    });
    
    define("ace/mode/lightscript_bytecode_highlight_rules", [
      "require", "exports", "module",
      "ace/lib/oop",
      "ace/mode/text_highlight_rules"
    ], function(require, exports, module) {
      "use strict";
      const oop = require("../lib/oop");
      const {
        TextHighlightRules
      } = require("./text_highlight_rules");

      function LtcHighlightRules() {
        this.$rules = {
          start: [{
              token: "comment.lt",
              regex: /(\;\;.*)$/ // ← ini single-line comment  
            },
            {
              token: "keyword.lt",
              regex: /\b(?:push|val|set|get|add|sub|mul|div|mod|gt|lt|ge|le|eq|neq|and|or|print|println|error|errorln|if_false|jump|inc|dec|call|func|stop|return|access|string|number|concat|typeof)\b/
            },
            {
              token: "storage.type.variable.lt",
              regex: /(?<=(?:add|sub|mul|div|mod)\s*)\b(?:int|flt|lng|dbl|[A-Z][a-zA-Z0-9_]*)\b\??/
            },
            {
              token: "entity.name.function.lt",
              regex: /(?<=\b(?:func|call)\s+)\b[a-zA-Z_][a-zA-Z0-9_]*\b/
            },
            {
              token: "constant.numeric.lt",
              regex: /[+-]?\d+(?:\.\d+)?\b/
            }
          ]
        };
        this.normalizeRules();
      }
      LtcHighlightRules.metaData = {
        fileTypes: ["ltc"],
        name: "ltc"
      };
      oop.inherits(LtcHighlightRules, TextHighlightRules);
      exports.LtcHighlightRules = LtcHighlightRules;
    });

    define("ace/mode/lightscript_bytecode", [
      "require", "exports", "module",
      "ace/lib/oop",
      "ace/mode/text",
      "ace/mode/lightscript_bytecode_highlight_rules"
    ], function(require, exports, module) {
      "use strict";
      const oop = require("../lib/oop");
      const {
        Mode: TextMode
      } = require("./text");
      const {
        LtcHighlightRules
      } = require("./lightscript_bytecode_highlight_rules");

      function LtcMode() {
        this.HighlightRules = LtcHighlightRules;
        this.$behaviour = this.$defaultBehaviour;
      };
      oop.inherits(LtcMode, TextMode);
      LtcMode.prototype.$id = "ace/mode/lightscript_bytecode";
      exports.Mode = LtcMode;
    });
  }

  async destroy() {
    const editor = editorManager?.editor;
    if (!editor) return;
  
    // 🧹 1️⃣ Hapus keyword completer custom
    if (editor.completers && editor.completers.length) {
      editor.completers = editor.completers.filter(c => c.id !== "lt-keyword-completion");
    }
  
    // 🧹 2️⃣ Hapus command custom 'smartEnter'
    if (editor.commands.byName["smartEnter"]) {
      editor.commands.removeCommand("smartEnter");
    }
  
    // 🧹 3️⃣ (Opsional) Hapus mode LightScript dari modelist
    const modelist = ace.require("ace/ext/modelist");
    if (modelist && Array.isArray(modelist.modes)) {
      modelist.modes = modelist.modes.filter(
        m => !["lightscript", "ltc"].includes(m.caption)
      );
    }
  
    // 🧹 4️⃣ (Opsional) Hapus module yang udah di-define buat hemat memori
    [
      "ace/mode/lightscript_highlight_rules",
      "ace/mode/lightscript",
      "ace/mode/lightscript_bytecode_highlight_rules",
      "ace/mode/lightscript_bytecode"
    ].forEach(name => {
      if (ace.define.modules[name]) {
        delete ace.define.modules[name];
      }
    });
  
    console.log("[LightScript] Plugin unmounted, resources cleaned up!");
  }
}

if (window.acode) {
  const acodePlugin = new AcodePlugin();
  const pluginId = "soteen.lightscript.plugin";
  acode.setPluginInit(pluginId, async (baseUrl, $page, {
    cacheFileUrl,
    cacheFile
  }) => {
    if (!baseUrl.endsWith('/')) {
      baseUrl += '/';
    }
    acodePlugin.baseUrl = baseUrl;
    await acodePlugin.init($page, cacheFile, cacheFileUrl);
  });
  acode.setPluginUnmount(pluginId, async () => {
    await acodePlugin.destroy();
  });
}