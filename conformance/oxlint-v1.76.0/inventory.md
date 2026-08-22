# Oxlint v1.76.0 conformance inventory

- Upstream commit: `65fe65d8429e1d1bdf86c517ff08bd119ee87660`
- Production WASM SHA-256: `8893c7e1a230eea648ca646a578afbd62c1712f9f8d36a4ab2e8589c73b6a5bb`
- Upstream test WASM SHA-256: `539b20fbda7d699c23c690c2b3dc71d0044e2511bb741d6dd54aaccab2ae0d91`
- Upstream test-list SHA-256: `ae8c65ec307f7238db49d593f1abc17b17ea0398732c7bf8498e58328537bf74`
- Rules: 847
- Certified rules: 96
- Upstream library tests: 1175
- Certified rule tests: 147
- Rule snapshots: 825
- CLI fixture entries: 306
- CLI snapshots: 186
## Rule ledger

| Rule | Category | Backend | Classification | Reason |
| --- | --- | --- | --- | --- |
| eslint/accessor-pairs | pedantic | oxc-wasm | non-applicable | rule-outside-v1-set |
| eslint/array-callback-return | pedantic | oxc-wasm | non-applicable | rule-outside-v1-set |
| eslint/arrow-body-style | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| eslint/block-scoped-var | suspicious | oxc-wasm | non-applicable | rule-outside-v1-set |
| eslint/capitalized-comments | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| eslint/class-methods-use-this | restriction | oxc-wasm | non-applicable | rule-outside-v1-set |
| eslint/complexity | restriction | oxc-wasm | non-applicable | rule-outside-v1-set |
| eslint/constructor-super | correctness | oxc-wasm | enabled | certified-v1 |
| eslint/curly | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| eslint/default-case | restriction | oxc-wasm | non-applicable | rule-outside-v1-set |
| eslint/default-case-last | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| eslint/default-param-last | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| eslint/eqeqeq | pedantic | oxc-wasm | non-applicable | rule-outside-v1-set |
| eslint/for-direction | correctness | oxc-wasm | enabled | certified-v1 |
| eslint/func-name-matching | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| eslint/func-names | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| eslint/func-style | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| eslint/getter-return | correctness | oxc-wasm | enabled | certified-v1 |
| eslint/grouped-accessor-pairs | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| eslint/guard-for-in | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| eslint/id-denylist | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| eslint/id-length | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| eslint/id-match | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| eslint/init-declarations | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| eslint/logical-assignment-operators | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| eslint/max-classes-per-file | pedantic | oxc-wasm | non-applicable | rule-outside-v1-set |
| eslint/max-depth | pedantic | oxc-wasm | non-applicable | rule-outside-v1-set |
| eslint/max-lines | pedantic | oxc-wasm | non-applicable | rule-outside-v1-set |
| eslint/max-lines-per-function | pedantic | oxc-wasm | non-applicable | rule-outside-v1-set |
| eslint/max-nested-callbacks | pedantic | oxc-wasm | non-applicable | rule-outside-v1-set |
| eslint/max-params | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| eslint/max-statements | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| eslint/new-cap | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| eslint/no-alert | restriction | oxc-wasm | non-applicable | rule-outside-v1-set |
| eslint/no-array-constructor | pedantic | oxc-wasm | non-applicable | rule-outside-v1-set |
| eslint/no-async-promise-executor | correctness | oxc-wasm | enabled | certified-v1 |
| eslint/no-await-in-loop | perf | oxc-wasm | non-applicable | rule-outside-v1-set |
| eslint/no-bitwise | restriction | oxc-wasm | non-applicable | rule-outside-v1-set |
| eslint/no-caller | correctness | oxc-wasm | enabled | certified-v1 |
| eslint/no-case-declarations | pedantic | oxc-wasm | non-applicable | rule-outside-v1-set |
| eslint/no-class-assign | correctness | oxc-wasm | enabled | certified-v1 |
| eslint/no-compare-neg-zero | correctness | oxc-wasm | enabled | certified-v1 |
| eslint/no-cond-assign | correctness | oxc-wasm | enabled | certified-v1 |
| eslint/no-console | restriction | oxc-wasm | non-applicable | rule-outside-v1-set |
| eslint/no-const-assign | correctness | oxc-wasm | enabled | certified-v1 |
| eslint/no-constant-binary-expression | correctness | oxc-wasm | enabled | certified-v1 |
| eslint/no-constant-condition | correctness | oxc-wasm | enabled | certified-v1 |
| eslint/no-constructor-return | pedantic | oxc-wasm | non-applicable | rule-outside-v1-set |
| eslint/no-continue | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| eslint/no-control-regex | correctness | oxc-wasm | enabled | certified-v1 |
| eslint/no-debugger | correctness | oxc-wasm | enabled | certified-v1 |
| eslint/no-delete-var | correctness | oxc-wasm | enabled | certified-v1 |
| eslint/no-div-regex | restriction | oxc-wasm | non-applicable | rule-outside-v1-set |
| eslint/no-dupe-class-members | correctness | oxc-wasm | enabled | certified-v1 |
| eslint/no-dupe-else-if | correctness | oxc-wasm | enabled | certified-v1 |
| eslint/no-dupe-keys | correctness | oxc-wasm | enabled | certified-v1 |
| eslint/no-duplicate-case | correctness | oxc-wasm | enabled | certified-v1 |
| eslint/no-duplicate-imports | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| eslint/no-else-return | pedantic | oxc-wasm | non-applicable | rule-outside-v1-set |
| eslint/no-empty | restriction | oxc-wasm | non-applicable | rule-outside-v1-set |
| eslint/no-empty-character-class | correctness | oxc-wasm | enabled | certified-v1 |
| eslint/no-empty-function | restriction | oxc-wasm | non-applicable | rule-outside-v1-set |
| eslint/no-empty-pattern | correctness | oxc-wasm | enabled | certified-v1 |
| eslint/no-empty-static-block | correctness | oxc-wasm | enabled | certified-v1 |
| eslint/no-eq-null | restriction | oxc-wasm | non-applicable | rule-outside-v1-set |
| eslint/no-eval | correctness | oxc-wasm | enabled | certified-v1 |
| eslint/no-ex-assign | correctness | oxc-wasm | enabled | certified-v1 |
| eslint/no-extend-native | suspicious | oxc-wasm | non-applicable | rule-outside-v1-set |
| eslint/no-extra-bind | suspicious | oxc-wasm | non-applicable | rule-outside-v1-set |
| eslint/no-extra-boolean-cast | correctness | oxc-wasm | enabled | certified-v1 |
| eslint/no-extra-label | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| eslint/no-fallthrough | pedantic | oxc-wasm | non-applicable | rule-outside-v1-set |
| eslint/no-func-assign | correctness | oxc-wasm | enabled | certified-v1 |
| eslint/no-global-assign | correctness | oxc-wasm | enabled | certified-v1 |
| eslint/no-implicit-coercion | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| eslint/no-implicit-globals | restriction | oxc-wasm | non-applicable | rule-outside-v1-set |
| eslint/no-implied-eval | suspicious | oxc-wasm | non-applicable | rule-outside-v1-set |
| eslint/no-import-assign | correctness | oxc-wasm | enabled | certified-v1 |
| eslint/no-inline-comments | pedantic | oxc-wasm | non-applicable | rule-outside-v1-set |
| eslint/no-inner-declarations | pedantic | oxc-wasm | non-applicable | rule-outside-v1-set |
| eslint/no-invalid-regexp | correctness | oxc-wasm | enabled | certified-v1 |
| eslint/no-irregular-whitespace | correctness | oxc-wasm | enabled | certified-v1 |
| eslint/no-iterator | correctness | oxc-wasm | enabled | certified-v1 |
| eslint/no-label-var | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| eslint/no-labels | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| eslint/no-lone-blocks | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| eslint/no-lonely-if | pedantic | oxc-wasm | non-applicable | rule-outside-v1-set |
| eslint/no-loop-func | pedantic | oxc-wasm | non-applicable | rule-outside-v1-set |
| eslint/no-loss-of-precision | correctness | oxc-wasm | enabled | certified-v1 |
| eslint/no-magic-numbers | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| eslint/no-misleading-character-class | correctness | oxc-wasm | enabled | certified-v1 |
| eslint/no-multi-assign | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| eslint/no-multi-str | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| eslint/no-negated-condition | pedantic | oxc-wasm | non-applicable | rule-outside-v1-set |
| eslint/no-nested-ternary | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| eslint/no-new | suspicious | oxc-wasm | non-applicable | rule-outside-v1-set |
| eslint/no-new-func | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| eslint/no-new-native-nonconstructor | correctness | oxc-wasm | enabled | certified-v1 |
| eslint/no-new-wrappers | pedantic | oxc-wasm | non-applicable | rule-outside-v1-set |
| eslint/no-nonoctal-decimal-escape | correctness | oxc-wasm | enabled | certified-v1 |
| eslint/no-obj-calls | correctness | oxc-wasm | enabled | certified-v1 |
| eslint/no-object-constructor | pedantic | oxc-wasm | non-applicable | rule-outside-v1-set |
| eslint/no-param-reassign | restriction | oxc-wasm | non-applicable | rule-outside-v1-set |
| eslint/no-plusplus | restriction | oxc-wasm | non-applicable | rule-outside-v1-set |
| eslint/no-promise-executor-return | pedantic | oxc-wasm | non-applicable | rule-outside-v1-set |
| eslint/no-proto | restriction | oxc-wasm | non-applicable | rule-outside-v1-set |
| eslint/no-prototype-builtins | pedantic | oxc-wasm | non-applicable | rule-outside-v1-set |
| eslint/no-redeclare | pedantic | oxc-wasm | non-applicable | rule-outside-v1-set |
| eslint/no-regex-spaces | restriction | oxc-wasm | non-applicable | rule-outside-v1-set |
| eslint/no-restricted-exports | nursery | oxc-wasm | non-applicable | rule-outside-v1-set |
| eslint/no-restricted-globals | restriction | oxc-wasm | non-applicable | rule-outside-v1-set |
| eslint/no-restricted-imports | restriction | oxc-wasm | non-applicable | rule-outside-v1-set |
| eslint/no-restricted-properties | restriction | oxc-wasm | non-applicable | rule-outside-v1-set |
| eslint/no-return-assign | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| eslint/no-script-url | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| eslint/no-self-assign | correctness | oxc-wasm | enabled | certified-v1 |
| eslint/no-self-compare | pedantic | oxc-wasm | non-applicable | rule-outside-v1-set |
| eslint/no-sequences | restriction | oxc-wasm | non-applicable | rule-outside-v1-set |
| eslint/no-setter-return | correctness | oxc-wasm | enabled | certified-v1 |
| eslint/no-shadow | suspicious | oxc-wasm | non-applicable | rule-outside-v1-set |
| eslint/no-shadow-restricted-names | correctness | oxc-wasm | enabled | certified-v1 |
| eslint/no-sparse-arrays | correctness | oxc-wasm | enabled | certified-v1 |
| eslint/no-template-curly-in-string | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| eslint/no-ternary | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| eslint/no-this-before-super | correctness | oxc-wasm | enabled | certified-v1 |
| eslint/no-throw-literal | pedantic | oxc-wasm | non-applicable | rule-outside-v1-set |
| eslint/no-unassigned-vars | correctness | oxc-wasm | enabled | certified-v1 |
| eslint/no-undef | nursery | oxc-wasm | non-applicable | rule-outside-v1-set |
| eslint/no-undefined | restriction | oxc-wasm | non-applicable | rule-outside-v1-set |
| eslint/no-underscore-dangle | suspicious | oxc-wasm | non-applicable | rule-outside-v1-set |
| eslint/no-unexpected-multiline | suspicious | oxc-wasm | non-applicable | rule-outside-v1-set |
| eslint/no-unmodified-loop-condition | suspicious | oxc-wasm | non-applicable | rule-outside-v1-set |
| eslint/no-unneeded-ternary | suspicious | oxc-wasm | non-applicable | rule-outside-v1-set |
| eslint/no-unreachable | correctness | oxc-wasm | enabled | certified-v1 |
| eslint/no-unreachable-loop | nursery | oxc-wasm | non-applicable | rule-outside-v1-set |
| eslint/no-unsafe-finally | correctness | oxc-wasm | enabled | certified-v1 |
| eslint/no-unsafe-negation | correctness | oxc-wasm | enabled | certified-v1 |
| eslint/no-unsafe-optional-chaining | correctness | oxc-wasm | enabled | certified-v1 |
| eslint/no-unused-expressions | correctness | oxc-wasm | enabled | certified-v1 |
| eslint/no-unused-labels | correctness | oxc-wasm | enabled | certified-v1 |
| eslint/no-unused-private-class-members | correctness | oxc-wasm | enabled | certified-v1 |
| eslint/no-unused-vars | correctness | oxc-wasm | enabled | certified-v1 |
| eslint/no-use-before-define | restriction | oxc-wasm | non-applicable | rule-outside-v1-set |
| eslint/no-useless-assignment | nursery | oxc-wasm | non-applicable | rule-outside-v1-set |
| eslint/no-useless-backreference | correctness | oxc-wasm | enabled | certified-v1 |
| eslint/no-useless-call | perf | oxc-wasm | non-applicable | rule-outside-v1-set |
| eslint/no-useless-catch | correctness | oxc-wasm | enabled | certified-v1 |
| eslint/no-useless-computed-key | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| eslint/no-useless-concat | suspicious | oxc-wasm | non-applicable | rule-outside-v1-set |
| eslint/no-useless-constructor | suspicious | oxc-wasm | non-applicable | rule-outside-v1-set |
| eslint/no-useless-escape | correctness | oxc-wasm | enabled | certified-v1 |
| eslint/no-useless-rename | correctness | oxc-wasm | enabled | certified-v1 |
| eslint/no-useless-return | pedantic | oxc-wasm | non-applicable | rule-outside-v1-set |
| eslint/no-var | restriction | oxc-wasm | non-applicable | rule-outside-v1-set |
| eslint/no-void | restriction | oxc-wasm | non-applicable | rule-outside-v1-set |
| eslint/no-warning-comments | pedantic | oxc-wasm | non-applicable | rule-outside-v1-set |
| eslint/no-with | correctness | oxc-wasm | enabled | certified-v1 |
| eslint/object-shorthand | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| eslint/operator-assignment | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| eslint/prefer-arrow-callback | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| eslint/prefer-const | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| eslint/prefer-destructuring | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| eslint/prefer-exponentiation-operator | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| eslint/prefer-named-capture-group | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| eslint/prefer-numeric-literals | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| eslint/prefer-object-has-own | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| eslint/prefer-object-spread | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| eslint/prefer-promise-reject-errors | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| eslint/prefer-regex-literals | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| eslint/prefer-rest-params | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| eslint/prefer-spread | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| eslint/prefer-template | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| eslint/preserve-caught-error | suspicious | oxc-wasm | non-applicable | rule-outside-v1-set |
| eslint/radix | pedantic | oxc-wasm | non-applicable | rule-outside-v1-set |
| eslint/require-await | pedantic | oxc-wasm | non-applicable | rule-outside-v1-set |
| eslint/require-unicode-regexp | pedantic | oxc-wasm | non-applicable | rule-outside-v1-set |
| eslint/require-yield | correctness | oxc-wasm | enabled | certified-v1 |
| eslint/sort-imports | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| eslint/sort-keys | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| eslint/sort-vars | pedantic | oxc-wasm | non-applicable | rule-outside-v1-set |
| eslint/symbol-description | pedantic | oxc-wasm | non-applicable | rule-outside-v1-set |
| eslint/unicode-bom | restriction | oxc-wasm | non-applicable | rule-outside-v1-set |
| eslint/use-isnan | correctness | oxc-wasm | enabled | certified-v1 |
| eslint/valid-typeof | correctness | oxc-wasm | enabled | certified-v1 |
| eslint/vars-on-top | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| eslint/yoda | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| import/consistent-type-specifier-style | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| import/default | correctness | oxc-wasm | non-applicable | rule-outside-v1-set |
| import/export | nursery | oxc-wasm | non-applicable | rule-outside-v1-set |
| import/exports-last | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| import/extensions | restriction | oxc-wasm | non-applicable | rule-outside-v1-set |
| import/first | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| import/group-exports | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| import/max-dependencies | pedantic | oxc-wasm | non-applicable | rule-outside-v1-set |
| import/named | nursery | oxc-wasm | non-applicable | rule-outside-v1-set |
| import/namespace | correctness | oxc-wasm | non-applicable | rule-outside-v1-set |
| import/newline-after-import | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| import/no-absolute-path | suspicious | oxc-wasm | non-applicable | rule-outside-v1-set |
| import/no-amd | restriction | oxc-wasm | non-applicable | rule-outside-v1-set |
| import/no-anonymous-default-export | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| import/no-commonjs | restriction | oxc-wasm | non-applicable | rule-outside-v1-set |
| import/no-cycle | restriction | oxc-wasm | non-applicable | rule-outside-v1-set |
| import/no-default-export | restriction | oxc-wasm | non-applicable | rule-outside-v1-set |
| import/no-duplicates | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| import/no-dynamic-require | restriction | oxc-wasm | non-applicable | rule-outside-v1-set |
| import/no-empty-named-blocks | suspicious | oxc-wasm | non-applicable | rule-outside-v1-set |
| import/no-mutable-exports | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| import/no-named-as-default | suspicious | oxc-wasm | non-applicable | rule-outside-v1-set |
| import/no-named-as-default-member | suspicious | oxc-wasm | non-applicable | rule-outside-v1-set |
| import/no-named-default | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| import/no-named-export | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| import/no-namespace | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| import/no-nodejs-modules | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| import/no-relative-parent-imports | restriction | oxc-wasm | non-applicable | rule-outside-v1-set |
| import/no-self-import | suspicious | oxc-wasm | non-applicable | rule-outside-v1-set |
| import/no-unassigned-import | suspicious | oxc-wasm | non-applicable | rule-outside-v1-set |
| import/no-webpack-loader-syntax | restriction | oxc-wasm | non-applicable | rule-outside-v1-set |
| import/prefer-default-export | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| import/unambiguous | restriction | oxc-wasm | non-applicable | rule-outside-v1-set |
| jest/consistent-test-it | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| jest/expect-expect | correctness | oxc-wasm | non-applicable | rule-outside-v1-set |
| jest/max-expects | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| jest/max-nested-describe | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| jest/no-alias-methods | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| jest/no-commented-out-tests | suspicious | oxc-wasm | non-applicable | rule-outside-v1-set |
| jest/no-conditional-expect | correctness | oxc-wasm | non-applicable | rule-outside-v1-set |
| jest/no-conditional-in-test | pedantic | oxc-wasm | non-applicable | rule-outside-v1-set |
| jest/no-confusing-set-timeout | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| jest/no-deprecated-functions | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| jest/no-disabled-tests | correctness | oxc-wasm | non-applicable | rule-outside-v1-set |
| jest/no-done-callback | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| jest/no-duplicate-hooks | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| jest/no-export | correctness | oxc-wasm | non-applicable | rule-outside-v1-set |
| jest/no-focused-tests | correctness | oxc-wasm | non-applicable | rule-outside-v1-set |
| jest/no-hooks | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| jest/no-identical-title | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| jest/no-interpolation-in-snapshots | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| jest/no-jasmine-globals | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| jest/no-large-snapshots | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| jest/no-mocks-import | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| jest/no-restricted-jest-methods | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| jest/no-restricted-matchers | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| jest/no-standalone-expect | correctness | oxc-wasm | non-applicable | rule-outside-v1-set |
| jest/no-test-prefixes | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| jest/no-test-return-statement | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| jest/no-unneeded-async-expect-function | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| jest/no-untyped-mock-factory | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| jest/padding-around-after-all-blocks | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| jest/padding-around-test-blocks | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| jest/prefer-called-with | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| jest/prefer-comparison-matcher | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| jest/prefer-each | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| jest/prefer-ending-with-an-expect | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| jest/prefer-equality-matcher | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| jest/prefer-expect-assertions | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| jest/prefer-expect-resolves | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| jest/prefer-hooks-in-order | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| jest/prefer-hooks-on-top | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| jest/prefer-importing-jest-globals | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| jest/prefer-jest-mocked | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| jest/prefer-lowercase-title | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| jest/prefer-mock-promise-shorthand | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| jest/prefer-mock-return-shorthand | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| jest/prefer-snapshot-hint | correctness | oxc-wasm | non-applicable | rule-outside-v1-set |
| jest/prefer-spy-on | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| jest/prefer-strict-equal | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| jest/prefer-to-be | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| jest/prefer-to-contain | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| jest/prefer-to-have-been-called | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| jest/prefer-to-have-been-called-times | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| jest/prefer-to-have-length | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| jest/prefer-todo | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| jest/require-hook | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| jest/require-to-throw-message | correctness | oxc-wasm | non-applicable | rule-outside-v1-set |
| jest/require-top-level-describe | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| jest/valid-describe-callback | correctness | oxc-wasm | non-applicable | rule-outside-v1-set |
| jest/valid-expect | correctness | oxc-wasm | non-applicable | rule-outside-v1-set |
| jest/valid-expect-in-promise | correctness | oxc-wasm | non-applicable | rule-outside-v1-set |
| jest/valid-title | correctness | oxc-wasm | non-applicable | rule-outside-v1-set |
| jsdoc/check-access | restriction | oxc-wasm | non-applicable | rule-outside-v1-set |
| jsdoc/check-property-names | correctness | oxc-wasm | non-applicable | rule-outside-v1-set |
| jsdoc/check-tag-names | correctness | oxc-wasm | non-applicable | rule-outside-v1-set |
| jsdoc/empty-tags | restriction | oxc-wasm | non-applicable | rule-outside-v1-set |
| jsdoc/implements-on-classes | correctness | oxc-wasm | non-applicable | rule-outside-v1-set |
| jsdoc/no-defaults | correctness | oxc-wasm | non-applicable | rule-outside-v1-set |
| jsdoc/require-param | pedantic | oxc-wasm | non-applicable | rule-outside-v1-set |
| jsdoc/require-param-description | pedantic | oxc-wasm | non-applicable | rule-outside-v1-set |
| jsdoc/require-param-name | pedantic | oxc-wasm | non-applicable | rule-outside-v1-set |
| jsdoc/require-param-type | pedantic | oxc-wasm | non-applicable | rule-outside-v1-set |
| jsdoc/require-property | correctness | oxc-wasm | non-applicable | rule-outside-v1-set |
| jsdoc/require-property-description | correctness | oxc-wasm | non-applicable | rule-outside-v1-set |
| jsdoc/require-property-name | correctness | oxc-wasm | non-applicable | rule-outside-v1-set |
| jsdoc/require-property-type | correctness | oxc-wasm | non-applicable | rule-outside-v1-set |
| jsdoc/require-returns | pedantic | oxc-wasm | non-applicable | rule-outside-v1-set |
| jsdoc/require-returns-description | pedantic | oxc-wasm | non-applicable | rule-outside-v1-set |
| jsdoc/require-returns-type | pedantic | oxc-wasm | non-applicable | rule-outside-v1-set |
| jsdoc/require-throws-description | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| jsdoc/require-throws-type | pedantic | oxc-wasm | non-applicable | rule-outside-v1-set |
| jsdoc/require-yields | correctness | oxc-wasm | non-applicable | rule-outside-v1-set |
| jsdoc/require-yields-description | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| jsdoc/require-yields-type | pedantic | oxc-wasm | non-applicable | rule-outside-v1-set |
| jsx_a11y/alt-text | correctness | oxc-wasm | non-applicable | rule-outside-v1-set |
| jsx_a11y/anchor-ambiguous-text | restriction | oxc-wasm | non-applicable | rule-outside-v1-set |
| jsx_a11y/anchor-has-content | correctness | oxc-wasm | non-applicable | rule-outside-v1-set |
| jsx_a11y/anchor-is-valid | correctness | oxc-wasm | non-applicable | rule-outside-v1-set |
| jsx_a11y/aria-activedescendant-has-tabindex | correctness | oxc-wasm | non-applicable | rule-outside-v1-set |
| jsx_a11y/aria-props | correctness | oxc-wasm | non-applicable | rule-outside-v1-set |
| jsx_a11y/aria-proptypes | correctness | oxc-wasm | non-applicable | rule-outside-v1-set |
| jsx_a11y/aria-role | correctness | oxc-wasm | non-applicable | rule-outside-v1-set |
| jsx_a11y/aria-unsupported-elements | correctness | oxc-wasm | non-applicable | rule-outside-v1-set |
| jsx_a11y/autocomplete-valid | correctness | oxc-wasm | non-applicable | rule-outside-v1-set |
| jsx_a11y/click-events-have-key-events | correctness | oxc-wasm | non-applicable | rule-outside-v1-set |
| jsx_a11y/control-has-associated-label | correctness | oxc-wasm | non-applicable | rule-outside-v1-set |
| jsx_a11y/heading-has-content | correctness | oxc-wasm | non-applicable | rule-outside-v1-set |
| jsx_a11y/html-has-lang | correctness | oxc-wasm | non-applicable | rule-outside-v1-set |
| jsx_a11y/iframe-has-title | correctness | oxc-wasm | non-applicable | rule-outside-v1-set |
| jsx_a11y/img-redundant-alt | correctness | oxc-wasm | non-applicable | rule-outside-v1-set |
| jsx_a11y/interactive-supports-focus | correctness | oxc-wasm | non-applicable | rule-outside-v1-set |
| jsx_a11y/label-has-associated-control | correctness | oxc-wasm | non-applicable | rule-outside-v1-set |
| jsx_a11y/lang | correctness | oxc-wasm | non-applicable | rule-outside-v1-set |
| jsx_a11y/media-has-caption | correctness | oxc-wasm | non-applicable | rule-outside-v1-set |
| jsx_a11y/mouse-events-have-key-events | correctness | oxc-wasm | non-applicable | rule-outside-v1-set |
| jsx_a11y/no-access-key | correctness | oxc-wasm | non-applicable | rule-outside-v1-set |
| jsx_a11y/no-aria-hidden-on-focusable | correctness | oxc-wasm | non-applicable | rule-outside-v1-set |
| jsx_a11y/no-autofocus | correctness | oxc-wasm | non-applicable | rule-outside-v1-set |
| jsx_a11y/no-distracting-elements | correctness | oxc-wasm | non-applicable | rule-outside-v1-set |
| jsx_a11y/no-interactive-element-to-noninteractive-role | correctness | oxc-wasm | non-applicable | rule-outside-v1-set |
| jsx_a11y/no-noninteractive-element-interactions | correctness | oxc-wasm | non-applicable | rule-outside-v1-set |
| jsx_a11y/no-noninteractive-element-to-interactive-role | correctness | oxc-wasm | non-applicable | rule-outside-v1-set |
| jsx_a11y/no-noninteractive-tabindex | correctness | oxc-wasm | non-applicable | rule-outside-v1-set |
| jsx_a11y/no-redundant-roles | correctness | oxc-wasm | non-applicable | rule-outside-v1-set |
| jsx_a11y/no-static-element-interactions | correctness | oxc-wasm | non-applicable | rule-outside-v1-set |
| jsx_a11y/prefer-tag-over-role | correctness | oxc-wasm | non-applicable | rule-outside-v1-set |
| jsx_a11y/role-has-required-aria-props | correctness | oxc-wasm | non-applicable | rule-outside-v1-set |
| jsx_a11y/role-supports-aria-props | correctness | oxc-wasm | non-applicable | rule-outside-v1-set |
| jsx_a11y/scope | correctness | oxc-wasm | non-applicable | rule-outside-v1-set |
| jsx_a11y/tabindex-no-positive | correctness | oxc-wasm | non-applicable | rule-outside-v1-set |
| nextjs/google-font-display | correctness | oxc-wasm | non-applicable | rule-outside-v1-set |
| nextjs/google-font-preconnect | correctness | oxc-wasm | non-applicable | rule-outside-v1-set |
| nextjs/inline-script-id | correctness | oxc-wasm | non-applicable | rule-outside-v1-set |
| nextjs/next-script-for-ga | correctness | oxc-wasm | non-applicable | rule-outside-v1-set |
| nextjs/no-assign-module-variable | correctness | oxc-wasm | non-applicable | rule-outside-v1-set |
| nextjs/no-async-client-component | correctness | oxc-wasm | non-applicable | rule-outside-v1-set |
| nextjs/no-before-interactive-script-outside-document | correctness | oxc-wasm | non-applicable | rule-outside-v1-set |
| nextjs/no-css-tags | correctness | oxc-wasm | non-applicable | rule-outside-v1-set |
| nextjs/no-document-import-in-page | correctness | oxc-wasm | non-applicable | rule-outside-v1-set |
| nextjs/no-duplicate-head | correctness | oxc-wasm | non-applicable | rule-outside-v1-set |
| nextjs/no-head-element | correctness | oxc-wasm | non-applicable | rule-outside-v1-set |
| nextjs/no-head-import-in-document | correctness | oxc-wasm | non-applicable | rule-outside-v1-set |
| nextjs/no-html-link-for-pages | correctness | oxc-wasm | non-applicable | rule-outside-v1-set |
| nextjs/no-img-element | correctness | oxc-wasm | non-applicable | rule-outside-v1-set |
| nextjs/no-page-custom-font | correctness | oxc-wasm | non-applicable | rule-outside-v1-set |
| nextjs/no-script-component-in-head | correctness | oxc-wasm | non-applicable | rule-outside-v1-set |
| nextjs/no-styled-jsx-in-document | correctness | oxc-wasm | non-applicable | rule-outside-v1-set |
| nextjs/no-sync-scripts | correctness | oxc-wasm | non-applicable | rule-outside-v1-set |
| nextjs/no-title-in-document-head | correctness | oxc-wasm | non-applicable | rule-outside-v1-set |
| nextjs/no-typos | correctness | oxc-wasm | non-applicable | rule-outside-v1-set |
| nextjs/no-unwanted-polyfillio | correctness | oxc-wasm | non-applicable | rule-outside-v1-set |
| node/callback-return | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| node/exports-style | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| node/global-require | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| node/handle-callback-err | restriction | oxc-wasm | non-applicable | rule-outside-v1-set |
| node/no-exports-assign | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| node/no-mixed-requires | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| node/no-new-require | restriction | oxc-wasm | non-applicable | rule-outside-v1-set |
| node/no-path-concat | restriction | oxc-wasm | non-applicable | rule-outside-v1-set |
| node/no-process-env | restriction | oxc-wasm | non-applicable | rule-outside-v1-set |
| node/no-sync | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| node/no-top-level-await | restriction | oxc-wasm | non-applicable | rule-outside-v1-set |
| oxc/approx-constant | suspicious | oxc-wasm | non-applicable | rule-outside-v1-set |
| oxc/bad-array-method-on-arguments | correctness | oxc-wasm | enabled | certified-v1 |
| oxc/bad-bitwise-operator | restriction | oxc-wasm | non-applicable | rule-outside-v1-set |
| oxc/bad-char-at-comparison | correctness | oxc-wasm | enabled | certified-v1 |
| oxc/bad-comparison-sequence | correctness | oxc-wasm | enabled | certified-v1 |
| oxc/bad-match-all-arg | correctness | oxc-wasm | enabled | certified-v1 |
| oxc/bad-min-max-func | correctness | oxc-wasm | enabled | certified-v1 |
| oxc/bad-object-literal-comparison | correctness | oxc-wasm | enabled | certified-v1 |
| oxc/bad-replace-all-arg | correctness | oxc-wasm | enabled | certified-v1 |
| oxc/branches-sharing-code | pedantic | oxc-wasm | non-applicable | rule-outside-v1-set |
| oxc/const-comparisons | correctness | oxc-wasm | enabled | certified-v1 |
| oxc/double-comparisons | correctness | oxc-wasm | enabled | certified-v1 |
| oxc/erasing-op | correctness | oxc-wasm | enabled | certified-v1 |
| oxc/misrefactored-assign-op | suspicious | oxc-wasm | non-applicable | rule-outside-v1-set |
| oxc/missing-throw | correctness | oxc-wasm | enabled | certified-v1 |
| oxc/no-accumulating-spread | perf | oxc-wasm | non-applicable | rule-outside-v1-set |
| oxc/no-async-await | restriction | oxc-wasm | non-applicable | rule-outside-v1-set |
| oxc/no-async-endpoint-handlers | suspicious | oxc-wasm | non-applicable | rule-outside-v1-set |
| oxc/no-barrel-file | restriction | oxc-wasm | non-applicable | rule-outside-v1-set |
| oxc/no-const-enum | restriction | oxc-wasm | non-applicable | rule-outside-v1-set |
| oxc/no-map-spread | perf | oxc-wasm | non-applicable | rule-outside-v1-set |
| oxc/no-optional-chaining | restriction | oxc-wasm | non-applicable | rule-outside-v1-set |
| oxc/no-rest-spread-properties | restriction | oxc-wasm | non-applicable | rule-outside-v1-set |
| oxc/no-this-in-exported-function | suspicious | oxc-wasm | non-applicable | rule-outside-v1-set |
| oxc/number-arg-out-of-range | correctness | oxc-wasm | enabled | certified-v1 |
| oxc/only-used-in-recursion | correctness | oxc-wasm | enabled | certified-v1 |
| oxc/uninvoked-array-callback | correctness | oxc-wasm | enabled | certified-v1 |
| promise/always-return | suspicious | oxc-wasm | non-applicable | rule-outside-v1-set |
| promise/avoid-new | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| promise/catch-or-return | restriction | oxc-wasm | non-applicable | rule-outside-v1-set |
| promise/no-callback-in-promise | correctness | oxc-wasm | non-applicable | rule-outside-v1-set |
| promise/no-multiple-resolved | suspicious | oxc-wasm | non-applicable | rule-outside-v1-set |
| promise/no-nesting | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| promise/no-new-statics | correctness | oxc-wasm | non-applicable | rule-outside-v1-set |
| promise/no-promise-in-callback | suspicious | oxc-wasm | non-applicable | rule-outside-v1-set |
| promise/no-return-in-finally | nursery | oxc-wasm | non-applicable | rule-outside-v1-set |
| promise/no-return-wrap | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| promise/param-names | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| promise/prefer-await-to-callbacks | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| promise/prefer-await-to-then | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| promise/prefer-catch | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| promise/spec-only | restriction | oxc-wasm | non-applicable | rule-outside-v1-set |
| promise/valid-params | correctness | oxc-wasm | non-applicable | rule-outside-v1-set |
| react/button-has-type | restriction | oxc-wasm | non-applicable | rule-outside-v1-set |
| react/checked-requires-onchange-or-readonly | pedantic | oxc-wasm | non-applicable | rule-outside-v1-set |
| react/display-name | pedantic | oxc-wasm | non-applicable | rule-outside-v1-set |
| react/exhaustive-deps | correctness | oxc-wasm | non-applicable | rule-outside-v1-set |
| react/forbid-component-props | restriction | oxc-wasm | non-applicable | rule-outside-v1-set |
| react/forbid-dom-props | restriction | oxc-wasm | non-applicable | rule-outside-v1-set |
| react/forbid-elements | restriction | oxc-wasm | non-applicable | rule-outside-v1-set |
| react/forward-ref-uses-ref | correctness | oxc-wasm | non-applicable | rule-outside-v1-set |
| react/function-component-definition | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| react/hook-use-state | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| react/iframe-missing-sandbox | suspicious | oxc-wasm | non-applicable | rule-outside-v1-set |
| react/jsx-boolean-value | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| react/jsx-curly-brace-presence | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| react/jsx-filename-extension | restriction | oxc-wasm | non-applicable | rule-outside-v1-set |
| react/jsx-fragments | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| react/jsx-handler-names | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| react/jsx-key | correctness | oxc-wasm | non-applicable | rule-outside-v1-set |
| react/jsx-max-depth | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| react/jsx-no-comment-textnodes | suspicious | oxc-wasm | non-applicable | rule-outside-v1-set |
| react/jsx-no-constructed-context-values | perf | oxc-wasm | non-applicable | rule-outside-v1-set |
| react/jsx-no-duplicate-props | correctness | oxc-wasm | non-applicable | rule-outside-v1-set |
| react/jsx-no-literals | restriction | oxc-wasm | non-applicable | rule-outside-v1-set |
| react/jsx-no-script-url | suspicious | oxc-wasm | non-applicable | rule-outside-v1-set |
| react/jsx-no-target-blank | pedantic | oxc-wasm | non-applicable | rule-outside-v1-set |
| react/jsx-no-undef | correctness | oxc-wasm | non-applicable | rule-outside-v1-set |
| react/jsx-no-useless-fragment | pedantic | oxc-wasm | non-applicable | rule-outside-v1-set |
| react/jsx-pascal-case | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| react/jsx-props-no-spread-multi | correctness | oxc-wasm | non-applicable | rule-outside-v1-set |
| react/jsx-props-no-spreading | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| react/no-array-index-key | perf | oxc-wasm | non-applicable | rule-outside-v1-set |
| react/no-children-prop | correctness | oxc-wasm | non-applicable | rule-outside-v1-set |
| react/no-clone-element | restriction | oxc-wasm | non-applicable | rule-outside-v1-set |
| react/no-danger | restriction | oxc-wasm | non-applicable | rule-outside-v1-set |
| react/no-danger-with-children | correctness | oxc-wasm | non-applicable | rule-outside-v1-set |
| react/no-did-mount-set-state | correctness | oxc-wasm | non-applicable | rule-outside-v1-set |
| react/no-did-update-set-state | correctness | oxc-wasm | non-applicable | rule-outside-v1-set |
| react/no-direct-mutation-state | correctness | oxc-wasm | non-applicable | rule-outside-v1-set |
| react/no-find-dom-node | correctness | oxc-wasm | non-applicable | rule-outside-v1-set |
| react/no-is-mounted | correctness | oxc-wasm | non-applicable | rule-outside-v1-set |
| react/no-multi-comp | restriction | oxc-wasm | non-applicable | rule-outside-v1-set |
| react/no-namespace | suspicious | oxc-wasm | non-applicable | rule-outside-v1-set |
| react/no-object-type-as-default-prop | perf | oxc-wasm | non-applicable | rule-outside-v1-set |
| react/no-react-children | restriction | oxc-wasm | non-applicable | rule-outside-v1-set |
| react/no-redundant-should-component-update | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| react/no-render-return-value | correctness | oxc-wasm | non-applicable | rule-outside-v1-set |
| react/no-set-state | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| react/no-string-refs | correctness | oxc-wasm | non-applicable | rule-outside-v1-set |
| react/no-this-in-sfc | correctness | oxc-wasm | non-applicable | rule-outside-v1-set |
| react/no-unescaped-entities | pedantic | oxc-wasm | non-applicable | rule-outside-v1-set |
| react/no-unknown-property | restriction | oxc-wasm | non-applicable | rule-outside-v1-set |
| react/no-unsafe | correctness | oxc-wasm | non-applicable | rule-outside-v1-set |
| react/no-unstable-nested-components | suspicious | oxc-wasm | non-applicable | rule-outside-v1-set |
| react/no-will-update-set-state | correctness | oxc-wasm | non-applicable | rule-outside-v1-set |
| react/only-export-components | restriction | oxc-wasm | non-applicable | rule-outside-v1-set |
| react/prefer-es6-class | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| react/prefer-function-component | restriction | oxc-wasm | non-applicable | rule-outside-v1-set |
| react/react-compiler | nursery | oxc-wasm | non-applicable | rule-outside-v1-set |
| react/react-in-jsx-scope | suspicious | oxc-wasm | non-applicable | rule-outside-v1-set |
| react/require-render-return | nursery | oxc-wasm | non-applicable | rule-outside-v1-set |
| react/rules-of-hooks | pedantic | oxc-wasm | non-applicable | rule-outside-v1-set |
| react/self-closing-comp | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| react/state-in-constructor | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| react/style-prop-object | suspicious | oxc-wasm | non-applicable | rule-outside-v1-set |
| react/void-dom-elements-no-children | correctness | oxc-wasm | non-applicable | rule-outside-v1-set |
| react_perf/jsx-no-jsx-as-prop | perf | oxc-wasm | non-applicable | rule-outside-v1-set |
| react_perf/jsx-no-new-array-as-prop | perf | oxc-wasm | non-applicable | rule-outside-v1-set |
| react_perf/jsx-no-new-function-as-prop | perf | oxc-wasm | non-applicable | rule-outside-v1-set |
| react_perf/jsx-no-new-object-as-prop | perf | oxc-wasm | non-applicable | rule-outside-v1-set |
| typescript/adjacent-overload-signatures | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| typescript/array-type | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| typescript/await-thenable | correctness | tsgolint | non-applicable | type-aware-tsgolint |
| typescript/ban-ts-comment | pedantic | oxc-wasm | non-applicable | rule-outside-v1-set |
| typescript/ban-tslint-comment | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| typescript/ban-types | pedantic | oxc-wasm | non-applicable | rule-outside-v1-set |
| typescript/class-literal-property-style | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| typescript/consistent-generic-constructors | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| typescript/consistent-indexed-object-style | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| typescript/consistent-return | suspicious | tsgolint | non-applicable | type-aware-tsgolint |
| typescript/consistent-type-assertions | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| typescript/consistent-type-definitions | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| typescript/consistent-type-exports | style | tsgolint | non-applicable | type-aware-tsgolint |
| typescript/consistent-type-imports | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| typescript/dot-notation | style | tsgolint | non-applicable | type-aware-tsgolint |
| typescript/explicit-function-return-type | restriction | oxc-wasm | non-applicable | rule-outside-v1-set |
| typescript/explicit-member-accessibility | restriction | oxc-wasm | non-applicable | rule-outside-v1-set |
| typescript/explicit-module-boundary-types | restriction | oxc-wasm | non-applicable | rule-outside-v1-set |
| typescript/method-signature-style | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| typescript/no-array-delete | correctness | tsgolint | non-applicable | type-aware-tsgolint |
| typescript/no-base-to-string | correctness | tsgolint | non-applicable | type-aware-tsgolint |
| typescript/no-confusing-non-null-assertion | suspicious | oxc-wasm | non-applicable | rule-outside-v1-set |
| typescript/no-confusing-void-expression | pedantic | tsgolint | non-applicable | type-aware-tsgolint |
| typescript/no-deprecated | pedantic | tsgolint | non-applicable | type-aware-tsgolint |
| typescript/no-duplicate-enum-values | correctness | oxc-wasm | enabled | certified-v1 |
| typescript/no-duplicate-type-constituents | correctness | tsgolint | non-applicable | type-aware-tsgolint |
| typescript/no-dynamic-delete | restriction | oxc-wasm | non-applicable | rule-outside-v1-set |
| typescript/no-empty-interface | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| typescript/no-empty-object-type | restriction | oxc-wasm | non-applicable | rule-outside-v1-set |
| typescript/no-explicit-any | restriction | oxc-wasm | non-applicable | rule-outside-v1-set |
| typescript/no-extra-non-null-assertion | correctness | oxc-wasm | enabled | certified-v1 |
| typescript/no-extraneous-class | suspicious | oxc-wasm | non-applicable | rule-outside-v1-set |
| typescript/no-floating-promises | correctness | tsgolint | non-applicable | type-aware-tsgolint |
| typescript/no-for-in-array | correctness | tsgolint | non-applicable | type-aware-tsgolint |
| typescript/no-implied-eval | correctness | tsgolint | non-applicable | type-aware-tsgolint |
| typescript/no-import-type-side-effects | restriction | oxc-wasm | non-applicable | rule-outside-v1-set |
| typescript/no-inferrable-types | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| typescript/no-invalid-void-type | restriction | oxc-wasm | non-applicable | rule-outside-v1-set |
| typescript/no-meaningless-void-operator | correctness | tsgolint | non-applicable | type-aware-tsgolint |
| typescript/no-misused-new | correctness | oxc-wasm | enabled | certified-v1 |
| typescript/no-misused-promises | pedantic | tsgolint | non-applicable | type-aware-tsgolint |
| typescript/no-misused-spread | correctness | tsgolint | non-applicable | type-aware-tsgolint |
| typescript/no-mixed-enums | pedantic | tsgolint | non-applicable | type-aware-tsgolint |
| typescript/no-namespace | restriction | oxc-wasm | non-applicable | rule-outside-v1-set |
| typescript/no-non-null-asserted-nullish-coalescing | restriction | oxc-wasm | non-applicable | rule-outside-v1-set |
| typescript/no-non-null-asserted-optional-chain | correctness | oxc-wasm | enabled | certified-v1 |
| typescript/no-non-null-assertion | restriction | oxc-wasm | non-applicable | rule-outside-v1-set |
| typescript/no-redundant-type-constituents | correctness | tsgolint | non-applicable | type-aware-tsgolint |
| typescript/no-require-imports | restriction | oxc-wasm | non-applicable | rule-outside-v1-set |
| typescript/no-restricted-types | restriction | oxc-wasm | non-applicable | rule-outside-v1-set |
| typescript/no-this-alias | correctness | oxc-wasm | enabled | certified-v1 |
| typescript/no-unnecessary-boolean-literal-compare | suspicious | tsgolint | non-applicable | type-aware-tsgolint |
| typescript/no-unnecessary-condition | nursery | tsgolint | non-applicable | type-aware-tsgolint |
| typescript/no-unnecessary-parameter-property-assignment | correctness | oxc-wasm | enabled | certified-v1 |
| typescript/no-unnecessary-qualifier | style | tsgolint | non-applicable | type-aware-tsgolint |
| typescript/no-unnecessary-template-expression | suspicious | tsgolint | non-applicable | type-aware-tsgolint |
| typescript/no-unnecessary-type-arguments | suspicious | tsgolint | non-applicable | type-aware-tsgolint |
| typescript/no-unnecessary-type-assertion | suspicious | tsgolint | non-applicable | type-aware-tsgolint |
| typescript/no-unnecessary-type-constraint | suspicious | oxc-wasm | non-applicable | rule-outside-v1-set |
| typescript/no-unnecessary-type-conversion | suspicious | tsgolint | non-applicable | type-aware-tsgolint |
| typescript/no-unnecessary-type-parameters | suspicious | tsgolint | non-applicable | type-aware-tsgolint |
| typescript/no-unsafe-argument | pedantic | tsgolint | non-applicable | type-aware-tsgolint |
| typescript/no-unsafe-assignment | pedantic | tsgolint | non-applicable | type-aware-tsgolint |
| typescript/no-unsafe-call | pedantic | tsgolint | non-applicable | type-aware-tsgolint |
| typescript/no-unsafe-declaration-merging | correctness | oxc-wasm | enabled | certified-v1 |
| typescript/no-unsafe-enum-comparison | suspicious | tsgolint | non-applicable | type-aware-tsgolint |
| typescript/no-unsafe-function-type | pedantic | oxc-wasm | non-applicable | rule-outside-v1-set |
| typescript/no-unsafe-member-access | pedantic | tsgolint | non-applicable | type-aware-tsgolint |
| typescript/no-unsafe-return | pedantic | tsgolint | non-applicable | type-aware-tsgolint |
| typescript/no-unsafe-type-assertion | suspicious | tsgolint | non-applicable | type-aware-tsgolint |
| typescript/no-unsafe-unary-minus | correctness | tsgolint | non-applicable | type-aware-tsgolint |
| typescript/no-useless-default-assignment | correctness | tsgolint | non-applicable | type-aware-tsgolint |
| typescript/no-useless-empty-export | correctness | oxc-wasm | enabled | certified-v1 |
| typescript/no-var-requires | restriction | oxc-wasm | non-applicable | rule-outside-v1-set |
| typescript/no-wrapper-object-types | correctness | oxc-wasm | enabled | certified-v1 |
| typescript/non-nullable-type-assertion-style | restriction | tsgolint | non-applicable | type-aware-tsgolint |
| typescript/only-throw-error | pedantic | tsgolint | non-applicable | type-aware-tsgolint |
| typescript/parameter-properties | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| typescript/prefer-as-const | correctness | oxc-wasm | enabled | certified-v1 |
| typescript/prefer-enum-initializers | pedantic | oxc-wasm | non-applicable | rule-outside-v1-set |
| typescript/prefer-find | style | tsgolint | non-applicable | type-aware-tsgolint |
| typescript/prefer-for-of | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| typescript/prefer-function-type | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| typescript/prefer-includes | pedantic | tsgolint | non-applicable | type-aware-tsgolint |
| typescript/prefer-literal-enum-member | restriction | oxc-wasm | non-applicable | rule-outside-v1-set |
| typescript/prefer-namespace-keyword | correctness | oxc-wasm | enabled | certified-v1 |
| typescript/prefer-nullish-coalescing | pedantic | tsgolint | non-applicable | type-aware-tsgolint |
| typescript/prefer-optional-chain | nursery | tsgolint | non-applicable | type-aware-tsgolint |
| typescript/prefer-promise-reject-errors | pedantic | tsgolint | non-applicable | type-aware-tsgolint |
| typescript/prefer-readonly | style | tsgolint | non-applicable | type-aware-tsgolint |
| typescript/prefer-readonly-parameter-types | pedantic | tsgolint | non-applicable | type-aware-tsgolint |
| typescript/prefer-reduce-type-parameter | style | tsgolint | non-applicable | type-aware-tsgolint |
| typescript/prefer-regexp-exec | style | tsgolint | non-applicable | type-aware-tsgolint |
| typescript/prefer-return-this-type | style | tsgolint | non-applicable | type-aware-tsgolint |
| typescript/prefer-string-starts-ends-with | style | tsgolint | non-applicable | type-aware-tsgolint |
| typescript/prefer-ts-expect-error | pedantic | oxc-wasm | non-applicable | rule-outside-v1-set |
| typescript/promise-function-async | restriction | tsgolint | non-applicable | type-aware-tsgolint |
| typescript/related-getter-setter-pairs | pedantic | tsgolint | non-applicable | type-aware-tsgolint |
| typescript/require-array-sort-compare | correctness | tsgolint | non-applicable | type-aware-tsgolint |
| typescript/require-await | pedantic | tsgolint | non-applicable | type-aware-tsgolint |
| typescript/restrict-plus-operands | pedantic | tsgolint | non-applicable | type-aware-tsgolint |
| typescript/restrict-template-expressions | correctness | tsgolint | non-applicable | type-aware-tsgolint |
| typescript/return-await | pedantic | tsgolint | non-applicable | type-aware-tsgolint |
| typescript/strict-boolean-expressions | pedantic | tsgolint | non-applicable | type-aware-tsgolint |
| typescript/strict-void-return | pedantic | tsgolint | non-applicable | type-aware-tsgolint |
| typescript/switch-exhaustiveness-check | pedantic | tsgolint | non-applicable | type-aware-tsgolint |
| typescript/triple-slash-reference | correctness | oxc-wasm | enabled | certified-v1 |
| typescript/unbound-method | correctness | tsgolint | non-applicable | type-aware-tsgolint |
| typescript/unified-signatures | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| typescript/use-unknown-in-catch-callback-variable | restriction | tsgolint | non-applicable | type-aware-tsgolint |
| unicorn/catch-error-name | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| unicorn/consistent-assert | pedantic | oxc-wasm | non-applicable | rule-outside-v1-set |
| unicorn/consistent-date-clone | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| unicorn/consistent-empty-array-spread | pedantic | oxc-wasm | non-applicable | rule-outside-v1-set |
| unicorn/consistent-existence-index-check | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| unicorn/consistent-function-scoping | suspicious | oxc-wasm | non-applicable | rule-outside-v1-set |
| unicorn/consistent-template-literal-escape | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| unicorn/custom-error-definition | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| unicorn/empty-brace-spaces | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| unicorn/error-message | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| unicorn/escape-case | pedantic | oxc-wasm | non-applicable | rule-outside-v1-set |
| unicorn/explicit-length-check | pedantic | oxc-wasm | non-applicable | rule-outside-v1-set |
| unicorn/explicit-timer-delay | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| unicorn/filename-case | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| unicorn/import-style | restriction | oxc-wasm | non-applicable | rule-outside-v1-set |
| unicorn/max-nested-calls | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| unicorn/new-for-builtins | pedantic | oxc-wasm | non-applicable | rule-outside-v1-set |
| unicorn/no-abusive-eslint-disable | restriction | oxc-wasm | non-applicable | rule-outside-v1-set |
| unicorn/no-accessor-recursion | suspicious | oxc-wasm | non-applicable | rule-outside-v1-set |
| unicorn/no-anonymous-default-export | restriction | oxc-wasm | non-applicable | rule-outside-v1-set |
| unicorn/no-array-callback-reference | pedantic | oxc-wasm | non-applicable | rule-outside-v1-set |
| unicorn/no-array-fill-with-reference-type | suspicious | oxc-wasm | non-applicable | rule-outside-v1-set |
| unicorn/no-array-for-each | restriction | oxc-wasm | non-applicable | rule-outside-v1-set |
| unicorn/no-array-method-this-argument | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| unicorn/no-array-reduce | restriction | oxc-wasm | non-applicable | rule-outside-v1-set |
| unicorn/no-array-reverse | suspicious | oxc-wasm | non-applicable | rule-outside-v1-set |
| unicorn/no-array-sort | suspicious | oxc-wasm | non-applicable | rule-outside-v1-set |
| unicorn/no-await-expression-member | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| unicorn/no-await-in-promise-methods | correctness | oxc-wasm | enabled | certified-v1 |
| unicorn/no-confusing-array-with | suspicious | oxc-wasm | non-applicable | rule-outside-v1-set |
| unicorn/no-console-spaces | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| unicorn/no-document-cookie | restriction | oxc-wasm | non-applicable | rule-outside-v1-set |
| unicorn/no-empty-file | correctness | oxc-wasm | enabled | certified-v1 |
| unicorn/no-hex-escape | pedantic | oxc-wasm | non-applicable | rule-outside-v1-set |
| unicorn/no-immediate-mutation | pedantic | oxc-wasm | non-applicable | rule-outside-v1-set |
| unicorn/no-instanceof-array | pedantic | oxc-wasm | non-applicable | rule-outside-v1-set |
| unicorn/no-instanceof-builtins | suspicious | oxc-wasm | non-applicable | rule-outside-v1-set |
| unicorn/no-invalid-fetch-options | correctness | oxc-wasm | enabled | certified-v1 |
| unicorn/no-invalid-remove-event-listener | correctness | oxc-wasm | enabled | certified-v1 |
| unicorn/no-length-as-slice-end | restriction | oxc-wasm | non-applicable | rule-outside-v1-set |
| unicorn/no-lonely-if | pedantic | oxc-wasm | non-applicable | rule-outside-v1-set |
| unicorn/no-magic-array-flat-depth | restriction | oxc-wasm | non-applicable | rule-outside-v1-set |
| unicorn/no-negated-condition | pedantic | oxc-wasm | non-applicable | rule-outside-v1-set |
| unicorn/no-negation-in-equality-check | pedantic | oxc-wasm | non-applicable | rule-outside-v1-set |
| unicorn/no-nested-ternary | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| unicorn/no-new-array | correctness | oxc-wasm | enabled | certified-v1 |
| unicorn/no-new-buffer | pedantic | oxc-wasm | non-applicable | rule-outside-v1-set |
| unicorn/no-null | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| unicorn/no-object-as-default-parameter | pedantic | oxc-wasm | non-applicable | rule-outside-v1-set |
| unicorn/no-process-exit | restriction | oxc-wasm | non-applicable | rule-outside-v1-set |
| unicorn/no-single-promise-in-promise-methods | correctness | oxc-wasm | enabled | certified-v1 |
| unicorn/no-static-only-class | pedantic | oxc-wasm | non-applicable | rule-outside-v1-set |
| unicorn/no-thenable | correctness | oxc-wasm | enabled | certified-v1 |
| unicorn/no-this-assignment | pedantic | oxc-wasm | non-applicable | rule-outside-v1-set |
| unicorn/no-typeof-undefined | pedantic | oxc-wasm | non-applicable | rule-outside-v1-set |
| unicorn/no-unnecessary-array-flat-depth | pedantic | oxc-wasm | non-applicable | rule-outside-v1-set |
| unicorn/no-unnecessary-array-splice-count | pedantic | oxc-wasm | non-applicable | rule-outside-v1-set |
| unicorn/no-unnecessary-await | correctness | oxc-wasm | enabled | certified-v1 |
| unicorn/no-unnecessary-slice-end | pedantic | oxc-wasm | non-applicable | rule-outside-v1-set |
| unicorn/no-unreadable-array-destructuring | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| unicorn/no-unreadable-iife | pedantic | oxc-wasm | non-applicable | rule-outside-v1-set |
| unicorn/no-useless-collection-argument | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| unicorn/no-useless-error-capture-stack-trace | restriction | oxc-wasm | non-applicable | rule-outside-v1-set |
| unicorn/no-useless-fallback-in-spread | correctness | oxc-wasm | enabled | certified-v1 |
| unicorn/no-useless-iterator-to-array | nursery | oxc-wasm | non-applicable | rule-outside-v1-set |
| unicorn/no-useless-length-check | correctness | oxc-wasm | enabled | certified-v1 |
| unicorn/no-useless-promise-resolve-reject | pedantic | oxc-wasm | non-applicable | rule-outside-v1-set |
| unicorn/no-useless-spread | correctness | oxc-wasm | enabled | certified-v1 |
| unicorn/no-useless-switch-case | pedantic | oxc-wasm | non-applicable | rule-outside-v1-set |
| unicorn/no-useless-undefined | pedantic | oxc-wasm | non-applicable | rule-outside-v1-set |
| unicorn/no-zero-fractions | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| unicorn/number-literal-case | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| unicorn/numeric-separators-style | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| unicorn/prefer-add-event-listener | suspicious | oxc-wasm | non-applicable | rule-outside-v1-set |
| unicorn/prefer-array-find | perf | oxc-wasm | non-applicable | rule-outside-v1-set |
| unicorn/prefer-array-flat | pedantic | oxc-wasm | non-applicable | rule-outside-v1-set |
| unicorn/prefer-array-flat-map | perf | oxc-wasm | non-applicable | rule-outside-v1-set |
| unicorn/prefer-array-index-of | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| unicorn/prefer-array-some | pedantic | oxc-wasm | non-applicable | rule-outside-v1-set |
| unicorn/prefer-at | pedantic | oxc-wasm | non-applicable | rule-outside-v1-set |
| unicorn/prefer-bigint-literals | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| unicorn/prefer-blob-reading-methods | pedantic | oxc-wasm | non-applicable | rule-outside-v1-set |
| unicorn/prefer-class-fields | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| unicorn/prefer-classlist-toggle | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| unicorn/prefer-code-point | pedantic | oxc-wasm | non-applicable | rule-outside-v1-set |
| unicorn/prefer-date-now | pedantic | oxc-wasm | non-applicable | rule-outside-v1-set |
| unicorn/prefer-default-parameters | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| unicorn/prefer-dom-node-append | pedantic | oxc-wasm | non-applicable | rule-outside-v1-set |
| unicorn/prefer-dom-node-dataset | pedantic | oxc-wasm | non-applicable | rule-outside-v1-set |
| unicorn/prefer-dom-node-remove | pedantic | oxc-wasm | non-applicable | rule-outside-v1-set |
| unicorn/prefer-dom-node-text-content | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| unicorn/prefer-event-target | pedantic | oxc-wasm | non-applicable | rule-outside-v1-set |
| unicorn/prefer-export-from | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| unicorn/prefer-global-this | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| unicorn/prefer-import-meta-properties | pedantic | oxc-wasm | non-applicable | rule-outside-v1-set |
| unicorn/prefer-includes | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| unicorn/prefer-keyboard-event-key | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| unicorn/prefer-logical-operator-over-ternary | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| unicorn/prefer-math-min-max | pedantic | oxc-wasm | non-applicable | rule-outside-v1-set |
| unicorn/prefer-math-trunc | pedantic | oxc-wasm | non-applicable | rule-outside-v1-set |
| unicorn/prefer-modern-dom-apis | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| unicorn/prefer-modern-math-apis | restriction | oxc-wasm | non-applicable | rule-outside-v1-set |
| unicorn/prefer-module | restriction | oxc-wasm | non-applicable | rule-outside-v1-set |
| unicorn/prefer-native-coercion-functions | pedantic | oxc-wasm | non-applicable | rule-outside-v1-set |
| unicorn/prefer-negative-index | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| unicorn/prefer-node-protocol | restriction | oxc-wasm | non-applicable | rule-outside-v1-set |
| unicorn/prefer-number-coercion | pedantic | oxc-wasm | non-applicable | rule-outside-v1-set |
| unicorn/prefer-number-properties | restriction | oxc-wasm | non-applicable | rule-outside-v1-set |
| unicorn/prefer-object-from-entries | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| unicorn/prefer-optional-catch-binding | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| unicorn/prefer-prototype-methods | pedantic | oxc-wasm | non-applicable | rule-outside-v1-set |
| unicorn/prefer-query-selector | pedantic | oxc-wasm | non-applicable | rule-outside-v1-set |
| unicorn/prefer-reflect-apply | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| unicorn/prefer-regexp-test | pedantic | oxc-wasm | non-applicable | rule-outside-v1-set |
| unicorn/prefer-response-static-json | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| unicorn/prefer-set-has | perf | oxc-wasm | non-applicable | rule-outside-v1-set |
| unicorn/prefer-set-size | correctness | oxc-wasm | enabled | certified-v1 |
| unicorn/prefer-single-call | pedantic | oxc-wasm | non-applicable | rule-outside-v1-set |
| unicorn/prefer-spread | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| unicorn/prefer-string-raw | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| unicorn/prefer-string-replace-all | pedantic | oxc-wasm | non-applicable | rule-outside-v1-set |
| unicorn/prefer-string-slice | pedantic | oxc-wasm | non-applicable | rule-outside-v1-set |
| unicorn/prefer-string-starts-ends-with | correctness | oxc-wasm | enabled | certified-v1 |
| unicorn/prefer-string-trim-start-end | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| unicorn/prefer-structured-clone | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| unicorn/prefer-ternary | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| unicorn/prefer-top-level-await | pedantic | oxc-wasm | non-applicable | rule-outside-v1-set |
| unicorn/prefer-type-error | pedantic | oxc-wasm | non-applicable | rule-outside-v1-set |
| unicorn/relative-url-style | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| unicorn/require-array-join-separator | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| unicorn/require-module-attributes | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| unicorn/require-module-specifiers | suspicious | oxc-wasm | non-applicable | rule-outside-v1-set |
| unicorn/require-number-to-fixed-digits-argument | pedantic | oxc-wasm | non-applicable | rule-outside-v1-set |
| unicorn/require-post-message-target-origin | suspicious | oxc-wasm | non-applicable | rule-outside-v1-set |
| unicorn/switch-case-braces | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| unicorn/switch-case-break-position | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| unicorn/text-encoding-identifier-case | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| unicorn/throw-new-error | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| vitest/consistent-each-for | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| vitest/consistent-test-filename | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| vitest/consistent-test-it | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| vitest/consistent-vitest-vi | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| vitest/expect-expect | correctness | oxc-wasm | non-applicable | rule-outside-v1-set |
| vitest/hoisted-apis-on-top | correctness | oxc-wasm | non-applicable | rule-outside-v1-set |
| vitest/max-expects | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| vitest/max-nested-describe | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| vitest/no-alias-methods | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| vitest/no-commented-out-tests | suspicious | oxc-wasm | non-applicable | rule-outside-v1-set |
| vitest/no-conditional-expect | correctness | oxc-wasm | non-applicable | rule-outside-v1-set |
| vitest/no-conditional-in-test | pedantic | oxc-wasm | non-applicable | rule-outside-v1-set |
| vitest/no-conditional-tests | correctness | oxc-wasm | non-applicable | rule-outside-v1-set |
| vitest/no-disabled-tests | correctness | oxc-wasm | non-applicable | rule-outside-v1-set |
| vitest/no-duplicate-hooks | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| vitest/no-focused-tests | correctness | oxc-wasm | non-applicable | rule-outside-v1-set |
| vitest/no-hooks | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| vitest/no-identical-title | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| vitest/no-import-node-test | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| vitest/no-importing-vitest-globals | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| vitest/no-interpolation-in-snapshots | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| vitest/no-large-snapshots | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| vitest/no-mocks-import | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| vitest/no-restricted-matchers | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| vitest/no-restricted-vi-methods | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| vitest/no-standalone-expect | correctness | oxc-wasm | non-applicable | rule-outside-v1-set |
| vitest/no-test-prefixes | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| vitest/no-test-return-statement | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| vitest/no-unneeded-async-expect-function | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| vitest/padding-around-after-all-blocks | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| vitest/padding-around-test-blocks | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| vitest/prefer-called-exactly-once-with | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| vitest/prefer-called-once | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| vitest/prefer-called-times | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| vitest/prefer-called-with | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| vitest/prefer-comparison-matcher | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| vitest/prefer-describe-function-title | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| vitest/prefer-each | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| vitest/prefer-equality-matcher | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| vitest/prefer-expect-assertions | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| vitest/prefer-expect-resolves | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| vitest/prefer-expect-type-of | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| vitest/prefer-hooks-in-order | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| vitest/prefer-hooks-on-top | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| vitest/prefer-import-in-mock | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| vitest/prefer-importing-vitest-globals | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| vitest/prefer-lowercase-title | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| vitest/prefer-mock-promise-shorthand | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| vitest/prefer-mock-return-shorthand | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| vitest/prefer-snapshot-hint | correctness | oxc-wasm | non-applicable | rule-outside-v1-set |
| vitest/prefer-spy-on | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| vitest/prefer-strict-boolean-matchers | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| vitest/prefer-strict-equal | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| vitest/prefer-to-be | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| vitest/prefer-to-be-falsy | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| vitest/prefer-to-be-object | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| vitest/prefer-to-be-truthy | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| vitest/prefer-to-contain | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| vitest/prefer-to-have-been-called-times | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| vitest/prefer-to-have-length | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| vitest/prefer-todo | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| vitest/require-awaited-expect-poll | correctness | oxc-wasm | non-applicable | rule-outside-v1-set |
| vitest/require-hook | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| vitest/require-local-test-context-for-concurrent-snapshots | correctness | oxc-wasm | non-applicable | rule-outside-v1-set |
| vitest/require-mock-type-parameters | correctness | oxc-wasm | non-applicable | rule-outside-v1-set |
| vitest/require-test-timeout | restriction | oxc-wasm | non-applicable | rule-outside-v1-set |
| vitest/require-to-throw-message | correctness | oxc-wasm | non-applicable | rule-outside-v1-set |
| vitest/require-top-level-describe | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| vitest/valid-describe-callback | correctness | oxc-wasm | non-applicable | rule-outside-v1-set |
| vitest/valid-expect | correctness | oxc-wasm | non-applicable | rule-outside-v1-set |
| vitest/valid-expect-in-promise | correctness | oxc-wasm | non-applicable | rule-outside-v1-set |
| vitest/valid-title | correctness | oxc-wasm | non-applicable | rule-outside-v1-set |
| vitest/warn-todo | correctness | oxc-wasm | non-applicable | rule-outside-v1-set |
| vue/component-definition-name-casing | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| vue/define-emits-declaration | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| vue/define-props-declaration | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| vue/define-props-destructuring | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| vue/max-props | restriction | oxc-wasm | non-applicable | rule-outside-v1-set |
| vue/next-tick-style | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| vue/no-arrow-functions-in-watch | correctness | oxc-wasm | non-applicable | rule-outside-v1-set |
| vue/no-async-in-computed-properties | correctness | oxc-wasm | non-applicable | rule-outside-v1-set |
| vue/no-computed-properties-in-data | correctness | oxc-wasm | non-applicable | rule-outside-v1-set |
| vue/no-deprecated-data-object-declaration | correctness | oxc-wasm | non-applicable | rule-outside-v1-set |
| vue/no-deprecated-delete-set | correctness | oxc-wasm | non-applicable | rule-outside-v1-set |
| vue/no-deprecated-destroyed-lifecycle | correctness | oxc-wasm | non-applicable | rule-outside-v1-set |
| vue/no-deprecated-events-api | correctness | oxc-wasm | non-applicable | rule-outside-v1-set |
| vue/no-deprecated-model-definition | correctness | oxc-wasm | non-applicable | rule-outside-v1-set |
| vue/no-deprecated-props-default-this | correctness | oxc-wasm | non-applicable | rule-outside-v1-set |
| vue/no-deprecated-vue-config-keycodes | correctness | oxc-wasm | non-applicable | rule-outside-v1-set |
| vue/no-dupe-keys | correctness | oxc-wasm | non-applicable | rule-outside-v1-set |
| vue/no-export-in-script-setup | correctness | oxc-wasm | non-applicable | rule-outside-v1-set |
| vue/no-expose-after-await | correctness | oxc-wasm | non-applicable | rule-outside-v1-set |
| vue/no-import-compiler-macros | restriction | oxc-wasm | non-applicable | rule-outside-v1-set |
| vue/no-lifecycle-after-await | correctness | oxc-wasm | non-applicable | rule-outside-v1-set |
| vue/no-multiple-slot-args | restriction | oxc-wasm | non-applicable | rule-outside-v1-set |
| vue/no-required-prop-with-default | suspicious | oxc-wasm | non-applicable | rule-outside-v1-set |
| vue/no-reserved-component-names | correctness | oxc-wasm | non-applicable | rule-outside-v1-set |
| vue/no-reserved-keys | correctness | oxc-wasm | non-applicable | rule-outside-v1-set |
| vue/no-reserved-props | correctness | oxc-wasm | non-applicable | rule-outside-v1-set |
| vue/no-shared-component-data | correctness | oxc-wasm | non-applicable | rule-outside-v1-set |
| vue/no-side-effects-in-computed-properties | correctness | oxc-wasm | non-applicable | rule-outside-v1-set |
| vue/no-this-in-before-route-enter | correctness | oxc-wasm | non-applicable | rule-outside-v1-set |
| vue/no-watch-after-await | correctness | oxc-wasm | non-applicable | rule-outside-v1-set |
| vue/prefer-import-from-vue | correctness | oxc-wasm | non-applicable | rule-outside-v1-set |
| vue/prop-name-casing | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| vue/require-default-export | suspicious | oxc-wasm | non-applicable | rule-outside-v1-set |
| vue/require-default-prop | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| vue/require-direct-export | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| vue/require-prop-type-constructor | correctness | oxc-wasm | non-applicable | rule-outside-v1-set |
| vue/require-prop-types | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| vue/require-render-return | correctness | oxc-wasm | non-applicable | rule-outside-v1-set |
| vue/require-slots-as-functions | correctness | oxc-wasm | non-applicable | rule-outside-v1-set |
| vue/require-typed-ref | style | oxc-wasm | non-applicable | rule-outside-v1-set |
| vue/return-in-computed-property | correctness | oxc-wasm | non-applicable | rule-outside-v1-set |
| vue/return-in-emits-validator | correctness | oxc-wasm | non-applicable | rule-outside-v1-set |
| vue/valid-define-emits | correctness | oxc-wasm | non-applicable | rule-outside-v1-set |
| vue/valid-define-options | correctness | oxc-wasm | non-applicable | rule-outside-v1-set |
| vue/valid-define-props | correctness | oxc-wasm | non-applicable | rule-outside-v1-set |
| vue/valid-next-tick | correctness | oxc-wasm | non-applicable | rule-outside-v1-set |
## Upstream test ledger

