import { ExecTask, TaskOfTasks } from "../dist/index.mjs";

export default new TaskOfTasks('test', [
    new ExecTask('A', 'ping 127.0.0.1 -n 6 > nul'),
    new ExecTask('B', 'ping 127.0.0.1 -n 8 > nul'),
    new ExecTask('C', 'ping 127.0.0.1 -n 4 > nul'),
    new ExecTask('D', 'ping 127.0.0.1 -n 3 > nul'),
    new TaskOfTasks('E', [
        new ExecTask('1', 'pinag 127.0.0.1 -n 6 > nul'),
        new ExecTask('2', 'ping 127.0.0.1 -n 8 > nul'),
        new ExecTask('3', 'ping 127.0.0.1 -n 4 > nul'),
        new ExecTask('4', 'ping 127.0.0.1 -n 3 > nul'),
    ], true),
], true);
