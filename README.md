Automaton
=========

Javascript task automation tool

## Feature roadmap

- Each task should be able to receive a set of options, and override its subtasks pre-configured values. Example: User A published a `build` task, that internally uses some other community tasks. Each of these tasks requires values that will be provided upon running `build`. The `build` task should be able to receive these values, and override the subtasks values with the new ones.

- Just like the above, a subtask should be able to disable one of the remaining tasks, making the automaton skip it.