| Test | Classification | Reason |
| --- | --- | --- |
| ast_util::test_this_use_alphabetization | non-applicable | internal-or-unexposed-support-test |
| config::config_builder::test::test_builder_default | non-applicable | internal-or-unexposed-support-test |
| config::config_builder::test::test_builder_empty | non-applicable | internal-or-unexposed-support-test |
| config::config_builder::test::test_categories | non-applicable | internal-or-unexposed-support-test |
| config::config_builder::test::test_cli_rule_aliases | non-applicable | internal-or-unexposed-support-test |
| config::config_builder::test::test_correctness_category_off_applies_to_override_plugins | non-applicable | internal-or-unexposed-support-test |
| config::config_builder::test::test_errors_on_named_configs | non-applicable | internal-or-unexposed-support-test |
| config::config_builder::test::test_extends_circular | non-applicable | internal-or-unexposed-support-test |
| config::config_builder::test::test_extends_invalid | non-applicable | internal-or-unexposed-support-test |
| config::config_builder::test::test_extends_options | non-applicable | internal-or-unexposed-support-test |
| config::config_builder::test::test_extends_overrides_precedence | non-applicable | internal-or-unexposed-support-test |
| config::config_builder::test::test_extends_plugins | non-applicable | internal-or-unexposed-support-test |
| config::config_builder::test::test_extends_rules_multiple | non-applicable | internal-or-unexposed-support-test |
| config::config_builder::test::test_extends_rules_single | non-applicable | internal-or-unexposed-support-test |
| config::config_builder::test::test_filter_allow_all_then_warn | non-applicable | internal-or-unexposed-support-test |
| config::config_builder::test::test_filter_deny_on_default | non-applicable | internal-or-unexposed-support-test |
| config::config_builder::test::test_filter_deny_single_enabled_rule_on_default | non-applicable | internal-or-unexposed-support-test |
| config::config_builder::test::test_filter_warn_single_disabled_rule_on_default | non-applicable | internal-or-unexposed-support-test |
| config::config_builder::test::test_ignore_patterns_with_parent_reference_rejected | non-applicable | internal-or-unexposed-support-test |
| config::config_builder::test::test_plugin_configuration | non-applicable | internal-or-unexposed-support-test |
| config::config_builder::test::test_rules_after_plugin_added | non-applicable | internal-or-unexposed-support-test |
| config::config_builder::test::test_rules_after_plugin_removal | non-applicable | internal-or-unexposed-support-test |
| config::config_builder::test::test_unknown_builtin_rule_errors_in_overrides | non-applicable | internal-or-unexposed-support-test |
| config::config_builder::test::test_unknown_builtin_rule_errors_in_root_config | non-applicable | internal-or-unexposed-support-test |
| config::config_store::test::test_add_env | non-applicable | internal-or-unexposed-support-test |
| config::config_store::test::test_add_globals | non-applicable | internal-or-unexposed-support-test |
| config::config_store::test::test_add_plugins | non-applicable | internal-or-unexposed-support-test |
| config::config_store::test::test_add_rule | non-applicable | internal-or-unexposed-support-test |
| config::config_store::test::test_categories_not_reapplied_to_root_plugins | non-applicable | internal-or-unexposed-support-test |
| config::config_store::test::test_categories_only_applied_to_new_plugins_not_in_root | non-applicable | internal-or-unexposed-support-test |
| config::config_store::test::test_change_rule_severity | non-applicable | internal-or-unexposed-support-test |
| config::config_store::test::test_deny_warnings_disabled_by_default | non-applicable | internal-or-unexposed-support-test |
| config::config_store::test::test_deny_warnings_enabled_from_root_config | non-applicable | internal-or-unexposed-support-test |
| config::config_store::test::test_external_rule_options_override_precedence | non-applicable | internal-or-unexposed-support-test |
| config::config_store::test::test_external_rules_preserved_with_overrides | non-applicable | internal-or-unexposed-support-test |
| config::config_store::test::test_max_warnings_disabled_by_default | non-applicable | internal-or-unexposed-support-test |
| config::config_store::test::test_max_warnings_from_root_config | non-applicable | internal-or-unexposed-support-test |
| config::config_store::test::test_no_rules | non-applicable | internal-or-unexposed-support-test |
| config::config_store::test::test_no_rules_and_new_plugins | non-applicable | internal-or-unexposed-support-test |
| config::config_store::test::test_number_of_rules | non-applicable | internal-or-unexposed-support-test |
| config::config_store::test::test_number_of_rules_dedupes_root_and_override_same_rule | non-applicable | internal-or-unexposed-support-test |
| config::config_store::test::test_number_of_rules_dedupes_same_rule_across_overrides | non-applicable | internal-or-unexposed-support-test |
| config::config_store::test::test_number_of_rules_includes_external_rules | non-applicable | internal-or-unexposed-support-test |
| config::config_store::test::test_number_of_rules_override_only | non-applicable | internal-or-unexposed-support-test |
| config::config_store::test::test_override_exclude_files_exclude_only_that_override | non-applicable | internal-or-unexposed-support-test |
| config::config_store::test::test_override_import_plugin_respects_correctness_off | non-applicable | internal-or-unexposed-support-test |
| config::config_store::test::test_override_new_plugin_does_not_reapply_categories_to_eslint_rules | non-applicable | internal-or-unexposed-support-test |
| config::config_store::test::test_override_rule_not_reset_by_later_override_with_different_plugins | non-applicable | internal-or-unexposed-support-test |
| config::config_store::test::test_remove_rule | non-applicable | internal-or-unexposed-support-test |
| config::config_store::test::test_replace_env | non-applicable | internal-or-unexposed-support-test |
| config::config_store::test::test_replace_globals | non-applicable | internal-or-unexposed-support-test |
| config::config_store::test::test_report_unused_disable_directives_from_root_config | non-applicable | internal-or-unexposed-support-test |
| config::config_store::test::test_report_unused_disable_directives_none_by_default | non-applicable | internal-or-unexposed-support-test |
| config::config_store::test::test_rule_config_override_replaces_properly | non-applicable | internal-or-unexposed-support-test |
| config::config_store::test::test_type_aware_disabled_by_default | non-applicable | internal-or-unexposed-support-test |
| config::config_store::test::test_type_aware_enabled_from_root_config | non-applicable | internal-or-unexposed-support-test |
| config::config_store::test::test_type_check_disabled_by_default | non-applicable | internal-or-unexposed-support-test |
| config::config_store::test::test_type_check_enabled_from_root_config | non-applicable | internal-or-unexposed-support-test |
| config::env::test::test_override_envs | non-applicable | internal-or-unexposed-support-test |
| config::env::test::test_parse_env | non-applicable | internal-or-unexposed-support-test |
| config::env::test::test_parse_env_default | non-applicable | internal-or-unexposed-support-test |
| config::external_plugins::test::test_deserialize | non-applicable | internal-or-unexposed-support-test |
| config::external_plugins::test::test_deserialize_mixed_formats | non-applicable | internal-or-unexposed-support-test |
| config::external_plugins::test::test_deserialize_rejects_invalid | non-applicable | internal-or-unexposed-support-test |
| config::external_plugins::test::test_serialize | non-applicable | internal-or-unexposed-support-test |
| config::globals::test::test_deserialize_bool | non-applicable | internal-or-unexposed-support-test |
| config::globals::test::test_deserialize_legacy_spelling | non-applicable | internal-or-unexposed-support-test |
| config::globals::test::test_deserialize_normal | non-applicable | internal-or-unexposed-support-test |
| config::globals::test::test_override_globals | non-applicable | internal-or-unexposed-support-test |
| config::ignore_matcher::tests::test_deepest_config_precedence | non-applicable | internal-or-unexposed-support-test |
| config::ignore_matcher::tests::test_lint_file_outside_root | non-applicable | internal-or-unexposed-support-test |
| config::overrides::test::test_parsing_env | non-applicable | internal-or-unexposed-support-test |
| config::overrides::test::test_parsing_exclude_files | non-applicable | internal-or-unexposed-support-test |
| config::overrides::test::test_parsing_globals | non-applicable | internal-or-unexposed-support-test |
| config::overrides::test::test_parsing_plugins | non-applicable | internal-or-unexposed-support-test |
| config::oxlintrc::test::test_oxlintrc_de_empty | non-applicable | internal-or-unexposed-support-test |
| config::oxlintrc::test::test_oxlintrc_de_plugins_empty_array | non-applicable | internal-or-unexposed-support-test |
| config::oxlintrc::test::test_oxlintrc_empty_config_plugins | non-applicable | internal-or-unexposed-support-test |
| config::oxlintrc::test::test_oxlintrc_extends | non-applicable | internal-or-unexposed-support-test |
| config::oxlintrc::test::test_oxlintrc_js_plugins | non-applicable | internal-or-unexposed-support-test |
| config::oxlintrc::test::test_oxlintrc_js_plugins_merge | non-applicable | internal-or-unexposed-support-test |
| config::oxlintrc::test::test_oxlintrc_js_plugins_rejects_invalid | non-applicable | internal-or-unexposed-support-test |
| config::oxlintrc::test::test_oxlintrc_js_plugins_roundtrip | non-applicable | internal-or-unexposed-support-test |
| config::oxlintrc::test::test_oxlintrc_merge_options | non-applicable | internal-or-unexposed-support-test |
| config::oxlintrc::test::test_oxlintrc_options_deserialize | non-applicable | internal-or-unexposed-support-test |
| config::oxlintrc::test::test_oxlintrc_reject_non_object | non-applicable | internal-or-unexposed-support-test |
| config::oxlintrc::test::test_oxlintrc_schema_field | non-applicable | internal-or-unexposed-support-test |
| config::oxlintrc::test::test_oxlintrc_specifying_plugins_will_override | non-applicable | internal-or-unexposed-support-test |
| config::oxlintrc::test::test_oxlintrc_top_level_options_rejected | non-applicable | internal-or-unexposed-support-test |
| config::oxlintrc::test::test_set_config_dir | non-applicable | internal-or-unexposed-support-test |
| config::plugins::tests::test_deserialize_lint_plugins | non-applicable | internal-or-unexposed-support-test |
| config::plugins::tests::test_deserialize_lint_plugins_with_unknown_plugin | non-applicable | internal-or-unexposed-support-test |
| config::plugins::tests::test_has_helpers | non-applicable | internal-or-unexposed-support-test |
| config::plugins::tests::test_is_normal_plugin_name | non-applicable | internal-or-unexposed-support-test |
| config::plugins::tests::test_normalize_plugin_name | non-applicable | internal-or-unexposed-support-test |
| config::plugins::tests::test_plugin_from_str | non-applicable | internal-or-unexposed-support-test |
| config::plugins::tests::test_plugin_normalization | non-applicable | internal-or-unexposed-support-test |
| config::plugins::tests::test_plugin_to_str | non-applicable | internal-or-unexposed-support-test |
| config::plugins::tests::test_plugins_default | non-applicable | internal-or-unexposed-support-test |
| config::plugins::tests::test_serialize_lint_plugins | non-applicable | internal-or-unexposed-support-test |
| config::rules::test::test_external_rule_options_are_recorded | non-applicable | internal-or-unexposed-support-test |
| config::rules::test::test_normalize_plugin_name_in_rules | non-applicable | internal-or-unexposed-support-test |
| config::rules::test::test_override_allow | non-applicable | internal-or-unexposed-support-test |
| config::rules::test::test_override_empty | non-applicable | internal-or-unexposed-support-test |
| config::rules::test::test_override_ignores_known_aliased_rule_when_plugin_disabled | non-applicable | internal-or-unexposed-support-test |
| config::rules::test::test_override_ignores_known_rule_when_plugin_disabled | non-applicable | internal-or-unexposed-support-test |
| config::rules::test::test_override_plugin_prefix_duplicates | non-applicable | internal-or-unexposed-support-test |
| config::rules::test::test_override_rules_errors_for_rules_without_config | non-applicable | internal-or-unexposed-support-test |
| config::rules::test::test_override_rules_errors_multiple | non-applicable | internal-or-unexposed-support-test |
| config::rules::test::test_override_rules_errors_single | non-applicable | internal-or-unexposed-support-test |
| config::rules::test::test_override_rules_errors_sorted | non-applicable | internal-or-unexposed-support-test |
| config::rules::test::test_parse_rules | non-applicable | internal-or-unexposed-support-test |
| config::rules::test::test_parse_rules_default | non-applicable | internal-or-unexposed-support-test |
| config::rules::test::test_parse_rules_with_eslint_plugin_prefix | non-applicable | internal-or-unexposed-support-test |
| config::rules::test::test_rules_with_dummy_config_accept_options | non-applicable | internal-or-unexposed-support-test |
| config::settings::jsdoc::test::check_blocked_tag_name | non-applicable | internal-or-unexposed-support-test |
| config::settings::jsdoc::test::check_preferred_tag_name | non-applicable | internal-or-unexposed-support-test |
| config::settings::jsdoc::test::list_user_defined_tag_names | non-applicable | internal-or-unexposed-support-test |
| config::settings::jsdoc::test::parse_bools | non-applicable | internal-or-unexposed-support-test |
| config::settings::jsdoc::test::parse_defaults | non-applicable | internal-or-unexposed-support-test |
| config::settings::jsdoc::test::resolve_tag_name | non-applicable | internal-or-unexposed-support-test |
| config::settings::react::test::test_react_version_deserialize | non-applicable | internal-or-unexposed-support-test |
| config::settings::react::test::test_react_version_display | non-applicable | internal-or-unexposed-support-test |
| config::settings::react::test::test_react_version_invalid | non-applicable | internal-or-unexposed-support-test |
| config::settings::react::test::test_react_version_serialize | non-applicable | internal-or-unexposed-support-test |
| config::settings::react::test::test_supports_unsafe_lifecycle_prefix | non-applicable | internal-or-unexposed-support-test |
| config::settings::react::test::test_version_regex | non-applicable | internal-or-unexposed-support-test |
| config::settings::test::test_extra_fields | non-applicable | internal-or-unexposed-support-test |
| config::settings::test::test_integer_jest_version_settings | non-applicable | internal-or-unexposed-support-test |
| config::settings::test::test_jest_semver_prefixed_with_v_settings | non-applicable | internal-or-unexposed-support-test |
| config::settings::test::test_jest_semver_settings | non-applicable | internal-or-unexposed-support-test |
| config::settings::test::test_major_version_jest_as_string_settings | non-applicable | internal-or-unexposed-support-test |
| config::settings::test::test_negative_integer_jest_version_fail | non-applicable | internal-or-unexposed-support-test |
| config::settings::test::test_parse_jsx_a11y_attributes | non-applicable | internal-or-unexposed-support-test |
| config::settings::test::test_parse_jsx_a11y_attributes_empty | non-applicable | internal-or-unexposed-support-test |
| config::settings::test::test_parse_settings | non-applicable | internal-or-unexposed-support-test |
| config::settings::test::test_parse_settings_default | non-applicable | internal-or-unexposed-support-test |
| config::test::test_deserialize | non-applicable | internal-or-unexposed-support-test |
| config::test::test_deserialize_globals | non-applicable | internal-or-unexposed-support-test |
| config::test::test_from_file | non-applicable | internal-or-unexposed-support-test |
| config::test::test_vitest_rule_replace | non-applicable | internal-or-unexposed-support-test |
| disable_directives::test | non-applicable | internal-or-unexposed-support-test |
| disable_directives::tests::directive_rule_lists_parse_rules_and_descriptions | non-applicable | internal-or-unexposed-support-test |
| disable_directives::tests::directive_rule_name_is_matched_on_full_rule_name_not_substring | non-applicable | internal-or-unexposed-support-test |
| disable_directives::tests::fix_span_block_comment_alone_on_line | non-applicable | internal-or-unexposed-support-test |
| disable_directives::tests::fix_span_comment_on_line_with_code | non-applicable | internal-or-unexposed-support-test |
| disable_directives::tests::fix_span_indented_line_comment | non-applicable | internal-or-unexposed-support-test |
| disable_directives::tests::fix_span_line_comment_alone_on_line | non-applicable | internal-or-unexposed-support-test |
| disable_directives::tests::next_line_span_of_line_comment | non-applicable | internal-or-unexposed-support-test |
| disable_directives::tests::no_unused_disable | non-applicable | internal-or-unexposed-support-test |
| disable_directives::tests::no_unused_enable | non-applicable | internal-or-unexposed-support-test |
| disable_directives::tests::only_configured_prefixes_are_recognized | non-applicable | internal-or-unexposed-support-test |
| disable_directives::tests::test_disable_next_line_should_not_disable_large_span_diagnostics | non-applicable | internal-or-unexposed-support-test |
| disable_directives::tests::test_rule_comment_rule_create_fix | non-applicable | internal-or-unexposed-support-test |
| disable_directives::tests::test_rule_comment_rule_create_fix_panic | non-applicable | internal-or-unexposed-support-test |
| disable_directives::tests::unused_disable_all | non-applicable | internal-or-unexposed-support-test |
| disable_directives::tests::unused_disable_fix_handles_whitespace_separated_rule_names | non-applicable | internal-or-unexposed-support-test |
| disable_directives::tests::unused_disable_rules | non-applicable | internal-or-unexposed-support-test |
| disable_directives::tests::unused_enable_all | non-applicable | internal-or-unexposed-support-test |
| disable_directives::tests::unused_enable_rules | non-applicable | internal-or-unexposed-support-test |
| fixer::fix::test::assert_size | non-applicable | internal-or-unexposed-support-test |
| fixer::fix::test::test_can_apply | non-applicable | internal-or-unexposed-support-test |
| fixer::fix::test::test_composite_push_on_multiple | non-applicable | internal-or-unexposed-support-test |
| fixer::fix::test::test_composite_push_on_none | non-applicable | internal-or-unexposed-support-test |
| fixer::fix::test::test_composite_push_on_single | non-applicable | internal-or-unexposed-support-test |
| fixer::fix::test::test_emojis | non-applicable | internal-or-unexposed-support-test |
| fixer::fix::test::test_emojis_invalid | non-applicable | internal-or-unexposed-support-test |
| fixer::fix::test::test_none | non-applicable | internal-or-unexposed-support-test |
| fixer::fix::test::test_to_string | non-applicable | internal-or-unexposed-support-test |
| fixer::test::apply_one_fix_when_range_overlap_and_one_message_has_no_fix | non-applicable | internal-or-unexposed-support-test |
| fixer::test::apply_one_fix_when_spans_overlap | non-applicable | internal-or-unexposed-support-test |
| fixer::test::apply_one_fix_when_the_start_the_same_as_the_previous_end | non-applicable | internal-or-unexposed-support-test |
| fixer::test::apply_same_fix_when_span_overlap_regardless_of_order | non-applicable | internal-or-unexposed-support-test |
| fixer::test::create_new_fix_with_new_range_when_fixes_is_multiple | non-applicable | internal-or-unexposed-support-test |
| fixer::test::debug_assert_catches_invalid_fix | non-applicable | internal-or-unexposed-support-test |
| fixer::test::format_replace_message_for_empty_replacement | non-applicable | internal-or-unexposed-support-test |
| fixer::test::format_replace_message_for_non_empty_replacement | non-applicable | internal-or-unexposed-support-test |
| fixer::test::ignore_reverse_range | non-applicable | internal-or-unexposed-support-test |
| fixer::test::insert_at_the_end | non-applicable | internal-or-unexposed-support-test |
| fixer::test::insert_at_the_middle | non-applicable | internal-or-unexposed-support-test |
| fixer::test::insert_at_the_start | non-applicable | internal-or-unexposed-support-test |
| fixer::test::insert_at_the_start_middle_end | non-applicable | internal-or-unexposed-support-test |
| fixer::test::merge_fixes_in_composite_fix | non-applicable | internal-or-unexposed-support-test |
| fixer::test::merge_fixes_into_one | non-applicable | internal-or-unexposed-support-test |
| fixer::test::negative_ranges_in_composite_fix | non-applicable | internal-or-unexposed-support-test |
| fixer::test::one_fix_in_composite_fix | non-applicable | internal-or-unexposed-support-test |
| fixer::test::overlapping_ranges_in_composite_fix | non-applicable | internal-or-unexposed-support-test |
| fixer::test::pass_through_fixes_if_only_one_present | non-applicable | internal-or-unexposed-support-test |
| fixer::test::remove_at_the_end | non-applicable | internal-or-unexposed-support-test |
| fixer::test::remove_at_the_middle | non-applicable | internal-or-unexposed-support-test |
| fixer::test::remove_at_the_start | non-applicable | internal-or-unexposed-support-test |
| fixer::test::replace_at_start_remove_at_middle_insert_at_end | non-applicable | internal-or-unexposed-support-test |
| fixer::test::replace_at_the_end | non-applicable | internal-or-unexposed-support-test |
| fixer::test::replace_at_the_middle | non-applicable | internal-or-unexposed-support-test |
| fixer::test::replace_at_the_start | non-applicable | internal-or-unexposed-support-test |
| fixer::test::replace_at_the_start_middle_end | non-applicable | internal-or-unexposed-support-test |
| fixer::test::respect_ranges_of_empty_insertions | non-applicable | internal-or-unexposed-support-test |
| fixer::test::return_new_fix_when_fixes_is_one | non-applicable | internal-or-unexposed-support-test |
| fixer::test::should_not_apply_fix_with_one_no_fix | non-applicable | internal-or-unexposed-support-test |
| fixer::test::sort_no_fix_messages_correctly | non-applicable | internal-or-unexposed-support-test |
| fixer::test::throw_error_when_ranges_overlap | non-applicable | internal-or-unexposed-support-test |
| fixer::test::valid_fix_passes_debug_assertion | non-applicable | internal-or-unexposed-support-test |
| fixer::test::zero_fixes_in_composite_fix | non-applicable | internal-or-unexposed-support-test |
| loader::partial_loader::astro::test::test_parse_astro | non-applicable | internal-or-unexposed-support-test |
| loader::partial_loader::astro::test::test_parse_astro_frontmatter_with_later_js_separator | non-applicable | internal-or-unexposed-support-test |
| loader::partial_loader::astro::test::test_parse_astro_keeps_javascript_script_type | non-applicable | internal-or-unexposed-support-test |
| loader::partial_loader::astro::test::test_parse_astro_skips_non_javascript_script_type | non-applicable | internal-or-unexposed-support-test |
| loader::partial_loader::astro::test::test_parse_astro_with_fontmatter | non-applicable | internal-or-unexposed-support-test |
| loader::partial_loader::astro::test::test_parse_astro_with_inline_script | non-applicable | internal-or-unexposed-support-test |
| loader::partial_loader::astro::test::test_parse_astro_with_inline_script_self_closing | non-applicable | internal-or-unexposed-support-test |
| loader::partial_loader::astro::test::test_parse_astro_with_inline_script_self_closing_after_unicode | non-applicable | internal-or-unexposed-support-test |
| loader::partial_loader::astro::test::test_script_inside_code_comment | non-applicable | internal-or-unexposed-support-test |
| loader::partial_loader::svelte::test::test_parse_svelte | non-applicable | internal-or-unexposed-support-test |
| loader::partial_loader::svelte::test::test_parse_svelte_context_module_script_lang_ts | non-applicable | internal-or-unexposed-support-test |
| loader::partial_loader::svelte::test::test_parse_svelte_does_not_treat_data_language_as_lang | non-applicable | internal-or-unexposed-support-test |
| loader::partial_loader::svelte::test::test_parse_svelte_ignores_script_like_tags | non-applicable | internal-or-unexposed-support-test |
| loader::partial_loader::svelte::test::test_parse_svelte_module_script_lang_ts | non-applicable | internal-or-unexposed-support-test |
| loader::partial_loader::svelte::test::test_parse_svelte_script_tag_allows_newline_after_script_name | non-applicable | internal-or-unexposed-support-test |
| loader::partial_loader::svelte::test::test_parse_svelte_script_tag_allows_tab_after_script_name | non-applicable | internal-or-unexposed-support-test |
| loader::partial_loader::svelte::test::test_parse_svelte_script_tag_with_expression_lang_and_gt_in_other_attribute | non-applicable | internal-or-unexposed-support-test |
| loader::partial_loader::svelte::test::test_parse_svelte_script_tag_with_spaced_expression_lang_is_not_dropped | non-applicable | internal-or-unexposed-support-test |
| loader::partial_loader::svelte::test::test_parse_svelte_script_with_callback_attribute | non-applicable | internal-or-unexposed-support-test |
| loader::partial_loader::svelte::test::test_parse_svelte_script_with_callback_attribute_no_component_script | non-applicable | internal-or-unexposed-support-test |
| loader::partial_loader::svelte::test::test_parse_svelte_ts_with_generic | non-applicable | internal-or-unexposed-support-test |
| loader::partial_loader::svelte::test::test_parse_svelte_with_context_module_script | non-applicable | internal-or-unexposed-support-test |
| loader::partial_loader::svelte::test::test_parse_svelte_with_many_script_like_tags | non-applicable | internal-or-unexposed-support-test |
| loader::partial_loader::svelte::test::test_parse_svelte_with_module_script | non-applicable | internal-or-unexposed-support-test |
| loader::partial_loader::svelte::test::test_script_inside_code_comment | non-applicable | internal-or-unexposed-support-test |
| loader::partial_loader::vue::test::lang | non-applicable | internal-or-unexposed-support-test |
| loader::partial_loader::vue::test::test_brace_with_regex_in_template_literal | non-applicable | internal-or-unexposed-support-test |
| loader::partial_loader::vue::test::test_build_vue_with_escape_string | non-applicable | internal-or-unexposed-support-test |
| loader::partial_loader::vue::test::test_build_vue_with_ts_flag_1 | non-applicable | internal-or-unexposed-support-test |
| loader::partial_loader::vue::test::test_build_vue_with_ts_flag_3 | non-applicable | internal-or-unexposed-support-test |
| loader::partial_loader::vue::test::test_closing_character_inside_attribute | non-applicable | internal-or-unexposed-support-test |
| loader::partial_loader::vue::test::test_multi_level_template_literal | non-applicable | internal-or-unexposed-support-test |
| loader::partial_loader::vue::test::test_multiple_scripts | non-applicable | internal-or-unexposed-support-test |
| loader::partial_loader::vue::test::test_no_script | non-applicable | internal-or-unexposed-support-test |
| loader::partial_loader::vue::test::test_parse_vue_one_line | non-applicable | internal-or-unexposed-support-test |
| loader::partial_loader::vue::test::test_script_in_template | non-applicable | internal-or-unexposed-support-test |
| loader::partial_loader::vue::test::test_script_inside_code_comment | non-applicable | internal-or-unexposed-support-test |
| loader::partial_loader::vue::test::test_syntax_error | non-applicable | internal-or-unexposed-support-test |
| loader::partial_loader::vue::test::test_unicode | non-applicable | internal-or-unexposed-support-test |
| loader::test::test_loader_can_handle | non-applicable | internal-or-unexposed-support-test |
| options::allow_warn_deny::test::test_deserialize | non-applicable | internal-or-unexposed-support-test |
| options::allow_warn_deny::test::test_serialize | non-applicable | internal-or-unexposed-support-test |
| options::filter::test::test_eslint_deny | non-applicable | internal-or-unexposed-support-test |
| options::filter::test::test_from_category | non-applicable | internal-or-unexposed-support-test |
| options::filter::test::test_parse | non-applicable | internal-or-unexposed-support-test |
| options::filter::test::test_parse_invalid | non-applicable | internal-or-unexposed-support-test |
| rule::test::test_deserialize_default_rule_config_object_in_array | non-applicable | internal-or-unexposed-support-test |
| rule::test::test_deserialize_default_rule_config_single | non-applicable | internal-or-unexposed-support-test |
| rule::test::test_deserialize_default_rule_config_with_complex_shape | non-applicable | internal-or-unexposed-support-test |
| rule::test::test_deserialize_default_rule_config_with_enum_config | non-applicable | internal-or-unexposed-support-test |
| rule::test::test_deserialize_default_rule_with_object_with_multiple_fields | non-applicable | internal-or-unexposed-support-test |
| rule::test::test_deserialize_rule_category | non-applicable | internal-or-unexposed-support-test |
| rule::test::test_deserialize_tuple_rule_config | non-applicable | internal-or-unexposed-support-test |
| rule::test::test_deserialize_tuple_rule_config_with_enum_and_object | non-applicable | internal-or-unexposed-support-test |
| rule::test::test_rule_runner_impls | non-applicable | internal-or-unexposed-support-test |
| rules::eslint::accessor_pairs::test | non-applicable | rule-outside-v1-set |
| rules::eslint::array_callback_return::test | non-applicable | rule-outside-v1-set |
| rules::eslint::arrow_body_style::test | non-applicable | rule-outside-v1-set |
| rules::eslint::block_scoped_var::test | non-applicable | rule-outside-v1-set |
| rules::eslint::capitalized_comments::test | non-applicable | rule-outside-v1-set |
| rules::eslint::class_methods_use_this::test | non-applicable | rule-outside-v1-set |
| rules::eslint::complexity::test | non-applicable | rule-outside-v1-set |
| rules::eslint::constructor_super::test | enabled | certified-rule:eslint/constructor-super |
| rules::eslint::curly::test | non-applicable | rule-outside-v1-set |
| rules::eslint::default_case::test | non-applicable | rule-outside-v1-set |
| rules::eslint::default_case_last::test | non-applicable | rule-outside-v1-set |
| rules::eslint::default_param_last::test | non-applicable | rule-outside-v1-set |
| rules::eslint::eqeqeq::test | non-applicable | rule-outside-v1-set |
| rules::eslint::for_direction::test | enabled | certified-rule:eslint/for-direction |
| rules::eslint::func_name_matching::test | non-applicable | rule-outside-v1-set |
| rules::eslint::func_names::test | non-applicable | rule-outside-v1-set |
| rules::eslint::func_style::test | non-applicable | rule-outside-v1-set |
| rules::eslint::getter_return::test | enabled | certified-rule:eslint/getter-return |
| rules::eslint::grouped_accessor_pairs::test | non-applicable | rule-outside-v1-set |
| rules::eslint::guard_for_in::test | non-applicable | rule-outside-v1-set |
| rules::eslint::id_denylist::test | non-applicable | rule-outside-v1-set |
| rules::eslint::id_length::test | non-applicable | rule-outside-v1-set |
| rules::eslint::id_match::empty_array_uses_default_no_pattern | non-applicable | rule-outside-v1-set |
| rules::eslint::id_match::invalid_configs_error_in_from_configuration | non-applicable | rule-outside-v1-set |
| rules::eslint::id_match::test | non-applicable | rule-outside-v1-set |
| rules::eslint::id_match::test_typescript | non-applicable | rule-outside-v1-set |
| rules::eslint::init_declarations::test | non-applicable | rule-outside-v1-set |
| rules::eslint::logical_assignment_operators::test | non-applicable | rule-outside-v1-set |
| rules::eslint::max_classes_per_file::test | non-applicable | rule-outside-v1-set |
| rules::eslint::max_depth::test | non-applicable | rule-outside-v1-set |
| rules::eslint::max_lines::test | non-applicable | rule-outside-v1-set |
| rules::eslint::max_lines_per_function::test | non-applicable | rule-outside-v1-set |
| rules::eslint::max_nested_callbacks::test | non-applicable | rule-outside-v1-set |
| rules::eslint::max_params::test | non-applicable | rule-outside-v1-set |
| rules::eslint::max_statements::test | non-applicable | rule-outside-v1-set |
| rules::eslint::new_cap::invalid_configs_error_in_from_configuration | non-applicable | rule-outside-v1-set |
| rules::eslint::new_cap::test | non-applicable | rule-outside-v1-set |
| rules::eslint::no_alert::test | non-applicable | rule-outside-v1-set |
| rules::eslint::no_array_constructor::test | non-applicable | rule-outside-v1-set |
| rules::eslint::no_async_promise_executor::test | enabled | certified-rule:eslint/no-async-promise-executor |
| rules::eslint::no_await_in_loop::test | non-applicable | rule-outside-v1-set |
| rules::eslint::no_bitwise::test | non-applicable | rule-outside-v1-set |
| rules::eslint::no_caller::test | enabled | certified-rule:eslint/no-caller |
| rules::eslint::no_case_declarations::test | non-applicable | rule-outside-v1-set |
| rules::eslint::no_class_assign::test | enabled | certified-rule:eslint/no-class-assign |
| rules::eslint::no_compare_neg_zero::test | enabled | certified-rule:eslint/no-compare-neg-zero |
| rules::eslint::no_cond_assign::test | enabled | certified-rule:eslint/no-cond-assign |
| rules::eslint::no_console::test | non-applicable | rule-outside-v1-set |
| rules::eslint::no_const_assign::test | enabled | certified-rule:eslint/no-const-assign |
| rules::eslint::no_constant_binary_expression::test | enabled | certified-rule:eslint/no-constant-binary-expression |
| rules::eslint::no_constant_condition::test | enabled | certified-rule:eslint/no-constant-condition |
| rules::eslint::no_constructor_return::test | non-applicable | rule-outside-v1-set |
| rules::eslint::no_continue::test | non-applicable | rule-outside-v1-set |
| rules::eslint::no_control_regex::tests::test | enabled | certified-rule:eslint/no-control-regex |
| rules::eslint::no_control_regex::tests::test_capture_group_indexing | enabled | certified-rule:eslint/no-control-regex |
| rules::eslint::no_control_regex::tests::test_hex_literals | enabled | certified-rule:eslint/no-control-regex |
| rules::eslint::no_control_regex::tests::test_unicode_brackets | enabled | certified-rule:eslint/no-control-regex |
| rules::eslint::no_control_regex::tests::test_unicode_literals | enabled | certified-rule:eslint/no-control-regex |
| rules::eslint::no_debugger::test | enabled | certified-rule:eslint/no-debugger |
| rules::eslint::no_delete_var::test | enabled | certified-rule:eslint/no-delete-var |
| rules::eslint::no_div_regex::test | non-applicable | rule-outside-v1-set |
| rules::eslint::no_dupe_class_members::test | enabled | certified-rule:eslint/no-dupe-class-members |
| rules::eslint::no_dupe_else_if::test | enabled | certified-rule:eslint/no-dupe-else-if |
| rules::eslint::no_dupe_keys::test | enabled | certified-rule:eslint/no-dupe-keys |
| rules::eslint::no_duplicate_case::test | enabled | certified-rule:eslint/no-duplicate-case |
| rules::eslint::no_duplicate_imports::test | non-applicable | rule-outside-v1-set |
| rules::eslint::no_else_return::test | non-applicable | rule-outside-v1-set |
| rules::eslint::no_empty::test | non-applicable | rule-outside-v1-set |
| rules::eslint::no_empty_character_class::test | enabled | certified-rule:eslint/no-empty-character-class |
| rules::eslint::no_empty_function::test | non-applicable | rule-outside-v1-set |
| rules::eslint::no_empty_pattern::test | enabled | certified-rule:eslint/no-empty-pattern |
| rules::eslint::no_empty_static_block::test | enabled | certified-rule:eslint/no-empty-static-block |
| rules::eslint::no_eq_null::test | non-applicable | rule-outside-v1-set |
| rules::eslint::no_eval::test | enabled | certified-rule:eslint/no-eval |
| rules::eslint::no_ex_assign::test | enabled | certified-rule:eslint/no-ex-assign |
| rules::eslint::no_extend_native::test | non-applicable | rule-outside-v1-set |
| rules::eslint::no_extra_bind::test | non-applicable | rule-outside-v1-set |
| rules::eslint::no_extra_boolean_cast::test | enabled | certified-rule:eslint/no-extra-boolean-cast |
| rules::eslint::no_extra_label::test | non-applicable | rule-outside-v1-set |
| rules::eslint::no_fallthrough::test | non-applicable | rule-outside-v1-set |
| rules::eslint::no_func_assign::test | enabled | certified-rule:eslint/no-func-assign |
| rules::eslint::no_global_assign::test | enabled | certified-rule:eslint/no-global-assign |
| rules::eslint::no_implicit_coercion::test | non-applicable | rule-outside-v1-set |
| rules::eslint::no_implicit_globals::test | non-applicable | rule-outside-v1-set |
| rules::eslint::no_implicit_globals::test_configured_globals | non-applicable | rule-outside-v1-set |
| rules::eslint::no_implied_eval::test | non-applicable | rule-outside-v1-set |
| rules::eslint::no_implied_eval::test_typescript_wrappers | non-applicable | rule-outside-v1-set |
| rules::eslint::no_import_assign::test | enabled | certified-rule:eslint/no-import-assign |
| rules::eslint::no_inline_comments::test | non-applicable | rule-outside-v1-set |
| rules::eslint::no_inner_declarations::test | non-applicable | rule-outside-v1-set |
| rules::eslint::no_invalid_regexp::test | enabled | certified-rule:eslint/no-invalid-regexp |
| rules::eslint::no_irregular_whitespace::test | enabled | certified-rule:eslint/no-irregular-whitespace |
| rules::eslint::no_iterator::test | enabled | certified-rule:eslint/no-iterator |
| rules::eslint::no_label_var::test | non-applicable | rule-outside-v1-set |
| rules::eslint::no_labels::test | non-applicable | rule-outside-v1-set |
| rules::eslint::no_lone_blocks::test | non-applicable | rule-outside-v1-set |
| rules::eslint::no_lonely_if::test | non-applicable | rule-outside-v1-set |
| rules::eslint::no_loop_func::test | non-applicable | rule-outside-v1-set |
| rules::eslint::no_loss_of_precision::test | enabled | certified-rule:eslint/no-loss-of-precision |
| rules::eslint::no_magic_numbers::test | non-applicable | rule-outside-v1-set |
| rules::eslint::no_misleading_character_class::test | enabled | certified-rule:eslint/no-misleading-character-class |
| rules::eslint::no_multi_assign::test | non-applicable | rule-outside-v1-set |
| rules::eslint::no_multi_str::test | non-applicable | rule-outside-v1-set |
| rules::eslint::no_negated_condition::test | non-applicable | rule-outside-v1-set |
| rules::eslint::no_nested_ternary::test | non-applicable | rule-outside-v1-set |
| rules::eslint::no_new::test | non-applicable | rule-outside-v1-set |
| rules::eslint::no_new_func::test | non-applicable | rule-outside-v1-set |
| rules::eslint::no_new_native_nonconstructor::test | enabled | certified-rule:eslint/no-new-native-nonconstructor |
| rules::eslint::no_new_wrappers::test | non-applicable | rule-outside-v1-set |
| rules::eslint::no_nonoctal_decimal_escape::test | enabled | certified-rule:eslint/no-nonoctal-decimal-escape |
| rules::eslint::no_obj_calls::test | enabled | certified-rule:eslint/no-obj-calls |
| rules::eslint::no_object_constructor::test | non-applicable | rule-outside-v1-set |
| rules::eslint::no_param_reassign::test | non-applicable | rule-outside-v1-set |
| rules::eslint::no_plusplus::test | non-applicable | rule-outside-v1-set |
| rules::eslint::no_promise_executor_return::test | non-applicable | rule-outside-v1-set |
| rules::eslint::no_proto::test | non-applicable | rule-outside-v1-set |
| rules::eslint::no_prototype_builtins::test | non-applicable | rule-outside-v1-set |
| rules::eslint::no_redeclare::test | non-applicable | rule-outside-v1-set |
| rules::eslint::no_regex_spaces::test | non-applicable | rule-outside-v1-set |
| rules::eslint::no_restricted_exports::test | non-applicable | rule-outside-v1-set |
| rules::eslint::no_restricted_globals::test | non-applicable | rule-outside-v1-set |
| rules::eslint::no_restricted_imports::test | non-applicable | rule-outside-v1-set |
| rules::eslint::no_restricted_properties::invalid_configs_error_in_from_configuration | non-applicable | rule-outside-v1-set |
| rules::eslint::no_restricted_properties::test | non-applicable | rule-outside-v1-set |
| rules::eslint::no_return_assign::invalid_configs_error_in_from_configuration | non-applicable | rule-outside-v1-set |
| rules::eslint::no_return_assign::test | non-applicable | rule-outside-v1-set |
| rules::eslint::no_script_url::test | non-applicable | rule-outside-v1-set |
| rules::eslint::no_self_assign::test | enabled | certified-rule:eslint/no-self-assign |
| rules::eslint::no_self_compare::test | non-applicable | rule-outside-v1-set |
| rules::eslint::no_sequences::test | non-applicable | rule-outside-v1-set |
| rules::eslint::no_setter_return::test | enabled | certified-rule:eslint/no-setter-return |
| rules::eslint::no_shadow::tests::test_eslint | non-applicable | rule-outside-v1-set |
| rules::eslint::no_shadow::tests::test_typescript_eslint | non-applicable | rule-outside-v1-set |
| rules::eslint::no_shadow_restricted_names::test | enabled | certified-rule:eslint/no-shadow-restricted-names |
| rules::eslint::no_sparse_arrays::test | enabled | certified-rule:eslint/no-sparse-arrays |
| rules::eslint::no_template_curly_in_string::test | non-applicable | rule-outside-v1-set |
| rules::eslint::no_ternary::test | non-applicable | rule-outside-v1-set |
| rules::eslint::no_this_before_super::test | enabled | certified-rule:eslint/no-this-before-super |
| rules::eslint::no_throw_literal::test | non-applicable | rule-outside-v1-set |
| rules::eslint::no_unassigned_vars::test | enabled | certified-rule:eslint/no-unassigned-vars |
| rules::eslint::no_undef::test | non-applicable | rule-outside-v1-set |
| rules::eslint::no_undefined::test | non-applicable | rule-outside-v1-set |
| rules::eslint::no_underscore_dangle::test | non-applicable | rule-outside-v1-set |
| rules::eslint::no_unexpected_multiline::test | non-applicable | rule-outside-v1-set |
| rules::eslint::no_unmodified_loop_condition::test | non-applicable | rule-outside-v1-set |
| rules::eslint::no_unneeded_ternary::test | non-applicable | rule-outside-v1-set |
| rules::eslint::no_unreachable::test | enabled | certified-rule:eslint/no-unreachable |
| rules::eslint::no_unreachable_loop::test | non-applicable | rule-outside-v1-set |
| rules::eslint::no_unsafe_finally::test | enabled | certified-rule:eslint/no-unsafe-finally |
| rules::eslint::no_unsafe_negation::test | enabled | certified-rule:eslint/no-unsafe-negation |
| rules::eslint::no_unsafe_optional_chaining::test | enabled | certified-rule:eslint/no-unsafe-optional-chaining |
| rules::eslint::no_unused_expressions::test | enabled | certified-rule:eslint/no-unused-expressions |
| rules::eslint::no_unused_labels::test | enabled | certified-rule:eslint/no-unused-labels |
| rules::eslint::no_unused_private_class_members::test | enabled | certified-rule:eslint/no-unused-private-class-members |
| rules::eslint::no_unused_vars::ignored::test::test_ignored | enabled | certified-rule:eslint/no-unused-vars |
| rules::eslint::no_unused_vars::ignored::test::test_ignored_catch_errors | enabled | certified-rule:eslint/no-unused-vars |
| rules::eslint::no_unused_vars::options::tests::test_fix_options_sparse_defaults | enabled | certified-rule:eslint/no-unused-vars |
| rules::eslint::no_unused_vars::options::tests::test_ignore_rest_siblings_only | enabled | certified-rule:eslint/no-unused-vars |
| rules::eslint::no_unused_vars::options::tests::test_invalid | enabled | certified-rule:eslint/no-unused-vars |
| rules::eslint::no_unused_vars::options::tests::test_options_default | enabled | certified-rule:eslint/no-unused-vars |
| rules::eslint::no_unused_vars::options::tests::test_options_from_null | enabled | certified-rule:eslint/no-unused-vars |
| rules::eslint::no_unused_vars::options::tests::test_options_from_object | enabled | certified-rule:eslint/no-unused-vars |
| rules::eslint::no_unused_vars::options::tests::test_options_from_sparse_object | enabled | certified-rule:eslint/no-unused-vars |
| rules::eslint::no_unused_vars::options::tests::test_options_from_string | enabled | certified-rule:eslint/no-unused-vars |
| rules::eslint::no_unused_vars::options::tests::test_parse_unicode_regex | enabled | certified-rule:eslint/no-unused-vars |
| rules::eslint::no_unused_vars::tests::eslint::fixme | enabled | certified-rule:eslint/no-unused-vars |
| rules::eslint::no_unused_vars::tests::eslint::test | enabled | certified-rule:eslint/no-unused-vars |
| rules::eslint::no_unused_vars::tests::oxc::test_argument_parameter_rename_fix | enabled | certified-rule:eslint/no-unused-vars |
| rules::eslint::no_unused_vars::tests::oxc::test_arguments | enabled | certified-rule:eslint/no-unused-vars |
| rules::eslint::no_unused_vars::tests::oxc::test_classes | enabled | certified-rule:eslint/no-unused-vars |
| rules::eslint::no_unused_vars::tests::oxc::test_debug | enabled | certified-rule:eslint/no-unused-vars |
| rules::eslint::no_unused_vars::tests::oxc::test_enums | enabled | certified-rule:eslint/no-unused-vars |
| rules::eslint::no_unused_vars::tests::oxc::test_exports | enabled | certified-rule:eslint/no-unused-vars |
| rules::eslint::no_unused_vars::tests::oxc::test_fix_options | enabled | certified-rule:eslint/no-unused-vars |
| rules::eslint::no_unused_vars::tests::oxc::test_functions | enabled | certified-rule:eslint/no-unused-vars |
| rules::eslint::no_unused_vars::tests::oxc::test_ignore | enabled | certified-rule:eslint/no-unused-vars |
| rules::eslint::no_unused_vars::tests::oxc::test_imports | enabled | certified-rule:eslint/no-unused-vars |
| rules::eslint::no_unused_vars::tests::oxc::test_jsx_non_ascii | enabled | certified-rule:eslint/no-unused-vars |
| rules::eslint::no_unused_vars::tests::oxc::test_loops | enabled | certified-rule:eslint/no-unused-vars |
| rules::eslint::no_unused_vars::tests::oxc::test_namespaces | enabled | certified-rule:eslint/no-unused-vars |
| rules::eslint::no_unused_vars::tests::oxc::test_react | enabled | certified-rule:eslint/no-unused-vars |
| rules::eslint::no_unused_vars::tests::oxc::test_report_vars_only_used_as_types | enabled | certified-rule:eslint/no-unused-vars |
| rules::eslint::no_unused_vars::tests::oxc::test_self_call | enabled | certified-rule:eslint/no-unused-vars |
| rules::eslint::no_unused_vars::tests::oxc::test_should_run | enabled | certified-rule:eslint/no-unused-vars |
| rules::eslint::no_unused_vars::tests::oxc::test_ts_in_assignment | enabled | certified-rule:eslint/no-unused-vars |
| rules::eslint::no_unused_vars::tests::oxc::test_type_aliases | enabled | certified-rule:eslint/no-unused-vars |
| rules::eslint::no_unused_vars::tests::oxc::test_type_references | enabled | certified-rule:eslint/no-unused-vars |
| rules::eslint::no_unused_vars::tests::oxc::test_used_declarations | enabled | certified-rule:eslint/no-unused-vars |
| rules::eslint::no_unused_vars::tests::oxc::test_vars_catch | enabled | certified-rule:eslint/no-unused-vars |
| rules::eslint::no_unused_vars::tests::oxc::test_vars_destructure | enabled | certified-rule:eslint/no-unused-vars |
| rules::eslint::no_unused_vars::tests::oxc::test_vars_discarded_reads | enabled | certified-rule:eslint/no-unused-vars |
| rules::eslint::no_unused_vars::tests::oxc::test_vars_reassignment | enabled | certified-rule:eslint/no-unused-vars |
| rules::eslint::no_unused_vars::tests::oxc::test_vars_self_use | enabled | certified-rule:eslint/no-unused-vars |
| rules::eslint::no_unused_vars::tests::oxc::test_vars_self_use_js | enabled | certified-rule:eslint/no-unused-vars |
| rules::eslint::no_unused_vars::tests::oxc::test_vars_simple | enabled | certified-rule:eslint/no-unused-vars |
| rules::eslint::no_unused_vars::tests::oxc::test_vars_using | enabled | certified-rule:eslint/no-unused-vars |
| rules::eslint::no_unused_vars::tests::react::test | enabled | certified-rule:eslint/no-unused-vars |
| rules::eslint::no_unused_vars::tests::typescript_eslint::test | enabled | certified-rule:eslint/no-unused-vars |
| rules::eslint::no_unused_vars::tests::typescript_eslint::test_autofixer_imports | enabled | certified-rule:eslint/no-unused-vars |
| rules::eslint::no_unused_vars::tests::typescript_eslint::test_d_ts | enabled | certified-rule:eslint/no-unused-vars |
| rules::eslint::no_unused_vars::tests::typescript_eslint::test_tsx | enabled | certified-rule:eslint/no-unused-vars |
| rules::eslint::no_use_before_define::test | upstream-ignored | upstream-ignored-failing-eslint-cases |
| rules::eslint::no_use_before_define::test_typescript_eslint | non-applicable | rule-outside-v1-set |
| rules::eslint::no_useless_assignment::test | non-applicable | rule-outside-v1-set |
| rules::eslint::no_useless_backreference::test | enabled | certified-rule:eslint/no-useless-backreference |
| rules::eslint::no_useless_call::test | non-applicable | rule-outside-v1-set |
| rules::eslint::no_useless_catch::test | enabled | certified-rule:eslint/no-useless-catch |
| rules::eslint::no_useless_computed_key::test | non-applicable | rule-outside-v1-set |
| rules::eslint::no_useless_concat::test | non-applicable | rule-outside-v1-set |
| rules::eslint::no_useless_constructor::test | non-applicable | rule-outside-v1-set |
| rules::eslint::no_useless_escape::test | enabled | certified-rule:eslint/no-useless-escape |
| rules::eslint::no_useless_rename::test | enabled | certified-rule:eslint/no-useless-rename |
| rules::eslint::no_useless_return::test | non-applicable | rule-outside-v1-set |
| rules::eslint::no_var::test | non-applicable | rule-outside-v1-set |
| rules::eslint::no_void::test | non-applicable | rule-outside-v1-set |
| rules::eslint::no_warning_comments::test | non-applicable | rule-outside-v1-set |
| rules::eslint::no_with::test | enabled | certified-rule:eslint/no-with |
| rules::eslint::object_shorthand::test | non-applicable | rule-outside-v1-set |
| rules::eslint::operator_assignment::test | non-applicable | rule-outside-v1-set |
| rules::eslint::prefer_arrow_callback::test | non-applicable | rule-outside-v1-set |
| rules::eslint::prefer_const::test | non-applicable | rule-outside-v1-set |
| rules::eslint::prefer_const::test_oxc | non-applicable | rule-outside-v1-set |
| rules::eslint::prefer_destructuring::test | non-applicable | rule-outside-v1-set |
| rules::eslint::prefer_exponentiation_operator::test | non-applicable | rule-outside-v1-set |
| rules::eslint::prefer_named_capture_group::test | non-applicable | rule-outside-v1-set |
| rules::eslint::prefer_numeric_literals::test | non-applicable | rule-outside-v1-set |
| rules::eslint::prefer_object_has_own::test | non-applicable | rule-outside-v1-set |
| rules::eslint::prefer_object_spread::test | non-applicable | rule-outside-v1-set |
| rules::eslint::prefer_promise_reject_errors::test | non-applicable | rule-outside-v1-set |
| rules::eslint::prefer_regex_literals::test | non-applicable | rule-outside-v1-set |
| rules::eslint::prefer_rest_params::test | non-applicable | rule-outside-v1-set |
| rules::eslint::prefer_spread::test | non-applicable | rule-outside-v1-set |
| rules::eslint::prefer_template::test | non-applicable | rule-outside-v1-set |
| rules::eslint::preserve_caught_error::test | non-applicable | rule-outside-v1-set |
| rules::eslint::radix::test | non-applicable | rule-outside-v1-set |
| rules::eslint::require_await::test | non-applicable | rule-outside-v1-set |
| rules::eslint::require_unicode_regexp::test | non-applicable | rule-outside-v1-set |
| rules::eslint::require_yield::test | enabled | certified-rule:eslint/require-yield |
| rules::eslint::sort_imports::member_syntax_sort_order_deserialize_invalid_dupes | non-applicable | rule-outside-v1-set |
| rules::eslint::sort_imports::member_syntax_sort_order_deserialize_invalid_len | non-applicable | rule-outside-v1-set |
| rules::eslint::sort_imports::member_syntax_sort_order_deserialize_valid | non-applicable | rule-outside-v1-set |
| rules::eslint::sort_imports::test | non-applicable | rule-outside-v1-set |
| rules::eslint::sort_keys::test | non-applicable | rule-outside-v1-set |
| rules::eslint::sort_vars::test | non-applicable | rule-outside-v1-set |
| rules::eslint::symbol_description::test | non-applicable | rule-outside-v1-set |
| rules::eslint::unicode_bom::test | non-applicable | rule-outside-v1-set |
| rules::eslint::use_isnan::test | enabled | certified-rule:eslint/use-isnan |
| rules::eslint::valid_typeof::test | enabled | certified-rule:eslint/valid-typeof |
| rules::eslint::vars_on_top::test | non-applicable | rule-outside-v1-set |
| rules::eslint::yoda::test | non-applicable | rule-outside-v1-set |
| rules::import::consistent_type_specifier_style::test | non-applicable | rule-outside-v1-set |
| rules::import::default::test | non-applicable | rule-outside-v1-set |
| rules::import::export::test | non-applicable | rule-outside-v1-set |
| rules::import::exports_last::test | non-applicable | rule-outside-v1-set |
| rules::import::extensions::test | non-applicable | rule-outside-v1-set |
| rules::import::first::test | non-applicable | rule-outside-v1-set |
| rules::import::group_exports::test | non-applicable | rule-outside-v1-set |
| rules::import::max_dependencies::test | non-applicable | rule-outside-v1-set |
| rules::import::named::regression_extensionless_default_import_barrel | non-applicable | rule-outside-v1-set |
| rules::import::named::regression_named_reexport_is_not_default_import_barrel | non-applicable | rule-outside-v1-set |
| rules::import::named::test | non-applicable | rule-outside-v1-set |
| rules::import::namespace::test | non-applicable | rule-outside-v1-set |
| rules::import::newline_after_import::test | non-applicable | rule-outside-v1-set |
| rules::import::no_absolute_path::test | non-applicable | rule-outside-v1-set |
| rules::import::no_amd::test | non-applicable | rule-outside-v1-set |
| rules::import::no_anonymous_default_export::test | non-applicable | rule-outside-v1-set |
| rules::import::no_commonjs::test | non-applicable | rule-outside-v1-set |
| rules::import::no_cycle::test | non-applicable | rule-outside-v1-set |
| rules::import::no_cycle::test_issue_19245_type_only_branch_does_not_hide_cycle | non-applicable | rule-outside-v1-set |
| rules::import::no_cycle::test_issue_21252_reports_each_cyclic_import | non-applicable | rule-outside-v1-set |
| rules::import::no_default_export::test | non-applicable | rule-outside-v1-set |
| rules::import::no_duplicates::test | non-applicable | rule-outside-v1-set |
| rules::import::no_dynamic_require::test | non-applicable | rule-outside-v1-set |
| rules::import::no_empty_named_blocks::test | non-applicable | rule-outside-v1-set |
| rules::import::no_mutable_exports::test | non-applicable | rule-outside-v1-set |
| rules::import::no_named_as_default::test | non-applicable | rule-outside-v1-set |
| rules::import::no_named_as_default::test_type_import | non-applicable | rule-outside-v1-set |
| rules::import::no_named_as_default_member::test | non-applicable | rule-outside-v1-set |
| rules::import::no_named_default::test | non-applicable | rule-outside-v1-set |
| rules::import::no_named_export::test | non-applicable | rule-outside-v1-set |
| rules::import::no_namespace::test | non-applicable | rule-outside-v1-set |
| rules::import::no_nodejs_modules::test | non-applicable | rule-outside-v1-set |
| rules::import::no_relative_parent_imports::test | non-applicable | rule-outside-v1-set |
| rules::import::no_self_import::test | non-applicable | rule-outside-v1-set |
| rules::import::no_unassigned_import::test | non-applicable | rule-outside-v1-set |
| rules::import::no_webpack_loader_syntax::test | non-applicable | rule-outside-v1-set |
| rules::import::prefer_default_export::test | non-applicable | rule-outside-v1-set |
| rules::import::unambiguous::test | non-applicable | rule-outside-v1-set |
| rules::jest::consistent_test_it::test | non-applicable | rule-outside-v1-set |
| rules::jest::expect_expect::test | non-applicable | rule-outside-v1-set |
| rules::jest::max_expects::test | non-applicable | rule-outside-v1-set |
| rules::jest::max_nested_describe::test | non-applicable | rule-outside-v1-set |
| rules::jest::no_alias_methods::test | non-applicable | rule-outside-v1-set |
| rules::jest::no_commented_out_tests::test | non-applicable | rule-outside-v1-set |
| rules::jest::no_conditional_expect::test | non-applicable | rule-outside-v1-set |
| rules::jest::no_conditional_in_test::test | non-applicable | rule-outside-v1-set |
| rules::jest::no_confusing_set_timeout::test | non-applicable | rule-outside-v1-set |
| rules::jest::no_deprecated_functions::test_override | non-applicable | rule-outside-v1-set |
| rules::jest::no_deprecated_functions::test_version_from_config | non-applicable | rule-outside-v1-set |
| rules::jest::no_deprecated_functions::tests | non-applicable | rule-outside-v1-set |
| rules::jest::no_disabled_tests::test | non-applicable | rule-outside-v1-set |
| rules::jest::no_done_callback::test | non-applicable | rule-outside-v1-set |
| rules::jest::no_duplicate_hooks::test | non-applicable | rule-outside-v1-set |
| rules::jest::no_export::test | non-applicable | rule-outside-v1-set |
| rules::jest::no_focused_tests::test | non-applicable | rule-outside-v1-set |
| rules::jest::no_hooks::invalid_configs_error_in_from_configuration | non-applicable | rule-outside-v1-set |
| rules::jest::no_hooks::test | non-applicable | rule-outside-v1-set |
| rules::jest::no_identical_title::test | non-applicable | rule-outside-v1-set |
| rules::jest::no_interpolation_in_snapshots::test | non-applicable | rule-outside-v1-set |
| rules::jest::no_jasmine_globals::test | non-applicable | rule-outside-v1-set |
| rules::jest::no_large_snapshots::test | non-applicable | rule-outside-v1-set |
| rules::jest::no_mocks_import::test | non-applicable | rule-outside-v1-set |
| rules::jest::no_restricted_jest_methods::test | non-applicable | rule-outside-v1-set |
| rules::jest::no_restricted_matchers::test | non-applicable | rule-outside-v1-set |
| rules::jest::no_standalone_expect::test | non-applicable | rule-outside-v1-set |
| rules::jest::no_test_prefixes::test | non-applicable | rule-outside-v1-set |
| rules::jest::no_test_return_statement::test | non-applicable | rule-outside-v1-set |
| rules::jest::no_unneeded_async_expect_function::test | non-applicable | rule-outside-v1-set |
| rules::jest::no_untyped_mock_factory::test | non-applicable | rule-outside-v1-set |
| rules::jest::padding_around_after_all_blocks::test | non-applicable | rule-outside-v1-set |
| rules::jest::padding_around_test_blocks::test | non-applicable | rule-outside-v1-set |
| rules::jest::prefer_called_with::test | non-applicable | rule-outside-v1-set |
| rules::jest::prefer_comparison_matcher::test | non-applicable | rule-outside-v1-set |
| rules::jest::prefer_each::test | non-applicable | rule-outside-v1-set |
| rules::jest::prefer_ending_with_an_expect::test | non-applicable | rule-outside-v1-set |
| rules::jest::prefer_equality_matcher::test | non-applicable | rule-outside-v1-set |
| rules::jest::prefer_expect_assertions::test | non-applicable | rule-outside-v1-set |
| rules::jest::prefer_expect_resolves::tests | non-applicable | rule-outside-v1-set |
| rules::jest::prefer_hooks_in_order::test | non-applicable | rule-outside-v1-set |
| rules::jest::prefer_hooks_on_top::test | non-applicable | rule-outside-v1-set |
| rules::jest::prefer_importing_jest_globals::test | non-applicable | rule-outside-v1-set |
| rules::jest::prefer_jest_mocked::test | non-applicable | rule-outside-v1-set |
| rules::jest::prefer_lowercase_title::test | non-applicable | rule-outside-v1-set |
| rules::jest::prefer_mock_promise_shorthand::test | non-applicable | rule-outside-v1-set |
| rules::jest::prefer_mock_return_shorthand::test | non-applicable | rule-outside-v1-set |
| rules::jest::prefer_snapshot_hint::test | non-applicable | rule-outside-v1-set |
| rules::jest::prefer_spy_on::tests | non-applicable | rule-outside-v1-set |
| rules::jest::prefer_strict_equal::test | non-applicable | rule-outside-v1-set |
| rules::jest::prefer_to_be::tests | non-applicable | rule-outside-v1-set |
| rules::jest::prefer_to_contain::tests | non-applicable | rule-outside-v1-set |
| rules::jest::prefer_to_have_been_called::test | non-applicable | rule-outside-v1-set |
| rules::jest::prefer_to_have_been_called_times::test | non-applicable | rule-outside-v1-set |
| rules::jest::prefer_to_have_length::tests | non-applicable | rule-outside-v1-set |
| rules::jest::prefer_todo::tests | non-applicable | rule-outside-v1-set |
| rules::jest::require_hook::tests | non-applicable | rule-outside-v1-set |
| rules::jest::require_to_throw_message::test | non-applicable | rule-outside-v1-set |
| rules::jest::require_top_level_describe::test | non-applicable | rule-outside-v1-set |
| rules::jest::valid_describe_callback::test | non-applicable | rule-outside-v1-set |
| rules::jest::valid_expect::test | non-applicable | rule-outside-v1-set |
| rules::jest::valid_expect_in_promise::test | non-applicable | rule-outside-v1-set |
| rules::jest::valid_title::test | non-applicable | rule-outside-v1-set |
| rules::jsdoc::check_access::test | non-applicable | rule-outside-v1-set |
| rules::jsdoc::check_property_names::test | non-applicable | rule-outside-v1-set |
| rules::jsdoc::check_tag_names::test | non-applicable | rule-outside-v1-set |
| rules::jsdoc::empty_tags::test | non-applicable | rule-outside-v1-set |
| rules::jsdoc::implements_on_classes::test | non-applicable | rule-outside-v1-set |
| rules::jsdoc::no_defaults::test | non-applicable | rule-outside-v1-set |
| rules::jsdoc::require_param::test | non-applicable | rule-outside-v1-set |
| rules::jsdoc::require_param_description::test | non-applicable | rule-outside-v1-set |
| rules::jsdoc::require_param_name::test | non-applicable | rule-outside-v1-set |
| rules::jsdoc::require_param_type::test | non-applicable | rule-outside-v1-set |
| rules::jsdoc::require_property::test | non-applicable | rule-outside-v1-set |
| rules::jsdoc::require_property_description::test | non-applicable | rule-outside-v1-set |
| rules::jsdoc::require_property_name::test | non-applicable | rule-outside-v1-set |
| rules::jsdoc::require_property_type::test | non-applicable | rule-outside-v1-set |
| rules::jsdoc::require_returns::test | non-applicable | rule-outside-v1-set |
| rules::jsdoc::require_returns_description::test | non-applicable | rule-outside-v1-set |
| rules::jsdoc::require_returns_type::test | non-applicable | rule-outside-v1-set |
| rules::jsdoc::require_throws_description::test | non-applicable | rule-outside-v1-set |
| rules::jsdoc::require_throws_type::test | non-applicable | rule-outside-v1-set |
| rules::jsdoc::require_yields::test | non-applicable | rule-outside-v1-set |
| rules::jsdoc::require_yields_description::test | non-applicable | rule-outside-v1-set |
| rules::jsdoc::require_yields_type::test | non-applicable | rule-outside-v1-set |
| rules::jsx_a11y::alt_text::test | non-applicable | rule-outside-v1-set |
| rules::jsx_a11y::anchor_ambiguous_text::test | non-applicable | rule-outside-v1-set |
| rules::jsx_a11y::anchor_has_content::test | non-applicable | rule-outside-v1-set |
| rules::jsx_a11y::anchor_is_valid::test | non-applicable | rule-outside-v1-set |
| rules::jsx_a11y::aria_activedescendant_has_tabindex::test | non-applicable | rule-outside-v1-set |
| rules::jsx_a11y::aria_props::test | non-applicable | rule-outside-v1-set |
| rules::jsx_a11y::aria_proptypes::test | non-applicable | rule-outside-v1-set |
| rules::jsx_a11y::aria_role::test | non-applicable | rule-outside-v1-set |
| rules::jsx_a11y::aria_unsupported_elements::test | non-applicable | rule-outside-v1-set |
| rules::jsx_a11y::autocomplete_valid::test | non-applicable | rule-outside-v1-set |
| rules::jsx_a11y::click_events_have_key_events::test | non-applicable | rule-outside-v1-set |
| rules::jsx_a11y::control_has_associated_label::test_no_config | non-applicable | rule-outside-v1-set |
| rules::jsx_a11y::control_has_associated_label::test_recommended | non-applicable | rule-outside-v1-set |
| rules::jsx_a11y::control_has_associated_label::test_strict | non-applicable | rule-outside-v1-set |
| rules::jsx_a11y::heading_has_content::test | non-applicable | rule-outside-v1-set |
| rules::jsx_a11y::heading_has_content::test_headers_is_alphabetized | non-applicable | rule-outside-v1-set |
| rules::jsx_a11y::html_has_lang::test | non-applicable | rule-outside-v1-set |
| rules::jsx_a11y::iframe_has_title::test | non-applicable | rule-outside-v1-set |
| rules::jsx_a11y::img_redundant_alt::test | non-applicable | rule-outside-v1-set |
| rules::jsx_a11y::interactive_supports_focus::test | non-applicable | rule-outside-v1-set |
| rules::jsx_a11y::label_has_associated_control::test | non-applicable | rule-outside-v1-set |
| rules::jsx_a11y::lang::test | non-applicable | rule-outside-v1-set |
| rules::jsx_a11y::media_has_caption::test | non-applicable | rule-outside-v1-set |
| rules::jsx_a11y::mouse_events_have_key_events::test | non-applicable | rule-outside-v1-set |
| rules::jsx_a11y::no_access_key::test | non-applicable | rule-outside-v1-set |
| rules::jsx_a11y::no_aria_hidden_on_focusable::test | non-applicable | rule-outside-v1-set |
| rules::jsx_a11y::no_autofocus::test | non-applicable | rule-outside-v1-set |
| rules::jsx_a11y::no_distracting_elements::test | non-applicable | rule-outside-v1-set |
| rules::jsx_a11y::no_interactive_element_to_noninteractive_role::test | non-applicable | rule-outside-v1-set |
| rules::jsx_a11y::no_noninteractive_element_interactions::test | non-applicable | rule-outside-v1-set |
| rules::jsx_a11y::no_noninteractive_element_to_interactive_role::test | non-applicable | rule-outside-v1-set |
| rules::jsx_a11y::no_noninteractive_tabindex::test | non-applicable | rule-outside-v1-set |
| rules::jsx_a11y::no_redundant_roles::test | non-applicable | rule-outside-v1-set |
| rules::jsx_a11y::no_static_element_interactions::test | non-applicable | rule-outside-v1-set |
| rules::jsx_a11y::prefer_tag_over_role::test | non-applicable | rule-outside-v1-set |
| rules::jsx_a11y::role_has_required_aria_props::test | non-applicable | rule-outside-v1-set |
| rules::jsx_a11y::role_supports_aria_props::test | non-applicable | rule-outside-v1-set |
| rules::jsx_a11y::scope::test | non-applicable | rule-outside-v1-set |
| rules::jsx_a11y::tabindex_no_positive::test | non-applicable | rule-outside-v1-set |
| rules::nextjs::google_font_display::test | non-applicable | rule-outside-v1-set |
| rules::nextjs::google_font_preconnect::test | non-applicable | rule-outside-v1-set |
| rules::nextjs::inline_script_id::test | non-applicable | rule-outside-v1-set |
| rules::nextjs::next_script_for_ga::test | non-applicable | rule-outside-v1-set |
| rules::nextjs::no_assign_module_variable::test | non-applicable | rule-outside-v1-set |
| rules::nextjs::no_async_client_component::test | non-applicable | rule-outside-v1-set |
| rules::nextjs::no_before_interactive_script_outside_document::test | non-applicable | rule-outside-v1-set |
| rules::nextjs::no_css_tags::test | non-applicable | rule-outside-v1-set |
| rules::nextjs::no_document_import_in_page::test | non-applicable | rule-outside-v1-set |
| rules::nextjs::no_duplicate_head::test | non-applicable | rule-outside-v1-set |
| rules::nextjs::no_head_element::test | non-applicable | rule-outside-v1-set |
| rules::nextjs::no_head_import_in_document::test | non-applicable | rule-outside-v1-set |
| rules::nextjs::no_html_link_for_pages::test | non-applicable | rule-outside-v1-set |
| rules::nextjs::no_html_link_for_pages::test_is_internal_page_link | non-applicable | rule-outside-v1-set |
| rules::nextjs::no_img_element::test | non-applicable | rule-outside-v1-set |
| rules::nextjs::no_page_custom_font::test | non-applicable | rule-outside-v1-set |
| rules::nextjs::no_script_component_in_head::test | non-applicable | rule-outside-v1-set |
| rules::nextjs::no_styled_jsx_in_document::test | non-applicable | rule-outside-v1-set |
| rules::nextjs::no_sync_scripts::test | non-applicable | rule-outside-v1-set |
| rules::nextjs::no_title_in_document_head::test | non-applicable | rule-outside-v1-set |
| rules::nextjs::no_typos::test | non-applicable | rule-outside-v1-set |
| rules::nextjs::no_unwanted_polyfillio::test | non-applicable | rule-outside-v1-set |
| rules::node::callback_return::test | non-applicable | rule-outside-v1-set |
| rules::node::exports_style::test | non-applicable | rule-outside-v1-set |
| rules::node::global_require::test | non-applicable | rule-outside-v1-set |
| rules::node::handle_callback_err::test | non-applicable | rule-outside-v1-set |
| rules::node::no_exports_assign::test | non-applicable | rule-outside-v1-set |
| rules::node::no_mixed_requires::test | non-applicable | rule-outside-v1-set |
| rules::node::no_new_require::test | non-applicable | rule-outside-v1-set |
| rules::node::no_path_concat::test | non-applicable | rule-outside-v1-set |
| rules::node::no_process_env::test | non-applicable | rule-outside-v1-set |
| rules::node::no_sync::test | non-applicable | rule-outside-v1-set |
| rules::node::no_top_level_await::test | non-applicable | rule-outside-v1-set |
| rules::oxc::approx_constant::test | non-applicable | rule-outside-v1-set |
| rules::oxc::bad_array_method_on_arguments::test | enabled | certified-rule:oxc/bad-array-method-on-arguments |
| rules::oxc::bad_array_method_on_arguments::test_array_is_sorted | enabled | certified-rule:oxc/bad-array-method-on-arguments |
| rules::oxc::bad_bitwise_operator::test | non-applicable | rule-outside-v1-set |
| rules::oxc::bad_char_at_comparison::test | enabled | certified-rule:oxc/bad-char-at-comparison |
| rules::oxc::bad_comparison_sequence::test | enabled | certified-rule:oxc/bad-comparison-sequence |
| rules::oxc::bad_match_all_arg::test | enabled | certified-rule:oxc/bad-match-all-arg |
| rules::oxc::bad_min_max_func::test | enabled | certified-rule:oxc/bad-min-max-func |
| rules::oxc::bad_object_literal_comparison::test | enabled | certified-rule:oxc/bad-object-literal-comparison |
| rules::oxc::bad_replace_all_arg::test | enabled | certified-rule:oxc/bad-replace-all-arg |
| rules::oxc::branches_sharing_code::test | non-applicable | rule-outside-v1-set |
| rules::oxc::const_comparisons::test | enabled | certified-rule:oxc/const-comparisons |
| rules::oxc::double_comparisons::test | enabled | certified-rule:oxc/double-comparisons |
| rules::oxc::erasing_op::test | enabled | certified-rule:oxc/erasing-op |
| rules::oxc::misrefactored_assign_op::test | non-applicable | rule-outside-v1-set |
| rules::oxc::missing_throw::test | enabled | certified-rule:oxc/missing-throw |
| rules::oxc::no_accumulating_spread::test | non-applicable | rule-outside-v1-set |
| rules::oxc::no_async_await::test | non-applicable | rule-outside-v1-set |
| rules::oxc::no_async_endpoint_handlers::test | non-applicable | rule-outside-v1-set |
| rules::oxc::no_barrel_file::test | non-applicable | rule-outside-v1-set |
| rules::oxc::no_const_enum::test | non-applicable | rule-outside-v1-set |
| rules::oxc::no_map_spread::test | non-applicable | rule-outside-v1-set |
| rules::oxc::no_optional_chaining::test | non-applicable | rule-outside-v1-set |
| rules::oxc::no_rest_spread_properties::test | non-applicable | rule-outside-v1-set |
| rules::oxc::no_this_in_exported_function::test | non-applicable | rule-outside-v1-set |
| rules::oxc::number_arg_out_of_range::test | enabled | certified-rule:oxc/number-arg-out-of-range |
| rules::oxc::only_used_in_recursion::test | enabled | certified-rule:oxc/only-used-in-recursion |
| rules::oxc::uninvoked_array_callback::test | enabled | certified-rule:oxc/uninvoked-array-callback |
| rules::promise::always_return::test | non-applicable | rule-outside-v1-set |
| rules::promise::avoid_new::test | non-applicable | rule-outside-v1-set |
| rules::promise::catch_or_return::test | non-applicable | rule-outside-v1-set |
| rules::promise::no_callback_in_promise::test | non-applicable | rule-outside-v1-set |
| rules::promise::no_multiple_resolved::test | non-applicable | rule-outside-v1-set |
| rules::promise::no_nesting::test | non-applicable | rule-outside-v1-set |
| rules::promise::no_new_statics::test | non-applicable | rule-outside-v1-set |
| rules::promise::no_promise_in_callback::test | non-applicable | rule-outside-v1-set |
| rules::promise::no_return_in_finally::test | non-applicable | rule-outside-v1-set |
| rules::promise::no_return_wrap::test | non-applicable | rule-outside-v1-set |
| rules::promise::param_names::test | non-applicable | rule-outside-v1-set |
| rules::promise::prefer_await_to_callbacks::test | non-applicable | rule-outside-v1-set |
| rules::promise::prefer_await_to_then::test | non-applicable | rule-outside-v1-set |
| rules::promise::prefer_catch::test | non-applicable | rule-outside-v1-set |
| rules::promise::spec_only::test | non-applicable | rule-outside-v1-set |
| rules::promise::valid_params::test | non-applicable | rule-outside-v1-set |
| rules::react::button_has_type::test | non-applicable | rule-outside-v1-set |
| rules::react::checked_requires_onchange_or_readonly::test | non-applicable | rule-outside-v1-set |
| rules::react::display_name::test | non-applicable | rule-outside-v1-set |
| rules::react::exhaustive_deps::invalid_configs_error_in_from_configuration | non-applicable | rule-outside-v1-set |
| rules::react::exhaustive_deps::test | non-applicable | rule-outside-v1-set |
| rules::react::forbid_component_props::invalid_configs_error_in_from_configuration | non-applicable | rule-outside-v1-set |
| rules::react::forbid_component_props::test | non-applicable | rule-outside-v1-set |
| rules::react::forbid_dom_props::test | non-applicable | rule-outside-v1-set |
| rules::react::forbid_elements::test | non-applicable | rule-outside-v1-set |
| rules::react::forward_ref_uses_ref::test | non-applicable | rule-outside-v1-set |
| rules::react::function_component_definition::test | non-applicable | rule-outside-v1-set |
| rules::react::hook_use_state::test | non-applicable | rule-outside-v1-set |
| rules::react::iframe_missing_sandbox::test | non-applicable | rule-outside-v1-set |
| rules::react::jsx_boolean_value::test | non-applicable | rule-outside-v1-set |
| rules::react::jsx_curly_brace_presence::test | non-applicable | rule-outside-v1-set |
| rules::react::jsx_filename_extension::test | non-applicable | rule-outside-v1-set |
| rules::react::jsx_fragments::test | non-applicable | rule-outside-v1-set |
| rules::react::jsx_handler_names::test | non-applicable | rule-outside-v1-set |
| rules::react::jsx_handler_names::test_normalize_handler_name | non-applicable | rule-outside-v1-set |
| rules::react::jsx_key::test | non-applicable | rule-outside-v1-set |
| rules::react::jsx_max_depth::test | non-applicable | rule-outside-v1-set |
| rules::react::jsx_no_comment_textnodes::test | non-applicable | rule-outside-v1-set |
| rules::react::jsx_no_constructed_context_values::test | non-applicable | rule-outside-v1-set |
| rules::react::jsx_no_duplicate_props::test | non-applicable | rule-outside-v1-set |
| rules::react::jsx_no_literals::test | non-applicable | rule-outside-v1-set |
| rules::react::jsx_no_script_url::test | non-applicable | rule-outside-v1-set |
| rules::react::jsx_no_target_blank::test | non-applicable | rule-outside-v1-set |
| rules::react::jsx_no_undef::test | non-applicable | rule-outside-v1-set |
| rules::react::jsx_no_useless_fragment::test | non-applicable | rule-outside-v1-set |
| rules::react::jsx_pascal_case::test | non-applicable | rule-outside-v1-set |
| rules::react::jsx_props_no_spread_multi::test | non-applicable | rule-outside-v1-set |
| rules::react::jsx_props_no_spreading::test | non-applicable | rule-outside-v1-set |
| rules::react::no_array_index_key::test | non-applicable | rule-outside-v1-set |
| rules::react::no_children_prop::test | non-applicable | rule-outside-v1-set |
| rules::react::no_clone_element::test | non-applicable | rule-outside-v1-set |
| rules::react::no_danger::test | non-applicable | rule-outside-v1-set |
| rules::react::no_danger_with_children::test | non-applicable | rule-outside-v1-set |
| rules::react::no_did_mount_set_state::test | non-applicable | rule-outside-v1-set |
| rules::react::no_did_mount_set_state::test_disallow_in_func | non-applicable | rule-outside-v1-set |
| rules::react::no_did_update_set_state::test | non-applicable | rule-outside-v1-set |
| rules::react::no_direct_mutation_state::test | non-applicable | rule-outside-v1-set |
| rules::react::no_find_dom_node::test | non-applicable | rule-outside-v1-set |
| rules::react::no_is_mounted::test | non-applicable | rule-outside-v1-set |
| rules::react::no_multi_comp::test | non-applicable | rule-outside-v1-set |
| rules::react::no_namespace::test | non-applicable | rule-outside-v1-set |
| rules::react::no_object_type_as_default_prop::test | non-applicable | rule-outside-v1-set |
| rules::react::no_react_children::test | non-applicable | rule-outside-v1-set |
| rules::react::no_redundant_should_component_update::test | non-applicable | rule-outside-v1-set |
| rules::react::no_render_return_value::test | non-applicable | rule-outside-v1-set |
| rules::react::no_set_state::test | non-applicable | rule-outside-v1-set |
| rules::react::no_string_refs::test | non-applicable | rule-outside-v1-set |
| rules::react::no_this_in_sfc::test | non-applicable | rule-outside-v1-set |
| rules::react::no_unescaped_entities::test | non-applicable | rule-outside-v1-set |
| rules::react::no_unknown_property::test | non-applicable | rule-outside-v1-set |
| rules::react::no_unsafe::test | non-applicable | rule-outside-v1-set |
| rules::react::no_unstable_nested_components::test | non-applicable | rule-outside-v1-set |
| rules::react::no_will_update_set_state::test | non-applicable | rule-outside-v1-set |
| rules::react::only_export_components::test | non-applicable | rule-outside-v1-set |
| rules::react::only_export_components::test_js_file_extension | non-applicable | rule-outside-v1-set |
| rules::react::prefer_es6_class::test | non-applicable | rule-outside-v1-set |
| rules::react::prefer_function_component::test | non-applicable | rule-outside-v1-set |
| rules::react::react_compiler::test | non-applicable | rule-outside-v1-set |
| rules::react::react_in_jsx_scope::test | non-applicable | rule-outside-v1-set |
| rules::react::require_render_return::test | non-applicable | rule-outside-v1-set |
| rules::react::rules_of_hooks::test | non-applicable | rule-outside-v1-set |
| rules::react::self_closing_comp::test | non-applicable | rule-outside-v1-set |
| rules::react::state_in_constructor::test | non-applicable | rule-outside-v1-set |
| rules::react::style_prop_object::test | non-applicable | rule-outside-v1-set |
| rules::react::void_dom_elements_no_children::test | non-applicable | rule-outside-v1-set |
| rules::react_perf::jsx_no_jsx_as_prop::test | non-applicable | rule-outside-v1-set |
| rules::react_perf::jsx_no_new_array_as_prop::test | non-applicable | rule-outside-v1-set |
| rules::react_perf::jsx_no_new_function_as_prop::test | non-applicable | rule-outside-v1-set |
| rules::react_perf::jsx_no_new_object_as_prop::test | non-applicable | rule-outside-v1-set |
| rules::typescript::adjacent_overload_signatures::test | non-applicable | rule-outside-v1-set |
| rules::typescript::array_type::test | non-applicable | rule-outside-v1-set |
| rules::typescript::ban_ts_comment::test | non-applicable | rule-outside-v1-set |
| rules::typescript::ban_tslint_comment::test | non-applicable | rule-outside-v1-set |
| rules::typescript::ban_types::test | non-applicable | rule-outside-v1-set |
| rules::typescript::class_literal_property_style::test | non-applicable | rule-outside-v1-set |
| rules::typescript::consistent_generic_constructors::test | non-applicable | rule-outside-v1-set |
| rules::typescript::consistent_indexed_object_style::test | non-applicable | rule-outside-v1-set |
| rules::typescript::consistent_type_assertions::test | non-applicable | rule-outside-v1-set |
| rules::typescript::consistent_type_definitions::test | non-applicable | rule-outside-v1-set |
| rules::typescript::consistent_type_imports::test | non-applicable | rule-outside-v1-set |
| rules::typescript::consistent_type_imports::test_should_run | non-applicable | rule-outside-v1-set |
| rules::typescript::explicit_function_return_type::test | non-applicable | rule-outside-v1-set |
| rules::typescript::explicit_member_accessibility::test | non-applicable | rule-outside-v1-set |
| rules::typescript::explicit_module_boundary_types::test::config | non-applicable | rule-outside-v1-set |
| rules::typescript::explicit_module_boundary_types::test::rule | non-applicable | rule-outside-v1-set |
| rules::typescript::explicit_module_boundary_types::test::rule_typescript_angle_bracket_type_assertions | non-applicable | rule-outside-v1-set |
| rules::typescript::method_signature_style::test | non-applicable | rule-outside-v1-set |
| rules::typescript::no_confusing_non_null_assertion::test | non-applicable | rule-outside-v1-set |
| rules::typescript::no_duplicate_enum_values::test | enabled | certified-rule:typescript/no-duplicate-enum-values |
| rules::typescript::no_dynamic_delete::test | non-applicable | rule-outside-v1-set |
| rules::typescript::no_empty_interface::test | non-applicable | rule-outside-v1-set |
| rules::typescript::no_empty_object_type::test | non-applicable | rule-outside-v1-set |
| rules::typescript::no_explicit_any::tests::test | non-applicable | rule-outside-v1-set |
| rules::typescript::no_explicit_any::tests::test_simple | non-applicable | rule-outside-v1-set |
| rules::typescript::no_extra_non_null_assertion::test | enabled | certified-rule:typescript/no-extra-non-null-assertion |
| rules::typescript::no_extraneous_class::test | non-applicable | rule-outside-v1-set |
| rules::typescript::no_floating_promises::tests::test_all_specifier_types | non-applicable | rule-outside-v1-set |
| rules::typescript::no_floating_promises::tests::test_default_config | non-applicable | rule-outside-v1-set |
| rules::typescript::no_floating_promises::tests::test_from_configuration | non-applicable | rule-outside-v1-set |
| rules::typescript::no_floating_promises::tests::test_round_trip | non-applicable | rule-outside-v1-set |
| rules::typescript::no_import_type_side_effects::test | non-applicable | rule-outside-v1-set |
| rules::typescript::no_inferrable_types::test | non-applicable | rule-outside-v1-set |
| rules::typescript::no_invalid_void_type::test | non-applicable | rule-outside-v1-set |
| rules::typescript::no_misused_new::test | enabled | certified-rule:typescript/no-misused-new |
| rules::typescript::no_namespace::test | non-applicable | rule-outside-v1-set |
| rules::typescript::no_non_null_asserted_nullish_coalescing::test | non-applicable | rule-outside-v1-set |
| rules::typescript::no_non_null_asserted_optional_chain::test | enabled | certified-rule:typescript/no-non-null-asserted-optional-chain |
| rules::typescript::no_non_null_assertion::test | non-applicable | rule-outside-v1-set |
| rules::typescript::no_require_imports::test | non-applicable | rule-outside-v1-set |
| rules::typescript::no_restricted_types::test | non-applicable | rule-outside-v1-set |
| rules::typescript::no_this_alias::test | enabled | certified-rule:typescript/no-this-alias |
| rules::typescript::no_unnecessary_parameter_property_assignment::test | enabled | certified-rule:typescript/no-unnecessary-parameter-property-assignment |
| rules::typescript::no_unnecessary_type_constraint::test | non-applicable | rule-outside-v1-set |
| rules::typescript::no_unsafe_declaration_merging::test | enabled | certified-rule:typescript/no-unsafe-declaration-merging |
| rules::typescript::no_unsafe_function_type::test | non-applicable | rule-outside-v1-set |
| rules::typescript::no_useless_empty_export::test | enabled | certified-rule:typescript/no-useless-empty-export |
| rules::typescript::no_var_requires::test | non-applicable | rule-outside-v1-set |
| rules::typescript::no_wrapper_object_types::test | enabled | certified-rule:typescript/no-wrapper-object-types |
| rules::typescript::parameter_properties::test | non-applicable | rule-outside-v1-set |
| rules::typescript::prefer_as_const::test | enabled | certified-rule:typescript/prefer-as-const |
| rules::typescript::prefer_enum_initializers::test | non-applicable | rule-outside-v1-set |
| rules::typescript::prefer_for_of::test | non-applicable | rule-outside-v1-set |
| rules::typescript::prefer_function_type::test | non-applicable | rule-outside-v1-set |
| rules::typescript::prefer_literal_enum_member::test | non-applicable | rule-outside-v1-set |
| rules::typescript::prefer_namespace_keyword::test | enabled | certified-rule:typescript/prefer-namespace-keyword |
| rules::typescript::prefer_ts_expect_error::test | non-applicable | rule-outside-v1-set |
| rules::typescript::triple_slash_reference::test | enabled | certified-rule:typescript/triple-slash-reference |
| rules::typescript::unified_signatures::test | non-applicable | rule-outside-v1-set |
| rules::unicorn::catch_error_name::test | non-applicable | rule-outside-v1-set |
| rules::unicorn::consistent_assert::test | non-applicable | rule-outside-v1-set |
| rules::unicorn::consistent_date_clone::test | non-applicable | rule-outside-v1-set |
| rules::unicorn::consistent_empty_array_spread::test | non-applicable | rule-outside-v1-set |
| rules::unicorn::consistent_existence_index_check::test | non-applicable | rule-outside-v1-set |
| rules::unicorn::consistent_function_scoping::test | non-applicable | rule-outside-v1-set |
| rules::unicorn::consistent_template_literal_escape::test | non-applicable | rule-outside-v1-set |
| rules::unicorn::custom_error_definition::test | non-applicable | rule-outside-v1-set |
| rules::unicorn::empty_brace_spaces::test | non-applicable | rule-outside-v1-set |
| rules::unicorn::error_message::test | non-applicable | rule-outside-v1-set |
| rules::unicorn::escape_case::test | non-applicable | rule-outside-v1-set |
| rules::unicorn::explicit_length_check::test | non-applicable | rule-outside-v1-set |
| rules::unicorn::explicit_timer_delay::test | non-applicable | rule-outside-v1-set |
| rules::unicorn::filename_case::test | non-applicable | rule-outside-v1-set |
| rules::unicorn::import_style::internal_tests::accepts_false_module_style_override | non-applicable | rule-outside-v1-set |
| rules::unicorn::import_style::internal_tests::rejects_true_module_style_override | non-applicable | rule-outside-v1-set |
| rules::unicorn::import_style::test | non-applicable | rule-outside-v1-set |
| rules::unicorn::max_nested_calls::test | non-applicable | rule-outside-v1-set |
| rules::unicorn::new_for_builtins::test | non-applicable | rule-outside-v1-set |
| rules::unicorn::no_abusive_eslint_disable::test | non-applicable | rule-outside-v1-set |
| rules::unicorn::no_accessor_recursion::test | non-applicable | rule-outside-v1-set |
| rules::unicorn::no_anonymous_default_export::test | non-applicable | rule-outside-v1-set |
| rules::unicorn::no_array_callback_reference::test | non-applicable | rule-outside-v1-set |
| rules::unicorn::no_array_fill_with_reference_type::test | non-applicable | rule-outside-v1-set |
| rules::unicorn::no_array_for_each::test | non-applicable | rule-outside-v1-set |
| rules::unicorn::no_array_method_this_argument::test | non-applicable | rule-outside-v1-set |
| rules::unicorn::no_array_reduce::test | non-applicable | rule-outside-v1-set |
| rules::unicorn::no_array_reverse::test | non-applicable | rule-outside-v1-set |
| rules::unicorn::no_array_sort::test | non-applicable | rule-outside-v1-set |
| rules::unicorn::no_await_expression_member::test | non-applicable | rule-outside-v1-set |
| rules::unicorn::no_await_in_promise_methods::test | enabled | certified-rule:unicorn/no-await-in-promise-methods |
| rules::unicorn::no_confusing_array_with::test | non-applicable | rule-outside-v1-set |
| rules::unicorn::no_console_spaces::test | non-applicable | rule-outside-v1-set |
| rules::unicorn::no_document_cookie::test | non-applicable | rule-outside-v1-set |
| rules::unicorn::no_empty_file::test | enabled | certified-rule:unicorn/no-empty-file |
| rules::unicorn::no_hex_escape::test | non-applicable | rule-outside-v1-set |
| rules::unicorn::no_hex_escape::test_check_escape | non-applicable | rule-outside-v1-set |
| rules::unicorn::no_immediate_mutation::test | non-applicable | rule-outside-v1-set |
| rules::unicorn::no_instanceof_array::test | non-applicable | rule-outside-v1-set |
| rules::unicorn::no_instanceof_builtins::test | non-applicable | rule-outside-v1-set |
| rules::unicorn::no_invalid_fetch_options::test | enabled | certified-rule:unicorn/no-invalid-fetch-options |
| rules::unicorn::no_invalid_remove_event_listener::test | enabled | certified-rule:unicorn/no-invalid-remove-event-listener |
| rules::unicorn::no_length_as_slice_end::test | non-applicable | rule-outside-v1-set |
| rules::unicorn::no_lonely_if::test | non-applicable | rule-outside-v1-set |
| rules::unicorn::no_magic_array_flat_depth::test | non-applicable | rule-outside-v1-set |
| rules::unicorn::no_negated_condition::test | non-applicable | rule-outside-v1-set |
| rules::unicorn::no_negation_in_equality_check::test | non-applicable | rule-outside-v1-set |
| rules::unicorn::no_nested_ternary::test | non-applicable | rule-outside-v1-set |
| rules::unicorn::no_new_array::test | enabled | certified-rule:unicorn/no-new-array |
| rules::unicorn::no_new_buffer::test | non-applicable | rule-outside-v1-set |
| rules::unicorn::no_null::test | non-applicable | rule-outside-v1-set |
| rules::unicorn::no_object_as_default_parameter::test | non-applicable | rule-outside-v1-set |
| rules::unicorn::no_process_exit::test | non-applicable | rule-outside-v1-set |
| rules::unicorn::no_single_promise_in_promise_methods::test | enabled | certified-rule:unicorn/no-single-promise-in-promise-methods |
| rules::unicorn::no_static_only_class::test | non-applicable | rule-outside-v1-set |
| rules::unicorn::no_thenable::test | enabled | certified-rule:unicorn/no-thenable |
| rules::unicorn::no_this_assignment::test | non-applicable | rule-outside-v1-set |
| rules::unicorn::no_typeof_undefined::test | non-applicable | rule-outside-v1-set |
| rules::unicorn::no_unnecessary_array_flat_depth::test | non-applicable | rule-outside-v1-set |
| rules::unicorn::no_unnecessary_array_splice_count::test | non-applicable | rule-outside-v1-set |
| rules::unicorn::no_unnecessary_await::test | enabled | certified-rule:unicorn/no-unnecessary-await |
| rules::unicorn::no_unnecessary_slice_end::test | non-applicable | rule-outside-v1-set |
| rules::unicorn::no_unreadable_array_destructuring::test | non-applicable | rule-outside-v1-set |
| rules::unicorn::no_unreadable_iife::test | non-applicable | rule-outside-v1-set |
| rules::unicorn::no_useless_collection_argument::test | non-applicable | rule-outside-v1-set |
| rules::unicorn::no_useless_error_capture_stack_trace::test | non-applicable | rule-outside-v1-set |
| rules::unicorn::no_useless_fallback_in_spread::test | enabled | certified-rule:unicorn/no-useless-fallback-in-spread |
| rules::unicorn::no_useless_iterator_to_array::test | non-applicable | rule-outside-v1-set |
| rules::unicorn::no_useless_length_check::test | enabled | certified-rule:unicorn/no-useless-length-check |
| rules::unicorn::no_useless_promise_resolve_reject::test | non-applicable | rule-outside-v1-set |
| rules::unicorn::no_useless_spread::test | enabled | certified-rule:unicorn/no-useless-spread |
| rules::unicorn::no_useless_switch_case::test | non-applicable | rule-outside-v1-set |
| rules::unicorn::no_useless_undefined::test | non-applicable | rule-outside-v1-set |
| rules::unicorn::no_useless_undefined::test_config_array_format | non-applicable | rule-outside-v1-set |
| rules::unicorn::no_useless_undefined::test_issue_14368 | non-applicable | rule-outside-v1-set |
| rules::unicorn::no_zero_fractions::test | non-applicable | rule-outside-v1-set |
| rules::unicorn::number_literal_case::test | non-applicable | rule-outside-v1-set |
| rules::unicorn::numeric_separators_style::internal_tests::test_from_configuration | non-applicable | rule-outside-v1-set |
| rules::unicorn::numeric_separators_style::internal_tests::test_from_empty_configuration | non-applicable | rule-outside-v1-set |
| rules::unicorn::numeric_separators_style::test | non-applicable | rule-outside-v1-set |
| rules::unicorn::prefer_add_event_listener::test | non-applicable | rule-outside-v1-set |
| rules::unicorn::prefer_array_find::test | non-applicable | rule-outside-v1-set |
| rules::unicorn::prefer_array_flat::test | non-applicable | rule-outside-v1-set |
| rules::unicorn::prefer_array_flat_map::test | non-applicable | rule-outside-v1-set |
| rules::unicorn::prefer_array_index_of::test | non-applicable | rule-outside-v1-set |
| rules::unicorn::prefer_array_some::test | non-applicable | rule-outside-v1-set |
| rules::unicorn::prefer_at::test | non-applicable | rule-outside-v1-set |
| rules::unicorn::prefer_bigint_literals::test | non-applicable | rule-outside-v1-set |
| rules::unicorn::prefer_blob_reading_methods::test | non-applicable | rule-outside-v1-set |
| rules::unicorn::prefer_class_fields::test | non-applicable | rule-outside-v1-set |
| rules::unicorn::prefer_classlist_toggle::test | non-applicable | rule-outside-v1-set |
| rules::unicorn::prefer_code_point::test | non-applicable | rule-outside-v1-set |
| rules::unicorn::prefer_date_now::test | non-applicable | rule-outside-v1-set |
| rules::unicorn::prefer_default_parameters::test | non-applicable | rule-outside-v1-set |
| rules::unicorn::prefer_dom_node_append::test | non-applicable | rule-outside-v1-set |
| rules::unicorn::prefer_dom_node_dataset::test | non-applicable | rule-outside-v1-set |
| rules::unicorn::prefer_dom_node_remove::test | non-applicable | rule-outside-v1-set |
| rules::unicorn::prefer_dom_node_text_content::test | non-applicable | rule-outside-v1-set |
| rules::unicorn::prefer_event_target::test | non-applicable | rule-outside-v1-set |
| rules::unicorn::prefer_export_from::check_used_variables_option | non-applicable | rule-outside-v1-set |
| rules::unicorn::prefer_export_from::test | non-applicable | rule-outside-v1-set |
| rules::unicorn::prefer_global_this::test | non-applicable | rule-outside-v1-set |
| rules::unicorn::prefer_import_meta_properties::test | non-applicable | rule-outside-v1-set |
| rules::unicorn::prefer_includes::test | non-applicable | rule-outside-v1-set |
| rules::unicorn::prefer_keyboard_event_key::test | non-applicable | rule-outside-v1-set |
| rules::unicorn::prefer_logical_operator_over_ternary::test | non-applicable | rule-outside-v1-set |
| rules::unicorn::prefer_math_min_max::test | non-applicable | rule-outside-v1-set |
| rules::unicorn::prefer_math_trunc::test | non-applicable | rule-outside-v1-set |
| rules::unicorn::prefer_modern_dom_apis::test | non-applicable | rule-outside-v1-set |
| rules::unicorn::prefer_modern_math_apis::test | non-applicable | rule-outside-v1-set |
| rules::unicorn::prefer_module::test | non-applicable | rule-outside-v1-set |
| rules::unicorn::prefer_native_coercion_functions::test | non-applicable | rule-outside-v1-set |
| rules::unicorn::prefer_negative_index::test | non-applicable | rule-outside-v1-set |
| rules::unicorn::prefer_node_protocol::test | non-applicable | rule-outside-v1-set |
| rules::unicorn::prefer_number_coercion::test | non-applicable | rule-outside-v1-set |
| rules::unicorn::prefer_number_properties::test | non-applicable | rule-outside-v1-set |
| rules::unicorn::prefer_object_from_entries::test | non-applicable | rule-outside-v1-set |
| rules::unicorn::prefer_optional_catch_binding::test | non-applicable | rule-outside-v1-set |
| rules::unicorn::prefer_prototype_methods::test | non-applicable | rule-outside-v1-set |
| rules::unicorn::prefer_query_selector::test | non-applicable | rule-outside-v1-set |
| rules::unicorn::prefer_reflect_apply::test | non-applicable | rule-outside-v1-set |
| rules::unicorn::prefer_regexp_test::test | non-applicable | rule-outside-v1-set |
| rules::unicorn::prefer_response_static_json::test | non-applicable | rule-outside-v1-set |
| rules::unicorn::prefer_set_has::test | non-applicable | rule-outside-v1-set |
| rules::unicorn::prefer_set_size::test | enabled | certified-rule:unicorn/prefer-set-size |
| rules::unicorn::prefer_single_call::tests::test | non-applicable | rule-outside-v1-set |
| rules::unicorn::prefer_spread::test | non-applicable | rule-outside-v1-set |
| rules::unicorn::prefer_string_raw::test | non-applicable | rule-outside-v1-set |
| rules::unicorn::prefer_string_replace_all::test | non-applicable | rule-outside-v1-set |
| rules::unicorn::prefer_string_slice::test | non-applicable | rule-outside-v1-set |
| rules::unicorn::prefer_string_starts_ends_with::test | enabled | certified-rule:unicorn/prefer-string-starts-ends-with |
| rules::unicorn::prefer_string_trim_start_end::test | non-applicable | rule-outside-v1-set |
| rules::unicorn::prefer_structured_clone::test | non-applicable | rule-outside-v1-set |
| rules::unicorn::prefer_ternary::test | non-applicable | rule-outside-v1-set |
| rules::unicorn::prefer_top_level_await::test | non-applicable | rule-outside-v1-set |
| rules::unicorn::prefer_type_error::test | non-applicable | rule-outside-v1-set |
| rules::unicorn::relative_url_style::test | non-applicable | rule-outside-v1-set |
| rules::unicorn::require_array_join_separator::test | non-applicable | rule-outside-v1-set |
| rules::unicorn::require_module_attributes::test | non-applicable | rule-outside-v1-set |
| rules::unicorn::require_module_specifiers::test | non-applicable | rule-outside-v1-set |
| rules::unicorn::require_number_to_fixed_digits_argument::test | non-applicable | rule-outside-v1-set |
| rules::unicorn::require_post_message_target_origin::test | non-applicable | rule-outside-v1-set |
| rules::unicorn::switch_case_braces::test | non-applicable | rule-outside-v1-set |
| rules::unicorn::switch_case_break_position::test | non-applicable | rule-outside-v1-set |
| rules::unicorn::text_encoding_identifier_case::test | non-applicable | rule-outside-v1-set |
| rules::unicorn::throw_new_error::test | non-applicable | rule-outside-v1-set |
| rules::vitest::consistent_each_for::test | non-applicable | rule-outside-v1-set |
| rules::vitest::consistent_test_filename::test | non-applicable | rule-outside-v1-set |
| rules::vitest::consistent_test_it::test | non-applicable | rule-outside-v1-set |
| rules::vitest::consistent_vitest_vi::test | non-applicable | rule-outside-v1-set |
| rules::vitest::expect_expect::test | non-applicable | rule-outside-v1-set |
| rules::vitest::hoisted_apis_on_top::test | non-applicable | rule-outside-v1-set |
| rules::vitest::max_expects::test | non-applicable | rule-outside-v1-set |
| rules::vitest::max_nested_describe::test | non-applicable | rule-outside-v1-set |
| rules::vitest::no_alias_methods::test | non-applicable | rule-outside-v1-set |
| rules::vitest::no_commented_out_tests::test | non-applicable | rule-outside-v1-set |
| rules::vitest::no_conditional_expect::test | non-applicable | rule-outside-v1-set |
| rules::vitest::no_conditional_in_test::test | non-applicable | rule-outside-v1-set |
| rules::vitest::no_conditional_tests::test | non-applicable | rule-outside-v1-set |
| rules::vitest::no_disabled_tests::test | non-applicable | rule-outside-v1-set |
| rules::vitest::no_duplicate_hooks::test | non-applicable | rule-outside-v1-set |
| rules::vitest::no_focused_tests::test | non-applicable | rule-outside-v1-set |
| rules::vitest::no_hooks::invalid_configs_error_in_from_configuration | non-applicable | rule-outside-v1-set |
| rules::vitest::no_hooks::test | non-applicable | rule-outside-v1-set |
| rules::vitest::no_identical_title::test | non-applicable | rule-outside-v1-set |
| rules::vitest::no_import_node_test::test | non-applicable | rule-outside-v1-set |
| rules::vitest::no_importing_vitest_globals::test | non-applicable | rule-outside-v1-set |
| rules::vitest::no_interpolation_in_snapshots::test | non-applicable | rule-outside-v1-set |
| rules::vitest::no_large_snapshots::test | non-applicable | rule-outside-v1-set |
| rules::vitest::no_mocks_import::test | non-applicable | rule-outside-v1-set |
| rules::vitest::no_restricted_matchers::test | non-applicable | rule-outside-v1-set |
| rules::vitest::no_restricted_vi_methods::test | non-applicable | rule-outside-v1-set |
| rules::vitest::no_standalone_expect::test | non-applicable | rule-outside-v1-set |
| rules::vitest::no_test_prefixes::test | non-applicable | rule-outside-v1-set |
| rules::vitest::no_test_return_statement::test | non-applicable | rule-outside-v1-set |
| rules::vitest::no_unneeded_async_expect_function::test | non-applicable | rule-outside-v1-set |
| rules::vitest::padding_around_after_all_blocks::test | non-applicable | rule-outside-v1-set |
| rules::vitest::padding_around_test_blocks::test | non-applicable | rule-outside-v1-set |
| rules::vitest::prefer_called_exactly_once_with::test | non-applicable | rule-outside-v1-set |
| rules::vitest::prefer_called_once::test | non-applicable | rule-outside-v1-set |
| rules::vitest::prefer_called_times::test | non-applicable | rule-outside-v1-set |
| rules::vitest::prefer_called_with::test | non-applicable | rule-outside-v1-set |
| rules::vitest::prefer_comparison_matcher::test | non-applicable | rule-outside-v1-set |
| rules::vitest::prefer_describe_function_title::test | non-applicable | rule-outside-v1-set |
| rules::vitest::prefer_each::test | non-applicable | rule-outside-v1-set |
| rules::vitest::prefer_equality_matcher::test | non-applicable | rule-outside-v1-set |
| rules::vitest::prefer_expect_assertions::test | non-applicable | rule-outside-v1-set |
| rules::vitest::prefer_expect_resolves::tests | non-applicable | rule-outside-v1-set |
| rules::vitest::prefer_expect_type_of::test | non-applicable | rule-outside-v1-set |
| rules::vitest::prefer_hooks_in_order::test | non-applicable | rule-outside-v1-set |
| rules::vitest::prefer_hooks_on_top::test | non-applicable | rule-outside-v1-set |
| rules::vitest::prefer_import_in_mock::test | non-applicable | rule-outside-v1-set |
| rules::vitest::prefer_importing_vitest_globals::test | non-applicable | rule-outside-v1-set |
| rules::vitest::prefer_lowercase_title::test | non-applicable | rule-outside-v1-set |
| rules::vitest::prefer_mock_promise_shorthand::test | non-applicable | rule-outside-v1-set |
| rules::vitest::prefer_mock_return_shorthand::test | non-applicable | rule-outside-v1-set |
| rules::vitest::prefer_snapshot_hint::test | non-applicable | rule-outside-v1-set |
| rules::vitest::prefer_spy_on::tests | non-applicable | rule-outside-v1-set |
| rules::vitest::prefer_strict_boolean_matchers::test | non-applicable | rule-outside-v1-set |
| rules::vitest::prefer_strict_equal::test | non-applicable | rule-outside-v1-set |
| rules::vitest::prefer_to_be::tests | non-applicable | rule-outside-v1-set |
| rules::vitest::prefer_to_be_falsy::test | non-applicable | rule-outside-v1-set |
| rules::vitest::prefer_to_be_object::test | non-applicable | rule-outside-v1-set |
| rules::vitest::prefer_to_be_truthy::test | non-applicable | rule-outside-v1-set |
| rules::vitest::prefer_to_contain::tests | non-applicable | rule-outside-v1-set |
| rules::vitest::prefer_to_have_been_called_times::test | non-applicable | rule-outside-v1-set |
| rules::vitest::prefer_to_have_length::tests | non-applicable | rule-outside-v1-set |
| rules::vitest::prefer_todo::tests | non-applicable | rule-outside-v1-set |
| rules::vitest::require_awaited_expect_poll::test | non-applicable | rule-outside-v1-set |
| rules::vitest::require_hook::tests | non-applicable | rule-outside-v1-set |
| rules::vitest::require_local_test_context_for_concurrent_snapshots::test | non-applicable | rule-outside-v1-set |
| rules::vitest::require_mock_type_parameters::test | non-applicable | rule-outside-v1-set |
| rules::vitest::require_test_timeout::test | non-applicable | rule-outside-v1-set |
| rules::vitest::require_to_throw_message::test | non-applicable | rule-outside-v1-set |
| rules::vitest::require_top_level_describe::test | non-applicable | rule-outside-v1-set |
| rules::vitest::valid_describe_callback::test | non-applicable | rule-outside-v1-set |
| rules::vitest::valid_expect::test | non-applicable | rule-outside-v1-set |
| rules::vitest::valid_expect_in_promise::test | non-applicable | rule-outside-v1-set |
| rules::vitest::valid_title::test | non-applicable | rule-outside-v1-set |
| rules::vitest::warn_todo::test | non-applicable | rule-outside-v1-set |
| rules::vue::component_definition_name_casing::test | non-applicable | rule-outside-v1-set |
| rules::vue::define_emits_declaration::test | non-applicable | rule-outside-v1-set |
| rules::vue::define_props_declaration::test | non-applicable | rule-outside-v1-set |
| rules::vue::define_props_destructuring::test | non-applicable | rule-outside-v1-set |
| rules::vue::max_props::test | non-applicable | rule-outside-v1-set |
| rules::vue::next_tick_style::test | non-applicable | rule-outside-v1-set |
| rules::vue::no_arrow_functions_in_watch::test | non-applicable | rule-outside-v1-set |
| rules::vue::no_async_in_computed_properties::test | non-applicable | rule-outside-v1-set |
| rules::vue::no_computed_properties_in_data::test | non-applicable | rule-outside-v1-set |
| rules::vue::no_deprecated_data_object_declaration::test | non-applicable | rule-outside-v1-set |
| rules::vue::no_deprecated_delete_set::test | non-applicable | rule-outside-v1-set |
| rules::vue::no_deprecated_destroyed_lifecycle::test | non-applicable | rule-outside-v1-set |
| rules::vue::no_deprecated_events_api::test | non-applicable | rule-outside-v1-set |
| rules::vue::no_deprecated_model_definition::test | non-applicable | rule-outside-v1-set |
| rules::vue::no_deprecated_props_default_this::test | non-applicable | rule-outside-v1-set |
| rules::vue::no_deprecated_vue_config_keycodes::test | non-applicable | rule-outside-v1-set |
| rules::vue::no_dupe_keys::test | non-applicable | rule-outside-v1-set |
| rules::vue::no_export_in_script_setup::test | non-applicable | rule-outside-v1-set |
| rules::vue::no_expose_after_await::test | non-applicable | rule-outside-v1-set |
| rules::vue::no_import_compiler_macros::test | non-applicable | rule-outside-v1-set |
| rules::vue::no_lifecycle_after_await::test | non-applicable | rule-outside-v1-set |
| rules::vue::no_multiple_slot_args::test | non-applicable | rule-outside-v1-set |
| rules::vue::no_required_prop_with_default::test | non-applicable | rule-outside-v1-set |
| rules::vue::no_reserved_component_names::test | non-applicable | rule-outside-v1-set |
| rules::vue::no_reserved_keys::test | non-applicable | rule-outside-v1-set |
| rules::vue::no_reserved_props::test | non-applicable | rule-outside-v1-set |
| rules::vue::no_shared_component_data::test | non-applicable | rule-outside-v1-set |
| rules::vue::no_side_effects_in_computed_properties::test | non-applicable | rule-outside-v1-set |
| rules::vue::no_this_in_before_route_enter::test | non-applicable | rule-outside-v1-set |
| rules::vue::no_watch_after_await::test | non-applicable | rule-outside-v1-set |
| rules::vue::prefer_import_from_vue::test | non-applicable | rule-outside-v1-set |
| rules::vue::prop_name_casing::test | non-applicable | rule-outside-v1-set |
| rules::vue::require_default_export::test | non-applicable | rule-outside-v1-set |
| rules::vue::require_default_prop::test | non-applicable | rule-outside-v1-set |
| rules::vue::require_direct_export::test | non-applicable | rule-outside-v1-set |
| rules::vue::require_prop_type_constructor::test | non-applicable | rule-outside-v1-set |
| rules::vue::require_prop_types::test | non-applicable | rule-outside-v1-set |
| rules::vue::require_render_return::test | non-applicable | rule-outside-v1-set |
| rules::vue::require_slots_as_functions::test | non-applicable | rule-outside-v1-set |
| rules::vue::require_typed_ref::test | non-applicable | rule-outside-v1-set |
| rules::vue::return_in_computed_property::test | non-applicable | rule-outside-v1-set |
| rules::vue::return_in_emits_validator::test | non-applicable | rule-outside-v1-set |
| rules::vue::valid_define_emits::test | non-applicable | rule-outside-v1-set |
| rules::vue::valid_define_options::test | non-applicable | rule-outside-v1-set |
| rules::vue::valid_define_props::test | non-applicable | rule-outside-v1-set |
| rules::vue::valid_next_tick::test | non-applicable | rule-outside-v1-set |
| table::test::test_table_cli_enabled_column | non-applicable | internal-or-unexposed-support-test |
| table::test::test_table_no_links | non-applicable | internal-or-unexposed-support-test |
| tsgolint::test::test_btreeset_deduplicates_identical_rules | non-applicable | internal-or-unexposed-support-test |
| tsgolint::test::test_btreeset_preserves_rules_with_different_options | non-applicable | internal-or-unexposed-support-test |
| tsgolint::test::test_diagnostic_payload_deserialize_with_labeled_ranges | non-applicable | internal-or-unexposed-support-test |
| tsgolint::test::test_diagnostic_payload_deserialize_without_fixes_or_suggestions | non-applicable | internal-or-unexposed-support-test |
| tsgolint::test::test_message_from_tsgo_lint_diagnostic_basic | non-applicable | internal-or-unexposed-support-test |
| tsgolint::test::test_message_from_tsgo_lint_diagnostic_with_fix_and_suggestions | non-applicable | internal-or-unexposed-support-test |
| tsgolint::test::test_message_from_tsgo_lint_diagnostic_with_fixes | non-applicable | internal-or-unexposed-support-test |
| tsgolint::test::test_message_from_tsgo_lint_diagnostic_with_labeled_ranges | non-applicable | internal-or-unexposed-support-test |
| tsgolint::test::test_message_from_tsgo_lint_diagnostic_with_multiple_suggestions | non-applicable | internal-or-unexposed-support-test |
| tsgolint::test::test_timing_message_deserialize | non-applicable | internal-or-unexposed-support-test |
| utils::comment::test::test_count_comment_lines | non-applicable | internal-or-unexposed-support-test |
| utils::express::test_array_is_sorted | non-applicable | internal-or-unexposed-support-test |
| utils::jest::test::test_is_jest_file | non-applicable | internal-or-unexposed-support-test |
| utils::react::test::test_get_jsx_element_name | non-applicable | internal-or-unexposed-support-test |
| utils::react::test::test_is_es5_component | non-applicable | internal-or-unexposed-support-test |
| utils::react::test::test_is_es6_component | non-applicable | internal-or-unexposed-support-test |
| utils::react::test::test_is_react_component_name | non-applicable | internal-or-unexposed-support-test |
| utils::react::test::test_is_react_hook | non-applicable | internal-or-unexposed-support-test |
| utils::react::test::test_is_react_hook_name | non-applicable | internal-or-unexposed-support-test |
| utils::regex::test::test_is_regexp_callee | non-applicable | internal-or-unexposed-support-test |
| utils::test::test_typescript_rules_list_is_alphabetized | non-applicable | internal-or-unexposed-support-test |
| utils::url::test::test_find_url_query_value | non-applicable | internal-or-unexposed-support-test |
| utils::vitest::valid_vitest_fn::tests::test_bench | non-applicable | internal-or-unexposed-support-test |
| utils::vitest::valid_vitest_fn::tests::test_describe_and_suite | non-applicable | internal-or-unexposed-support-test |
| utils::vitest::valid_vitest_fn::tests::test_invalid_base_functions | non-applicable | internal-or-unexposed-support-test |
| utils::vitest::valid_vitest_fn::tests::test_it_and_test | non-applicable | internal-or-unexposed-support-test |
| utils::vitest::valid_vitest_fn::tests::test_simple_base_functions | non-applicable | internal-or-unexposed-support-test |
| utils::vitest::valid_vitest_fn::tests::test_x_functions | non-applicable | internal-or-unexposed-support-test |
## Rule snapshot ledger

