import test from 'bron';
import assert from 'assert/strict';
import { factory, runTasks } from 'release-it/test/util/index.js';
import Plugin from './index.js';

const namespace = 'my-plugin';

test.skip('should not throw', async () => {
  const options = { [namespace]: {} };
  const plugin = factory(Plugin, { namespace, options });
  await assert.doesNotReject(runTasks(plugin));
});
