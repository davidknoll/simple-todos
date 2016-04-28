/* eslint-env mocha */

import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { assert } from 'meteor/practicalmeteor:chai';

import { Tasks } from './tasks.js';

if (Meteor.isServer) {
  describe('Tasks', () => {
    describe('methods', () => {
      const userId = Random.id();
      let taskId;

      beforeEach(() => {
        Tasks.remove({});
        taskId = Tasks.insert({
          text: 'test task',
          createdAt: new Date(),
          owner: userId,
          username: 'tmeasday',
        });
      });

      it('can delete owned public task', () => {
        // Find the internal implementation of the task method so we can
        // test it in isolation
        const deleteTask = Meteor.server.method_handlers['tasks.remove'];

        // Set up a fake method invocation that looks like what the method expects
        const invocation = {
          userId
        };

        // Run the method with `this` set to the fake invocation
        deleteTask.apply(invocation, [taskId]);

        // Verify that the method does what we expected
        assert.equal(Tasks.find().count(), 0);
      });

      it('can delete owned private task', () => {
        // Make the test task private
        const privTask = Meteor.server.method_handlers['tasks.setPrivate'];
        privTask.apply({userId}, [taskId, true]);

        // Find the internal implementation of the task method so we can
        // test it in isolation
        const deleteTask = Meteor.server.method_handlers['tasks.remove'];

        // Set up a fake method invocation that looks like what the method expects
        const invocation = {
          userId
        };

        // Run the method with `this` set to the fake invocation
        deleteTask.apply(invocation, [taskId]);

        // Verify that the method does what we expected
        assert.equal(Tasks.find().count(), 0);
      });

      it('cannot delete unowned private task', () => {
        // Make the test task private
        const privTask = Meteor.server.method_handlers['tasks.setPrivate'];
        privTask.apply({userId}, [taskId, true]);

        // Find the internal implementation of the task method so we can
        // test it in isolation
        const deleteTask = Meteor.server.method_handlers['tasks.remove'];

        // Set up a fake method invocation that looks like what the method expects
        const newUserId = Random.id(); // Become another user
        const invocation = {
          newUserId
        };

        // Run the method with `this` set to the fake invocation
        assert.throws(
          () => deleteTask.apply(invocation, [taskId]),
          Meteor.Error, 'not-authorized'
        );
      });
    });
  });
}