| Snapshot | Classification | Reason |
| --- | --- | --- |
| crates/oxc_linter/src/config/snapshots/oxc_linter__config__config_builder__test__circular_extends_error.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/eslint_accessor_pairs.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/eslint_array_callback_return.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/eslint_arrow_body_style.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/eslint_block_scoped_var.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/eslint_capitalized_comments.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/eslint_class_methods_use_this.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/eslint_complexity.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/eslint_constructor_super.snap | inventory-only | runtime-tested-without-nondeterministic-native-snapshot:eslint/constructor-super |
| crates/oxc_linter/src/snapshots/eslint_curly.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/eslint_default_case.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/eslint_default_case_last.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/eslint_default_param_last.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/eslint_eqeqeq.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/eslint_for_direction.snap | inventory-only | runtime-tested-without-nondeterministic-native-snapshot:eslint/for-direction |
| crates/oxc_linter/src/snapshots/eslint_func_name_matching.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/eslint_func_names.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/eslint_func_style.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/eslint_getter_return.snap | inventory-only | runtime-tested-without-nondeterministic-native-snapshot:eslint/getter-return |
| crates/oxc_linter/src/snapshots/eslint_grouped_accessor_pairs.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/eslint_guard_for_in.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/eslint_id_denylist.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/eslint_id_length.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/eslint_id_match.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/eslint_id_match@ts.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/eslint_init_declarations.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/eslint_logical_assignment_operators.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/eslint_max_classes_per_file.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/eslint_max_depth.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/eslint_max_lines.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/eslint_max_lines_per_function.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/eslint_max_nested_callbacks.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/eslint_max_params.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/eslint_max_statements.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/eslint_new_cap.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/eslint_no_alert.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/eslint_no_array_constructor.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/eslint_no_async_promise_executor.snap | inventory-only | runtime-tested-without-nondeterministic-native-snapshot:eslint/no-async-promise-executor |
| crates/oxc_linter/src/snapshots/eslint_no_await_in_loop.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/eslint_no_bitwise.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/eslint_no_caller.snap | inventory-only | runtime-tested-without-nondeterministic-native-snapshot:eslint/no-caller |
| crates/oxc_linter/src/snapshots/eslint_no_case_declarations.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/eslint_no_class_assign.snap | inventory-only | runtime-tested-without-nondeterministic-native-snapshot:eslint/no-class-assign |
| crates/oxc_linter/src/snapshots/eslint_no_compare_neg_zero.snap | inventory-only | runtime-tested-without-nondeterministic-native-snapshot:eslint/no-compare-neg-zero |
| crates/oxc_linter/src/snapshots/eslint_no_cond_assign.snap | inventory-only | runtime-tested-without-nondeterministic-native-snapshot:eslint/no-cond-assign |
| crates/oxc_linter/src/snapshots/eslint_no_console.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/eslint_no_const_assign.snap | inventory-only | runtime-tested-without-nondeterministic-native-snapshot:eslint/no-const-assign |
| crates/oxc_linter/src/snapshots/eslint_no_constant_binary_expression.snap | inventory-only | runtime-tested-without-nondeterministic-native-snapshot:eslint/no-constant-binary-expression |
| crates/oxc_linter/src/snapshots/eslint_no_constant_condition.snap | inventory-only | runtime-tested-without-nondeterministic-native-snapshot:eslint/no-constant-condition |
| crates/oxc_linter/src/snapshots/eslint_no_constructor_return.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/eslint_no_continue.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/eslint_no_control_regex.snap | inventory-only | runtime-tested-without-nondeterministic-native-snapshot:eslint/no-control-regex |
| crates/oxc_linter/src/snapshots/eslint_no_control_regex@capture-group-indexing.snap | inventory-only | runtime-tested-without-nondeterministic-native-snapshot:eslint/no-control-regex |
| crates/oxc_linter/src/snapshots/eslint_no_debugger.snap | inventory-only | runtime-tested-without-nondeterministic-native-snapshot:eslint/no-debugger |
| crates/oxc_linter/src/snapshots/eslint_no_delete_var.snap | inventory-only | runtime-tested-without-nondeterministic-native-snapshot:eslint/no-delete-var |
| crates/oxc_linter/src/snapshots/eslint_no_div_regex.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/eslint_no_dupe_class_members.snap | inventory-only | runtime-tested-without-nondeterministic-native-snapshot:eslint/no-dupe-class-members |
| crates/oxc_linter/src/snapshots/eslint_no_dupe_else_if.snap | inventory-only | runtime-tested-without-nondeterministic-native-snapshot:eslint/no-dupe-else-if |
| crates/oxc_linter/src/snapshots/eslint_no_dupe_keys.snap | inventory-only | runtime-tested-without-nondeterministic-native-snapshot:eslint/no-dupe-keys |
| crates/oxc_linter/src/snapshots/eslint_no_duplicate_case.snap | inventory-only | runtime-tested-without-nondeterministic-native-snapshot:eslint/no-duplicate-case |
| crates/oxc_linter/src/snapshots/eslint_no_duplicate_imports.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/eslint_no_else_return.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/eslint_no_empty.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/eslint_no_empty_character_class.snap | inventory-only | runtime-tested-without-nondeterministic-native-snapshot:eslint/no-empty-character-class |
| crates/oxc_linter/src/snapshots/eslint_no_empty_function.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/eslint_no_empty_pattern.snap | inventory-only | runtime-tested-without-nondeterministic-native-snapshot:eslint/no-empty-pattern |
| crates/oxc_linter/src/snapshots/eslint_no_empty_static_block.snap | inventory-only | runtime-tested-without-nondeterministic-native-snapshot:eslint/no-empty-static-block |
| crates/oxc_linter/src/snapshots/eslint_no_eq_null.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/eslint_no_eval.snap | inventory-only | runtime-tested-without-nondeterministic-native-snapshot:eslint/no-eval |
| crates/oxc_linter/src/snapshots/eslint_no_ex_assign.snap | inventory-only | runtime-tested-without-nondeterministic-native-snapshot:eslint/no-ex-assign |
| crates/oxc_linter/src/snapshots/eslint_no_extend_native.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/eslint_no_extra_bind.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/eslint_no_extra_boolean_cast.snap | inventory-only | runtime-tested-without-nondeterministic-native-snapshot:eslint/no-extra-boolean-cast |
| crates/oxc_linter/src/snapshots/eslint_no_extra_label.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/eslint_no_fallthrough.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/eslint_no_func_assign.snap | inventory-only | runtime-tested-without-nondeterministic-native-snapshot:eslint/no-func-assign |
| crates/oxc_linter/src/snapshots/eslint_no_global_assign.snap | inventory-only | runtime-tested-without-nondeterministic-native-snapshot:eslint/no-global-assign |
| crates/oxc_linter/src/snapshots/eslint_no_implicit_coercion.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/eslint_no_implicit_globals.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/eslint_no_implicit_globals@configured-globals.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/eslint_no_implied_eval.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/eslint_no_implied_eval@ts.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/eslint_no_import_assign.snap | inventory-only | runtime-tested-without-nondeterministic-native-snapshot:eslint/no-import-assign |
| crates/oxc_linter/src/snapshots/eslint_no_inline_comments.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/eslint_no_inner_declarations.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/eslint_no_invalid_regexp.snap | inventory-only | runtime-tested-without-nondeterministic-native-snapshot:eslint/no-invalid-regexp |
| crates/oxc_linter/src/snapshots/eslint_no_irregular_whitespace.snap | inventory-only | runtime-tested-without-nondeterministic-native-snapshot:eslint/no-irregular-whitespace |
| crates/oxc_linter/src/snapshots/eslint_no_iterator.snap | inventory-only | runtime-tested-without-nondeterministic-native-snapshot:eslint/no-iterator |
| crates/oxc_linter/src/snapshots/eslint_no_label_var.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/eslint_no_labels.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/eslint_no_lone_blocks.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/eslint_no_lonely_if.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/eslint_no_loop_func.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/eslint_no_loss_of_precision.snap | inventory-only | runtime-tested-without-nondeterministic-native-snapshot:eslint/no-loss-of-precision |
| crates/oxc_linter/src/snapshots/eslint_no_magic_numbers.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/eslint_no_misleading_character_class.snap | inventory-only | runtime-tested-without-nondeterministic-native-snapshot:eslint/no-misleading-character-class |
| crates/oxc_linter/src/snapshots/eslint_no_multi_assign.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/eslint_no_multi_str.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/eslint_no_negated_condition.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/eslint_no_nested_ternary.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/eslint_no_new.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/eslint_no_new_func.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/eslint_no_new_native_nonconstructor.snap | inventory-only | runtime-tested-without-nondeterministic-native-snapshot:eslint/no-new-native-nonconstructor |
| crates/oxc_linter/src/snapshots/eslint_no_new_wrappers.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/eslint_no_nonoctal_decimal_escape.snap | inventory-only | runtime-tested-without-nondeterministic-native-snapshot:eslint/no-nonoctal-decimal-escape |
| crates/oxc_linter/src/snapshots/eslint_no_obj_calls.snap | inventory-only | runtime-tested-without-nondeterministic-native-snapshot:eslint/no-obj-calls |
| crates/oxc_linter/src/snapshots/eslint_no_object_constructor.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/eslint_no_param_reassign.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/eslint_no_plusplus.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/eslint_no_promise_executor_return.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/eslint_no_proto.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/eslint_no_prototype_builtins.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/eslint_no_redeclare.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/eslint_no_regex_spaces.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/eslint_no_restricted_exports.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/eslint_no_restricted_globals.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/eslint_no_restricted_imports.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/eslint_no_restricted_properties.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/eslint_no_return_assign.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/eslint_no_script_url.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/eslint_no_self_assign.snap | inventory-only | runtime-tested-without-nondeterministic-native-snapshot:eslint/no-self-assign |
| crates/oxc_linter/src/snapshots/eslint_no_self_compare.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/eslint_no_sequences.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/eslint_no_setter_return.snap | inventory-only | runtime-tested-without-nondeterministic-native-snapshot:eslint/no-setter-return |
| crates/oxc_linter/src/snapshots/eslint_no_shadow.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/eslint_no_shadow@typescript-eslint.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/eslint_no_shadow_restricted_names.snap | inventory-only | runtime-tested-without-nondeterministic-native-snapshot:eslint/no-shadow-restricted-names |
| crates/oxc_linter/src/snapshots/eslint_no_sparse_arrays.snap | inventory-only | runtime-tested-without-nondeterministic-native-snapshot:eslint/no-sparse-arrays |
| crates/oxc_linter/src/snapshots/eslint_no_template_curly_in_string.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/eslint_no_ternary.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/eslint_no_this_before_super.snap | inventory-only | runtime-tested-without-nondeterministic-native-snapshot:eslint/no-this-before-super |
| crates/oxc_linter/src/snapshots/eslint_no_throw_literal.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/eslint_no_unassigned_vars.snap | inventory-only | runtime-tested-without-nondeterministic-native-snapshot:eslint/no-unassigned-vars |
| crates/oxc_linter/src/snapshots/eslint_no_undef.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/eslint_no_undefined.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/eslint_no_underscore_dangle.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/eslint_no_unexpected_multiline.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/eslint_no_unmodified_loop_condition.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/eslint_no_unneeded_ternary.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/eslint_no_unreachable.snap | inventory-only | runtime-tested-without-nondeterministic-native-snapshot:eslint/no-unreachable |
| crates/oxc_linter/src/snapshots/eslint_no_unreachable_loop.snap | inventory-only | runtime-tested-without-nondeterministic-native-snapshot:eslint/no-unreachable |
| crates/oxc_linter/src/snapshots/eslint_no_unsafe_finally.snap | inventory-only | runtime-tested-without-nondeterministic-native-snapshot:eslint/no-unsafe-finally |
| crates/oxc_linter/src/snapshots/eslint_no_unsafe_negation.snap | inventory-only | runtime-tested-without-nondeterministic-native-snapshot:eslint/no-unsafe-negation |
| crates/oxc_linter/src/snapshots/eslint_no_unsafe_optional_chaining.snap | inventory-only | runtime-tested-without-nondeterministic-native-snapshot:eslint/no-unsafe-optional-chaining |
| crates/oxc_linter/src/snapshots/eslint_no_unused_expressions.snap | inventory-only | runtime-tested-without-nondeterministic-native-snapshot:eslint/no-unused-expressions |
| crates/oxc_linter/src/snapshots/eslint_no_unused_labels.snap | inventory-only | runtime-tested-without-nondeterministic-native-snapshot:eslint/no-unused-labels |
| crates/oxc_linter/src/snapshots/eslint_no_unused_private_class_members.snap | inventory-only | runtime-tested-without-nondeterministic-native-snapshot:eslint/no-unused-private-class-members |
| crates/oxc_linter/src/snapshots/eslint_no_unused_vars@eslint-plugin-react.snap | inventory-only | runtime-tested-without-nondeterministic-native-snapshot:eslint/no-unused-vars |
| crates/oxc_linter/src/snapshots/eslint_no_unused_vars@eslint.snap | inventory-only | runtime-tested-without-nondeterministic-native-snapshot:eslint/no-unused-vars |
| crates/oxc_linter/src/snapshots/eslint_no_unused_vars@oxc-arguments.snap | inventory-only | runtime-tested-without-nondeterministic-native-snapshot:eslint/no-unused-vars |
| crates/oxc_linter/src/snapshots/eslint_no_unused_vars@oxc-classes.snap | inventory-only | runtime-tested-without-nondeterministic-native-snapshot:eslint/no-unused-vars |
| crates/oxc_linter/src/snapshots/eslint_no_unused_vars@oxc-enums.snap | inventory-only | runtime-tested-without-nondeterministic-native-snapshot:eslint/no-unused-vars |
| crates/oxc_linter/src/snapshots/eslint_no_unused_vars@oxc-exports.snap | inventory-only | runtime-tested-without-nondeterministic-native-snapshot:eslint/no-unused-vars |
| crates/oxc_linter/src/snapshots/eslint_no_unused_vars@oxc-functions.snap | inventory-only | runtime-tested-without-nondeterministic-native-snapshot:eslint/no-unused-vars |
| crates/oxc_linter/src/snapshots/eslint_no_unused_vars@oxc-ignore.snap | inventory-only | runtime-tested-without-nondeterministic-native-snapshot:eslint/no-unused-vars |
| crates/oxc_linter/src/snapshots/eslint_no_unused_vars@oxc-imports.snap | inventory-only | runtime-tested-without-nondeterministic-native-snapshot:eslint/no-unused-vars |
| crates/oxc_linter/src/snapshots/eslint_no_unused_vars@oxc-namespaces.snap | inventory-only | runtime-tested-without-nondeterministic-native-snapshot:eslint/no-unused-vars |
| crates/oxc_linter/src/snapshots/eslint_no_unused_vars@oxc-self-call.snap | inventory-only | runtime-tested-without-nondeterministic-native-snapshot:eslint/no-unused-vars |
| crates/oxc_linter/src/snapshots/eslint_no_unused_vars@oxc-type-aliases.snap | inventory-only | runtime-tested-without-nondeterministic-native-snapshot:eslint/no-unused-vars |
| crates/oxc_linter/src/snapshots/eslint_no_unused_vars@oxc-type-references.snap | inventory-only | runtime-tested-without-nondeterministic-native-snapshot:eslint/no-unused-vars |
| crates/oxc_linter/src/snapshots/eslint_no_unused_vars@oxc-used-declarations.snap | inventory-only | runtime-tested-without-nondeterministic-native-snapshot:eslint/no-unused-vars |
| crates/oxc_linter/src/snapshots/eslint_no_unused_vars@oxc-vars-catch.snap | inventory-only | runtime-tested-without-nondeterministic-native-snapshot:eslint/no-unused-vars |
| crates/oxc_linter/src/snapshots/eslint_no_unused_vars@oxc-vars-destructure.snap | inventory-only | runtime-tested-without-nondeterministic-native-snapshot:eslint/no-unused-vars |
| crates/oxc_linter/src/snapshots/eslint_no_unused_vars@oxc-vars-discarded-read.snap | inventory-only | runtime-tested-without-nondeterministic-native-snapshot:eslint/no-unused-vars |
| crates/oxc_linter/src/snapshots/eslint_no_unused_vars@oxc-vars-reassignment.snap | inventory-only | runtime-tested-without-nondeterministic-native-snapshot:eslint/no-unused-vars |
| crates/oxc_linter/src/snapshots/eslint_no_unused_vars@oxc-vars-self-use.snap | inventory-only | runtime-tested-without-nondeterministic-native-snapshot:eslint/no-unused-vars |
| crates/oxc_linter/src/snapshots/eslint_no_unused_vars@oxc-vars-simple.snap | inventory-only | runtime-tested-without-nondeterministic-native-snapshot:eslint/no-unused-vars |
| crates/oxc_linter/src/snapshots/eslint_no_unused_vars@oxc-vars-using.snap | inventory-only | runtime-tested-without-nondeterministic-native-snapshot:eslint/no-unused-vars |
| crates/oxc_linter/src/snapshots/eslint_no_unused_vars@typescript-eslint-tsx.snap | inventory-only | runtime-tested-without-nondeterministic-native-snapshot:eslint/no-unused-vars |
| crates/oxc_linter/src/snapshots/eslint_no_unused_vars@typescript-eslint.snap | inventory-only | runtime-tested-without-nondeterministic-native-snapshot:eslint/no-unused-vars |
| crates/oxc_linter/src/snapshots/eslint_no_use_before_define@typescript-eslint.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/eslint_no_useless_assignment.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/eslint_no_useless_backreference.snap | inventory-only | runtime-tested-without-nondeterministic-native-snapshot:eslint/no-useless-backreference |
| crates/oxc_linter/src/snapshots/eslint_no_useless_call.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/eslint_no_useless_catch.snap | inventory-only | runtime-tested-without-nondeterministic-native-snapshot:eslint/no-useless-catch |
| crates/oxc_linter/src/snapshots/eslint_no_useless_computed_key.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/eslint_no_useless_concat.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/eslint_no_useless_constructor.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/eslint_no_useless_escape.snap | inventory-only | runtime-tested-without-nondeterministic-native-snapshot:eslint/no-useless-escape |
| crates/oxc_linter/src/snapshots/eslint_no_useless_rename.snap | inventory-only | runtime-tested-without-nondeterministic-native-snapshot:eslint/no-useless-rename |
| crates/oxc_linter/src/snapshots/eslint_no_useless_return.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/eslint_no_var.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/eslint_no_void.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/eslint_no_warning_comments.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/eslint_no_with.snap | inventory-only | runtime-tested-without-nondeterministic-native-snapshot:eslint/no-with |
| crates/oxc_linter/src/snapshots/eslint_object_shorthand.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/eslint_operator_assignment.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/eslint_prefer_arrow_callback.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/eslint_prefer_const.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/eslint_prefer_const@oxc.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/eslint_prefer_destructuring.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/eslint_prefer_exponentiation_operator.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/eslint_prefer_named_capture_group.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/eslint_prefer_numeric_literals.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/eslint_prefer_object_has_own.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/eslint_prefer_object_spread.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/eslint_prefer_promise_reject_errors.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/eslint_prefer_regex_literals.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/eslint_prefer_rest_params.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/eslint_prefer_spread.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/eslint_prefer_template.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/eslint_preserve_caught_error.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/eslint_radix.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/eslint_require_await.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/eslint_require_unicode_regexp.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/eslint_require_yield.snap | inventory-only | runtime-tested-without-nondeterministic-native-snapshot:eslint/require-yield |
| crates/oxc_linter/src/snapshots/eslint_sort_imports.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/eslint_sort_keys.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/eslint_sort_vars.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/eslint_symbol_description.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/eslint_unicode_bom.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/eslint_use_isnan.snap | inventory-only | runtime-tested-without-nondeterministic-native-snapshot:eslint/use-isnan |
| crates/oxc_linter/src/snapshots/eslint_valid_typeof.snap | inventory-only | runtime-tested-without-nondeterministic-native-snapshot:eslint/valid-typeof |
| crates/oxc_linter/src/snapshots/eslint_vars_on_top.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/eslint_yoda.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/import_consistent_type_specifier_style.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/import_default.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/import_export.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/import_exports_last.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/import_extensions.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/import_first.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/import_group_exports.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/import_max_dependencies.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/import_named.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/import_namespace.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/import_newline_after_import.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/import_no_absolute_path.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/import_no_amd.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/import_no_anonymous_default_export.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/import_no_commonjs.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/import_no_cycle.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/import_no_cycle@issue_19245.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/import_no_cycle@issue_21252.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/import_no_default_export.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/import_no_duplicates.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/import_no_dynamic_require.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/import_no_empty_named_blocks.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/import_no_mutable_exports.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/import_no_named_as_default.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/import_no_named_as_default_member.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/import_no_named_default.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/import_no_named_export.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/import_no_namespace.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/import_no_nodejs_modules.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/import_no_relative_parent_imports.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/import_no_self_import.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/import_no_unassigned_import.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/import_no_webpack_loader_syntax.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/import_prefer_default_export.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/import_unambiguous.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/jest_consistent_test_it.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/jest_expect_expect.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/jest_max_expects.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/jest_max_nested_describe.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/jest_no_alias_methods.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/jest_no_commented_out_tests.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/jest_no_conditional_expect.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/jest_no_conditional_in_test.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/jest_no_confusing_set_timeout.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/jest_no_deprecated_functions.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/jest_no_disabled_tests.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/jest_no_done_callback.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/jest_no_duplicate_hooks.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/jest_no_export.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/jest_no_focused_tests.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/jest_no_hooks.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/jest_no_identical_title.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/jest_no_interpolation_in_snapshots.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/jest_no_jasmine_globals.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/jest_no_large_snapshots.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/jest_no_mocks_import.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/jest_no_restricted_jest_methods.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/jest_no_restricted_matchers.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/jest_no_standalone_expect.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/jest_no_standalone_expect@vitest.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/jest_no_test_prefixes.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/jest_no_test_return_statement.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/jest_no_unneeded_async_expect_function.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/jest_no_untyped_mock_factory.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/jest_padding_around_after_all_blocks.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/jest_padding_around_test_blocks.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/jest_prefer_called_with.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/jest_prefer_comparison_matcher.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/jest_prefer_each.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/jest_prefer_ending_with_an_expect.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/jest_prefer_equality_matcher.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/jest_prefer_expect_assertions.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/jest_prefer_expect_resolves.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/jest_prefer_hooks_in_order.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/jest_prefer_hooks_on_top.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/jest_prefer_importing_jest_globals.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/jest_prefer_jest_mocked.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/jest_prefer_lowercase_title.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/jest_prefer_mock_promise_shorthand.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/jest_prefer_mock_return_shorthand.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/jest_prefer_snapshot_hint.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/jest_prefer_spy_on.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/jest_prefer_strict_equal.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/jest_prefer_to_be.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/jest_prefer_to_contain.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/jest_prefer_to_have_been_called.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/jest_prefer_to_have_been_called_times.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/jest_prefer_to_have_length.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/jest_prefer_todo.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/jest_require_hook.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/jest_require_to_throw_message.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/jest_require_top_level_describe.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/jest_valid_describe_callback.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/jest_valid_expect.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/jest_valid_expect_in_promise.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/jest_valid_title.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/jsdoc_check_access.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/jsdoc_check_property_names.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/jsdoc_check_tag_names.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/jsdoc_empty_tags.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/jsdoc_implements_on_classes.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/jsdoc_no_defaults.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/jsdoc_require_param.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/jsdoc_require_param_description.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/jsdoc_require_param_name.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/jsdoc_require_param_type.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/jsdoc_require_property.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/jsdoc_require_property_description.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/jsdoc_require_property_name.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/jsdoc_require_property_type.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/jsdoc_require_returns.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/jsdoc_require_returns_description.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/jsdoc_require_returns_type.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/jsdoc_require_throws_description.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/jsdoc_require_throws_type.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/jsdoc_require_yields.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/jsdoc_require_yields_description.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/jsdoc_require_yields_type.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/jsx_a11y_alt_text.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/jsx_a11y_anchor_ambiguous_text.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/jsx_a11y_anchor_has_content.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/jsx_a11y_anchor_is_valid.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/jsx_a11y_aria_activedescendant_has_tabindex.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/jsx_a11y_aria_props.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/jsx_a11y_aria_proptypes.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/jsx_a11y_aria_role.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/jsx_a11y_aria_unsupported_elements.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/jsx_a11y_autocomplete_valid.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/jsx_a11y_click_events_have_key_events.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/jsx_a11y_control_has_associated_label@no_config.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/jsx_a11y_control_has_associated_label@recommended.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/jsx_a11y_control_has_associated_label@strict.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/jsx_a11y_heading_has_content.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/jsx_a11y_html_has_lang.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/jsx_a11y_iframe_has_title.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/jsx_a11y_img_redundant_alt.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/jsx_a11y_interactive_supports_focus.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/jsx_a11y_label_has_associated_control.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/jsx_a11y_lang.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/jsx_a11y_media_has_caption.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/jsx_a11y_mouse_events_have_key_events.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/jsx_a11y_no_access_key.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/jsx_a11y_no_aria_hidden_on_focusable.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/jsx_a11y_no_autofocus.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/jsx_a11y_no_distracting_elements.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/jsx_a11y_no_interactive_element_to_noninteractive_role.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/jsx_a11y_no_noninteractive_element_interactions.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/jsx_a11y_no_noninteractive_element_to_interactive_role.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/jsx_a11y_no_noninteractive_tabindex.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/jsx_a11y_no_redundant_roles.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/jsx_a11y_no_static_element_interactions.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/jsx_a11y_prefer_tag_over_role.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/jsx_a11y_role_has_required_aria_props.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/jsx_a11y_role_supports_aria_props.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/jsx_a11y_scope.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/jsx_a11y_tabindex_no_positive.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/nextjs_google_font_display.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/nextjs_google_font_preconnect.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/nextjs_inline_script_id.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/nextjs_next_script_for_ga.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/nextjs_no_assign_module_variable.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/nextjs_no_async_client_component.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/nextjs_no_before_interactive_script_outside_document.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/nextjs_no_css_tags.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/nextjs_no_document_import_in_page.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/nextjs_no_duplicate_head.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/nextjs_no_head_element.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/nextjs_no_head_import_in_document.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/nextjs_no_html_link_for_pages.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/nextjs_no_img_element.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/nextjs_no_page_custom_font.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/nextjs_no_script_component_in_head.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/nextjs_no_styled_jsx_in_document.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/nextjs_no_sync_scripts.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/nextjs_no_title_in_document_head.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/nextjs_no_typos.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/nextjs_no_unwanted_polyfillio.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/node_callback_return.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/node_exports_style.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/node_global_require.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/node_handle_callback_err.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/node_no_exports_assign.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/node_no_mixed_requires.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/node_no_new_require.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/node_no_path_concat.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/node_no_process_env.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/node_no_sync.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/node_no_top_level_await.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/oxc_approx_constant.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/oxc_bad_array_method_on_arguments.snap | inventory-only | runtime-tested-without-nondeterministic-native-snapshot:oxc/bad-array-method-on-arguments |
| crates/oxc_linter/src/snapshots/oxc_bad_bitwise_operator.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/oxc_bad_char_at_comparison.snap | inventory-only | runtime-tested-without-nondeterministic-native-snapshot:oxc/bad-char-at-comparison |
| crates/oxc_linter/src/snapshots/oxc_bad_comparison_sequence.snap | inventory-only | runtime-tested-without-nondeterministic-native-snapshot:oxc/bad-comparison-sequence |
| crates/oxc_linter/src/snapshots/oxc_bad_match_all_arg.snap | inventory-only | runtime-tested-without-nondeterministic-native-snapshot:oxc/bad-match-all-arg |
| crates/oxc_linter/src/snapshots/oxc_bad_min_max_func.snap | inventory-only | runtime-tested-without-nondeterministic-native-snapshot:oxc/bad-min-max-func |
| crates/oxc_linter/src/snapshots/oxc_bad_object_literal_comparison.snap | inventory-only | runtime-tested-without-nondeterministic-native-snapshot:oxc/bad-object-literal-comparison |
| crates/oxc_linter/src/snapshots/oxc_bad_replace_all_arg.snap | inventory-only | runtime-tested-without-nondeterministic-native-snapshot:oxc/bad-replace-all-arg |
| crates/oxc_linter/src/snapshots/oxc_branches_sharing_code.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/oxc_const_comparisons.snap | inventory-only | runtime-tested-without-nondeterministic-native-snapshot:oxc/const-comparisons |
| crates/oxc_linter/src/snapshots/oxc_double_comparisons.snap | inventory-only | runtime-tested-without-nondeterministic-native-snapshot:oxc/double-comparisons |
| crates/oxc_linter/src/snapshots/oxc_erasing_op.snap | inventory-only | runtime-tested-without-nondeterministic-native-snapshot:oxc/erasing-op |
| crates/oxc_linter/src/snapshots/oxc_misrefactored_assign_op.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/oxc_missing_throw.snap | inventory-only | runtime-tested-without-nondeterministic-native-snapshot:oxc/missing-throw |
| crates/oxc_linter/src/snapshots/oxc_no_accumulating_spread.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/oxc_no_async_await.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/oxc_no_async_endpoint_handlers.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/oxc_no_barrel_file.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/oxc_no_const_enum.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/oxc_no_map_spread.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/oxc_no_optional_chaining.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/oxc_no_rest_spread_properties.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/oxc_no_this_in_exported_function.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/oxc_number_arg_out_of_range.snap | inventory-only | runtime-tested-without-nondeterministic-native-snapshot:oxc/number-arg-out-of-range |
| crates/oxc_linter/src/snapshots/oxc_only_used_in_recursion.snap | inventory-only | runtime-tested-without-nondeterministic-native-snapshot:oxc/only-used-in-recursion |
| crates/oxc_linter/src/snapshots/oxc_uninvoked_array_callback.snap | inventory-only | runtime-tested-without-nondeterministic-native-snapshot:oxc/uninvoked-array-callback |
| crates/oxc_linter/src/snapshots/promise_always_return.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/promise_avoid_new.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/promise_catch_or_return.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/promise_no_callback_in_promise.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/promise_no_multiple_resolved.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/promise_no_nesting.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/promise_no_new_statics.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/promise_no_promise_in_callback.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/promise_no_return_in_finally.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/promise_no_return_wrap.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/promise_param_names.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/promise_prefer_await_to_callbacks.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/promise_prefer_await_to_then.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/promise_prefer_catch.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/promise_spec_only.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/promise_valid_params.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/react_button_has_type.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/react_checked_requires_onchange_or_readonly.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/react_display_name.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/react_exhaustive_deps.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/react_forbid_component_props.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/react_forbid_dom_props.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/react_forbid_elements.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/react_forward_ref_uses_ref.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/react_function_component_definition.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/react_hook_use_state.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/react_iframe_missing_sandbox.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/react_jsx_boolean_value.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/react_jsx_curly_brace_presence.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/react_jsx_filename_extension.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/react_jsx_fragments.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/react_jsx_handler_names.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/react_jsx_key.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/react_jsx_max_depth.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/react_jsx_no_comment_textnodes.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/react_jsx_no_constructed_context_values.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/react_jsx_no_duplicate_props.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/react_jsx_no_literals.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/react_jsx_no_script_url.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/react_jsx_no_target_blank.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/react_jsx_no_undef.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/react_jsx_no_useless_fragment.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/react_jsx_pascal_case.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/react_jsx_props_no_spread_multi.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/react_jsx_props_no_spreading.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/react_no_array_index_key.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/react_no_children_prop.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/react_no_clone_element.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/react_no_danger.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/react_no_danger_with_children.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/react_no_did_mount_set_state.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/react_no_did_mount_set_state@disallow_in_func.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/react_no_did_update_set_state.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/react_no_direct_mutation_state.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/react_no_find_dom_node.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/react_no_is_mounted.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/react_no_multi_comp.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/react_no_namespace.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/react_no_object_type_as_default_prop.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/react_no_react_children.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/react_no_redundant_should_component_update.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/react_no_render_return_value.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/react_no_set_state.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/react_no_string_refs.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/react_no_this_in_sfc.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/react_no_unescaped_entities.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/react_no_unknown_property.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/react_no_unsafe.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/react_no_unstable_nested_components.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/react_no_will_update_set_state.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/react_only_export_components.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/react_perf_jsx_no_jsx_as_prop.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/react_perf_jsx_no_new_array_as_prop.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/react_perf_jsx_no_new_function_as_prop.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/react_perf_jsx_no_new_object_as_prop.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/react_prefer_es6_class.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/react_prefer_function_component.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/react_react_compiler.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/react_react_in_jsx_scope.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/react_require_render_return.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/react_rules_of_hooks.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/react_self_closing_comp.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/react_state_in_constructor.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/react_style_prop_object.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/react_void_dom_elements_no_children.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/schema_json.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/typescript_adjacent_overload_signatures.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/typescript_array_type.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/typescript_ban_ts_comment.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/typescript_ban_tslint_comment.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/typescript_ban_types.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/typescript_class_literal_property_style.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/typescript_consistent_generic_constructors.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/typescript_consistent_indexed_object_style.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/typescript_consistent_type_assertions.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/typescript_consistent_type_definitions.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/typescript_consistent_type_imports.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/typescript_explicit_function_return_type.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/typescript_explicit_member_accessibility.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/typescript_explicit_module_boundary_types.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/typescript_method_signature_style.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/typescript_no_confusing_non_null_assertion.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/typescript_no_duplicate_enum_values.snap | inventory-only | runtime-tested-without-nondeterministic-native-snapshot:typescript/no-duplicate-enum-values |
| crates/oxc_linter/src/snapshots/typescript_no_dynamic_delete.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/typescript_no_empty_interface.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/typescript_no_empty_object_type.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/typescript_no_explicit_any.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/typescript_no_extra_non_null_assertion.snap | inventory-only | runtime-tested-without-nondeterministic-native-snapshot:typescript/no-extra-non-null-assertion |
| crates/oxc_linter/src/snapshots/typescript_no_extraneous_class.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/typescript_no_import_type_side_effects.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/typescript_no_inferrable_types.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/typescript_no_invalid_void_type.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/typescript_no_misused_new.snap | inventory-only | runtime-tested-without-nondeterministic-native-snapshot:typescript/no-misused-new |
| crates/oxc_linter/src/snapshots/typescript_no_namespace.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/typescript_no_non_null_asserted_nullish_coalescing.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/typescript_no_non_null_asserted_optional_chain.snap | inventory-only | runtime-tested-without-nondeterministic-native-snapshot:typescript/no-non-null-asserted-optional-chain |
| crates/oxc_linter/src/snapshots/typescript_no_non_null_assertion.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/typescript_no_require_imports.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/typescript_no_restricted_types.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/typescript_no_this_alias.snap | inventory-only | runtime-tested-without-nondeterministic-native-snapshot:typescript/no-this-alias |
| crates/oxc_linter/src/snapshots/typescript_no_unnecessary_parameter_property_assignment.snap | inventory-only | runtime-tested-without-nondeterministic-native-snapshot:typescript/no-unnecessary-parameter-property-assignment |
| crates/oxc_linter/src/snapshots/typescript_no_unnecessary_type_constraint.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/typescript_no_unsafe_declaration_merging.snap | inventory-only | runtime-tested-without-nondeterministic-native-snapshot:typescript/no-unsafe-declaration-merging |
| crates/oxc_linter/src/snapshots/typescript_no_unsafe_function_type.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/typescript_no_useless_empty_export.snap | inventory-only | runtime-tested-without-nondeterministic-native-snapshot:typescript/no-useless-empty-export |
| crates/oxc_linter/src/snapshots/typescript_no_var_requires.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/typescript_no_wrapper_object_types.snap | inventory-only | runtime-tested-without-nondeterministic-native-snapshot:typescript/no-wrapper-object-types |
| crates/oxc_linter/src/snapshots/typescript_parameter_properties.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/typescript_prefer_as_const.snap | inventory-only | runtime-tested-without-nondeterministic-native-snapshot:typescript/prefer-as-const |
| crates/oxc_linter/src/snapshots/typescript_prefer_enum_initializers.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/typescript_prefer_for_of.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/typescript_prefer_function_type.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/typescript_prefer_literal_enum_member.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/typescript_prefer_namespace_keyword.snap | inventory-only | runtime-tested-without-nondeterministic-native-snapshot:typescript/prefer-namespace-keyword |
| crates/oxc_linter/src/snapshots/typescript_prefer_ts_expect_error.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/typescript_triple_slash_reference.snap | inventory-only | runtime-tested-without-nondeterministic-native-snapshot:typescript/triple-slash-reference |
| crates/oxc_linter/src/snapshots/typescript_unified_signatures.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/unicorn_catch_error_name.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/unicorn_consistent_assert.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/unicorn_consistent_date_clone.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/unicorn_consistent_empty_array_spread.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/unicorn_consistent_existence_index_check.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/unicorn_consistent_function_scoping.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/unicorn_consistent_template_literal_escape.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/unicorn_custom_error_definition.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/unicorn_empty_brace_spaces.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/unicorn_error_message.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/unicorn_escape_case.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/unicorn_explicit_length_check.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/unicorn_explicit_timer_delay.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/unicorn_filename_case.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/unicorn_import_style.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/unicorn_max_nested_calls.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/unicorn_new_for_builtins.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/unicorn_no_abusive_eslint_disable.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/unicorn_no_accessor_recursion.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/unicorn_no_anonymous_default_export.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/unicorn_no_array_callback_reference.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/unicorn_no_array_fill_with_reference_type.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/unicorn_no_array_for_each.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/unicorn_no_array_method_this_argument.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/unicorn_no_array_reduce.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/unicorn_no_array_reverse.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/unicorn_no_array_sort.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/unicorn_no_await_expression_member.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/unicorn_no_await_in_promise_methods.snap | inventory-only | runtime-tested-without-nondeterministic-native-snapshot:unicorn/no-await-in-promise-methods |
| crates/oxc_linter/src/snapshots/unicorn_no_confusing_array_with.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/unicorn_no_console_spaces.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/unicorn_no_document_cookie.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/unicorn_no_empty_file.snap | inventory-only | runtime-tested-without-nondeterministic-native-snapshot:unicorn/no-empty-file |
| crates/oxc_linter/src/snapshots/unicorn_no_hex_escape.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/unicorn_no_immediate_mutation.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/unicorn_no_instanceof_array.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/unicorn_no_instanceof_builtins.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/unicorn_no_invalid_fetch_options.snap | inventory-only | runtime-tested-without-nondeterministic-native-snapshot:unicorn/no-invalid-fetch-options |
| crates/oxc_linter/src/snapshots/unicorn_no_invalid_remove_event_listener.snap | inventory-only | runtime-tested-without-nondeterministic-native-snapshot:unicorn/no-invalid-remove-event-listener |
| crates/oxc_linter/src/snapshots/unicorn_no_length_as_slice_end.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/unicorn_no_lonely_if.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/unicorn_no_magic_array_flat_depth.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/unicorn_no_negated_condition.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/unicorn_no_negation_in_equality_check.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/unicorn_no_nested_ternary.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/unicorn_no_new_array.snap | inventory-only | runtime-tested-without-nondeterministic-native-snapshot:unicorn/no-new-array |
| crates/oxc_linter/src/snapshots/unicorn_no_new_buffer.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/unicorn_no_null.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/unicorn_no_object_as_default_parameter.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/unicorn_no_process_exit.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/unicorn_no_single_promise_in_promise_methods.snap | inventory-only | runtime-tested-without-nondeterministic-native-snapshot:unicorn/no-single-promise-in-promise-methods |
| crates/oxc_linter/src/snapshots/unicorn_no_static_only_class.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/unicorn_no_thenable.snap | inventory-only | runtime-tested-without-nondeterministic-native-snapshot:unicorn/no-thenable |
| crates/oxc_linter/src/snapshots/unicorn_no_this_assignment.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/unicorn_no_typeof_undefined.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/unicorn_no_unnecessary_array_flat_depth.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/unicorn_no_unnecessary_array_splice_count.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/unicorn_no_unnecessary_await.snap | inventory-only | runtime-tested-without-nondeterministic-native-snapshot:unicorn/no-unnecessary-await |
| crates/oxc_linter/src/snapshots/unicorn_no_unnecessary_slice_end.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/unicorn_no_unreadable_array_destructuring.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/unicorn_no_unreadable_iife.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/unicorn_no_useless_collection_argument.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/unicorn_no_useless_error_capture_stack_trace.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/unicorn_no_useless_fallback_in_spread.snap | inventory-only | runtime-tested-without-nondeterministic-native-snapshot:unicorn/no-useless-fallback-in-spread |
| crates/oxc_linter/src/snapshots/unicorn_no_useless_iterator_to_array.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/unicorn_no_useless_length_check.snap | inventory-only | runtime-tested-without-nondeterministic-native-snapshot:unicorn/no-useless-length-check |
| crates/oxc_linter/src/snapshots/unicorn_no_useless_promise_resolve_reject.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/unicorn_no_useless_spread.snap | inventory-only | runtime-tested-without-nondeterministic-native-snapshot:unicorn/no-useless-spread |
| crates/oxc_linter/src/snapshots/unicorn_no_useless_switch_case.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/unicorn_no_useless_undefined.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/unicorn_no_zero_fractions.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/unicorn_number_literal_case.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/unicorn_numeric_separators_style.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/unicorn_prefer_add_event_listener.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/unicorn_prefer_array_find.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/unicorn_prefer_array_flat.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/unicorn_prefer_array_flat_map.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/unicorn_prefer_array_index_of.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/unicorn_prefer_array_some.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/unicorn_prefer_at.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/unicorn_prefer_bigint_literals.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/unicorn_prefer_blob_reading_methods.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/unicorn_prefer_class_fields.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/unicorn_prefer_classlist_toggle.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/unicorn_prefer_code_point.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/unicorn_prefer_date_now.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/unicorn_prefer_default_parameters.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/unicorn_prefer_dom_node_append.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/unicorn_prefer_dom_node_dataset.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/unicorn_prefer_dom_node_remove.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/unicorn_prefer_dom_node_text_content.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/unicorn_prefer_event_target.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/unicorn_prefer_export_from.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/unicorn_prefer_export_from@check_used_variables.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/unicorn_prefer_global_this.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/unicorn_prefer_import_meta_properties.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/unicorn_prefer_includes.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/unicorn_prefer_keyboard_event_key.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/unicorn_prefer_logical_operator_over_ternary.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/unicorn_prefer_math_min_max.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/unicorn_prefer_math_trunc.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/unicorn_prefer_modern_dom_apis.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/unicorn_prefer_modern_math_apis.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/unicorn_prefer_module.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/unicorn_prefer_native_coercion_functions.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/unicorn_prefer_negative_index.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/unicorn_prefer_node_protocol.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/unicorn_prefer_number_coercion.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/unicorn_prefer_number_properties.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/unicorn_prefer_object_from_entries.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/unicorn_prefer_optional_catch_binding.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/unicorn_prefer_prototype_methods.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/unicorn_prefer_query_selector.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/unicorn_prefer_reflect_apply.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/unicorn_prefer_regexp_test.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/unicorn_prefer_response_static_json.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/unicorn_prefer_set_has.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/unicorn_prefer_set_size.snap | inventory-only | runtime-tested-without-nondeterministic-native-snapshot:unicorn/prefer-set-size |
| crates/oxc_linter/src/snapshots/unicorn_prefer_single_call.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/unicorn_prefer_spread.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/unicorn_prefer_string_raw.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/unicorn_prefer_string_replace_all.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/unicorn_prefer_string_slice.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/unicorn_prefer_string_starts_ends_with.snap | inventory-only | runtime-tested-without-nondeterministic-native-snapshot:unicorn/prefer-string-starts-ends-with |
| crates/oxc_linter/src/snapshots/unicorn_prefer_string_trim_start_end.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/unicorn_prefer_structured_clone.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/unicorn_prefer_ternary.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/unicorn_prefer_top_level_await.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/unicorn_prefer_type_error.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/unicorn_relative_url_style.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/unicorn_require_array_join_separator.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/unicorn_require_module_attributes.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/unicorn_require_module_specifiers.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/unicorn_require_number_to_fixed_digits_argument.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/unicorn_require_post_message_target_origin.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/unicorn_switch_case_braces.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/unicorn_switch_case_break_position.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/unicorn_text_encoding_identifier_case.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/unicorn_throw_new_error.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/vitest_consistent_each_for.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/vitest_consistent_test_filename.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/vitest_consistent_test_it.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/vitest_consistent_vitest_vi.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/vitest_expect_expect.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/vitest_hoisted_apis_on_top.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/vitest_max_expects.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/vitest_max_nested_describe.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/vitest_no_alias_methods.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/vitest_no_commented_out_tests.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/vitest_no_conditional_expect.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/vitest_no_conditional_in_test.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/vitest_no_conditional_tests.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/vitest_no_disabled_tests.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/vitest_no_duplicate_hooks.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/vitest_no_focused_tests.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/vitest_no_hooks.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/vitest_no_identical_title.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/vitest_no_import_node_test.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/vitest_no_importing_vitest_globals.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/vitest_no_interpolation_in_snapshots.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/vitest_no_large_snapshots.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/vitest_no_mocks_import.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/vitest_no_restricted_matchers.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/vitest_no_restricted_vi_methods.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/vitest_no_standalone_expect.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/vitest_no_test_prefixes.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/vitest_no_test_return_statement.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/vitest_no_unneeded_async_expect_function.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/vitest_padding_around_after_all_blocks.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/vitest_padding_around_test_blocks.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/vitest_prefer_called_exactly_once_with.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/vitest_prefer_called_once.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/vitest_prefer_called_times.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/vitest_prefer_called_with.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/vitest_prefer_comparison_matcher.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/vitest_prefer_describe_function_title.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/vitest_prefer_each.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/vitest_prefer_equality_matcher.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/vitest_prefer_expect_assertions.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/vitest_prefer_expect_resolves.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/vitest_prefer_expect_type_of.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/vitest_prefer_hooks_in_order.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/vitest_prefer_hooks_on_top.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/vitest_prefer_import_in_mock.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/vitest_prefer_importing_vitest_globals.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/vitest_prefer_lowercase_title.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/vitest_prefer_mock_promise_shorthand.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/vitest_prefer_mock_return_shorthand.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/vitest_prefer_snapshot_hint.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/vitest_prefer_spy_on.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/vitest_prefer_strict_boolean_matchers.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/vitest_prefer_strict_equal.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/vitest_prefer_to_be.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/vitest_prefer_to_be_falsy.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/vitest_prefer_to_be_object.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/vitest_prefer_to_be_truthy.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/vitest_prefer_to_contain.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/vitest_prefer_to_have_been_called_times.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/vitest_prefer_to_have_length.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/vitest_prefer_todo.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/vitest_require_awaited_expect_poll.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/vitest_require_hook.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/vitest_require_local_test_context_for_concurrent_snapshots.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/vitest_require_mock_type_parameters.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/vitest_require_test_timeout.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/vitest_require_to_throw_message.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/vitest_require_top_level_describe.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/vitest_valid_describe_callback.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/vitest_valid_expect.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/vitest_valid_expect_in_promise.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/vitest_valid_title.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/vitest_warn_todo.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/vue_component_definition_name_casing.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/vue_define_emits_declaration.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/vue_define_props_declaration.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/vue_define_props_destructuring.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/vue_max_props.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/vue_next_tick_style.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/vue_no_arrow_functions_in_watch.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/vue_no_async_in_computed_properties.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/vue_no_computed_properties_in_data.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/vue_no_deprecated_data_object_declaration.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/vue_no_deprecated_delete_set.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/vue_no_deprecated_destroyed_lifecycle.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/vue_no_deprecated_events_api.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/vue_no_deprecated_model_definition.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/vue_no_deprecated_props_default_this.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/vue_no_deprecated_vue_config_keycodes.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/vue_no_dupe_keys.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/vue_no_export_in_script_setup.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/vue_no_expose_after_await.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/vue_no_import_compiler_macros.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/vue_no_lifecycle_after_await.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/vue_no_multiple_slot_args.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/vue_no_required_prop_with_default.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/vue_no_reserved_component_names.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/vue_no_reserved_keys.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/vue_no_reserved_props.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/vue_no_shared_component_data.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/vue_no_side_effects_in_computed_properties.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/vue_no_this_in_before_route_enter.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/vue_no_watch_after_await.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/vue_prefer_import_from_vue.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/vue_prop_name_casing.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/vue_require_default_export.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/vue_require_default_prop.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/vue_require_direct_export.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/vue_require_prop_type_constructor.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/vue_require_prop_types.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/vue_require_render_return.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/vue_require_slots_as_functions.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/vue_require_typed_ref.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/vue_return_in_computed_property.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/vue_return_in_emits_validator.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/vue_valid_define_emits.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/vue_valid_define_options.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/vue_valid_define_props.snap | non-applicable | rule-outside-v1-set-or-internal |
| crates/oxc_linter/src/snapshots/vue_valid_next_tick.snap | non-applicable | rule-outside-v1-set-or-internal |

