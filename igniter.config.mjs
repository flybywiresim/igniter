import { DummyTask, TaskOfTasks } from './dist/library'

export default new TaskOfTasks('a32nx', [
    new TaskOfTasks('instruments', [
        new DummyTask('efb', 5),
        new DummyTask('fcu', 3),
        new DummyTask('mcdu', 7),
        new DummyTask('rmp', 2),
    ], true),

    new TaskOfTasks('behaviors', [
        new DummyTask('efb', 5),
        new DummyTask('fcu', 3),
        new DummyTask('mcdu', 7),
        new DummyTask('rmp', 2),
    ], true),

    new TaskOfTasks('final', [
        new DummyTask('manifests', 2),
        new DummyTask('metadata', 1),
    ]),
]);
