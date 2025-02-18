/* Any copyright is dedicated to the Public Domain.
 * http://creativecommons.org/publicdomain/zero/1.0/ */

"use strict";

const { OS } = ChromeUtils.import("resource://gre/modules/osfile.jsm");

const { RemoteAgentError } = ChromeUtils.import(
  "chrome://remote/content/Error.jsm"
);
const { RemoteAgent } = ChromeUtils.import(
  "chrome://remote/content/RemoteAgent.jsm"
);

/*
add_task() is overriden to setup and teardown a test environment
making it easier to  write browser-chrome tests for the remote
debugger.

Before the task is run, the nsIRemoteAgent listener is started and
a CDP client is connected to it.  A new tab is also added.  These
three things are exposed to the provided task like this:

	add_task(async function testName(client, CDP, tab) {
	  // client is an instance of the CDP class
	  // CDP is ./chrome-remote-interface.js
	  // tab is a fresh tab, destroyed after the test
	});

add_plain_task() may be used to write test tasks without the implicit
setup and teardown described above.
*/

const add_plain_task = add_task.bind(this);

this.add_task = function(taskFn, opts = {}) {
  const { createTab = true } = opts;

  const fn = async function() {
    let client;
    await RemoteAgent.listen(Services.io.newURI("http://localhost:9222"));
    info("CDP server started");

    try {
      const CDP = await getCDP();

      // By default run each test in its own tab
      if (createTab) {
        const tab = await BrowserTestUtils.openNewForegroundTab(gBrowser);
        const browsingContextId = tab.linkedBrowser.browsingContext.id;

        client = await CDP({
          target(list) {
            return list.find(target => target.id === browsingContextId);
          },
        });
        info("CDP client instantiated");

        await taskFn(client, CDP, tab);

        // taskFn may resolve within a tick after opening a new tab.
        // We shouldn't remove the newly opened tab in the same tick.
        // Wait for the next tick here.
        await TestUtils.waitForTick();
        BrowserTestUtils.removeTab(tab);
      } else {
        client = await CDP({});
        info("CDP client instantiated");

        await taskFn(client, CDP);
      }
    } catch (e) {
      // Display better error message with the server side stacktrace
      // if an error happened on the server side:
      if (e.response) {
        throw RemoteAgentError.fromJSON(e.response);
      } else {
        throw e;
      }
    } finally {
      if (client) {
        await client.close();
        info("CDP client closed");
      }

      await RemoteAgent.close();
      info("CDP server stopped");

      // Close any additional tabs, so that only a single tab remains open
      while (gBrowser.tabs.length > 1) {
        gBrowser.removeCurrentTab();
      }
    }
  };

  Object.defineProperty(fn, "name", { value: taskFn.name, writable: false });
  add_plain_task(fn);
};

/**
 * Create a test document in an invisible window.
 * This window will be automatically closed on test teardown.
 */
function createTestDocument() {
  const browser = Services.appShell.createWindowlessBrowser(true);
  registerCleanupFunction(() => browser.close());

  // Create a system principal content viewer to ensure there is a valid
  // empty document using system principal and avoid any wrapper issues
  // when using document's JS Objects.
  const webNavigation = browser.docShell.QueryInterface(Ci.nsIWebNavigation);
  const system = Services.scriptSecurityManager.getSystemPrincipal();
  webNavigation.createAboutBlankContentViewer(system, system);

  return webNavigation.document;
}

/**
 * Retrieve an intance of CDP object from chrome-remote-interface library
 */
async function getCDP() {
  // Instantiate a background test document in order to load the library
  // as in a web page
  const document = createTestDocument();

  const window = document.defaultView.wrappedJSObject;
  Services.scriptloader.loadSubScript(
    "chrome://mochitests/content/browser/remote/test/browser/chrome-remote-interface.js",
    window
  );

  // Implements `criRequest` to be called by chrome-remote-interface
  // library in order to do the cross-domain http request, which,
  // in a regular Web page, is impossible.
  window.criRequest = (options, callback) => {
    const { host, port, path } = options;
    const url = `http://${host}:${port}${path}`;
    const xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);

    // Prevent "XML Parsing Error: syntax error" error messages
    xhr.overrideMimeType("text/plain");

    xhr.send(null);
    xhr.onload = () => callback(null, xhr.responseText);
    xhr.onerror = e => callback(e, null);
  };

  return window.CDP;
}

function getTargets(CDP) {
  return new Promise((resolve, reject) => {
    CDP.List(null, (err, targets) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(targets);
    });
  });
}

/** Creates a data URL for the given source document. */
function toDataURL(src, doctype = "html") {
  let doc, mime;
  switch (doctype) {
    case "html":
      mime = "text/html;charset=utf-8";
      doc = `<!doctype html>\n<meta charset=utf-8>\n${src}`;
      break;
    default:
      throw new Error("Unexpected doctype: " + doctype);
  }

  return `data:${mime},${encodeURIComponent(doc)}`;
}