| Fixture | Classification | Reason |
| --- | --- | --- |
| apps/oxlint/fixtures/cli/ancestor_search/.oxlintrc.json | non-applicable | cli-or-rule-outside-v1 |
| apps/oxlint/fixtures/cli/ancestor_search/apps/app1/test.js | non-applicable | cli-or-rule-outside-v1 |
| apps/oxlint/fixtures/cli/ancestor_search_explicit_config/.oxlintrc.json | non-applicable | cli-or-rule-outside-v1 |
| apps/oxlint/fixtures/cli/astro/debugger.astro | non-applicable | language-outside-v1 |
| apps/oxlint/fixtures/cli/auto_config_detection/.oxlintrc.json | enabled | adapter:auto-config-json |
| apps/oxlint/fixtures/cli/auto_config_detection/debugger.js | enabled | adapter:auto-config-json |
| apps/oxlint/fixtures/cli/auto_config_detection_jsonc/.oxlintrc.jsonc | enabled | adapter:auto-config-jsonc |
| apps/oxlint/fixtures/cli/auto_config_detection_jsonc/debugger.js | enabled | adapter:auto-config-jsonc |
| apps/oxlint/fixtures/cli/auto_config_parse_error/.oxlintrc.json | enabled | adapter:malformed-config |
| apps/oxlint/fixtures/cli/auto_config_parse_error/debugger.js | enabled | adapter:malformed-config |
| apps/oxlint/fixtures/cli/config_ignore_patterns/ignore_directory/eslintrc.json | enabled | adapter:ignore-directory |
| apps/oxlint/fixtures/cli/config_ignore_patterns/ignore_directory/main.js | enabled | adapter:ignore-directory |
| apps/oxlint/fixtures/cli/config_ignore_patterns/ignore_directory/tests/main.spec.js | enabled | adapter:ignore-directory |
| apps/oxlint/fixtures/cli/config_ignore_patterns/ignore_extension/eslintrc.json | enabled | adapter:ignore-extension |
| apps/oxlint/fixtures/cli/config_ignore_patterns/ignore_extension/main.js | enabled | adapter:ignore-extension |
| apps/oxlint/fixtures/cli/config_ignore_patterns/ignore_extension/main.ts | enabled | adapter:ignore-extension |
| apps/oxlint/fixtures/cli/config_ignore_patterns/with_oxlintrc/main.js | non-applicable | nested-config-not-exposed |
| apps/oxlint/fixtures/cli/config_ignore_patterns/with_oxlintrc/main.ts | non-applicable | nested-config-not-exposed |
| apps/oxlint/fixtures/cli/config_ignore_patterns/with_oxlintrc/test/eslintrc.json | non-applicable | nested-config-not-exposed |
| apps/oxlint/fixtures/cli/config_ignore_patterns/with_oxlintrc/test/main.ts | non-applicable | nested-config-not-exposed |
| apps/oxlint/fixtures/cli/cross_module_extended_config/.oxlintrc.json | non-applicable | module-graph-not-exposed |
| apps/oxlint/fixtures/cli/cross_module_extended_config/config/.oxlintrc.json | non-applicable | module-graph-not-exposed |
| apps/oxlint/fixtures/cli/cross_module_extended_config/dep-a.ts | non-applicable | module-graph-not-exposed |
| apps/oxlint/fixtures/cli/cross_module_extended_config/dep-b.ts | non-applicable | module-graph-not-exposed |
| apps/oxlint/fixtures/cli/cross_module_nested_config/dep-a.ts | non-applicable | module-graph-not-exposed |
| apps/oxlint/fixtures/cli/cross_module_nested_config/dep-b.ts | non-applicable | module-graph-not-exposed |
| apps/oxlint/fixtures/cli/cross_module_nested_config/folder/.oxlintrc.json | non-applicable | module-graph-not-exposed |
| apps/oxlint/fixtures/cli/cross_module_nested_config/folder/folder-dep-a.ts | non-applicable | module-graph-not-exposed |
| apps/oxlint/fixtures/cli/cross_module_nested_config/folder/folder-dep-b.ts | non-applicable | module-graph-not-exposed |
| apps/oxlint/fixtures/cli/disable_directive_issue_13311/.oxlintrc.json | non-applicable | cli-or-rule-outside-v1 |
| apps/oxlint/fixtures/cli/disable_directive_issue_13311/test.jsx | non-applicable | cli-or-rule-outside-v1 |
| apps/oxlint/fixtures/cli/disable_directive_issue_13311/test2.d.ts | non-applicable | cli-or-rule-outside-v1 |
| apps/oxlint/fixtures/cli/disable_vitest_rules/.oxlintrc-vitest.json | non-applicable | cli-or-rule-outside-v1 |
| apps/oxlint/fixtures/cli/disable_vitest_rules/test.js | non-applicable | cli-or-rule-outside-v1 |
| apps/oxlint/fixtures/cli/dot_folder/.a_dot_folder/index.ts | non-applicable | cli-or-rule-outside-v1 |
| apps/oxlint/fixtures/cli/eslint_and_typescript_alias_rules/oxlint-eslint.json | non-applicable | cli-or-rule-outside-v1 |
| apps/oxlint/fixtures/cli/eslint_and_typescript_alias_rules/oxlint-typescript.json | non-applicable | cli-or-rule-outside-v1 |
| apps/oxlint/fixtures/cli/eslint_and_typescript_alias_rules/test.js | non-applicable | cli-or-rule-outside-v1 |
| apps/oxlint/fixtures/cli/eslintrc_env/eslintrc_env_browser.json | non-applicable | cli-or-rule-outside-v1 |
| apps/oxlint/fixtures/cli/eslintrc_env/eslintrc_no_env.json | non-applicable | cli-or-rule-outside-v1 |
| apps/oxlint/fixtures/cli/eslintrc_env/test.js | non-applicable | cli-or-rule-outside-v1 |
| apps/oxlint/fixtures/cli/eslintrc_off/eslintrc.json | non-applicable | cli-or-rule-outside-v1 |
| apps/oxlint/fixtures/cli/eslintrc_off/test.js | non-applicable | cli-or-rule-outside-v1 |
| apps/oxlint/fixtures/cli/eslintrc_vitest_replace/eslintrc.json | non-applicable | cli-or-rule-outside-v1 |
| apps/oxlint/fixtures/cli/eslintrc_vitest_replace/foo.test.js | non-applicable | cli-or-rule-outside-v1 |
| apps/oxlint/fixtures/cli/extends_config/console.js | non-applicable | nested-or-advanced-config-not-exposed |
| apps/oxlint/fixtures/cli/extends_config/extends_rules_config.json | non-applicable | nested-or-advanced-config-not-exposed |
| apps/oxlint/fixtures/cli/extends_config/overrides/.oxlintrc.json | non-applicable | nested-or-advanced-config-not-exposed |
| apps/oxlint/fixtures/cli/extends_config/overrides/jsx.json | non-applicable | nested-or-advanced-config-not-exposed |
| apps/oxlint/fixtures/cli/extends_config/overrides/test.ts | non-applicable | nested-or-advanced-config-not-exposed |
| apps/oxlint/fixtures/cli/extends_config/overrides/test.tsx | non-applicable | nested-or-advanced-config-not-exposed |
| apps/oxlint/fixtures/cli/extends_config/overrides/typescript.json | non-applicable | nested-or-advanced-config-not-exposed |
| apps/oxlint/fixtures/cli/extends_config/overrides_same_directory/.oxlintrc.json | non-applicable | nested-or-advanced-config-not-exposed |
| apps/oxlint/fixtures/cli/extends_config/overrides_same_directory/config/.oxlintrc.json | non-applicable | nested-or-advanced-config-not-exposed |
| apps/oxlint/fixtures/cli/extends_config/overrides_same_directory/config/test.js | non-applicable | nested-or-advanced-config-not-exposed |
| apps/oxlint/fixtures/cli/extends_config/relative_paths/extends_extends_config.json | non-applicable | nested-or-advanced-config-not-exposed |
| apps/oxlint/fixtures/cli/extends_config/rules_config.json | non-applicable | nested-or-advanced-config-not-exposed |
| apps/oxlint/fixtures/cli/extends_invalid_config/.oxlintrc.json | non-applicable | nested-or-advanced-config-not-exposed |
| apps/oxlint/fixtures/cli/extends_invalid_config/invalid_config.json | non-applicable | nested-or-advanced-config-not-exposed |
| apps/oxlint/fixtures/cli/fix_argument/.oxlintrc.json | non-applicable | fixing-not-exposed |
| apps/oxlint/fixtures/cli/fix_argument/fix.js | non-applicable | fixing-not-exposed |
| apps/oxlint/fixtures/cli/fix_argument/fix.vue | non-applicable | fixing-not-exposed |
| apps/oxlint/fixtures/cli/fix_argument/skip_suggestion.js | non-applicable | fixing-not-exposed |
| apps/oxlint/fixtures/cli/fix_argument/skip_suggestion.vue | non-applicable | fixing-not-exposed |
| apps/oxlint/fixtures/cli/flow/flow.js | non-applicable | language-outside-v1 |
| apps/oxlint/fixtures/cli/flow/index.mjs | non-applicable | language-outside-v1 |
| apps/oxlint/fixtures/cli/ignore_file_current_dir/.oxlintrc.json | enabled | adapter:ignore-current-directory |
| apps/oxlint/fixtures/cli/ignore_file_current_dir/a/bar.js | enabled | adapter:ignore-current-directory |
| apps/oxlint/fixtures/cli/ignore_file_current_dir/foo.js | enabled | adapter:ignore-current-directory |
| apps/oxlint/fixtures/cli/ignore_pattern_non_glob_syntax/.oxlintrc.json | enabled | adapter:ignore-non-glob |
| apps/oxlint/fixtures/cli/ignore_pattern_non_glob_syntax/ignored_dir/index.ts | enabled | adapter:ignore-non-glob |
| apps/oxlint/fixtures/cli/ignore_pattern_non_glob_syntax/with_nested/.oxlintrc.json | non-applicable | cli-or-rule-outside-v1 |
| apps/oxlint/fixtures/cli/ignore_pattern_non_glob_syntax/with_nested/ignored_dir/index.ts | non-applicable | cli-or-rule-outside-v1 |
| apps/oxlint/fixtures/cli/ignore_patterns_ancestor_config/.oxlintrc.json | non-applicable | cli-or-rule-outside-v1 |
| apps/oxlint/fixtures/cli/ignore_patterns_ancestor_config/packages/foo/dist/bundle.js | non-applicable | cli-or-rule-outside-v1 |
| apps/oxlint/fixtures/cli/ignore_patterns_ancestor_config/packages/foo/src/index.js | non-applicable | cli-or-rule-outside-v1 |
| apps/oxlint/fixtures/cli/ignore_patterns_empty_nested/.oxlintrc.json | enabled | adapter:ignore-empty-nested-root |
| apps/oxlint/fixtures/cli/ignore_patterns_empty_nested/another_config/.oxlintrc.json | non-applicable | nested-or-advanced-config-not-exposed |
| apps/oxlint/fixtures/cli/ignore_patterns_empty_nested/another_config/not-ignored-file.ts | non-applicable | nested-or-advanced-config-not-exposed |
| apps/oxlint/fixtures/cli/ignore_patterns_empty_nested/ignored-file.ts | enabled | adapter:ignore-empty-nested-root |
| apps/oxlint/fixtures/cli/ignore_patterns_mixed/.oxlintrc.json | enabled | adapter:ignore-mixed-root |
| apps/oxlint/fixtures/cli/ignore_patterns_mixed/nested/.oxlintrc.json | non-applicable | nested-or-advanced-config-not-exposed |
| apps/oxlint/fixtures/cli/ignore_patterns_mixed/nested/should_be_ignored.ts | non-applicable | nested-or-advanced-config-not-exposed |
| apps/oxlint/fixtures/cli/ignore_patterns_mixed/nested/should_not_be_ignored.ts | non-applicable | nested-or-advanced-config-not-exposed |
| apps/oxlint/fixtures/cli/ignore_patterns_mixed/should_be_ignored.ts | enabled | adapter:ignore-mixed-root |
| apps/oxlint/fixtures/cli/ignore_patterns_relative/.oxlintrc.json | enabled | adapter:ignore-relative |
| apps/oxlint/fixtures/cli/ignore_patterns_relative/nested/should_be_ignored.ts | enabled | adapter:ignore-relative |
| apps/oxlint/fixtures/cli/ignore_patterns_relative/nested/should_not_be_ignored.js | enabled | adapter:ignore-relative |
| apps/oxlint/fixtures/cli/ignore_patterns_relative/should_not_be_ignored.ts | enabled | adapter:ignore-relative |
| apps/oxlint/fixtures/cli/ignore_patterns_symlink/configuration/.oxlintrc.json | non-applicable | cli-or-rule-outside-v1 |
| apps/oxlint/fixtures/cli/ignore_patterns_symlink/testdir/.oxlintrc.json | non-applicable | cli-or-rule-outside-v1 |
| apps/oxlint/fixtures/cli/ignore_patterns_symlink/testdir/ignored_dir/index.ts | non-applicable | cli-or-rule-outside-v1 |
| apps/oxlint/fixtures/cli/ignore_patterns_whitelist/.oxlintrc.json | enabled | adapter:ignore-whitelist |
| apps/oxlint/fixtures/cli/ignore_patterns_whitelist/index.ts | enabled | adapter:ignore-whitelist |
| apps/oxlint/fixtures/cli/ignore_patterns_whitelist/index.whitelist.ts | enabled | adapter:ignore-whitelist |
| apps/oxlint/fixtures/cli/import-cycle/a.ts | non-applicable | module-graph-not-exposed |
| apps/oxlint/fixtures/cli/import-cycle/b.ts | non-applicable | module-graph-not-exposed |
| apps/oxlint/fixtures/cli/import/.oxlintrc-import-x.json | non-applicable | module-graph-not-exposed |
| apps/oxlint/fixtures/cli/import/.oxlintrc.json | non-applicable | module-graph-not-exposed |
| apps/oxlint/fixtures/cli/import/test.js | non-applicable | module-graph-not-exposed |
| apps/oxlint/fixtures/cli/invalid_config_complex_enum/.oxlintrc.json | non-applicable | cli-or-rule-outside-v1 |
| apps/oxlint/fixtures/cli/invalid_config_enum/.oxlintrc.json | non-applicable | cli-or-rule-outside-v1 |
| apps/oxlint/fixtures/cli/invalid_config_extra_options/.oxlintrc.json | non-applicable | cli-or-rule-outside-v1 |
| apps/oxlint/fixtures/cli/invalid_config_in_override/.oxlintrc.json | non-applicable | nested-or-advanced-config-not-exposed |
| apps/oxlint/fixtures/cli/invalid_config_missing_builtin_rule/.oxlintrc.json | non-applicable | cli-or-rule-outside-v1 |
| apps/oxlint/fixtures/cli/invalid_config_missing_rule_in_override/.oxlintrc.json | non-applicable | nested-or-advanced-config-not-exposed |
| apps/oxlint/fixtures/cli/invalid_config_multiple_rules/.oxlintrc.json | non-applicable | cli-or-rule-outside-v1 |
| apps/oxlint/fixtures/cli/invalid_config_nested/.oxlintrc.json | non-applicable | nested-or-advanced-config-not-exposed |
| apps/oxlint/fixtures/cli/invalid_config_nested/invalid/.oxlintrc.json | non-applicable | nested-or-advanced-config-not-exposed |
| apps/oxlint/fixtures/cli/invalid_config_nested/invalid/foo.ts | non-applicable | nested-or-advanced-config-not-exposed |
| apps/oxlint/fixtures/cli/invalid_config_rules_without_config/.oxlintrc.json | non-applicable | cli-or-rule-outside-v1 |
| apps/oxlint/fixtures/cli/invalid_config_sort_imports/.oxlintrc.json | non-applicable | module-graph-not-exposed |
| apps/oxlint/fixtures/cli/invalid_config_tuple_rules/.oxlintrc.json | non-applicable | cli-or-rule-outside-v1 |
| apps/oxlint/fixtures/cli/invalid_config_type_difference/.oxlintrc.json | non-applicable | cli-or-rule-outside-v1 |
| apps/oxlint/fixtures/cli/invalid_config_with_rule_alias/.oxlintrc.json | non-applicable | cli-or-rule-outside-v1 |
| apps/oxlint/fixtures/cli/invalid_glob_in_override/.oxlintrc.json | non-applicable | nested-or-advanced-config-not-exposed |
| apps/oxlint/fixtures/cli/issue_10054/.oxlintrc.json | non-applicable | cli-or-rule-outside-v1 |
| apps/oxlint/fixtures/cli/issue_10054/a.ts | non-applicable | cli-or-rule-outside-v1 |
| apps/oxlint/fixtures/cli/issue_10054/b.ts | non-applicable | cli-or-rule-outside-v1 |
| apps/oxlint/fixtures/cli/issue_10394/.oxlintrc.json | non-applicable | cli-or-rule-outside-v1 |
| apps/oxlint/fixtures/cli/issue_10394/foo.test.ts | non-applicable | cli-or-rule-outside-v1 |
| apps/oxlint/fixtures/cli/issue_11054/.oxlintrc.json | non-applicable | cli-or-rule-outside-v1 |
| apps/oxlint/fixtures/cli/issue_11054/index.js | non-applicable | cli-or-rule-outside-v1 |
| apps/oxlint/fixtures/cli/issue_11644/.oxlintrc.json | non-applicable | cli-or-rule-outside-v1 |
| apps/oxlint/fixtures/cli/issue_11644/test.jsx | non-applicable | cli-or-rule-outside-v1 |
| apps/oxlint/fixtures/cli/issue_7566/.oxlintignore | non-applicable | cli-or-rule-outside-v1 |
| apps/oxlint/fixtures/cli/issue_7566/tests/function/main.js | non-applicable | cli-or-rule-outside-v1 |
| apps/oxlint/fixtures/cli/issue_7566/tests/main.js | non-applicable | cli-or-rule-outside-v1 |
| apps/oxlint/fixtures/cli/jest_and_vitest_alias_rules/oxlint-jest.json | non-applicable | cli-or-rule-outside-v1 |
| apps/oxlint/fixtures/cli/jest_and_vitest_alias_rules/oxlint-vitest.json | non-applicable | cli-or-rule-outside-v1 |
| apps/oxlint/fixtures/cli/jest_and_vitest_alias_rules/test.js | non-applicable | cli-or-rule-outside-v1 |
| apps/oxlint/fixtures/cli/linter/.customignore | non-applicable | cli-flag-or-config-option-not-exposed |
| apps/oxlint/fixtures/cli/linter/config-deny-warnings-false.json | non-applicable | cli-flag-or-config-option-not-exposed |
| apps/oxlint/fixtures/cli/linter/config-deny-warnings.json | non-applicable | cli-flag-or-config-option-not-exposed |
| apps/oxlint/fixtures/cli/linter/config-max-warnings.json | non-applicable | cli-flag-or-config-option-not-exposed |
| apps/oxlint/fixtures/cli/linter/debugger.js | enabled | adapter:explicit-config |
| apps/oxlint/fixtures/cli/linter/eslintrc.json | enabled | adapter:explicit-config |
| apps/oxlint/fixtures/cli/linter/js_as_jsx.js | non-applicable | cli-flag-or-config-option-not-exposed |
| apps/oxlint/fixtures/cli/linter/nan.js | non-applicable | cli-flag-or-config-option-not-exposed |
| apps/oxlint/fixtures/cli/linter/no_extension | non-applicable | cli-flag-or-config-option-not-exposed |
| apps/oxlint/fixtures/cli/nested_config/.oxlintrc.json | non-applicable | nested-or-advanced-config-not-exposed |
| apps/oxlint/fixtures/cli/nested_config/console.ts | non-applicable | nested-or-advanced-config-not-exposed |
| apps/oxlint/fixtures/cli/nested_config/debugger.js | non-applicable | nested-or-advanced-config-not-exposed |
| apps/oxlint/fixtures/cli/nested_config/oxlint-no-console.json | non-applicable | nested-or-advanced-config-not-exposed |
| apps/oxlint/fixtures/cli/nested_config/package1-empty-config/.oxlintrc.json | non-applicable | nested-or-advanced-config-not-exposed |
| apps/oxlint/fixtures/cli/nested_config/package1-empty-config/console.ts | non-applicable | nested-or-advanced-config-not-exposed |
| apps/oxlint/fixtures/cli/nested_config/package1-empty-config/debugger.js | non-applicable | nested-or-advanced-config-not-exposed |
| apps/oxlint/fixtures/cli/nested_config/package2-no-config/console.ts | non-applicable | nested-or-advanced-config-not-exposed |
| apps/oxlint/fixtures/cli/nested_config/package2-no-config/debugger.js | non-applicable | nested-or-advanced-config-not-exposed |
| apps/oxlint/fixtures/cli/nested_config/package3-deep-config/.oxlintrc.json | non-applicable | nested-or-advanced-config-not-exposed |
| apps/oxlint/fixtures/cli/nested_config/package3-deep-config/src/.oxlintrc.json | non-applicable | nested-or-advanced-config-not-exposed |
| apps/oxlint/fixtures/cli/nested_config/package3-deep-config/src/components/component.js | non-applicable | nested-or-advanced-config-not-exposed |
| apps/oxlint/fixtures/cli/nested_config/package4-as-cwd/.oxlintrc.json | non-applicable | nested-or-advanced-config-not-exposed |
| apps/oxlint/fixtures/cli/nested_config/package4-as-cwd/component.js | non-applicable | nested-or-advanced-config-not-exposed |
| apps/oxlint/fixtures/cli/no_console_off/eslintrc.json | non-applicable | cli-or-rule-outside-v1 |
| apps/oxlint/fixtures/cli/no_console_off/test.js | non-applicable | cli-or-rule-outside-v1 |
| apps/oxlint/fixtures/cli/no_empty_allow_empty_catch/eslintrc.json | non-applicable | cli-or-rule-outside-v1 |
| apps/oxlint/fixtures/cli/no_empty_allow_empty_catch/test.js | non-applicable | cli-or-rule-outside-v1 |
| apps/oxlint/fixtures/cli/no_empty_disallow_empty_catch/eslintrc.json | non-applicable | cli-or-rule-outside-v1 |
| apps/oxlint/fixtures/cli/no_empty_disallow_empty_catch/test.js | non-applicable | cli-or-rule-outside-v1 |
| apps/oxlint/fixtures/cli/no_undef/eslintrc.json | non-applicable | cli-or-rule-outside-v1 |
| apps/oxlint/fixtures/cli/no_undef/test.js | non-applicable | cli-or-rule-outside-v1 |
| apps/oxlint/fixtures/cli/output_formatter_diagnostic/.oxlintrc.json | enabled | adapter:native-json-diagnostics |
| apps/oxlint/fixtures/cli/output_formatter_diagnostic/disable-directive.js | non-applicable | unused-disable-reporting-not-exposed |
| apps/oxlint/fixtures/cli/output_formatter_diagnostic/ok.js | enabled | adapter:native-json-diagnostics |
| apps/oxlint/fixtures/cli/output_formatter_diagnostic/parser-error.js | enabled | adapter:native-json-diagnostics |
| apps/oxlint/fixtures/cli/output_formatter_diagnostic/test.js | enabled | adapter:native-json-diagnostics |
| apps/oxlint/fixtures/cli/overrides/.oxlintrc.json | non-applicable | nested-or-advanced-config-not-exposed |
| apps/oxlint/fixtures/cli/overrides/directories-config.json | non-applicable | nested-or-advanced-config-not-exposed |
| apps/oxlint/fixtures/cli/overrides/lib/index.ts | non-applicable | nested-or-advanced-config-not-exposed |
| apps/oxlint/fixtures/cli/overrides/lib/tests/index.js | non-applicable | nested-or-advanced-config-not-exposed |
| apps/oxlint/fixtures/cli/overrides/other.jsx | non-applicable | nested-or-advanced-config-not-exposed |
| apps/oxlint/fixtures/cli/overrides/src/oxlint.js | non-applicable | nested-or-advanced-config-not-exposed |
| apps/oxlint/fixtures/cli/overrides/src/tests/index.js | non-applicable | nested-or-advanced-config-not-exposed |
| apps/oxlint/fixtures/cli/overrides/test.js | non-applicable | nested-or-advanced-config-not-exposed |
| apps/oxlint/fixtures/cli/overrides/test.ts | non-applicable | nested-or-advanced-config-not-exposed |
| apps/oxlint/fixtures/cli/overrides_env_globals/.oxlintrc.json | non-applicable | nested-or-advanced-config-not-exposed |
| apps/oxlint/fixtures/cli/overrides_env_globals/src/test.js | non-applicable | nested-or-advanced-config-not-exposed |
| apps/oxlint/fixtures/cli/overrides_env_globals/test.js | non-applicable | nested-or-advanced-config-not-exposed |
| apps/oxlint/fixtures/cli/overrides_env_globals/test.ts | non-applicable | nested-or-advanced-config-not-exposed |
| apps/oxlint/fixtures/cli/overrides_with_plugin/.oxlintrc.json | non-applicable | nested-or-advanced-config-not-exposed |
| apps/oxlint/fixtures/cli/overrides_with_plugin/index.test.ts | non-applicable | nested-or-advanced-config-not-exposed |
| apps/oxlint/fixtures/cli/overrides_with_plugin/index.ts | non-applicable | nested-or-advanced-config-not-exposed |
| apps/oxlint/fixtures/cli/print_config/ban_rules/eslintrc.json | non-applicable | cli-or-rule-outside-v1 |
| apps/oxlint/fixtures/cli/report_unused_directives/.oxlintrc-with-rudd.json | non-applicable | cli-or-rule-outside-v1 |
| apps/oxlint/fixtures/cli/report_unused_directives/.oxlintrc.json | non-applicable | cli-or-rule-outside-v1 |
| apps/oxlint/fixtures/cli/report_unused_directives/test-multiple-scripts.vue | non-applicable | cli-or-rule-outside-v1 |
| apps/oxlint/fixtures/cli/report_unused_directives/test.astro | non-applicable | cli-or-rule-outside-v1 |
| apps/oxlint/fixtures/cli/report_unused_directives/test.js | non-applicable | cli-or-rule-outside-v1 |
| apps/oxlint/fixtures/cli/report_unused_directives/test.svelte | non-applicable | cli-or-rule-outside-v1 |
| apps/oxlint/fixtures/cli/report_unused_directives/test.vue | non-applicable | cli-or-rule-outside-v1 |
| apps/oxlint/fixtures/cli/report_unused_directives_oxlint_only/.oxlintrc.json | non-applicable | cli-or-rule-outside-v1 |
| apps/oxlint/fixtures/cli/report_unused_directives_oxlint_only/test.js | non-applicable | cli-or-rule-outside-v1 |
| apps/oxlint/fixtures/cli/report_unused_directives_oxlint_only/test.vue | non-applicable | cli-or-rule-outside-v1 |
| apps/oxlint/fixtures/cli/root_config_ancestor/.oxlintrc.json | non-applicable | cli-or-rule-outside-v1 |
| apps/oxlint/fixtures/cli/root_config_ancestor/cwd/test.ts | non-applicable | cli-or-rule-outside-v1 |
| apps/oxlint/fixtures/cli/svelte/context-module-script-ts.svelte | non-applicable | language-outside-v1 |
| apps/oxlint/fixtures/cli/svelte/context-module-script.svelte | non-applicable | language-outside-v1 |
| apps/oxlint/fixtures/cli/svelte/debugger.svelte | non-applicable | language-outside-v1 |
| apps/oxlint/fixtures/cli/svelte/module-script.svelte | non-applicable | language-outside-v1 |
| apps/oxlint/fixtures/cli/test.min.js | non-applicable | cli-or-rule-outside-v1 |
| apps/oxlint/fixtures/cli/tsconfig/tsconfig.json | non-applicable | cli-or-rule-outside-v1 |
| apps/oxlint/fixtures/cli/tsgolint/.oxlintrc.json | non-applicable | type-aware-tsgolint |
| apps/oxlint/fixtures/cli/tsgolint/await-thenable.ts | non-applicable | type-aware-tsgolint |
| apps/oxlint/fixtures/cli/tsgolint/config-test.json | non-applicable | type-aware-tsgolint |
| apps/oxlint/fixtures/cli/tsgolint/config-type-aware-false-with-overrides.json | non-applicable | type-aware-tsgolint |
| apps/oxlint/fixtures/cli/tsgolint/config-type-aware-false.json | non-applicable | type-aware-tsgolint |
| apps/oxlint/fixtures/cli/tsgolint/config-type-aware-with-overrides.json | non-applicable | type-aware-tsgolint |
| apps/oxlint/fixtures/cli/tsgolint/config-type-aware.json | non-applicable | type-aware-tsgolint |
| apps/oxlint/fixtures/cli/tsgolint/consistent-return.ts | non-applicable | type-aware-tsgolint |
| apps/oxlint/fixtures/cli/tsgolint/consistent-type-exports.ts | non-applicable | type-aware-tsgolint |
| apps/oxlint/fixtures/cli/tsgolint/dot-notation.ts | non-applicable | type-aware-tsgolint |
| apps/oxlint/fixtures/cli/tsgolint/extended-config.json | non-applicable | type-aware-tsgolint |
| apps/oxlint/fixtures/cli/tsgolint/no-array-delete.ts | non-applicable | type-aware-tsgolint |
| apps/oxlint/fixtures/cli/tsgolint/no-base-to-string.ts | non-applicable | type-aware-tsgolint |
| apps/oxlint/fixtures/cli/tsgolint/no-confusing-void-expression.ts | non-applicable | type-aware-tsgolint |
| apps/oxlint/fixtures/cli/tsgolint/no-deprecated.ts | non-applicable | type-aware-tsgolint |
| apps/oxlint/fixtures/cli/tsgolint/no-duplicate-type-constituents.ts | non-applicable | type-aware-tsgolint |
| apps/oxlint/fixtures/cli/tsgolint/no-floating-promises.ts | non-applicable | type-aware-tsgolint |
| apps/oxlint/fixtures/cli/tsgolint/no-for-in-array.ts | non-applicable | type-aware-tsgolint |
| apps/oxlint/fixtures/cli/tsgolint/no-implied-eval.ts | non-applicable | type-aware-tsgolint |
| apps/oxlint/fixtures/cli/tsgolint/no-meaningless-void-operator.ts | non-applicable | type-aware-tsgolint |
| apps/oxlint/fixtures/cli/tsgolint/no-misused-spread.ts | non-applicable | type-aware-tsgolint |
| apps/oxlint/fixtures/cli/tsgolint/no-mixed-enums.ts | non-applicable | type-aware-tsgolint |
| apps/oxlint/fixtures/cli/tsgolint/no-redundant-type-constituents.ts | non-applicable | type-aware-tsgolint |
| apps/oxlint/fixtures/cli/tsgolint/no-unnecessary-boolean-literal-compare.ts | non-applicable | type-aware-tsgolint |
| apps/oxlint/fixtures/cli/tsgolint/no-unnecessary-condition.ts | non-applicable | type-aware-tsgolint |
| apps/oxlint/fixtures/cli/tsgolint/no-unnecessary-qualifier.ts | non-applicable | type-aware-tsgolint |
| apps/oxlint/fixtures/cli/tsgolint/no-unnecessary-template-expression.ts | non-applicable | type-aware-tsgolint |
| apps/oxlint/fixtures/cli/tsgolint/no-unnecessary-type-arguments.ts | non-applicable | type-aware-tsgolint |
| apps/oxlint/fixtures/cli/tsgolint/no-unnecessary-type-assertion.ts | non-applicable | type-aware-tsgolint |
| apps/oxlint/fixtures/cli/tsgolint/no-unnecessary-type-conversion.ts | non-applicable | type-aware-tsgolint |
| apps/oxlint/fixtures/cli/tsgolint/no-unnecessary-type-parameters.ts | non-applicable | type-aware-tsgolint |
| apps/oxlint/fixtures/cli/tsgolint/no-unsafe-argument.ts | non-applicable | type-aware-tsgolint |
| apps/oxlint/fixtures/cli/tsgolint/no-unsafe-assignment.ts | non-applicable | type-aware-tsgolint |
| apps/oxlint/fixtures/cli/tsgolint/no-unsafe-call.ts | non-applicable | type-aware-tsgolint |
| apps/oxlint/fixtures/cli/tsgolint/no-unsafe-enum-comparison.ts | non-applicable | type-aware-tsgolint |
| apps/oxlint/fixtures/cli/tsgolint/no-unsafe-member-access.ts | non-applicable | type-aware-tsgolint |
| apps/oxlint/fixtures/cli/tsgolint/no-unsafe-return.ts | non-applicable | type-aware-tsgolint |
| apps/oxlint/fixtures/cli/tsgolint/no-unsafe-type-assertion.ts | non-applicable | type-aware-tsgolint |
| apps/oxlint/fixtures/cli/tsgolint/no-unsafe-unary-minus.ts | non-applicable | type-aware-tsgolint |
| apps/oxlint/fixtures/cli/tsgolint/no-useless-default-assignment.ts | non-applicable | type-aware-tsgolint |
| apps/oxlint/fixtures/cli/tsgolint/non-nullable-type-assertion-style.ts | non-applicable | type-aware-tsgolint |
| apps/oxlint/fixtures/cli/tsgolint/non-tsgolint.ts | non-applicable | type-aware-tsgolint |
| apps/oxlint/fixtures/cli/tsgolint/only-throw-error.ts | non-applicable | type-aware-tsgolint |
| apps/oxlint/fixtures/cli/tsgolint/prefer-find.ts | non-applicable | type-aware-tsgolint |
| apps/oxlint/fixtures/cli/tsgolint/prefer-includes.ts | non-applicable | type-aware-tsgolint |
| apps/oxlint/fixtures/cli/tsgolint/prefer-nullish-coalescing.ts | non-applicable | type-aware-tsgolint |
| apps/oxlint/fixtures/cli/tsgolint/prefer-optional-chain.ts | non-applicable | type-aware-tsgolint |
| apps/oxlint/fixtures/cli/tsgolint/prefer-promise-reject-errors.ts | non-applicable | type-aware-tsgolint |
| apps/oxlint/fixtures/cli/tsgolint/prefer-readonly-parameter-types.ts | non-applicable | type-aware-tsgolint |
| apps/oxlint/fixtures/cli/tsgolint/prefer-readonly.ts | non-applicable | type-aware-tsgolint |
| apps/oxlint/fixtures/cli/tsgolint/prefer-reduce-type-parameter.ts | non-applicable | type-aware-tsgolint |
| apps/oxlint/fixtures/cli/tsgolint/prefer-regexp-exec.ts | non-applicable | type-aware-tsgolint |
| apps/oxlint/fixtures/cli/tsgolint/prefer-return-this-type.ts | non-applicable | type-aware-tsgolint |
| apps/oxlint/fixtures/cli/tsgolint/prefer-string-starts-ends-with.ts | non-applicable | type-aware-tsgolint |
| apps/oxlint/fixtures/cli/tsgolint/promise-function-async.ts | non-applicable | type-aware-tsgolint |
| apps/oxlint/fixtures/cli/tsgolint/related-getter-setter-pairs.ts | non-applicable | type-aware-tsgolint |
| apps/oxlint/fixtures/cli/tsgolint/require-array-sort-compare.ts | non-applicable | type-aware-tsgolint |
| apps/oxlint/fixtures/cli/tsgolint/require-await.ts | non-applicable | type-aware-tsgolint |
| apps/oxlint/fixtures/cli/tsgolint/restrict-plus-operands.ts | non-applicable | type-aware-tsgolint |
| apps/oxlint/fixtures/cli/tsgolint/restrict-template-expressions.ts | non-applicable | type-aware-tsgolint |
| apps/oxlint/fixtures/cli/tsgolint/return-await.ts | non-applicable | type-aware-tsgolint |
| apps/oxlint/fixtures/cli/tsgolint/strict-boolean-expressions.ts | non-applicable | type-aware-tsgolint |
| apps/oxlint/fixtures/cli/tsgolint/strict-void-return.ts | non-applicable | type-aware-tsgolint |
| apps/oxlint/fixtures/cli/tsgolint/switch-exhaustiveness-check.ts | non-applicable | type-aware-tsgolint |
| apps/oxlint/fixtures/cli/tsgolint/test.svelte | non-applicable | type-aware-tsgolint |
| apps/oxlint/fixtures/cli/tsgolint/tsconfig.json | non-applicable | type-aware-tsgolint |
| apps/oxlint/fixtures/cli/tsgolint/unbound-method.ts | non-applicable | type-aware-tsgolint |
| apps/oxlint/fixtures/cli/tsgolint/use-unknown-in-catch-callback-variable.ts | non-applicable | type-aware-tsgolint |
| apps/oxlint/fixtures/cli/tsgolint_config_error/index.ts | non-applicable | type-aware-tsgolint |
| apps/oxlint/fixtures/cli/tsgolint_config_error/tsconfig.json | non-applicable | type-aware-tsgolint |
| apps/oxlint/fixtures/cli/tsgolint_disable_directives/no-unnecessary-type-parameters-disable.ts | non-applicable | type-aware-tsgolint |
| apps/oxlint/fixtures/cli/tsgolint_disable_directives/test.ts | non-applicable | type-aware-tsgolint |
| apps/oxlint/fixtures/cli/tsgolint_disable_directives/tsconfig.json | non-applicable | type-aware-tsgolint |
| apps/oxlint/fixtures/cli/tsgolint_disable_directives/unused.ts | non-applicable | type-aware-tsgolint |
| apps/oxlint/fixtures/cli/tsgolint_fix/fix.ts | non-applicable | type-aware-tsgolint |
| apps/oxlint/fixtures/cli/tsgolint_fix/tsconfig.json | non-applicable | type-aware-tsgolint |
| apps/oxlint/fixtures/cli/tsgolint_rule_options/.oxlintrc.json | non-applicable | type-aware-tsgolint |
| apps/oxlint/fixtures/cli/tsgolint_rule_options/test.ts | non-applicable | type-aware-tsgolint |
| apps/oxlint/fixtures/cli/tsgolint_rule_options/tsconfig.json | non-applicable | type-aware-tsgolint |
| apps/oxlint/fixtures/cli/tsgolint_tsconfig_extends_config_err/index.ts | non-applicable | type-aware-tsgolint |
| apps/oxlint/fixtures/cli/tsgolint_tsconfig_extends_config_err/tsconfig.base.json | non-applicable | type-aware-tsgolint |
| apps/oxlint/fixtures/cli/tsgolint_tsconfig_extends_config_err/tsconfig.json | non-applicable | type-aware-tsgolint |
| apps/oxlint/fixtures/cli/tsgolint_type_check_only_svelte_syntax_error/test.svelte | non-applicable | type-aware-tsgolint |
| apps/oxlint/fixtures/cli/tsgolint_type_check_only_syntax_error/index.ts | non-applicable | type-aware-tsgolint |
| apps/oxlint/fixtures/cli/tsgolint_type_error/.oxlintrc.json | non-applicable | type-aware-tsgolint |
| apps/oxlint/fixtures/cli/tsgolint_type_error/config-type-check-false.json | non-applicable | type-aware-tsgolint |
| apps/oxlint/fixtures/cli/tsgolint_type_error/config-type-check-zero-rules.json | non-applicable | type-aware-tsgolint |
| apps/oxlint/fixtures/cli/tsgolint_type_error/config-type-check.json | non-applicable | type-aware-tsgolint |
| apps/oxlint/fixtures/cli/tsgolint_type_error/index.js | non-applicable | type-aware-tsgolint |
| apps/oxlint/fixtures/cli/tsgolint_type_error/index.ts | non-applicable | type-aware-tsgolint |
| apps/oxlint/fixtures/cli/tsgolint_type_error/tsconfig.json | non-applicable | type-aware-tsgolint |
| apps/oxlint/fixtures/cli/two_rules_with_same_rule_name/.oxlintrc.json | non-applicable | cli-or-rule-outside-v1 |
| apps/oxlint/fixtures/cli/two_rules_with_same_rule_name/test.js | non-applicable | cli-or-rule-outside-v1 |
| apps/oxlint/fixtures/cli/typescript_eslint/eslintrc.json | non-applicable | cli-or-rule-outside-v1 |
| apps/oxlint/fixtures/cli/typescript_eslint/test.ts | non-applicable | cli-or-rule-outside-v1 |
| apps/oxlint/fixtures/cli/valid_complex_config/.oxlintrc.json | non-applicable | cli-or-rule-outside-v1 |
| apps/oxlint/fixtures/cli/valid_complex_config/index.ts | non-applicable | cli-or-rule-outside-v1 |
| apps/oxlint/fixtures/cli/valid_config_rules_with_dummy_config/.oxlintrc.json | non-applicable | cli-or-rule-outside-v1 |
| apps/oxlint/fixtures/cli/valid_config_rules_with_dummy_config/test.js | non-applicable | cli-or-rule-outside-v1 |
| apps/oxlint/fixtures/cli/vue/debugger.vue | non-applicable | language-outside-v1 |
| apps/oxlint/fixtures/cli/vue/empty.vue | non-applicable | language-outside-v1 |
| apps/oxlint/fixtures/cli/vue/invalid.vue | non-applicable | language-outside-v1 |
| apps/oxlint/fixtures/cli/walk_dir/bar.vue | non-applicable | cli-or-rule-outside-v1 |
| apps/oxlint/fixtures/cli/walk_dir/foo.js | non-applicable | cli-or-rule-outside-v1 |
## CLI snapshot ledger

