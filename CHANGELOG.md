# Changelog

## 0.2.0

- Add support for grunt tasks
- Add `log.write` and `log.writeln` for standard logging
- Change `filter` to `setup`
- Add `teardown`
- Add `process.nextTick` in strategic places to kill long stack traces
- Minor bug fixes and improvements
- Add a task builder to create tasks programatically
- Split built-in tasks into their own repository
- Add `context.string` with the lib/string functions

## 0.1.4 - 2013-02-06

- Add `fatal`
- Add `mute`
- Add `ctx.prompt`
- Add dot operator to placeholders
- Add negate operator to placeholders
- More windows fixes
- Add missing tests for `mv` task

## 0.1.3 - 2013-01-28

- Lock `glob` version temporarly due to a bug

## 0.1.2 - 2013-01-20

- More windows fixes, all tests now pass

## 0.1.1 - 2013-01-19

- Allow null values in task descriptions to allow a task to be hidden from the output
- Fix issues in the mv and cp tasks on windows