/**
 * Load a given URL in the currently selected tab
 */
async function loadURL(url) {
  const browser = gBrowser.selectedTab.linkedBrowser;
  const loaded = BrowserTestUtils.browserLoaded(browser, false, url);

  BrowserTestUtils.loadURI(browser, url);
  await loaded;
}

/**
 * Retrieve the value of a property on the content window.
 */
function getContentProperty(prop) {
  info(`Retrieve ${prop} on the content window`);
  return SpecialPowers.spawn(
    gBrowser.selectedBrowser,
    [prop],
    _prop => content[_prop]
  );
}

/**
 * Return a new promise, which resolves after ms have been elapsed
 */
function timeoutPromise(ms) {
  return new Promise(resolve => {
    window.setTimeout(resolve, ms);
  });
}

/** Fail a test. */
function fail(message) {
  ok(false, message);
}

/**
 * Create a file with the specified contents.
 *
 * @param {string} contents
 *     Contents of the file.
 * @param {Object} options
 * @param {string=} options.path
 *     Path of the file. Defaults to the temporary directory.
 * @param {boolean=} options.remove
 *     If true, automatically remove the file after the test. Defaults to true.
 *
 * @return {Promise}
 * @resolves {string}
 *     Returns the final path of the created file.
 */
async function createFile(contents, options = {}) {
  let { path = null, remove = true } = options;

  if (!path) {
    const basePath = OS.Path.join(OS.Constants.Path.tmpDir, "remote-agent.txt");
    const { file, path: tmpPath } = await OS.File.openUnique(basePath, {
      humanReadable: true,
    });
    await file.close();
    path = tmpPath;
  }

  let encoder = new TextEncoder();
  let array = encoder.encode(contents);

  const count = await OS.File.writeAtomic(path, array, {
    encoding: "utf-8",
    tmpPath: path + ".tmp",
  });
  is(count, contents.length, "All data has been written to file");

  const file = await OS.File.open(path);

  // Automatically remove the file once the test has finished
  if (remove) {
    registerCleanupFunction(async () => {
      await file.close();
      await OS.File.remove(path, { ignoreAbsent: true });
    });
  }

  return { file, path };
}

class RecordEvents {
  /**
   * A timeline of events chosen by calls to `addRecorder`.
   * Call `configure`` for each client event you want to record.
   * Then `await record(someTimeout)` to record a timeline that you
   * can make assertions about.
   *
   * const history = new RecordEvents(expectedNumberOfEvents);
   *
   * history.addRecorder({
   *  event: Runtime.executionContextDestroyed,
   *  eventName: "Runtime.executionContextDestroyed",
   *  messageFn: payload => {
   *    return `Received Runtime.executionContextDestroyed for id ${payload.executionContextId}`;
   *  },
   * });
   *
   *
   * @param {number} total
   *     Number of expected events. Stop recording when this number is exceeded.
   *
   */
  constructor(total) {
    this.events = [];
    this.promises = new Set();
    this.subscriptions = new Set();
    this.total = total;
  }

  /**
   * Configure an event to be recorded and logged.
   * The recording stops once we accumulate more than the expected
   * total of all configured events.
   *
   * @param {Object} options
   * @param {CDPEvent} options.event
   *     https://github.com/cyrus-and/chrome-remote-interface#clientdomaineventcallback
   * @param {string} options.eventName
   *     Name to use for reporting.
   * @param {function(payload):string=} options.messageFn
   */
  addRecorder(options = {}) {
    const {
      event,
      eventName,
      messageFn = () => `Received ${eventName}`,
    } = options;
    const promise = new Promise(resolve => {
      const unsubscribe = event(payload => {
        info(messageFn(payload));
        this.events.push({ eventName, payload });
        if (this.events.length > this.total) {
          this.subscriptions.delete(unsubscribe);
          unsubscribe();
          resolve(this.events);
        }
      });
      this.subscriptions.add(unsubscribe);
    });
    this.promises.add(promise);
  }

  /**
   * Record events until we hit the timeout or the expected total is exceeded.
   *
   * @param {number=} timeout
   *     milliseconds
   *
   * @return {Array<{ eventName, payload }>} Recorded events
   */
  async record(timeout = 1000) {
    await Promise.race([Promise.all(this.promises), timeoutPromise(timeout)]);
    for (const unsubscribe of this.subscriptions) {
      unsubscribe();
    }
    return this.events;
  }

  /**
   * Find first occurrence of the given event.
   *
   * @param {string} eventName
   *
   * @return {object} The event payload, if any.
   */
  findEvent(eventName) {
    const event = this.events.find(el => el.eventName == eventName);
    if (event) {
      return event.payload;
    }
    return {};
  }
}