| Snapshot | Classification | Reason |
| --- | --- | --- |
| apps/oxlint/src/snapshots/_--debug files fixtures__cli__linter@oxlint.snap | non-applicable | cli-reporter-or-command-not-exposed |
| apps/oxlint/src/snapshots/_--debug timings --threads 1 -A all -W no-debugger fixtures__cli__linter__debugger.js@oxlint.snap | non-applicable | cli-reporter-or-command-not-exposed |
| apps/oxlint/src/snapshots/_--ignore-path fixtures__cli__issue_7566__.oxlintignore fixtures__cli__issue_7566__tests__main.js fixtures__cli__issue_7566__tests__function__main.js@oxlint.snap | non-applicable | cli-reporter-or-command-not-exposed |
| apps/oxlint/src/snapshots/_--ignore-path fixtures__cli__linter__.customignore --no-ignore fixtures__cli__linter__nan.js@oxlint.snap | non-applicable | cli-reporter-or-command-not-exposed |
| apps/oxlint/src/snapshots/_--ignore-path fixtures__cli__linter__.customignore fixtures__cli__linter__nan.js@oxlint.snap | non-applicable | cli-reporter-or-command-not-exposed |
| apps/oxlint/src/snapshots/_--ignore-pattern _____.js --ignore-pattern _____.vue fixtures__cli__linter@oxlint.snap | non-applicable | cli-reporter-or-command-not-exposed |
| apps/oxlint/src/snapshots/_--import-plugin -A all -D no-cycle fixtures__cli__flow__@oxlint.snap | non-applicable | language-outside-v1 |
| apps/oxlint/src/snapshots/_--import-plugin fixtures__cli__flow__index.mjs@oxlint.snap | non-applicable | language-outside-v1 |
| apps/oxlint/src/snapshots/_--no-error-on-unmatched-pattern --ignore-path fixtures__cli__linter__.customignore fixtures__cli__linter__nan.js@oxlint.snap | non-applicable | cli-reporter-or-command-not-exposed |
| apps/oxlint/src/snapshots/_--no-error-on-unmatched-pattern foo.asdf@oxlint.snap | non-applicable | cli-reporter-or-command-not-exposed |
| apps/oxlint/src/snapshots/_--vitest-plugin -c fixtures__cli__eslintrc_vitest_replace__eslintrc.json fixtures__cli__eslintrc_vitest_replace__foo.test.js@oxlint.snap | non-applicable | cli-reporter-or-command-not-exposed |
| apps/oxlint/src/snapshots/_-A all fixtures__cli__linter@oxlint.snap | non-applicable | cli-reporter-or-command-not-exposed |
| apps/oxlint/src/snapshots/_-D correctness fixtures__cli__linter__debugger.js@oxlint.snap | non-applicable | cli-reporter-or-command-not-exposed |
| apps/oxlint/src/snapshots/_-W correctness -A no-debugger fixtures__cli__linter__debugger.js@oxlint.snap | non-applicable | cli-reporter-or-command-not-exposed |
| apps/oxlint/src/snapshots/_-W no-undef -c fixtures__cli__eslintrc_env__eslintrc_no_env.json fixtures__cli__eslintrc_env__test.js@oxlint.snap | non-applicable | cli-reporter-or-command-not-exposed |
| apps/oxlint/src/snapshots/_-W no-undef -c fixtures__cli__no_undef__eslintrc.json fixtures__cli__no_undef__test.js@oxlint.snap | non-applicable | cli-reporter-or-command-not-exposed |
| apps/oxlint/src/snapshots/_-c fixtures__cli__config_ignore_patterns__ignore_extension__eslintrc.json fixtures__cli__config_ignore_patterns__ignore_extension@oxlint.snap | enabled | adapter:ignore-extension |
| apps/oxlint/src/snapshots/_-c fixtures__cli__config_ignore_patterns__ignore_extension__eslintrc.json fixtures__cli__config_ignore_patterns__ignore_extension__main.js@oxlint.snap | enabled | adapter:ignore-extension |
| apps/oxlint/src/snapshots/_-c fixtures__cli__eslintrc_env__eslintrc_env_browser.json fixtures__cli__eslintrc_env__test.js@oxlint.snap | non-applicable | cli-reporter-or-command-not-exposed |
| apps/oxlint/src/snapshots/_-c fixtures__cli__eslintrc_off__eslintrc.json fixtures__cli__eslintrc_off__test.js@oxlint.snap | non-applicable | cli-reporter-or-command-not-exposed |
| apps/oxlint/src/snapshots/_-c fixtures__cli__eslintrc_vitest_replace__eslintrc.json fixtures__cli__eslintrc_vitest_replace__foo.test.js@oxlint.snap | non-applicable | cli-reporter-or-command-not-exposed |
| apps/oxlint/src/snapshots/_-c fixtures__cli__linter__eslintrc.json fixtures__cli__linter__debugger.js@oxlint.snap | enabled | adapter:explicit-config |
| apps/oxlint/src/snapshots/_-c fixtures__cli__no_console_off__eslintrc.json fixtures__cli__no_console_off__test.js@oxlint.snap | non-applicable | cli-reporter-or-command-not-exposed |
| apps/oxlint/src/snapshots/_-c fixtures__cli__no_empty_allow_empty_catch__eslintrc.json -W no-empty fixtures__cli__no_empty_allow_empty_catch__test.js@oxlint.snap | non-applicable | cli-reporter-or-command-not-exposed |
| apps/oxlint/src/snapshots/_-c fixtures__cli__no_empty_disallow_empty_catch__eslintrc.json -W no-empty fixtures__cli__no_empty_disallow_empty_catch__test.js@oxlint.snap | non-applicable | cli-reporter-or-command-not-exposed |
| apps/oxlint/src/snapshots/_-c fixtures__cli__overrides__directories-config.json fixtures__cli__overrides@oxlint.snap | non-applicable | cli-reporter-or-command-not-exposed |
| apps/oxlint/src/snapshots/_-c fixtures__cli__print_config__ban_rules__eslintrc.json -A all -D eqeqeq --print-config@oxlint.snap | non-applicable | cli-reporter-or-command-not-exposed |
| apps/oxlint/src/snapshots/_-c fixtures__cli__typescript_eslint__eslintrc.json --disable-typescript-plugin fixtures__cli__typescript_eslint__test.ts@oxlint.snap | non-applicable | cli-reporter-or-command-not-exposed |
| apps/oxlint/src/snapshots/_-c fixtures__cli__typescript_eslint__eslintrc.json fixtures__cli__typescript_eslint__test.ts@oxlint.snap | non-applicable | cli-reporter-or-command-not-exposed |
| apps/oxlint/src/snapshots/_fixtures__cli__astro__debugger.astro@oxlint.snap | non-applicable | language-outside-v1 |
| apps/oxlint/src/snapshots/_fixtures__cli__linter@oxlint.snap | non-applicable | cli-reporter-or-command-not-exposed |
| apps/oxlint/src/snapshots/_fixtures__cli__linter__debugger.js fixtures__cli__linter__nan.js@oxlint.snap | non-applicable | cli-reporter-or-command-not-exposed |
| apps/oxlint/src/snapshots/_fixtures__cli__linter__debugger.js@oxlint.snap | non-applicable | cli-reporter-or-command-not-exposed |
| apps/oxlint/src/snapshots/_fixtures__cli__linter__js_as_jsx.js@oxlint.snap | non-applicable | cli-reporter-or-command-not-exposed |
| apps/oxlint/src/snapshots/_fixtures__cli__svelte__debugger.svelte@oxlint.snap | non-applicable | language-outside-v1 |
| apps/oxlint/src/snapshots/_fixtures__cli__vue__debugger.vue@oxlint.snap | non-applicable | language-outside-v1 |
| apps/oxlint/src/snapshots/_fixtures__cli__vue__empty.vue@oxlint.snap | non-applicable | language-outside-v1 |
| apps/oxlint/src/snapshots/_fixtures__cli__vue__invalid.vue@oxlint.snap | non-applicable | language-outside-v1 |
| apps/oxlint/src/snapshots/_foo.asdf@oxlint.snap | non-applicable | cli-reporter-or-command-not-exposed |
| apps/oxlint/src/snapshots/fixtures_-A all --print-config@oxlint.snap | non-applicable | cli-reporter-or-command-not-exposed |
| apps/oxlint/src/snapshots/fixtures__cli__auto_config_detection_debugger.js@oxlint.snap | enabled | adapter:auto-config-json |
| apps/oxlint/src/snapshots/fixtures__cli__auto_config_detection_jsonc_debugger.js@oxlint.snap | enabled | adapter:auto-config-jsonc |
| apps/oxlint/src/snapshots/fixtures__cli__auto_config_parse_error_debugger.js@oxlint.snap | enabled | adapter:malformed-config |
| apps/oxlint/src/snapshots/fixtures__cli__config_ignore_patterns__ignore_directory_-c eslintrc.json@oxlint.snap | enabled | adapter:ignore-directory |
| apps/oxlint/src/snapshots/fixtures__cli__config_ignore_patterns__with_oxlintrc_-c .__test__eslintrc.json --ignore-pattern _.ts .@oxlint.snap | non-applicable | cli-reporter-or-command-not-exposed |
| apps/oxlint/src/snapshots/fixtures__cli__cross_module_extended_config_@oxlint.snap | non-applicable | cli-reporter-or-command-not-exposed |
| apps/oxlint/src/snapshots/fixtures__cli__cross_module_nested_config_@oxlint.snap | non-applicable | cli-reporter-or-command-not-exposed |
| apps/oxlint/src/snapshots/fixtures__cli__disable_directive_issue_13311_test.jsx test2.d.ts@oxlint.snap | non-applicable | cli-reporter-or-command-not-exposed |
| apps/oxlint/src/snapshots/fixtures__cli__disable_vitest_rules_-c .oxlintrc-vitest.json --report-unused-disable-directives test.js@oxlint.snap | non-applicable | cli-reporter-or-command-not-exposed |
| apps/oxlint/src/snapshots/fixtures__cli__dot_folder_@oxlint.snap | non-applicable | cli-reporter-or-command-not-exposed |
| apps/oxlint/src/snapshots/fixtures__cli__eslint_and_typescript_alias_rules_-c oxlint-eslint.json test.js -c oxlint-typescript.json test.js@oxlint.snap | non-applicable | cli-reporter-or-command-not-exposed |
| apps/oxlint/src/snapshots/fixtures__cli__extends_config_--config extends_rules_config.json console.js@oxlint.snap | non-applicable | cli-reporter-or-command-not-exposed |
| apps/oxlint/src/snapshots/fixtures__cli__extends_config_--config relative_paths__extends_extends_config.json console.js@oxlint.snap | non-applicable | cli-reporter-or-command-not-exposed |
| apps/oxlint/src/snapshots/fixtures__cli__extends_config_--disable-nested-config@oxlint.snap | non-applicable | cli-reporter-or-command-not-exposed |
| apps/oxlint/src/snapshots/fixtures__cli__extends_config_overrides@oxlint.snap | non-applicable | cli-reporter-or-command-not-exposed |
| apps/oxlint/src/snapshots/fixtures__cli__extends_config_overrides_same_directory@oxlint.snap | non-applicable | cli-reporter-or-command-not-exposed |
| apps/oxlint/src/snapshots/fixtures__cli__extends_invalid_config_@oxlint.snap | non-applicable | cli-reporter-or-command-not-exposed |
| apps/oxlint/src/snapshots/fixtures__cli__ignore_file_current_dir_ .@oxlint.snap | enabled | adapter:ignore-current-directory |
| apps/oxlint/src/snapshots/fixtures__cli__ignore_pattern_non_glob_syntax_ .@oxlint.snap | enabled | adapter:ignore-non-glob |
| apps/oxlint/src/snapshots/fixtures__cli__ignore_patterns_ancestor_config_-c .__packages__..__.oxlintrc.json .@oxlint.snap | non-applicable | cli-reporter-or-command-not-exposed |
| apps/oxlint/src/snapshots/fixtures__cli__ignore_patterns_ancestor_config__packages__foo_.@oxlint.snap | non-applicable | cli-reporter-or-command-not-exposed |
| apps/oxlint/src/snapshots/fixtures__cli__ignore_patterns_empty_nested_ .@oxlint.snap | enabled | adapter:ignore-empty-nested-root |
| apps/oxlint/src/snapshots/fixtures__cli__ignore_patterns_relative_ .@oxlint.snap | enabled | adapter:ignore-relative |
| apps/oxlint/src/snapshots/fixtures__cli__ignore_patterns_symlink_ .@oxlint.snap | non-applicable | cli-reporter-or-command-not-exposed |
| apps/oxlint/src/snapshots/fixtures__cli__ignore_patterns_whitelist_ .@oxlint.snap | enabled | adapter:ignore-whitelist |
| apps/oxlint/src/snapshots/fixtures__cli__import-cycle_--import-plugin -D import__no-cycle@oxlint.snap | non-applicable | module-graph-not-exposed |
| apps/oxlint/src/snapshots/fixtures__cli__import_-c .oxlintrc.json test.js -c .oxlintrc-import-x.json test.js@oxlint.snap | non-applicable | module-graph-not-exposed |
| apps/oxlint/src/snapshots/fixtures__cli__invalid_config_complex_enum_@oxlint.snap | non-applicable | cli-reporter-or-command-not-exposed |
| apps/oxlint/src/snapshots/fixtures__cli__invalid_config_enum_@oxlint.snap | non-applicable | cli-reporter-or-command-not-exposed |
| apps/oxlint/src/snapshots/fixtures__cli__invalid_config_extra_options_@oxlint.snap | non-applicable | cli-reporter-or-command-not-exposed |
| apps/oxlint/src/snapshots/fixtures__cli__invalid_config_in_override_@oxlint.snap | non-applicable | cli-reporter-or-command-not-exposed |
| apps/oxlint/src/snapshots/fixtures__cli__invalid_config_missing_builtin_rule_@oxlint.snap | non-applicable | cli-reporter-or-command-not-exposed |
| apps/oxlint/src/snapshots/fixtures__cli__invalid_config_missing_rule_in_override_@oxlint.snap | non-applicable | cli-reporter-or-command-not-exposed |
| apps/oxlint/src/snapshots/fixtures__cli__invalid_config_multiple_rules_@oxlint.snap | non-applicable | cli-reporter-or-command-not-exposed |
| apps/oxlint/src/snapshots/fixtures__cli__invalid_config_nested_@oxlint.snap | non-applicable | cli-reporter-or-command-not-exposed |
| apps/oxlint/src/snapshots/fixtures__cli__invalid_config_rules_without_config_@oxlint.snap | non-applicable | cli-reporter-or-command-not-exposed |
| apps/oxlint/src/snapshots/fixtures__cli__invalid_config_sort_imports_@oxlint.snap | non-applicable | module-graph-not-exposed |
| apps/oxlint/src/snapshots/fixtures__cli__invalid_config_tuple_rules_@oxlint.snap | non-applicable | cli-reporter-or-command-not-exposed |
| apps/oxlint/src/snapshots/fixtures__cli__invalid_config_type_difference_@oxlint.snap | non-applicable | cli-reporter-or-command-not-exposed |
| apps/oxlint/src/snapshots/fixtures__cli__invalid_config_with_rule_alias_@oxlint.snap | non-applicable | cli-reporter-or-command-not-exposed |
| apps/oxlint/src/snapshots/fixtures__cli__invalid_glob_in_override_@oxlint.snap | non-applicable | cli-reporter-or-command-not-exposed |
| apps/oxlint/src/snapshots/fixtures__cli__issue_10394_-c .oxlintrc.json@oxlint.snap | non-applicable | cli-reporter-or-command-not-exposed |
| apps/oxlint/src/snapshots/fixtures__cli__issue_11054_-c .oxlintrc.json@oxlint.snap | non-applicable | cli-reporter-or-command-not-exposed |
| apps/oxlint/src/snapshots/fixtures__cli__issue_11644_-c .oxlintrc.json@oxlint.snap | non-applicable | cli-reporter-or-command-not-exposed |
| apps/oxlint/src/snapshots/fixtures__cli__jest_and_vitest_alias_rules_-c oxlint-jest.json test.js -c oxlint-vitest.json test.js@oxlint.snap | non-applicable | cli-reporter-or-command-not-exposed |
| apps/oxlint/src/snapshots/fixtures__cli__linter_--deny-warnings -c config-deny-warnings-false.json debugger.js@oxlint.snap | non-applicable | cli-reporter-or-command-not-exposed |
| apps/oxlint/src/snapshots/fixtures__cli__linter_--max-warnings 1 -c config-max-warnings.json debugger.js@oxlint.snap | non-applicable | cli-reporter-or-command-not-exposed |
| apps/oxlint/src/snapshots/fixtures__cli__linter_-c config-deny-warnings.json debugger.js@oxlint.snap | non-applicable | cli-reporter-or-command-not-exposed |
| apps/oxlint/src/snapshots/fixtures__cli__linter_-c config-max-warnings.json debugger.js@oxlint.snap | non-applicable | cli-reporter-or-command-not-exposed |
| apps/oxlint/src/snapshots/fixtures__cli__linter_debugger.js@oxlint.snap | non-applicable | cli-reporter-or-command-not-exposed |
| apps/oxlint/src/snapshots/fixtures__cli__nested_config_--config oxlint-no-console.json@oxlint.snap | non-applicable | cli-reporter-or-command-not-exposed |
| apps/oxlint/src/snapshots/fixtures__cli__nested_config_-A no-console --config oxlint-no-console.json@oxlint.snap | non-applicable | cli-reporter-or-command-not-exposed |
| apps/oxlint/src/snapshots/fixtures__cli__nested_config_-A no-console@oxlint.snap | non-applicable | cli-reporter-or-command-not-exposed |
| apps/oxlint/src/snapshots/fixtures__cli__nested_config_@oxlint.snap | non-applicable | cli-reporter-or-command-not-exposed |
| apps/oxlint/src/snapshots/fixtures__cli__nested_config__package4-as-cwd_@oxlint.snap | non-applicable | cli-reporter-or-command-not-exposed |
| apps/oxlint/src/snapshots/fixtures__cli__nested_config_package3-deep-config@oxlint.snap | non-applicable | cli-reporter-or-command-not-exposed |
| apps/oxlint/src/snapshots/fixtures__cli__output_formatter_diagnostic_--format=agent --report-unused-disable-directives disable-directive.js@oxlint.snap | non-applicable | reporter-or-unused-disable-output-not-exposed |
| apps/oxlint/src/snapshots/fixtures__cli__output_formatter_diagnostic_--format=agent ok.js@oxlint.snap | non-applicable | reporter-or-unused-disable-output-not-exposed |
| apps/oxlint/src/snapshots/fixtures__cli__output_formatter_diagnostic_--format=agent parser-error.js@oxlint.snap | non-applicable | reporter-or-unused-disable-output-not-exposed |
| apps/oxlint/src/snapshots/fixtures__cli__output_formatter_diagnostic_--format=agent test.js@oxlint.snap | non-applicable | reporter-or-unused-disable-output-not-exposed |
| apps/oxlint/src/snapshots/fixtures__cli__output_formatter_diagnostic_--format=checkstyle --report-unused-disable-directives disable-directive.js@oxlint.snap | non-applicable | reporter-or-unused-disable-output-not-exposed |
| apps/oxlint/src/snapshots/fixtures__cli__output_formatter_diagnostic_--format=checkstyle ok.js@oxlint.snap | non-applicable | reporter-or-unused-disable-output-not-exposed |
| apps/oxlint/src/snapshots/fixtures__cli__output_formatter_diagnostic_--format=checkstyle parser-error.js@oxlint.snap | non-applicable | reporter-or-unused-disable-output-not-exposed |
| apps/oxlint/src/snapshots/fixtures__cli__output_formatter_diagnostic_--format=checkstyle test.js@oxlint.snap | non-applicable | reporter-or-unused-disable-output-not-exposed |
| apps/oxlint/src/snapshots/fixtures__cli__output_formatter_diagnostic_--format=default --report-unused-disable-directives disable-directive.js@oxlint.snap | non-applicable | reporter-or-unused-disable-output-not-exposed |
| apps/oxlint/src/snapshots/fixtures__cli__output_formatter_diagnostic_--format=default ok.js@oxlint.snap | non-applicable | reporter-or-unused-disable-output-not-exposed |
| apps/oxlint/src/snapshots/fixtures__cli__output_formatter_diagnostic_--format=default parser-error.js@oxlint.snap | non-applicable | reporter-or-unused-disable-output-not-exposed |
| apps/oxlint/src/snapshots/fixtures__cli__output_formatter_diagnostic_--format=default test.js@oxlint.snap | non-applicable | reporter-or-unused-disable-output-not-exposed |
| apps/oxlint/src/snapshots/fixtures__cli__output_formatter_diagnostic_--format=github --report-unused-disable-directives disable-directive.js@oxlint.snap | non-applicable | reporter-or-unused-disable-output-not-exposed |
| apps/oxlint/src/snapshots/fixtures__cli__output_formatter_diagnostic_--format=github ok.js@oxlint.snap | non-applicable | reporter-or-unused-disable-output-not-exposed |
| apps/oxlint/src/snapshots/fixtures__cli__output_formatter_diagnostic_--format=github parser-error.js@oxlint.snap | non-applicable | reporter-or-unused-disable-output-not-exposed |
| apps/oxlint/src/snapshots/fixtures__cli__output_formatter_diagnostic_--format=github test.js@oxlint.snap | non-applicable | reporter-or-unused-disable-output-not-exposed |
| apps/oxlint/src/snapshots/fixtures__cli__output_formatter_diagnostic_--format=gitlab --report-unused-disable-directives disable-directive.js@oxlint.snap | non-applicable | reporter-or-unused-disable-output-not-exposed |
| apps/oxlint/src/snapshots/fixtures__cli__output_formatter_diagnostic_--format=gitlab ok.js@oxlint.snap | non-applicable | reporter-or-unused-disable-output-not-exposed |
| apps/oxlint/src/snapshots/fixtures__cli__output_formatter_diagnostic_--format=gitlab parser-error.js@oxlint.snap | non-applicable | reporter-or-unused-disable-output-not-exposed |
| apps/oxlint/src/snapshots/fixtures__cli__output_formatter_diagnostic_--format=gitlab test.js@oxlint.snap | non-applicable | reporter-or-unused-disable-output-not-exposed |
| apps/oxlint/src/snapshots/fixtures__cli__output_formatter_diagnostic_--format=json --report-unused-disable-directives disable-directive.js@oxlint.snap | non-applicable | reporter-or-unused-disable-output-not-exposed |
| apps/oxlint/src/snapshots/fixtures__cli__output_formatter_diagnostic_--format=json ok.js@oxlint.snap | enabled | adapter:native-json-diagnostics |
| apps/oxlint/src/snapshots/fixtures__cli__output_formatter_diagnostic_--format=json parser-error.js@oxlint.snap | enabled | adapter:native-json-diagnostics |
| apps/oxlint/src/snapshots/fixtures__cli__output_formatter_diagnostic_--format=json test.js@oxlint.snap | enabled | adapter:native-json-diagnostics |
| apps/oxlint/src/snapshots/fixtures__cli__output_formatter_diagnostic_--format=junit --report-unused-disable-directives disable-directive.js@oxlint.snap | non-applicable | reporter-or-unused-disable-output-not-exposed |
| apps/oxlint/src/snapshots/fixtures__cli__output_formatter_diagnostic_--format=junit ok.js@oxlint.snap | non-applicable | reporter-or-unused-disable-output-not-exposed |
| apps/oxlint/src/snapshots/fixtures__cli__output_formatter_diagnostic_--format=junit parser-error.js@oxlint.snap | non-applicable | reporter-or-unused-disable-output-not-exposed |
| apps/oxlint/src/snapshots/fixtures__cli__output_formatter_diagnostic_--format=junit test.js@oxlint.snap | non-applicable | reporter-or-unused-disable-output-not-exposed |
| apps/oxlint/src/snapshots/fixtures__cli__output_formatter_diagnostic_--format=sarif --report-unused-disable-directives disable-directive.js@oxlint.snap | non-applicable | reporter-or-unused-disable-output-not-exposed |
| apps/oxlint/src/snapshots/fixtures__cli__output_formatter_diagnostic_--format=sarif ok.js@oxlint.snap | non-applicable | reporter-or-unused-disable-output-not-exposed |
| apps/oxlint/src/snapshots/fixtures__cli__output_formatter_diagnostic_--format=sarif parser-error.js@oxlint.snap | non-applicable | reporter-or-unused-disable-output-not-exposed |
| apps/oxlint/src/snapshots/fixtures__cli__output_formatter_diagnostic_--format=sarif test.js@oxlint.snap | non-applicable | reporter-or-unused-disable-output-not-exposed |
| apps/oxlint/src/snapshots/fixtures__cli__output_formatter_diagnostic_--format=stylish --report-unused-disable-directives disable-directive.js@oxlint.snap | non-applicable | reporter-or-unused-disable-output-not-exposed |
| apps/oxlint/src/snapshots/fixtures__cli__output_formatter_diagnostic_--format=stylish ok.js@oxlint.snap | non-applicable | reporter-or-unused-disable-output-not-exposed |
| apps/oxlint/src/snapshots/fixtures__cli__output_formatter_diagnostic_--format=stylish parser-error.js@oxlint.snap | non-applicable | reporter-or-unused-disable-output-not-exposed |
| apps/oxlint/src/snapshots/fixtures__cli__output_formatter_diagnostic_--format=stylish test.js@oxlint.snap | non-applicable | reporter-or-unused-disable-output-not-exposed |
| apps/oxlint/src/snapshots/fixtures__cli__output_formatter_diagnostic_--format=unix --report-unused-disable-directives disable-directive.js@oxlint.snap | non-applicable | reporter-or-unused-disable-output-not-exposed |
| apps/oxlint/src/snapshots/fixtures__cli__output_formatter_diagnostic_--format=unix ok.js@oxlint.snap | non-applicable | reporter-or-unused-disable-output-not-exposed |
| apps/oxlint/src/snapshots/fixtures__cli__output_formatter_diagnostic_--format=unix parser-error.js@oxlint.snap | non-applicable | reporter-or-unused-disable-output-not-exposed |
| apps/oxlint/src/snapshots/fixtures__cli__output_formatter_diagnostic_--format=unix test.js@oxlint.snap | non-applicable | reporter-or-unused-disable-output-not-exposed |
| apps/oxlint/src/snapshots/fixtures__cli__overrides_-c .oxlintrc.json other.jsx@oxlint.snap | non-applicable | cli-reporter-or-command-not-exposed |
| apps/oxlint/src/snapshots/fixtures__cli__overrides_-c .oxlintrc.json test.js@oxlint.snap | non-applicable | cli-reporter-or-command-not-exposed |
| apps/oxlint/src/snapshots/fixtures__cli__overrides_-c .oxlintrc.json test.ts@oxlint.snap | non-applicable | cli-reporter-or-command-not-exposed |
| apps/oxlint/src/snapshots/fixtures__cli__overrides_env_globals_-c .oxlintrc.json .@oxlint.snap | non-applicable | cli-reporter-or-command-not-exposed |
| apps/oxlint/src/snapshots/fixtures__cli__overrides_with_plugin_-c .oxlintrc.json@oxlint.snap | non-applicable | cli-reporter-or-command-not-exposed |
| apps/oxlint/src/snapshots/fixtures__cli__report_unused_directives_-c .oxlintrc-with-rudd.json --report-unused-disable-directives-severity=off@oxlint.snap | non-applicable | cli-reporter-or-command-not-exposed |
| apps/oxlint/src/snapshots/fixtures__cli__report_unused_directives_-c .oxlintrc-with-rudd.json@oxlint.snap | non-applicable | cli-reporter-or-command-not-exposed |
| apps/oxlint/src/snapshots/fixtures__cli__report_unused_directives_-c .oxlintrc.json --report-unused-disable-directives@oxlint.snap | non-applicable | cli-reporter-or-command-not-exposed |
| apps/oxlint/src/snapshots/fixtures__cli__report_unused_directives_oxlint_only_-c .oxlintrc.json --report-unused-disable-directives@oxlint.snap | non-applicable | cli-reporter-or-command-not-exposed |
| apps/oxlint/src/snapshots/fixtures__cli__root_config_ancestor__cwd_@oxlint.snap | non-applicable | cli-reporter-or-command-not-exposed |
| apps/oxlint/src/snapshots/fixtures__cli__tsconfig_--tsconfig non-exists.json@oxlint.snap | non-applicable | cli-reporter-or-command-not-exposed |
| apps/oxlint/src/snapshots/fixtures__cli__tsgolint_--type-aware --silent@oxlint.snap | non-applicable | type-aware-tsgolint |
| apps/oxlint/src/snapshots/fixtures__cli__tsgolint_--type-aware -c config-test.json@oxlint.snap | non-applicable | type-aware-tsgolint |
| apps/oxlint/src/snapshots/fixtures__cli__tsgolint_--type-aware -c config-type-aware-false.json no-floating-promises.ts@oxlint.snap | non-applicable | type-aware-tsgolint |
| apps/oxlint/src/snapshots/fixtures__cli__tsgolint_--type-aware test.svelte@oxlint.snap | non-applicable | type-aware-tsgolint |
| apps/oxlint/src/snapshots/fixtures__cli__tsgolint_--type-aware@oxlint.snap | non-applicable | type-aware-tsgolint |
| apps/oxlint/src/snapshots/fixtures__cli__tsgolint_-c config-type-aware-false-with-overrides.json no-floating-promises.ts@oxlint.snap | non-applicable | type-aware-tsgolint |
| apps/oxlint/src/snapshots/fixtures__cli__tsgolint_-c config-type-aware-false.json no-floating-promises.ts@oxlint.snap | non-applicable | type-aware-tsgolint |
| apps/oxlint/src/snapshots/fixtures__cli__tsgolint_-c config-type-aware-with-overrides.json no-floating-promises.ts@oxlint.snap | non-applicable | type-aware-tsgolint |
| apps/oxlint/src/snapshots/fixtures__cli__tsgolint_-c config-type-aware.json@oxlint.snap | non-applicable | type-aware-tsgolint |
| apps/oxlint/src/snapshots/fixtures__cli__tsgolint_config_error_--type-aware@oxlint.snap | non-applicable | type-aware-tsgolint |
| apps/oxlint/src/snapshots/fixtures__cli__tsgolint_disable_directives_--type-aware --report-unused-disable-directives unused.ts@oxlint.snap | non-applicable | type-aware-tsgolint |
| apps/oxlint/src/snapshots/fixtures__cli__tsgolint_disable_directives_--type-aware@oxlint.snap | non-applicable | type-aware-tsgolint |
| apps/oxlint/src/snapshots/fixtures__cli__tsgolint_rule_options_--type-aware@oxlint.snap | non-applicable | type-aware-tsgolint |
| apps/oxlint/src/snapshots/fixtures__cli__tsgolint_tsconfig_extends_config_err_--type-aware -D no-floating-promises@oxlint.snap | non-applicable | type-aware-tsgolint |
| apps/oxlint/src/snapshots/fixtures__cli__tsgolint_type_check_only_svelte_syntax_error_--type-check-only@oxlint.snap | non-applicable | type-aware-tsgolint |
| apps/oxlint/src/snapshots/fixtures__cli__tsgolint_type_check_only_syntax_error_--type-check-only@oxlint.snap | non-applicable | type-aware-tsgolint |
| apps/oxlint/src/snapshots/fixtures__cli__tsgolint_type_error_--type-aware --type-check@oxlint.snap | non-applicable | type-aware-tsgolint |
| apps/oxlint/src/snapshots/fixtures__cli__tsgolint_type_error_--type-check -c config-type-check-false.json@oxlint.snap | non-applicable | type-aware-tsgolint |
| apps/oxlint/src/snapshots/fixtures__cli__tsgolint_type_error_--type-check-only --fix@oxlint.snap | non-applicable | type-aware-tsgolint |
| apps/oxlint/src/snapshots/fixtures__cli__tsgolint_type_error_--type-check-only@oxlint.snap | non-applicable | type-aware-tsgolint |
| apps/oxlint/src/snapshots/fixtures__cli__tsgolint_type_error_--type-check@oxlint.snap | non-applicable | type-aware-tsgolint |
| apps/oxlint/src/snapshots/fixtures__cli__tsgolint_type_error_-c config-type-check-false.json@oxlint.snap | non-applicable | type-aware-tsgolint |
| apps/oxlint/src/snapshots/fixtures__cli__tsgolint_type_error_-c config-type-check-zero-rules.json@oxlint.snap | non-applicable | type-aware-tsgolint |
| apps/oxlint/src/snapshots/fixtures__cli__tsgolint_type_error_-c config-type-check.json@oxlint.snap | non-applicable | type-aware-tsgolint |
| apps/oxlint/src/snapshots/fixtures__cli__two_rules_with_same_rule_name_-c .oxlintrc.json test.js@oxlint.snap | non-applicable | cli-reporter-or-command-not-exposed |
| apps/oxlint/src/snapshots/fixtures__cli__valid_complex_config_@oxlint.snap | non-applicable | cli-reporter-or-command-not-exposed |
| apps/oxlint/src/snapshots/fixtures__cli__valid_config_rules_with_dummy_config_@oxlint.snap | non-applicable | cli-reporter-or-command-not-exposed |
| apps/oxlint/src/snapshots/fixtures__cli_issue_10054@oxlint.snap | non-applicable | cli-reporter-or-command-not-exposed |
| apps/oxlint/src/snapshots/fixtures__issue_19891_demo.ts@oxlint.snap | non-applicable | cli-reporter-or-command-not-exposed |
| apps/oxlint/src/snapshots/fixtures__lsp__ts_path_alias_--import-plugin -D import__no-cycle deep__src__dep-a.ts@oxlint.snap | non-applicable | module-graph-not-exposed |
| apps/oxlint/src/snapshots/fixtures__suppression__decreased_violations_are_reported_@oxlint.snap | non-applicable | cli-reporter-or-command-not-exposed |
| apps/oxlint/src/snapshots/fixtures__suppression__diagnostics_filtered_if_count_is_the_same_--type-aware --type-check@oxlint.snap | non-applicable | cli-reporter-or-command-not-exposed |
| apps/oxlint/src/snapshots/fixtures__suppression__eslint_file_format_@oxlint.snap | non-applicable | cli-reporter-or-command-not-exposed |
| apps/oxlint/src/snapshots/fixtures__suppression__file_malformed_@oxlint.snap | non-applicable | cli-reporter-or-command-not-exposed |
| apps/oxlint/src/snapshots/fixtures__suppression__file_not_detected_report_all_errors_--type-aware --type-check@oxlint.snap | non-applicable | cli-reporter-or-command-not-exposed |
| apps/oxlint/src/snapshots/fixtures__suppression__fixed_violations_are_reported_--type-aware --type-check@oxlint.snap | non-applicable | cli-reporter-or-command-not-exposed |
| apps/oxlint/src/snapshots/fixtures__suppression__only_file_diffs_are_reported_@oxlint.snap | non-applicable | cli-reporter-or-command-not-exposed |
| apps/oxlint/src/snapshots/fixtures__suppression__reports_new_errors_and_filter_existing_--type-aware --type-check@oxlint.snap | non-applicable | cli-reporter-or-command-not-exposed |
| apps/oxlint/src/snapshots/oxlint__lint__test__init_config.snap | non-applicable | cli-reporter-or-command-not-exposed |
## Production ABI adapter ledger

| Adapter | Status |
| --- | --- |
| auto-config-json | passed |
| auto-config-jsonc | passed |
| explicit-config | passed |
| ignore-current-directory | passed |
| ignore-directory | passed |
| ignore-empty-nested-root | passed |
| ignore-extension | passed |
| ignore-mixed-root | passed |
| ignore-non-glob | passed |
| ignore-relative | passed |
| ignore-whitelist | passed |
| malformed-config | passed |
| native-json-diagnostics | passed |
